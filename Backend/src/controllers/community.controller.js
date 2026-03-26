import fs from 'fs';
import path from 'path';
import multer from 'multer';
import mongoose from 'mongoose';
import CommunityPost from '../models/CommunityPost.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import { normalizeCommunityGameId, normalizeCommunityGameIds, getGameNameVariants } from '../utils/communityGames.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import {
  COMMUNITY_CONTENT_CATEGORY_KEYS,
  COMMUNITY_MANAGEABLE_ROLE_KEYS,
  COMMUNITY_POST_TYPE_KEYS,
  COMMUNITY_REPORT_REASON_KEYS,
  COMMUNITY_ROLE_KEYS,
  COMMUNITY_SOCIAL_LINK_KEYS,
  normalizeCommunityGameName,
  normalizeCommunityGameNames,
  normalizeCommunityMemberRole
} from '../../../shared/communityCatalog.js';

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
const COMMUNITY_MANAGEABLE_ROLES = new Set(COMMUNITY_MANAGEABLE_ROLE_KEYS);
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

const sanitizeUrl = (value, maxLength = 240) => {
  const raw = String(value || '').trim().slice(0, maxLength);
  if (!raw) return '';

  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;

  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch (_) {
    return '';
  }
};

const parseCommunitySocialLinks = (value) => {
  const raw = parseJsonField(value, {});
  if (!raw || typeof raw !== 'object') return {};

  return COMMUNITY_SOCIAL_LINK_KEYS.reduce((acc, key) => {
    const normalized = sanitizeUrl(raw[key]);
    if (normalized) acc[key] = normalized;
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

const COMMUNITY_USER_SELECT = 'username fullName avatar connections.steam.avatar';

const resolveUserAvatar = (userDoc) => {
  const candidates = [
    userDoc?.avatar,
    userDoc?.connections?.steam?.avatar
  ];

  return candidates.find((value) => String(value || '').trim()) || '';
};

const toUserPayload = (userDoc) => {
  if (!userDoc) return { id: null, username: 'Usuario', fullName: 'Usuario', avatar: '' };
  return {
    id: String(userDoc._id || ''),
    username: userDoc.username || userDoc.fullName || 'Usuario',
    fullName: userDoc.fullName || userDoc.username || 'Usuario',
    avatar: resolveUserAvatar(userDoc)
  };
};

/* ─── Mention & Hashtag parsing ─── */
const MENTION_REGEX = /@([a-zA-Z0-9_.-]{2,30})/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ_]{1,40})/g;

const extractMentionUsernames = (text) => {
  if (!text) return [];
  const matches = [...text.matchAll(MENTION_REGEX)];
  return [...new Set(matches.map((m) => m[1].toLowerCase()))];
};

const extractHashtags = (text) => {
  if (!text) return [];
  const matches = [...text.matchAll(HASHTAG_REGEX)];
  return [...new Set(matches.map((m) => m[1].toLowerCase()))];
};

const resolveMentionedUsers = async (usernames) => {
  if (!usernames.length) return [];
  const regexArr = usernames.map((u) => new RegExp(`^${u}$`, 'i'));
  return User.find({ username: { $in: regexArr } }).select('_id username').lean();
};

const sendMentionNotifications = async (mentionedUsers, authorId, authorUsername, postId, textSnippet) => {
  const snippet = (textSnippet || '').slice(0, 100);
  const bulkOps = mentionedUsers
    .filter((u) => String(u._id) !== String(authorId))
    .map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: {
          $push: {
            notifications: {
              type: 'social',
              category: 'social',
              title: `${authorUsername} te mencionó`,
              source: 'Hub',
              message: snippet ? `"${snippet}..."` : 'Te mencionaron en una publicación',
              status: 'unread',
              meta: { postId: String(postId), authorId: String(authorId) },
              visuals: { icon: 'bx-at', color: '#f093fb', glow: false },
              createdAt: new Date()
            }
          }
        }
      }
    }));
  if (bulkOps.length) await User.bulkWrite(bulkOps);
};

