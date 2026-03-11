import axios from 'axios';
import jwt from 'jsonwebtoken';
import {
  evaluateUniversityMicrosoftAllowlist,
  getUniversityVerificationRule,
  isUniversityDomainAllowed
} from '../config/universityVerificationRules.js';
import { getUniversityCatalogByRegion, getUniversityCatalogItem, isUniversityGameAllowed } from '../config/universityCatalog.js';
import User from '../models/User.js';
import UniversityApplication from '../models/UniversityApplication.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import { calculateUniversityStandings, getUniversityPointsConfig } from '../services/universityStandings.js';

const STATUS_UNLINKED = {
  universityId: '',
  universityTag: '',
  universityName: '',
  region: '',
  city: '',
  campus: '',
  studentId: '',
  program: '',
  academicLevel: '',
  institutionalEmail: '',
  verificationSource: 'none',
  verificationStatus: 'unlinked',
  verified: false,
  tenantId: '',
  appliedAt: null,
  verifiedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  rejectReason: ''
};

const normalizeText = (value, max = 120) => String(value || '').trim().slice(0, max);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const STUDENT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9._/-]{3,31}$/;
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com'
]);
const ALLOWED_ACADEMIC_LEVELS = new Set(['1', '2', '3', '4', 'egresado', 'maestria']);

const getEmailDomain = (value) => {
  const email = String(value || '').trim().toLowerCase();
  const atIndex = email.lastIndexOf('@');
  return atIndex === -1 ? '' : email.slice(atIndex + 1);
};

