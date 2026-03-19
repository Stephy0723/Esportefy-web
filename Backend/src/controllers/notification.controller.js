import User from '../models/User.js';

export const getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('notifications');
        const notifications = Array.isArray(user?.notifications) ? [...user.notifications] : [];
        notifications.sort(
            (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        );
        return res.status(200).json(notifications);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        const note = user.notifications.id(id);
        if (!note) return res.status(404).json({ message: 'Notificación no encontrada' });
        note.deleteOne();
        await user.save();
        return res.status(200).json({ message: 'Notificación eliminada' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar notificación', error: error.message });
    }
};

export const clearAllNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        user.notifications = [];
        await user.save();
        return res.status(200).json({ message: 'Todas las notificaciones eliminadas' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al limpiar notificaciones', error: error.message });
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
        return res.status(200).json({ message: 'Notificación actualizada', notification: note });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        if (!Array.isArray(user.notifications) || user.notifications.length === 0) {
            return res.status(200).json({ message: 'Sin notificaciones', updated: 0 });
        }
        let updated = 0;
        user.notifications.forEach((n) => {
            if (n.status !== 'read') {
                n.status = 'read';
                updated += 1;
            }
        });
        await user.save();
        return res.status(200).json({ message: 'Notificaciones actualizadas', updated });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar notificaciones', error: error.message });
    }
};

export const toggleNotificationSaved = async (req, res) => {
    try {
        const { id } = req.params;
        const { saved } = req.body || {};
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        const note = user.notifications.id(id);
        if (!note) return res.status(404).json({ message: 'Notificación no encontrada' });
        note.isSaved = typeof saved === 'boolean' ? saved : !note.isSaved;
        await user.save();
        return res.status(200).json({ message: 'Notificación actualizada', notification: note });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
    }
};

export const toggleNotificationArchived = async (req, res) => {
    try {
        const { id } = req.params;
        const { archived } = req.body || {};
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        const note = user.notifications.id(id);
        if (!note) return res.status(404).json({ message: 'Notificación no encontrada' });
        note.isArchived = typeof archived === 'boolean' ? archived : !note.isArchived;
        if (note.isArchived) note.status = 'read';
        await user.save();
        return res.status(200).json({ message: 'Notificación actualizada', notification: note });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
    }
};

/* ═══════════════════════════════════════
   TEST-ALL — genera todas las notificaciones de prueba
   ═══════════════════════════════════════ */
export const sendTestAllNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const testNotifications = [
            // ── SISTEMA ──
            {
                type: 'info', category: 'system',
                title: 'Bienvenido a GlitchGang',
                source: 'Sistema',
                message: 'Tu cuenta ha sido creada exitosamente. Explora las funciones disponibles, crea equipos, únete a torneos y conecta con otros jugadores.',
                visuals: { icon: 'bx-rocket', color: '#8EDB15', glow: true }
            },
            {
                type: 'info', category: 'system',
                title: 'Actualización de plataforma v2.5',
                source: 'Sistema',
                message: 'Nuevas funciones disponibles: chat en tiempo real, calendario de partidas, integración con Riot Games y Discord. ¡Descúbrelas ahora!',
                visuals: { icon: 'bx-revision', color: '#4facfe', glow: false }
            },
            {
                type: 'danger', category: 'system',
                title: 'Verificación de correo pendiente',
                source: 'Seguridad',
                message: 'Por favor verifica tu correo electrónico para desbloquear todas las funciones de la plataforma. Revisa tu bandeja de entrada.',
                visuals: { icon: 'bx-envelope', color: '#ff6b6b', glow: false }
            },
            {
                type: 'info', category: 'system',
                title: 'Mantenimiento programado',
                source: 'Sistema',
                message: 'La plataforma estará en mantenimiento el próximo sábado de 3:00 AM a 5:00 AM (hora CDMX). Disculpa las molestias.',
                visuals: { icon: 'bx-wrench', color: '#ffa726', glow: false }
            },

            // ── EQUIPOS ──
            {
                type: 'team', category: 'team',
                title: 'Nuevo equipo creado: Shadow Wolves',
                source: 'Equipos',
                message: 'Tu equipo "Shadow Wolves" ha sido creado exitosamente. Categoría: FPS — Juego: Valorant. Comparte el código de invitación con tus compañeros.',
                visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
            },
            {
                type: 'team', category: 'team',
                title: 'Solicitud de unión recibida',
                source: 'Shadow Wolves',
                message: 'El jugador "xDragon_99" quiere unirse a tu equipo como Starter (Slot: Duelist). Revisa la solicitud en el panel de tu equipo.',
                visuals: { icon: 'bx-user-plus', color: '#4facfe', glow: false }
            },
            {
                type: 'team', category: 'team',
                title: 'Miembro aceptado en el equipo',
                source: 'Shadow Wolves',
                message: '"ProSniper_MX" ha sido aceptado como suplente en tu equipo. Ahora tienen 4/5 titulares y 1/2 suplentes.',
                visuals: { icon: 'bx-check-circle', color: '#06d6a0', glow: false }
            },
            {
                type: 'team', category: 'team',
                title: 'Te han invitado a un equipo',
                source: 'Phoenix Rising',
                message: 'El equipo "Phoenix Rising" (League of Legends — Semi-Pro) te ha enviado una invitación para unirte como ADC.',
                visuals: { icon: 'bx-envelope-open', color: '#bf5af2', glow: true }
            },
            {
                type: 'team', category: 'team',
                title: 'Cambio de capitán',
                source: 'Neon Strikers',
                message: 'Ahora eres el nuevo capitán del equipo "Neon Strikers". Tienes acceso completo para gestionar roster, solicitudes y torneos.',
                visuals: { icon: 'bx-crown', color: '#ffd700', glow: true }
            },
            {
                type: 'team', category: 'team',
                title: 'Miembro salió del equipo',
                source: 'Shadow Wolves',
                message: 'El jugador "NightFox_22" ha abandonado el equipo. Slot de Controller ahora disponible.',
                visuals: { icon: 'bx-log-out', color: '#ff6b6b', glow: false }
            },

            // ── TORNEOS ──
            {
                type: 'tournament', category: 'tournament',
                title: 'Inscripción confirmada al torneo',
                source: 'Copa GlitchGang 2026',
                message: 'Tu equipo "Shadow Wolves" ha sido inscrito exitosamente en la Copa GlitchGang 2026 (Valorant). Las rondas comienzan el 15 de marzo.',
                visuals: { icon: 'bx-trophy', color: '#FFD700', glow: true }
            },
            {
                type: 'tournament', category: 'tournament',
                title: 'Próxima partida en 24h',
                source: 'Copa GlitchGang 2026',
                message: 'Tu próxima partida es mañana: Shadow Wolves vs Cyber Dragons — Cuartos de Final. Horario: 8:00 PM CDMX.',
                visuals: { icon: 'bx-time-five', color: '#ffa726', glow: false }
            },
            {
                type: 'tournament', category: 'tournament',
                title: '¡Victoria en torneo!',
                source: 'Liga Universitaria',
                message: '¡Felicidades! Tu equipo ganó la partida contra "Frost Giants" (2-1). Avanzas a la semifinal de la Liga Universitaria.',
                visuals: { icon: 'bx-medal', color: '#FFD700', glow: true }
            },
            {
                type: 'tournament', category: 'tournament',
                title: 'Nuevo torneo disponible',
                source: 'Torneos',
                message: 'Se ha abierto la inscripción para "Valorant Caribe Open" (Valorant). Formato: Eliminación directa. Cupo limitado a 32 equipos.',
                visuals: { icon: 'bx-calendar-event', color: '#4facfe', glow: false }
            },
            {
                type: 'tournament', category: 'tournament',
                title: 'Derrota en torneo',
                source: 'Copa Invernal 2026',
                message: 'Tu equipo fue eliminado en Octavos de Final por "Omega Squad" (0-2). El modo espectador sigue disponible.',
                visuals: { icon: 'bx-shield-x', color: '#ff6b6b', glow: false }
            },

            // ── SOCIAL ──
            {
                type: 'social', category: 'social',
                title: 'Nueva solicitud de amistad',
                source: 'Social',
                message: '"GamerPro_CL" te ha enviado una solicitud de amistad. Tiene 3 amigos en común contigo.',
                visuals: { icon: 'bx-user-plus', color: '#f093fb', glow: false }
            },
            {
                type: 'social', category: 'social',
                title: 'Mencionado en la comunidad',
                source: 'Comunidad Valorant LATAM',
                message: '"AceKiller" te mencionó en un post: "¿Alguien ha jugado con @${user.username}? Es un crack en Jett 🔥"',
                visuals: { icon: 'bx-at', color: '#f093fb', glow: false }
            },
            {
                type: 'social', category: 'social',
                title: 'Riot Games vinculada',
                source: 'Conexiones',
                message: 'Tu cuenta de Riot Games ha sido vinculada exitosamente. Ahora puedes sincronizar tus estadísticas de LoL y Valorant.',
                visuals: { icon: 'bx-link', color: '#06d6a0', glow: true }
            },
            {
                type: 'social', category: 'social',
                title: 'Discord conectado',
                source: 'Conexiones',
                message: 'Tu cuenta de Discord ha sido vinculada. Podrás recibir notificaciones y compartir tu perfil fácilmente.',
                visuals: { icon: 'bxl-discord-alt', color: '#5865F2', glow: false }
            },

            // ── LOGROS / ESPECIALES ──
            {
                type: 'success', category: 'social',
                title: '¡Logro desbloqueado: Primer Equipo!',
                source: 'Logros',
                message: 'Has creado tu primer equipo en GlitchGang. Sigue así para desbloquear más logros y recompensas exclusivas.',
                visuals: { icon: 'bx-star', color: '#FFD700', glow: true }
            },
            {
                type: 'success', category: 'social',
                title: '¡Racha de 5 victorias!',
                source: 'Logros',
                message: 'Tu equipo ha ganado 5 partidas consecutivas. ¡Estás en racha! Insignia "En Llamas" desbloqueada.',
                visuals: { icon: 'bx-flame', color: '#ff6b35', glow: true }
            },
        ];

        const now = new Date();
        const notes = testNotifications.map((n, i) => ({
            ...n,
            status: 'unread',
            isSaved: false,
            isArchived: false,
            meta: {},
            createdAt: new Date(now.getTime() - i * 120000) // 2 min apart
        }));

        user.notifications.push(...notes);
        await user.save();

        return res.status(200).json({ message: 'Notificaciones de prueba enviadas', count: notes.length });
    } catch (error) {
        return res.status(500).json({ message: 'Error al enviar pruebas', error: error.message });
    }
};
