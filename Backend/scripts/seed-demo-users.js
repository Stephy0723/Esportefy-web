/**
 * Seed script: Creates 4 demo users for testing social features.
 * - 2 mutual friends of the logged-in user
 * - 2 strangers (not connected)
 *
 * Usage:
 *   node --env-file=.env scripts/seed-demo-users.js
 *
 * Requires a MONGO_URI in your .env and a logged-in user email passed as arg
 * or it will use the first non-demo user found in the DB.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';

/* ───────── Config ───────── */
const DEMO_PASSWORD = 'Demo2024!';

const DEMO_USERS = [
  {
    fullName: 'Valentina Reyes',
    username: 'valreyesgaming',
    email: 'valentina.reyes@glitchgang.local',
    phone: '8094521789',
    gender: 'Femenino',
    country: 'México',
    birthDate: new Date('2001-06-15'),
    bio: 'Streamer y competidora de Valorant. Ex-capitana de equipo universitario. Siempre buscando mejorar 💪',
    selectedGames: ['Valorant', 'League of Legends'],
    experience: ['Semi-Pro', 'Universitario'],
    platforms: ['PC'],
    goals: ['Competitivo', 'Streaming'],
    languages: ['Español', 'English'],
    preferredRoles: ['Duelista', 'Centinela'],
    lookingForTeam: false,
    status: 'online',
    isOrganizer: false,
    selectedTagId: null,
    selectedFrameId: null,
    socialLinks: {
      twitch: 'valreyesgaming',
      twitter: 'valreyesgaming',
      instagram: 'valreyesgaming'
    },
    university: {
      universityId: 'unam',
      universityTag: 'UNAM',
      universityName: 'Universidad Nacional Autónoma de México',
      region: 'mx',
      city: 'Ciudad de México',
      campus: 'CU',
      studentId: 'UNAM-319284',
      program: 'Diseño y Comunicación Visual',
      academicLevel: '6',
      institutionalEmail: 'vreyes@unam.mx',
      verificationSource: 'manual',
      verificationStatus: 'verified',
      verified: true,
      verifiedAt: new Date('2024-09-01')
    },
    connections: {
      discord: { id: 'disc_val_001', username: 'ValReyes#8821', verified: true },
      riot: {
        puuid: 'val-puuid-demo-001',
        gameName: 'ValReyes',
        tagLine: 'MX1',
        verified: true,
        products: {
          valorant: { linked: true, linkedAt: new Date('2024-08-15') },
          lol: { linked: true, linkedAt: new Date('2024-09-20') }
        }
      }
    },
    privacy: {
      allowTeamInvites: true,
      showOnlineStatus: true,
      allowTournamentInvites: true,
      showPublicUserCode: true,
      showPublicRiotHandle: true
    },
    isFriend: true // flag for script logic
  },
  {
    fullName: 'Carlos Méndez',
    username: 'carlosmendez_gg',
    email: 'carlos.mendez@glitchgang.local',
    phone: '8297654321',
    gender: 'Masculino',
    country: 'República Dominicana',
    birthDate: new Date('1999-03-22'),
    bio: 'Organizador de torneos y coach. 5 años en la escena competitiva de Mobile Legends. Si necesitas un equipo, hablame.',
    selectedGames: ['Mobile Legends', 'Valorant'],
    experience: ['Pro', 'Coach'],
    platforms: ['Mobile', 'PC'],
    goals: ['Competitivo', 'Coaching'],
    languages: ['Español'],
    preferredRoles: ['Tank', 'Support'],
    lookingForTeam: false,
    status: 'gaming',
    isOrganizer: true,
    selectedTagId: null,
    selectedFrameId: null,
    socialLinks: {
      youtube: 'CarlosMendezGG',
      twitch: 'carlosmendez_gg',
      tiktok: 'carlosmendezgg'
    },
    university: {
      universityId: 'pucmm',
      universityTag: 'PUCMM',
      universityName: 'Pontificia Universidad Católica Madre y Maestra',
      region: 'rd',
      city: 'Santiago de los Caballeros',
      campus: 'Campus Santiago',
      studentId: 'PUCMM-20190341',
      program: 'Ingeniería en Sistemas',
      academicLevel: '8',
      institutionalEmail: 'cmendez@pucmm.edu.do',
      verificationSource: 'manual',
      verificationStatus: 'verified',
      verified: true,
      verifiedAt: new Date('2024-06-15')
    },
    connections: {
      discord: { id: 'disc_carlos_002', username: 'CarlosGG#4412', verified: true },
      mlbb: {
        playerId: '556677889',
        zoneId: '5210',
        ign: 'CarlosGG',
        verificationStatus: 'verified',
        verified: true,
        linkedAt: new Date('2024-05-10')
      }
    },
    privacy: {
      allowTeamInvites: true,
      showOnlineStatus: true,
      allowTournamentInvites: true,
      showPublicUserCode: true,
      showPublicRiotHandle: false
    },
    isFriend: true
  },
  {
    fullName: 'Mariana Torres',
    username: 'mari_t0rres',
    email: 'mariana.torres@glitchgang.local',
    phone: '8095553214',
    gender: 'Femenino',
    country: 'Colombia',
    birthDate: new Date('2002-11-08'),
    bio: 'Jugadora casual de League of Legends y Valorant. Me gusta el diseño gráfico y los esports. En busca de equipo 🎮',
    selectedGames: ['League of Legends', 'Valorant'],
    experience: ['Amateur'],
    platforms: ['PC'],
    goals: ['Diversión', 'Conocer gente'],
    languages: ['Español', 'Português'],
    preferredRoles: ['ADC', 'Mid'],
    lookingForTeam: true,
    status: 'searching',
    isOrganizer: false,
    selectedTagId: null,
    selectedFrameId: null,
    socialLinks: {
      instagram: 'mari_t0rres',
      tiktok: 'maritorres_lol'
    },
    connections: {
      discord: { id: 'disc_mari_003', username: 'MariTorres#7799', verified: true },
      riot: {
        puuid: 'mari-puuid-demo-003',
        gameName: 'MariTorres',
        tagLine: 'CO1',
        verified: true,
        products: {
          lol: { linked: true, linkedAt: new Date('2024-10-01') },
          valorant: { linked: false }
        }
      }
    },
    privacy: {
      allowTeamInvites: true,
      showOnlineStatus: true,
      allowTournamentInvites: true,
      showPublicUserCode: true,
      showPublicRiotHandle: true
    },
    isFriend: false
  },
  {
    fullName: 'Diego Herrera',
    username: 'diegoherrera_pro',
    email: 'diego.herrera@glitchgang.local',
    phone: '8493217654',
    gender: 'Masculino',
    country: 'Argentina',
    birthDate: new Date('2000-07-30'),
    bio: 'Jugador profesional de Mobile Legends. Capitán de equipo. 3 torneos ganados en la región. Siempre compitiendo.',
    selectedGames: ['Mobile Legends', 'League of Legends', 'Valorant'],
    experience: ['Pro'],
    platforms: ['Mobile', 'PC'],
    goals: ['Competitivo'],
    languages: ['Español', 'English'],
    preferredRoles: ['Jungle', 'Assassin'],
    lookingForTeam: false,
    status: 'tournament',
    isOrganizer: false,
    selectedTagId: null,
    selectedFrameId: null,
    socialLinks: {
      twitch: 'diegoherrera_pro',
      youtube: 'DiegoHerreraPro',
      twitter: 'diegoh_pro'
    },
    connections: {
      discord: { id: 'disc_diego_004', username: 'DiegoPro#1100', verified: true },
      mlbb: {
        playerId: '998877665',
        zoneId: '7201',
        ign: 'DiegoPRO',
        verificationStatus: 'verified',
        verified: true,
        linkedAt: new Date('2024-04-20')
      },
      riot: {
        puuid: 'diego-puuid-demo-004',
        gameName: 'DiegoPro',
        tagLine: 'AR1',
        verified: true,
        products: {
          lol: { linked: true, linkedAt: new Date('2024-07-01') },
          valorant: { linked: true, linkedAt: new Date('2024-07-01') }
        }
      }
    },
    privacy: {
      allowTeamInvites: false,
      showOnlineStatus: true,
      allowTournamentInvites: true,
      showPublicUserCode: true,
      showPublicRiotHandle: true
    },
    isFriend: false
  }
];

