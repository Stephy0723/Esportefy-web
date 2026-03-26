/**
 * Normaliza los países ya guardados en usuarios existentes.
 *
 * Uso:
 *   node --env-file=.env scripts/normalize-user-countries.js
 */

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { normalizeCountryName } from '../../shared/countries.js';

const log = (message) => console.log(`[countries] ${message}`);

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('[countries] MONGO_URI no encontrada en .env');
            process.exit(1);
        }

        log('Conectando a MongoDB...');
        await mongoose.connect(mongoUri);
        log('Conectado ✓');

        const users = await User.find({
            country: { $exists: true, $type: 'string', $ne: '' }
        }).select('_id username country').lean();

        const operations = [];
        const preview = [];

        users.forEach((user) => {
            const currentCountry = String(user.country || '').trim();
            const normalizedCountry = normalizeCountryName(currentCountry);

            if (normalizedCountry && normalizedCountry !== currentCountry) {
                operations.push({
                    updateOne: {
                        filter: { _id: user._id },
                        update: { $set: { country: normalizedCountry } }
                    }
                });

                if (preview.length < 20) {
                    preview.push(`${user.username || user._id}: "${currentCountry}" -> "${normalizedCountry}"`);
                }
            }
        });

        if (operations.length === 0) {
            log('No se encontraron países para normalizar.');
            return;
        }

        const result = await User.bulkWrite(operations);
        log(`Usuarios actualizados: ${result.modifiedCount || operations.length}`);
        preview.forEach((line) => log(line));
    } catch (error) {
        console.error(`[countries] Error: ${error.message}`);
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        log('Desconectado de MongoDB');
    }
};

run();
