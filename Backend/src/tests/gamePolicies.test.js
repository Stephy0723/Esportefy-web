import { describe, expect, it } from '@jest/globals';
import {
    getGamePlaybook,
    getGamePolicy,
    getTeamGameRules,
    getTournamentGameDefaults,
    getTournamentGameModalityOptions,
    getTournamentGamePlatformOptions,
    getTournamentGameSeriesOptions,
} from '../../../shared/gamePolicies.js';

describe('game policies', () => {
    it('resolves canonical team rules for the newly enabled games', () => {
        expect(getTeamGameRules('Fortnite')).toMatchObject({ maxPlayers: 4, maxSubs: 2 });
        expect(getTeamGameRules('Warzone')).toMatchObject({ maxPlayers: 4, maxSubs: 2 });
        expect(getTeamGameRules('Rocket League')).toMatchObject({ maxPlayers: 3, maxSubs: 1 });
        expect(getTeamGameRules('EA FC / FIFA')).toMatchObject({ maxPlayers: 1, maxSubs: 1 });
        expect(getTeamGameRules('Smash Bros')).toMatchObject({ maxPlayers: 1, maxSubs: 1 });
        expect(getTeamGameRules('Brawlhalla')).toMatchObject({ maxPlayers: 1, maxSubs: 1 });
        expect(getTeamGameRules('Street Fighter 6')).toMatchObject({ maxPlayers: 1, maxSubs: 1 });
        expect(getTeamGameRules('Tekken 8')).toMatchObject({ maxPlayers: 1, maxSubs: 1 });
        expect(getTeamGameRules('Free Fire')).toMatchObject({ maxPlayers: 4, maxSubs: 2 });
        expect(getTeamGameRules('PUBG Mobile')).toMatchObject({ maxPlayers: 4, maxSubs: 2 });
        expect(getTeamGameRules('COD Mobile')).toMatchObject({ maxPlayers: 5, maxSubs: 2 });
    });

    it('exposes tournament defaults that match each supported game mode', () => {
        expect(getTournamentGameDefaults('Valorant')).toEqual({
            platform: 'PC',
            modality: '5v5',
            seriesType: 'BO3',
            server: '',
            mapPool: [],
        });

        expect(getTournamentGameDefaults('Rocket League')).toEqual({
            platform: 'Crossplay',
            modality: '3v3',
            seriesType: 'BO5',
            server: '',
            mapPool: [],
        });

        expect(getTournamentGameDefaults('COD Mobile')).toEqual({
            platform: 'Mobile',
            modality: '5v5',
            seriesType: 'BO5',
            server: '',
            mapPool: [],
        });
    });

    it('keeps tournament options scoped to the current game', () => {
        expect(getTournamentGameModalityOptions('Fortnite').map((option) => option.value)).toEqual(['4v4']);
        expect(getTournamentGamePlatformOptions('EA FC / FIFA').map((option) => option.value)).toEqual(['Console', 'PC', 'Crossplay']);
        expect(getTournamentGameSeriesOptions('Smash Bros').map((option) => option.value)).toEqual(['FT2', 'FT3', 'BO5']);
        expect(getTournamentGamePlatformOptions('Brawlhalla').map((option) => option.value)).toEqual(['Crossplay', 'PC', 'Console', 'Mobile']);
        expect(getTournamentGameSeriesOptions('Street Fighter 6').map((option) => option.value)).toEqual(['FT2', 'FT3', 'BO5']);
        expect(getTournamentGameModalityOptions('COD Mobile').map((option) => option.value)).toEqual(['5v5']);
    });

    it('supports aliases when resolving game policies', () => {
        expect(getGamePolicy('cod warzone')?.id).toBe('warzone');
        expect(getGamePolicy('rocket')?.name).toBe('Rocket League');
        expect(getGamePolicy('ssbu')?.defaultModality).toBe('1v1');
        expect(getGamePolicy('street fighter')?.id).toBe('sf6');
        expect(getGamePolicy('tekken')?.id).toBe('tekken');
        expect(getGamePolicy('pubgm')?.id).toBe('pubg');
        expect(getGamePolicy('call of duty mobile')?.id).toBe('codm');
    });

    it('builds playbooks for team and tournament UX', () => {
        expect(getGamePlaybook('Brawlhalla')).toMatchObject({
            id: 'brawlhalla',
            rosterLine: '1 titular + 1 suplente',
            team: { staffLabel: 'Coach / Corner' }
        });

        expect(getGamePlaybook('COD Mobile')).toMatchObject({
            id: 'codm',
            defaultSeries: 'BO5',
            tournament: {
                summary: expect.stringContaining('BO5')
            }
        });
    });
});
