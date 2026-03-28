/**
 * Regenera userCode para usuarios cuyo prefijo no coincide con el país actual.
 *
 * Uso:
 *   node --env-file=.env scripts/normalize-user-codes.js
 */

import mongoose from 'mongoose';
import User, { shouldRegenerateUserCodeForCountry } from '../src/models/User.js';

const log = (message) => console.log(`[user-codes] ${message}`);

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('[user-codes] MONGO_URI no encontrada en .env');
            process.exit(1);
        }

        log('Conectando a MongoDB...');
        await mongoose.connect(mongoUri);
        log('Conectado ✓');

        const users = await User.find({
            country: { $exists: true, $type: 'string', $ne: '' },
            userCode: { $exists: true, $type: 'string', $ne: '' }
        }).select('_id username country userCode');

        let updated = 0;
        const preview = [];

        for (const user of users) {
            if (!shouldRegenerateUserCodeForCountry({ country: user.country, userCode: user.userCode })) {
                continue;
            }

            const previousCode = String(user.userCode || '').trim();
            user.userCode = undefined;
            await user.save();
            updated += 1;

            if (preview.length < 20) {
                preview.push(`${user.username || user._id}: "${previousCode}" -> "${user.userCode}"`);
            }
        }

        if (updated === 0) {
            log('No se encontraron userCode para corregir.');
            return;
        }

        log(`Usuarios actualizados: ${updated}`);
        preview.forEach((line) => log(line));
    } catch (error) {
        console.error(`[user-codes] Error: ${error.message}`);
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        log('Desconectado de MongoDB');
    }
};

run();
