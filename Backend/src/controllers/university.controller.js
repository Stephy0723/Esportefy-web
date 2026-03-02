import User from '../models/User.js';
import UniversityApplication from '../models/UniversityApplication.js';
import AdminAuditLog from '../models/AdminAuditLog.js';

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

export const submitUniversityApplication = async (req, res) => {
  try {
    const universityId = normalizeText(req.body?.universityId, 60).toLowerCase();
    const universityTag = normalizeText(req.body?.universityTag, 30);
    const universityName = normalizeText(req.body?.universityName, 180);
    const region = normalizeText(req.body?.region, 30).toLowerCase();
    const city = normalizeText(req.body?.city, 80);
    const campus = normalizeText(req.body?.campus, 100);
    const studentId = normalizeText(req.body?.studentId, 60);
    const program = normalizeText(req.body?.program, 120);
    const academicLevel = normalizeText(req.body?.academicLevel, 40);
    const institutionalEmail = normalizeText(req.body?.institutionalEmail, 160).toLowerCase();

    if (!universityId || !universityTag || !universityName || !region || !campus || !studentId || !program || !academicLevel) {
      return res.status(400).json({ message: 'Completa todos los campos universitarios requeridos.' });
    }

    if (!STUDENT_ID_REGEX.test(studentId)) {
      return res.status(400).json({ message: 'La matrícula o ID estudiantil debe tener entre 4 y 32 caracteres y solo usar letras, números, ".", "_" , "/" o "-".' });
    }

    if (program.length < 3) {
      return res.status(400).json({ message: 'La carrera o programa debe tener al menos 3 caracteres.' });
    }

    if (campus.length < 3) {
      return res.status(400).json({ message: 'Indica un campus válido.' });
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

    const user = await User.findById(req.userId).select('fullName email connections.microsoft university notifications');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.university?.verified) {
      return res.status(409).json({ message: 'Tu cuenta ya está verificada con una universidad. Contacta soporte si necesitas cambiarla.' });
    }

    const duplicateStudent = await UniversityApplication.findOne({
      universityId,
      studentId,
      user: { $ne: req.userId },
      status: { $in: ['pending', 'approved'] }
    }).select('_id');

    if (duplicateStudent) {
      return res.status(409).json({ message: 'Ese ID estudiantil ya está en uso en esta universidad.' });
    }

    const duplicateInstitutionalEmail = await UniversityApplication.findOne({
      universityId,
      institutionalEmail,
      user: { $ne: req.userId },
      status: { $in: ['pending', 'approved'] }
    }).select('_id');

    if (duplicateInstitutionalEmail) {
      return res.status(409).json({ message: 'Ese correo institucional ya está en uso en esta universidad.' });
    }

    const microsoftConnection = user.connections?.microsoft || {};
    const verificationSource = microsoftConnection?.verified ? 'microsoft' : 'manual';
    const now = new Date();

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
        microsoft: {
          tenantId: normalizeText(microsoftConnection.tenantId, 80),
          userId: normalizeText(microsoftConnection.userId, 120),
          email: normalizeText(microsoftConnection.email, 160).toLowerCase(),
          displayName: normalizeText(microsoftConnection.displayName, 160)
        },
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
      tenantId: normalizeText(microsoftConnection.tenantId, 80),
      status: 'pending',
      appliedAt: now
    });

    await user.save();

    return res.json({
      message: 'Postulación universitaria enviada.',
      application
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
      microsoftConnection: {
        verified: Boolean(user.connections?.microsoft?.verified),
        tenantId: user.connections?.microsoft?.tenantId || '',
        userId: user.connections?.microsoft?.userId || '',
        email: user.connections?.microsoft?.email || '',
        displayName: user.connections?.microsoft?.displayName || ''
      },
      userEmail: user.email || ''
    });
  } catch (error) {
    console.error('getMyUniversityStatus error:', error);
    return res.status(500).json({ message: 'No se pudo obtener el estado universitario.' });
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

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decisión inválida.' });
    }

    if (decision === 'rejected' && !rejectReason) {
      return res.status(400).json({ message: 'Debes indicar el motivo del rechazo.' });
    }

    const application = await UniversityApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Postulación no encontrada.' });
    }

    const user = await User.findById(application.user).select('notifications university');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const now = new Date();
    application.status = decision;
    application.rejectReason = decision === 'rejected' ? rejectReason : '';
    application.reviewedAt = now;
    application.reviewedBy = req.userId;
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
      status: decision === 'approved' ? 'verified' : 'rejected',
      rejectReason: application.rejectReason,
      reviewedBy: req.userId,
      appliedAt: application.submittedAt,
      reviewedAt: now,
      verifiedAt: decision === 'approved' ? now : null
    });

    user.notifications.unshift({
      type: 'info',
      category: 'university',
      title: decision === 'approved' ? 'Verificación universitaria aprobada' : 'Verificación universitaria rechazada',
      source: 'University',
      message: decision === 'approved'
        ? `Tu cuenta fue verificada para ${application.universityName}.`
        : `Tu postulación para ${application.universityName} fue rechazada. ${rejectReason}`,
      status: 'unread',
      meta: {
        universityId: application.universityId,
        universityName: application.universityName,
        decision
      },
      visuals: {
        icon: 'bx bxs-graduation',
        color: decision === 'approved' ? '#8EDB15' : '#ff5d73',
        glow: true
      },
      createdAt: now
    });

    await user.save();

    await AdminAuditLog.create({
      actorUserId: req.userId,
      action: `university.application.${decision}`,
      entityType: 'UniversityApplication',
      entityId: String(application._id),
      meta: {
        userId: String(application.user),
        universityId: application.universityId,
        universityName: application.universityName
      },
      ip: getActorIp(req),
      userAgent: getActorAgent(req)
    });

    return res.json({
      message: decision === 'approved' ? 'Postulación aprobada.' : 'Postulación rechazada.',
      application
    });
  } catch (error) {
    console.error('reviewUniversityApplication error:', error);
    return res.status(500).json({ message: 'No se pudo revisar la postulación universitaria.' });
  }
};
