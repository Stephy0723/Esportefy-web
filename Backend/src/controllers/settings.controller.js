import User from "../models/User.js";


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


