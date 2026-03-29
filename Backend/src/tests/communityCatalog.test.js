import { describe, expect, it } from '@jest/globals';
import {
    getCommunityGameNameVariants,
    getCommunityMemberRoleLabel,
    normalizeCommunityGameId,
    normalizeCommunityGameName,
    normalizeCommunityMemberRole,
    normalizeCommunitySocialLinks,
    sortCommunityMembersByRole
} from '../../../shared/communityCatalog.js';

describe('community catalog normalization', () => {
    it('normalizes community games through the shared catalog', () => {
        expect(normalizeCommunityGameId('League of Legends')).toBe('lol');
        expect(normalizeCommunityGameName('counter strike 2')).toBe('CS2');
        expect(getCommunityGameNameVariants('wildrift')).toContain('Wild Rift');
        expect(normalizeCommunityGameId('Brawlhalla')).toBe('brawlhalla');
        expect(normalizeCommunityGameName('call of duty mobile')).toBe('COD Mobile');
    });

    it('normalizes community social links and roles', () => {
        expect(normalizeCommunitySocialLinks({
            discord: '  https://discord.gg/glitchgang  ',
            twitch: '',
            invalid: 'ignored'
        })).toEqual({
            discord: 'https://discord.gg/glitchgang'
        });

        expect(normalizeCommunityMemberRole('moderador')).toBe('moderator');
        expect(getCommunityMemberRoleLabel('member')).toBe('Miembro');
    });

    it('sorts community members using the shared role order', () => {
        const sorted = sortCommunityMembersByRole([
            { role: 'member', user: { username: 'zee' } },
            { role: 'admin', user: { username: 'beta' } },
            { role: 'owner', user: { username: 'alpha' } }
        ]);

        expect(sorted.map((member) => member.user.username)).toEqual(['alpha', 'beta', 'zee']);
    });
});
