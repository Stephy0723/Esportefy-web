# Riot Compliance Checklist (Prototype)

Date: 2026-02-24
Scope: Esportefy prototype (Riot integration + tournaments)

## Environment Baseline
- Backend env:
  - `RIOT_KEY_MODE=development|production`
  - `ALLOW_RIOT_DEV_KEY_IN_PROD=false`
  - `RIOT_REVIEW_MODE=true` (for submission builds)
  - `RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS=20`
- Frontend env:
  - `VITE_RIOT_REVIEW_MODE=true`
  - `VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20`

References:
- `Backend/.env.Example:12`
- `Backend/.env.Example:14`
- `Backend/.env.Example:16`
- `Backend/.env.Example:18`
- `frontend/.env.example:11`
- `frontend/.env.example:14`

## General Policies Mapping

| Riot policy | Current implementation | Evidence |
|---|---|---|
| Secure API key | Riot key is server-side only and validated before calls. | `Backend/src/controllers/riot.controller.js:16`, `Backend/src/controllers/riot.controller.js:34`, `Backend/src/controllers/riot.controller.js:149` |
| No Development key in public deployments | Blocks non-production key in public/prod contexts unless explicit override. | `Backend/src/controllers/riot.controller.js:41`, `Backend/src/controllers/riot.controller.js:46`, `Backend/src/controllers/riot.controller.js:52` |
| Riot ID integrity and format validation | Validates `GameName#TagLine` and size constraints before API calls. | `Backend/src/controllers/riot.controller.js:71`, `Backend/src/controllers/riot.controller.js:86`, `Backend/src/controllers/riot.controller.js:90` |
| One Riot account cannot be linked to multiple users | Checks existing verified link by `puuid` across users. | `Backend/src/controllers/riot.controller.js:234`, `Backend/src/controllers/riot.controller.js:259`, `Backend/src/controllers/riot.controller.js:385` |
| Anti-abuse for Riot endpoints | Dedicated Riot rate limiter on auth routes. | `Backend/src/routes/auth.routes.js:45`, `Backend/src/routes/auth.routes.js:78`, `Backend/src/routes/auth.routes.js:85` |
| Team and roster Riot ID consistency | Linked Riot account must match player Riot ID; duplicates blocked within team and across teams. | `Backend/src/controllers/team.controller.js:372`, `Backend/src/controllers/team.controller.js:401`, `Backend/src/controllers/team.controller.js:472`, `Backend/src/controllers/team.controller.js:477` |
| No alternative official ranking systems or shaming tools | Legal text explicitly states no player-shaming and no alternative official rankings. | `frontend/src/pages/menu/Legal/TermsConditions.jsx:40` |
| No false Riot affiliation claims | Non-affiliation language in settings and legal pages. | `frontend/src/pages/menu/Settings/Settings.jsx:444`, `frontend/src/pages/menu/Legal/TermsConditions.jsx:36`, `frontend/src/pages/menu/Legal/OrganizerTerms.jsx:49` |

## Tournament Policies Mapping

| Tournament policy | Current implementation | Evidence |
|---|---|---|
| 1) Fair and balanced matchmaking | While registration is open, Riot tournaments block custom seeding and require random seeding. | `Backend/src/controllers/tournament.controller.js:1610`, `Backend/src/controllers/tournament.controller.js:1612` |
| 2) Features freely available for participants | Riot/review scope enforces free registration (no paid/invite/password access). | `Backend/src/controllers/tournament.controller.js:1378`, `Backend/src/controllers/tournament.controller.js:1485`, `Backend/src/controllers/tournament.controller.js:1868`, `frontend/src/pages/menu/Tournaments/CreateTournament/CreateTournament.jsx:476` |
| 3) Minimum 20 active participants | Enforced in create/update capacity and start validation using active participant counting. | `Backend/src/controllers/tournament.controller.js:59`, `Backend/src/controllers/tournament.controller.js:1387`, `Backend/src/controllers/tournament.controller.js:1496`, `Backend/src/controllers/tournament.controller.js:2236` |
| 4) Traditional tournament progression (direct opponents) | Bracket must be traditional and start requires a valid generated bracket. | `Backend/src/controllers/tournament.controller.js:115`, `Backend/src/controllers/tournament.controller.js:1618`, `Backend/src/controllers/tournament.controller.js:2221`, `Backend/src/controllers/tournament.controller.js:2224` |
| 5) No wagering/betting/gambling | Riot tournaments are forced to free access; payment policy states Riot tournaments are free/no exclusive access. | `Backend/src/controllers/tournament.controller.js:1379`, `Backend/src/controllers/tournament.controller.js:1869`, `frontend/src/pages/menu/Legal/PaymentPolicy.jsx:39` |
| 6) No custom currency with monetary value for Riot flows | Riot flow is free-only (`Gratis`), avoiding buy-in/currency ambiguity for Riot scope. | `Backend/src/controllers/tournament.controller.js:25`, `Backend/src/controllers/tournament.controller.js:82`, `frontend/src/pages/menu/Tournaments/CreateTournament/CreateTournament.jsx:101` |

## Data Integrity for Riot Tournaments
- Duplicate players in roster blocked:
  - `Backend/src/controllers/tournament.controller.js:1967`
- Duplicate Riot IDs among starters blocked:
  - `Backend/src/controllers/tournament.controller.js:1986`
- Duplicate Riot IDs across tournament registrations blocked:
  - `Backend/src/controllers/tournament.controller.js:2042`
- Riot tournaments require official platform teams (`teamId`) and linked Riot accounts:
  - `Backend/src/controllers/tournament.controller.js:1925`
  - `Backend/src/controllers/tournament.controller.js:1880`

## Quick Verification Scenarios (Manual QA)
1. Try creating Riot tournament with `entryFee=Pago`.
   - Expected: HTTP 400 with free-registration policy message.
2. Try creating Riot tournament with capacity below 20 active participants (ex: `1v1` + `maxSlots=8`).
   - Expected: HTTP 400 capacity policy message.
3. Generate bracket for Riot tournament while registration is open using `seedingMode=custom`.
   - Expected: HTTP 400 (must be random while open).
4. Start Riot tournament with fewer than 20 active participants.
   - Expected: HTTP 400 minimum participants message.
5. Register team with duplicate Riot IDs in roster or already present in tournament.
   - Expected: HTTP 400 duplicate Riot ID message.

## Pending Before Submission
- Verify that `riot-icon.svg` is not an official Riot logo or replace with neutral icon if needed.
  - Reference usage: `frontend/src/pages/menu/Settings/Settings.jsx:433`
- Keep `RIOT_REVIEW_MODE=true` and `VITE_RIOT_REVIEW_MODE=true` in the demo/review environment.
- If Tournament API lobby-creation endpoints are added later, keep them strictly tied to tournament flows (not single-match lobby generation).
