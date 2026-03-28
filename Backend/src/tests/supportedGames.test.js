import { describe, expect, it } from '@jest/globals';
import {
    filterSupportedGameNames,
    getSupportedGameRoles,
    isSupportedGameId,
    normalizeSupportedGameId,
    normalizeSupportedGameName
} from '../../../shared/supportedGames.js';

describe('supported games catalog', () => {
    it('normalizes the newly enabled games by alias and canonical name', () => {
        expect(normalizeSupportedGameId('Fortnite')).toBe('fortnite');
        expect(normalizeSupportedGameId('cod warzone')).toBe('warzone');
        expect(normalizeSupportedGameId('rocket league')).toBe('rocket');
        expect(normalizeSupportedGameId('fifa')).toBe('fifa');
        expect(normalizeSupportedGameId('ssbu')).toBe('smash');

        expect(normalizeSupportedGameName('call of duty warzone')).toBe('Warzone');
        expect(normalizeSupportedGameName('rocket')).toBe('Rocket League');
        expect(normalizeSupportedGameName('ea fc')).toBe('EA FC / FIFA');
        expect(normalizeSupportedGameName('super smash bros ultimate')).toBe('Smash Bros');
    });

    it('exposes roster roles for the newly enabled games', () => {
        expect(getSupportedGameRoles('Fortnite')).toEqual(['IGL', 'Fragger', 'Support', 'Flex']);
        expect(getSupportedGameRoles('Warzone')).toEqual(['IGL', 'Fragger', 'Support', 'Flex']);
        expect(getSupportedGameRoles('Rocket League')).toEqual(['Striker', 'Support', 'Flex']);
        expect(getSupportedGameRoles('EA FC / FIFA')).toEqual(['Player']);
        expect(getSupportedGameRoles('Smash Bros')).toEqual(['Player']);
    });

    it('filters mixed arrays down to supported canonical game names', () => {
        expect(filterSupportedGameNames(['Fortnite', 'cod warzone', 'rocket', 'ssbu', 'desconocido'])).toEqual([
            'Fortnite',
            'Warzone',
            'Rocket League',
            'Smash Bros'
        ]);
        expect(isSupportedGameId('warzone')).toBe(true);
        expect(isSupportedGameId('fifa')).toBe(true);
        expect(isSupportedGameId('smash')).toBe(true);
    });
});
