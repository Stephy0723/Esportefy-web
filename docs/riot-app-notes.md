# Riot App Notes (Prototype)

## What this product is
Esportefy is a community tournament platform. In this prototype we use Riot APIs for identity and eligibility checks, plus tournament integrity controls.

This build is for review, not for monetized public rollout.

## What we do with Riot data
- Validate Riot ID format (`GameName#TagLine`).
- Verify accounts through official Riot endpoints.
- Link one Riot account to one Esportefy user.
- Validate team/tournament eligibility where Riot requirements apply.

## What we do not do
- We do not claim Riot partnership or official endorsement.
- We do not use undocumented Riot endpoints.
- We do not build alternate ranking systems (MMR/ELO clones).
- We do not expose features to shame players.
- We do not create non-tournament single-match lobby workflows.

## Key/security handling
- Riot API key is server-side only.
- Dev/interim key usage is restricted by environment rules.
- Public/prod misuse of dev keys is blocked by default.

## Tournament behavior in review mode
- Riot-scoped tournaments are free entry only.
- Paid/invite/password modes are blocked in review mode.
- Riot tournaments must meet minimum active participants (default: 20) before start.
- Brackets must be traditional competitive formats (single, double, swiss, round robin).
- While registration is still open, custom seeding is blocked for Riot tournaments.

## Integrity checks already implemented
- No duplicate Riot IDs within one team roster.
- No duplicate Riot IDs across teams in the same Riot tournament.
- Captain/team ownership checks on registration and management actions.

## If the review team needs more detail
We can provide:
- test accounts,
- short walkthrough video,
- endpoint-by-endpoint mapping with request/response examples.
