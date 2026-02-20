import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Ahora';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Ahora';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Ahora';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString();
};

const mapAttachment = (attachment) => {
  if (!attachment?.url) return { image: null, file: null };

  const mimeType = String(attachment.mimeType || '').toLowerCase();
  const isImage = mimeType.startsWith('image/');

  if (isImage) {
    return { image: attachment.url, file: null };
  }

  return {
    image: null,
    file: {
      name: attachment.name || 'Adjunto',
      url: attachment.url
    }
  };
};

const mapComment = (comment) => {
  const { image, file } = mapAttachment(comment?.attachment);
  return {
    id: String(comment?.id || ''),
    user: comment?.author?.username || comment?.author?.fullName || 'Usuario',
    avatar: comment?.author?.avatar || '',
    text: comment?.text || '',
    image,
    file,
    likes: Number(comment?.likesCount || 0),
    liked: Boolean(comment?.likedByMe),
    createdAt: comment?.createdAt || null
  };
};

const mapPost = (post) => {
  const { image, file } = mapAttachment(post?.attachment);
  return {
    id: String(post?.id || ''),
    user: post?.author?.username || post?.author?.fullName || 'Usuario',
    avatar: post?.author?.avatar || '',
    time: formatRelativeTime(post?.createdAt),
    text: post?.text || '',
    image,
    file,
    likes: Number(post?.likesCount || 0),
    liked: Boolean(post?.likedByMe),
    showComments: false,
    isOwner: Boolean(post?.isOwner),
    comments: Array.isArray(post?.comments) ? post.comments.map(mapComment) : []
  };
};

const mapCommunity = (community) => {
  return {
    id: String(community?.id || ''),
    name: community?.name || 'Comunidad',
    shortUrl: community?.shortUrl || '',
    description: community?.description || '',
    avatarUrl: community?.avatarUrl || '',
    bannerUrl: community?.bannerUrl || '',
    membersCount: Number(community?.membersCount || 0),
    region: community?.region || '',
    language: community?.language || '',
    mainGames: Array.isArray(community?.mainGames) ? community.mainGames : [],
    role: community?.role || 'guest',
    isOwner: Boolean(community?.isOwner),
    joined: Boolean(community?.joined),
    canLeave: Boolean(community?.canLeave),
    canManageMembers: Boolean(community?.canManageMembers)
  };
};

const mapCommunityMember = (member) => {
  return {
    role: member?.role || 'member',
    joinedAt: member?.joinedAt || null,
    user: {
      id: member?.user?.id || '',
      username: member?.user?.username || member?.user?.fullName || 'Usuario',
      fullName: member?.user?.fullName || member?.user?.username || 'Usuario',
      avatar: member?.user?.avatar || ''
    }
  };
};

const mapCommunityAuditLog = (entry) => {
  const metadata = entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  return {
    action: entry?.action || 'unknown',
    actor: {
      id: entry?.actor?.id || '',
      username: entry?.actor?.username || entry?.actor?.fullName || 'Usuario',
      avatar: entry?.actor?.avatar || ''
    },
    target: entry?.target
      ? {
          id: entry.target?.id || '',
          username: entry.target?.username || entry.target?.fullName || 'Usuario',
          avatar: entry.target?.avatar || ''
        }
      : null,
    metadata,
    createdAt: entry?.createdAt || null
  };
};

const buildFormData = ({ text, privacy, attachmentFile, attachmentType }) => {
  const formData = new FormData();
  if (text && String(text).trim()) formData.append('text', String(text).trim());
  if (privacy) formData.append('privacy', String(privacy));
  if (attachmentFile) formData.append('attachment', attachmentFile);
  if (attachmentType) formData.append('attachmentType', String(attachmentType));
  return formData;
};

export const fetchCommunityPosts = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/community/posts`);
  const list = Array.isArray(response.data?.posts) ? response.data.posts : [];
  return list.map(mapPost);
};

export const publishCommunityPost = async ({ text, privacy, attachmentFile, attachmentType }) => {
  const payload = buildFormData({ text, privacy, attachmentFile, attachmentType });
  const response = await axios.post(`${API_BASE_URL}/api/community/posts`, payload);
  return mapPost(response.data?.post || {});
};

export const toggleCommunityPostLike = async (postId) => {
  const response = await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/like`, {});
  return {
    likedByMe: Boolean(response.data?.likedByMe),
    likesCount: Number(response.data?.likesCount || 0)
  };
};

export const publishCommunityComment = async (postId, { text, attachmentFile, attachmentType }) => {
  const payload = buildFormData({ text, attachmentFile, attachmentType });
  const response = await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/comments`, payload);
  return mapComment(response.data?.comment || {});
};

export const toggleCommunityCommentLike = async (postId, commentId) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}/like`,
    {}
  );
  return {
    likedByMe: Boolean(response.data?.likedByMe),
    likesCount: Number(response.data?.likesCount || 0)
  };
};

export const reportCommunityPost = async (postId, payload) => {
  await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/report`, payload);
};

export const hideCommunityPost = async (postId) => {
  const response = await axios.post(`${API_BASE_URL}/api/community/posts/${postId}/hide`, {});
  return Boolean(response.data?.hidden);
};

export const deleteCommunityPost = async (postId) => {
  await axios.delete(`${API_BASE_URL}/api/community/posts/${postId}`);
};

export const fetchMyCommunities = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/community/communities/mine`);
  const list = Array.isArray(response.data?.communities) ? response.data.communities : [];
  return list.map(mapCommunity);
};

