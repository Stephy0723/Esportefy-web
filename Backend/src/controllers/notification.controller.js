import User from '../models/User.js';

export const getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('notifications');
        return res.status(200).json(user?.notifications || []);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        const note = user.notifications.id(id);
        if (!note) return res.status(404).json({ message: 'Notificación no encontrada' });
        note.status = 'read';
        await user.save();
        return res.status(200).json({ message: 'Notificación actualizada' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
    }
};
