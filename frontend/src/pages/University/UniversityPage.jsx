import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { getAuthToken } from '../../utils/authSession';
import {
  ACADEMIC_LEVEL_OPTIONS,
  ALLOWED_ACADEMIC_LEVELS,
  getEmailDomain,
  isUniversityAllowedGame,
  PUBLIC_EMAIL_DOMAINS,
  UNIVERSITY_ENABLED_REGION,
  UNIVERSITY_REGION_OPTIONS
} from '../../../../shared/universityRules.js';
import { useLang } from '../../context/LanguageContext';
import './UniversityPage.scss';

const UNIVERSITY_VISIBLE_REGIONS = UNIVERSITY_REGION_OPTIONS.filter((region) => region.id === UNIVERSITY_ENABLED_REGION);

const STATUS_LABELS = {
  ongoing: 'upStatusOngoing',
  open: 'upStatusOpen',
  finished: 'upStatusFinished',
  cancelled: 'upStatusCancelled',
  draft: 'upStatusDraft'
};

const UNIVERSITY_TOURNAMENT_CARD_META = {
  open: { color: 'green', labelKey: STATUS_LABELS.open },
  ongoing: { color: 'gold', labelKey: STATUS_LABELS.ongoing },
  finished: { color: 'muted', labelKey: STATUS_LABELS.finished },
  cancelled: { color: 'danger', labelKey: STATUS_LABELS.cancelled },
  draft: { color: 'muted', labelKey: STATUS_LABELS.draft }
};

const formatTournamentDateLabel = (value, locale = 'es-DO') => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
};

const EMPTY_UNIVERSITY_STATUS = {
  universityId: '',
  universityTag: '',
  universityName: '',
  region: '',
  city: '',
  campus: '',
  studentId: '',
  program: '',
  academicLevel: '',
  institutionalEmail: '',
  verificationSource: 'none',
  verificationStatus: 'unlinked',
  verified: false,
  tenantId: '',
  appliedAt: null,
  verifiedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  rejectReason: ''
};

const EMPTY_MICROSOFT_CONNECTION = {
  verified: false,
  tenantId: '',
  userId: '',
  email: '',
  displayName: ''
};

const UNIVERSITY_STATUS_META = {
  unlinked: { tone: 'neutral', titleKey: 'upUniUnlinkedTitle', textKey: 'upUniUnlinkedText' },
  pending: { tone: 'pending', titleKey: 'upUniPendingTitle', textKey: 'upUniPendingText' },
  verified: { tone: 'verified', titleKey: 'upUniVerifiedTitle', textKey: 'upUniVerifiedText' },
  rejected: { tone: 'rejected', titleKey: 'upUniRejectedTitle', textKey: 'upUniRejectedText' }
};

const STUDENT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9._/-]{3,31}$/;

const UniversityPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const locale = lang === 'en' ? 'en-US' : 'es-DO';
  const token = getAuthToken() || '';
  const [currentUser, setCurrentUser] = useState(null);
  const [catalogUniversities, setCatalogUniversities] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [pointsConfig, setPointsConfig] = useState(null);
  const [activeRegion, setActiveRegion] = useState('rd');
  const [activeTab, setActiveTab] = useState('universidades');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollUni, setEnrollUni] = useState(null);
  const [enrollStep, setEnrollStep] = useState(1);
  const [formData, setFormData] = useState({ matricula: '', carrera: '', campus: '', customCampus: '', nivel: '', institutionalEmail: '' });
  const [myUniversityStatus, setMyUniversityStatus] = useState(EMPTY_UNIVERSITY_STATUS);
  const [myUniversityApplication, setMyUniversityApplication] = useState(null);
  const [microsoftConnection, setMicrosoftConnection] = useState(EMPTY_MICROSOFT_CONNECTION);
  const [liveUniversityTournaments, setLiveUniversityTournaments] = useState([]);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [reviewLoadingId, setReviewLoadingId] = useState('');
  const [rejectDrafts, setRejectDrafts] = useState({});
  const [adminFilters, setAdminFilters] = useState({ status: 'pending', region: UNIVERSITY_ENABLED_REGION });

  const getCatalogUniversityAllowedDomains = (universityId = '') => {
    const normalizedId = String(universityId || '').trim().toLowerCase();
    if (!normalizedId) return [];
    const found = catalogUniversities.find((item) => String(item?.id || '').trim().toLowerCase() === normalizedId);
    return Array.isArray(found?.allowedDomains) ? found.allowedDomains : [];
  };

  const isCatalogInstitutionalEmailAllowed = (universityId = '', email = '') => {
    const allowedDomains = getCatalogUniversityAllowedDomains(universityId);
    const domain = getEmailDomain(email);
    return Boolean(domain && allowedDomains.length > 0 && allowedDomains.includes(domain));
  };

  const regionUnis = useMemo(() => {
    return catalogUniversities
      .filter(u => u.region === activeRegion)
      .filter(u =>
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.points - a.points);
  }, [activeRegion, catalogUniversities, searchQuery]);

  const currentRegion = UNIVERSITY_VISIBLE_REGIONS.find(r => r.id === activeRegion) || UNIVERSITY_VISIBLE_REGIONS[0];
  const regionTournaments = useMemo(() => {
    return liveUniversityTournaments
      .filter((tournament) => tournament.region === activeRegion)
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        return aTime - bTime;
      });
  }, [activeRegion, liveUniversityTournaments]);

  const stats = useMemo(() => {
    const unis = catalogUniversities.filter(u => u.region === activeRegion);
    return {
      total: unis.length,
      verified: unis.filter(u => u.verified).length,
      students: unis.reduce((sum, u) => sum + Number(u.verifiedStudentsCount || 0), 0),
      teams: unis.reduce((sum, u) => sum + u.teams.length, 0),
      tournaments: regionTournaments.length,
    };
  }, [activeRegion, catalogUniversities, regionTournaments.length]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data || null);
    } catch (error) {
      console.error('Error cargando perfil en University:', error);
    }
  };

  const loadMyUniversityStatus = async () => {
    if (!token) {
      setStatusLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/university/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextStatus = res.data?.university || EMPTY_UNIVERSITY_STATUS;
      setMyUniversityStatus(nextStatus);
      setMyUniversityApplication(res.data?.application || null);
      setMicrosoftConnection(res.data?.microsoftConnection || EMPTY_MICROSOFT_CONNECTION);
      setFormData((prev) => ({
        ...prev,
        institutionalEmail: prev.institutionalEmail || nextStatus.institutionalEmail || res.data?.microsoftConnection?.email || res.data?.userEmail || ''
      }));
    } catch (error) {
      console.error('Error cargando estado universitario:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrStatusLoad')
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const loadUniversityTournaments = async () => {
    setTournamentLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/tournaments`);
      const tournaments = Array.isArray(res.data) ? res.data : [];
      const normalized = tournaments
        .filter((tournament) => tournament?.eligibility?.universityOnly === true && isUniversityAllowedGame(tournament?.game))
        .map((tournament) => {
          const status = String(tournament?.status || 'draft').trim().toLowerCase();
          const meta = UNIVERSITY_TOURNAMENT_CARD_META[status] || UNIVERSITY_TOURNAMENT_CARD_META.draft;
          return {
            id: tournament?._id || tournament?.tournamentId,
            code: tournament?.tournamentId || '',
            title: tournament?.title || t('upDefaultTourneyTitle'),
            game: tournament?.game || t('upDefaultGame'),
            date: tournament?.date || null,
            format: tournament?.format || t('upDefaultFormat'),
            prize: tournament?.prizePool || tournament?.prizeDetails || t('upDefaultPrize'),
            status,
            statusLabelKey: meta.labelKey,
            color: meta.color,
            region: UNIVERSITY_ENABLED_REGION
          };
        });
      setLiveUniversityTournaments(normalized);
    } catch (error) {
      console.error('Error cargando torneos universitarios:', error);
      setStatusNotice((prev) => prev || {
        type: 'error',
        text: error?.response?.data?.message || t('upErrTourneysLoad')
      });
    } finally {
      setTournamentLoading(false);
    }
  };

  const loadUniversityCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/catalog?region=${UNIVERSITY_ENABLED_REGION}`);
      const nextCatalog = Array.isArray(res.data) ? res.data : [];
      setCatalogUniversities(nextCatalog);
    } catch (error) {
      console.error('Error cargando catálogo universitario:', error);
      setStatusNotice((prev) => prev || {
        type: 'error',
        text: error?.response?.data?.message || t('upErrCatalogLoad')
      });
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadUniversityStandingsMeta = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/university/standings`);
      setPointsConfig(res.data?.pointsConfig || null);
    } catch (error) {
      console.error('Error cargando configuración de puntos universitarios:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    loadUniversityCatalog();
    loadUniversityStandingsMeta();
    loadMyUniversityStatus();
    loadUniversityTournaments();
  }, [token]);

  useEffect(() => {
    if (!selectedUni?.id || catalogUniversities.length === 0) return;
    const freshSelected = catalogUniversities.find((item) => item.id === selectedUni.id);
    if (freshSelected) {
      setSelectedUni(freshSelected);
    }
  }, [catalogUniversities, selectedUni?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const microsoftStatus = params.get('universityMs');
    if (!microsoftStatus) return;

    const message = params.get('message') || '';
    setStatusNotice({
      type: microsoftStatus === 'error' ? 'error' : 'success',
      text: message || (
        microsoftStatus === 'approved'
          ? t('upMsApproved')
          : microsoftStatus === 'linked'
            ? t('upMsLinked')
            : t('upMsCompleted')
      )
    });

    params.delete('universityMs');
    params.delete('message');
    const nextQuery = params.toString();
    window.history.replaceState({}, document.title, `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
  }, []);

  const loadAdminApplications = async () => {
    if (!token || !currentUser?.isAdmin) return;
    setAdminLoading(true);
    try {
      const params = new URLSearchParams();
      if (adminFilters.status) params.set('status', adminFilters.status);
      if (adminFilters.region) params.set('region', adminFilters.region);

      const res = await axios.get(`${API_URL}/api/university/applications${params.toString() ? `?${params}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminApplications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando postulaciones universitarias:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrAppsLoad')
      });
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.isAdmin) {
      loadAdminApplications();
    }
  }, [activeTab, currentUser?.isAdmin, adminFilters.status, adminFilters.region]);

  const currentUniversityState = myUniversityStatus?.verificationStatus || 'unlinked';
  const currentUniversityMeta = UNIVERSITY_STATUS_META[currentUniversityState] || UNIVERSITY_STATUS_META.unlinked;
  const currentAppliedUniversityId = myUniversityApplication?.universityId || myUniversityStatus?.universityId || '';
  const selectedUniMatchesCurrent = Boolean(selectedUni && myUniversityStatus?.universityId === selectedUni.id);
  const hasBlockingUniversityApplication = ['pending', 'verified'].includes(currentUniversityState);
  const selectedUniLocked = (
    (selectedUniMatchesCurrent && hasBlockingUniversityApplication)
    || (hasBlockingUniversityApplication && Boolean(selectedUni?.id) && Boolean(currentAppliedUniversityId) && currentAppliedUniversityId !== selectedUni.id)
  );
  const institutionalEmail = String(myUniversityApplication?.institutionalEmail || myUniversityStatus?.institutionalEmail || '').trim().toLowerCase();
  const microsoftEmail = String(microsoftConnection?.email || '').trim().toLowerCase();
  const currentUniversityAllowedDomains = getCatalogUniversityAllowedDomains(myUniversityApplication?.universityId || myUniversityStatus?.universityId);
  const hasMicrosoftInstitutionalMatch = Boolean(
    microsoftConnection?.verified &&
    institutionalEmail &&
    microsoftEmail &&
    microsoftEmail === institutionalEmail
  );
  const canCreateUniversityTeam = currentUniversityState === 'verified';
  const canCompeteUniversityTournament = currentUniversityState === 'verified';
  const needsManualReview = currentUniversityState === 'pending' || (microsoftConnection?.verified && !hasMicrosoftInstitutionalMatch);

  const handleConnectMicrosoftUniversity = async () => {
    if (!token) {
      setStatusNotice({ type: 'error', text: t('upErrLoginConnect') });
      return;
    }
    if (!institutionalEmail) {
      setStatusNotice({ type: 'error', text: t('upErrNoEmail') });
      return;
    }
    setConnectLoading(true);
    setStatusNotice(null);
    try {
      const res = await axios.post(`${API_URL}/api/university/microsoft/connect`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.data?.authorizationUrl) {
        throw new Error(t('upErrNoAuthUrl'));
      }
      window.location.href = res.data.authorizationUrl;
    } catch (error) {
      console.error('Error iniciando conexión universitaria Microsoft:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrConnectFail')
      });
      setConnectLoading(false);
    }
  };

  const handleDisconnectMicrosoftUniversity = async () => {
    if (!token) {
      setStatusNotice({ type: 'error', text: t('upErrLoginDisconnect') });
      return;
    }
    setConnectLoading(true);
    setStatusNotice(null);
    try {
      const res = await axios.delete(`${API_URL}/api/university/microsoft`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusNotice({
        type: 'success',
        text: res.data?.message || t('upSuccessDisconnect')
      });
      await loadMyUniversityStatus();
    } catch (error) {
      console.error('Error desconectando cuenta universitaria Microsoft:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrDisconnectFail')
      });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleReviewApplication = async (application, decision) => {
    if (!token || !currentUser?.isAdmin || !application?._id) return;

    const rejectReason = String(rejectDrafts[application._id] || '').trim();
    if ((decision === 'rejected' || decision === 'revoked') && !rejectReason) {
      setStatusNotice({
        type: 'error',
        text: decision === 'revoked' ? t('upErrRevokeReason') : t('upErrRejectReason')
      });
      return;
    }

    setReviewLoadingId(application._id);
    setStatusNotice(null);
    try {
      await axios.patch(`${API_URL}/api/university/applications/${application._id}/review`, {
        decision,
        rejectReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRejectDrafts((prev) => {
        const next = { ...prev };
        delete next[application._id];
        return next;
      });
      setStatusNotice({
        type: 'success',
        text: decision === 'approved'
          ? t('upSuccessApprove')
          : decision === 'rejected'
            ? t('upSuccessReject')
            : t('upSuccessRevoke')
      });
      await loadAdminApplications();
      await loadMyUniversityStatus();
    } catch (error) {
      console.error('Error revisando postulación universitaria:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrReviewFail')
      });
    } finally {
      setReviewLoadingId('');
    }
  };

  const renderUniversityStatusBanner = () => {
    if (!statusNotice && currentUniversityState === 'unlinked' && !statusLoading) return null;

    return (
      <div className="up-status-stack">
        {statusNotice && (
          <div className={`up-status-banner up-status-banner--${statusNotice.type}`}>
            <i className={`bx ${statusNotice.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
            <div>
              <strong>{statusNotice.type === 'success' ? 'University' : t('upBannerError')}</strong>
              <span>{statusNotice.text}</span>
            </div>
          </div>
        )}

        {statusLoading ? (
          <div className="up-status-banner up-status-banner--neutral">
            <i className="bx bx-loader-alt"></i>
            <div>
              <strong>University</strong>
              <span>{t('upBannerLoading')}</span>
            </div>
          </div>
        ) : currentUniversityState !== 'unlinked' ? (
          <div className={`up-status-banner up-status-banner--${currentUniversityMeta.tone}`}>
            <i className={`bx ${
              currentUniversityState === 'verified'
                ? 'bx-badge-check'
                : currentUniversityState === 'pending'
                  ? 'bx-time-five'
                  : 'bx-x-circle'
            }`}></i>
            <div>
              <strong>{t(currentUniversityMeta.titleKey)}</strong>
              <span>
                {myUniversityStatus.universityName ? `${myUniversityStatus.universityName}. ` : ''}
                {t(currentUniversityMeta.textKey)}
                {currentUniversityState === 'pending' && myUniversityStatus.rejectReason ? ` ${t('upReasonCurrent')}: ${myUniversityStatus.rejectReason}` : ''}
                {currentUniversityState === 'rejected' && myUniversityStatus.rejectReason ? ` ${t('upReason')}: ${myUniversityStatus.rejectReason}` : ''}
              </span>
            </div>
          </div>
        ) : null}

        {(currentUniversityState === 'pending' || currentUniversityState === 'rejected') && institutionalEmail ? (
          <div className="up-ms-card">
            <div className="up-ms-card__icon">
              <i className='bx bxl-microsoft'></i>
            </div>
            <div className="up-ms-card__content">
              <strong>{t('upMsCardTitle')}</strong>
              <span>
                {t('upMsCardDesc')}
                {microsoftConnection?.verified && microsoftEmail
                  ? ` ${t('upMsConnectedLabel')} ${microsoftEmail}.`
                  : ` ${t('upMsExpected')} ${institutionalEmail}.`}
              </span>
              {currentUniversityAllowedDomains.length > 0 ? (
                <small className="up-ms-card__warning">
                  {t('upMsAllowedDomains')} {currentUniversityAllowedDomains.join(', ')}.
                </small>
              ) : null}
              {microsoftConnection?.verified && microsoftEmail && !hasMicrosoftInstitutionalMatch ? (
                <small className="up-ms-card__warning">
                  {t('upMsMismatch')}
                </small>
              ) : null}
            </div>
            <div className="up-ms-card__actions">
              <button
                type="button"
                className="up-btn up-btn--microsoft"
                onClick={handleConnectMicrosoftUniversity}
                disabled={connectLoading || currentUniversityState === 'verified'}
              >
                <i className='bx bxl-microsoft'></i>
                {connectLoading
                  ? t('upBtnConnecting')
                  : hasMicrosoftInstitutionalMatch
                    ? t('upBtnReconnect')
                    : t('upBtnConnect')}
              </button>
              {microsoftConnection?.verified ? (
                <button
                  type="button"
                  className="up-btn up-btn--ghost up-btn--danger"
                  onClick={handleDisconnectMicrosoftUniversity}
                  disabled={connectLoading}
                >
                  <i className='bx bx-unlink'></i>
                  {t('upBtnDisconnect')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderEligibilityOverview = () => (
    <div className="up-eligibility">
      <div className={`up-eligibility__card up-eligibility__card--${currentUniversityMeta.tone}`}>
        <div className="up-eligibility__icon">
          <i className={`bx ${
            currentUniversityState === 'verified'
              ? 'bx-badge-check'
              : currentUniversityState === 'pending'
                ? 'bx-time-five'
                : currentUniversityState === 'rejected'
                  ? 'bx-x-circle'
                  : 'bx-id-card'
          }`}></i>
        </div>
        <div className="up-eligibility__body">
          <span className="up-eyebrow">{t('upEyebrowStatus')}</span>
          <strong>{t(currentUniversityMeta.titleKey)}</strong>
          <p>{t(currentUniversityMeta.textKey)}</p>
          {currentAppliedUniversityId ? (
            <small className="up-eligibility__hint">
              {t('upLinkedUni')} {myUniversityStatus?.universityName || myUniversityApplication?.universityName || currentAppliedUniversityId}.
            </small>
          ) : null}
        </div>
      </div>

      <div className={`up-eligibility__card up-eligibility__card--${microsoftConnection?.verified ? 'verified' : 'neutral'}`}>
        <div className="up-eligibility__icon">
          <i className='bx bxl-microsoft'></i>
        </div>
        <div className="up-eligibility__body">
          <span className="up-eyebrow">{t('upEyebrowAccount')}</span>
          <strong>{microsoftConnection?.verified ? t('upMsConnectedTitle') : t('upMsPendingTitle')}</strong>
          <p>
            {microsoftConnection?.verified && microsoftEmail
              ? `${microsoftEmail} ${hasMicrosoftInstitutionalMatch ? t('upMsMatchDesc') : t('upMsMismatchDesc')}`
              : t('upMsPendingDesc')}
          </p>
        </div>
      </div>

      <div className={`up-eligibility__card up-eligibility__card--${canCreateUniversityTeam ? 'verified' : 'pending'}`}>
        <div className="up-eligibility__icon">
          <i className='bx bx-group'></i>
        </div>
        <div className="up-eligibility__body">
          <span className="up-eyebrow">{t('upEyebrowTeam')}</span>
          <strong>{canCreateUniversityTeam ? t('upTeamCanCreate') : t('upTeamCannotCreate')}</strong>
          <p>
            {canCreateUniversityTeam
              ? t('upTeamVerifiedDesc')
              : needsManualReview
                ? t('upTeamPendingDesc')
                : t('upTeamUnlinkedDesc')}
          </p>
        </div>
        <div className="up-eligibility__actions">
          <button
            type="button"
            className="up-btn up-btn--ghost"
            disabled={!canCreateUniversityTeam}
            onClick={() => navigate('/create-team?teamLevel=universitario&source=university')}
          >
            {t('upBtnGoTeams')}
          </button>
        </div>
      </div>

      <div className={`up-eligibility__card up-eligibility__card--${canCompeteUniversityTournament ? 'verified' : 'pending'}`}>
        <div className="up-eligibility__icon">
          <i className='bx bx-trophy'></i>
        </div>
        <div className="up-eligibility__body">
          <span className="up-eyebrow">{t('upEyebrowTourneys')}</span>
          <strong>{canCompeteUniversityTournament ? t('upTourneyReady') : t('upTourneyBlocked')}</strong>
          <p>
            {canCompeteUniversityTournament
              ? t('upTourneyReadyDesc')
              : t('upTourneyBlockedDesc')}
          </p>
        </div>
        <div className="up-eligibility__actions">
          <button
            type="button"
            className="up-btn up-btn--ghost"
            disabled={!canCompeteUniversityTournament}
            onClick={() => navigate('/torneos')}
          >
            {t('upBtnSeeTourneys')}
          </button>
        </div>
      </div>
    </div>
  );

  const openEnroll = (uni) => {
    if (hasBlockingUniversityApplication && currentAppliedUniversityId && currentAppliedUniversityId !== uni?.id) {
      setStatusNotice({
        type: 'error',
        text: t('upErrDupApp').replace('{{uni}}', myUniversityStatus?.universityName || myUniversityApplication?.universityName || t('upAnotherUni'))
      });
      return;
    }
    setStatusNotice(null);
    setFieldErrors({});
    setEnrollUni(uni);
    setEnrollStep(1);
    setEnrollModal(true);
    setFormData((prev) => ({
      matricula: '',
      carrera: '',
      campus: '',
      customCampus: '',
      nivel: '',
      institutionalEmail: prev.institutionalEmail || myUniversityStatus?.institutionalEmail || ''
    }));
  };

  const validateEnrollForm = () => {
    const nextErrors = {};
    const normalizedStudentId = String(formData.matricula || '').trim();
    const normalizedProgram = String(formData.carrera || '').trim();
    const selectedCampus = String(formData.campus || '').trim();
    const normalizedEmail = String(formData.institutionalEmail || '').trim().toLowerCase();
    const allowedPrograms = Array.isArray(enrollUni?.programs) ? enrollUni.programs : [];
    const allowedCampuses = Array.isArray(enrollUni?.campuses) ? enrollUni.campuses : [];

    if (!STUDENT_ID_REGEX.test(normalizedStudentId)) {
      nextErrors.matricula = t('upErrStudentId');
    }

    if (!normalizedProgram) {
      nextErrors.carrera = t('upErrNoProg');
    } else if (allowedPrograms.length === 0) {
      nextErrors.carrera = t('upErrNoProgConfig');
    } else if (!allowedPrograms.includes(normalizedProgram)) {
      nextErrors.carrera = t('upErrInvalidProg');
    }

    if (!selectedCampus) {
      nextErrors.campus = t('upErrNoCampus');
    } else if (allowedCampuses.length === 0) {
      nextErrors.campus = t('upErrNoCampusConfig');
    } else if (!allowedCampuses.includes(selectedCampus)) {
      nextErrors.campus = t('upErrInvalidCampus');
    }

    if (!ALLOWED_ACADEMIC_LEVELS.has(String(formData.nivel || '').trim())) {
      nextErrors.nivel = t('upErrNoLevel');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.institutionalEmail = t('upErrEmailFormat');
    } else if (PUBLIC_EMAIL_DOMAINS.has(getEmailDomain(normalizedEmail))) {
      nextErrors.institutionalEmail = t('upErrEmailPersonal');
    } else if (enrollUni?.region !== 'rd') {
      nextErrors.institutionalEmail = t('upErrEmailRegion');
    } else if (getCatalogUniversityAllowedDomains(enrollUni?.id).length === 0) {
      nextErrors.institutionalEmail = t('upErrEmailNoDomains');
    } else if (!isCatalogInstitutionalEmailAllowed(enrollUni?.id, normalizedEmail)) {
      nextErrors.institutionalEmail = `${t('upErrEmailDomain')} ${getCatalogUniversityAllowedDomains(enrollUni?.id).join(', ')}.`;
    }

    setFieldErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      normalizedCampus: selectedCampus
    };
  };

  const handleSubmitEnroll = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatusNotice({ type: 'error', text: t('upErrLoginApply') });
      return;
    }
    if (!enrollUni) return;

    const { isValid, normalizedCampus } = validateEnrollForm();
    if (!isValid) return;

    setSubmitLoading(true);
    setStatusNotice(null);

    try {
      await axios.post(`${API_URL}/api/university/applications`, {
        universityId: enrollUni.id,
        universityTag: enrollUni.tag,
        universityName: enrollUni.name,
        region: enrollUni.region,
        city: normalizedCampus,
        campus: normalizedCampus,
        studentId: formData.matricula,
        program: formData.carrera,
        academicLevel: formData.nivel,
        institutionalEmail: formData.institutionalEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEnrollModal(false);
      setFieldErrors({});
      setFormData({ matricula: '', carrera: '', campus: '', customCampus: '', nivel: '', institutionalEmail: '' });
      setStatusNotice({
        type: 'success',
        text: t('upSuccessApply')
      });
      await loadMyUniversityStatus();
    } catch (error) {
      console.error('Error enviando postulación:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || t('upErrApplyFail')
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ─── VISTA DETALLE DE UNIVERSIDAD ─── */
  if (selectedUni) {
    return (
      <div className="up">
        <button className="up-back" onClick={() => setSelectedUni(null)}>
          <i className='bx bx-arrow-back'></i>
          <span>{t('upBack')}</span>
        </button>

        <div className="up-detail-hero">
          <div className="up-detail-hero__gradient"></div>
          <div className="up-detail-hero__content">
            <div className="up-detail-hero__logo">
              <img src={selectedUni.logo} alt={selectedUni.tag} />
            </div>
            <div className="up-detail-hero__info">
              <span className="up-eyebrow">
                {selectedUni.verified && <><i className='bx bxs-badge-check'></i> {t('upVerified')}</>}
                {!selectedUni.verified && t('upPendingVerif')}
              </span>
              <h1>{selectedUni.tag}</h1>
              <h2>{selectedUni.name}</h2>
              <div className="up-detail-hero__meta">
                <span><i className='bx bx-map'></i> {selectedUni.city}</span>
                <span><i className='bx bx-calendar'></i> {t('upFoundedIn')} {selectedUni.founded}</span>
                <span><i className='bx bx-log-in-circle'></i> {t('upInGG')} {selectedUni.joinedGlitchGang}</span>
              </div>
            </div>
            <div className="up-detail-hero__actions">
              <div className="up-detail-hero__score">
                <span className="up-detail-hero__score-val">{selectedUni.points.toLocaleString()}</span>
                <small>{t('upPoints')}</small>
              </div>
              <button
                className="up-btn up-btn--primary"
                type="button"
                onClick={() => openEnroll(selectedUni)}
                disabled={selectedUniLocked || submitLoading}
              >
                <i className='bx bx-right-top-arrow-circle'></i>{' '}
                {selectedUniMatchesCurrent && currentUniversityState === 'pending'
                  ? t('upBtnReview')
                  : selectedUniMatchesCurrent && currentUniversityState === 'verified'
                    ? t('upBtnVerifiedState')
                    : currentUniversityState === 'rejected'
                      ? t('upBtnReapply')
                      : hasBlockingUniversityApplication && currentAppliedUniversityId && currentAppliedUniversityId !== selectedUni.id
                      ? t('upBtnBlocked')
                      : t('upBtnApply')}
              </button>
            </div>
          </div>
        </div>

        {renderUniversityStatusBanner()}
        {renderEligibilityOverview()}

        <div className="up-detail-grid">
          <div className="up-surface up-detail-bio">
            <div className="up-surface__head">
              <i className='bx bx-book-open'></i>
              <div>
                <span className="up-eyebrow">{t('upEyebrowHistory')}</span>
                <h3>{t('upBio')}</h3>
              </div>
            </div>
            <p className="up-detail-bio__text">{selectedUni.bio}</p>
            <div className="up-detail-bio__stats">
              <div className="up-detail-bio__stat">
                <span>{selectedUni.founded}</span>
                <small>{t('upFoundation')}</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.joinedGlitchGang}</span>
                <small>{t('upInGGShort')}</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{Number(selectedUni.verifiedStudentsCount || 0).toLocaleString()}</span>
                <small>{t('upStudents')}</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.teams.length}</span>
                <small>{t('upTeams')}</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.games.length}</span>
                <small>{t('upGames')}</small>
              </div>
            </div>
            <div className="up-detail-points">
              <div className="up-surface__head">
                <i className='bx bx-medal'></i>
                <div>
                  <span className="up-eyebrow">{t('upEyebrowComp')}</span>
                  <h3>{t('upPointsSystem')}</h3>
                </div>
              </div>
              <div className="up-detail-points__grid">
                <div className="up-detail-points__item">
                  <strong>{selectedUni?.stats?.tournamentsPlayed || 0}</strong>
                  <small>{t('upTourneysPlayed')}</small>
                </div>
                <div className="up-detail-points__item">
                  <strong>{selectedUni?.stats?.matchWins || 0}</strong>
                  <small>{t('upWins')}</small>
                </div>
                <div className="up-detail-points__item">
                  <strong>{selectedUni?.stats?.championships || 0}</strong>
                  <small>{t('upChampionships')}</small>
                </div>
                <div className="up-detail-points__item">
                  <strong>{selectedUni?.stats?.finals || 0}</strong>
                  <small>{t('upFinals')}</small>
                </div>
              </div>
              {pointsConfig ? (
                <div className="up-detail-points__rules">
                  <span>{t('upBaseParticipation')} +{pointsConfig.participation}</span>
                </div>
              ) : null}
              {pointsConfig?.sizeMultipliers ? (
                <div className="up-detail-points__size-tiers">
                  {pointsConfig.sizeMultipliers.map((tier) => (
                    <span key={tier.label}>
                      {tier.label} x{Number(tier.multiplier || 1).toFixed(2)}
                    </span>
                  ))}
                </div>
              ) : null}
              {pointsConfig?.formats ? (
                <div className="up-detail-points__formats">
                  {Object.entries(pointsConfig.formats).map(([formatKey, config]) => (
                    <div key={formatKey} className="up-detail-points__format-card">
                      <strong>{config.label}</strong>
                      <small>{t('upWinBonus')} +{config.matchWin}</small>
                      <small>{t('upChampBonus')} +{config.championBonus}</small>
                      <small>{t('upFinalistBonus')} +{config.finalistBonus}</small>
                      <small>{t('upSemiBonus')} +{config.semifinalBonus}</small>
                      <em>{config.placementNote}</em>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="up-surface up-detail-games">
            <div className="up-surface__head">
              <i className='bx bx-joystick'></i>
              <div>
                <span className="up-eyebrow">{t('upEyebrowCompGames')}</span>
                <h3>{t('upSponsoredGames')}</h3>
              </div>
            </div>
            <div className="up-detail-games__grid">
              {selectedUni.games.map(g => (
                <div key={g} className="up-detail-games__item">
                  <i className='bx bxs-zap'></i>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="up-surface up-detail-offers">
            <div className="up-surface__head">
              <i className='bx bx-gift'></i>
              <div>
                <span className="up-eyebrow">{t('upEyebrowBenefits')}</span>
                <h3>{t('upOffers')}</h3>
              </div>
            </div>
            <ul className="up-detail-offers__list">
              {selectedUni.offers.map((o, i) => (
                <li key={i}>
                  <i className='bx bx-check-circle'></i>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="up-surface up-detail-teams">
            <div className="up-surface__head">
              <i className='bx bx-group'></i>
              <div>
                <span className="up-eyebrow">{t('upEyebrowRoster')}</span>
                <h3>{t('upActiveTeams')}</h3>
              </div>
            </div>
            {selectedUni.teams.length === 0 ? (
              <div className="up-empty up-empty--sm">
                <i className='bx bx-user-plus'></i>
                <p>{t('upNoTeams')}</p>
              </div>
            ) : (
              <div className="up-detail-teams__list">
                {selectedUni.teams.map((team, i) => (
                  <div key={i} className="up-detail-teams__card">
                    <div className="up-detail-teams__card-icon">
                      <i className='bx bxs-zap'></i>
                    </div>
                    <div className="up-detail-teams__card-info">
                      <strong>{team.name}</strong>
                      <span>{team.game}</span>
                    </div>
                    <div className="up-detail-teams__card-meta">
                      <div className="up-detail-teams__card-badge">{team.rank}</div>
                      <small>{team.members} {t('upPlayers')}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {enrollModal && renderEnrollModal()}
      </div>
    );
  }

  function renderEnrollModal() {
    const uni = enrollUni;
    if (!uni) return null;
    return (
      <div className="up-overlay" onClick={() => setEnrollModal(false)}>
        <div className="up-modal" onClick={e => e.stopPropagation()}>
          <button className="up-modal__close" onClick={() => setEnrollModal(false)}>
            <i className='bx bx-x'></i>
          </button>

          {enrollStep === 1 && (
            <>
              <div className="up-modal__head">
                <h3>{t('upModalTitle')}</h3>
                <p>{t('upModalConfirmUni')}</p>
              </div>
              <div className="up-modal__uni-preview">
                <img src={uni.logo} alt={uni.tag} />
                <div>
                  <strong>{uni.tag}</strong>
                  <span>{uni.name}</span>
                  <span className="up-modal__uni-city">{uni.city}</span>
                </div>
              </div>
              <button className="up-btn up-btn--primary up-btn--full" onClick={() => setEnrollStep(2)}>
                {t('upBtnContinue')} <i className='bx bx-right-arrow-alt'></i>
              </button>
            </>
          )}

          {enrollStep === 2 && (
            <form onSubmit={handleSubmitEnroll}>
              <div className="up-modal__form-top">
                <button type="button" className="up-btn up-btn--ghost" onClick={() => setEnrollStep(1)}>
                  <i className='bx bx-left-arrow-alt'></i> {t('upBtnBack')}
                </button>
                <div className="up-modal__badge">
                  <img src={uni.logo} alt="" />
                  <span>{uni.tag}</span>
                </div>
              </div>
              <h3 className="up-modal__form-title">{t('upModalFormTitle')}</h3>
              <div className="up-field">
                <label>{t('upFieldId')}</label>
                <input
                  className={fieldErrors.matricula ? 'up-field__input--error' : ''}
                  type="text"
                  placeholder={t('upFieldIdPlaceholder')}
                  required
                  value={formData.matricula}
                  onChange={e => {
                    setFormData({ ...formData, matricula: e.target.value });
                    if (fieldErrors.matricula) setFieldErrors((prev) => ({ ...prev, matricula: '' }));
                  }}
                />
                {fieldErrors.matricula && <small className="up-field__error">{fieldErrors.matricula}</small>}
              </div>
              <div className="up-field">
                <label>{t('upFieldEmail')}</label>
                <input
                  className={fieldErrors.institutionalEmail ? 'up-field__input--error' : ''}
                  type="email"
                  placeholder="tu-correo@universidad.edu"
                  required
                  value={formData.institutionalEmail}
                  onChange={e => {
                    setFormData({ ...formData, institutionalEmail: e.target.value });
                    if (fieldErrors.institutionalEmail) setFieldErrors((prev) => ({ ...prev, institutionalEmail: '' }));
                  }}
                />
                {fieldErrors.institutionalEmail && <small className="up-field__error">{fieldErrors.institutionalEmail}</small>}
                {!fieldErrors.institutionalEmail && (
                  <small className="up-field__hint">
                    {t('upFieldEmailHint')} {t('upMsAllowedDomains')} {getCatalogUniversityAllowedDomains(enrollUni?.id).join(', ') || t('upFieldEmailPending')}. {t('upFieldEmailMsHint')}
                  </small>
                )}
              </div>
              <div className="up-field">
                <label>{t('upFieldProgram')}</label>
                <select
                  className={fieldErrors.carrera ? 'up-field__input--error' : ''}
                  required
                  value={formData.carrera}
                  onChange={e => {
                    setFormData({ ...formData, carrera: e.target.value });
                    if (fieldErrors.carrera) setFieldErrors((prev) => ({ ...prev, carrera: '' }));
                  }}
                >
                  <option value="" disabled>{t('upFieldProgramSelect')}</option>
                  {(Array.isArray(uni.programs) ? uni.programs : []).map((program) => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
                {fieldErrors.carrera && <small className="up-field__error">{fieldErrors.carrera}</small>}
                {!fieldErrors.carrera && (
                  <small className="up-field__hint">
                    {t('upFieldProgramHint')} {uni.tag}.
                  </small>
                )}
              </div>
              <div className="up-field">
                <label>{t('upFieldCampus')}</label>
                <select
                  className={fieldErrors.campus ? 'up-field__input--error' : ''}
                  required
                  value={formData.campus}
                  onChange={e => {
                    setFormData({ ...formData, campus: e.target.value });
                    if (fieldErrors.campus) setFieldErrors((prev) => ({ ...prev, campus: '' }));
                  }}
                >
                  <option value="" disabled>{t('upFieldCampusSelect')}</option>
                  {(Array.isArray(uni.campuses) ? uni.campuses : []).map((campus) => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
                {fieldErrors.campus && <small className="up-field__error">{fieldErrors.campus}</small>}
                {!fieldErrors.campus && (
                  <small className="up-field__hint">
                    {t('upFieldCampusHint')} {uni.tag}.
                  </small>
                )}
              </div>
              <div className="up-field">
                <label>{t('upFieldLevel')}</label>
                <select
                  className={fieldErrors.nivel ? 'up-field__input--error' : ''}
                  required
                  value={formData.nivel}
                  onChange={e => {
                    setFormData({ ...formData, nivel: e.target.value });
                    if (fieldErrors.nivel) setFieldErrors((prev) => ({ ...prev, nivel: '' }));
                  }}
                >
                  <option value="" disabled>{t('upFieldLevelSelect')}</option>
                  {ACADEMIC_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {fieldErrors.nivel && <small className="up-field__error">{fieldErrors.nivel}</small>}
              </div>
              <button type="submit" className="up-btn up-btn--primary up-btn--full" disabled={submitLoading}>
                {submitLoading ? t('upBtnSubmitting') : t('upBtnConfirm')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="up">
      <header className="up-header">
        <div className="up-header__left">
          <span className="up-eyebrow"><i className='bx bxs-graduation'></i> {t('upEyebrowHeader')}</span>
          <h1 className="up-header__title">
            {t('upHeaderTitle')} <span className="up-glow-text">{t('upHeaderTitleAccent')}</span>
          </h1>
          <p className="up-header__desc">{t('upHeaderDesc')}</p>
        </div>
        <div className="up-header__right">
          <div className="up-header__stats">
            <div className="up-header__stat">
              <span>{stats.total}</span>
              <small>{t('upStatUnis')}</small>
            </div>
            <div className="up-header__stat-sep"></div>
            <div className="up-header__stat">
              <span>{stats.verified}</span>
              <small>{t('upStatVerified')}</small>
            </div>
            <div className="up-header__stat-sep"></div>
            <div className="up-header__stat">
              <span>{stats.students}</span>
              <small>{t('upStatStudents')}</small>
            </div>
            <div className="up-header__stat-sep"></div>
            <div className="up-header__stat">
              <span>{stats.teams}</span>
              <small>{t('upStatTeams')}</small>
            </div>
          </div>
        </div>
      </header>

      {renderUniversityStatusBanner()}
      {renderEligibilityOverview()}

      <div className="up-regions">
        {UNIVERSITY_VISIBLE_REGIONS.map(r => (
          <button
            key={r.id}
            className={`up-regions__btn ${activeRegion === r.id ? 'up-regions__btn--active' : ''}`}
            onClick={() => { setActiveRegion(r.id); setSearchQuery(''); }}
          >
            <span className="up-regions__flag">{r.flag}</span>
            <span className="up-regions__name">{r.short}</span>
            <span className="up-regions__count">{catalogUniversities.filter(u => u.region === r.id).length}</span>
          </button>
        ))}
      </div>

      <div className="up-tabs">
        <button className={`up-tabs__btn ${activeTab === 'universidades' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('universidades')}>
          <i className='bx bx-buildings'></i> {t('upTabUnis')}
        </button>
        <button className={`up-tabs__btn ${activeTab === 'torneos' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('torneos')}>
          <i className='bx bx-trophy'></i> {t('upTabTourneys')}
        </button>
        <button className={`up-tabs__btn ${activeTab === 'rankings' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('rankings')}>
          <i className='bx bx-bar-chart-alt-2'></i> {t('upTabRankings')}
        </button>
        {currentUser?.isAdmin && (
          <button className={`up-tabs__btn ${activeTab === 'admin' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('admin')}>
            <i className='bx bx-check-shield'></i> {t('upTabAdmin')}
          </button>
        )}
      </div>

      <div className="up-content">

        {activeTab === 'universidades' && (
          <>
            <div className="up-search">
              <i className='bx bx-search'></i>
              <input
                type="text"
                placeholder={t('upSearchPlaceholder').replace('{{region}}', currentRegion?.name || '')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="up-search__clear" onClick={() => setSearchQuery('')}>
                  <i className='bx bx-x'></i>
                </button>
              )}
            </div>
            <div className="up-uni-grid">
              {catalogLoading ? (
                <div className="up-empty">
                  <i className='bx bx-loader-alt'></i>
                  <h3>{t('upLoadingUnis')}</h3>
                  <p>{t('upLoadingUnisDesc')}</p>
                </div>
              ) : regionUnis.length === 0 ? (
                <div className="up-empty">
                  <i className='bx bx-search-alt-2'></i>
                  <h3>{t('upNoResults')}</h3>
                  <p>{t('upNoResultsDesc')}</p>
                </div>
              ) : (
                regionUnis.map(uni => (
                  <div key={uni.id} className="up-uni-card" onClick={() => setSelectedUni(uni)}>
                    <div className="up-uni-card__top">
                      <div className="up-uni-card__logo">
                        <img src={uni.logo} alt={uni.tag} />
                      </div>
                      <div className="up-uni-card__score">
                        <span>{uni.points.toLocaleString()}</span>
                        <small>{t('upPts')}</small>
                      </div>
                    </div>
                    <div className="up-uni-card__body">
                      <div className="up-uni-card__name-row">
                        <h4>{uni.tag}</h4>
                        {uni.verified && <i className='bx bxs-badge-check up-verified'></i>}
                      </div>
                      <p className="up-uni-card__fullname">{uni.name}</p>
                      <span className="up-uni-card__city"><i className='bx bx-map'></i> {uni.city}</span>
                    </div>
                    <div className="up-uni-card__footer">
                      <div className="up-uni-card__games">
                        {uni.games.slice(0, 3).map(g => (
                          <span key={g} className="up-tag">{g}</span>
                        ))}
                        {uni.games.length > 3 && <span className="up-tag up-tag--more">+{uni.games.length - 3}</span>}
                      </div>
                      <div className="up-uni-card__counts">
                        <div className="up-uni-card__teams-count">
                          <i className='bx bx-user'></i> {Number(uni.verifiedStudentsCount || 0)}
                        </div>
                        <div className="up-uni-card__teams-count">
                          <i className='bx bx-group'></i> {uni.teams.length}
                        </div>
                      </div>
                    </div>
                    <div className="up-uni-card__hover-hint">
                      <span>{t('upSeeDetails')}</span> <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'torneos' && (
          <div className="up-tournaments">
            {tournamentLoading ? (
              <div className="up-empty">
                <i className='bx bx-loader-alt'></i>
                <h3>{t('upLoadingTourneys')}</h3>
                <p>{t('upLoadingTourneysDesc')}</p>
              </div>
            ) : regionTournaments.length === 0 ? (
              <div className="up-empty">
                <i className='bx bx-trophy'></i>
                <h3>{t('upNoTourneys')}</h3>
                <p>{t('upNoTourneysDesc')} {currentRegion?.name}.</p>
              </div>
            ) : (
              regionTournaments.map(tourn => (
                <div key={tourn.id} className={`up-tournament-card up-tournament-card--${tourn.color}`}>
                  <div className={`up-tournament-card__status up-tournament-card__status--${tourn.status}`}>
                    {tourn.status === 'ongoing' && <span className="up-pulse"></span>}
                    {t(tourn.statusLabelKey)}
                  </div>
                  <div className="up-tournament-card__body">
                    <div className="up-tournament-card__icon">
                      <i className='bx bxs-zap'></i>
                    </div>
                    <div className="up-tournament-card__info">
                      <span className="up-tournament-card__code">TOR-ID {String(tourn.code || '').replace(/^TOR-?/i, '')}</span>
                      <span className="up-eyebrow">{tourn.game}</span>
                      <h4>{tourn.title}</h4>
                      <div className="up-tournament-card__meta">
                        <span><i className='bx bx-calendar-event'></i> {formatTournamentDateLabel(tourn.date, locale)}</span>
                        <span><i className='bx bx-group'></i> {tourn.format}</span>
                        <span><i className='bx bx-check-shield'></i> {t('upUnisOnly')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="up-tournament-card__right">
                    <div className="up-tournament-card__prize">
                      <small>PRIZE POOL</small>
                      <strong>{tourn.prize}</strong>
                    </div>
                    <button
                      type="button"
                      className="up-btn up-btn--icon"
                      onClick={() => navigate(`/torneos/publicos/${tourn.code}`)}
                    >
                      <i className='bx bx-chevron-right'></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="up-rankings">
            {pointsConfig ? (
              <div className="up-points-system">
                <div className="up-points-system__head">
                  <span className="up-eyebrow">{t('upRankEyebrow')}</span>
                  <h3>{t('upRankTitle')}</h3>
                </div>
                <div className="up-points-system__rules">
                  <span>{t('upBaseParticipation')} +{pointsConfig.participation}</span>
                </div>
                <div className="up-points-system__size-tiers">
                  {(pointsConfig.sizeMultipliers || []).map((tier) => (
                    <span key={tier.label}>
                      {tier.label} x{Number(tier.multiplier || 1).toFixed(2)}
                    </span>
                  ))}
                </div>
                <div className="up-points-system__formats">
                  {Object.entries(pointsConfig.formats || {}).map(([formatKey, config]) => (
                    <div key={formatKey} className="up-points-system__format-card">
                      <strong>{config.label}</strong>
                      <small>{t('upWinBonus')} +{config.matchWin}</small>
                      <small>{t('upChampBonus')} +{config.championBonus}</small>
                      <small>{t('upFinalistBonus')} +{config.finalistBonus}</small>
                      <small>{t('upSemiBonus')} +{config.semifinalBonus}</small>
                      <em>{config.placementNote}</em>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {catalogLoading ? (
              <div className="up-empty">
                <i className='bx bx-loader-alt'></i>
                <h3>{t('upLoadingRankings')}</h3>
                <p>{t('upLoadingRankingsDesc')}</p>
              </div>
            ) : (
              <>
                <div className="up-rankings__head">
                  <span className="up-rankings__col up-rankings__col--pos">#</span>
                  <span className="up-rankings__col up-rankings__col--uni">{t('upColUni')}</span>
                  <span className="up-rankings__col up-rankings__col--city">{t('upColCity')}</span>
                  <span className="up-rankings__col up-rankings__col--teams">{t('upColTeams')}</span>
                  <span className="up-rankings__col up-rankings__col--pts">{t('upColPts')}</span>
                </div>
                {regionUnis.map((uni, idx) => (
                  <div key={uni.id} className={`up-rankings__row ${idx < 3 ? `up-rankings__row--top${idx + 1}` : ''}`} onClick={() => setSelectedUni(uni)}>
                    <span className={`up-rankings__pos up-rankings__pos--${idx + 1}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <div className="up-rankings__uni">
                      <div className="up-rankings__logo">
                        <img src={uni.logo} alt={uni.tag} />
                      </div>
                      <div className="up-rankings__uni-info">
                        <div className="up-rankings__uni-name">
                          <strong>{uni.tag}</strong>
                          {uni.verified && <i className='bx bxs-badge-check up-verified'></i>}
                        </div>
                        <small>{uni.name}</small>
                        <small className="up-rankings__students">{Number(uni.verifiedStudentsCount || 0)} {t('upVerifiedStudents')}</small>
                      </div>
                    </div>
                    <span className="up-rankings__city">{uni.city}</span>
                    <span className="up-rankings__teams">{uni.teams.length}</span>
                    <div className="up-rankings__pts">
                      <span>{uni.points.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'admin' && currentUser?.isAdmin && (
          <div className="up-admin">
            <div className="up-admin__toolbar">
              <div>
                <span className="up-eyebrow">{t('upAdminEyebrow')}</span>
                <h3>{t('upAdminTitle')}</h3>
              </div>
              <div className="up-admin__filters">
                <select
                  value={adminFilters.status}
                  onChange={(e) => setAdminFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pending">{t('upAdminFilterPending')}</option>
                  <option value="approved">{t('upAdminFilterApproved')}</option>
                  <option value="rejected">{t('upAdminFilterRejected')}</option>
                  <option value="">{t('upAdminFilterAll')}</option>
                </select>
                <select
                  value={adminFilters.region}
                  onChange={(e) => setAdminFilters((prev) => ({ ...prev, region: e.target.value }))}
                >
                  {UNIVERSITY_VISIBLE_REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {adminLoading ? (
              <div className="up-empty">
                <i className='bx bx-loader-alt'></i>
                <h3>{t('upLoadingQueue')}</h3>
                <p>{t('upLoadingQueueDesc')}</p>
              </div>
            ) : adminApplications.length === 0 ? (
              <div className="up-empty">
                <i className='bx bx-check-shield'></i>
                <h3>{t('upNoApps')}</h3>
                <p>{t('upNoAppsDesc')}</p>
              </div>
            ) : (
              <div className="up-admin__grid">
                {adminApplications.map((application) => {
                  const isReviewing = reviewLoadingId === application._id;
                  const isRejected = application.status === 'rejected';
                  const isApproved = application.status === 'approved';
                  const actionPlaceholder = isApproved
                    ? t('upPlaceholderRevoke')
                    : t('upPlaceholderReject');
                  return (
                    <div key={application._id} className={`up-admin-card up-admin-card--${application.status}`}>
                      <div className="up-admin-card__top">
                        <div>
                          <span className="up-eyebrow">{application.universityTag}</span>
                          <h4>{application.universityName}</h4>
                        </div>
                        <span className={`up-admin-card__status up-admin-card__status--${application.status}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="up-admin-card__user">
                        <strong>{application.user?.fullName || t('upDefaultUser')}</strong>
                        <span>@{application.user?.username || t('upNoUsername')}</span>
                        <span>{application.user?.email || t('upNoEmail')}</span>
                      </div>

                      <div className="up-admin-card__meta">
                        <span><i className='bx bx-id-card'></i>{application.studentId}</span>
                        <span><i className='bx bx-book'></i>{application.program}</span>
                        <span><i className='bx bx-buildings'></i>{application.campus}</span>
                        <span><i className='bx bx-layer'></i>{application.academicLevel}</span>
                        <span><i className='bx bx-envelope'></i>{application.institutionalEmail}</span>
                        <span><i className='bx bx-world'></i>{application.region}</span>
                        <span><i className='bx bx-shield'></i>{application.verificationSource}</span>
                      </div>

                      {isRejected && application.rejectReason && (
                        <div className="up-admin-card__reason">
                          <strong>{t('upPrevReason')}</strong>
                          <p>{application.rejectReason}</p>
                        </div>
                      )}

                      <textarea
                        className="up-admin-card__textarea"
                        placeholder={actionPlaceholder}
                        value={rejectDrafts[application._id] || ''}
                        onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [application._id]: e.target.value }))}
                      />

                      {isApproved ? (
                        <div className="up-admin-card__actions">
                          <button
                            type="button"
                            className="up-btn up-btn--ghost up-btn--warning"
                            disabled={isReviewing}
                            onClick={() => handleReviewApplication(application, 'revoked')}
                          >
                            {isReviewing ? t('upBtnProcessing') : t('upBtnRevoke')}
                          </button>
                        </div>
                      ) : (
                        <div className="up-admin-card__actions">
                          <button
                            type="button"
                            className="up-btn up-btn--primary"
                            disabled={isReviewing}
                            onClick={() => handleReviewApplication(application, 'approved')}
                          >
                            {isReviewing ? t('upBtnProcessing') : t('upBtnApprove')}
                          </button>
                          <button
                            type="button"
                            className="up-btn up-btn--ghost up-btn--danger"
                            disabled={isReviewing}
                            onClick={() => handleReviewApplication(application, 'rejected')}
                          >
                            {isReviewing ? t('upBtnProcessing') : t('upBtnReject')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {enrollModal && renderEnrollModal()}
    </div>
  );
};

export default UniversityPage;
