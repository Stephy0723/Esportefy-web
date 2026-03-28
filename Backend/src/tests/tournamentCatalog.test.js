import { describe, expect, it } from '@jest/globals';
import {
    getTournamentFormatLabel,
    isOperationalTournamentFormat,
    normalizeTournamentFormat,
    normalizeTournamentPlatform,
    normalizeTournamentStaffRole,
    TOURNAMENT_OPERATIONAL_FORMAT_VALUES
} from '../../../shared/tournamentCatalog.js';

describe('tournament catalog normalization', () => {
    it('normalizes tournament formats to canonical keys', () => {
        expect(normalizeTournamentFormat('Doble Eliminacion')).toBe('double_elimination');
        expect(normalizeTournamentFormat('Sistema Suizo')).toBe('swiss');
        expect(normalizeTournamentFormat('todos contra todos')).toBe('round_robin');
        expect(getTournamentFormatLabel('single_elimination')).toBe('Eliminación Directa');
    });

    it('normalizes tournament platforms to canonical values', () => {
        expect(normalizeTournamentPlatform('consola')).toBe('Console');
        expect(normalizeTournamentPlatform('pc')).toBe('PC');
        expect(normalizeTournamentPlatform('crossplay')).toBe('Crossplay');
    });

    it('normalizes tournament staff roles to canonical values', () => {
        expect(normalizeTournamentStaffRole('moderador')).toBe('moderator');
        expect(normalizeTournamentStaffRole('arbitro')).toBe('referee');
        expect(normalizeTournamentStaffRole('creador de contenido')).toBe('content-creator');
    });

    it('keeps only operational formats available for live tournament flows', () => {
        expect(TOURNAMENT_OPERATIONAL_FORMAT_VALUES).toEqual([
            'single_elimination',
            'swiss',
            'round_robin'
        ]);
        expect(isOperationalTournamentFormat('single_elimination')).toBe(true);
        expect(isOperationalTournamentFormat('Doble Eliminacion')).toBe(false);
    });
});
