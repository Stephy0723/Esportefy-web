import { describe, expect, it } from '@jest/globals';
import {
    extractCountryPrefixFromUserCode,
    resolveCountryUserCodePrefix,
    shouldRegenerateUserCodeForCountry
} from '../models/User.js';

describe('userCode country prefixes', () => {
    it('resolves the expected prefix from the canonical country name', () => {
        expect(resolveCountryUserCodePrefix('República Dominicana')).toBe('DR');
        expect(resolveCountryUserCodePrefix('Argentina')).toBe('AR');
    });

    it('extracts the current prefix from an existing user code', () => {
        expect(extractCountryPrefixFromUserCode('253050-AG02')).toBe('AG');
        expect(extractCountryPrefixFromUserCode('912345-DR14')).toBe('DR');
        expect(extractCountryPrefixFromUserCode('sin-formato')).toBe('');
    });

    it('flags mismatched prefixes for regeneration', () => {
        expect(shouldRegenerateUserCodeForCountry({
            country: 'República Dominicana',
            userCode: '253050-AG02'
        })).toBe(true);

        expect(shouldRegenerateUserCodeForCountry({
            country: 'República Dominicana',
            userCode: '253050-DR02'
        })).toBe(false);

        expect(shouldRegenerateUserCodeForCountry({
            country: 'República Dominicana',
            userCode: ''
        })).toBe(true);
    });
});
