# Riot Developer Portal - App Notes (Prototype Submission)

## Project Summary
Esportefy is a tournament platform prototype focused on community competition. In this stage, Riot-powered features are limited to account verification and eligibility checks for Riot titles.

## Compliance Scope
- The prototype does not use official Riot logos.
- The project does not claim partnership or official Riot approval.
- Riot API key is stored server-side only (never exposed in frontend code).
- Development/Interim key usage is restricted to controlled environments.
- The platform does not provide alternate ranking systems (MMR/ELO alternatives).
- The platform does not include player-shaming features or negative public scoring.
- Riot data is consumed only from documented Riot API endpoints.
- No in-game chat integrations or undocumented Riot systems are used.
- Riot tournaments are enforced as free registration (no paid access).

## Security and Key Handling
- Backend environment-based key mode:
  - `RIOT_KEY_MODE=development|production`
  - `ALLOW_RIOT_DEV_KEY_IN_PROD=false` by default
- Additional prototype safeguard:
  - `RIOT_REVIEW_MODE=true` can be enabled to force free registration globally during review.
- Production/public mode blocks development/interim key usage unless explicitly overridden in controlled tests.

## Riot ID and Integrity Validations
- Riot ID format validation (`GameName#TagLine`).
- Verification against Riot Account endpoint before protected actions.
- Linked Riot account uniqueness (one Riot account cannot be verified by multiple users).
- Team integrity checks:
  - no duplicate Riot IDs inside the same roster,
  - no duplicate Riot IDs across teams (same game scope where applicable).
- Tournament integrity checks:
  - no duplicate Riot IDs across registered teams in Riot-restricted tournaments,
  - captain/team ownership and game consistency validations.

## Product Behavior During Review
- Riot titles only allow free/open registration modes.
- In frontend prototype mode (`VITE_RIOT_REVIEW_MODE=true`), paid/invite/password entry modes are disabled.
- In backend prototype mode (`RIOT_REVIEW_MODE=true`), non-free entry is rejected at API level.
- Riot tournament start is blocked if active participants are below policy minimum (default: 20).
- Riot bracket generation enforces traditional competitive formats and direct opponent structures.
- While Riot registrations remain open, custom seeding is blocked to preserve balanced/fair matchmaking.

## Intended Player Experience
- Help players organize and join fair community tournaments.
- Encourage self-improvement and team coordination.
- Avoid toxic comparison mechanics and non-official ranking systems.

## Notes for Riot Review Team
If you want, we can provide:
- test accounts,
- a short walkthrough video,
- a minimal endpoint list of Riot API calls used in the prototype.
