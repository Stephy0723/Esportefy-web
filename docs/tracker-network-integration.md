# 📊 TRACKER NETWORK INTEGRATION

## 🎯 Overview

Sistema de estadísticas competitivas con **dos niveles de permisos**:

- **USUARIOS NORMALES**: Estadísticas públicas (rank básico, winrate, main champs)
- **ADMINS**: Estadísticas detalladas (análisis profundo, tendencias, KDA, etc.)

---

## 🔧 Setup

### 1. Agregar API Key a `.env`

```bash
TRACKER_NETWORK_API_KEY=tu_api_key_aqui
```

Obtener en: https://tracker.gg/site-api

### 2. Juegos Soportados

- **League of Legends** (LoL)
- **Valorant**

---

## 📡 ENDPOINTS

### 1. Obtener Stats de Jugador

```http
GET /api/stats/player/:game/:identifier
```

**Parámetros:**
- `game`: `lol` | `valorant`
- `identifier`:
  - LoL: `Faker` (summoner name)
  - Valorant: `Player%23NA1` (gameName#tagLine)

**Query:**
- `force=true` - Ignora cache, trae datos frescos

**Ejemplo:**

```bash
# LoL
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/stats/player/lol/Faker"

# Valorant
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/stats/player/valorant/SomePlayer%23NA1"
```

**Response (Usuario Normal):**

```json
{
  "ok": true,
  "game": "lol",
  "identifier": "Faker",
  "data": {
    "rank": {
      "tier": "Challenger",
      "lp": 950,
      "wins": 156,
      "losses": 89
    },
    "winRate": "63.74",
    "mainChampions": [
      {
        "name": "Ahri",
        "gamesPlayed": 45,
        "winRate": "65.25",
        "mainRole": "Mid"
      },
      {
        "name": "Zed",
        "gamesPlayed": 38,
        "winRate": "62.35",
        "mainRole": "Mid"
      },
      {
        "name": "LeBlanc",
        "gamesPlayed": 32,
        "winRate": "65.80",
        "mainRole": "Mid"
      }
    ],
    "lastUpdated": "2026-03-29T15:30:00Z",
    "platform": "League of Legends",
    "permissionLevel": "public"
  }
}
```

**Response (Admin):**

```json
{
  "ok": true,
  "game": "lol",
  "identifier": "Faker",
  "data": {
    "rank": { ... },
    "winRate": "63.74",
    "mainChampions": [ ... ],
    "lastUpdated": "2026-03-29T15:30:00Z",
    "platform": "League of Legends",
    "permissionLevel": "admin",
    "accessedBy": "admin_user_id",
    "accessedAt": "2026-03-29T16:00:00Z",
    
    // 🔒 SOLO ADMIN VE ESTO:
    "competitive": {
      "tier": "Challenger",
      "division": "I",
      "leaguePoints": 950,
      "winRatePercentage": "63.74%",
      "gamesPlayed": 245
    },
    "performance": {
      "kda": "3.24",
      "kdaRatio": 3.24,
      "killsPerGame": 5.2,
      "deathsPerGame": 1.6,
      "assistsPerGame": 10.3,
      "csPerMinute": "8.5",
      "goldPerMinute": "425.3",
      "damagePerMinute": "245.8"
    },
    "champions": {
      "mostPlayed": [ ... 10 campeones ... ],
      "totalChampionsPlayed": 28
    },
    "matches": {
      "recentMatches": [ ... ],
      "matchHistory": 500
    },
    "trends": {
      "lpTrend": "rising",
      "winRateTrend": "stable",
      "championMetaAlignment": { ... }
    },
    "roleDistribution": {
      "Mid": 85,
      "Top": 8,
      "Jungle": 5,
      "ADC": 2
    },
    "skillAssessment": "Pro/Elite",
    "dataQuality": "complete"
  }
}
```

---

### 2. Comparar Dos Jugadores

```http
GET /api/stats/compare/:game?players=player1,player2
```

**Solo Admin puede usar este endpoint**

**Ejemplo:**

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/stats/compare/lol?players=Faker,T1%20Khan"
```

**Response:**

```json
{
  "ok": true,
  "game": "lol",
  "data": {
    "player1": {
      "name": "Faker",
      "competitive": { ... },
      "performance": { ... },
      "skillAssessment": "Pro/Elite"
    },
    "player2": {
      "name": "T1 Khan",
      "competitive": { ... },
      "performance": { ... },
      "skillAssessment": "Advanced"
    },
    "comparison": {
      "tierDifference": "Mismo tier",
      "winRateDifference": "5.23",
      "performanceScore": {
        "player1": 92,
        "player2": 87
      }
    }
  }
}
```

---

### 3. Stats del Equipo

```http
GET /api/stats/team/:teamId
```

*(En construcción)*

---

### 4. Auditoría (Admin Only)

```http
POST /api/stats/audit
```

**Body:**

```json
{
  "game": "lol",
  "identifier": "Faker",
  "action": "view_detailed_stats"
}
```

---

## 🔐 Permisos

| Endpoint | Usuario Normal | Admin |
|----------|---|---|
| `GET /player/:game/:identifier` | ✅ Stats públicas | ✅ Stats completas |
| `GET /compare/:game` | ❌ Acceso denegado | ✅ Datos completos |
| `GET /team/:teamId` | ✅ Resumen | ✅ Análisis detallado |
| `POST /audit` | ❌ Acceso denegado | ✅ Registra acceso |

---

## 💾 Caché

El sistema implementa caché de **1 hora** para reducir llamadas a Tracker Network API:

```javascript
// Usa caché (default)
GET /api/stats/player/lol/Faker

// Ignora caché
GET /api/stats/player/lol/Faker?force=true
```

---

## 📊 Datos Públicos (Usuarios Normales)

```javascript
{
  rank: {
    tier,
    lp,
    wins,
    losses
  },
  winRate,
  mainChampions: [{ name, gamesPlayed, winRate, mainRole }],
  lastUpdated,
  platform
}
```

---

## 🔍 Datos Detallados (Admin Only)

```javascript
{
  // Públicos +
  competitive: {
    tier,
    division,
    leaguePoints,
    winRatePercentage,
    gamesPlayed
  },
  performance: {
    kda,
    kdaRatio,
    killsPerGame,
    deathsPerGame,
    assistsPerGame,
    csPerMinute,
    goldPerMinute,
    damagePerMinute
  },
  champions: {
    mostPlayed: [10 champions],
    totalChampionsPlayed
  },
  matches: {
    recentMatches,
    matchHistory
  },
  trends: {
    lpTrend,        // rising, falling, stable
    winRateTrend,   // rising, falling, stable
    championMetaAlignment
  },
  roleDistribution: { Mid: 85, Top: 8, ... },
  skillAssessment: "Pro/Elite" | "Advanced" | "Intermediate" | "Beginner",
  dataQuality: "complete"
}
```

---

## 🎮 Particularidades por Juego

### League of Legends

- Métrica: **LP (League Points)**
- Stats: Tier, division, winrate, KDA, CS/min
- Champions: Stats por campeón
- Roles: Top, Jungle, Mid, ADC, Support

### Valorant

- Métrica: **RR (Ranked Rating)**
- Stats: Rank, RR, headshot %, combat score
- Agents: Stats por agente
- Mapas: Performance por mapa

---

## 🚀 Próximas Mejoras

- [ ] Stats de equipos (team avg)
- [ ] Integración con perfiles de usuario
- [ ] Historial de cambios de rank
- [ ] Notificaciones cuando un jugador sube de tier
- [ ] Dashboard de analytics
- [ ] Exports a PDF/CSV (admin)
- [ ] Mobile Legends (Tracker Network no soporta)

---

## ❌ Errores Comunes

**401 - No autorizado:**
```json
{
  "ok": false,
  "message": "Token no válido o expirado"
}
```

**404 - Jugador no encontrado:**
```json
{
  "ok": false,
  "message": "No se encontraron datos para {identifier} en Tracker Network"
}
```

**403 - Permiso denegado:**
```json
{
  "ok": false,
  "message": "Solo administradores pueden comparar estadísticas detalladas"
}
```

**429 - Rate limit:**
```json
{
  "ok": false,
  "message": "Demasiadas solicitudes. Intenta más tarde"
}
```

---

## 📝 Logs de Auditoría

Todos los accesos a stats de admin se registran con:
- User ID
- Game
- Identifier
- Timestamp
- Action

Útil para auditar accesos sensibles.

---

## 🔗 Documentación Oficial

- **Tracker Network API**: https://tracker.gg/site-api
- **LoL API Docs**: https://www.trackerapi.com/documentation/docs/lol
- **Valorant API Docs**: https://www.trackerapi.com/documentation/docs/valorant

---

**Última actualización:** 29 de Marzo, 2026
