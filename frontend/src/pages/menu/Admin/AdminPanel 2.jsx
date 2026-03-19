import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import { resolveMediaUrl } from '../../../utils/media';
import PageHud from '../../../components/PageHud/PageHud';
import './AdminPanel.css';

const ROLE_LABELS = {
    player: 'Jugador', organizer: 'Organizador', 'content-creator': 'Creador de Contenido',
    coach: 'Coach', caster: 'Caster', sponsor: 'Sponsor', analyst: 'Analista'
};
const ROLE_COLORS = {
    organizer: '#f59e0b', 'content-creator': '#c026d3', coach: '#d97706',
    caster: '#ef4444', sponsor: '#10b981', analyst: '#6366f1'
};
const TICKET_TYPES = {
    bug: { label: 'Bug', icon: 'bx-bug', color: '#ef4444' },
    suggestion: { label: 'Sugerencia', icon: 'bx-bulb', color: '#f59e0b' },
    question: { label: 'Consulta', icon: 'bx-help-circle', color: '#3b82f6' },
    achievement: { label: 'Logro', icon: 'bx-trophy', color: '#10b981' }
};
const TICKET_STATUS = {
    open: { label: 'Abierto', color: '#f59e0b' },
    'in-progress': { label: 'En Proceso', color: '#3b82f6' },
    resolved: { label: 'Resuelto', color: '#10b981' },
    closed: { label: 'Cerrado', color: '#6b7280' }
};
const AUDIT_LABELS = {
    'role-approve': 'Rol aprobado',
    'role-reject': 'Rol rechazado',
    'user-ban': 'Usuario baneado',
    'user-unban': 'Usuario desbaneado',
    'ticket-respond': 'Ticket respondido',
    'ticket-status-change': 'Estado de ticket cambiado',
    'broadcast-notification': 'Notificacion global enviada',
    'send-notification': 'Notificacion individual enviada'
};

