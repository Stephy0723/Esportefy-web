/**
 * Regenera userCode para usuarios cuyo prefijo no coincide con el país actual.
 *
 * Uso:
 *   node --env-file=.env scripts/normalize-user-codes.js
 *   node --env-file=.env scripts/normalize-user-codes.js --apply
 *   node --env-file=.env scripts/normalize-user-codes.js --apply --xx-only
 */

import mongoose from 'mongoose';
import User, {
    extractCountryPrefixFromUserCode,
    resolveCountryUserCodePrefix,
    shouldRegenerateUserCodeForCountry
} from '../src/models/User.js';

const log = (message) => console.log(`[user-codes] ${message}`);
const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--apply');
const xxOnly = args.has('--xx-only');

const buildQuery = () => {
    const query = {
        country: { $exists: true, $type: 'string', $ne: '' },
        userCode: { $exists: true, $type: 'string', $ne: '' }
    };

    if (xxOnly) {
        query.userCode = { $regex: /-XX\d+$/ };
    }

    return query;
};

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

        log(`Modo: ${dryRun ? 'dry-run' : 'apply'}`);
        if (xxOnly) {
            log('Filtro: solo userCode con prefijo XX');
        }

        const users = await User.find(buildQuery()).select('_id username country userCode');

        let updated = 0;
        let candidates = 0;
        const preview = [];

        for (const user of users) {
            if (!shouldRegenerateUserCodeForCountry({ country: user.country, userCode: user.userCode })) {
                continue;
            }
            candidates += 1;

            const previousCode = String(user.userCode || '').trim();
            const expectedPrefix = resolveCountryUserCodePrefix(user.country);
            const currentPrefix = extractCountryPrefixFromUserCode(previousCode);
            let nextCode = previousCode;

            if (dryRun) {
                user.userCode = undefined;
                await user.validate();
                nextCode = String(user.userCode || '').trim();
                user.userCode = previousCode;
            } else {
                user.userCode = undefined;
                await user.save();
                nextCode = String(user.userCode || '').trim();
                updated += 1;
            }

            if (preview.length < 20) {
                preview.push(
                    `${user.username || user._id}: "${previousCode}" (${currentPrefix || 'N/A'} -> ${expectedPrefix || 'N/A'}) -> "${nextCode}"`
                );
            }
        }

        if (updated === 0) {
            log(
                dryRun
                    ? `Dry-run completado. Usuarios candidatos: ${candidates}. No se aplicaron cambios.`
                    : 'No se encontraron userCode para corregir.'
            );
            if (preview.length === 0) {
                log('No se encontraron userCode para corregir.');
            }
            preview.forEach((line) => log(line));
            return;
        }

        log(`Usuarios candidatos: ${candidates}`);
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
