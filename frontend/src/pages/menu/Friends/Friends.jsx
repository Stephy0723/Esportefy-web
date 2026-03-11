import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserFriends, FaUsers, FaUserPlus } from 'react-icons/fa';
import { API_URL } from '../../../config/api';
import { resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import PageHud from '../../../components/PageHud/PageHud';
import './Friends.css';

const TABS = [
    { id: 'friends', label: 'Amigos', icon: FaUserFriends },
    { id: 'followers', label: 'Seguidores', icon: FaUsers },
    { id: 'following', label: 'Siguiendo', icon: FaUserPlus },
    { id: 'discover', label: 'Buscar', icon: FaSearch }
];
const SOCIAL_POLL_INTERVAL_MS = Number(import.meta.env.VITE_SOCIAL_POLL_MS || 20000);

const FriendsPage = () => {
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
            setError(err?.response?.data?.message || 'No se pudo cargar el módulo de amigos.');
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
            setError(err?.response?.data?.message || 'No se pudo actualizar el seguimiento.');
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
            setError(err?.response?.data?.message || 'No se pudo actualizar la visibilidad de tu ID.');
        } finally {
            setMyUserCodeBusy(false);
        }
    };

    const activeList = useMemo(() => {
        if (activeTab === 'discover') return searchResults;
        return Array.isArray(socialData?.[activeTab]) ? socialData[activeTab] : [];
    }, [activeTab, searchResults, socialData]);

    const emptyText = activeTab === 'discover'
        ? 'Escribe al menos 2 caracteres para buscar por nombre, username o número.'
        : (activeTab === 'followers'
            ? 'Aún no tienes seguidores.'
            : (activeTab === 'following'
                ? 'Aún no sigues a nadie.'
                : 'Aún no tienes amigos mutuos.'));

    const counts = socialData?.counts || { friends: 0, followers: 0, following: 0 };

    return (
        <div className="friends-page">
            <PageHud page="AMIGOS" />

            <section className="friends-card">
                <div className="friends-card__header">
                    <h2><FaUserFriends /> Centro Social</h2>
                    <p>Gestiona tus amigos, seguidores y nuevas conexiones.</p>
                    <div className="friends-card__actions">
                        <button
                            type="button"
                            className={`friends-id-toggle ${myUserCodeVisible ? 'is-visible' : 'is-hidden'}`}
                            onClick={handleToggleMyUserCode}
                            disabled={myUserCodeBusy}
                        >
                            {myUserCodeBusy
                                ? 'Guardando...'
                                : (myUserCodeVisible ? 'Ocultar mi ID' : 'Mostrar mi ID')}
                        </button>
                    </div>
                </div>

                <div className="friends-tabs">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const tabCount = tab.id === 'discover' ? null : Number(counts?.[tab.id] || 0);
                        return (
                            <button
                                key={tab.id}
                                className={`friends-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setError('');
                                }}
                            >
                                <span><Icon /> {tab.label}</span>
                                {tabCount !== null && <small>{tabCount}</small>}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'discover' && (
                    <div className="friends-search">
                        <FaSearch />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar por username, nombre o #ID número..."
                        />
                    </div>
                )}

                {error && <div className="friends-error">{error}</div>}

                <div className="friends-list">
                    {(loading || searchLoading) ? (
                        <div className="friends-empty">Cargando...</div>
                    ) : activeList.length > 0 ? (
                        activeList.map((entry) => {
                            const id = String(entry?.id || '');
                            const statusClass = `friends-item__status friends-item__status--${String(entry?.status || 'offline').toLowerCase()}`;
                            return (
                                <div key={id} className="friends-item">
                                    <div className="friends-item__left">
                                        <div className="friends-item__avatar">
                                            <img
                                                src={resolveMediaUrl(entry?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry?.name || 'U')}&background=1a1a2e&color=8EDB15`}
                                                alt={entry?.name || 'Usuario'}
                                            />
                                            <span className={statusClass} />
                                        </div>
                                        <div className="friends-item__info">
                                            <strong>{entry?.name || 'Jugador'}</strong>
                                            <span>@{entry?.username || 'usuario'}</span>
                                            {entry?.userCode && (
                                                <span className="friends-item__code">#{entry.userCode}</span>
                                            )}
                                            <small>{entry?.rank || 'Jugador'} · {entry?.status || 'offline'}</small>
                                        </div>
                                    </div>

                                    <button
                                        className={`friends-item__follow ${entry?.isFollowing ? 'is-following' : ''}`}
                                        onClick={() => handleToggleFollow(id)}
                                        disabled={Boolean(followBusyIds[id])}
                                    >
                                        {followBusyIds[id] ? '...' : (entry?.isFollowing ? 'Siguiendo' : 'Seguir')}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="friends-empty">{emptyText}</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FriendsPage;