/* ───────── Helpers ───────── */
const log = (msg) => console.log(`[seed] ${msg}`);
const err = (msg) => console.error(`[seed] ❌ ${msg}`);

/* ───────── Main ───────── */
const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      err('MONGO_URI no encontrada en .env');
      process.exit(1);
    }

    log('Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    log('Conectado ✓');

    // Find the main user (your account) — the first non-demo user
    const mainUser = await User.findOne({
      email: { $nin: DEMO_USERS.map(u => u.email) }
    }).sort({ createdAt: 1 });

    if (!mainUser) {
      err('No se encontró un usuario principal en la DB. Registra una cuenta primero.');
      process.exit(1);
    }
    log(`Usuario principal encontrado: ${mainUser.username} (${mainUser._id})`);

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const createdIds = [];

    for (const demoData of DEMO_USERS) {
      const { isFriend, ...userData } = demoData;

      // Remove existing demo user with same email
      await User.deleteOne({ email: userData.email });

      const user = await User.create({
        ...userData,
        password: hashedPassword,
        checkTerms: true
      });

      createdIds.push({ user, isFriend });
      log(`Creado: ${user.username} (${user._id}) — userCode: ${user.userCode}`);
    }

    // Set up friend relationships (mutual follow) for the 2 "friend" users
    for (const { user, isFriend } of createdIds) {
      if (!isFriend) continue;

      // Main user follows demo user
      if (!mainUser.following.includes(user._id)) {
        mainUser.following.push(user._id);
      }
      // Demo user follows main user
      if (!user.followers.includes(mainUser._id)) {
        user.followers.push(mainUser._id);
      }

      // Demo user follows main user back (mutual)
      if (!user.following.includes(mainUser._id)) {
        user.following.push(mainUser._id);
      }
      if (!mainUser.followers.includes(user._id)) {
        mainUser.followers.push(user._id);
      }

      await user.save();
      log(`Relación de amistad mutua creada: ${mainUser.username} ↔ ${user.username}`);
    }

    await mainUser.save();

    log('');
    log('═══════════════════════════════════════════════');
    log('  USUARIOS DEMO CREADOS EXITOSAMENTE');
    log('═══════════════════════════════════════════════');
    log('');
    log('  🟢 AMIGOS (mutuos):');
    for (const { user, isFriend } of createdIds) {
      if (isFriend) {
        log(`     • ${user.fullName} (@${user.username}) — ${user.country}`);
        log(`       Email: ${user.email} | Pass: ${DEMO_PASSWORD}`);
      }
    }
    log('');
    log('  🔵 NO AMIGOS (descubrir en pestaña Buscar):');
    for (const { user, isFriend } of createdIds) {
      if (!isFriend) {
        log(`     • ${user.fullName} (@${user.username}) — ${user.country}`);
        log(`       Email: ${user.email} | Pass: ${DEMO_PASSWORD}`);
      }
    }
    log('');
    log(`  Contraseña para todos: ${DEMO_PASSWORD}`);
    log('═══════════════════════════════════════════════');

  } catch (error) {
    err(`Error: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('Desconectado de MongoDB');
  }
};

run();
