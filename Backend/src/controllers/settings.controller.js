import User from "../models/User.js";
import AdminAuditLog from '../models/AdminAuditLog.js';


export const getSettings = async (req, res) => {
  const user = await User.findById(req.userId).select("privacy");
  res.json(user);
};

export const updatePrivacy = async (req, res) => {
  const { privacy } = req.body;

  const user = await User.findByIdAndUpdate(
    req.userId,
    { privacy },
    { new: true }
  ).select("privacy");

  res.json(user);
};


export const updateConnections = async (req, res) => {
  try {
    const { provider, data } = req.body;

    const update = {
      [`connections.${provider}`]: {
        ...data,
        verified: false
      }
    };

    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).select('connections');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar conexiones" });
  }
};

export const updateConnection = async (req, res) => {
  const { provider, data } = req.body;

  if (!['discord', 'riot', 'steam', 'mlbb'].includes(provider)) {
    return res.status(400).json({ message: 'Proveedor no válido' });
  }

  const update = {
    [`connections.${provider}`]: {
      ...data,
      verified: false
    }
  };

  const user = await User.findByIdAndUpdate(
    req.userId,
    update,
    { new: true }
  ).select('connections');

  res.json(user.connections);
};

export const getAdminAuditLogs = async (req, res) => {
  try {
    const actor = await User.findById(req.userId).select('isAdmin');
    if (!actor?.isAdmin) {
      return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
    }

    const rawLimit = Number(req.query?.limit);
    const rawPage = Number(req.query?.page);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.trunc(rawLimit))) : 50;
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
    const skip = (page - 1) * limit;

    const action = String(req.query?.action || '').trim();
    const entityType = String(req.query?.entityType || '').trim();

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const [total, rows] = await Promise.all([
      AdminAuditLog.countDocuments(filter),
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('actorUserId action entityType entityId meta ip userAgent createdAt')
    ]);

    return res.json({
      total,
      page,
      limit,
      items: rows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo auditoría admin.' });
  }
};

