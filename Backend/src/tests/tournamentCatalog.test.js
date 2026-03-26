import { describe, expect, it } from '@jest/globals';
import {
    getTournamentFormatLabel,
    normalizeTournamentFormat,
    normalizeTournamentPlatform,
    normalizeTournamentStaffRole
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
});
