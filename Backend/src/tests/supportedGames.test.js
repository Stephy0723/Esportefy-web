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
        expect(normalizeSupportedGameId('street fighter')).toBe('sf6');
        expect(normalizeSupportedGameId('tekken 8')).toBe('tekken');
        expect(normalizeSupportedGameId('free fire')).toBe('freefire');
        expect(normalizeSupportedGameId('pubgm')).toBe('pubg');
        expect(normalizeSupportedGameId('call of duty mobile')).toBe('codm');
        expect(normalizeSupportedGameId('brawlhalla')).toBe('brawlhalla');
        expect(normalizeSupportedGameId('counter strike 2')).toBe('cs2');
        expect(normalizeSupportedGameId('overwatch')).toBe('ow2');
        expect(normalizeSupportedGameId('dota 2')).toBe('dota2');
        expect(normalizeSupportedGameId('apex')).toBe('apex');
        expect(normalizeSupportedGameId('siege')).toBe('r6');
        expect(normalizeSupportedGameId('clashroyale')).toBe('cr');
        expect(normalizeSupportedGameId('hearthstone')).toBe('hs');
        expect(normalizeSupportedGameId('halo')).toBe('halo');
        expect(normalizeSupportedGameId('nba2k')).toBe('nba2k');

        expect(normalizeSupportedGameName('call of duty warzone')).toBe('Warzone');
        expect(normalizeSupportedGameName('rocket')).toBe('Rocket League');
        expect(normalizeSupportedGameName('ea fc')).toBe('EA FC / FIFA');
        expect(normalizeSupportedGameName('super smash bros ultimate')).toBe('Smash Bros');
        expect(normalizeSupportedGameName('sf6')).toBe('Street Fighter 6');
        expect(normalizeSupportedGameName('tekken')).toBe('Tekken 8');
        expect(normalizeSupportedGameName('pubg')).toBe('PUBG Mobile');
        expect(normalizeSupportedGameName('counter strike 2')).toBe('CS2');
        expect(normalizeSupportedGameName('overwatch 2')).toBe('Overwatch 2');
        expect(normalizeSupportedGameName('dota2')).toBe('Dota 2');
        expect(normalizeSupportedGameName('rainbow six siege')).toBe('Rainbow Six Siege');
        expect(normalizeSupportedGameName('cr')).toBe('Clash Royale');
        expect(normalizeSupportedGameName('hs')).toBe('Hearthstone');
    });

    it('exposes roster roles for the newly enabled games', () => {
        expect(getSupportedGameRoles('Fortnite')).toEqual(['IGL', 'Fragger', 'Support', 'Flex']);
        expect(getSupportedGameRoles('Warzone')).toEqual(['IGL', 'Fragger', 'Support', 'Flex']);
        expect(getSupportedGameRoles('Rocket League')).toEqual(['Striker', 'Support', 'Flex']);
        expect(getSupportedGameRoles('EA FC / FIFA')).toEqual(['Player']);
        expect(getSupportedGameRoles('Smash Bros')).toEqual(['Player']);
        expect(getSupportedGameRoles('Brawlhalla')).toEqual(['Player']);
        expect(getSupportedGameRoles('Street Fighter 6')).toEqual(['Player']);
        expect(getSupportedGameRoles('Tekken 8')).toEqual(['Player']);
        expect(getSupportedGameRoles('Free Fire')).toEqual(['IGL', 'Fragger', 'Scout', 'Support']);
        expect(getSupportedGameRoles('PUBG Mobile')).toEqual(['IGL', 'Fragger', 'Scout', 'Support']);
        expect(getSupportedGameRoles('COD Mobile')).toEqual(['Slayer', 'Objective', 'Anchor', 'Flex', 'Support']);
        expect(getSupportedGameRoles('CS2')).toEqual(['IGL', 'Entry', 'AWPer', 'Support', 'Lurker']);
        expect(getSupportedGameRoles('Overwatch 2')).toEqual(['Tank', 'DPS', 'Support', 'Flex', 'IGL']);
        expect(getSupportedGameRoles('Dota 2')).toEqual(['Carry', 'Mid', 'Offlane', 'Soft Support', 'Hard Support']);
        expect(getSupportedGameRoles('Apex Legends')).toEqual(['IGL', 'Fragger', 'Anchor']);
        expect(getSupportedGameRoles('Rainbow Six Siege')).toEqual(['Entry', 'Support', 'Anchor', 'Flex', 'IGL']);
        expect(getSupportedGameRoles('Clash Royale')).toEqual(['Player']);
        expect(getSupportedGameRoles('Hearthstone')).toEqual(['Player']);
        expect(getSupportedGameRoles('Halo Infinite')).toEqual(['Slayer', 'Objective', 'Support', 'Flex']);
        expect(getSupportedGameRoles('NBA 2K24')).toEqual(['Player']);
    });

    it('filters mixed arrays down to supported canonical game names', () => {
        expect(filterSupportedGameNames(['Fortnite', 'cod warzone', 'rocket', 'ssbu', 'sf6', 'pubg', 'codm', 'counter strike 2', 'overwatch', 'desconocido'])).toEqual([
            'Fortnite',
            'Warzone',
            'Rocket League',
            'Smash Bros',
            'Street Fighter 6',
            'PUBG Mobile',
            'COD Mobile',
            'CS2',
            'Overwatch 2'
        ]);
        expect(isSupportedGameId('warzone')).toBe(true);
        expect(isSupportedGameId('fifa')).toBe(true);
        expect(isSupportedGameId('smash')).toBe(true);
        expect(isSupportedGameId('brawlhalla')).toBe(true);
        expect(isSupportedGameId('sf6')).toBe(true);
        expect(isSupportedGameId('tekken')).toBe(true);
        expect(isSupportedGameId('freefire')).toBe(true);
        expect(isSupportedGameId('pubg')).toBe(true);
        expect(isSupportedGameId('codm')).toBe(true);
        expect(isSupportedGameId('cs2')).toBe(true);
        expect(isSupportedGameId('ow2')).toBe(true);
        expect(isSupportedGameId('dota2')).toBe(true);
        expect(isSupportedGameId('apex')).toBe(true);
        expect(isSupportedGameId('r6')).toBe(true);
        expect(isSupportedGameId('cr')).toBe(true);
        expect(isSupportedGameId('hs')).toBe(true);
        expect(isSupportedGameId('halo')).toBe(true);
        expect(isSupportedGameId('nba2k')).toBe(true);
    });
});
