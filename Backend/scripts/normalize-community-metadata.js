/**
 * Normaliza metadata de comunidades ya existentes para mantener un solo dato canónico.
 *
 * Uso:
 *   node --env-file=.env scripts/normalize-community-metadata.js
 */

import mongoose from 'mongoose';
import Community from '../src/models/Community.js';
import {
    normalizeCommunityGameNames,
    normalizeCommunityMemberRole,
    normalizeCommunitySocialLinks
} from '../../shared/communityCatalog.js';

const log = (message) => console.log(`[communities] ${message}`);

const stringify = (value) => JSON.stringify(value || []);

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('[communities] MONGO_URI no encontrada en .env');
            process.exit(1);
        }

        log('Conectando a MongoDB...');
        await mongoose.connect(mongoUri);
        log('Conectado ✓');

        const communities = await Community.find({})
            .select('_id name mainGames members socialLinks')
            .lean();

        const operations = [];
        const preview = [];

        communities.forEach((community) => {
            const nextMainGames = normalizeCommunityGameNames(community.mainGames);
            const nextMembers = (Array.isArray(community.members) ? community.members : []).map((member) => ({
                ...member,
                role: normalizeCommunityMemberRole(member?.role, 'member')
            }));
            const nextSocialLinks = normalizeCommunitySocialLinks(community.socialLinks);

            const mainGamesChanged = stringify(nextMainGames) !== stringify(community.mainGames);
            const membersChanged = stringify(nextMembers) !== stringify(community.members);
            const socialLinksChanged = JSON.stringify(nextSocialLinks) !== JSON.stringify(community.socialLinks || {});

            if (!mainGamesChanged && !membersChanged && !socialLinksChanged) return;

            const update = {};
            if (mainGamesChanged) update.mainGames = nextMainGames;
            if (membersChanged) update.members = nextMembers;
            if (socialLinksChanged) update.socialLinks = nextSocialLinks;

            operations.push({
                updateOne: {
                    filter: { _id: community._id },
                    update: { $set: update }
                }
            });

            if (preview.length < 20) {
                preview.push(
                    `${community.name || community._id}: games ${JSON.stringify(community.mainGames || [])} -> ${JSON.stringify(nextMainGames)}, ` +
                    `roles ${JSON.stringify((community.members || []).map((member) => member?.role || ''))} -> ${JSON.stringify(nextMembers.map((member) => member?.role || ''))}`
                );
            }
        });

        if (operations.length === 0) {
            log('No se encontraron comunidades para normalizar.');
            return;
        }

        const result = await Community.bulkWrite(operations);
        log(`Comunidades actualizadas: ${result.modifiedCount || operations.length}`);
        preview.forEach((line) => log(line));
    } catch (error) {
        console.error(`[communities] Error: ${error.message}`);
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        log('Desconectado de MongoDB');
    }
};

run();
