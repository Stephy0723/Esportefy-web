import User from "../models/User.js";

/**
 * GET /api/users/me
 * Obtener usuario logueado
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
};

/**
 * PUT /api/users/me
 * Editar perfil del usuario logueado
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      country,
      birthDate,
      selectedGames,
      experience,
      platforms,
      goals,
      username
    } = req.body;

    // ===== ARMAR OBJETO SOLO CON CAMPOS PERMITIDOS =====
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (selectedGames !== undefined) updateData.selectedGames = selectedGames;
    if (experience !== undefined) updateData.experience = experience;
    if (platforms !== undefined) updateData.platforms = platforms;
    if (goals !== undefined) updateData.goals = goals;
    if (username !== undefined) updateData.username = username;

    // ===== VALIDAR USERNAME DUPLICADO =====
    if (username) {
      const usernameExists = await User.findOne({
        username,
        _id: { $ne: req.userId }
      });

      if (usernameExists) {
        return res.status(409).json({ message: "El username ya está en uso" });
      }
    }

    // ===== ACTUALIZAR USUARIO =====
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el perfil" });
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
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la cuenta" });
  }
};