const sendReplyNotification = async (originalAuthorId, replierUsername, postId, textSnippet) => {
  const snippet = (textSnippet || '').slice(0, 100);
  await User.updateOne(
    { _id: originalAuthorId },
    {
      $push: {
        notifications: {
          type: 'social',
          category: 'social',
          title: `${replierUsername} respondió a tu mensaje`,
          source: 'Hub',
          message: snippet ? `"${snippet}..."` : 'Tienes una nueva respuesta',
          status: 'unread',
          meta: { postId: String(postId) },
          visuals: { icon: 'bx-reply', color: '#4facfe', glow: false },
          createdAt: new Date()
        }
      }
    }
  );
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

  let replyToData = null;
  if (postDoc.replyTo) {
    const rt = postDoc.replyTo;
    if (rt._id) {
      replyToData = {
        id: String(rt._id),
        author: toUserPayload(rt.author),
        text: (rt.text || '').slice(0, 120)
      };
    } else {
      replyToData = { id: String(rt) };
    }
  }

  return {
    id: String(postDoc._id),
    author: toUserPayload(postDoc.author),
    text: postDoc.text || '',
    privacy: postDoc.privacy || 'Public',
    attachment: postDoc.attachment || null,
    replyTo: replyToData,
    mentions: Array.isArray(postDoc.mentions) ? postDoc.mentions.map((m) => (m._id ? toUserPayload(m) : String(m))) : [],
    hashtags: Array.isArray(postDoc.hashtags) ? postDoc.hashtags : [],
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
  const ownRole = normalizeCommunityMemberRole(ownMemberEntry?.role, '');
  const isAdmin = ownRole === 'admin';
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
    mainGames: normalizeCommunityGameNames(communityDoc.mainGames),
    socialLinks: COMMUNITY_SOCIAL_LINK_KEYS.reduce((acc, key) => {
      const value = String(communityDoc.socialLinks?.[key] || '').trim();
      if (value) acc[key] = value;
      return acc;
    }, {}),
    createdAt: communityDoc.createdAt,
    isOwner,
    joined,
    canLeave: joined && !isOwner,
    canManageMembers: isOwner || isAdmin,
    role: isOwner ? 'owner' : ownRole || 'guest'
  };
};

