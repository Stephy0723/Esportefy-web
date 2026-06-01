import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { getAuthToken } from '../../../../utils/authSession';
import { useNotification } from '../../../../context/NotificationContext';
import { useLang } from '../../../../context/LanguageContext';

export const createEmptyMatch = () => ({
  teamA: { refId: '', teamName: '', isPlaceholder: true },
  teamB: { refId: '', teamName: '', isPlaceholder: true },
  scoreA: '',
  scoreB: '',
  scheduledLabel: '',
});

export const createEmptyBracket = () => ({
  title: 'Bracket principal',
  rounds: [{ name: 'Octavos', matches: [createEmptyMatch()] }],
});

export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const buildPrizeOptions = (tournament, t) => {
  const options = [];
  const currency = tournament?.currency ? ` ${tournament.currency}` : '';
  if (tournament?.prizePool) options.push(`Prize Pool ${tournament.prizePool}${currency}`);
  if (tournament?.prizesByRank?.first) options.push(`${t('prizeFirst')} ${tournament.prizesByRank.first}`);
  if (tournament?.prizesByRank?.second) options.push(`${t('prizeSecond')} ${tournament.prizesByRank.second}`);
  if (tournament?.prizesByRank?.third) options.push(`${t('prizeThird')} ${tournament.prizesByRank.third}`);
  if (tournament?.prizeDetails) options.push(tournament.prizeDetails);
  return options.length > 0 ? options : [t('prizeSurprise'), t('prizeBoost'), t('prizePack')];
};

export const STATUS_LABELS = {
  open: 'statusOpen',
  ongoing: 'statusOngoing',
  finished: 'statusFinished',
  cancelled: 'statusCancelled',
  draft: 'statusDraft',
};

