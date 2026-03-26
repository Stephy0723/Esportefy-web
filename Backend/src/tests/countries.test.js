import { describe, expect, it } from '@jest/globals';
import { getCountryCallingCode, normalizeCountryName } from '../../../shared/countries.js';
import {
    normalizeExperienceValues,
    normalizeGenderValue,
    normalizeGoalValues,
    normalizeLanguageValues,
    normalizePlatformValues
} from '../../../shared/profileCatalog.js';

describe('country normalization', () => {
    it('normalizes aliases to the canonical country name', () => {
        expect(normalizeCountryName('Rep. Dominicana')).toBe('República Dominicana');
        expect(normalizeCountryName('Republica Dominicana')).toBe('República Dominicana');
        expect(normalizeCountryName('mexico')).toBe('México');
    });

    it('returns the expected calling code using canonical or alias values', () => {
        expect(getCountryCallingCode('República Dominicana')).toBe('1');
        expect(getCountryCallingCode('Rep. Dominicana')).toBe('1');
        expect(getCountryCallingCode('España')).toBe('34');
    });

    it('preserves custom countries that are not in the shared catalog', () => {
        expect(normalizeCountryName('Japón')).toBe('Japón');
    });

    it('normalizes shared profile catalog values through the same canonical lists', () => {
        expect(normalizeGenderValue('femenino')).toBe('Femenino');
        expect(normalizePlatformValues(['PC', 'mobile', 'pc'])).toEqual(['pc', 'mobile']);
        expect(normalizeGoalValues(['torneos', 'Fun'])).toEqual(['Torneos', 'Fun']);
        expect(normalizeExperienceValues('pro')).toEqual(['Pro']);
        expect(normalizeLanguageValues(['español', 'English', 'english'])).toEqual(['Español', 'English']);
    });
});