export const createCommunitySpace = async ({ formData, media, admins }) => {
  const payload = new FormData();
  payload.append('name', formData?.name || '');
  payload.append('shortUrl', formData?.shortUrl || '');
  payload.append('description', formData?.description || '');
  payload.append('type', formData?.type || '');
  payload.append('targetAudience', formData?.targetAudience || '');
  payload.append('language', formData?.language || '');
  payload.append('region', formData?.region || '');
  payload.append('launchDate', formData?.launchDate || '');

  payload.append('mainGames', JSON.stringify(Array.isArray(formData?.mainGames) ? formData.mainGames : []));
  payload.append('allowAllGames', String(Boolean(formData?.allowAllGames)));
  payload.append('contentCategories', JSON.stringify(formData?.contentCategories || {}));
  payload.append('contentProhibited', formData?.contentProhibited || '');

  payload.append('postTypes', JSON.stringify(formData?.postTypes || {}));
  payload.append('whoCanPost', formData?.whoCanPost || 'all');
  payload.append('allowComments', String(Boolean(formData?.allowComments)));
  payload.append('preModeration', String(Boolean(formData?.preModeration)));
  payload.append('allowReactions', String(Boolean(formData?.allowReactions)));
  payload.append('allowShare', String(Boolean(formData?.allowShare)));

  payload.append('roles', JSON.stringify(formData?.roles || {}));
  payload.append('rulesText', formData?.rulesText || '');
  payload.append('toxicityFilter', String(Boolean(formData?.toxicityFilter)));
  payload.append('spoilerTag', String(Boolean(formData?.spoilerTag)));
  payload.append('nsfwAllowed', String(Boolean(formData?.nsfwAllowed)));
  payload.append('reportReasons', JSON.stringify(formData?.reportReasons || {}));
  payload.append('emailVerification', String(Boolean(formData?.emailVerification)));
  payload.append('antiSpamControl', String(Boolean(formData?.antiSpamControl)));
  payload.append('discordIntegration', String(Boolean(formData?.discordIntegration)));
  payload.append('welcomeEmail', String(Boolean(formData?.welcomeEmail)));
  payload.append('futureEvents', String(Boolean(formData?.futureEvents)));
  payload.append('futureTournaments', String(Boolean(formData?.futureTournaments)));

  payload.append('admins', JSON.stringify(Array.isArray(admins) ? admins : []));

  if (media?.banner?.file) payload.append('banner', media.banner.file);
  if (media?.avatar?.file) payload.append('avatar', media.avatar.file);
  if (media?.rulesPdf?.file) payload.append('rulesPdf', media.rulesPdf.file);

  const response = await axios.post(`${API_BASE_URL}/api/community/communities`, payload);
  return mapCommunity(response.data?.community || {});
};

export const fetchCommunityByShortUrl = async (shortUrl) => {
  const response = await axios.get(`${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}`);
  const community = response.data?.community || {};
  return {
    ...mapCommunity(community),
    description: community?.description || '',
    createdBy: {
      id: community?.createdBy?.id || '',
      username: community?.createdBy?.username || community?.createdBy?.fullName || 'Usuario',
      avatar: community?.createdBy?.avatar || ''
    },
    members: Array.isArray(community?.members) ? community.members.map(mapCommunityMember) : [],
    rulesPdfUrl: community?.rulesPdfUrl || '',
    rulesPdfName: community?.rulesPdfName || ''
  };
};

const mapCommunityDetailFromResponse = (response) => {
  const community = response?.data?.community || {};
  return {
    ...mapCommunity(community),
    description: community?.description || '',
    createdBy: {
      id: community?.createdBy?.id || '',
      username: community?.createdBy?.username || community?.createdBy?.fullName || 'Usuario',
      avatar: community?.createdBy?.avatar || ''
    },
    members: Array.isArray(community?.members) ? community.members.map(mapCommunityMember) : [],
    rulesPdfUrl: community?.rulesPdfUrl || '',
    rulesPdfName: community?.rulesPdfName || ''
  };
};

export const joinCommunityByShortUrl = async (shortUrl) => {
  const response = await axios.post(`${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/join`, {});
  return mapCommunityDetailFromResponse(response);
};

export const leaveCommunityByShortUrl = async (shortUrl) => {
  const response = await axios.post(`${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/leave`, {});
  return mapCommunityDetailFromResponse(response);
};

export const removeMemberFromCommunityByShortUrl = async (shortUrl, userId) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/members/${encodeURIComponent(userId)}`
  );
  return mapCommunityDetailFromResponse(response);
};

export const updateMemberRoleInCommunityByShortUrl = async (shortUrl, userId, role) => {
  const response = await axios.patch(
    `${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/members/${encodeURIComponent(userId)}/role`,
    { role }
  );
  return mapCommunityDetailFromResponse(response);
};

export const transferCommunityOwnershipByShortUrl = async (shortUrl, newOwnerUserId) => {
  const response = await axios.patch(
    `${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/owner/transfer`,
    { newOwnerUserId }
  );
  return mapCommunityDetailFromResponse(response);
};

export const fetchCommunityAuditLogsByShortUrl = async (shortUrl, limit = 40) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/community/communities/${encodeURIComponent(shortUrl)}/audit-logs`,
    {
      params: { limit }
    }
  );
  const list = Array.isArray(response.data?.auditLogs) ? response.data.auditLogs : [];
  return list.map(mapCommunityAuditLog);
};
