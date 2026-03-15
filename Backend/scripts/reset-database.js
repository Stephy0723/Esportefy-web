/**
 * Reset script: Limpia TODA la data de prueba.
 * - Elimina todos los torneos, equipos, comunidades, posts, etc.
 * - Elimina los usuarios demo
 * - Limpia followers/following/teams/notifications del usuario principal
 * - Deja la cuenta principal intacta pero "como nueva"
 *
 * Usage:
 *   node --env-file=.env scripts/reset-database.js
 */

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Tournament from '../src/models/Tournament.js';
import Community from '../src/models/Community.js';
import CommunityPost from '../src/models/CommunityPost.js';
import UniversityApplication from '../src/models/UniversityApplication.js';

const log = (msg) => console.log(`[reset] ${msg}`);

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('[reset] MONGO_URI no encontrada en .env');
            process.exit(1);
        }

        log('Conectando a MongoDB...');
        await mongoose.connect(mongoUri);
        log('Conectado ✓');

        // 1. Delete all tournaments
        const tournamentsDeleted = await Tournament.deleteMany({});
        log(`Torneos eliminados: ${tournamentsDeleted.deletedCount}`);

        // 2. Delete all teams
        const teamsDeleted = await Team.deleteMany({});
        log(`Equipos eliminados: ${teamsDeleted.deletedCount}`);

        // 3. Delete all communities
        const communitiesDeleted = await Community.deleteMany({});
        log(`Comunidades eliminadas: ${communitiesDeleted.deletedCount}`);

        // 4. Delete all community posts
        const postsDeleted = await CommunityPost.deleteMany({});
        log(`Posts eliminados: ${postsDeleted.deletedCount}`);

        // 5. Delete all university applications
        const uniAppsDeleted = await UniversityApplication.deleteMany({});
        log(`Aplicaciones universitarias eliminadas: ${uniAppsDeleted.deletedCount}`);

        // 6. Delete ALL demo/test users (keep only the main user)
        const mainUser = await User.findOne({
            email: { $not: /esportefy\.local$/ }
        }).sort({ createdAt: 1 });

        if (mainUser) {
            // Delete all other users
            const usersDeleted = await User.deleteMany({
                _id: { $ne: mainUser._id }
            });
            log(`Usuarios de prueba eliminados: ${usersDeleted.deletedCount}`);

            // Reset main user's social data and notifications
            mainUser.followers = [];
            mainUser.following = [];
            mainUser.teams = [];
            mainUser.notifications = [];
            await mainUser.save();
            log(`Usuario principal (${mainUser.username}) reseteado: followers, following, teams, notificaciones = 0`);
        } else {
            // No main user found, delete everything
            const allDeleted = await User.deleteMany({});
            log(`Todos los usuarios eliminados: ${allDeleted.deletedCount}`);
        }

        log('');
        log('═══════════════════════════════════════════');
        log('  BASE DE DATOS RESETEADA EXITOSAMENTE');
        log('═══════════════════════════════════════════');
        log('');
        log('  La página está como nueva:');
        log('  • 0 torneos');
        log('  • 0 equipos');
        log('  • 0 comunidades');
        log('  • 0 seguidores / siguiendo');
        log('  • 0 notificaciones');
        log('  • Solo tu cuenta principal');
        log('');

    } catch (error) {
        console.error(`[reset] Error: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        log('Desconectado de MongoDB');
    }
};

run();
