/**
 * Reset script: limpia solicitudes de roles del usuario principal o de un email concreto.
 *
 * Usage:
 *   node --env-file=.env scripts/reset-role-applications.js
 *   node --env-file=.env scripts/reset-role-applications.js user@example.com
 */

import mongoose from 'mongoose';
import User from '../src/models/User.js';

const log = (msg) => console.log(`[reset-role-apps] ${msg}`);
const err = (msg) => console.error(`[reset-role-apps] ${msg}`);

const ROLE_KEYS = [
  'organizer',
  'content-creator',
  'coach',
  'caster',
  'sponsor',
  'analyst'
];

const buildResetPayload = () => {
  const roleApplications = {};

  for (const key of ROLE_KEYS) {
    roleApplications[key] = {
      status: 'none',
      appliedAt: null,
      reviewedAt: null,
      data: {}
    };
  }

  return {
    isOrganizer: false,
    roles: ['player'],
    roleApplications
  };
};

const findTargetUser = async (emailArg) => {
  const normalizedEmail = String(emailArg || '').trim().toLowerCase();

  if (normalizedEmail) {
    return User.findOne({ email: normalizedEmail });
  }

  return User.findOne({
    email: { $not: /esportefy\.local$/ }
  }).sort({ createdAt: 1 });
};

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      err('MONGO_URI no encontrada en .env');
      process.exit(1);
    }

    const emailArg = process.argv[2] || '';

    log('Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    log('Conectado');

    const user = await findTargetUser(emailArg);
    if (!user) {
      err(emailArg
        ? `No se encontro usuario para ${emailArg}`
        : 'No se encontro un usuario principal para reiniciar solicitudes');
      process.exit(1);
    }

    const previousRoles = Array.isArray(user.roles) ? user.roles.join(', ') : 'sin roles';
    const hadOrganizer = user.isOrganizer === true;
    const update = buildResetPayload();

    user.isOrganizer = update.isOrganizer;
    user.roles = update.roles;
    for (const key of ROLE_KEYS) {
      user.set(`roleApplications.${key}.status`, 'none');
      user.set(`roleApplications.${key}.appliedAt`, null);
      user.set(`roleApplications.${key}.reviewedAt`, null);
      user.set(`roleApplications.${key}.data`, {});
    }

    await user.save();

    log(`Solicitudes reiniciadas para ${user.email}`);
    log(`Roles previos: ${previousRoles}`);
    log(`Tenia organizador activo: ${hadOrganizer ? 'si' : 'no'}`);
    log('Estado final: roles=[player], isOrganizer=false, roleApplications=none');
  } catch (error) {
    err(`Error: ${error.message}`);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    log('Desconectado de MongoDB');
  }
};

run();