const getMicrosoftAuthority = () => normalizeText(process.env.MICROSOFT_TENANT_AUTHORITY || 'organizations', 60) || 'organizations';
const getMicrosoftClientId = () => normalizeText(process.env.MICROSOFT_CLIENT_ID, 180);
const getMicrosoftClientSecret = () => normalizeText(process.env.MICROSOFT_CLIENT_SECRET, 240);
const getMicrosoftRedirectUri = () => normalizeText(process.env.MICROSOFT_REDIRECT_URI, 260);
const getFrontendUrl = () => normalizeText(process.env.FRONTEND_URL || 'http://localhost:5173', 260).replace(/\/+$/, '');
const shouldAutoApproveUniversityEmailMatch = () => String(process.env.UNIVERSITY_AUTO_APPROVE_EMAIL_MATCH || 'true').trim().toLowerCase() !== 'false';
const formatAllowedDomainsMessage = (domains = []) => domains.join(', ');
const getMicrosoftProviderErrorMessage = (error, fallback = 'No se pudo completar la verificación universitaria con Microsoft.') => {
  const responseData = error?.response?.data;
  const rawMessage =
    responseData?.error_description ||
    responseData?.error?.message ||
    responseData?.message ||
    error?.message ||
    fallback;

  const sanitized = String(rawMessage || fallback)
    .replace(/\+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeText(sanitized, 220) || fallback;
};

const normalizeMicrosoftIdentity = (value = {}) => ({
  tenantId: normalizeText(value.tenantId, 80),
  userId: normalizeText(value.userId, 120),
  email: normalizeText(value.email, 160).toLowerCase(),
  displayName: normalizeText(value.displayName, 160)
});

const buildMicrosoftTokenEndpoint = () =>
  `https://login.microsoftonline.com/${getMicrosoftAuthority()}/oauth2/v2.0/token`;

const buildMicrosoftAuthorizeUrl = (state) => {
  const params = new URLSearchParams({
    client_id: getMicrosoftClientId(),
    response_type: 'code',
    redirect_uri: getMicrosoftRedirectUri(),
    response_mode: 'query',
    scope: 'openid profile email User.Read',
    prompt: 'select_account',
    state
  });

  return `https://login.microsoftonline.com/${getMicrosoftAuthority()}/oauth2/v2.0/authorize?${params.toString()}`;
};

const decodeJwtPayload = (token = '') => {
  try {
    const payload = String(token).split('.')[1];
    if (!payload) return {};
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_) {
    return {};
  }
};

const getFrontendUniversityRedirect = (status, message = '') => {
  const params = new URLSearchParams();
  params.set('universityMs', status);
  if (message) params.set('message', message);
  return `${getFrontendUrl()}/university?${params.toString()}`;
};

const ensureMicrosoftOAuthConfigured = () =>
  Boolean(getMicrosoftClientId() && getMicrosoftClientSecret() && getMicrosoftRedirectUri());

const buildMicrosoftConnectionPayload = (user = null) => ({
  verified: Boolean(user?.connections?.microsoft?.verified),
  tenantId: user?.connections?.microsoft?.tenantId || '',
  userId: user?.connections?.microsoft?.userId || '',
  email: user?.connections?.microsoft?.email || '',
  displayName: user?.connections?.microsoft?.displayName || ''
});

const attachMicrosoftToApplication = (application, microsoftIdentity) => {
  application.verificationSource = 'microsoft';
  application.microsoft = normalizeMicrosoftIdentity(microsoftIdentity);
};

const syncPendingUniversitySnapshot = (user, application, microsoftIdentity = {}) => {
  user.university = buildUniversitySnapshot({
    universityId: application.universityId,
    universityTag: application.universityTag,
    universityName: application.universityName,
    region: application.region,
    city: application.city,
    campus: application.campus,
    studentId: application.studentId,
    program: application.program,
    academicLevel: application.academicLevel,
    institutionalEmail: application.institutionalEmail,
    verificationSource: application.verificationSource,
    tenantId: normalizeText(microsoftIdentity.tenantId || application.microsoft?.tenantId, 80),
    status: 'pending',
    rejectReason: '',
    appliedAt: application.submittedAt
  });
};

const finalizeApplicationDecision = async ({
  application,
  user,
  decision,
  rejectReason = '',
  reviewedBy = null,
  req = null,
  notificationSource = 'University'
}) => {
  const now = new Date();
  const applicationStatus = decision === 'revoked' ? 'pending' : decision;
  const userVerificationStatus = decision === 'approved'
    ? 'verified'
    : decision === 'rejected'
      ? 'rejected'
      : 'pending';
  const notificationTitle = decision === 'approved'
    ? 'Verificación universitaria aprobada'
    : decision === 'rejected'
      ? 'Verificación universitaria rechazada'
      : 'Verificación universitaria retirada';
  const notificationMessage = decision === 'approved'
    ? `Tu cuenta fue verificada para ${application.universityName}.`
    : decision === 'rejected'
      ? `Tu postulación para ${application.universityName} fue rechazada. ${rejectReason}`
      : `La verificación de tu cuenta para ${application.universityName} fue retirada. ${rejectReason}`;
  const notificationColor = decision === 'approved'
    ? '#8EDB15'
    : decision === 'rejected'
      ? '#ff5d73'
      : '#f6c453';

  application.status = applicationStatus;
  application.rejectReason = decision === 'approved' ? '' : rejectReason;
  application.reviewedAt = now;
  application.reviewedBy = reviewedBy || null;
  await application.save();

  user.university = buildUniversitySnapshot({
    universityId: application.universityId,
    universityTag: application.universityTag,
    universityName: application.universityName,
    region: application.region,
    city: application.city,
    campus: application.campus,
    studentId: application.studentId,
    program: application.program,
    academicLevel: application.academicLevel,
    institutionalEmail: application.institutionalEmail,
    verificationSource: application.verificationSource,
    tenantId: application.microsoft?.tenantId || '',
    status: userVerificationStatus,
    rejectReason: application.rejectReason,
    reviewedBy,
    appliedAt: application.submittedAt,
    reviewedAt: now,
    verifiedAt: decision === 'approved' ? now : null
  });

  user.notifications.unshift({
    type: 'info',
    category: 'university',
    title: notificationTitle,
    source: notificationSource,
    message: notificationMessage,
    status: 'unread',
    meta: {
      universityId: application.universityId,
      universityName: application.universityName,
      decision
    },
    visuals: {
      icon: 'bx bxs-graduation',
      color: notificationColor,
      glow: true
    },
    createdAt: now
  });

  await user.save();

  if (reviewedBy) {
    await AdminAuditLog.create({
      actorUserId: reviewedBy,
      action: `university.application.${decision}`,
      entityType: 'UniversityApplication',
      entityId: String(application._id),
      meta: {
        userId: String(application.user),
        universityId: application.universityId,
        universityName: application.universityName
      },
      ip: req ? getActorIp(req) : '',
      userAgent: req ? getActorAgent(req) : ''
    });
  }

  return application;
};

const maybeAutoApproveUniversityApplication = async ({ application, user, microsoftIdentity = null }) => {
  const exactInstitutionalEmail = normalizeText(application?.institutionalEmail, 160).toLowerCase();
  const linkedInstitutionalEmail = normalizeText(microsoftIdentity?.email || user?.connections?.microsoft?.email, 160).toLowerCase();
  const allowlistCheck = evaluateUniversityMicrosoftAllowlist({
    universityId: application?.universityId,
    institutionalEmail: exactInstitutionalEmail,
    microsoftEmail: linkedInstitutionalEmail,
    microsoftTenantId: microsoftIdentity?.tenantId || user?.connections?.microsoft?.tenantId || ''
  });

  if (!shouldAutoApproveUniversityEmailMatch() || !exactInstitutionalEmail || !linkedInstitutionalEmail) {
    return { autoApproved: false, allowlistCheck };
  }

  if (exactInstitutionalEmail !== linkedInstitutionalEmail) {
    return { autoApproved: false, allowlistCheck };
  }

  if (!allowlistCheck.autoApproveEligible) {
    return { autoApproved: false, allowlistCheck };
  }

  if (microsoftIdentity) {
    attachMicrosoftToApplication(application, microsoftIdentity);
  }

  await finalizeApplicationDecision({
    application,
    user,
    decision: 'approved',
    reviewedBy: null,
    notificationSource: 'University Auto-Verify'
  });

  return { autoApproved: true, allowlistCheck };
};

const buildUniversitySnapshot = ({
  universityId,
  universityTag,
  universityName,
  region,
  city,
  campus,
  studentId,
  program,
  academicLevel,
  institutionalEmail,
  verificationSource,
  tenantId,
  status,
  rejectReason = '',
  reviewedBy = null,
  appliedAt = null,
  reviewedAt = null,
  verifiedAt = null
}) => ({
  universityId,
  universityTag,
  universityName,
  region,
  city,
  campus,
  studentId,
  program,
  academicLevel,
  institutionalEmail,
  verificationSource,
  verificationStatus: status,
  verified: status === 'verified',
  tenantId,
  appliedAt,
  verifiedAt,
  reviewedAt,
  reviewedBy,
  rejectReason
});

const ensureAdmin = async (userId) => {
  const actor = await User.findById(userId).select('isAdmin');
  return Boolean(actor?.isAdmin);
};

const getActorIp = (req) => String(req.headers['x-forwarded-for'] || req.ip || '').slice(0, 200);
const getActorAgent = (req) => String(req.headers['user-agent'] || '').slice(0, 500);
const isFilledRosterPlayer = (player = null) =>
  Boolean(player && (player.user || normalizeText(player.nickname, 120) || normalizeText(player.gameId, 120)));
const toVisibleTeamSize = (team = {}) => {
  if (Number.isFinite(Number(team?.maxMembers)) && Number(team.maxMembers) > 0) {
    return Number(team.maxMembers);
  }

  return Array.isArray(team?.roster?.starters)
    ? team.roster.starters.filter(isFilledRosterPlayer).length
    : 0;
};
const mapUniversityTeamCard = (team = {}) => ({
  id: String(team?._id || ''),
  teamCode: normalizeText(team?.teamCode, 20),
  name: normalizeText(team?.name, 120) || 'Equipo universitario',
  game: normalizeText(team?.game, 80) || 'Juego',
  members: toVisibleTeamSize(team),
  rank: normalizeText(team?.teamLevel || team?.category || 'Universitario', 60)
});
const buildStandingMap = (standings = []) =>
  new Map(standings.map((standing) => [String(standing?.universityId || '').trim().toLowerCase(), standing]));
const buildVerifiedStudentMap = (users = []) =>
  (Array.isArray(users) ? users : []).reduce((acc, user) => {
    const universityId = normalizeText(user?.university?.universityId, 60).toLowerCase();
    if (!universityId) return acc;
    acc.set(universityId, (acc.get(universityId) || 0) + 1);
    return acc;
  }, new Map());
const mergeUniversityCatalogStats = (item = {}, standingMap = new Map(), teams = [], verifiedStudentMap = new Map()) => {
  const standing = standingMap.get(String(item?.id || '').trim().toLowerCase()) || null;
  return {
    ...item,
    points: Number(standing?.points || 0),
    verifiedStudentsCount: Number(verifiedStudentMap.get(String(item?.id || '').trim().toLowerCase()) || 0),
    stats: {
      tournamentsPlayed: Number(standing?.tournamentsPlayed || 0),
      matchWins: Number(standing?.matchWins || 0),
      championships: Number(standing?.championships || 0),
      finals: Number(standing?.finals || 0),
      semifinals: Number(standing?.semifinals || 0)
    },
    teams,
    activeTeamsCount: teams.length
  };
};

export const listUniversityCatalog = async (req, res) => {
  try {
    const region = normalizeText(req.query?.region || 'rd', 30).toLowerCase();
    const catalog = getUniversityCatalogByRegion(region);

    if (catalog.length === 0) {
      return res.json([]);
    }

    const teams = await Team.find({
      'university.isUniversityTeam': true,
      'university.region': region
    })
      .select('teamCode name game teamLevel category maxMembers roster university createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const filteredTeams = teams.filter((team) => isUniversityGameAllowed(team?.game));

    const finishedUniversityTournaments = await Tournament.find({
      status: 'finished',
      'eligibility.universityOnly': true
    })
      .select('game registrations bracket status eligibility')
      .lean();
    const standingsMap = buildStandingMap(
      calculateUniversityStandings(finishedUniversityTournaments.filter((tournament) => isUniversityGameAllowed(tournament?.game)))
    );
    const verifiedStudents = await User.find({
      'university.region': region,
      'university.verificationStatus': 'verified'
    })
      .select('university.universityId')
      .lean();
    const verifiedStudentMap = buildVerifiedStudentMap(verifiedStudents);

    const teamsByUniversityId = filteredTeams.reduce((acc, team) => {
      const universityId = normalizeText(team?.university?.universityId, 60).toLowerCase();
      if (!universityId) return acc;
      if (!acc[universityId]) acc[universityId] = [];
      acc[universityId].push(mapUniversityTeamCard(team));
      return acc;
    }, {});

    return res.json(
      catalog.map((item) => mergeUniversityCatalogStats(item, standingsMap, teamsByUniversityId[item.id] || [], verifiedStudentMap))
    );
  } catch (error) {
    console.error('listUniversityCatalog error:', error);
    return res.status(500).json({ message: 'No se pudo cargar el catálogo universitario.' });
  }
};

export const getUniversityCatalogDetail = async (req, res) => {
  try {
    const universityId = normalizeText(req.params?.id, 60).toLowerCase();
    const item = getUniversityCatalogItem(universityId);

    if (!item) {
      return res.status(404).json({ message: 'Universidad no encontrada.' });
    }

    const teams = await Team.find({
      'university.isUniversityTeam': true,
      'university.universityId': universityId
    })
      .select('teamCode name game teamLevel category maxMembers roster university createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const filteredTeams = teams.filter((team) => isUniversityGameAllowed(team?.game));

    const finishedUniversityTournaments = await Tournament.find({
      status: 'finished',
      'eligibility.universityOnly': true,
      'registrations.teamMeta.university.universityId': universityId
    })
      .select('game registrations bracket status eligibility')
      .lean();
    const standingsMap = buildStandingMap(
      calculateUniversityStandings(finishedUniversityTournaments.filter((tournament) => isUniversityGameAllowed(tournament?.game)))
    );
    const verifiedStudents = await User.find({
      'university.universityId': universityId,
      'university.verificationStatus': 'verified'
    })
      .select('university.universityId')
      .lean();
    const verifiedStudentMap = buildVerifiedStudentMap(verifiedStudents);

    return res.json(mergeUniversityCatalogStats(item, standingsMap, filteredTeams.map(mapUniversityTeamCard), verifiedStudentMap));
  } catch (error) {
    console.error('getUniversityCatalogDetail error:', error);
    return res.status(500).json({ message: 'No se pudo cargar la universidad.' });
  }
};

export const getUniversityStandings = async (_req, res) => {
  try {
    const catalog = getUniversityCatalogByRegion('rd');
    const finishedUniversityTournaments = await Tournament.find({
      status: 'finished',
      'eligibility.universityOnly': true
    })
      .select('title game date tournamentId registrations bracket status eligibility')
      .lean();

    const standings = calculateUniversityStandings(
      finishedUniversityTournaments.filter((tournament) => isUniversityGameAllowed(tournament?.game))
    );
    const verifiedStudents = await User.find({
      'university.region': 'rd',
      'university.verificationStatus': 'verified'
    })
      .select('university.universityId')
      .lean();
    const verifiedStudentMap = buildVerifiedStudentMap(verifiedStudents);
    const standingMap = buildStandingMap(standings);
    const payload = catalog
      .map((item) => mergeUniversityCatalogStats(item, standingMap, [], verifiedStudentMap))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return String(a.tag || '').localeCompare(String(b.tag || ''));
      });

    return res.json({
      pointsConfig: getUniversityPointsConfig(),
      standings: payload
    });
  } catch (error) {
    console.error('getUniversityStandings error:', error);
    return res.status(500).json({ message: 'No se pudo cargar el ranking universitario.' });
  }
};

export const submitUniversityApplication = async (req, res) => {
  try {
    const universityId = normalizeText(req.body?.universityId, 60).toLowerCase();
    const universityTag = normalizeText(req.body?.universityTag, 30);
    const universityName = normalizeText(req.body?.universityName, 180);
    const region = normalizeText(req.body?.region, 30).toLowerCase();
    const city = normalizeText(req.body?.city, 80);
    const campus = normalizeText(req.body?.campus, 100);
    const studentId = normalizeText(req.body?.studentId, 60).toUpperCase();
    const program = normalizeText(req.body?.program, 120);
    const academicLevel = normalizeText(req.body?.academicLevel, 40);
    const institutionalEmail = normalizeText(req.body?.institutionalEmail, 160).toLowerCase();

    if (!universityId || !universityTag || !universityName || !region || !campus || !studentId || !program || !academicLevel) {
      return res.status(400).json({ message: 'Completa todos los campos universitarios requeridos.' });
    }

    if (!STUDENT_ID_REGEX.test(studentId)) {
      return res.status(400).json({ message: 'La matrícula o ID estudiantil debe tener entre 4 y 32 caracteres y solo usar letras, números, ".", "_" , "/" o "-".' });
    }

    if (!ALLOWED_ACADEMIC_LEVELS.has(academicLevel)) {
      return res.status(400).json({ message: 'El nivel académico seleccionado no es válido.' });
    }

    if (!isValidEmail(institutionalEmail)) {
      return res.status(400).json({ message: 'Ingresa un correo institucional válido.' });
    }

    if (PUBLIC_EMAIL_DOMAINS.has(getEmailDomain(institutionalEmail))) {
      return res.status(400).json({ message: 'Usa un correo institucional, no uno personal.' });
    }

    if (region !== 'rd') {
      return res.status(400).json({ message: 'Por ahora la verificación institucional solo está habilitada para universidades de República Dominicana.' });
    }

    const universityRule = getUniversityVerificationRule(universityId);
    if (universityRule.allowedDomains.length === 0) {
      return res.status(400).json({ message: 'La universidad seleccionada todavía no tiene dominios institucionales configurados para verificación.' });
    }

    const universityCatalogItem = getUniversityCatalogItem(universityId);
    if (!universityCatalogItem) {
      return res.status(400).json({ message: 'La universidad seleccionada no está disponible en el catálogo universitario.' });
    }

    const allowedPrograms = Array.isArray(universityCatalogItem.programs) ? universityCatalogItem.programs : [];
    if (allowedPrograms.length === 0) {
      return res.status(400).json({ message: 'La universidad seleccionada todavía no tiene carreras configuradas para postulación.' });
    }

    if (!allowedPrograms.includes(program)) {
      return res.status(400).json({ message: 'Debes seleccionar una carrera válida de la universidad elegida.' });
    }

    const allowedCampuses = Array.isArray(universityCatalogItem.campuses) ? universityCatalogItem.campuses : [];
    if (allowedCampuses.length === 0) {
      return res.status(400).json({ message: 'La universidad seleccionada todavía no tiene campuses configurados para postulación.' });
    }

    if (!allowedCampuses.includes(campus)) {
      return res.status(400).json({ message: 'Debes seleccionar una ciudad de campus válida para la universidad elegida.' });
    }

    if (!isUniversityDomainAllowed(universityId, institutionalEmail)) {
      return res.status(400).json({
        message: `Ese correo no coincide con los dominios institucionales oficiales de la universidad seleccionada (${formatAllowedDomainsMessage(universityRule.allowedDomains)}).`
      });
    }

    const user = await User.findById(req.userId).select('fullName email connections.microsoft university notifications');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const existingApplication = await UniversityApplication.findOne({ user: req.userId }).select('universityId universityName status');

    if (user.university?.verified) {
      return res.status(409).json({ message: 'Tu cuenta ya está verificada con una universidad. Contacta soporte si necesitas cambiarla.' });
    }

    if (
      existingApplication &&
      existingApplication.status !== 'rejected' &&
      normalizeText(existingApplication.universityId, 60).toLowerCase() !== universityId
    ) {
      return res.status(409).json({
        message: `Ya tienes una postulación asociada a ${existingApplication.universityName || existingApplication.universityId}. Por ahora solo puedes postularte a una universidad por cuenta.`
      });
    }

    const duplicateStudent = await UniversityApplication.findOne({
      studentId,
      user: { $ne: req.userId },
      status: { $in: ['pending', 'approved'] }
    }).select('_id universityName');

    if (duplicateStudent) {
      return res.status(409).json({
        message: `Esa matrícula ya está asociada a otra cuenta${duplicateStudent.universityName ? ` en ${duplicateStudent.universityName}` : ''}.`
      });
    }

    const duplicateInstitutionalEmail = await UniversityApplication.findOne({
      institutionalEmail,
      user: { $ne: req.userId },
      status: { $in: ['pending', 'approved'] }
    }).select('_id universityName');

    if (duplicateInstitutionalEmail) {
      return res.status(409).json({
        message: `Ese correo institucional ya está asociado a otra cuenta${duplicateInstitutionalEmail.universityName ? ` en ${duplicateInstitutionalEmail.universityName}` : ''}.`
      });
    }

    const duplicateStudentSnapshot = await User.findOne({
      _id: { $ne: req.userId },
      'university.studentId': studentId,
      'university.verificationStatus': { $in: ['pending', 'verified'] }
    }).select('_id university.universityName');

    if (duplicateStudentSnapshot) {
      return res.status(409).json({
        message: `Esa matrícula ya está asociada a otra cuenta${duplicateStudentSnapshot.university?.universityName ? ` en ${duplicateStudentSnapshot.university.universityName}` : ''}.`
      });
    }

    const duplicateInstitutionalEmailSnapshot = await User.findOne({
      _id: { $ne: req.userId },
      'university.institutionalEmail': institutionalEmail,
      'university.verificationStatus': { $in: ['pending', 'verified'] }
    }).select('_id university.universityName');

    if (duplicateInstitutionalEmailSnapshot) {
      return res.status(409).json({
        message: `Ese correo institucional ya está asociado a otra cuenta${duplicateInstitutionalEmailSnapshot.university?.universityName ? ` en ${duplicateInstitutionalEmailSnapshot.university.universityName}` : ''}.`
      });
    }

    const microsoftConnection = normalizeMicrosoftIdentity(user.connections?.microsoft || {});
    const verificationSource = microsoftConnection?.verified ? 'microsoft' : 'manual';
    const now = new Date();
    const microsoftAllowlistCheck = microsoftConnection?.verified
      ? evaluateUniversityMicrosoftAllowlist({
          universityId,
          institutionalEmail,
          microsoftEmail: microsoftConnection.email,
          microsoftTenantId: microsoftConnection.tenantId
        })
      : null;

    if (
      microsoftConnection?.verified &&
      microsoftConnection.email &&
      !isUniversityDomainAllowed(universityId, microsoftConnection.email)
    ) {
      return res.status(400).json({
        message: `La cuenta universitaria Microsoft/Entra ya conectada debe usar uno de los dominios institucionales oficiales de esa universidad: ${formatAllowedDomainsMessage(universityRule.allowedDomains)}.`
      });
    }

    const application = await UniversityApplication.findOneAndUpdate(
      { user: req.userId },
      {
        universityId,
        universityTag,
        universityName,
        region,
        city,
        campus,
        studentId,
        program,
        academicLevel,
        institutionalEmail,
        verificationSource,
        microsoft: microsoftConnection,
        status: 'pending',
        rejectReason: '',
        reviewedAt: null,
        reviewedBy: null,
        submittedAt: now
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    user.university = buildUniversitySnapshot({
      universityId,
      universityTag,
      universityName,
      region,
      city,
      campus,
      studentId,
      program,
      academicLevel,
      institutionalEmail,
      verificationSource,
      tenantId: microsoftConnection.tenantId,
      status: 'pending',
      appliedAt: now
    });

    const autoApproval = await maybeAutoApproveUniversityApplication({
      application,
      user,
      microsoftIdentity: microsoftConnection?.verified ? microsoftConnection : null
    });

    if (!autoApproval.autoApproved) {
      await user.save();
    }

    return res.json({
      message: autoApproval.autoApproved
        ? 'Cuenta universitaria verificada automáticamente.'
        : microsoftAllowlistCheck?.hasDomainRules
          ? 'Postulación universitaria enviada. La cuenta institucional conectada no cumple todavía las reglas de verificación automática de esa universidad, así que queda en revisión manual.'
          : 'Postulación universitaria enviada.',
      application,
      autoApprovalEligible: Boolean(microsoftAllowlistCheck?.autoApproveEligible)
    });
  } catch (error) {
    console.error('submitUniversityApplication error:', error);
    return res.status(500).json({ message: 'No se pudo enviar la postulación universitaria.' });
  }
};

export const getMyUniversityStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email connections.microsoft university');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const application = await UniversityApplication.findOne({ user: req.userId })
      .sort({ updatedAt: -1 })
      .select('universityId universityTag universityName region city campus studentId program academicLevel institutionalEmail verificationSource status rejectReason submittedAt reviewedAt reviewedBy');

    return res.json({
      university: user.university || STATUS_UNLINKED,
      application,
      microsoftConnection: buildMicrosoftConnectionPayload(user),
      userEmail: user.email || ''
    });
  } catch (error) {
    console.error('getMyUniversityStatus error:', error);
    return res.status(500).json({ message: 'No se pudo obtener el estado universitario.' });
  }
};

export const getUniversityMicrosoftStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.microsoft university');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const universityId = normalizeText(user.university?.universityId, 60).toLowerCase();
    const universityRule = getUniversityVerificationRule(universityId);
    const institutionalEmail = normalizeText(user.university?.institutionalEmail, 160).toLowerCase();
    const microsoftEmail = normalizeText(user.connections?.microsoft?.email, 160).toLowerCase();

    return res.json({
      microsoftConnection: buildMicrosoftConnectionPayload(user),
      universityId,
      universityVerificationStatus: user.university?.verificationStatus || 'unlinked',
      institutionalEmail,
      exactEmailMatch: Boolean(institutionalEmail && microsoftEmail && institutionalEmail === microsoftEmail),
      allowedDomains: universityRule.allowedDomains || []
    });
  } catch (error) {
    console.error('getUniversityMicrosoftStatus error:', error);
    return res.status(500).json({ message: 'No se pudo obtener el estado de la conexión universitaria.' });
  }
};

