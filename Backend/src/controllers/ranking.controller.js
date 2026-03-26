import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { calculatePlatformRankings, getPlatformRankingConfig } from '../services/platformRankings.js';

const addRosterUsers = (set, roster = {}) => {
  (Array.isArray(roster?.starters) ? roster.starters : []).forEach((entry) => entry?.user && set.add(String(entry.user)));
  (Array.isArray(roster?.subs) ? roster.subs : []).forEach((entry) => entry?.user && set.add(String(entry.user)));
};

export const getPlatformRankings = async (_req, res) => {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ['open', 'ongoing', 'finished'] },
      'publicSettings.visibility': { $ne: 'private' }
    })
      .select('tournamentId title game modality format date createdAt prizePool prizesByRank currency maxSlots currentSlots status platform server organizer registrations.teamId registrations.teamName registrations.status registrations.captain registrations.teamMeta.university.region registrations.roster bracket.format bracket.rounds.round bracket.rounds.matches.teamA.teamId bracket.rounds.matches.teamA.teamName bracket.rounds.matches.teamB.teamId bracket.rounds.matches.teamB.teamName bracket.rounds.matches.winnerTeamId bracket.rounds.matches.scoreA bracket.rounds.matches.scoreB bracket.rounds.matches.status')
      .populate('organizer', 'username fullName')
      .lean();

    const teamIds = new Set();
    const userIds = new Set();

    tournaments.forEach((tournament) => {
      (Array.isArray(tournament?.registrations) ? tournament.registrations : []).forEach((registration) => {
        if (registration?.teamId) teamIds.add(String(registration.teamId));
        if (registration?.captain) userIds.add(String(registration.captain));
        addRosterUsers(userIds, registration?.roster);
      });

      (Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : []).forEach((round) => {
        (Array.isArray(round?.matches) ? round.matches : []).forEach((match) => {
          if (match?.teamA?.teamId) teamIds.add(String(match.teamA.teamId));
          if (match?.teamB?.teamId) teamIds.add(String(match.teamB.teamId));
          if (match?.winnerTeamId) teamIds.add(String(match.winnerTeamId));
        });
      });
    });

    const teams = teamIds.size
      ? await Team.find({ _id: { $in: Array.from(teamIds) } })
        .select('name teamCode teamCountry university community sponsor captain roster createdAt')
        .lean()
      : [];

    teams.forEach((team) => {
      if (team?.captain) userIds.add(String(team.captain));
      addRosterUsers(userIds, team?.roster);
    });

    const users = userIds.size
      ? await User.find({ _id: { $in: Array.from(userIds) } })
        .select('username fullName avatar bio country createdAt socialLinks roles preferredRoles connections university')
        .lean()
      : [];

    const payload = calculatePlatformRankings({ tournaments, teams, users });

    return res.json({
      ...payload,
      pointsConfig: getPlatformRankingConfig()
    });
  } catch (error) {
    console.error('getPlatformRankings error:', error);
    return res.status(500).json({ message: 'No se pudieron cargar los rankings de plataforma.' });
  }
};
