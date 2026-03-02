# Riot Compliance Checklist (Prototype)

Date: 2026-02-24
Project: Esportefy

This is a practical checklist we use before submitting the prototype for Riot review.

## 1) Env setup used for review
Backend:
- `RIOT_KEY_MODE=development|production`
- `ALLOW_RIOT_DEV_KEY_IN_PROD=false`
- `RIOT_REVIEW_MODE=true`
- `RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS=20`

Frontend:
- `VITE_RIOT_REVIEW_MODE=true`
- `VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20`

References:
- `Backend/.env.Example:12`
- `Backend/.env.Example:14`
- `Backend/.env.Example:16`
- `Backend/.env.Example:18`
- `frontend/.env.example:11`
- `frontend/.env.example:14`

## 2) General policy coverage

Key security and API scope:
- Key stays in backend and is validated before calls.
  - `Backend/src/controllers/riot.controller.js:16`
  - `Backend/src/controllers/riot.controller.js:34`
  - `Backend/src/controllers/riot.controller.js:149`
- Dev/interim key protection in public contexts.
  - `Backend/src/controllers/riot.controller.js:41`
  - `Backend/src/controllers/riot.controller.js:46`
  - `Backend/src/controllers/riot.controller.js:52`

Riot ID correctness and uniqueness:
- Riot ID format + limits (`GameName#TagLine`).
  - `Backend/src/controllers/riot.controller.js:71`
  - `Backend/src/controllers/riot.controller.js:86`
- Same Riot account cannot be linked to different users.
  - `Backend/src/controllers/riot.controller.js:234`
  - `Backend/src/controllers/riot.controller.js:259`
  - `Backend/src/controllers/riot.controller.js:385`

Anti-abuse and request protection:
- Rate limiting on Riot auth routes.
  - `Backend/src/routes/auth.routes.js:45`
  - `Backend/src/routes/auth.routes.js:78`
  - `Backend/src/routes/auth.routes.js:85`

No shaming / no fake affiliation:
- Terms explicitly ban shaming-style use and alt ranking claims.
  - `frontend/src/pages/menu/Legal/TermsConditions.jsx:40`
- Non-affiliation language present in legal/settings UI.
  - `frontend/src/pages/menu/Settings/Settings.jsx:444`
  - `frontend/src/pages/menu/Legal/TermsConditions.jsx:36`
  - `frontend/src/pages/menu/Legal/OrganizerTerms.jsx:49`

## 3) Tournament policy coverage

Policy 1 (fair and balanced matchmaking):
- Riot tournaments block custom seeding while registration is open.
  - `Backend/src/controllers/tournament.controller.js:1610`
  - `Backend/src/controllers/tournament.controller.js:1612`

Policy 2 (features available to all participants):
- Riot/review scope forces free registration modes.
  - `Backend/src/controllers/tournament.controller.js:1378`
  - `Backend/src/controllers/tournament.controller.js:1485`
  - `Backend/src/controllers/tournament.controller.js:1868`
  - `frontend/src/pages/menu/Tournaments/CreateTournament/CreateTournament.jsx:476`

Policy 3 (minimum 20 active participants):
- Enforced on create/update capacity checks and start checks.
  - `Backend/src/controllers/tournament.controller.js:59`
  - `Backend/src/controllers/tournament.controller.js:1387`
  - `Backend/src/controllers/tournament.controller.js:1496`
  - `Backend/src/controllers/tournament.controller.js:2236`

Policy 4 (traditional direct-opponent progression):
- Bracket must be traditional and present before start.
  - `Backend/src/controllers/tournament.controller.js:115`
  - `Backend/src/controllers/tournament.controller.js:1618`
  - `Backend/src/controllers/tournament.controller.js:2221`
  - `Backend/src/controllers/tournament.controller.js:2224`

Policy 5 (no wagering/gambling outside nominal fee):
- Riot scope is free-only in backend + legal statement in payment policy.
  - `Backend/src/controllers/tournament.controller.js:1379`
  - `Backend/src/controllers/tournament.controller.js:1869`
  - `frontend/src/pages/menu/Legal/PaymentPolicy.jsx:39`

Policy 6 (no custom currency with monetary value in Riot flows):
- Riot flows use free mode (`Gratis`) to avoid buy-in/currency ambiguity.
  - `Backend/src/controllers/tournament.controller.js:25`
  - `Backend/src/controllers/tournament.controller.js:82`
  - `frontend/src/pages/menu/Tournaments/CreateTournament/CreateTournament.jsx:101`

## 4) Extra integrity checks for Riot tournaments
- Duplicate players in one roster are blocked.
  - `Backend/src/controllers/tournament.controller.js:1967`
- Duplicate Riot IDs among starters are blocked.
  - `Backend/src/controllers/tournament.controller.js:1986`
- Duplicate Riot IDs across tournament registrations are blocked.
  - `Backend/src/controllers/tournament.controller.js:2042`
- Riot tournaments require official platform team registration (`teamId`) and linked Riot accounts.
  - `Backend/src/controllers/tournament.controller.js:1925`
  - `Backend/src/controllers/tournament.controller.js:1880`

## 5) Quick test script before submission
1. Create Riot tournament with `entryFee=Pago` -> should return 400.
2. Create Riot tournament with low participant capacity (ex: `1v1`, `maxSlots=8`) -> should return 400.
3. Generate Riot bracket with `seedingMode=custom` while open -> should return 400.
4. Start Riot tournament with fewer than 20 active participants -> should return 400.
5. Register a team with repeated Riot IDs -> should return 400.

## 6) Final pending checks
- Confirm `riot-icon.svg` is not an official Riot logo (replace if needed).
  - usage: `frontend/src/pages/menu/Settings/Settings.jsx:433`
- Keep review mode enabled in the review/staging environment.
- If Tournament API lobby creation is added later, keep it tied to real tournament matches only.
