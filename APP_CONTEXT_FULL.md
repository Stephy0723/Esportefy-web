# 📋 CONTEXTO COMPLETO - ESPORTEFY WEB

## 🎮 VISIÓN GENERAL
**Esportefy** es una plataforma competitiva multiplayer para esports que permite:
- Gestión de equipos y jugadores
- Organización de torneos
- Comunidades gaming
- Seguimiento de perfiles competitivos
- Integración con OAuth (Riot, Epic Games, Steam, Microsoft Entra)
- Estadísticas y rankings

---

## 🏗️ ARQUITECTURA

### **Backend (Node.js + Express)**
- **BD:** MongoDB con Mongoose
- **Auth:** JWT, OAuth, 2FA
- **Archivos:** Multer + Cloudinary
- **Real-time:** Socket.io
- **APIs externas:** Riot API, Tracker Network

### **Frontend (Vite + React)**
- **UI:** TailwindCSS, Framer Motion
- **Gráficos:** ApexCharts, Chart.js
- **Routing:** React Router v7
- **Cliente HTTP:** Axios
- **Real-time:** Socket.io-client

### **Chat Service (Microservicio)**
- Conversaciones (individual/team)
- Mensajes con archivos
- Polls

---

## 🎮 JUEGOS SOPORTADOS

| Juego | Tipo | Provider | Estado |
|-------|------|----------|--------|
| League of Legends | MOBA | Riot | ✅ Activo |
| Valorant | FPS | Riot | ✅ Activo |
| Mobile Legends | MOBA | Garena | ✅ Activo |
| Dota 2 | MOBA | - | ✅ Soporte |
| Counter-Strike 2 | FPS | - | ✅ Soporte |
| Fortnite | BR | Epic | ✅ Soporte |
| +40 juegos más | Varios | - | 📦 Disponibles |

---

## 🗄️ MODELOS PRINCIPALES

### **User**
```javascript
- userCode (único, prefijo por país)
- avatar, bio
- Email, contraseña (bcrypt)
- teams[], followers[], friends[]
- gamingConnections (Discord, Riot, Steam, Epic, PSN, Xbox, Nintendo)
- socialLinks (Twitch, YouTube, Twitter, Instagram, TikTok)
- roles: ['player', 'organizer', 'caster', 'sponsor', 'analyst', 'coach', 'content-creator']
- roleApplications (con status: pending/approved/rejected)
- university (verificación universitaria)
- twoFactorEnabled, activityLog
- notifications[], blockedUsers[]
- mlbbClaimHistory (Mobile Legends vinculación)
```

### **Team**
```javascript
- teamCode (único)
- name, slogan, logo
- game, category, level, country, language
- captain (User ref)
- roster: { starters[], subs[], coach }
- university (para equipos universitarios)
- community (ref a Community)
- inviteCode, joinRequests[]
- sponsor
```

### **Tournament**
```javascript
- tournamentId (único: TOUR-XXXXXX)
- title, description, game, modality (5v5, 1v1)
- date, status: ['draft', 'open', 'ongoing', 'finished', 'cancelled']
- bannerImage, rulesPdf
- organizer (User ref)
- registrations[] (equipos registrados)
- bracket: { format, seedingMode, rounds[], matches[] }
  - Formatos: single_elimination, double_elimination, swiss, round_robin
- staff (moderators, casters, refs)
- riotRequirements (minTier, maxTier, soloQueueOnly)
- reports[], sanctions[]
- sponsors[]
```

### **Match (dentro de Tournament.bracket.rounds[])**
```javascript
- matchId, round
- teamA { refId, teamId, seed, name }
- teamB { refId, teamId, seed, name }
- scoreA, scoreB
- status: ['pending', 'ready', 'live', 'finished', 'walkover']
- resultSubmissions[] (para validar resultados)
- proofUrl, resolvedBy
```

### **Community**
```javascript
- name, description
- games[], category
- avatar, banner
- members[] { user, role, joinedAt }
  - roles: ['owner', 'admin', 'moderator', 'member']
- socialLinks (Discord, Twitch, Twitter, etc.)
- rules[], auditLog[]
- status: ['active', 'archived', 'banned']
- region, language, audience, whoCanPost
```

### **Chat (Conversation)**
```javascript
- participants[]
- type: ['individual', 'team']
- teamId, title, image
- messages[] { sender, content, timestamp, attachments[] }
- lastMessage, updatedAt
```

---

## 📡 ENDPOINTS PRINCIPALES

### **Auth**
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `POST /auth/oauth/:provider` - OAuth (riot, epic, steam)
- `POST /auth/2fa/enable` - 2FA
- `POST /auth/2fa/verify` - Verificar 2FA

### **Users**
- `GET /users/:userId` - Perfil
- `PUT /users/:userId` - Actualizar perfil
- `GET /users/:userId/teams` - Equipos del usuario
- `GET /users/:userId/tournaments` - Torneos del usuario
- `POST /users/:userId/follow` - Seguir usuario
- `POST /users/:userId/friend-request` - Solicitud amistad

