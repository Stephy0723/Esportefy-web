import User from '../models/User.js';

// ═══════════════════════════════════════════════════════════
//  NOTIFICATION TEMPLATES — Todas las plantillas del sistema
// ═══════════════════════════════════════════════════════════

export const NOTIF = {
    // ── SISTEMA ──
    welcome: (username) => ({
        type: 'welcome',
        category: 'system',
        title: '🎮 ¡Bienvenido a Esportefy!',
        source: 'Esportefy',
        message: `¡GG ${username || 'Jugador'}! Tu cuenta está activa. Personaliza tu perfil, busca un equipo y domina los torneos. El ranked de tu vida empieza ahora. ¡Demuestra de qué estás hecho! 🏆`,
        status: 'unread',
        visuals: { icon: 'bx-medal', color: '#8EDB15', glow: true }
    }),

    farewell: (username) => ({
        type: 'farewell',
        category: 'system',
        title: '👋 Hasta pronto, guerrero',
        source: 'Esportefy',
        message: `${username || 'Jugador'}, tu cuenta ha sido desactivada. Las puertas de la arena siempre estarán abiertas para ti. Cuando quieras volver, tu leyenda te espera. ¡GG WP!`,
        status: 'unread',
        visuals: { icon: 'bx-log-out-circle', color: '#ff6b6b', glow: false }
    }),

    profileComplete: () => ({
        type: 'achievement',
        category: 'system',
        title: '🏅 ¡Logro desbloqueado!',
        source: 'Esportefy',
        message: 'Perfil completo al 100%. Ahora eres visible para reclutadores y capitanes de equipo. Los scouts ya pueden encontrarte — prepárate para las ofertas.',
        status: 'unread',
        visuals: { icon: 'bx-check-shield', color: '#FFD700', glow: true }
    }),

    newFollower: (followerName) => ({
        type: 'social',
        category: 'social',
        title: '🔔 ¡Nuevo seguidor!',
        source: followerName || 'Alguien',
        message: `${followerName || 'Un jugador'} comenzó a seguirte. Tu reputación crece — sigue compitiendo y construye tu audiencia.`,
        status: 'unread',
        visuals: { icon: 'bx-user-plus', color: '#f093fb', glow: false }
    }),

    // ── EQUIPOS ──
    teamCreated: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '⚔️ ¡Equipo fundado!',
        source: teamName || 'Nuevo equipo',
        message: `"${teamName}" está oficialmente en la arena. Comparte el código de invitación con tus compañeros y empieza a reclutar. ¡Es hora de armar el roster definitivo!`,
        status: 'unread',
        visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
    }),

    teamJoined: (teamName, playerName) => ({
        type: 'team',
        category: 'team',
        title: '🛡️ Nuevo recluta',
        source: teamName || 'Equipo',
        message: `${playerName || 'Un jugador'} se unió a "${teamName}". El roster se fortalece — coordinen estrategias y prepárense para dominar.`,
        status: 'unread',
        visuals: { icon: 'bx-user-plus', color: '#4facfe', glow: true }
    }),

    teamJoinedConfirm: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '🎯 ¡Formas parte del equipo!',
        source: teamName || 'Equipo',
        message: `Bienvenido a "${teamName}". Ya eres parte del roster oficial. Coordina con tus compañeros, entrena y prepárate para los torneos. ¡A por la victoria!`,
        status: 'unread',
        visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
    }),

    teamJoinRequest: (teamName, playerName) => ({
        type: 'team',
        category: 'team',
        title: '📋 Solicitud de ingreso',
        source: teamName || 'Equipo',
        message: `${playerName || 'Un jugador'} quiere unirse a "${teamName}". Revisa su perfil y decide si encaja en el roster. No dejes la solicitud esperando.`,
        status: 'unread',
        visuals: { icon: 'bx-user-check', color: '#4facfe', glow: true }
    }),

    teamRequestApproved: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '✅ ¡Solicitud aceptada!',
        source: teamName || 'Equipo',
        message: `¡Felicidades! Tu solicitud para "${teamName}" fue aprobada. Ya estás en el roster oficial. Preséntate con el equipo y empiecen a entrenar juntos.`,
        status: 'unread',
        visuals: { icon: 'bx-check-circle', color: '#8EDB15', glow: true }
    }),

    teamRequestRejected: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '❌ Solicitud rechazada',
        source: teamName || 'Equipo',
        message: `Tu solicitud para "${teamName}" no fue aceptada esta vez. No te rindas — sigue mejorando y busca otros equipos que necesiten tu talento.`,
        status: 'unread',
        visuals: { icon: 'bx-x-circle', color: '#ff6b6b', glow: false }
    }),

    teamRemoved: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '🚫 Removido del equipo',
        source: teamName || 'Equipo',
        message: `Has sido removido del roster de "${teamName}". Si crees que fue un error, contacta al capitán. Siempre puedes buscar un nuevo equipo.`,
        status: 'unread',
        visuals: { icon: 'bx-user-x', color: '#ff6b6b', glow: false }
    }),

    teamLeft: (teamName, playerName) => ({
        type: 'team',
        category: 'team',
        title: '🚪 Miembro abandonó',
        source: teamName || 'Equipo',
        message: `${playerName || 'Un jugador'} dejó "${teamName}". Considera buscar un reemplazo para mantener el roster completo. ¡No dejes que afecte al equipo!`,
        status: 'unread',
        visuals: { icon: 'bx-log-out', color: '#ffa726', glow: false }
    }),

    teamDeleted: (teamName) => ({
        type: 'team',
        category: 'team',
        title: '💀 Equipo disuelto',
        source: teamName || 'Equipo',
        message: `"${teamName}" ha sido eliminado permanentemente. Los miembros han sido liberados del roster. Busca o crea un nuevo equipo para seguir compitiendo.`,
        status: 'unread',
        visuals: { icon: 'bx-trash', color: '#ff6b6b', glow: false }
    }),

    // ── TORNEOS ──
    tournamentRegistered: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '📝 ¡Inscripción registrada!',
        source: tournamentName || 'Torneo',
        message: `Tu equipo se inscribió en "${tournamentName}". Espera la confirmación del organizador. Mientras tanto, entrenen y perfeccionen sus estrategias. ¡La competencia se acerca!`,
        status: 'unread',
        visuals: { icon: 'bx-trophy', color: '#FFD700', glow: true }
    }),

    tournamentApproved: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '🏟️ ¡Estás dentro!',
        source: tournamentName || 'Torneo',
        message: `Tu inscripción en "${tournamentName}" fue aprobada. Estás oficialmente en la competencia. Prepara a tu equipo — no hay marcha atrás. ¡A darlo todo!`,
        status: 'unread',
        visuals: { icon: 'bx-check-double', color: '#8EDB15', glow: true }
    }),

    tournamentRejected: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '⛔ Inscripción rechazada',
        source: tournamentName || 'Torneo',
        message: `Tu inscripción en "${tournamentName}" fue rechazada por el organizador. Revisa los requisitos del torneo e intenta inscribirte en otros eventos disponibles.`,
        status: 'unread',
        visuals: { icon: 'bx-x-circle', color: '#ff6b6b', glow: false }
    }),

    tournamentRemoved: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '🚫 Equipo descalificado',
        source: tournamentName || 'Torneo',
        message: `Tu equipo fue removido de "${tournamentName}" por el organizador. Si consideras que fue injusto, contacta la administración del torneo.`,
        status: 'unread',
        visuals: { icon: 'bx-block', color: '#ff6b6b', glow: false }
    }),

    tournamentStarting: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '🔥 ¡Torneo en vivo!',
        source: tournamentName || 'Torneo',
        message: `"${tournamentName}" acaba de comenzar. Todos los equipos a sus posiciones. ¡Es ahora o nunca — demuestren por qué están aquí! GLHF 🎮`,
        status: 'unread',
        visuals: { icon: 'bx-play-circle', color: '#4facfe', glow: true }
    }),

    tournamentCancelled: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '⚠️ Torneo cancelado',
        source: tournamentName || 'Torneo',
        message: `"${tournamentName}" fue cancelado por el organizador. Lamentamos los inconvenientes. Mantente atento a nuevos torneos disponibles en la plataforma.`,
        status: 'unread',
        visuals: { icon: 'bx-error', color: '#ff6b6b', glow: false }
    }),

    tournamentFinished: (tournamentName) => ({
        type: 'tournament',
        category: 'tournament',
        title: '🏆 ¡Torneo finalizado!',
        source: tournamentName || 'Torneo',
        message: `"${tournamentName}" ha concluido. Los resultados finales ya están disponibles. Revisa el bracket y las estadísticas. ¡GG a todos los participantes!`,
        status: 'unread',
        visuals: { icon: 'bx-flag-checkered', color: '#FFD700', glow: true }
    }),
};