export const listUniversityApplications = async (req, res) => {
  try {
    const isAdmin = await ensureAdmin(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const status = normalizeText(req.query?.status, 20).toLowerCase();
    const region = normalizeText(req.query?.region, 30).toLowerCase();
    const filter = {};

    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    if (region) {
      filter.region = region;
    }

    const items = await UniversityApplication.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'fullName username email avatar')
      .populate('reviewedBy', 'fullName username');

    return res.json(items);
  } catch (error) {
    console.error('listUniversityApplications error:', error);
    return res.status(500).json({ message: 'No se pudo obtener la cola universitaria.' });
  }
};

export const reviewUniversityApplication = async (req, res) => {
  try {
    const isAdmin = await ensureAdmin(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const decision = normalizeText(req.body?.decision, 20).toLowerCase();
    const rejectReason = normalizeText(req.body?.rejectReason, 220);

    if (!['approved', 'rejected', 'revoked'].includes(decision)) {
      return res.status(400).json({ message: 'Decisión inválida.' });
    }

    if ((decision === 'rejected' || decision === 'revoked') && !rejectReason) {
      return res.status(400).json({ message: decision === 'revoked' ? 'Debes indicar el motivo de la revocación.' : 'Debes indicar el motivo del rechazo.' });
    }

    const application = await UniversityApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Postulación no encontrada.' });
    }

    const user = await User.findById(application.user).select('notifications university');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (decision === 'revoked' && application.status !== 'approved') {
      return res.status(400).json({ message: 'Solo puedes retirar verificaciones ya aprobadas.' });
    }

    await finalizeApplicationDecision({
      application,
      user,
      decision,
      rejectReason,
      reviewedBy: req.userId,
      req
    });

    return res.json({
      message: decision === 'approved'
        ? 'Postulación aprobada.'
        : decision === 'rejected'
          ? 'Postulación rechazada.'
          : 'Verificación retirada. La cuenta vuelve a revisión.',
      application
    });
  } catch (error) {
    console.error('reviewUniversityApplication error:', error);
    return res.status(500).json({ message: 'No se pudo revisar la postulación universitaria.' });
  }
};