export const useTournamentAdminData = (code) => {
  const { addToast } = useNotification();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [settings, setSettings] = useState({
    visibility: 'public',
    showPrize: true,
    showSponsors: true,
    showRules: true,
    showSchedule: true,
    showContact: true,
    showTeams: false,
    showBracket: true,
    customMessage: '',
  });
  const [bracket, setBracket] = useState(createEmptyBracket());
  const token = getAuthToken();
  const authConfig = useMemo(
    () => ({
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [token]
  );

  const complianceFetchedRef = useRef(false);
  const compliancePendingRef = useRef(false);

  useEffect(() => {
    complianceFetchedRef.current = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tournaments/${code}`, authConfig);
        setTournament(res.data);
        setSettings((prev) => ({ ...prev, ...(res.data?.publicSettings || {}) }));
        setBracket(res.data?.bracket || createEmptyBracket());
      } catch (error) {
        /* silent — UI shows loading/empty state */
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code, authConfig]);

  const refreshCompliance = useCallback(async () => {
    if (!code || !token) {
      setCompliance(null);
      return;
    }
    if (compliancePendingRef.current) return;

    try {
      compliancePendingRef.current = true;
      setComplianceLoading(true);
      const res = await axios.get(`${API_URL}/api/tournaments/${code}/compliance`, authConfig);
      setCompliance(res.data || null);
      complianceFetchedRef.current = true;
    } catch (error) {
      if (error.response?.status !== 429) {
        /* silent */
      }
      setCompliance(null);
    } finally {
      compliancePendingRef.current = false;
      setComplianceLoading(false);
    }
  }, [code, token, authConfig]);

  useEffect(() => {
    if (!complianceFetchedRef.current) {
      refreshCompliance();
    }
  }, [refreshCompliance]);

  const registrations = useMemo(
    () => (Array.isArray(tournament?.registrations) ? tournament.registrations : []),
    [tournament]
  );

  const approvedTeams = useMemo(
    () => registrations.filter((item) => item.status === 'approved').map((item) => item.teamName).filter(Boolean),
    [registrations]
  );

  const prizeOptions = useMemo(() => buildPrizeOptions(tournament, t), [tournament, t]);
  const isMlbbTournament = useMemo(() => {
    const game = String(tournament?.game || '').trim();
    return ['Mobile Legends', 'Mobile Legends: Bang Bang', 'MLBB'].includes(game);
  }, [tournament?.game]);

  const hasValidMlbbRoster = (registration) => {
    const starters = Array.isArray(registration?.roster?.starters)
      ? registration.roster.starters.filter(Boolean)
      : [];
    const subs = Array.isArray(registration?.roster?.subs)
      ? registration.roster.subs.filter(Boolean)
      : [];
    const roster = [...starters, ...subs];

    if (starters.length === 0) return false;

    return roster.every((player) => {
      if (!player) return true;
      return String(player.gameId || '').trim() && String(player.region || '').trim();
    });
  };

  const savePublicSettings = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/public-settings`, settings, authConfig);
      await refreshCompliance();
      addToast(t('toastPublicSettingsSaved'), 'success');
    } catch (error) {
      addToast(error.response?.data?.message || t('toastPublicSettingsError'), 'error');
    }
  };

  const saveBracket = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/bracket`, { bracket }, authConfig);
      addToast(t('toastBracketSaved'), 'success');
    } catch (error) {
      addToast(error.response?.data?.message || t('toastBracketError'), 'error');
    }
  };

  const updateRegistration = async (registrationId, status) => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/registrations/${registrationId}`, { status }, authConfig);
      setTournament((prev) => ({
        ...prev,
        registrations: (prev?.registrations || []).map((item) =>
          String(item._id) === String(registrationId) ? { ...item, status } : item
        ),
      }));
      await refreshCompliance();
    } catch (error) {
      addToast(error.response?.data?.message || t('toastRegistrationUpdateError'), 'error');
    }
  };

  const removeRegistration = async (registrationId) => {
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/registrations/${registrationId}`, authConfig);
      setTournament((prev) => ({
        ...prev,
        registrations: (prev?.registrations || []).filter((item) => String(item._id) !== String(registrationId)),
      }));
      await refreshCompliance();
    } catch (error) {
      addToast(error.response?.data?.message || t('toastRegistrationRemoveError'), 'error');
    }
  };

  return {
    loading,
    tournament,
    settings,
    setSettings,
    bracket,
    setBracket,
    compliance,
    complianceLoading,
    registrations,
    approvedTeams,
    prizeOptions,
    isMlbbTournament,
    hasValidMlbbRoster,
    refreshCompliance,
    savePublicSettings,
    saveBracket,
    updateRegistration,
    removeRegistration,
  };
};

const NAV_ITEMS = (t) => [
  { key: 'overview', path: '', end: true, label: t('navOpOverview'), desc: t('navOpOverviewDesc') },
  { key: 'bracket', path: '/bracket', label: t('navOpBracket'), desc: t('navOpBracketDesc') },
  { key: 'matches', path: '/matches', label: t('navOpMatches'), desc: t('navOpMatchesDesc') },
  { key: 'standings', path: '/standings', label: t('navOpStandings'), desc: t('navOpStandingsDesc') },
  { key: 'staff', path: '/staff', label: t('navOpStaff'), desc: t('navOpStaffDesc') },
  { key: 'reports', path: '/reports', label: t('navOpReports'), desc: t('navOpReportsDesc') },
  { key: 'roulette', path: '/roulette', label: t('navOpRoulette'), desc: t('navOpRouletteDesc') },
];

export const TournamentAdminShell = ({ tournament, currentTab, children }) => {
  const { t } = useLang();
  const navItems = NAV_ITEMS(t);

  return (
    <div className="ta-page">
      <header className="ta-manage-hero">
        <div className="ta-manage-hero__copy">
          <span className="ta-kicker">{t('shellKicker')}</span>
          <h1>{tournament.title}</h1>
          <p>
            #{tournament.tournamentId} - {tournament.game} - {t(STATUS_LABELS[tournament.status]) || t('shellDefaultStatus')}
          </p>
        </div>

        <nav className="ta-manage-nav ta-manage-nav--wide">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={`/tournaments/manage/${tournament.tournamentId}${item.path}`}
              end={item.end}
              className={({ isActive }) => `ta-manage-nav__item ${isActive || currentTab === item.key ? 'is-active' : ''}`}
            >
              <span>{item.label}</span>
              <strong>{item.desc}</strong>
            </NavLink>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
};