// Helper reutilizable para pushear una notificación
export const pushNotification = async (userId, payload) => {
    await User.findByIdAndUpdate(userId, { $push: { notifications: payload } });
};

// ═══════════════════════════════════════════════════════════
//  CONTROLLERS
// ═══════════════════════════════════════════════════════════

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

// ── Eliminar una notificación ──
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(req.userId, { $pull: { notifications: { _id: id } } });
        return res.status(200).json({ message: 'Notificación eliminada' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar notificación', error: error.message });
    }
};

// ── Eliminar todas las notificaciones ──
export const clearAllNotifications = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { $set: { notifications: [] } });
        return res.status(200).json({ message: 'Todas las notificaciones eliminadas' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar notificaciones', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
//  TEST: Enviar TODAS las notificaciones para probar
// ═══════════════════════════════════════════════════════════
export const sendTestNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const testNotifs = [
            NOTIF.welcome(user.userName || user.fullName),
            NOTIF.farewell(user.userName || user.fullName),
            NOTIF.profileComplete(),
            NOTIF.newFollower('ProGamer99'),
            NOTIF.teamCreated('Phoenix Rising'),
            NOTIF.teamJoined('Phoenix Rising', 'ShadowKiller'),
            NOTIF.teamJoinedConfirm('Nova Esports'),
            NOTIF.teamJoinRequest('Phoenix Rising', 'DragonSlayer'),
            NOTIF.teamRequestApproved('Nova Esports'),
            NOTIF.teamRequestRejected('Team Liquid'),
            NOTIF.teamRemoved('Sentinels'),
            NOTIF.teamLeft('Phoenix Rising', 'NightFox'),
            NOTIF.teamDeleted('Old Guard'),
            NOTIF.tournamentRegistered('Copa Esportefy 2025'),
            NOTIF.tournamentApproved('Copa Esportefy 2025'),
            NOTIF.tournamentRejected('Liga Pro Series'),
            NOTIF.tournamentRemoved('Copa Invernal'),
            NOTIF.tournamentStarting('Copa Esportefy 2025'),
            NOTIF.tournamentCancelled('Torneo Nocturno'),
            NOTIF.tournamentFinished('Copa Esportefy 2025'),
        ];

        // Pushear todas al usuario
        await User.findByIdAndUpdate(req.userId, {
            $push: { notifications: { $each: testNotifs } }
        });

        return res.status(200).json({
            message: `${testNotifs.length} notificaciones de prueba enviadas`,
            count: testNotifs.length
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al enviar test', error: error.message });
    }
};