export const startUniversityMicrosoftConnect = async (req, res) => {
  try {
    if (!ensureMicrosoftOAuthConfigured()) {
      return res.status(503).json({ message: 'La conexión universitaria con Microsoft no está configurada todavía.' });
    }

    const user = await User.findById(req.userId).select('university');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const application = await UniversityApplication.findOne({ user: req.userId }).sort({ updatedAt: -1 });
    const institutionalEmail = normalizeText(application?.institutionalEmail || user.university?.institutionalEmail, 160).toLowerCase();

    if (!institutionalEmail) {
      return res.status(400).json({ message: 'Primero envía tu postulación universitaria con tu correo institucional.' });
    }

    const applicationRegion = normalizeText(application?.region || user.university?.region, 30).toLowerCase();
    if (applicationRegion !== 'rd') {
      return res.status(400).json({ message: 'Por ahora la conexión institucional automática solo está habilitada para universidades de República Dominicana.' });
    }

    const universityId = normalizeText(application?.universityId || user.university?.universityId, 60).toLowerCase();
    const universityRule = getUniversityVerificationRule(universityId);
    if (universityRule.allowedDomains.length === 0) {
      return res.status(400).json({ message: 'La universidad seleccionada todavía no tiene dominios institucionales configurados para verificación automática.' });
    }

    if (!isUniversityDomainAllowed(universityId, institutionalEmail)) {
      return res.status(400).json({
        message: `La postulación debe usar uno de los dominios institucionales oficiales de esa universidad: ${formatAllowedDomainsMessage(universityRule.allowedDomains)}.`
      });
    }

    const state = jwt.sign({
      purpose: 'university-microsoft-connect',
      userId: req.userId,
      institutionalEmail,
      universityId
    }, process.env.JWT_SECRET, { expiresIn: '10m' });

    return res.json({
      authorizationUrl: buildMicrosoftAuthorizeUrl(state)
    });
  } catch (error) {
    console.error('startUniversityMicrosoftConnect error:', error);
    return res.status(500).json({ message: 'No se pudo iniciar la conexión universitaria.' });
  }
};

