# Riot App Notes (Submission Ready)

Date: 2026-02-25
Project: GlitchGang

## 1) Copy/Paste for Riot Developer Portal

### Product Name
GlitchGang

If the public review build uses a visible brand variant, mention it explicitly in the description so the reviewer can map the site to the portal submission.

### Product Description
GlitchGang is a community tournament platform focused on fair, organized competition for amateur and semi-competitive players.

In this prototype, Riot APIs are used only for account identity and eligibility checks:
- validate Riot ID format and ownership flow,
- link one Riot account to one GlitchGang user,
- record a separate player consent flow for VALORANT through Riot Sign On when enabled,
- enforce tournament integrity rules for Riot-scoped events.

For Riot-related tournaments, we enforce policy-safe behavior in-app:
- free registration only,
- traditional competitive formats (single elimination, double elimination, swiss, round robin),
- minimum active participant requirements,
- duplicate Riot identity prevention across roster and tournament registrations.

The project does not expose undocumented endpoints, does not claim Riot partnership, does not provide alternate official ranking systems, and does not include player-shaming features.

### Product Group
Default Group (or your GlitchGang team group in Developer Portal)

### Product URL
Use your public HTTPS prototype URL (staging/review environment).
Example: `https://glitchgang.net`

Suggested reviewer helper URL:
- `https://glitchgang.net/review/riot`

### Product Game Focus
Register one product per game if needed.
Suggested first submission:
- League of Legends

If you will also use VALORANT flows in production, submit a separate product for VALORANT.

### Are you organizing tournaments?
Yes.

## 2) App Notes (paste in the application)

GlitchGang is a tournament platform where Riot integration is limited to identity verification and tournament integrity checks.

What we do:
- Validate Riot ID (`GameName#TagLine`) using official Riot endpoints.
- Link one Riot account to one GlitchGang user.
- Use a separate Riot Sign On consent step for VALORANT when that environment has RSO enabled.
- Enforce eligibility checks in Riot-scoped tournaments.
- Block duplicate Riot IDs inside a roster and across tournament registrations.

What we do not do:
- No claim of Riot partnership/endorsement.
- No undocumented Riot endpoints.
- No MMR/ELO replacement systems.
- No player-shaming features.
- No non-tournament single-match lobby workflows.

Key/security handling:
- Riot API key is backend-only.
- Non-production key use is restricted in public contexts.
- If a private HTTPS review build temporarily uses a dev key, it is gated for reviewer-only access and `RIOT_REVIEW_MODE=true`.
- Rate limiting is enabled on Riot auth endpoints.

Tournament policy behavior:
- Riot tournament registrations are free-only.
- Traditional formats only.
- Minimum active participants enforced before start.
- Custom seeding is blocked while registration is open.

If needed, we can provide:
- reviewer test accounts,
- a public reviewer landing page at `/review/riot`,
- short walkthrough video,
- endpoint-by-endpoint mapping.

## 3) Final Pre-Submit Checklist

### Environment
- `RIOT_KEY_MODE` configured for the target environment.
- `ALLOW_RIOT_DEV_KEY_IN_PROD=true` only for a private reviewer-only build.
- `ALLOW_RIOT_DEV_KEY_IN_PROD=false` once Riot grants the Production Key or if the app opens publicly.
- `RIOT_REVIEW_MODE=true` in review/staging.
- `RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS=20`.
- `VITE_RIOT_REVIEW_MODE=true` and `VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20` in frontend review env.

### Product/Legal
- Public HTTPS URL works and is reachable by Riot reviewers.
- Site verification file can be published quickly if Riot requests `riot.txt`.
- Non-affiliation text visible in legal/settings pages.
- No official Riot logo usage (replace any asset that could be interpreted as official branding).

### Functional review tests
- Riot tournament with paid entry is rejected.
- Riot tournament below minimum participant capacity is rejected.
- Start tournament below active participant threshold is rejected.
- Duplicate Riot ID in roster is rejected.
- Duplicate Riot ID across registrations in same tournament is rejected.

### Documentation to include
- `docs/riot-compliance-checklist.md`
- This file (`docs/riot-app-notes.md`)
- `docs/riot-manual-review-checklist.md`
- Optional: 2-5 min screen recording showing core Riot-safe flows.