const toCommunityMemberPayload = (memberDoc) => {
  return {
    role: normalizeCommunityMemberRole(memberDoc?.role, 'member'),
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

const getNormalizedUserGameSubscriptions = (userDoc) =>
  normalizeCommunityGameIds(userDoc?.communityGameSubscriptions || []);

const buildGameHubStatsPayload = ({ gameId, usersCount = 0, activeCount = 0, joined = false }) => ({
  gameId,
  usersCount: Number(usersCount || 0),
  activeCount: Number(activeCount || 0),
  joined: Boolean(joined)
});

const aggregateCommunityGameSubscriptions = async () => {
  const rows = await User.aggregate([
    {
      $project: {
        communityGameSubscriptions: {
          $ifNull: ['$communityGameSubscriptions', []]
        }
      }
    },
    { $unwind: '$communityGameSubscriptions' },
    {
      $group: {
        _id: '$communityGameSubscriptions',
        usersCount: { $sum: 1 }
      }
    }
  ]);

  return rows.reduce((acc, row) => {
    const gameId = normalizeCommunityGameId(row?._id || '');
    if (!gameId) return acc;
    acc[gameId] = buildGameHubStatsPayload({
      gameId,
      usersCount: row?.usersCount || 0,
      activeCount: row?.usersCount || 0,
      joined: false
    });
    return acc;
  }, {});
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

    mainGames: normalizeCommunityGameNames(parseStringArrayField(body?.mainGames, 5)),
    allowAllGames: toBoolean(body?.allowAllGames, false),
    contentCategories: parseBooleanMap(body?.contentCategories, COMMUNITY_CONTENT_CATEGORY_KEYS),
    contentProhibited: sanitizeText(body?.contentProhibited, 600),

    postTypes: parseBooleanMap(body?.postTypes, COMMUNITY_POST_TYPE_KEYS),
    whoCanPost: ['all', 'verified', 'staff'].includes(body?.whoCanPost) ? body.whoCanPost : 'all',
    allowComments: toBoolean(body?.allowComments, true),
    preModeration: toBoolean(body?.preModeration, false),
    allowReactions: toBoolean(body?.allowReactions, true),
    allowShare: toBoolean(body?.allowShare, true),

    roles: parseBooleanMap(body?.roles, COMMUNITY_ROLE_KEYS),
    rulesText: sanitizeText(body?.rulesText, 6000),
    toxicityFilter: toBoolean(body?.toxicityFilter, true),
    spoilerTag: toBoolean(body?.spoilerTag, true),
    nsfwAllowed: toBoolean(body?.nsfwAllowed, false),
    reportReasons: parseBooleanMap(body?.reportReasons, COMMUNITY_REPORT_REASON_KEYS),
    emailVerification: toBoolean(body?.emailVerification, true),
    antiSpamControl: toBoolean(body?.antiSpamControl, true),
    discordIntegration: toBoolean(body?.discordIntegration, false),
    welcomeEmail: toBoolean(body?.welcomeEmail, true),
    futureEvents: toBoolean(body?.futureEvents, false),
    futureTournaments: toBoolean(body?.futureTournaments, false),
    admins: normalizeAdmins(body?.admins),
    socialLinks: parseCommunitySocialLinks(body?.socialLinks)
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
      socialLinks: parsed.socialLinks,
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

export const listCommunities = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 100);
    const search = (req.query?.search || '').trim();
    const game = (req.query?.game || '').trim();

    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (game && game !== 'all') {
      filter.mainGames = { $in: [normalizeCommunityGameName(game) || game] };
    }

    const communities = await Community.find(filter)
      .sort({ membersCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'username fullName avatar');

    return res.status(200).json({
      communities: communities.map((c) => ({
        ...toCommunityPayload(c, req.userId),
        createdBy: toUserPayload(c.createdBy),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar comunidades', error: error.message });
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
    const currentIsAdmin = normalizeCommunityMemberRole(currentEntry?.role, '') === 'admin';
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
        previousRole: normalizeCommunityMemberRole(leavingEntry?.role, 'member')
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
    const currentIsAdmin = normalizeCommunityMemberRole(currentEntry?.role, '') === 'admin';
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

    const targetRole = normalizeCommunityMemberRole(targetEntry.role, 'member');

    if (!currentIsOwner && targetRole !== 'member') {
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
        removedRole: targetRole
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
    const nextRole = normalizeCommunityMemberRole(req.body?.role, '');

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

    const currentRole = normalizeCommunityMemberRole(targetEntry.role, 'member');

    if (currentRole !== nextRole) {
      const previousRole = currentRole;
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

export const getGameHubStatsIndex = async (req, res) => {
  try {
    const [viewer, aggregatedStats] = await Promise.all([
      User.findById(req.userId).select('communityGameSubscriptions').lean(),
      aggregateCommunityGameSubscriptions()
    ]);

    const joinedGameIds = getNormalizedUserGameSubscriptions(viewer);
    const allGameIds = new Set([
      ...Object.keys(aggregatedStats),
      ...joinedGameIds
    ]);

    const stats = Array.from(allGameIds)
      .sort((a, b) => String(a).localeCompare(String(b), 'es'))
      .map((gameId) => {
        const base = aggregatedStats[gameId] || buildGameHubStatsPayload({ gameId });
        return buildGameHubStatsPayload({
          ...base,
          gameId,
          joined: joinedGameIds.includes(gameId)
        });
      });

    return res.status(200).json({ stats });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener estadisticas de juegos', error: error.message });
  }
};

export const getGameHubStats = async (req, res) => {
  try {
    const gameId = normalizeCommunityGameId(req.params?.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'Juego invalido' });
    }

    const [viewer, aggregatedStats] = await Promise.all([
      User.findById(req.userId).select('communityGameSubscriptions').lean(),
      aggregateCommunityGameSubscriptions()
    ]);

    const joinedGameIds = getNormalizedUserGameSubscriptions(viewer);
    const base = aggregatedStats[gameId] || buildGameHubStatsPayload({ gameId });

    return res.status(200).json({
      stats: buildGameHubStatsPayload({
        ...base,
        gameId,
        joined: joinedGameIds.includes(gameId)
      })
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener estadisticas del juego', error: error.message });
  }
};

export const joinGameHub = async (req, res) => {
  try {
    const gameId = normalizeCommunityGameId(req.params?.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'Juego invalido' });
    }

    const user = await User.findById(req.userId).select('communityGameSubscriptions');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const currentSubscriptions = getNormalizedUserGameSubscriptions(user);
    const alreadyJoined = currentSubscriptions.includes(gameId);

    if (!alreadyJoined) {
      user.communityGameSubscriptions = normalizeCommunityGameIds([
        ...currentSubscriptions,
        gameId
      ]);
      await user.save();
    }

    const usersCount = await User.countDocuments({ communityGameSubscriptions: gameId });

    return res.status(200).json({
      stats: buildGameHubStatsPayload({
        gameId,
        usersCount,
        activeCount: usersCount,
        joined: true
      }),
      alreadyJoined
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al unirse al hub del juego', error: error.message });
  }
};

// ── GET /api/community/games/:gameId/details ──────────────────────
export const getGameHubDetails = async (req, res) => {
  try {
    const gameId = normalizeCommunityGameId(req.params?.gameId);
    if (!gameId) {
      return res.status(400).json({ message: 'Juego invalido' });
    }

    const nameVariants = getGameNameVariants(gameId);
    // Build regex that matches any variant (case-insensitive)
    const escapedVariants = nameVariants.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const variantsRegex = new RegExp(`^(${escapedVariants.join('|')})$`, 'i');

    const viewer = await User.findById(req.userId).select('communityGameSubscriptions').lean();
    const joinedIds = getNormalizedUserGameSubscriptions(viewer);

    const [aggregatedStats, teams, tournaments, communities] = await Promise.all([
      aggregateCommunityGameSubscriptions(),

      Team.find({ game: { $regex: variantsRegex } })
        .populate('captain', 'username fullName avatar')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),

      Tournament.find({ game: { $regex: variantsRegex }, status: { $ne: 'draft' } })
        .populate('organizer', 'username fullName avatar')
        .sort({ date: -1 })
        .limit(12)
        .lean(),

      Community.find({ mainGames: { $in: nameVariants }, isActive: true })
        .sort({ membersCount: -1 })
        .limit(12)
        .lean(),
    ]);

    const baseStats = aggregatedStats[gameId] || buildGameHubStatsPayload({ gameId });
    const stats = buildGameHubStatsPayload({
      ...baseStats,
      gameId,
      joined: joinedIds.includes(gameId),
    });

    // Map teams
    const mappedTeams = teams.map((t) => ({
      id: t._id,
      name: t.name,
      teamCode: t.teamCode || '',
      game: t.game || '',
      logo: t.logo || '',
      category: t.category || '',
      country: t.teamCountry || '',
      level: t.teamLevel || '',
      startersCount: Array.isArray(t.roster?.starters) ? t.roster.starters.filter((p) => p?.user).length : 0,
      subsCount: Array.isArray(t.roster?.subs) ? t.roster.subs.filter((p) => p?.user).length : 0,
      captain: t.captain
        ? { id: t.captain._id, username: t.captain.username || t.captain.fullName || '', avatar: t.captain.avatar || '' }
        : null,
    }));

    // Map tournaments
    const mappedTournaments = tournaments.map((t) => ({
      id: t._id,
      code: t.tournamentId || '',
      title: t.title || '',
      game: t.game || '',
      status: t.status || 'open',
      date: t.date || null,
      prizePool: t.prizePool || '',
      prizeMode: t.prizeMode || 'none',
      currency: t.currency || 'USD',
      format: t.format || '',
      modality: t.modality || '',
      platform: t.platform || '',
      maxSlots: t.maxSlots || 0,
      currentSlots: t.currentSlots || 0,
      registeredTeams: Array.isArray(t.registrations) ? t.registrations.length : 0,
      organizer: t.organizer
        ? { id: t.organizer._id, username: t.organizer.username || t.organizer.fullName || '', avatar: t.organizer.avatar || '' }
        : null,
    }));

    // Map communities
    const mappedCommunities = communities.map((c) => ({
      id: c._id,
      name: c.name || '',
      shortUrl: c.shortUrl || '',
      description: c.description || '',
      membersCount: c.membersCount || 0,
      avatarUrl: c.avatarUrl || '',
      bannerUrl: c.bannerUrl || '',
      mainGames: Array.isArray(c.mainGames) ? c.mainGames : [],
      region: c.region || '',
    }));

    // Extract unique organizers from tournaments
    const organizerMap = new Map();
    for (const t of mappedTournaments) {
      if (!t.organizer?.id) continue;
      const key = String(t.organizer.id);
      if (!organizerMap.has(key)) {
        organizerMap.set(key, { ...t.organizer, tournamentsCount: 0 });
      }
      organizerMap.get(key).tournamentsCount += 1;
    }
    const mappedOrganizers = Array.from(organizerMap.values());

    return res.status(200).json({
      stats,
      teams: mappedTeams,
      tournaments: mappedTournaments,
      communities: mappedCommunities,
      organizers: mappedOrganizers,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener detalles del hub', error: error.message });
  }
};

const getPostForMutation = async (postId) => {
  return CommunityPost.findById(postId)
    .populate('author', COMMUNITY_USER_SELECT)
    .populate('comments.author', COMMUNITY_USER_SELECT)
    .populate('replyTo', 'author text')
    .populate({ path: 'replyTo', populate: { path: 'author', select: COMMUNITY_USER_SELECT } })
    .populate('mentions', COMMUNITY_USER_SELECT);
};

export const getPosts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query?.limit || 30), 1), 80);
    const userId = req.userId;
    const requestedShortUrl = slugify(req.query?.shortUrl || req.query?.community || '');
    let communityFilter = null;

    if (requestedShortUrl) {
      const community = await findCommunityBySlug(requestedShortUrl);
      if (!community) {
        return res.status(404).json({ message: 'Comunidad no encontrada' });
      }
      communityFilter = community._id;
    }

    const posts = await CommunityPost.find({
      community: communityFilter,
      hiddenBy: { $ne: userId },
      $or: [{ privacy: { $in: ['Public', 'Friends'] } }, { author: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', COMMUNITY_USER_SELECT)
      .populate('comments.author', COMMUNITY_USER_SELECT)
      .populate('replyTo', 'author text')
      .populate({ path: 'replyTo', populate: { path: 'author', select: COMMUNITY_USER_SELECT } })
      .populate('mentions', COMMUNITY_USER_SELECT);

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
    const replyToId = req.body?.replyTo || null;
    const requestedShortUrl = slugify(req.body?.shortUrl || req.body?.communityShortUrl || req.query?.shortUrl || '');

    if (!text && !attachment) {
      return res.status(400).json({ message: 'Debes escribir texto o adjuntar un archivo.' });
    }

    const nextText = text || `Adjunto: ${attachment?.name || 'archivo'}`;

    // Parse mentions & hashtags
    const mentionUsernames = extractMentionUsernames(nextText);
    const hashtags = extractHashtags(nextText);
    const mentionedUsers = await resolveMentionedUsers(mentionUsernames);
    const mentionIds = mentionedUsers.map((u) => u._id);

    // Validate replyTo if provided
    let replyTo = null;
    let community = null;
    if (replyToId && mongoose.Types.ObjectId.isValid(replyToId)) {
      const parentPost = await CommunityPost.findById(replyToId).select('author community').lean();
      if (parentPost) {
        replyTo = parentPost._id;
        community = parentPost.community || null;
      }
    }

    if (!community && requestedShortUrl) {
      const communityDoc = await findCommunityBySlug(requestedShortUrl);
      if (!communityDoc) {
        return res.status(404).json({ message: 'Comunidad no encontrada' });
      }

      const isOwner = String(communityDoc.createdBy) === String(req.userId);
      const memberEntry = getMemberEntry(communityDoc, req.userId);
      if (!isOwner && !memberEntry) {
        return res.status(403).json({ message: 'Debes pertenecer a esta comunidad para publicar.' });
      }

      community = communityDoc._id;
    }

    const post = await CommunityPost.create({
      author: req.userId,
      community,
      text: nextText,
      privacy,
      attachment,
      replyTo,
      mentions: mentionIds,
      hashtags
    });

    // Send mention notifications (non-blocking)
    if (mentionedUsers.length) {
      const author = await User.findById(req.userId).select('username').lean();
      sendMentionNotifications(mentionedUsers, req.userId, author?.username || 'Alguien', post._id, nextText).catch(() => {});
    }

    // Send reply notification (non-blocking)
    if (replyTo) {
      const parentPost = await CommunityPost.findById(replyTo).select('author').lean();
      if (parentPost && String(parentPost.author) !== String(req.userId)) {
        const author = await User.findById(req.userId).select('username').lean();
        sendReplyNotification(parentPost.author, author?.username || 'Alguien', post._id, nextText).catch(() => {});
      }
    }

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
    await post.populate('comments.author', COMMUNITY_USER_SELECT);

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

/* ─── Block / Unblock user ─── */
export const blockUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (String(targetId) === String(req.userId)) {
      return res.status(400).json({ message: 'No puedes bloquearte a ti mismo' });
    }
    const target = await User.findById(targetId).select('_id username').lean();
    if (!target) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = await User.findById(req.userId);
    const blocked = (user.blockedUsers || []).map((id) => String(id));
    if (blocked.includes(String(targetId))) {
      return res.status(200).json({ message: 'Usuario ya bloqueado', blocked: true });
    }
    user.blockedUsers.push(targetId);
    await user.save();
    return res.status(200).json({ message: `${target.username} bloqueado`, blocked: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error al bloquear usuario', error: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const user = await User.findById(req.userId);
    user.blockedUsers = (user.blockedUsers || []).filter((id) => String(id) !== String(targetId));
    await user.save();
    return res.status(200).json({ message: 'Usuario desbloqueado', blocked: false });
  } catch (error) {
    return res.status(500).json({ message: 'Error al desbloquear usuario', error: error.message });
  }
};

/* ─── Search users (for @mention autocomplete) ─── */
export const searchUsers = async (req, res) => {
  try {
    const q = String(req.query?.q || '').trim();
    if (q.length < 2) return res.status(200).json({ users: [] });

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      isBanned: { $ne: true }
    })
      .select(`_id ${COMMUNITY_USER_SELECT}`)
      .limit(8)
      .lean();

    return res.status(200).json({
      users: users.map((u) => ({ id: String(u._id), username: u.username, avatar: resolveUserAvatar(u) }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
  }
};

/* ─── Get replies to a post ─── */
export const getReplies = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const limit = Math.min(Math.max(Number(req.query?.limit || 20), 1), 50);

    const replies = await CommunityPost.find({
      replyTo: postId,
      hiddenBy: { $ne: userId }
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('author', COMMUNITY_USER_SELECT)
      .populate('replyTo', 'author text')
      .populate({ path: 'replyTo', populate: { path: 'author', select: COMMUNITY_USER_SELECT } })
      .populate('mentions', COMMUNITY_USER_SELECT);

    return res.status(200).json({
      replies: replies.map((r) => toPostPayload(r, userId))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener respuestas', error: error.message });
  }
};
