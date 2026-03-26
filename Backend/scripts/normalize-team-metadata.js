/**
 * Normaliza metadata de equipos ya existentes para evitar variantes duplicadas.
 *
 * Uso:
 *   node --env-file=.env scripts/normalize-team-metadata.js
 */

import mongoose from 'mongoose';
import Team from '../src/models/Team.js';
import {
    normalizeTeamCountry,
    normalizeTeamGender,
    normalizeTeamLanguage,
    normalizeTeamLevel
} from '../../shared/teamCatalog.js';

const log = (message) => console.log(`[teams] ${message}`);

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('[teams] MONGO_URI no encontrada en .env');
            process.exit(1);
        }

        log('Conectando a MongoDB...');
        await mongoose.connect(mongoUri);
        log('Conectado ✓');

        const teams = await Team.find({})
            .select('_id name teamCountry teamGender teamLevel teamLanguage')
            .lean();

        const operations = [];
        const preview = [];

        teams.forEach((team) => {
            const nextCountry = team.teamCountry ? normalizeTeamCountry(team.teamCountry) : '';
            const nextGender = team.teamGender ? normalizeTeamGender(team.teamGender, '') : '';
            const nextLevel = team.teamLevel ? normalizeTeamLevel(team.teamLevel, '') : '';
            const nextLanguage = team.teamLanguage ? normalizeTeamLanguage(team.teamLanguage, '') : '';

            const update = {};
            if (nextCountry !== String(team.teamCountry || '')) update.teamCountry = nextCountry;
            if (nextGender !== String(team.teamGender || '')) update.teamGender = nextGender;
            if (nextLevel !== String(team.teamLevel || '')) update.teamLevel = nextLevel;
            if (nextLanguage !== String(team.teamLanguage || '')) update.teamLanguage = nextLanguage;

            if (!Object.keys(update).length) return;

            operations.push({
                updateOne: {
                    filter: { _id: team._id },
                    update: { $set: update }
                }
            });

            if (preview.length < 20) {
                const previewCountry = update.teamCountry ?? String(team.teamCountry || '');
                const previewGender = update.teamGender ?? String(team.teamGender || '');
                const previewLevel = update.teamLevel ?? String(team.teamLevel || '');
                const previewLanguage = update.teamLanguage ?? String(team.teamLanguage || '');
                preview.push(
                    `${team.name || team._id}: country "${team.teamCountry || ''}" -> "${previewCountry}", ` +
                    `gender "${team.teamGender || ''}" -> "${previewGender}", ` +
                    `level "${team.teamLevel || ''}" -> "${previewLevel}", ` +
                    `language "${team.teamLanguage || ''}" -> "${previewLanguage}"`
                );
            }
        });

        if (operations.length === 0) {
            log('No se encontraron equipos para normalizar.');
            return;
        }

        const result = await Team.bulkWrite(operations);
        log(`Equipos actualizados: ${result.modifiedCount || operations.length}`);
        preview.forEach((line) => log(line));
    } catch (error) {
        console.error(`[teams] Error: ${error.message}`);
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        log('Desconectado de MongoDB');
    }
};

run();
