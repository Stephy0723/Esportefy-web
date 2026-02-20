import fs from 'fs';
import path from 'path';
import multer from 'multer';
import mongoose from 'mongoose';
import CommunityPost from '../models/CommunityPost.js';
import Community from '../models/Community.js';
import User from '../models/User.js';

const UPLOAD_DIR = './uploads/community/';
const POST_MAX_LENGTH = 1200;
const REPORT_MAX_REASON = 160;
const REPORT_MAX_DETAILS = 1500;

const ALLOWED_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar'
]);

const ALLOWED_FILE_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.zip',
  '.rar'
]);

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const COMMUNITY_SLUG_REGEX = /^[a-z0-9-]{3,50}$/;
const COMMUNITY_MANAGEABLE_ROLES = new Set(['member', 'moderator', 'admin']);
const COMMUNITY_AUDIT_LOG_LIMIT = 200;

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const sanitizeText = (value, maxLength = POST_MAX_LENGTH) => {
  return String(value || '').trim().slice(0, maxLength);
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const parseJsonField = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (_) {
    return fallback;
  }
};

const parseStringArrayField = (value, maxItems = 30) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }
  if (typeof value === 'string') {
    const parsed = parseJsonField(value, null);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, maxItems);
    }
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }
  return [];
};

const parseBooleanMap = (value, allowedKeys = []) => {
  const raw = parseJsonField(value, {});
  if (!raw || typeof raw !== 'object') return {};
  const keys = allowedKeys.length > 0 ? allowedKeys : Object.keys(raw);
  return keys.reduce((acc, key) => {
    acc[key] = toBoolean(raw[key], false);
    return acc;
  }, {});
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const slugify = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
};

const normalizePrivacy = (value) => {
  const allowed = new Set(['Public', 'Friends', 'Private']);
  const parsed = String(value || '').trim();
  return allowed.has(parsed) ? parsed : 'Public';
};

const canReadPost = (post, userId) => {
  if (!post) return false;
  if (String(post.author?._id || post.author) === String(userId)) return true;
  if (post.privacy === 'Private') return false;
  return true;
};

const parseAttachmentKind = (input) => {
  const kind = String(input || '').toLowerCase();
  if (kind === 'media') return 'media';
  if (kind === 'file') return 'file';
  return null;
};

const inferAttachmentKind = (file, explicitKind) => {
  if (explicitKind) return explicitKind;
  if (String(file?.mimetype || '').startsWith('image/')) return 'media';
  if (String(file?.mimetype || '').startsWith('video/')) return 'media';
  return 'file';
};

const buildFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/community/${filename}`;
};

const toUserPayload = (userDoc) => {
  if (!userDoc) return { id: null, username: 'Usuario', fullName: 'Usuario', avatar: '' };
  return {
    id: String(userDoc._id || ''),
    username: userDoc.username || userDoc.fullName || 'Usuario',
    fullName: userDoc.fullName || userDoc.username || 'Usuario',
    avatar: userDoc.avatar || ''
  };
};

const toCommentPayload = (commentDoc, userId) => {
  const likes = Array.isArray(commentDoc.likes) ? commentDoc.likes : [];
  const likedByMe = likes.some((likedUserId) => String(likedUserId) === String(userId));

  return {
    id: String(commentDoc._id),
    author: toUserPayload(commentDoc.author),
    text: commentDoc.text || '',
    attachment: commentDoc.attachment || null,
    likesCount: likes.length,
    likedByMe,
    createdAt: commentDoc.createdAt
  };
};

const toPostPayload = (postDoc, userId) => {
  const likes = Array.isArray(postDoc.likes) ? postDoc.likes : [];
  const comments = Array.isArray(postDoc.comments) ? postDoc.comments : [];
  const likedByMe = likes.some((likedUserId) => String(likedUserId) === String(userId));
  const isOwner = String(postDoc.author?._id || postDoc.author) === String(userId);

  return {
    id: String(postDoc._id),
    author: toUserPayload(postDoc.author),
    text: postDoc.text || '',
    privacy: postDoc.privacy || 'Public',
    attachment: postDoc.attachment || null,
    likesCount: likes.length,
    likedByMe,
    commentsCount: comments.length,
    comments: comments.map((comment) => toCommentPayload(comment, userId)),
    createdAt: postDoc.createdAt,
    updatedAt: postDoc.updatedAt,
    isOwner
  };
};

const toCommunityPayload = (communityDoc, userId) => {
  const members = Array.isArray(communityDoc.members) ? communityDoc.members : [];
  const ownMemberEntry = members.find((entry) => String(entry.user?._id || entry.user) === String(userId));
  const isOwner = String(communityDoc.createdBy?._id || communityDoc.createdBy) === String(userId);
  const isAdmin = ownMemberEntry?.role === 'admin';
  const joined = isOwner || Boolean(ownMemberEntry);

  return {
    id: String(communityDoc._id),
    name: communityDoc.name,
    shortUrl: communityDoc.shortUrl,
    description: communityDoc.description || '',
    avatarUrl: communityDoc.media?.avatarUrl || '',
    bannerUrl: communityDoc.media?.bannerUrl || '',
    rulesPdfUrl: communityDoc.media?.rulesPdfUrl || '',
    rulesPdfName: communityDoc.media?.rulesPdfName || '',
    membersCount: Number(communityDoc.membersCount || members.length || 0),
    region: communityDoc.region || 'LATAM',
    language: communityDoc.language || 'Español',
    mainGames: Array.isArray(communityDoc.mainGames) ? communityDoc.mainGames : [],
    createdAt: communityDoc.createdAt,
    isOwner,
    joined,
    canLeave: joined && !isOwner,
    canManageMembers: isOwner || isAdmin,
    role: isOwner ? 'owner' : ownMemberEntry?.role || 'guest'
  };
};

const toCommunityMemberPayload = (memberDoc) => {
  return {
    role: memberDoc?.role || 'member',
    joinedAt: memberDoc?.joinedAt || null,
    user: toUserPayload(memberDoc?.user)
  };
};

const findCommunityBySlug = async (shortUrl, { populate = false } = {}) => {
  const slug = slugify(shortUrl);
  if (!slug) return null;
  const query = Community.findOne({ shortUrl: slug, isActive: true });
  if (populate) {
    query.populate('createdBy', 'username fullName avatar').populate('members.user', 'username fullName avatar');
  }
  return query;
};

const syncMembersCount = (community) => {
  const list = Array.isArray(community?.members) ? community.members : [];
  community.membersCount = list.length;
};

const getMemberEntry = (community, userId) => {
  const list = Array.isArray(community?.members) ? community.members : [];
  return list.find((entry) => String(entry.user?._id || entry.user) === String(userId)) || null;
};

const appendCommunityAuditLog = (community, { action, actor, target = null, metadata = {} }) => {
  if (!community || !action || !actor) return;
  if (!Array.isArray(community.auditLogs)) {
    community.auditLogs = [];
  }

  community.auditLogs.unshift({
    action,
    actor,
    target: target || null,
    metadata,
    createdAt: new Date()
  });

  if (community.auditLogs.length > COMMUNITY_AUDIT_LOG_LIMIT) {
    community.auditLogs = community.auditLogs.slice(0, COMMUNITY_AUDIT_LOG_LIMIT);
  }
};

const toAuditLogPayload = (entry) => {
  return {
    action: entry?.action || 'unknown',
    actor: toUserPayload(entry?.actor),
    target: entry?.target ? toUserPayload(entry?.target) : null,
    metadata: entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
    createdAt: entry?.createdAt || null
  };
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureUploadDir();
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${req.userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

export const uploadCommunityAttachment = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = String(file.mimetype || '').toLowerCase();
    const isMedia = mimeType.startsWith('image/') || mimeType.startsWith('video/');
    const isFile = ALLOWED_FILE_MIME_TYPES.has(mimeType) && ALLOWED_FILE_EXTENSIONS.has(extension);

    if (!isMedia && !isFile) {
      return cb(new Error('Archivo inválido. Solo se permiten imágenes, video o documentos soportados.'));
    }
    return cb(null, true);
  }
});

const CONTENT_CATEGORY_KEYS = ['noticias', 'memes', 'opinion', 'clips', 'fanart', 'guias'];
const POST_TYPE_KEYS = ['texto', 'imagen', 'video', 'enlace', 'encuestas'];
const ROLE_KEYS = ['owner', 'admin', 'moderator', 'user', 'visitor'];
const REPORT_REASON_KEYS = ['spam', 'hate', 'nsfw', 'spoiler'];

export const uploadCommunityAssets = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = String(file.mimetype || '').toLowerCase();

    if (file.fieldname === 'rulesPdf') {
      if (mimeType === 'application/pdf' && extension === '.pdf') {
        return cb(null, true);
      }
      return cb(new Error('Archivo inválido. El reglamento debe estar en formato PDF.'));
    }

    if (file.fieldname === 'banner' || file.fieldname === 'avatar') {
      const validImageMime = ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
      const validImageExt = ALLOWED_IMAGE_EXTENSIONS.has(extension);
      if (validImageMime && validImageExt) {
        return cb(null, true);
      }
      return cb(new Error('Archivo inválido. Banner y avatar deben ser imágenes JPG, PNG o WEBP.'));
    }

    return cb(new Error('Archivo inválido. Campo de archivo no permitido.'));
  }
}).fields([
  { name: 'banner', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
  { name: 'rulesPdf', maxCount: 1 }
]);

const resolveAttachmentFromRequest = (req) => {
  if (!req.file) return null;
  const explicitKind = parseAttachmentKind(req.body?.attachmentType);
  const kind = inferAttachmentKind(req.file, explicitKind);
  return {
    kind,
    name: req.file.originalname,
    url: buildFileUrl(req, req.file.filename),
    mimeType: req.file.mimetype,
    size: req.file.size
  };
};

const getUploadedFile = (req, fieldName) => {
  const list = req.files?.[fieldName];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[0];
};

const buildCommunityMediaFromRequest = (req) => {
  const bannerFile = getUploadedFile(req, 'banner');
  const avatarFile = getUploadedFile(req, 'avatar');
  const rulesPdfFile = getUploadedFile(req, 'rulesPdf');

  return {
    bannerUrl: bannerFile ? buildFileUrl(req, bannerFile.filename) : '',
    avatarUrl: avatarFile ? buildFileUrl(req, avatarFile.filename) : '',
    rulesPdfUrl: rulesPdfFile ? buildFileUrl(req, rulesPdfFile.filename) : '',
    rulesPdfName: rulesPdfFile?.originalname || ''
  };
};

const normalizeAdmins = (value) => {
  const list = parseStringArrayField(value, 20)
    .map((item) => item.replace(/^@+/, '').trim())
    .filter(Boolean);
  return [...new Set(list)].slice(0, 20);
};

const parseCommunityPayload = (body) => {
  return {
    name: sanitizeText(body?.name, 90),
    shortUrl: slugify(body?.shortUrl),
    description: sanitizeText(body?.description, 1200),
    type: sanitizeText(body?.type, 40),
    targetAudience: sanitizeText(body?.targetAudience, 80),
    language: sanitizeText(body?.language, 40),
    region: sanitizeText(body?.region, 40),
    launchDate: toDateOrNull(body?.launchDate),

    mainGames: parseStringArrayField(body?.mainGames, 5),
    allowAllGames: toBoolean(body?.allowAllGames, false),
    contentCategories: parseBooleanMap(body?.contentCategories, CONTENT_CATEGORY_KEYS),
    contentProhibited: sanitizeText(body?.contentProhibited, 600),

    postTypes: parseBooleanMap(body?.postTypes, POST_TYPE_KEYS),
    whoCanPost: ['all', 'verified', 'staff'].includes(body?.whoCanPost) ? body.whoCanPost : 'all',
    allowComments: toBoolean(body?.allowComments, true),
    preModeration: toBoolean(body?.preModeration, false),
    allowReactions: toBoolean(body?.allowReactions, true),
    allowShare: toBoolean(body?.allowShare, true),

    roles: parseBooleanMap(body?.roles, ROLE_KEYS),
    rulesText: sanitizeText(body?.rulesText, 6000),
    toxicityFilter: toBoolean(body?.toxicityFilter, true),
    spoilerTag: toBoolean(body?.spoilerTag, true),
    nsfwAllowed: toBoolean(body?.nsfwAllowed, false),
    reportReasons: parseBooleanMap(body?.reportReasons, REPORT_REASON_KEYS),
    emailVerification: toBoolean(body?.emailVerification, true),
    antiSpamControl: toBoolean(body?.antiSpamControl, true),
    discordIntegration: toBoolean(body?.discordIntegration, false),
    welcomeEmail: toBoolean(body?.welcomeEmail, true),
    futureEvents: toBoolean(body?.futureEvents, false),
    futureTournaments: toBoolean(body?.futureTournaments, false),
    admins: normalizeAdmins(body?.admins)
  };
};

export const createCommunity = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('isOrganizer isAdmin');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (!user.isOrganizer && !user.isAdmin) {
      return res.status(403).json({ message: 'Solo organizadores verificados pueden crear comunidades' });
    }

    const parsed = parseCommunityPayload(req.body || {});
    const name = parsed.name;
    const slug = parsed.shortUrl || slugify(name);

    if (!name) {
      return res.status(400).json({ message: 'El nombre de la comunidad es obligatorio' });
    }
    if (!COMMUNITY_SLUG_REGEX.test(slug)) {
      return res.status(400).json({ message: 'La URL corta debe tener 3-50 caracteres: letras, números o guion' });
    }

    const existing = await Community.findOne({ shortUrl: slug }).select('_id');
    if (existing) {
      return res.status(409).json({ message: 'La URL corta ya está en uso' });
    }

    const media = buildCommunityMediaFromRequest(req);

    const createdCommunity = await Community.create({
      name,
      shortUrl: slug,
      description: parsed.description,
      type: parsed.type || 'Mixta',
      targetAudience: parsed.targetAudience || 'Mixto',
      language: parsed.language || 'Español',
      region: parsed.region || 'LATAM',
      launchDate: parsed.launchDate,

      mainGames: parsed.mainGames,
      allowAllGames: parsed.allowAllGames,
      contentCategories: parsed.contentCategories,
      contentProhibited: parsed.contentProhibited,

      postTypes: parsed.postTypes,
      whoCanPost: parsed.whoCanPost,
      allowComments: parsed.allowComments,
      preModeration: parsed.preModeration,
      allowReactions: parsed.allowReactions,
      allowShare: parsed.allowShare,

      roles: parsed.roles,
      rulesText: parsed.rulesText,
      toxicityFilter: parsed.toxicityFilter,
      spoilerTag: parsed.spoilerTag,
      nsfwAllowed: parsed.nsfwAllowed,
      reportReasons: parsed.reportReasons,
      emailVerification: parsed.emailVerification,
      antiSpamControl: parsed.antiSpamControl,
      discordIntegration: parsed.discordIntegration,
      welcomeEmail: parsed.welcomeEmail,
      futureEvents: parsed.futureEvents,
      futureTournaments: parsed.futureTournaments,
      admins: parsed.admins,
      media,

      createdBy: req.userId,
      members: [{ user: req.userId, role: 'owner' }],
      auditLogs: [
        {
          action: 'community_created',
          actor: req.userId,
          target: req.userId,
          metadata: { shortUrl: slug },
          createdAt: new Date()
        }
      ],
      membersCount: 1,
      isActive: true
    });

    return res.status(201).json({
      community: toCommunityPayload(createdCommunity, req.userId)
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.shortUrl) {
      return res.status(409).json({ message: 'La URL corta ya está en uso' });
    }
    return res.status(500).json({ message: 'Error al crear comunidad', error: error.message });
  }
};

export const getMyCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      isActive: true,
      $or: [{ createdBy: req.userId }, { 'members.user': req.userId }]
    })
      .sort({ createdAt: -1 })
      .limit(60);

    return res.status(200).json({
      communities: communities.map((community) => toCommunityPayload(community, req.userId))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener comunidades', error: error.message });
  }
};

export const getCommunityByShortUrl = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });

    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const members = Array.isArray(community.members) ? community.members : [];

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: members.map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener la comunidad', error: error.message });
  }
};

export const getCommunityAuditLogs = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    const limit = Math.min(Math.max(Number(req.query?.limit || 40), 1), 100);

    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const currentIsOwner = String(community.createdBy?._id || community.createdBy) === String(req.userId);
    const currentEntry = getMemberEntry(community, req.userId);
    const currentIsAdmin = currentEntry?.role === 'admin';
    if (!currentIsOwner && !currentIsAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para ver la bitácora de la comunidad' });
    }

    await community.populate('auditLogs.actor', 'username fullName avatar');
    await community.populate('auditLogs.target', 'username fullName avatar');

    const logs = Array.isArray(community.auditLogs) ? [...community.auditLogs] : [];
    logs.sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return res.status(200).json({
      auditLogs: logs.slice(0, limit).map(toAuditLogPayload)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener bitácora de la comunidad', error: error.message });
  }
};

export const joinCommunity = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const alreadyMember = getMemberEntry(community, req.userId);
    if (!alreadyMember && String(community.createdBy?._id || community.createdBy) !== String(req.userId)) {
      community.members.push({
        user: req.userId,
        role: 'member',
        joinedAt: new Date()
      });
      appendCommunityAuditLog(community, {
        action: 'member_joined',
        actor: req.userId,
        target: req.userId,
        metadata: { role: 'member' }
      });
      syncMembersCount(community);
      await community.save();
      await community.populate('members.user', 'username fullName avatar');
    }

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: (community.members || []).map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al unirse a la comunidad', error: error.message });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const isOwner = String(community.createdBy?._id || community.createdBy) === String(req.userId);
    if (isOwner) {
      return res.status(400).json({ message: 'El owner no puede abandonar la comunidad' });
    }

    const before = Array.isArray(community.members) ? community.members.length : 0;
    const leavingEntry = getMemberEntry(community, req.userId);
    community.members = (community.members || []).filter(
      (entry) => String(entry.user?._id || entry.user) !== String(req.userId)
    );
    const after = community.members.length;

    if (before === after) {
      return res.status(404).json({ message: 'No perteneces a esta comunidad' });
    }

    appendCommunityAuditLog(community, {
      action: 'member_left',
      actor: req.userId,
      target: req.userId,
      metadata: {
        previousRole: leavingEntry?.role || 'member'
      }
    });

    syncMembersCount(community);
    await community.save();
    await community.populate('members.user', 'username fullName avatar');

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: (community.members || []).map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al salir de la comunidad', error: error.message });
  }
};

export const removeCommunityMember = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    const targetUserId = String(req.params?.userId || '').trim();

    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'Usuario objetivo inválido' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const currentIsOwner = String(community.createdBy?._id || community.createdBy) === String(req.userId);
    const currentEntry = getMemberEntry(community, req.userId);
    const currentIsAdmin = currentEntry?.role === 'admin';
    const canManage = currentIsOwner || currentIsAdmin;

    if (!canManage) {
      return res.status(403).json({ message: 'No tienes permisos para gestionar miembros' });
    }

    const targetIsOwner = String(community.createdBy?._id || community.createdBy) === targetUserId;
    if (targetIsOwner) {
      return res.status(400).json({ message: 'No se puede remover al owner de la comunidad' });
    }

    const targetEntry = getMemberEntry(community, targetUserId);
    if (!targetEntry) {
      return res.status(404).json({ message: 'Miembro no encontrado en la comunidad' });
    }

    if (!currentIsOwner && targetEntry.role !== 'member') {
      return res.status(403).json({ message: 'Solo el owner puede remover admins o moderadores' });
    }

    community.members = (community.members || []).filter(
      (entry) => String(entry.user?._id || entry.user) !== targetUserId
    );
    appendCommunityAuditLog(community, {
      action: 'member_removed',
      actor: req.userId,
      target: targetUserId,
      metadata: {
        removedRole: targetEntry.role || 'member'
      }
    });

    syncMembersCount(community);
    await community.save();
    await community.populate('members.user', 'username fullName avatar');

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: (community.members || []).map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al remover miembro', error: error.message });
  }
};

export const updateCommunityMemberRole = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    const targetUserId = String(req.params?.userId || '').trim();
    const nextRole = String(req.body?.role || '')
      .trim()
      .toLowerCase();

    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'Usuario objetivo inválido' });
    }
    if (!COMMUNITY_MANAGEABLE_ROLES.has(nextRole)) {
      return res.status(400).json({ message: 'Rol inválido. Roles permitidos: member, moderator, admin' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const currentIsOwner = String(community.createdBy?._id || community.createdBy) === String(req.userId);
    if (!currentIsOwner) {
      return res.status(403).json({ message: 'Solo el owner puede cambiar roles de miembros' });
    }

    const targetIsOwner = String(community.createdBy?._id || community.createdBy) === targetUserId;
    if (targetIsOwner) {
      return res.status(400).json({ message: 'No se puede cambiar el rol del owner' });
    }

    const targetEntry = getMemberEntry(community, targetUserId);
    if (!targetEntry) {
      return res.status(404).json({ message: 'Miembro no encontrado en la comunidad' });
    }

    if (targetEntry.role !== nextRole) {
      const previousRole = targetEntry.role;
      targetEntry.role = nextRole;
      appendCommunityAuditLog(community, {
        action: 'member_role_updated',
        actor: req.userId,
        target: targetUserId,
        metadata: {
          fromRole: previousRole,
          toRole: nextRole
        }
      });
      await community.save();
    }

    await community.populate('members.user', 'username fullName avatar');

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: (community.members || []).map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar rol de miembro', error: error.message });
  }
};

export const transferCommunityOwnership = async (req, res) => {
  try {
    const shortUrl = slugify(req.params?.shortUrl);
    const nextOwnerUserId = String(req.body?.newOwnerUserId || '').trim();

    if (!shortUrl) {
      return res.status(400).json({ message: 'Short URL inválida' });
    }
    if (!mongoose.Types.ObjectId.isValid(nextOwnerUserId)) {
      return res.status(400).json({ message: 'Usuario objetivo inválido' });
    }

    const community = await findCommunityBySlug(shortUrl, { populate: true });
    if (!community) {
      return res.status(404).json({ message: 'Comunidad no encontrada' });
    }

    const currentOwnerId = String(community.createdBy?._id || community.createdBy);
    if (currentOwnerId !== String(req.userId)) {
      return res.status(403).json({ message: 'Solo el owner actual puede transferir ownership' });
    }

    if (currentOwnerId === nextOwnerUserId) {
      return res.status(400).json({ message: 'Debes elegir a otro miembro como nuevo owner' });
    }

    const nextOwnerEntry = getMemberEntry(community, nextOwnerUserId);
    if (!nextOwnerEntry) {
      return res.status(400).json({ message: 'El nuevo owner debe ser miembro de la comunidad' });
    }

    const currentOwnerEntry = getMemberEntry(community, currentOwnerId);
    if (currentOwnerEntry) {
      currentOwnerEntry.role = 'admin';
    } else {
      community.members.push({
        user: currentOwnerId,
        role: 'admin',
        joinedAt: new Date()
      });
    }

    nextOwnerEntry.role = 'owner';
    community.createdBy = nextOwnerUserId;
    syncMembersCount(community);

    appendCommunityAuditLog(community, {
      action: 'ownership_transferred',
      actor: req.userId,
      target: nextOwnerUserId,
      metadata: {
        previousOwnerId: currentOwnerId,
        newOwnerId: nextOwnerUserId
      }
    });

    await community.save();
    await community.populate('createdBy', 'username fullName avatar');
    await community.populate('members.user', 'username fullName avatar');

    return res.status(200).json({
      community: {
        ...toCommunityPayload(community, req.userId),
        createdBy: toUserPayload(community.createdBy),
        members: (community.members || []).map(toCommunityMemberPayload)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al transferir ownership', error: error.message });
  }
};

const getPostForMutation = async (postId) => {
  return CommunityPost.findById(postId)
    .populate('author', 'username fullName avatar')
    .populate('comments.author', 'username fullName avatar');
};

export const getPosts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query?.limit || 30), 1), 80);
    const userId = req.userId;
    const posts = await CommunityPost.find({
      hiddenBy: { $ne: userId },
      $or: [{ privacy: { $in: ['Public', 'Friends'] } }, { author: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username fullName avatar')
      .populate('comments.author', 'username fullName avatar');

    return res.status(200).json({
      posts: posts.map((post) => toPostPayload(post, userId))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener publicaciones', error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const text = sanitizeText(req.body?.text);
    const privacy = normalizePrivacy(req.body?.privacy);
    const attachment = resolveAttachmentFromRequest(req);

    if (!text && !attachment) {
      return res.status(400).json({ message: 'Debes escribir texto o adjuntar un archivo.' });
    }

    const nextText = text || `Adjunto: ${attachment?.name || 'archivo'}`;
    const post = await CommunityPost.create({
      author: req.userId,
      text: nextText,
      privacy,
      attachment
    });

    const hydratedPost = await getPostForMutation(post._id);
    return res.status(201).json({ post: toPostPayload(hydratedPost, req.userId) });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear publicación', error: error.message });
  }
};

export const togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await getPostForMutation(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
    if (!canReadPost(post, userId)) return res.status(403).json({ message: 'No tienes acceso a esta publicación' });

    const likes = Array.isArray(post.likes) ? post.likes.map((id) => String(id)) : [];
    const idx = likes.indexOf(String(userId));
    if (idx >= 0) {
      post.likes = post.likes.filter((id) => String(id) !== String(userId));
    } else {
      post.likes.push(userId);
    }

    await post.save();
    const likedByMe = post.likes.some((id) => String(id) === String(userId));
    return res.status(200).json({
      likedByMe,
      likesCount: post.likes.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al reaccionar publicación', error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const text = sanitizeText(req.body?.text);
    const attachment = resolveAttachmentFromRequest(req);

    if (!text && !attachment) {
      return res.status(400).json({ message: 'El comentario está vacío.' });
    }

    const post = await getPostForMutation(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
    if (!canReadPost(post, userId)) return res.status(403).json({ message: 'No tienes acceso a esta publicación' });

    const nextText = text || `Adjunto: ${attachment?.name || 'archivo'}`;
    post.comments.push({
      author: userId,
      text: nextText,
      attachment,
      likes: []
    });

    await post.save();
    await post.populate('comments.author', 'username fullName avatar');

    const createdComment = post.comments[post.comments.length - 1];
    return res.status(201).json({ comment: toCommentPayload(createdComment, userId) });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear comentario', error: error.message });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;

    const post = await getPostForMutation(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
    if (!canReadPost(post, userId)) return res.status(403).json({ message: 'No tienes acceso a esta publicación' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });

    const likes = Array.isArray(comment.likes) ? comment.likes.map((id) => String(id)) : [];
    const idx = likes.indexOf(String(userId));
    if (idx >= 0) {
      comment.likes = comment.likes.filter((id) => String(id) !== String(userId));
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    const likedByMe = comment.likes.some((id) => String(id) === String(userId));
    return res.status(200).json({
      commentId: String(comment._id),
      likedByMe,
      likesCount: comment.likes.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al reaccionar comentario', error: error.message });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const reason = sanitizeText(req.body?.reason, REPORT_MAX_REASON);
    const details = sanitizeText(req.body?.details, REPORT_MAX_DETAILS);

    if (!reason) {
      return res.status(400).json({ message: 'Selecciona un motivo para reportar.' });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    const existing = Array.isArray(post.reports)
      ? post.reports.find((entry) => String(entry.user) === String(req.userId))
      : null;

    if (existing) {
      existing.reason = reason;
      existing.details = details;
      existing.createdAt = new Date();
    } else {
      post.reports.push({
        user: req.userId,
        reason,
        details,
        createdAt: new Date()
      });
    }

    await post.save();
    return res.status(200).json({ message: 'Reporte enviado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al reportar publicación', error: error.message });
  }
};

export const toggleHidePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = String(req.userId);
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    const hiddenBy = Array.isArray(post.hiddenBy) ? post.hiddenBy.map((id) => String(id)) : [];
    const hidden = hiddenBy.includes(userId);

    if (hidden) {
      post.hiddenBy = post.hiddenBy.filter((id) => String(id) !== userId);
    } else {
      post.hiddenBy.push(userId);
    }

    await post.save();
    return res.status(200).json({ hidden: !hidden });
  } catch (error) {
    return res.status(500).json({ message: 'Error al ocultar publicación', error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    if (String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: 'Solo el autor puede eliminar esta publicación' });
    }

    await CommunityPost.deleteOne({ _id: postId });
    return res.status(200).json({ message: 'Publicación eliminada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar publicación', error: error.message });
  }
};
