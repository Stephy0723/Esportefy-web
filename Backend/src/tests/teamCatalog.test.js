import { describe, expect, it } from '@jest/globals';
import {
    normalizeTeamCountry,
    normalizeTeamGender,
    normalizeTeamLanguage,
    normalizeTeamLevel
} from '../../../shared/teamCatalog.js';

describe('team catalog normalization', () => {
    it('normalizes team countries through the shared country catalog', () => {
        expect(normalizeTeamCountry('Rep. Dominicana')).toBe('República Dominicana');
        expect(normalizeTeamCountry('global')).toBe('Internacional');
    });

    it('normalizes team enums to canonical values', () => {
        expect(normalizeTeamGender('femenino')).toBe('Femenino');
        expect(normalizeTeamLevel('Leyenda (Elite)')).toBe('Leyenda');
        expect(normalizeTeamLevel('semi pro')).toBe('Semi-Pro');
        expect(normalizeTeamLanguage('espanol')).toBe('Español');
        expect(normalizeTeamLanguage('portugues')).toBe('Português');
    });
});