export const completeUniversityMicrosoftConnect = async (req, res) => {
  const redirectWithStatus = (status, message) => res.redirect(getFrontendUniversityRedirect(status, message));

  try {
    if (!ensureMicrosoftOAuthConfigured()) {
      return redirectWithStatus('error', 'La conexión universitaria con Microsoft no está configurada.');
    }

    if (req.query?.error) {
      return redirectWithStatus('error', normalizeText(req.query?.error_description || req.query?.error, 220) || 'La autenticación universitaria fue cancelada.');
    }

    const code = normalizeText(req.query?.code, 4000);
    const state = normalizeText(req.query?.state, 4000);

    if (!code || !state) {
      return redirectWithStatus('error', 'Respuesta inválida de Microsoft.');
    }

    let statePayload;
    try {
      statePayload = jwt.verify(state, process.env.JWT_SECRET);
    } catch (_) {
      return redirectWithStatus('error', 'La sesión de verificación universitaria expiró. Inténtalo de nuevo.');
    }

    if (statePayload?.purpose !== 'university-microsoft-connect' || !statePayload?.userId) {
      return redirectWithStatus('error', 'La sesión de verificación universitaria no es válida.');
    }

    const tokenRes = await axios.post(buildMicrosoftTokenEndpoint(), new URLSearchParams({
      client_id: getMicrosoftClientId(),
      client_secret: getMicrosoftClientSecret(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: getMicrosoftRedirectUri(),
      scope: 'openid profile email User.Read'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokenData = tokenRes.data || {};
    const idTokenClaims = decodeJwtPayload(tokenData.id_token);
    const graphRes = await axios.get('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const graphUser = graphRes.data || {};
    const microsoftIdentity = normalizeMicrosoftIdentity({
      tenantId: idTokenClaims?.tid || '',
      userId: graphUser?.id || idTokenClaims?.oid || '',
      email: graphUser?.mail || graphUser?.userPrincipalName || idTokenClaims?.preferred_username || idTokenClaims?.email || '',
      displayName: graphUser?.displayName || idTokenClaims?.name || ''
    });

    if (!microsoftIdentity.email || !microsoftIdentity.tenantId) {
      return redirectWithStatus('error', 'No se pudo leer una cuenta institucional válida desde Microsoft.');
    }

    const emailDomain = getEmailDomain(microsoftIdentity.email);
    if (!emailDomain || PUBLIC_EMAIL_DOMAINS.has(emailDomain)) {
      return redirectWithStatus('error', 'Debes iniciar sesión con una cuenta universitaria de Microsoft, no una cuenta personal.');
    }

    const user = await User.findById(statePayload.userId).select('connections.microsoft university notifications');
    if (!user) {
      return redirectWithStatus('error', 'Usuario no encontrado.');
    }

    const application = await UniversityApplication.findOne({ user: statePayload.userId }).sort({ updatedAt: -1 });
    const institutionalEmail = normalizeText(
      application?.institutionalEmail || user.university?.institutionalEmail || statePayload.institutionalEmail,
      160
    ).toLowerCase();

    if (!institutionalEmail) {
      return redirectWithStatus('error', 'Primero completa tu postulación universitaria.');
    }

    const universityId = application?.universityId || user.university?.universityId || statePayload.universityId;
    const universityRule = getUniversityVerificationRule(universityId);
    if (universityRule.allowedDomains.length === 0) {
      return redirectWithStatus('error', 'La universidad seleccionada todavía no tiene dominios institucionales configurados para verificación automática.');
    }

    if (!isUniversityDomainAllowed(universityId, institutionalEmail)) {
      return redirectWithStatus('error', `Tu postulación debe usar uno de los dominios institucionales oficiales de esa universidad: ${formatAllowedDomainsMessage(universityRule.allowedDomains)}.`);
    }

    if (!isUniversityDomainAllowed(universityId, microsoftIdentity.email)) {
      return redirectWithStatus('error', `La cuenta Microsoft/Entra conectada no usa un dominio institucional oficial de esa universidad. Dominios permitidos: ${formatAllowedDomainsMessage(universityRule.allowedDomains)}.`);
    }

    const allowlistCheck = evaluateUniversityMicrosoftAllowlist({
      universityId,
      institutionalEmail,
      microsoftEmail: microsoftIdentity.email,
      microsoftTenantId: microsoftIdentity.tenantId
    });

    user.connections.microsoft = {
      ...user.connections.microsoft,
      ...microsoftIdentity,
      verified: true,
      linkedAt: new Date()
    };

    if (!application) {
      await user.save();
      return redirectWithStatus('linked', 'Cuenta universitaria conectada. Ahora completa tu postulación.');
    }

    attachMicrosoftToApplication(application, microsoftIdentity);

    const exactEmailMatch = microsoftIdentity.email === institutionalEmail;
    if (exactEmailMatch && allowlistCheck.autoApproveEligible) {
      const { autoApproved } = await maybeAutoApproveUniversityApplication({
        application,
        user,
        microsoftIdentity
      });

      if (autoApproved) {
        return redirectWithStatus('approved', 'Cuenta universitaria verificada automáticamente.');
      }
    }

    syncPendingUniversitySnapshot(user, application, microsoftIdentity);
    await application.save();
    await user.save();

    return redirectWithStatus(
      'linked',
      exactEmailMatch
        ? allowlistCheck.autoApproveEligible
          ? 'Cuenta universitaria conectada.'
          : allowlistCheck.hasDomainRules
            ? 'Cuenta universitaria conectada. La universidad requiere una allowlist institucional más estricta, por lo que la postulación seguirá en revisión manual.'
            : 'Cuenta universitaria conectada. Esta universidad todavía no tiene allowlist institucional configurada, por lo que la postulación seguirá en revisión manual.'
        : 'Cuenta universitaria conectada. Como el correo no coincide exactamente, la postulación seguirá en revisión manual.'
    );
  } catch (error) {
    console.error('completeUniversityMicrosoftConnect error:', error?.response?.data || error);
    return redirectWithStatus('error', getMicrosoftProviderErrorMessage(error));
  }
};

export const unlinkUniversityMicrosoftConnection = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('connections.microsoft university notifications');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.university?.verified && user.university?.verificationSource === 'microsoft') {
      return res.status(409).json({
        message: 'Tu verificación universitaria ya fue aprobada usando Microsoft/Entra. Para desvincular esta cuenta necesitas revisión administrativa.'
      });
    }

    const application = await UniversityApplication.findOne({ user: req.userId }).sort({ updatedAt: -1 });
    const hadConnection = Boolean(user.connections?.microsoft?.email || user.connections?.microsoft?.verified);

    user.connections.microsoft = {
      tenantId: '',
      userId: '',
      email: '',
      displayName: '',
      verified: false,
      linkedAt: null
    };

    if (application) {
      application.microsoft = {
        tenantId: '',
        userId: '',
        email: '',
        displayName: ''
      };
      if (application.verificationSource === 'microsoft') {
        application.verificationSource = 'manual';
      }
      await application.save();
    }

    if (!user.university?.verified) {
      user.university.tenantId = '';
      if (user.university.verificationSource === 'microsoft') {
        user.university.verificationSource = 'manual';
      }
    }

    if (hadConnection) {
      user.notifications.unshift({
        type: 'info',
        category: 'university',
        title: 'Cuenta universitaria desconectada',
        source: 'University',
        message: 'Tu cuenta Microsoft/Entra fue desconectada. Si necesitas volver a verificarte, conecta otra vez tu cuenta institucional correcta.',
        status: 'unread',
        visuals: {
          icon: 'bx bxl-microsoft',
          color: '#8aa4ff',
          glow: false
        },
        createdAt: new Date()
      });
    }

    await user.save();

    return res.json({
      message: hadConnection
        ? 'Cuenta universitaria Microsoft/Entra desconectada.'
        : 'No había una cuenta universitaria conectada.',
      microsoftConnection: buildMicrosoftConnectionPayload(user),
      universityVerificationStatus: user.university?.verificationStatus || 'unlinked'
    });
  } catch (error) {
    console.error('unlinkUniversityMicrosoftConnection error:', error);
    return res.status(500).json({ message: 'No se pudo desconectar la cuenta universitaria.' });
  }
};
