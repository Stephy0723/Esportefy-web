import { describe, expect, it } from '@jest/globals';
import {
    ALLOWED_ACADEMIC_LEVELS,
    getEmailDomain,
    isUniversityAllowedGame,
    PUBLIC_EMAIL_DOMAINS,
    UNIVERSITY_ENABLED_REGION,
    UNIVERSITY_REGION_OPTIONS
} from '../../../shared/universityRules.js';

describe('university shared rules', () => {
    it('shares the enabled region and visible region catalog', () => {
        expect(UNIVERSITY_ENABLED_REGION).toBe('rd');
        expect(UNIVERSITY_REGION_OPTIONS.some((region) => region.id === 'rd')).toBe(true);
    });

    it('validates allowed university games through the shared catalog', () => {
        expect(isUniversityAllowedGame('Valorant')).toBe(true);
        expect(isUniversityAllowedGame('MLBB')).toBe(true);
        expect(isUniversityAllowedGame('Fortnite')).toBe(false);
    });

    it('validates institutional email rules through the shared catalog', () => {
        expect(getEmailDomain('test@gmail.com')).toBe('gmail.com');
        expect(PUBLIC_EMAIL_DOMAINS.has('gmail.com')).toBe(true);
        expect(ALLOWED_ACADEMIC_LEVELS.has('maestria')).toBe(true);
    });
});