const GAME_LIST = [
    'lol', 'mlbb', 'valorant', 'fortnite', 'freefire', 'codm', 'apex', 'dota2',
    'hok', 'overwatch', 'pubg', 'rocket', 'fifa', 'tekken', 'sf6', 'clashroyale',
    'wildrift', 'siege', 'smite', 'tft', 'mk11', 'mariokart', 'genshin', 'minecraft'
];

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Data
    const [applications, setApplications] = useState([]);
    const [users, setUsers] = useState([]);
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);
    const [tickets, setTickets] = useState([]);
    const [ticketTotal, setTicketTotal] = useState(0);
    const [ticketPage, setTicketPage] = useState(1);
    const [auditLogs, setAuditLogs] = useState([]);
    const [allUsersForStats, setAllUsersForStats] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('pending');
    const [roleFilter, setRoleFilter] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [gameFilter, setGameFilter] = useState('');
    const [ticketStatusFilter, setTicketStatusFilter] = useState('open');
    const [ticketTypeFilter, setTicketTypeFilter] = useState('');

    // UI
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [ticketResponse, setTicketResponse] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const getToken = () => getAuthToken();

    // ── Check admin ──
    useEffect(() => {
        const check = async () => {
            try {
                const token = getToken();
                if (!token) { navigate('/login'); return; }
                const res = await axios.get(`${API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.data?.isAdmin) { navigate('/dashboard'); return; }
                setIsAdmin(true);
            } catch { navigate('/login'); }
        };
        check();
    }, [navigate]);

    // ── Fetchers ──
    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const params = { status: statusFilter };
            if (roleFilter) params.role = roleFilter;
            const res = await axios.get(`${API_URL}/api/auth/admin/role-applications`, {
                headers: { Authorization: `Bearer ${token}` }, params
            });
            setApplications(res.data?.items || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [statusFilter, roleFilter]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const params = { search: userSearch, page: userPage, limit: 20 };
            if (gameFilter) params.game = gameFilter;
            const res = await axios.get(`${API_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }, params
            });
            setUsers(res.data?.items || []);
            setUserTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [userSearch, userPage, gameFilter]);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const params = { page: ticketPage, limit: 20 };
            if (ticketStatusFilter) params.status = ticketStatusFilter;
            if (ticketTypeFilter) params.type = ticketTypeFilter;
            const res = await axios.get(`${API_URL}/api/auth/admin/support-tickets`, {
                headers: { Authorization: `Bearer ${token}` }, params
            });
            setTickets(res.data?.items || []);
            setTicketTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [ticketStatusFilter, ticketTypeFilter, ticketPage]);

    const fetchAudit = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const res = await axios.get(`${API_URL}/api/settings/admin/audit`, {
                headers: { Authorization: `Bearer ${token}` }, params: { limit: 50 }
            });
            setAuditLogs(res.data?.items || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const [usersRes, appsRes, ticketsRes] = await Promise.all([
                axios.get(`${API_URL}/api/auth/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }, params: { limit: 100 }
                }),
                axios.get(`${API_URL}/api/auth/admin/role-applications`, {
                    headers: { Authorization: `Bearer ${token}` }, params: { status: 'pending' }
                }),
                axios.get(`${API_URL}/api/auth/admin/support-tickets`, {
                    headers: { Authorization: `Bearer ${token}` }, params: { status: 'open', limit: 100 }
                })
            ]);
            setAllUsersForStats(usersRes.data?.items || []);
            setApplications(appsRes.data?.items || []);
            setTickets(ticketsRes.data?.items || []);
            setTicketTotal(ticketsRes.data?.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        if (activeTab === 'overview') fetchStats();
        else if (activeTab === 'applications') fetchApplications();
        else if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'support') fetchTickets();
        else if (activeTab === 'audit') fetchAudit();
    }, [isAdmin, activeTab, fetchStats, fetchApplications, fetchUsers, fetchTickets, fetchAudit]);

    // ── Actions ──
    const handleReview = async (userId, role, action) => {
        setActionLoading(`${userId}-${role}-${action}`);
        try {
            const token = getToken();
            await axios.patch(`${API_URL}/api/auth/admin/role-applications/${userId}`, {
                role, action, reason: action === 'reject' ? rejectReason : ''
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedApp(null); setRejectReason('');
            if (activeTab === 'applications') fetchApplications();
            else fetchStats();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleBan = async (userId, action, reason = '') => {
        setActionLoading(`${userId}-${action}`);
        try {
            const token = getToken();
            await axios.patch(`${API_URL}/api/auth/admin/users/${userId}/ban`, {
                action, reason
            }, { headers: { Authorization: `Bearer ${token}` } });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleTicketRespond = async () => {
        if (!selectedTicket) return;
        setActionLoading(`ticket-${selectedTicket._id}`);
        try {
            const token = getToken();
            await axios.patch(`${API_URL}/api/auth/admin/support-tickets/${selectedTicket._id}`, {
                response: ticketResponse,
                status: ticketResponse.trim() ? 'resolved' : selectedTicket.status
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedTicket(null); setTicketResponse('');
            fetchTickets();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    const handleTicketStatus = async (ticketId, newStatus) => {
        setActionLoading(`ticket-status-${ticketId}`);
        try {
            const token = getToken();
            await axios.patch(`${API_URL}/api/auth/admin/support-tickets/${ticketId}`, {
                status: newStatus
            }, { headers: { Authorization: `Bearer ${token}` } });
            fetchTickets();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    // ── Export CSV ──
    const exportCSV = (dataType) => {
        let csv = '';
        if (dataType === 'users') {
            const data = users.length ? users : allUsersForStats;
            if (!data.length) return alert('No hay datos.');
            csv = 'Usuario,Email,Nombre,Roles,Juegos,Baneado,Fecha Registro\n';
            data.forEach(u => {
                csv += `"${u.username}","${u.email}","${u.fullName || ''}","${(u.roles || []).map(r => ROLE_LABELS[r] || r).join(', ')}","${(u.selectedGames || []).join(', ')}","${u.isBanned ? 'Si' : 'No'}","${formatDate(u.createdAt)}"\n`;
            });
        } else if (dataType === 'applications') {
            if (!applications.length) return alert('No hay datos.');
            csv = 'Usuario,Email,Nombre,Rol,Estado,Fecha\n';
            applications.forEach(a => {
                csv += `"${a.username}","${a.email}","${a.fullName || ''}","${ROLE_LABELS[a.role] || a.role}","${a.status}","${formatDate(a.appliedAt)}"\n`;
            });
        } else if (dataType === 'tickets') {
            if (!tickets.length) return alert('No hay datos.');
            csv = 'Usuario,Email,Tipo,Estado,Asunto,Mensaje,Respuesta,Fecha\n';
            tickets.forEach(t => {
                csv += `"${t.username}","${t.email}","${TICKET_TYPES[t.type]?.label || t.type}","${TICKET_STATUS[t.status]?.label || t.status}","${t.subject || ''}","${(t.message || '').replace(/"/g, '""')}","${(t.adminResponse || '').replace(/"/g, '""')}","${formatDate(t.createdAt)}"\n`;
            });
        }
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glitchgang-${dataType}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Stats ──
    const totalUsers = allUsersForStats.length;
    const bannedUsers = allUsersForStats.filter(u => u.isBanned).length;
    const pendingApps = applications.length;
    const openTickets = activeTab === 'overview' ? tickets.length : ticketTotal;
    const roleDistribution = {};
    allUsersForStats.forEach(u => {
        (u.roles || ['player']).forEach(r => { roleDistribution[r] = (roleDistribution[r] || 0) + 1; });
    });

    if (!isAdmin) return null;

    return (
        <div className="adm">
            <PageHud page="ADMIN" />

            <div className="adm__header">
                <div className="adm__header-top">
                    <h1><i className='bx bx-shield-quarter' /> Panel de Administracion</h1>
                </div>
                <p>Centro de operaciones — todo lo que ocurre en la plataforma llega aqui</p>
            </div>

            {/* ═══ TABS ═══ */}
            <div className="adm__tabs">
                {[
                    { id: 'overview', icon: 'bx-bar-chart-alt-2', label: 'Resumen' },
                    { id: 'support', icon: 'bx-support', label: 'Soporte', badge: openTickets },
                    { id: 'applications', icon: 'bx-file', label: 'Solicitudes', badge: pendingApps },
                    { id: 'users', icon: 'bx-group', label: 'Usuarios' },
                    { id: 'audit', icon: 'bx-history', label: 'Auditoria' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`adm__tab ${activeTab === tab.id ? 'adm__tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <i className={`bx ${tab.icon}`} /> {tab.label}
                        {tab.badge > 0 && activeTab !== tab.id && (
                            <span className="adm__tab-badge">{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="adm__content">

                {/* ═══ TAB: RESUMEN ═══ */}
                {activeTab === 'overview' && (
                    <>
                        <div className="adm__stats-grid">
                            <StatCard icon="bx-group" value={totalUsers} label="Usuarios totales" bg="rgba(59,130,246,0.12)" color="#3b82f6" />
                            <StatCard icon="bx-support" value={openTickets} label="Tickets abiertos" bg="rgba(168,85,247,0.12)" color="#a855f7" />
                            <StatCard icon="bx-time-five" value={pendingApps} label="Solicitudes pendientes" bg="rgba(245,158,11,0.12)" color="#f59e0b" />
                            <StatCard icon="bx-block" value={bannedUsers} label="Usuarios baneados" bg="rgba(239,68,68,0.12)" color="#ef4444" />
                        </div>

                        {/* Tickets abiertos - preview */}
                        {tickets.length > 0 && (
                            <div className="adm__section">
                                <div className="adm__section-header">
                                    <h2><i className='bx bx-support' /> Tickets Abiertos</h2>
                                    <button className="adm__link-btn" onClick={() => setActiveTab('support')}>
                                        Ver todos ({ticketTotal}) <i className='bx bx-chevron-right' />
                                    </button>
                                </div>
                                <div className="adm__list">
                                    {tickets.slice(0, 4).map(t => (
                                        <div className="adm__card" key={t._id} onClick={() => { setSelectedTicket(t); setTicketResponse(''); }}>
                                            <div className="adm__card-type-icon" style={{ background: `${TICKET_TYPES[t.type]?.color}18`, color: TICKET_TYPES[t.type]?.color }}>
                                                <i className={`bx ${TICKET_TYPES[t.type]?.icon}`} />
                                            </div>
                                            <div className="adm__card-info">
                                                <div className="adm__card-name">
                                                    {t.subject || TICKET_TYPES[t.type]?.label}
                                                    <span className="adm__badge" style={{ background: `${TICKET_TYPES[t.type]?.color}18`, color: TICKET_TYPES[t.type]?.color }}>
                                                        {TICKET_TYPES[t.type]?.label}
                                                    </span>
                                                </div>
                                                <div className="adm__card-email">{t.username} — {formatDate(t.createdAt)}</div>
                                                <div className="adm__card-preview">{t.message.substring(0, 120)}{t.message.length > 120 ? '...' : ''}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Solicitudes pendientes - preview */}
                        {pendingApps > 0 && (
                            <div className="adm__section">
                                <div className="adm__section-header">
                                    <h2><i className='bx bx-file' /> Solicitudes Pendientes</h2>
                                    <button className="adm__link-btn" onClick={() => setActiveTab('applications')}>
                                        Ver todas ({pendingApps}) <i className='bx bx-chevron-right' />
                                    </button>
                                </div>
                                <div className="adm__list">
                                    {applications.slice(0, 3).map((app, i) => (
                                        <div className="adm__card" key={`${app.userId}-${app.role}-${i}`}>
                                            <img className="adm__card-avatar" src={resolveMediaUrl(app.avatar) || `https://ui-avatars.com/api/?name=${app.username}`} alt="" />
                                            <div className="adm__card-info">
                                                <div className="adm__card-name">
                                                    {app.username}
                                                    <span className="adm__badge adm__badge--role" style={{ background: `${ROLE_COLORS[app.role]}18`, color: ROLE_COLORS[app.role] }}>
                                                        {ROLE_LABELS[app.role]}
                                                    </span>
                                                </div>
                                                <div className="adm__card-email">{app.email} — {formatDate(app.appliedAt)}</div>
                                            </div>
                                            <div className="adm__card-actions">
                                                <button className="adm__btn adm__btn--approve" onClick={() => handleReview(app.userId, app.role, 'approve')}>
                                                    <i className='bx bx-check' />
                                                </button>
                                                <button className="adm__btn adm__btn--detail" onClick={() => setSelectedApp(app)}>
                                                    <i className='bx bx-show' />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Role distribution */}
                        <div className="adm__section">
                            <h2><i className='bx bx-pie-chart-alt-2' /> Distribucion de Roles</h2>
                            <div className="adm__role-bars">
                                {Object.entries(roleDistribution).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                                    <div className="adm__role-bar" key={role}>
                                        <div className="adm__role-bar-label">
                                            <span style={{ color: ROLE_COLORS[role] || 'var(--primary)' }}>
                                                {ROLE_LABELS[role] || role}
                                            </span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="adm__role-bar-track">
                                            <div className="adm__role-bar-fill" style={{
                                                width: `${Math.min(100, (count / totalUsers) * 100)}%`,
                                                background: ROLE_COLORS[role] || 'var(--primary)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Export */}
                        <div className="adm__section">
                            <h2><i className='bx bx-download' /> Exportar Datos</h2>
                            <div className="adm__export-row">
                                <button className="adm__btn adm__btn--export" onClick={() => exportCSV('users')}>
                                    <i className='bx bx-spreadsheet' /> Usuarios (CSV)
                                </button>
                                <button className="adm__btn adm__btn--export" onClick={() => exportCSV('applications')}>
                                    <i className='bx bx-file' /> Solicitudes (CSV)
                                </button>
                                <button className="adm__btn adm__btn--export" onClick={() => exportCSV('tickets')}>
                                    <i className='bx bx-support' /> Tickets (CSV)
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ TAB: SOPORTE ═══ */}
                {activeTab === 'support' && (
                    <>
                        <div className="adm__toolbar">
                            <select className="adm__filter-select" value={ticketStatusFilter} onChange={e => { setTicketStatusFilter(e.target.value); setTicketPage(1); }}>
                                <option value="">Todos los estados</option>
                                <option value="open">Abiertos</option>
                                <option value="in-progress">En Proceso</option>
                                <option value="resolved">Resueltos</option>
                                <option value="closed">Cerrados</option>
                            </select>
                            <select className="adm__filter-select" value={ticketTypeFilter} onChange={e => { setTicketTypeFilter(e.target.value); setTicketPage(1); }}>
                                <option value="">Todos los tipos</option>
                                <option value="bug">Bugs</option>
                                <option value="suggestion">Sugerencias</option>
                                <option value="question">Consultas</option>
                                <option value="achievement">Logros</option>
                            </select>
                            <button className="adm__btn adm__btn--export" onClick={() => exportCSV('tickets')}>
                                <i className='bx bx-download' /> CSV
                            </button>
                        </div>
                        {loading ? <Loading /> : tickets.length === 0 ? (
                            <Empty icon="bx-check-circle" text="No hay tickets con estos filtros." />
                        ) : (
                            <>
                                <div className="adm__list">
                                    {tickets.map(t => {
                                        const tType = TICKET_TYPES[t.type] || {};
                                        const tStatus = TICKET_STATUS[t.status] || {};
                                        return (
                                            <div className="adm__card adm__card--clickable" key={t._id} onClick={() => { setSelectedTicket(t); setTicketResponse(''); }}>
                                                <div className="adm__card-type-icon" style={{ background: `${tType.color}18`, color: tType.color }}>
                                                    <i className={`bx ${tType.icon}`} />
                                                </div>
                                                <div className="adm__card-info">
                                                    <div className="adm__card-name">
                                                        {t.subject || tType.label}
                                                        <span className="adm__badge" style={{ background: `${tType.color}18`, color: tType.color }}>
                                                            {tType.label}
                                                        </span>
                                                        <span className="adm__badge" style={{ background: `${tStatus.color}18`, color: tStatus.color }}>
                                                            {tStatus.label}
                                                        </span>
                                                    </div>
                                                    <div className="adm__card-email">
                                                        <strong>{t.username}</strong> ({t.email}) — {formatDate(t.createdAt)}
                                                    </div>
                                                    <div className="adm__card-preview">{t.message.substring(0, 150)}{t.message.length > 150 ? '...' : ''}</div>
                                                    {t.adminResponse && (
                                                        <div className="adm__card-response">
                                                            <i className='bx bx-check-circle' /> Respondido: {t.adminResponse.substring(0, 80)}{t.adminResponse.length > 80 ? '...' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="adm__card-actions" onClick={e => e.stopPropagation()}>
                                                    {t.status === 'open' && (
                                                        <button className="adm__btn adm__btn--detail" disabled={!!actionLoading} onClick={() => handleTicketStatus(t._id, 'in-progress')}>
                                                            <i className='bx bx-loader' /> En Proceso
                                                        </button>
                                                    )}
                                                    {t.status !== 'closed' && (
                                                        <button className="adm__btn adm__btn--approve" disabled={!!actionLoading} onClick={() => handleTicketStatus(t._id, 'closed')}>
                                                            <i className='bx bx-check' /> Cerrar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {ticketTotal > 20 && (
                                    <div className="adm__pagination">
                                        <button className="adm__btn adm__btn--detail" disabled={ticketPage <= 1} onClick={() => setTicketPage(p => p - 1)}>Anterior</button>
                                        <span>Pagina {ticketPage} de {Math.ceil(ticketTotal / 20)}</span>
                                        <button className="adm__btn adm__btn--detail" disabled={ticketPage >= Math.ceil(ticketTotal / 20)} onClick={() => setTicketPage(p => p + 1)}>Siguiente</button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══ TAB: SOLICITUDES ═══ */}
                {activeTab === 'applications' && (
                    <>
                        <div className="adm__toolbar">
                            <select className="adm__filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="pending">Pendientes</option>
                                <option value="approved">Aprobadas</option>
                                <option value="rejected">Rechazadas</option>
                            </select>
                            <select className="adm__filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                                <option value="">Todos los roles</option>
                                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'player').map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                            <button className="adm__btn adm__btn--export" onClick={() => exportCSV('applications')}>
                                <i className='bx bx-download' /> CSV
                            </button>
                        </div>
                        {loading ? <Loading /> : applications.length === 0 ? (
                            <Empty icon="bx-check-circle" text={`No hay solicitudes ${statusFilter}.`} />
                        ) : (
                            <div className="adm__list">
                                {applications.map((app, i) => (
                                    <div className="adm__card" key={`${app.userId}-${app.role}-${i}`}>
                                        <img className="adm__card-avatar" src={resolveMediaUrl(app.avatar) || `https://ui-avatars.com/api/?name=${app.username}`} alt="" />
                                        <div className="adm__card-info">
                                            <div className="adm__card-name">
                                                {app.username}
                                                <span className="adm__badge adm__badge--role" style={{ background: `${ROLE_COLORS[app.role]}18`, color: ROLE_COLORS[app.role] }}>
                                                    {ROLE_LABELS[app.role] || app.role}
                                                </span>
                                            </div>
                                            <div className="adm__card-email">{app.email} — {app.fullName}</div>
                                            <div className="adm__card-meta">
                                                <span className={`adm__badge adm__badge--${app.status}`}>{formatDate(app.appliedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="adm__card-actions">
                                            <button className="adm__btn adm__btn--detail" onClick={() => setSelectedApp(app)}>
                                                <i className='bx bx-show' /> Ver
                                            </button>
                                            {statusFilter === 'pending' && (
                                                <>
                                                    <button className="adm__btn adm__btn--approve" disabled={!!actionLoading} onClick={() => handleReview(app.userId, app.role, 'approve')}>
                                                        <i className='bx bx-check' /> Aprobar
                                                    </button>
                                                    <button className="adm__btn adm__btn--reject" onClick={() => { setSelectedApp(app); setRejectReason(''); }}>
                                                        <i className='bx bx-x' /> Rechazar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══ TAB: USUARIOS ═══ */}
                {activeTab === 'users' && (
                    <>
                        <div className="adm__toolbar">
                            <div className="adm__search-wrap">
                                <i className='bx bx-search' />
                                <input placeholder="Buscar username, email, nombre..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
                            </div>
                            <select className="adm__filter-select" value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
                                <option value="">Todos los juegos</option>
                                {GAME_LIST.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                            </select>
                            <button className="adm__btn adm__btn--export" onClick={() => exportCSV('users')}>
                                <i className='bx bx-download' /> CSV
                            </button>
                        </div>
                        {loading ? <Loading /> : users.length === 0 ? (
                            <Empty icon="bx-user-x" text="No se encontraron usuarios." />
                        ) : (
                            <>
                                <div className="adm__list">
                                    {users.map(user => (
                                        <div className="adm__card" key={user._id}>
                                            <img className="adm__card-avatar" src={resolveMediaUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}`} alt="" />
                                            <div className="adm__card-info">
                                                <div className="adm__card-name">
                                                    {user.username}
                                                    {user.isAdmin && <span className="adm__badge adm__badge--admin">Admin</span>}
                                                    {user.isBanned && <span className="adm__badge adm__badge--banned">Baneado</span>}
                                                </div>
                                                <div className="adm__card-email">{user.email} — {user.fullName || '-'}</div>
                                                <div className="adm__card-meta">
                                                    {(user.roles || []).map(r => (
                                                        <span key={r} className="adm__badge adm__badge--role" style={{ background: `${ROLE_COLORS[r] || 'var(--primary)'}18`, color: ROLE_COLORS[r] || 'var(--primary)' }}>
                                                            {ROLE_LABELS[r] || r}
                                                        </span>
                                                    ))}
                                                    {(user.selectedGames || []).slice(0, 3).map(g => (
                                                        <span key={g} className="adm__badge adm__badge--game">{g}</span>
                                                    ))}
                                                    {(user.selectedGames || []).length > 3 && (
                                                        <span className="adm__badge adm__badge--game">+{user.selectedGames.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="adm__card-actions">
                                                {!user.isAdmin && (
                                                    user.isBanned ? (
                                                        <button className="adm__btn adm__btn--unban" disabled={!!actionLoading} onClick={() => handleBan(user._id, 'unban')}>
                                                            <i className='bx bx-lock-open' /> Desbanear
                                                        </button>
                                                    ) : (
                                                        <button className="adm__btn adm__btn--ban" disabled={!!actionLoading} onClick={() => {
                                                            const r = prompt('Razon del baneo:');
                                                            if (r !== null) handleBan(user._id, 'ban', r);
                                                        }}>
                                                            <i className='bx bx-block' /> Banear
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {userTotal > 20 && (
                                    <div className="adm__pagination">
                                        <button className="adm__btn adm__btn--detail" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>Anterior</button>
                                        <span>Pagina {userPage} de {Math.ceil(userTotal / 20)}</span>
                                        <button className="adm__btn adm__btn--detail" disabled={userPage >= Math.ceil(userTotal / 20)} onClick={() => setUserPage(p => p + 1)}>Siguiente</button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══ TAB: AUDITORIA ═══ */}
                {activeTab === 'audit' && (
                    <>
                        {loading ? <Loading /> : auditLogs.length === 0 ? (
                            <Empty icon="bx-history" text="No hay registros de auditoria." />
                        ) : (
                            <div className="adm__list">
                                {auditLogs.map(log => {
                                    const actionLabel = AUDIT_LABELS[log.action] || log.action;
                                    return (
                                        <div className="adm__card adm__card--audit" key={log._id}>
                                            <div className="adm__audit-icon">
                                                <i className={`bx ${log.action.includes('ban') ? 'bx-block' : log.action.includes('ticket') ? 'bx-support' : log.action.includes('role') ? 'bx-user-check' : log.action.includes('notification') ? 'bx-bell' : 'bx-shield-quarter'}`} />
                                            </div>
                                            <div className="adm__card-info">
                                                <div className="adm__card-name">
                                                    {actionLabel}
                                                    <span className="adm__badge adm__badge--role">{log.entityType}</span>
                                                </div>
                                                <div className="adm__card-email">
                                                    {log.meta?.username && <><strong>{log.meta.username}</strong> — </>}
                                                    {log.meta?.role && <>{ROLE_LABELS[log.meta.role] || log.meta.role} — </>}
                                                    {log.meta?.ticketType && <>{TICKET_TYPES[log.meta.ticketType]?.label || log.meta.ticketType} — </>}
                                                    {log.meta?.newStatus && <>Estado: {TICKET_STATUS[log.meta.newStatus]?.label || log.meta.newStatus} — </>}
                                                    {formatDate(log.createdAt)}
                                                </div>
                                                {log.meta?.reason && (
                                                    <div className="adm__card-preview">Razon: {log.meta.reason}</div>
                                                )}
                                            </div>
                                            <div className="adm__audit-date">
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══ APPLICATION DETAIL MODAL ═══ */}
            {selectedApp && (
                <div className="adm__modal-overlay" onClick={() => setSelectedApp(null)}>
                    <div className="adm__modal" onClick={e => e.stopPropagation()}>
                        <button className="adm__modal-x" onClick={() => setSelectedApp(null)}><i className='bx bx-x' /></button>
                        <h3><i className='bx bx-file' /> Solicitud — {ROLE_LABELS[selectedApp.role]}</h3>
                        <Field label="Usuario" value={`${selectedApp.username} (${selectedApp.email})`} />
                        <Field label="Nombre" value={selectedApp.fullName || selectedApp.data?.fullName || '-'} />
                        <Field label="Fecha" value={formatDate(selectedApp.appliedAt)} />
                        {Object.entries(selectedApp.data || {}).map(([k, v]) => {
                            if (!v || k === 'rejectReason' || k === 'fullName') return null;
                            return <Field key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ')} value={String(v)} />;
                        })}
                        {selectedApp.data?.rejectReason && <Field label="Razon de rechazo" value={selectedApp.data.rejectReason} />}

                        {selectedApp.status === 'pending' && (
                            <>
                                <div className="adm__modal-field" style={{ marginTop: '1rem' }}>
                                    <label>Razon de rechazo (opcional)</label>
                                    <input className="adm__modal-input" placeholder="Escribe una razon..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                                </div>
                                <div className="adm__modal-actions">
                                    <button className="adm__btn adm__btn--approve" disabled={!!actionLoading} onClick={() => handleReview(selectedApp.userId, selectedApp.role, 'approve')}>
                                        <i className='bx bx-check' /> Aprobar
                                    </button>
                                    <button className="adm__btn adm__btn--reject" disabled={!!actionLoading} onClick={() => handleReview(selectedApp.userId, selectedApp.role, 'reject')}>
                                        <i className='bx bx-x' /> Rechazar
                                    </button>
                                    <button className="adm__modal-close" onClick={() => setSelectedApp(null)}>Cerrar</button>
                                </div>
                            </>
                        )}
                        {selectedApp.status !== 'pending' && (
                            <div className="adm__modal-actions">
                                <span className={`adm__badge adm__badge--${selectedApp.status}`}>
                                    {selectedApp.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                </span>
                                <button className="adm__modal-close" onClick={() => setSelectedApp(null)}>Cerrar</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ TICKET DETAIL MODAL ═══ */}
            {selectedTicket && (
                <div className="adm__modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="adm__modal adm__modal--wide" onClick={e => e.stopPropagation()}>
                        <button className="adm__modal-x" onClick={() => setSelectedTicket(null)}><i className='bx bx-x' /></button>

                        <div className="adm__ticket-header">
                            <div className="adm__ticket-type" style={{ background: `${TICKET_TYPES[selectedTicket.type]?.color}18`, color: TICKET_TYPES[selectedTicket.type]?.color }}>
                                <i className={`bx ${TICKET_TYPES[selectedTicket.type]?.icon}`} />
                                {TICKET_TYPES[selectedTicket.type]?.label}
                            </div>
                            <span className="adm__badge" style={{ background: `${TICKET_STATUS[selectedTicket.status]?.color}18`, color: TICKET_STATUS[selectedTicket.status]?.color }}>
                                {TICKET_STATUS[selectedTicket.status]?.label}
                            </span>
                        </div>

                        <h3>{selectedTicket.subject || TICKET_TYPES[selectedTicket.type]?.label}</h3>

                        <Field label="Usuario" value={`${selectedTicket.username} (${selectedTicket.email})`} />
                        <Field label="Fecha" value={formatDate(selectedTicket.createdAt)} />

                        <div className="adm__ticket-message">
                            <label>Mensaje del usuario</label>
                            <div className="adm__ticket-bubble adm__ticket-bubble--user">
                                {selectedTicket.message}
                            </div>
                        </div>

                        {/* Extra data for achievements */}
                        {selectedTicket.data && Object.keys(selectedTicket.data).length > 0 && (
                            <div className="adm__ticket-data">
                                <label>Datos adicionales</label>
                                <div className="adm__ticket-data-grid">
                                    {Object.entries(selectedTicket.data).map(([k, v]) => (
                                        <div key={k} className="adm__ticket-data-item">
                                            <span>{k.replace(/([A-Z])/g, ' $1')}</span>
                                            <strong>{String(v)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Previous response */}
                        {selectedTicket.adminResponse && (
                            <div className="adm__ticket-message">
                                <label>Respuesta del admin — {formatDate(selectedTicket.respondedAt)}</label>
                                <div className="adm__ticket-bubble adm__ticket-bubble--admin">
                                    {selectedTicket.adminResponse}
                                </div>
                            </div>
                        )}

                        {/* Response form */}
                        {selectedTicket.status !== 'closed' && (
                            <div className="adm__ticket-respond">
                                <label>{selectedTicket.adminResponse ? 'Actualizar respuesta' : 'Responder al usuario'}</label>
                                <textarea
                                    className="adm__ticket-textarea"
                                    placeholder="Escribe tu respuesta... (se enviara como notificacion al usuario)"
                                    value={ticketResponse}
                                    onChange={e => setTicketResponse(e.target.value)}
                                    rows={4}
                                />
                                <div className="adm__modal-actions">
                                    <button className="adm__btn adm__btn--approve" disabled={!ticketResponse.trim() || !!actionLoading} onClick={handleTicketRespond}>
                                        <i className='bx bx-send' /> Responder y Resolver
                                    </button>
                                    {selectedTicket.status === 'open' && (
                                        <button className="adm__btn adm__btn--detail" disabled={!!actionLoading} onClick={() => { handleTicketStatus(selectedTicket._id, 'in-progress'); setSelectedTicket(null); }}>
                                            <i className='bx bx-loader' /> Marcar En Proceso
                                        </button>
                                    )}
                                    <button className="adm__modal-close" onClick={() => setSelectedTicket(null)}>Cerrar</button>
                                </div>
                            </div>
                        )}

                        {selectedTicket.status === 'closed' && (
                            <div className="adm__modal-actions">
                                <span className="adm__badge" style={{ background: 'rgba(107,114,128,0.12)', color: '#6b7280' }}>Ticket cerrado</span>
                                <button className="adm__modal-close" onClick={() => setSelectedTicket(null)}>Cerrar</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Helper components ──
const StatCard = ({ icon, value, label, bg, color }) => (
    <div className="adm__stat-card">
        <div className="adm__stat-icon" style={{ background: bg, color }}>
            <i className={`bx ${icon}`} />
        </div>
        <div className="adm__stat-info">
            <span className="adm__stat-value">{value}</span>
            <span className="adm__stat-label">{label}</span>
        </div>
    </div>
);

const Loading = () => (
    <div className="adm__loading"><div className="adm__spinner" /><span>Cargando...</span></div>
);

const Empty = ({ icon, text }) => (
    <div className="adm__empty"><i className={`bx ${icon}`} /><p>{text}</p></div>
);

const Field = ({ label, value }) => (
    <div className="adm__modal-field">
        <label>{label}</label>
        <p>{value}</p>
    </div>
);

export default AdminPanel;
