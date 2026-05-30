import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserFriends, FaUsers, FaUserPlus } from 'react-icons/fa';
import { API_URL } from '../../../config/api';
import { resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import { useLang } from '../../../context/LanguageContext';
import PageHud from '../../../components/PageHud/PageHud';
import UserCard from '../../../components/UserCard/UserCard';
import './Friends.css';

const TABS_CONFIG = [
    { id: 'friends', labelKey: 'friends', icon: FaUserFriends },
    { id: 'followers', labelKey: 'followers', icon: FaUsers },
    { id: 'following', labelKey: 'following', icon: FaUserPlus },
    { id: 'discover', labelKey: 'search', icon: FaSearch }
];
const SOCIAL_POLL_INTERVAL_MS = Number(import.meta.env.VITE_SOCIAL_POLL_MS || 20000);

const FriendsPage = () => {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState('friends');
    const [socialData, setSocialData] = useState({
        friends: [],
        followers: [],
        following: [],
        counts: { friends: 0, followers: 0, following: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [followBusyIds, setFollowBusyIds] = useState({});
    const [myUserCodeVisible, setMyUserCodeVisible] = useState(true);
    const [myUserCodeBusy, setMyUserCodeBusy] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const loadSocialData = useCallback(async ({ silent = false } = {}) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            setError('');
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/auth/social`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = response?.data || {};
            setSocialData({
                friends: Array.isArray(payload?.friends) ? payload.friends : [],
                followers: Array.isArray(payload?.followers) ? payload.followers : [],
                following: Array.isArray(payload?.following) ? payload.following : [],
                counts: payload?.counts || { friends: 0, followers: 0, following: 0 }
            });
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err?.response?.data?.message || t('friendsLoadError'));
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [navigate]);

    const loadUserCodeVisibility = useCallback(async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyUserCodeVisible(response?.data?.privacy?.showPublicUserCode !== false);
        } catch {
            // fallback silencioso para no bloquear el módulo social
        }
    }, [navigate]);

    useEffect(() => {
        loadSocialData();
        loadUserCodeVisibility();
    }, [loadSocialData, loadUserCodeVisibility]);

    useEffect(() => {
        const requestedDiscover = Boolean(location.state?.openDiscover);
        const requestedQuery = String(location.state?.query || '').trim();
        if (!requestedDiscover && !requestedQuery) return;

        if (requestedDiscover) {
            setActiveTab('discover');
        }
        if (requestedQuery) {
            setQuery(requestedQuery);
        }

        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        let canceled = false;

        const refreshSocial = async () => {
            if (canceled) return;
            if (document.visibilityState !== 'visible') return;
            if (!getAuthToken()) return;
            await loadSocialData({ silent: true });
        };

        const onFocus = () => {
            refreshSocial();
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshSocial();
            }
        };

        const intervalId = window.setInterval(refreshSocial, SOCIAL_POLL_INTERVAL_MS);
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            canceled = true;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [loadSocialData]);

    useEffect(() => {
        if (activeTab !== 'discover') return undefined;
        const q = String(query || '').trim();
        if (q.length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setSearchLoading(true);
                const token = getAuthToken();
                if (!token) return;
                const response = await axios.get(`${API_URL}/api/auth/users/search`, {
                    params: { q, limit: 24 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(Array.isArray(response?.data?.users) ? response.data.users : []);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 280);

        return () => clearTimeout(timeoutId);
    }, [activeTab, query]);

    const handleToggleFollow = async (targetId) => {
        const id = String(targetId || '').trim();
        if (!id || followBusyIds[id]) return;

        setFollowBusyIds((prev) => ({ ...prev, [id]: true }));
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            await axios.post(`${API_URL}/api/auth/follow/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await loadSocialData();

            if (activeTab === 'discover' && String(query || '').trim().length >= 2) {
                const response = await axios.get(`${API_URL}/api/auth/users/search`, {
                    params: { q: String(query || '').trim(), limit: 24 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(Array.isArray(response?.data?.users) ? response.data.users : []);
            }
        } catch (err) {
            setError(err?.response?.data?.message || t('friendsFollowError'));
        } finally {
            setFollowBusyIds((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleToggleMyUserCode = async () => {
        if (myUserCodeBusy) return;
        setMyUserCodeBusy(true);
        setError('');

        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const nextValue = !myUserCodeVisible;
            const data = new FormData();
            data.append('showPublicUserCode', String(nextValue));

            const response = await axios.put(`${API_URL}/api/auth/update-profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMyUserCodeVisible(response?.data?.privacy?.showPublicUserCode !== false);
        } catch (err) {
            setError(err?.response?.data?.message || t('friendsIdVisibilityError'));
        } finally {
            setMyUserCodeBusy(false);
        }
    };

    const activeList = useMemo(() => {
        if (activeTab === 'discover') return searchResults;
        return Array.isArray(socialData?.[activeTab]) ? socialData[activeTab] : [];
    }, [activeTab, searchResults, socialData]);

    const counts = socialData?.counts || { friends: 0, followers: 0, following: 0 };

    const emptyIcon = activeTab === 'discover' ? 'bx-search-alt' : (activeTab === 'followers' ? 'bx-user-voice' : (activeTab === 'following' ? 'bx-user-plus' : 'bx-group'));
    const emptyText = activeTab === 'discover'
        ? t('friendsDiscoverHint')
        : (activeTab === 'followers'
            ? t('friendsFollowersEmpty')
            : (activeTab === 'following'
                ? t('friendsFollowingEmpty')
                : t('friendsEmpty')));

    return (
        <div className="fr">
            <PageHud page={t('friends')} />

            {/* Header */}
            <div className="fr__header">
                <div>
                    <h2 className="fr__title">
                        <span className="fr__title-icon"><i className="bx bx-group"></i></span>
                        {t('friendsPageTitle')}
                    </h2>
                    <p className="fr__subtitle">{t('friendsPageDesc')}</p>
                </div>
                <button
                    type="button"
                    className={`fr__id-toggle ${myUserCodeVisible ? 'is-visible' : ''}`}
                    onClick={handleToggleMyUserCode}
                    disabled={myUserCodeBusy}
                >
                    <i className={`bx ${myUserCodeVisible ? 'bx-show' : 'bx-hide'}`}></i>
                    {myUserCodeBusy ? t('saving') : (myUserCodeVisible ? t('idVisible') : t('idHidden'))}
                </button>
            </div>

            {/* Stats */}
            <div className="fr__stats">
                <div className="fr__stat">
                    <div className="fr__stat-icon"><i className="bx bx-group"></i></div>
                    <div>
                        <div className="fr__stat-value">{counts.friends}</div>
                        <div className="fr__stat-label">{t('friends')}</div>
                    </div>
                </div>
                <div className="fr__stat">
                    <div className="fr__stat-icon fr__stat-icon--followers"><i className="bx bx-user-voice"></i></div>
                    <div>
                        <div className="fr__stat-value">{counts.followers}</div>
                        <div className="fr__stat-label">{t('followers')}</div>
                    </div>
                </div>
                <div className="fr__stat">
                    <div className="fr__stat-icon fr__stat-icon--following"><i className="bx bx-user-plus"></i></div>
                    <div>
                        <div className="fr__stat-value">{counts.following}</div>
                        <div className="fr__stat-label">{t('following')}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="fr__tabs">
                {TABS_CONFIG.map((tab) => {
                    const Icon = tab.icon;
                    const tabCount = tab.id === 'discover' ? null : Number(counts?.[tab.id] || 0);
                    return (
                        <button
                            key={tab.id}
                            className={`fr__tab ${activeTab === tab.id ? 'is-active' : ''}`}
                            onClick={() => { setActiveTab(tab.id); setError(''); }}
                        >
                            <Icon />
                            {tab.labelKey ? t(tab.labelKey) : tab.label}
                            {tabCount !== null && <span className="fr__tab-count">{tabCount}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            {activeTab === 'discover' && (
                <div className="fr__search">
                    <FaSearch className="fr__search-icon" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('friendsSearchPlaceholder')}
                    />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="fr__error">
                    <i className="bx bx-error-circle"></i>
                    {error}
                </div>
            )}

            {/* List */}
            {(loading || searchLoading) ? (
                <div className="fr__skeleton">
                    <div className="fr__skeleton-item" />
                    <div className="fr__skeleton-item" />
                    <div className="fr__skeleton-item" />
                    <div className="fr__skeleton-item" />
                </div>
            ) : activeList.length > 0 ? (
                <div className="fr__list">
                    {activeList.map((entry) => {
                        const id = String(entry?.id || '');
                        const status = String(entry?.status || 'offline').toLowerCase();
                        return (
                            <div key={id} className="fr__user">
                                <UserCard userId={id}>
                                    <div className="fr__user-left">
                                        <div className="fr__avatar">
                                            <img
                                                src={resolveMediaUrl(entry?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry?.name || 'U')}&background=1a1a2e&color=8EDB15`}
                                                alt={entry?.name || 'Usuario'}
                                            />
                                            <span className={`fr__avatar-status fr__avatar-status--${status}`} />
                                        </div>
                                        <div className="fr__info">
                                            <div className="fr__name">
                                                <span>{entry?.name || 'Jugador'}</span>
                                                {entry?.userCode && <span className="fr__code">#{entry.userCode}</span>}
                                            </div>
                                            <span className="fr__username">@{entry?.username || 'usuario'}</span>
                                            <div className="fr__meta">
                                                <span>{entry?.rank || 'Jugador'}</span>
                                                <span className="fr__meta-dot" />
                                                <span className="fr__meta-status">{status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </UserCard>

                                <button
                                    className={`fr__follow-btn ${entry?.isFollowing ? 'is-following' : ''}`}
                                    onClick={() => handleToggleFollow(id)}
                                    disabled={Boolean(followBusyIds[id])}
                                >
                                    {followBusyIds[id]
                                        ? <><i className="bx bx-loader-alt bx-spin"></i></>
                                        : entry?.isFollowing
                                            ? <><i className="bx bx-check"></i> {t('friendsBtnFollowing')}</>
                                            : <><i className="bx bx-user-plus"></i> {t('friendsBtnFollow')}</>
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="fr__empty">
                    <div className="fr__empty-icon"><i className={`bx ${emptyIcon}`}></i></div>
                    <p className="fr__empty-text">{emptyText}</p>
                </div>
            )}
        </div>
    );
};

export default FriendsPage;
