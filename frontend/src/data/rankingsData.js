/**
 * Rankings Data - República Dominicana Esports
 * Datos realistas basados en la escena competitiva dominicana
 */

// ══════════════════════════════════════════════════════════════
// JUGADORES - Top players del ranking RD (con historial completo)
// ══════════════════════════════════════════════════════════════
export const PLAYERS_DATA = [
    // MLBB Players - Muy popular en RD
    { 
        id: 1, player: 'DarkShadow', realName: 'Carlos Pérez', team: 'Hispaniola Esports', game: 'MLBB', region: 'Santo Domingo', 
        points: 12450, wins: 234, losses: 48, lastActivity: 'Hace 1h', trend: 3, streak: 12, role: 'Jungler', socialMedia: '@darkshadow_rd',
        joinDate: '2021-03-15', bio: 'Jugador profesional de MLBB desde 2020. Considerado el mejor jungler de RD.',
        achievements: {
            solo: [
                { name: 'MVP Copa Nacional 2025', date: '2025-12-10', place: 1 },
                { name: 'Top 1 Ranked Season 28', date: '2025-08-01', place: 1 },
            ],
            duo: [
                { name: 'Duo Championship RD', date: '2025-06-15', partner: 'ElCapoDRD', place: 1 },
                { name: 'Duo Invitational Santo Domingo', date: '2025-02-20', partner: 'ElCapoDRD', place: 2 },
            ],
            team: [
                { name: 'MLBB Championship 2025', date: '2025-12-15', team: 'Hispaniola Esports', place: 1 },
                { name: 'Copa Caribe MLBB', date: '2025-04-30', team: 'Hispaniola Esports', place: 2 },
                { name: 'Liga Nacional MLBB S2', date: '2025-09-20', team: 'Hispaniola Esports', place: 1 },
            ]
        },
        matchHistory: [
            { date: '2026-03-03', opponent: 'LaMentalidad', opponentTeam: 'Quisqueya Gaming', result: 'win', score: '3-1', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-02-28', opponent: 'MamboKing', opponentTeam: 'Platano Power', result: 'win', score: '3-0', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-02-24', opponent: 'TigreCaribe', opponentTeam: 'Caribes RD', result: 'win', score: '2-1', tournament: 'Ranked Match', mode: 'solo' },
            { date: '2026-02-20', opponent: 'DragonRD', opponentTeam: 'Quisqueya Gaming', result: 'loss', score: '1-2', tournament: 'Showmatch', mode: 'duo' },
            { date: '2026-02-15', opponent: 'YoSoyElPro', opponentTeam: 'Caribes RD', result: 'win', score: '3-2', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
        ]
    },
    { 
        id: 2, player: 'LaMentalidad', realName: 'Miguel Santana', team: 'Quisqueya Gaming', game: 'MLBB', region: 'Santiago', 
        points: 11890, wins: 218, losses: 52, lastActivity: 'Hace 30m', trend: 1, streak: 8, role: 'Gold Laner', socialMedia: '@lamentalidadgg',
        joinDate: '2020-11-01', bio: 'Gold Laner agresivo. Capitán de Quisqueya Gaming.',
        achievements: {
            solo: [
                { name: 'Top 3 Ranked Season 28', date: '2025-08-01', place: 3 },
            ],
            duo: [
                { name: 'Duo Championship RD', date: '2025-06-15', partner: 'DragonRD', place: 3 },
            ],
            team: [
                { name: 'MLBB Championship 2025', date: '2025-12-15', team: 'Quisqueya Gaming', place: 2 },
                { name: 'Copa Invernal 2025', date: '2025-01-30', team: 'Quisqueya Gaming', place: 1 },
            ]
        },
        matchHistory: [
            { date: '2026-03-03', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '1-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-02-26', opponent: 'TigreCaribe', opponentTeam: 'Caribes RD', result: 'win', score: '3-2', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-02-22', opponent: 'MamboKing', opponentTeam: 'Platano Power', result: 'win', score: '2-0', tournament: 'Ranked Match', mode: 'solo' },
        ]
    },
    { 
        id: 3, player: 'TigreCaribe', realName: 'Luis Vásquez', team: 'Caribes RD', game: 'MLBB', region: 'La Romana', 
        points: 11420, wins: 205, losses: 61, lastActivity: 'Hace 2h', trend: 2, streak: 6, role: 'Roamer', socialMedia: '@tigrecaribe',
        joinDate: '2021-06-10', bio: 'Especialista en roaming y macro. Líder de Caribes RD.',
        achievements: {
            solo: [],
            duo: [{ name: 'Duo Showdown RD', date: '2025-04-10', partner: 'YoSoyElPro', place: 1 }],
            team: [
                { name: 'Copa Caribe MLBB', date: '2025-04-30', team: 'Caribes RD', place: 1 },
                { name: 'Liga Nacional MLBB S1', date: '2025-05-15', team: 'Caribes RD', place: 3 },
            ]
        },
        matchHistory: [
            { date: '2026-02-26', opponent: 'LaMentalidad', opponentTeam: 'Quisqueya Gaming', result: 'loss', score: '2-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-02-24', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '1-2', tournament: 'Ranked Match', mode: 'solo' },
        ]
    },
    { 
        id: 4, player: 'MamboKing', realName: 'José García', team: 'Platano Power', game: 'MLBB', region: 'Santo Domingo', 
        points: 10950, wins: 189, losses: 58, lastActivity: 'Hace 45m', trend: -1, streak: 4, role: 'Mid Laner', socialMedia: '@mamboking_ml',
        joinDate: '2022-01-20', bio: 'Mid laner con estilo único. Fundador de Platano Power.',
        achievements: { solo: [], duo: [], team: [{ name: 'Copa Amateur RD', date: '2024-11-10', team: 'Platano Power', place: 1 }] },
        matchHistory: [
            { date: '2026-02-28', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '0-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
        ]
    },
    { 
        id: 5, player: 'ElCapoDRD', realName: 'Roberto Fernández', team: 'Hispaniola Esports', game: 'MLBB', region: 'Puerto Plata', 
        points: 10780, wins: 176, losses: 54, lastActivity: 'Hace 3h', trend: 0, streak: 5, role: 'EXP Laner', socialMedia: '@elcapodrd',
        joinDate: '2021-03-20', bio: 'EXP Laner veterano. Compañero de duo de DarkShadow.',
        achievements: {
            solo: [{ name: 'Top 5 Ranked Season 27', date: '2025-05-01', place: 5 }],
            duo: [
                { name: 'Duo Championship RD', date: '2025-06-15', partner: 'DarkShadow', place: 1 },
                { name: 'Duo Invitational Santo Domingo', date: '2025-02-20', partner: 'DarkShadow', place: 2 },
            ],
            team: [
                { name: 'MLBB Championship 2025', date: '2025-12-15', team: 'Hispaniola Esports', place: 1 },
            ]
        },
        matchHistory: [
            { date: '2026-03-02', opponent: 'YoSoyElPro', opponentTeam: 'Caribes RD', result: 'win', score: '3-1', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
        ]
    },
    
    // Free Fire Players
    { 
        id: 6, player: 'SantoKiller', realName: 'Jean Carlos', team: 'RD Legends', game: 'Free Fire', region: 'Santo Domingo', 
        points: 11200, wins: 312, losses: 89, lastActivity: 'Hace 20m', trend: 5, streak: 15, role: 'Rusher', socialMedia: '@santokiller_ff',
        joinDate: '2019-08-10', bio: 'El rusher más agresivo de RD. 15 títulos nacionales.',
        achievements: {
            solo: [
                { name: 'Solo King RD 2025', date: '2025-10-20', place: 1 },
                { name: 'Solo King RD 2024', date: '2024-10-15', place: 1 },
            ],
            duo: [{ name: 'Duo Masters FF', date: '2025-07-10', partner: 'NegroChimba', place: 1 }],
            team: [
                { name: 'Free Fire Masters RD 2025', date: '2025-11-20', team: 'RD Legends', place: 1 },
                { name: 'Liga FF RD S3', date: '2025-06-30', team: 'RD Legends', place: 1 },
                { name: 'Copa Garena Caribe', date: '2025-03-15', team: 'RD Legends', place: 2 },
            ]
        },
        matchHistory: [
            { date: '2026-03-01', opponent: 'PeligroRD', opponentTeam: 'Fuego Dominicano', result: 'win', score: 'Booyah', tournament: 'Liga Dominicana FF S1', mode: 'team' },
            { date: '2026-02-25', opponent: 'TropicalGod', opponentTeam: 'Tropicales eSports', result: 'win', score: 'Booyah', tournament: 'Liga Dominicana FF S1', mode: 'team' },
        ]
    },
    { 
        id: 7, player: 'PeligroRD', realName: 'Franklin Marte', team: 'Fuego Dominicano', game: 'Free Fire', region: 'La Vega', 
        points: 10650, wins: 287, losses: 94, lastActivity: 'Hace 1h', trend: 2, streak: 9, role: 'Sniper', socialMedia: '@peligro_rd',
        joinDate: '2020-02-15', bio: 'Sniper de élite. Mejor puntería de la liga.',
        achievements: {
            solo: [{ name: 'Sniper Championship', date: '2025-09-10', place: 1 }],
            duo: [],
            team: [{ name: 'Free Fire Masters RD 2025', date: '2025-11-20', team: 'Fuego Dominicano', place: 2 }]
        },
        matchHistory: [
            { date: '2026-03-01', opponent: 'SantoKiller', opponentTeam: 'RD Legends', result: 'loss', score: '2nd', tournament: 'Liga Dominicana FF S1', mode: 'team' },
        ]
    },
    { 
        id: 8, player: 'NegroChimba', realName: 'Darío Encarnación', team: 'RD Legends', game: 'Free Fire', region: 'Santiago', 
        points: 10380, wins: 265, losses: 88, lastActivity: 'Hace 4h', trend: 1, streak: 7, role: 'Support', socialMedia: '@negrochimba',
        joinDate: '2019-10-05', bio: 'Support veterano de RD Legends. Especialista en revives.',
        achievements: { solo: [], duo: [{ name: 'Duo Masters FF', date: '2025-07-10', partner: 'SantoKiller', place: 1 }], team: [{ name: 'Free Fire Masters RD 2025', date: '2025-11-20', team: 'RD Legends', place: 1 }] },
        matchHistory: []
    },
    { 
        id: 9, player: 'TropicalGod', realName: 'Kelvin Rosario', team: 'Tropicales eSports', game: 'Free Fire', region: 'San Cristóbal', 
        points: 9920, wins: 248, losses: 102, lastActivity: 'Hace 2h', trend: -2, streak: 3, role: 'IGL', socialMedia: '@tropicalgod_ff',
        joinDate: '2021-01-10', bio: 'IGL táctico. Cerebro del equipo Tropicales.',
        achievements: { solo: [], duo: [], team: [{ name: 'Copa Sur RD', date: '2025-08-20', team: 'Tropicales eSports', place: 1 }] },
        matchHistory: [
            { date: '2026-02-25', opponent: 'SantoKiller', opponentTeam: 'RD Legends', result: 'loss', score: '3rd', tournament: 'Liga Dominicana FF S1', mode: 'team' },
        ]
    },
    
    // Valorant Players
    { 
        id: 10, player: 'MenaVAL', realName: 'Andrés Mena', team: 'Azucareros eSports', game: 'Valorant', region: 'Santo Domingo', 
        points: 9850, wins: 156, losses: 48, lastActivity: 'Hace 1h', trend: 4, streak: 11, role: 'Duelist', socialMedia: '@menaval_rd',
        joinDate: '2021-06-01', bio: 'El Jett main más letal del Caribe. Radiant.',
        achievements: {
            solo: [{ name: 'Top 10 LATAM Ranked', date: '2025-11-01', place: 8 }],
            duo: [{ name: 'Duo Ranked Challenge', date: '2025-05-15', partner: 'Samurai809', place: 1 }],
            team: [
                { name: 'Valorant Open RD', date: '2025-08-30', team: 'Azucareros eSports', place: 1 },
                { name: 'VCT Challengers LATAM', date: '2025-04-20', team: 'Azucareros eSports', place: 5 },
            ]
        },
        matchHistory: [
            { date: '2026-02-28', opponent: 'CycloneRD', opponentTeam: 'Dominicana Clutch', result: 'win', score: '13-8', tournament: 'Valorant Caribe Cup', mode: 'team' },
            { date: '2026-02-20', opponent: 'CycloneRD', opponentTeam: 'Dominicana Clutch', result: 'win', score: '2-1', tournament: 'Ranked Match', mode: 'duo' },
        ]
    },
    { 
        id: 11, player: 'CycloneRD', realName: 'David Martínez', team: 'Dominicana Clutch', game: 'Valorant', region: 'Santiago', 
        points: 9420, wins: 142, losses: 52, lastActivity: 'Hace 30m', trend: 2, streak: 8, role: 'Controller', socialMedia: '@cyclonerd',
        joinDate: '2022-03-10', bio: 'Controller estratégico. Smokes perfectos.',
        achievements: { solo: [], duo: [], team: [{ name: 'Valorant Open RD', date: '2025-08-30', team: 'Dominicana Clutch', place: 2 }] },
        matchHistory: [
            { date: '2026-02-28', opponent: 'MenaVAL', opponentTeam: 'Azucareros eSports', result: 'loss', score: '8-13', tournament: 'Valorant Caribe Cup', mode: 'team' },
        ]
    },
    { 
        id: 12, player: 'Samurai809', realName: 'Ricardo Guzmán', team: 'Azucareros eSports', game: 'Valorant', region: 'Punta Cana', 
        points: 9180, wins: 134, losses: 49, lastActivity: 'Hace 5h', trend: 1, streak: 5, role: 'Sentinel', socialMedia: '@samurai809',
        joinDate: '2021-08-15', bio: 'Sentinel de Azucareros. Cypher/Killjoy main.',
        achievements: { solo: [], duo: [{ name: 'Duo Ranked Challenge', date: '2025-05-15', partner: 'MenaVAL', place: 1 }], team: [{ name: 'Valorant Open RD', date: '2025-08-30', team: 'Azucareros eSports', place: 1 }] },
        matchHistory: []
    },
    
    // League of Legends Players
    { 
        id: 13, player: 'CaciqueMid', realName: 'Daniel Polanco', team: 'Taínos Gaming', game: 'LoL', region: 'Santo Domingo', 
        points: 9650, wins: 167, losses: 58, lastActivity: 'Hace 2h', trend: 3, streak: 9, role: 'Mid Laner', socialMedia: '@caciquemid',
        joinDate: '2020-04-01', bio: 'Mid laner de Taínos. Challenger LATAM.',
        achievements: {
            solo: [{ name: 'Top 50 LATAM Challenger', date: '2025-10-01', place: 42 }],
            duo: [],
            team: [
                { name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Taínos Gaming', place: 1 },
                { name: 'Copa Universitaria RD', date: '2025-06-10', team: 'Taínos Gaming', place: 1 },
            ]
        },
        matchHistory: [
            { date: '2026-02-25', opponent: 'JungleKing', opponentTeam: 'Cibao Stars', result: 'win', score: '2-1', tournament: 'Liga LoL RD S1 2026', mode: 'team' },
        ]
    },
    { 
        id: 14, player: 'JungleKing', realName: 'Pedro Almonte', team: 'Cibao Stars', game: 'LoL', region: 'Santiago', 
        points: 9280, wins: 154, losses: 62, lastActivity: 'Hace 4h', trend: 0, streak: 4, role: 'Jungler', socialMedia: '@jungleking_rd',
        joinDate: '2021-02-15', bio: 'Jungler agresivo de Cibao Stars.',
        achievements: { solo: [], duo: [], team: [{ name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Cibao Stars', place: 2 }] },
        matchHistory: [
            { date: '2026-02-25', opponent: 'CaciqueMid', opponentTeam: 'Taínos Gaming', result: 'loss', score: '1-2', tournament: 'Liga LoL RD S1 2026', mode: 'team' },
        ]
    },
    { 
        id: 15, player: 'CaribADC', realName: 'Jorge Reyes', team: 'Taínos Gaming', game: 'LoL', region: 'La Romana', 
        points: 8970, wins: 145, losses: 64, lastActivity: 'Hace 6h', trend: -1, streak: 2, role: 'ADC', socialMedia: '@caribadc',
        joinDate: '2020-06-20', bio: 'ADC de Taínos Gaming. Especialista en Jinx.',
        achievements: { solo: [], duo: [], team: [{ name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Taínos Gaming', place: 1 }] },
        matchHistory: []
    },
    
    // EA FC Players
    { 
        id: 16, player: 'Golazo_RD', realName: 'Emmanuel Díaz', team: 'Fútbol Virtual RD', game: 'EA FC', region: 'Santo Domingo', 
        points: 8750, wins: 198, losses: 45, lastActivity: 'Hace 1h', trend: 6, streak: 14, role: 'Pro Player', socialMedia: '@golazo_rd',
        joinDate: '2019-05-10', bio: 'El mejor jugador de EA FC en RD. 11 títulos nacionales.',
        achievements: {
            solo: [
                { name: 'FIFA eWorld Cup RD Qualifier', date: '2025-05-15', place: 1 },
                { name: 'EA FC Pro League RD S2', date: '2025-08-30', place: 1 },
                { name: 'Copa Nacional EA FC 2025', date: '2025-11-10', place: 1 },
            ],
            duo: [{ name: 'Pro Clubs Championship', date: '2025-07-20', partner: 'ElTiki', place: 1 }],
            team: []
        },
        matchHistory: [
            { date: '2026-03-02', opponent: 'Messi_Criollo', opponentTeam: 'Santiago FC eSports', result: 'win', score: '3-1', tournament: 'EA FC Pro League RD', mode: 'solo' },
            { date: '2026-02-28', opponent: 'ElTiki', opponentTeam: 'Fútbol Virtual RD', result: 'win', score: '2-0', tournament: 'Ranked Match', mode: 'solo' },
        ]
    },
    { 
        id: 17, player: 'Messi_Criollo', realName: 'Richard Bautista', team: 'Santiago FC eSports', game: 'EA FC', region: 'Santiago', 
        points: 8450, wins: 182, losses: 52, lastActivity: 'Hace 3h', trend: 2, streak: 7, role: 'Pro Player', socialMedia: '@messi_criollo',
        joinDate: '2020-02-01', bio: 'Jugador de Santiago FC. Rival directo de Golazo_RD.',
        achievements: {
            solo: [
                { name: 'FIFA eWorld Cup RD Qualifier', date: '2025-05-15', place: 2 },
                { name: 'Copa Santiago EA FC', date: '2025-09-15', place: 1 },
            ],
            duo: [],
            team: []
        },
        matchHistory: [
            { date: '2026-03-02', opponent: 'Golazo_RD', opponentTeam: 'Fútbol Virtual RD', result: 'loss', score: '1-3', tournament: 'EA FC Pro League RD', mode: 'solo' },
        ]
    },
    { 
        id: 18, player: 'ElTiki', realName: 'Manuel Soriano', team: 'Fútbol Virtual RD', game: 'EA FC', region: 'San Pedro', 
        points: 8190, wins: 168, losses: 58, lastActivity: 'Hace 5h', trend: 1, streak: 5, role: 'Pro Player', socialMedia: '@eltiki_fc',
        joinDate: '2020-08-15', bio: 'Compañero de equipo de Golazo_RD.',
        achievements: { solo: [{ name: 'Copa Sur EA FC', date: '2025-06-20', place: 1 }], duo: [{ name: 'Pro Clubs Championship', date: '2025-07-20', partner: 'Golazo_RD', place: 1 }], team: [] },
        matchHistory: []
    },
    
    // More MLBB players
    { 
        id: 19, player: 'YoSoyElPro', realName: 'Rafael Núñez', team: 'Caribes RD', game: 'MLBB', region: 'Higüey', 
        points: 10320, wins: 172, losses: 68, lastActivity: 'Hace 2h', trend: 1, streak: 6, role: 'Mid Laner', socialMedia: '@yosoypro_ml',
        joinDate: '2022-04-10', bio: 'Mid laner de Caribes RD.',
        achievements: { solo: [], duo: [{ name: 'Duo Showdown RD', date: '2025-04-10', partner: 'TigreCaribe', place: 1 }], team: [{ name: 'Copa Caribe MLBB', date: '2025-04-30', team: 'Caribes RD', place: 1 }] },
        matchHistory: [
            { date: '2026-02-15', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '2-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
            { date: '2026-03-02', opponent: 'ElCapoDRD', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '1-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' },
        ]
    },
    { 
        id: 20, player: 'DragonRD', realName: 'Víctor Cabrera', team: 'Quisqueya Gaming', game: 'MLBB', region: 'Santo Domingo', 
        points: 9890, wins: 165, losses: 71, lastActivity: 'Hace 1h', trend: 2, streak: 4, role: 'Jungler', socialMedia: '@dragonrd_ml',
        joinDate: '2021-09-05', bio: 'Jungler de Quisqueya Gaming.',
        achievements: { solo: [], duo: [{ name: 'Duo Championship RD', date: '2025-06-15', partner: 'LaMentalidad', place: 3 }], team: [{ name: 'Copa Invernal 2025', date: '2025-01-30', team: 'Quisqueya Gaming', place: 1 }] },
        matchHistory: [
            { date: '2026-02-20', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'win', score: '2-1', tournament: 'Showmatch', mode: 'duo' },
        ]
    },
];

// ══════════════════════════════════════════════════════════════
// EQUIPOS - Organizaciones de esports dominicanas
// ══════════════════════════════════════════════════════════════
export const TEAMS_DATA = [
    { id: 1, name: 'Hispaniola Esports', tag: 'HISP', region: 'Santo Domingo', founded: 2021, games: ['MLBB', 'Valorant', 'LoL'], players: 18, trophies: 12, points: 45800, winRate: 78, logo: 'hispaniola', color: '#FF6B35' },
    { id: 2, name: 'Quisqueya Gaming', tag: 'QG', region: 'Santiago', founded: 2020, games: ['MLBB', 'Free Fire'], players: 14, trophies: 9, points: 42650, winRate: 74, logo: 'quisqueya', color: '#2E86AB' },
    { id: 3, name: 'RD Legends', tag: 'RDL', region: 'Santo Domingo', founded: 2019, games: ['Free Fire', 'MLBB'], players: 16, trophies: 15, points: 41200, winRate: 76, logo: 'rdlegends', color: '#8B0000' },
    { id: 4, name: 'Caribes RD', tag: 'CRD', region: 'La Romana', founded: 2022, games: ['MLBB', 'LoL'], players: 12, trophies: 6, points: 38900, winRate: 71, logo: 'caribes', color: '#00A86B' },
    { id: 5, name: 'Azucareros eSports', tag: 'AZU', region: 'San Pedro', founded: 2021, games: ['Valorant', 'LoL'], players: 10, trophies: 8, points: 37500, winRate: 73, logo: 'azucareros', color: '#FFD700' },
    { id: 6, name: 'Taínos Gaming', tag: 'TNG', region: 'Santo Domingo', founded: 2020, games: ['LoL', 'Valorant'], players: 11, trophies: 7, points: 35800, winRate: 69, logo: 'tainos', color: '#8B4513' },
    { id: 7, name: 'Fuego Dominicano', tag: 'FD', region: 'La Vega', founded: 2022, games: ['Free Fire'], players: 8, trophies: 4, points: 32400, winRate: 67, logo: 'fuego', color: '#FF4500' },
    { id: 8, name: 'Platano Power', tag: 'PP', region: 'Santo Domingo', founded: 2023, games: ['MLBB'], players: 6, trophies: 3, points: 28900, winRate: 65, logo: 'platano', color: '#9ACD32' },
    { id: 9, name: 'Cibao Stars', tag: 'CBS', region: 'Santiago', founded: 2021, games: ['LoL', 'Valorant'], players: 9, trophies: 5, points: 27600, winRate: 64, logo: 'cibao', color: '#4169E1' },
    { id: 10, name: 'Fútbol Virtual RD', tag: 'FVR', region: 'Santo Domingo', founded: 2020, games: ['EA FC'], players: 5, trophies: 11, points: 26800, winRate: 79, logo: 'futbol', color: '#228B22' },
    { id: 11, name: 'Tropicales eSports', tag: 'TRP', region: 'San Cristóbal', founded: 2022, games: ['Free Fire', 'MLBB'], players: 10, trophies: 3, points: 24500, winRate: 62, logo: 'tropicales', color: '#FF69B4' },
    { id: 12, name: 'Dominicana Clutch', tag: 'DCL', region: 'Santo Domingo', founded: 2023, games: ['Valorant'], players: 5, trophies: 2, points: 22100, winRate: 68, logo: 'clutch', color: '#800080' },
];

// ══════════════════════════════════════════════════════════════
// TORNEOS - Historial de torneos dominicanos
// ══════════════════════════════════════════════════════════════
export const TOURNAMENTS_DATA = [
    // Torneos Activos/Próximos
    { id: 1, name: 'Copa Nacional MLBB RD 2026', game: 'MLBB', status: 'active', startDate: '2026-02-15', endDate: '2026-03-30', prize: 150000, currency: 'DOP', teams: 32, registeredTeams: 28, location: 'Santo Domingo', organizer: 'Esportefy RD', format: 'Double Elimination', featured: true },
    { id: 2, name: 'Liga Dominicana Free Fire S1', game: 'Free Fire', status: 'active', startDate: '2026-01-20', endDate: '2026-04-15', prize: 200000, currency: 'DOP', teams: 24, registeredTeams: 24, location: 'Online + Finals Presencial', organizer: 'Garena RD', format: 'League + Playoffs', featured: true },
    { id: 3, name: 'Valorant Caribe Cup', game: 'Valorant', status: 'upcoming', startDate: '2026-03-10', endDate: '2026-04-20', prize: 100000, currency: 'DOP', teams: 16, registeredTeams: 12, location: 'Santiago', organizer: 'Riot Games LATAM', format: 'Single Elimination', featured: false },
    { id: 4, name: 'EA FC Pro League RD', game: 'EA FC', status: 'active', startDate: '2026-02-01', endDate: '2026-05-30', prize: 80000, currency: 'DOP', teams: 20, registeredTeams: 20, location: 'Online', organizer: 'EA Sports RD', format: 'Round Robin', featured: false },
    
    // Torneos Completados
    { id: 5, name: 'MLBB Championship 2025', game: 'MLBB', status: 'completed', startDate: '2025-10-01', endDate: '2025-12-15', prize: 250000, currency: 'DOP', teams: 48, registeredTeams: 48, location: 'Santo Domingo', organizer: 'Moonton RD', format: 'Double Elimination', champion: 'Hispaniola Esports', runnerUp: 'Quisqueya Gaming' },
    { id: 6, name: 'Free Fire Masters RD 2025', game: 'Free Fire', status: 'completed', startDate: '2025-08-15', endDate: '2025-11-20', prize: 300000, currency: 'DOP', teams: 36, registeredTeams: 36, location: 'La Romana', organizer: 'Garena RD', format: 'League + Finals', champion: 'RD Legends', runnerUp: 'Fuego Dominicano' },
    { id: 7, name: 'Liga LoL Dominicana 2025', game: 'LoL', status: 'completed', startDate: '2025-06-01', endDate: '2025-09-15', prize: 180000, currency: 'DOP', teams: 12, registeredTeams: 12, location: 'Online', organizer: 'Riot Games', format: 'Double Round Robin', champion: 'Taínos Gaming', runnerUp: 'Cibao Stars' },
    { id: 8, name: 'Valorant Open RD', game: 'Valorant', status: 'completed', startDate: '2025-07-10', endDate: '2025-08-30', prize: 120000, currency: 'DOP', teams: 24, registeredTeams: 24, location: 'Santiago', organizer: 'Esportefy RD', format: 'Swiss + Playoffs', champion: 'Azucareros eSports', runnerUp: 'Dominicana Clutch' },
    { id: 9, name: 'FIFA eWorld Cup RD Qualifier', game: 'EA FC', status: 'completed', startDate: '2025-04-01', endDate: '2025-05-15', prize: 100000, currency: 'DOP', teams: 64, registeredTeams: 64, location: 'Santo Domingo', organizer: 'EA Sports', format: 'Single Elimination', champion: 'Golazo_RD', runnerUp: 'Messi_Criollo' },
    { id: 10, name: 'Copa Caribe MLBB', game: 'MLBB', status: 'completed', startDate: '2025-03-01', endDate: '2025-04-30', prize: 175000, currency: 'DOP', teams: 40, registeredTeams: 40, location: 'Puerto Plata', organizer: 'Caribbean Esports', format: 'Double Elimination', champion: 'Caribes RD', runnerUp: 'Hispaniola Esports' },
];

// ══════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════
export const GAMES = ['Todos', 'MLBB', 'Free Fire', 'Valorant', 'LoL', 'EA FC'];
export const REGIONS = ['Todas', 'Santo Domingo', 'Santiago', 'La Romana', 'La Vega', 'San Pedro', 'Puerto Plata', 'Punta Cana', 'Higüey', 'San Cristóbal'];
export const SEASONS = ['Temporada 1 2026', 'Pre-Season 2026', 'Temporada 2 2025'];
export const TOURNAMENT_STATUS = ['Todos', 'active', 'upcoming', 'completed'];

// Helper functions
export const getWinRate = (wins, losses) => {
    const total = wins + losses;
    if (!total) return 0;
    return Math.round((wins / total) * 100);
};

export const formatPrize = (amount, currency = 'DOP') => {
    if (currency === 'DOP') {
        return `RD$${amount.toLocaleString()}`;
    }
    return `$${amount.toLocaleString()} USD`;
};

export const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getStatusLabel = (status) => {
    switch (status) {
        case 'active': return 'En Curso';
        case 'upcoming': return 'Próximamente';
        case 'completed': return 'Finalizado';
        default: return status;
    }
};
