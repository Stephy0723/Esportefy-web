import { describe, expect, it } from '@jest/globals';
import {
    getCompetitiveProfileEntries,
    getCompetitiveProfileGameIds,
    getCompetitiveProfileSpec,
    normalizeCompetitiveProfilesPayload,
} from '../../../shared/gameCompetitiveProfiles.js';

describe('game competitive profiles', () => {
    it('exposes specs for the manually integrated games', () => {
        expect(getCompetitiveProfileSpec('Brawlhalla')).toMatchObject({
            title: 'Brawlhalla',
            fields: expect.arrayContaining([
                expect.objectContaining({ key: 'mainLegend' }),
                expect.objectContaining({ key: 'input' })
            ])
        });

        expect(getCompetitiveProfileSpec('COD Mobile')).toMatchObject({
            title: 'COD Mobile',
            fields: expect.arrayContaining([
                expect.objectContaining({ key: 'device' }),
                expect.objectContaining({ key: 'roleFocus' })
            ])
        });

        expect(getCompetitiveProfileSpec('CS2')).toMatchObject({
            title: 'CS2',
            fields: expect.arrayContaining([
                expect.objectContaining({ key: 'steamHandle' }),
                expect.objectContaining({ key: 'roleFocus' })
            ])
        });

        expect(getCompetitiveProfileSpec('Apex Legends')).toMatchObject({
            title: 'Apex Legends',
            fields: expect.arrayContaining([
                expect.objectContaining({ key: 'eaId' }),
                expect.objectContaining({ key: 'mainLegend' })
            ])
        });
    });

    it('filters and sanitizes payloads by selected games', () => {
        const payload = normalizeCompetitiveProfilesPayload(
            {
                brawlhalla: {
                    tag: '  Buggel  ',
                    platform: 'pc',
                    mainLegend: '  Orion ',
                    secondaryLegend: '',
                    input: 'keyboard'
                },
                codm: {
                    ign: '  BuggelCOD  ',
                    playerId: '  123456  ',
                    device: 'tablet',
                    roleFocus: 'flex',
                    clanTag: '  GG '
                },
                cs2: {
                    steamHandle: '  BuggelCS  ',
                    platform: 'pc',
                    roleFocus: 'awper',
                    favoriteMap: '  Mirage '
                },
                valorant: {
                    gameName: 'Should be ignored'
                }
            },
            ['Brawlhalla', 'COD Mobile', 'CS2']
        );

        expect(payload).toEqual({
            brawlhalla: {
                tag: 'Buggel',
                platform: 'PC',
                mainLegend: 'Orion',
                input: 'Keyboard'
            },
            codm: {
                ign: 'BuggelCOD',
                playerId: '123456',
                device: 'Tablet',
                roleFocus: 'Flex',
                clanTag: 'GG'
            },
            cs2: {
                steamHandle: 'BuggelCS',
                platform: 'PC',
                roleFocus: 'AWPer',
                favoriteMap: 'Mirage'
            }
        });
    });

    it('builds readable entries for profile cards', () => {
        const entries = getCompetitiveProfileEntries('Street Fighter 6', {
            cfnId: 'BuggelFGC',
            mainCharacter: 'Ken',
            controlType: 'Modern'
        });

        expect(entries).toEqual([
            { key: 'cfnId', label: 'CFN / tag', value: 'BuggelFGC' },
            { key: 'mainCharacter', label: 'Main', value: 'Ken' },
            { key: 'controlType', label: 'Control', value: 'Modern' }
        ]);
    });

    it('returns only supported ids when extracting competitive profile games', () => {
        expect(getCompetitiveProfileGameIds(['Valorant', 'Smash Bros', 'Brawlhalla', 'Invalid']))
            .toEqual(['smash', 'brawlhalla']);
    });
});
