import User from '../models/User.js';

/**
 * GET /api/users/me
 * Obtener usuario logueado
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

/**
 * PUT /api/users/me
 * Editar perfil del usuario logueado
 */
export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

/**
 * DELETE /api/users/me
 * Eliminar cuenta del usuario logueado
 */
export const deleteMe = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la cuenta' });
  }
};