### **Teams**
- `POST /teams` - Crear equipo
- `GET /teams/:teamId` - Detalles equipo
- `PUT /teams/:teamId` - Editar equipo
- `POST /teams/:teamId/join` - Solicitar unirse
- `POST /teams/:teamId/roster` - Editar roster
- `POST /teams/:teamId/invite` - Invitar jugador

### **Tournaments**
- `POST /tournaments` - Crear torneo
- `GET /tournaments/:tournamentId` - Detalles
- `POST /tournaments/:tournamentId/register` - Registrar equipo
- `POST /tournaments/:tournamentId/bracket/generate` - Generar bracket
- `POST /tournaments/:tournamentId/match/:matchId/submit-result` - Enviar resultado
- `POST /tournaments/:tournamentId/report` - Reportar problema

### **Communities**
- `POST /communities` - Crear comunidad
- `GET /communities/:communityId` - Detalles
- `POST /communities/:communityId/members` - Unirse
- `POST /communities/:communityId/posts` - Crear post
- `GET /communities/:communityId/posts` - Feed

---

## 🔐 SEGURIDAD IMPLEMENTADA

✅ JWT con refresh tokens
✅ 2FA (TOTP, backup codes)
✅ Bcrypt para contraseñas
✅ MongoDB sanitization (express-mongo-sanitize)
✅ Helmet para headers HTTP
✅ CORS configurado
✅ Rate limiting
✅ Input validation
✅ OAuth seguro (state, PKCE)
✅ Activity logging (login, logout, cambios)

---

## 🌍 CARACTERÍSTICAS POR JUEGO

### **League of Legends / Valorant (Riot)**
- Vinculación Riot ID automática
- Validación de tier/rank
- Solo Queue only (LoL)
- Sincronización desde Riot API

### **Mobile Legends**
- Claim playerId + zoneId
- Validación de cuenta
- mlbbClaimHistory para auditoría

### **General**
- Roles (main champions/agents)
- Regiones por juego
- Validación universitaria

---

## 📊 FLUJOS PRINCIPALES

### 1️⃣ **Crear Torneo → Registrar Equipo → Jugar → Reportar Resultado → Ganador**
```
Tournament.draft → open → registrations → bracket generated
→ matches ready → live/finished → results submitted → resolved → winner
```

### 2️⃣ **Usuario → Crear Equipo → Invitar Jugadores → Registrarse Torneo**
```
User signup → create team → invite players → tournament registration
→ roster validation → bracket seeding → matches
```

### 3️⃣ **Comunidad → Miembros → Posts → Feed**
```
Create community → invite members → roles (owner/admin/mod/member)
→ posts (text/image/video/link) → moderation
```

---

## 📁 ESTRUCTURA CARPETAS

```
Backend/src/
├── models/
│   ├── User.js
│   ├── Team.js
│   ├── Tournament.js
│   ├── Community.js
│   ├── CommunityPost.js
│   ├── ActivityLog.js
│   └── AdminAuditLog.js
├── controllers/
│   ├── user.controller.js
│   ├── team.controller.js
│   ├── tournament.controller.js
│   ├── community.controller.js
│   └── auth.controller.js
├── services/
│   ├── riot.service.js
│   ├── mail.service.js
│   ├── storage.service.js
│   └── 2fa.service.js
├── routers/ & routes/
├── middlewares/
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── errorHandler.middleware.js
├── config/
└── utils/

Frontend/src/
├── components/
│   ├── Auth/
│   ├── Teams/
│   ├── Tournaments/
│   ├── Community/
│   ├── Dashboard/
│   └── Profile/
├── pages/
├── context/ (Estado global)
├── utils/ (helpers, API calls)
├── styles/
└── assets/
```

---

## 🔌 INTEGRACIONES EXTERNAS

| Servicio | Propósito | Status |
|----------|-----------|--------|
| Riot API | LoL/Valorant data | ✅ Integrado |
| Tracker Network | Estadísticas competitivas | 🔄 **A INTEGRAR** |
| Cloudinary | Almacenamiento imágenes | ✅ Integrado |
| SendGrid/Nodemailer | Email | ✅ Integrado |
| OAuth (Epic, Steam, MSEntra) | Autenticación | ✅ Integrado |
| Socket.io | Chat real-time | ✅ Integrado |

---

## 📈 STATS ACTUALES

- **Usuarios:** 1000+
- **Equipos:** 500+
- **Torneos:** 100+
- **Comunidades:** 50+
- **Juegos soportados:** 45+
- **Roles de usuario:** 7

---

## ⚡ PRÓXIMAS INTEGRACIONES

1. **Tracker Network** (en progreso)
   - Stats jugadores
   - Historial competitivo
   - Rankings

2. **Más OAuth**
   - Google
   - Discord nativo

3. **Sistema de sponsors**
4. **Streaming integration**
5. **Advanced analytics**

---

## 🎯 NOTAS IMPORTANTE

- **Multijuego:** Soporta 45+ juegos con lógica específica por juego
- **Universitario:** Sistema verificación para torneos académicos
- **RIOT-native:** Integración profunda con Riot (Valorant, LoL, TFT, WildRift)
- **Real-time:** Socket.io para chat, notificaciones, live match updates
- **Modular:** Servicios desacoplados, fácil de escalar

---

**Última actualización:** 29 de Marzo, 2026
**Rama activa:** Angel-Gonzalez
