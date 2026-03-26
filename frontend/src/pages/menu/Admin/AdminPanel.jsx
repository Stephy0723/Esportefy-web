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

const STATUS_LABELS = {
    online: 'En Linea', gaming: 'Jugando', tournament: 'En Torneo',
    streaming: 'En Stream', searching: 'Buscando', afk: 'AFK', dnd: 'No Molestar', offline: 'Desconectado'
};
const STATUS_COLORS = {
    online: '#10b981', gaming: '#8b5cf6', tournament: '#fbbf24',
    streaming: '#ef4444', searching: '#06b6d4', afk: '#f97316', dnd: '#dc2626', offline: '#6b7280'
};

const COUNTRIES_LIST = [
    'Antigua y Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belice', 'Bolivia', 'Brasil',
    'Canadá', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica',
    'Ecuador', 'El Salvador', 'Estados Unidos', 'Granada', 'Guatemala', 'Guyana',
    'Haití', 'Honduras', 'Jamaica', 'México', 'Nicaragua', 'Panamá', 'Paraguay',
    'Perú', 'Puerto Rico', 'República Dominicana', 'San Cristóbal y Nieves',
    'San Vicente y las Granadinas', 'Santa Lucía', 'Surinam',
    'Trinidad y Tobago', 'Uruguay', 'Venezuela'
];

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const formatShortDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calcAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
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
    const [countryFilter, setCountryFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [experienceFilter, setExperienceFilter] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [bannedFilter, setBannedFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [ticketStatusFilter, setTicketStatusFilter] = useState('open');
    const [ticketTypeFilter, setTicketTypeFilter] = useState('');

    // UI
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [ticketResponse, setTicketResponse] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [notifMsg, setNotifMsg] = useState('');
    const [notifTitle, setNotifTitle] = useState('');
    const [banReasonInput, setBanReasonInput] = useState('');
    const [showBanModal, setShowBanModal] = useState(null);

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
            if (countryFilter) params.country = countryFilter;
            if (userRoleFilter) params.role = userRoleFilter;
            if (platformFilter) params.platform = platformFilter;
            if (experienceFilter) params.experience = experienceFilter;
            if (userStatusFilter) params.status = userStatusFilter;
            if (genderFilter) params.gender = genderFilter;
            if (bannedFilter === 'true') params.banned = 'true';
            if (sortFilter) params.sort = sortFilter;
            const res = await axios.get(`${API_URL}/api/auth/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }, params
            });
            setUsers(res.data?.items || []);
            setUserTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [userSearch, userPage, gameFilter, countryFilter, userRoleFilter, platformFilter, experienceFilter, userStatusFilter, genderFilter, bannedFilter, sortFilter]);

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

    // ── Fetch user detail ──
    const fetchUserDetail = async (identifier) => {
        setUserDetailLoading(true);
        try {
            const token = getToken();
            const res = await axios.get(`${API_URL}/api/auth/admin/users/${encodeURIComponent(identifier)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedUser(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Usuario no encontrado.');
        }
        finally { setUserDetailLoading(false); }
    };

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
            setShowBanModal(null); setBanReasonInput('');
            fetchUsers();
            if (selectedUser && selectedUser._id === userId) {
                fetchUserDetail(userId);
            }
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

    const handleSendNotification = async (userId) => {
        if (!notifMsg.trim()) return;
        setActionLoading(`notif-${userId}`);
        try {
            const token = getToken();
            await axios.post(`${API_URL}/api/auth/admin/send-notification`, {
                userId, title: notifTitle.trim() || 'Mensaje del Admin', message: notifMsg
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNotifMsg(''); setNotifTitle('');
            alert('Notificacion enviada.');
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setActionLoading(null); }
    };

    // ── Export CSV ──
    // ── Excel Export ──
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const buildExcel = ({ title, subtitle, filterLines = [], headers, rows, colWidths, accentColor = '#8EDB15' }) => {
        const dark = '#1a1a2e';
        const headerBg = '#111827';
        const headerText = '#ffffff';
        const rowEven = '#f9fafb';
        const rowOdd = '#ffffff';
        const borderColor = '#e5e7eb';
        const mutedText = '#6b7280';
        const filterLabelColor = '#d1d5db';
        const filterValueColor = '#ffffff';

        const widthCols = (colWidths || headers.map(() => 120)).map(w => `<col width="${w}" />`).join('');

        const headerCells = headers.map(h =>
            `<td style="background:${headerBg};color:${headerText};font-weight:700;font-size:11px;padding:10px 12px;border:1px solid ${dark};text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">${esc(h)}</td>`
        ).join('');

        const bodyRows = rows.map((row, ri) => {
            const bg = ri % 2 === 0 ? rowOdd : rowEven;
            const cells = row.map((cell, ci) => {
                const val = esc(cell);
                const isNum = ci === 0;
                const align = isNum ? 'center' : 'left';
                const color = isNum ? mutedText : '#111827';
                const fw = isNum ? '700' : '400';
                return `<td style="background:${bg};color:${color};font-weight:${fw};font-size:11px;padding:8px 12px;border:1px solid ${borderColor};text-align:${align};vertical-align:top;white-space:nowrap;">${val || '<span style="color:#d1d5db;">—</span>'}</td>`;
            });
            return `<tr>${cells.join('')}</tr>`;
        }).join('');

        const now = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        // Build filter detail rows for the header
        const isGeneral = filterLines.length === 0;
        const reportType = isGeneral ? 'REPORTE GENERAL' : 'REPORTE FILTRADO';

        let filterHeaderRows = '';
        if (isGeneral) {
            filterHeaderRows = `<tr><td colspan="${headers.length}" style="background:${dark};color:${accentColor};font-size:11px;font-weight:700;padding:6px 14px 2px;border:none;letter-spacing:0.5px;">TIPO: REPORTE GENERAL — Todos los registros</td></tr>`;
        } else {
            filterHeaderRows = `<tr><td colspan="${headers.length}" style="background:${dark};color:${accentColor};font-size:11px;font-weight:700;padding:6px 14px 2px;border:none;letter-spacing:0.5px;">FILTROS APLICADOS:</td></tr>`;
            filterHeaderRows += filterLines.map(({ label, value }) =>
                `<tr><td colspan="${headers.length}" style="background:${dark};font-size:10px;padding:1px 14px 1px 28px;border:none;"><span style="color:${filterLabelColor};">${esc(label)}:</span> <span style="color:${filterValueColor};font-weight:600;">${esc(value)}</span></td></tr>`
            ).join('');
        }

        // Freeze panes: account for extra rows (brand 3 rows + filter rows + 1 header row)
        const freezeRow = 3 + (isGeneral ? 1 : 1 + filterLines.length) + 1 + 1;

        return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${esc(title)}</x:Name>
<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>${freezeRow}</x:SplitHorizontal><x:TopRowBottomPane>${freezeRow}</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Segoe UI,Calibri,Arial,sans-serif;">
${widthCols}
<tr><td colspan="${headers.length}" style="background:${dark};color:${accentColor};font-size:18px;font-weight:800;padding:16px 14px 4px;border:none;letter-spacing:1px;">GLITCH GANG</td></tr>
<tr><td colspan="${headers.length}" style="background:${dark};color:${headerText};font-size:13px;font-weight:600;padding:2px 14px 4px;border:none;">${esc(title)} — ${reportType}</td></tr>
<tr><td colspan="${headers.length}" style="background:${dark};color:${mutedText};font-size:10px;padding:0 14px 6px;border:none;">Generado: ${now} — Total: ${rows.length} registro${rows.length !== 1 ? 's' : ''}</td></tr>
${filterHeaderRows}
<tr><td colspan="${headers.length}" style="background:${dark};padding:4px 0 0;border:none;font-size:1px;line-height:1px;"><span style="color:${accentColor};">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span></td></tr>
<tr>${headerCells}</tr>
${bodyRows}
<tr><td colspan="${headers.length}" style="background:#f3f4f6;color:${mutedText};font-size:9px;padding:10px 14px;border:1px solid ${borderColor};text-align:center;">GLITCH GANG — Panel de Administracion — Documento confidencial — ${now}</td></tr>
</table>
</body>
</html>`;
    };

    const downloadExcel = (html, name) => {
        const now = new Date();
        const dateStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GlitchGang_${name}_${dateStr}.xls`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportCSV = (dataType) => {
        if (dataType === 'users') {
            const data = users.length ? users : allUsersForStats;
            if (!data.length) return alert('No hay datos para exportar.');

            const headers = [
                '#', 'UserCode', 'Username', 'Email', 'Nombre Completo',
                'Pais', 'Telefono', 'Genero', 'Nacimiento', 'Edad',
                'Roles', 'Juegos', 'Plataformas', 'Experiencia', 'Objetivos',
                'Estado', 'Admin', 'Organizador', 'Baneado', 'Razon Baneo',
                '2FA', 'Seguidores', 'Siguiendo', 'Amigos', 'Equipos',
                'Discord', 'Riot', 'MLBB', 'Steam', 'Epic',
                'Registrado'
            ];
            const colWidths = [
                35, 100, 110, 200, 160,
                120, 110, 80, 100, 40,
                160, 180, 100, 80, 120,
                90, 50, 70, 60, 180,
                70, 70, 70, 60, 60,
                130, 140, 140, 120, 120,
                150
            ];

            const rows = data.map((u, i) => {
                const conn = u.connections || {};
                const discordTag = conn.discord?.verified ? (conn.discord.username || conn.discord.id || 'Vinculado') : '';
                const riotTag = conn.riot?.verified ? `${conn.riot.gameName || ''}#${conn.riot.tagLine || ''}` : '';
                const mlbbTag = conn.mlbb?.playerId ? `${conn.mlbb.ign || conn.mlbb.playerId} (${conn.mlbb.verified ? 'Verificado' : conn.mlbb.verificationStatus || 'Pendiente'})` : '';
                const steamTag = conn.steam?.verified ? (conn.steam.username || conn.steam.steamId || 'Vinculado') : '';
                const epicTag = conn.epic?.verified ? (conn.epic.username || conn.epic.epicId || 'Vinculado') : '';

                return [
                    i + 1,
                    u.userCode || '',
                    u.username,
                    u.email,
                    u.fullName || '',
                    u.country || '',
                    u.phone || '',
                    u.gender || '',
                    u.birthDate ? formatShortDate(u.birthDate) : '',
                    u.birthDate ? calcAge(u.birthDate) : '',
                    (u.roles || []).map(r => ROLE_LABELS[r] || r).join(' | '),
                    (u.selectedGames || []).join(' | '),
                    (u.platforms || []).join(' | '),
                    (u.experience || []).join(' | '),
                    (u.goals || []).join(' | '),
                    STATUS_LABELS[u.status] || u.status || '',
                    u.isAdmin ? 'Si' : 'No',
                    u.isOrganizer ? 'Si' : 'No',
                    u.isBanned ? 'Si' : 'No',
                    u.banReason || '',
                    u.twoFactorEnabled ? 'Activado' : 'No',
                    (u.followers || []).length,
                    (u.following || []).length,
                    (u.friends || []).length,
                    (u.teams || []).length,
                    discordTag,
                    riotTag,
                    mlbbTag,
                    steamTag,
                    epicTag,
                    formatDate(u.createdAt)
                ];
            });

            const filterLines = [];
            if (countryFilter) filterLines.push({ label: 'País', value: countryFilter });
            if (gameFilter) filterLines.push({ label: 'Juego', value: gameFilter });
            if (userRoleFilter) filterLines.push({ label: 'Rol', value: ROLE_LABELS[userRoleFilter] || userRoleFilter });
            if (platformFilter) filterLines.push({ label: 'Plataforma', value: platformFilter });
            if (experienceFilter) filterLines.push({ label: 'Experiencia', value: experienceFilter });
            if (userStatusFilter) filterLines.push({ label: 'Estado', value: STATUS_LABELS[userStatusFilter] || userStatusFilter });
            if (genderFilter) filterLines.push({ label: 'Género', value: genderFilter });
            if (bannedFilter) filterLines.push({ label: 'Baneados', value: bannedFilter === 'banned' ? 'Solo baneados' : 'No baneados' });
            if (sortFilter) {
                const sortLabels = { username: 'Nombre (A-Z)', country: 'País (A-Z)', oldest: 'Más antiguo primero' };
                filterLines.push({ label: 'Ordenado por', value: sortLabels[sortFilter] || sortFilter });
            }

            const subtitle = filterLines.length
                ? filterLines.map(f => `${f.label}: ${f.value}`).join(' | ')
                : 'Todos los usuarios';

            downloadExcel(buildExcel({ title: 'Reporte de Usuarios', subtitle, filterLines, headers, rows, colWidths }), 'Usuarios');
        } else if (dataType === 'applications') {
            if (!applications.length) return alert('No hay datos para exportar.');

            const headers = ['#', 'Username', 'Email', 'Nombre Completo', 'Rol Solicitado', 'Estado', 'Fecha Solicitud', 'Fecha Revision', 'Razon Rechazo'];
            const colWidths = [35, 120, 200, 160, 130, 90, 150, 150, 250];
            const statusLabels = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

            const rows = applications.map((a, i) => [
                i + 1,
                a.username,
                a.email,
                a.fullName || '',
                ROLE_LABELS[a.role] || a.role,
                statusLabels[a.status] || a.status,
                formatDate(a.appliedAt),
                a.reviewedAt ? formatDate(a.reviewedAt) : '',
                a.data?.rejectReason || ''
            ]);

            const appFilterLines = [];
            const statusLabelsMap = { pending: 'Pendientes', approved: 'Aprobadas', rejected: 'Rechazadas' };
            if (statusFilter) appFilterLines.push({ label: 'Estado', value: statusLabelsMap[statusFilter] || statusFilter });
            if (roleFilter) appFilterLines.push({ label: 'Rol solicitado', value: ROLE_LABELS[roleFilter] || roleFilter });
            const appSubtitle = appFilterLines.length
                ? appFilterLines.map(f => `${f.label}: ${f.value}`).join(' | ')
                : 'Todas las solicitudes';
            downloadExcel(buildExcel({ title: 'Reporte de Solicitudes de Rol', subtitle: appSubtitle, filterLines: appFilterLines, headers, rows, colWidths, accentColor: '#f59e0b' }), 'Solicitudes');
        } else if (dataType === 'tickets') {
            if (!tickets.length) return alert('No hay datos para exportar.');

            const headers = ['#', 'ID Ticket', 'Username', 'Email', 'Tipo', 'Estado', 'Asunto', 'Mensaje', 'Respuesta Admin', 'Fecha Creacion', 'Fecha Respuesta'];
            const colWidths = [35, 100, 120, 200, 90, 90, 160, 300, 300, 150, 150];

            const rows = tickets.map((t, i) => [
                i + 1,
                t._id,
                t.username,
                t.email,
                TICKET_TYPES[t.type]?.label || t.type,
                TICKET_STATUS[t.status]?.label || t.status,
                t.subject || '',
                t.message || '',
                t.adminResponse || '',
                formatDate(t.createdAt),
                t.respondedAt ? formatDate(t.respondedAt) : ''
            ]);

            const ticketFilterLines = [];
            if (ticketStatusFilter) ticketFilterLines.push({ label: 'Estado', value: TICKET_STATUS[ticketStatusFilter]?.label || ticketStatusFilter });
            if (ticketTypeFilter) ticketFilterLines.push({ label: 'Tipo', value: TICKET_TYPES[ticketTypeFilter]?.label || ticketTypeFilter });
            const ticketSubtitle = ticketFilterLines.length
                ? ticketFilterLines.map(f => `${f.label}: ${f.value}`).join(' | ')
                : 'Todos los tickets';
            downloadExcel(buildExcel({ title: 'Reporte de Tickets de Soporte', subtitle: ticketSubtitle, filterLines: ticketFilterLines, headers, rows, colWidths, accentColor: '#a855f7' }), 'Tickets');
        }
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
    const countryDistribution = {};
    allUsersForStats.forEach(u => {
        const c = u.country || 'Sin pais';
        countryDistribution[c] = (countryDistribution[c] || 0) + 1;
    });

    if (!isAdmin) return null;

    // ── Connection helpers ──
    const getConnectionStatus = (conn, key) => {
        if (!conn || !conn[key]) return null;
        const c = conn[key];
        if (key === 'discord') return c.verified ? { label: c.username || c.id, ok: true } : null;
        if (key === 'riot') return c.verified ? { label: `${c.gameName}#${c.tagLine}`, ok: true } : null;
        if (key === 'mlbb') return c.playerId ? { label: `${c.ign || c.playerId} (${c.verificationStatus})`, ok: c.verified } : null;
        if (key === 'steam') return c.verified ? { label: c.username || c.steamId, ok: true } : null;
        if (key === 'epic') return c.verified ? { label: c.username || c.epicId, ok: true } : null;
        return null;
    };

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

                        {/* Quick user lookup */}
                        <div className="adm__section">
                            <h2><i className='bx bx-search-alt' /> Buscar Usuario por ID</h2>
                            <p className="adm__section-desc">Ingresa el UserCode (ej: 123456-CO1) o el ID de MongoDB para ver el perfil completo.</p>
                            <div className="adm__quick-search">
                                <input
                                    className="adm__quick-input"
                                    placeholder="UserCode o ID... (ej: 123456-CO1)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) fetchUserDetail(e.target.value.trim());
                                    }}
                                />
                                <button className="adm__btn adm__btn--detail" onClick={(e) => {
                                    const input = e.target.closest('.adm__quick-search').querySelector('input');
                                    if (input.value.trim()) fetchUserDetail(input.value.trim());
                                }}>
                                    <i className='bx bx-search' /> Buscar
                                </button>
                            </div>
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

                        {/* Country distribution */}
                        <div className="adm__section">
                            <h2><i className='bx bx-globe' /> Usuarios por Pais</h2>
                            <div className="adm__role-bars">
                                {Object.entries(countryDistribution).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, count]) => (
                                    <div className="adm__role-bar" key={country}>
                                        <div className="adm__role-bar-label">
                                            <span>{country}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="adm__role-bar-track">
                                            <div className="adm__role-bar-fill" style={{
                                                width: `${Math.min(100, (count / totalUsers) * 100)}%`,
                                                background: '#3b82f6'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                                    <i className='bx bx-spreadsheet' /> Usuarios (.xls)
                                </button>
                                <button className="adm__btn adm__btn--export" onClick={() => exportCSV('applications')}>
                                    <i className='bx bx-file' /> Solicitudes (.xls)
                                </button>
                                <button className="adm__btn adm__btn--export" onClick={() => exportCSV('tickets')}>
                                    <i className='bx bx-support' /> Tickets (.xls)
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
                                <i className='bx bx-download' /> Excel
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
                                <i className='bx bx-download' /> Excel
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
                        {/* Search + toggle */}
                        <div className="adm__toolbar">
                            <div className="adm__search-wrap">
                                <i className='bx bx-search' />
                                <input placeholder="Buscar username, email, nombre, userCode..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} />
                            </div>
                            <button className={`adm__btn ${showFilters ? 'adm__btn--approve' : 'adm__btn--detail'}`} onClick={() => setShowFilters(!showFilters)}>
                                <i className={`bx ${showFilters ? 'bx-x' : 'bx-filter-alt'}`} /> Filtros
                                {(gameFilter || countryFilter || userRoleFilter || platformFilter || experienceFilter || userStatusFilter || genderFilter || bannedFilter) && (
                                    <span className="adm__filter-count">
                                        {[gameFilter, countryFilter, userRoleFilter, platformFilter, experienceFilter, userStatusFilter, genderFilter, bannedFilter].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <select className="adm__filter-select adm__filter-select--sort" value={sortFilter} onChange={e => { setSortFilter(e.target.value); setUserPage(1); }}>
                                <option value="">Mas recientes</option>
                                <option value="oldest">Mas antiguos</option>
                                <option value="username">A-Z Username</option>
                                <option value="country">A-Z Pais</option>
                            </select>
                            <button className="adm__btn adm__btn--export" onClick={() => exportCSV('users')}>
                                <i className='bx bx-download' /> Excel
                            </button>
                        </div>

                        {/* Filters panel */}
                        {showFilters && (
                            <div className="adm__filters-panel">
                                <div className="adm__filters-grid">
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-globe' /> Pais</label>
                                        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-joystick' /> Juego</label>
                                        <select value={gameFilter} onChange={e => { setGameFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            {GAME_LIST.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-star' /> Rol</label>
                                        <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-laptop' /> Plataforma</label>
                                        <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todas</option>
                                            <option value="pc">PC</option>
                                            <option value="mobile">Mobile</option>
                                            <option value="console">Consola</option>
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-trophy' /> Experiencia</label>
                                        <select value={experienceFilter} onChange={e => { setExperienceFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todas</option>
                                            <option value="Rookie">Rookie</option>
                                            <option value="Mid">Mid</option>
                                            <option value="Pro">Pro</option>
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-radio-circle-marked' /> Estado</label>
                                        <select value={userStatusFilter} onChange={e => { setUserStatusFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-user' /> Genero</label>
                                        <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="adm__filter-group">
                                        <label><i className='bx bx-block' /> Baneados</label>
                                        <select value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setUserPage(1); }}>
                                            <option value="">Todos</option>
                                            <option value="true">Solo baneados</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Active filters tags + clear */}
                                {(gameFilter || countryFilter || userRoleFilter || platformFilter || experienceFilter || userStatusFilter || genderFilter || bannedFilter) && (
                                    <div className="adm__active-filters">
                                        {countryFilter && <span className="adm__filter-tag" onClick={() => { setCountryFilter(''); setUserPage(1); }}><i className='bx bx-globe' /> {countryFilter} <i className='bx bx-x' /></span>}
                                        {gameFilter && <span className="adm__filter-tag" onClick={() => { setGameFilter(''); setUserPage(1); }}><i className='bx bx-joystick' /> {gameFilter} <i className='bx bx-x' /></span>}
                                        {userRoleFilter && <span className="adm__filter-tag" onClick={() => { setUserRoleFilter(''); setUserPage(1); }}><i className='bx bx-star' /> {ROLE_LABELS[userRoleFilter]} <i className='bx bx-x' /></span>}
                                        {platformFilter && <span className="adm__filter-tag" onClick={() => { setPlatformFilter(''); setUserPage(1); }}><i className='bx bx-laptop' /> {platformFilter} <i className='bx bx-x' /></span>}
                                        {experienceFilter && <span className="adm__filter-tag" onClick={() => { setExperienceFilter(''); setUserPage(1); }}><i className='bx bx-trophy' /> {experienceFilter} <i className='bx bx-x' /></span>}
                                        {userStatusFilter && <span className="adm__filter-tag" onClick={() => { setUserStatusFilter(''); setUserPage(1); }}><i className='bx bx-radio-circle-marked' /> {STATUS_LABELS[userStatusFilter]} <i className='bx bx-x' /></span>}
                                        {genderFilter && <span className="adm__filter-tag" onClick={() => { setGenderFilter(''); setUserPage(1); }}><i className='bx bx-user' /> {genderFilter} <i className='bx bx-x' /></span>}
                                        {bannedFilter && <span className="adm__filter-tag" onClick={() => { setBannedFilter(''); setUserPage(1); }}><i className='bx bx-block' /> Baneados <i className='bx bx-x' /></span>}
                                        <button className="adm__clear-filters" onClick={() => {
                                            setGameFilter(''); setCountryFilter(''); setUserRoleFilter(''); setPlatformFilter('');
                                            setExperienceFilter(''); setUserStatusFilter(''); setGenderFilter(''); setBannedFilter('');
                                            setUserPage(1);
                                        }}>
                                            <i className='bx bx-trash' /> Limpiar filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {loading ? <Loading /> : users.length === 0 ? (
                            <Empty icon="bx-user-x" text="No se encontraron usuarios." />
                        ) : (
                            <>
                                <div className="adm__user-count">
                                    {userTotal} usuario{userTotal !== 1 ? 's' : ''} encontrado{userTotal !== 1 ? 's' : ''}
                                </div>
                                <div className="adm__list">
                                    {users.map(user => (
                                        <div className="adm__card adm__card--clickable" key={user._id} onClick={() => fetchUserDetail(user._id)}>
                                            <img className="adm__card-avatar" src={resolveMediaUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}`} alt="" />
                                            <div className="adm__card-info">
                                                <div className="adm__card-name">
                                                    {user.username}
                                                    {user.userCode && <span className="adm__badge adm__badge--code">{user.userCode}</span>}
                                                    {user.isAdmin && <span className="adm__badge adm__badge--admin">Admin</span>}
                                                    {user.isBanned && <span className="adm__badge adm__badge--banned">Baneado</span>}
                                                </div>
                                                <div className="adm__card-email">
                                                    {user.email} — {user.fullName || '-'}
                                                </div>
                                                <div className="adm__card-meta">
                                                    {user.country && <span className="adm__badge adm__badge--country"><i className='bx bx-globe' /> {user.country}</span>}
                                                    {user.status && user.status !== 'offline' && (
                                                        <span className="adm__badge" style={{ background: `${STATUS_COLORS[user.status]}18`, color: STATUS_COLORS[user.status] }}>
                                                            {STATUS_LABELS[user.status]}
                                                        </span>
                                                    )}
                                                    {(user.roles || []).filter(r => r !== 'player').map(r => (
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
                                            <div className="adm__card-actions" onClick={e => e.stopPropagation()}>
                                                <button className="adm__btn adm__btn--detail" onClick={() => fetchUserDetail(user._id)}>
                                                    <i className='bx bx-show' /> Ver
                                                </button>
                                                {!user.isAdmin && (
                                                    user.isBanned ? (
                                                        <button className="adm__btn adm__btn--unban" disabled={!!actionLoading} onClick={() => handleBan(user._id, 'unban')}>
                                                            <i className='bx bx-lock-open' /> Desbanear
                                                        </button>
                                                    ) : (
                                                        <button className="adm__btn adm__btn--ban" disabled={!!actionLoading} onClick={() => { setShowBanModal(user); setBanReasonInput(''); }}>
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

                        {selectedTicket.adminResponse && (
                            <div className="adm__ticket-message">
                                <label>Respuesta del admin — {formatDate(selectedTicket.respondedAt)}</label>
                                <div className="adm__ticket-bubble adm__ticket-bubble--admin">
                                    {selectedTicket.adminResponse}
                                </div>
                            </div>
                        )}

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

            {/* ═══ USER DETAIL MODAL ═══ */}
            {(selectedUser || userDetailLoading) && (
                <div className="adm__modal-overlay" onClick={() => { setSelectedUser(null); setNotifMsg(''); setNotifTitle(''); }}>
                    <div className="adm__modal adm__modal--user" onClick={e => e.stopPropagation()}>
                        <button className="adm__modal-x" onClick={() => { setSelectedUser(null); setNotifMsg(''); setNotifTitle(''); }}><i className='bx bx-x' /></button>

                        {userDetailLoading ? (
                            <Loading />
                        ) : selectedUser && (
                            <>
                                {/* Header */}
                                <div className="adm__ud-header">
                                    <img className="adm__ud-avatar" src={resolveMediaUrl(selectedUser.avatar) || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=1a1a2e&color=8EDB15&size=96`} alt="" />
                                    <div className="adm__ud-identity">
                                        <h3>{selectedUser.username}</h3>
                                        <div className="adm__ud-badges">
                                            {selectedUser.userCode && <span className="adm__badge adm__badge--code">{selectedUser.userCode}</span>}
                                            {selectedUser.isAdmin && <span className="adm__badge adm__badge--admin">Admin</span>}
                                            {selectedUser.isOrganizer && <span className="adm__badge adm__badge--role" style={{ background: '#f59e0b18', color: '#f59e0b' }}>Organizador</span>}
                                            {selectedUser.isBanned && <span className="adm__badge adm__badge--banned">Baneado</span>}
                                            {selectedUser.status && (
                                                <span className="adm__badge" style={{ background: `${STATUS_COLORS[selectedUser.status] || '#6b7280'}18`, color: STATUS_COLORS[selectedUser.status] || '#6b7280' }}>
                                                    {STATUS_LABELS[selectedUser.status] || selectedUser.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="adm__ud-sub">{selectedUser.email}</div>
                                    </div>
                                </div>

                                {/* Ban info */}
                                {selectedUser.isBanned && (
                                    <div className="adm__ud-ban-info">
                                        <i className='bx bx-block' />
                                        <div>
                                            <strong>Baneado</strong>
                                            {selectedUser.banReason && <p>Razon: {selectedUser.banReason}</p>}
                                            {selectedUser.bannedAt && <span>Desde: {formatDate(selectedUser.bannedAt)}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Personal Data */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-id-card' /> Datos Personales</h4>
                                    <div className="adm__ud-grid">
                                        <Field label="Nombre Completo" value={selectedUser.fullName || '-'} />
                                        <Field label="Pais" value={selectedUser.country || '-'} />
                                        <Field label="Telefono" value={selectedUser.phone || '-'} />
                                        <Field label="Genero" value={selectedUser.gender || '-'} />
                                        <Field label="Fecha de Nacimiento" value={selectedUser.birthDate ? `${formatShortDate(selectedUser.birthDate)} (${calcAge(selectedUser.birthDate)} años)` : '-'} />
                                        <Field label="Fecha de Registro" value={formatDate(selectedUser.createdAt)} />
                                    </div>
                                </div>

                                {/* IDs */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-hash' /> Identificadores</h4>
                                    <div className="adm__ud-grid">
                                        <Field label="MongoDB ID" value={selectedUser._id} />
                                        <Field label="UserCode" value={selectedUser.userCode || '-'} />
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-star' /> Roles y Permisos</h4>
                                    <div className="adm__ud-tags">
                                        {(selectedUser.roles || ['player']).map(r => (
                                            <span key={r} className="adm__badge adm__badge--role" style={{ background: `${ROLE_COLORS[r] || 'var(--primary)'}18`, color: ROLE_COLORS[r] || 'var(--primary)' }}>
                                                {ROLE_LABELS[r] || r}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="adm__ud-flags">
                                        <span className={selectedUser.twoFactorEnabled ? 'adm__ud-flag adm__ud-flag--ok' : 'adm__ud-flag'}>
                                            <i className={`bx ${selectedUser.twoFactorEnabled ? 'bx-check-shield' : 'bx-shield-x'}`} />
                                            2FA {selectedUser.twoFactorEnabled ? 'Activado' : 'Desactivado'}
                                        </span>
                                        <span className={selectedUser.lookingForTeam ? 'adm__ud-flag adm__ud-flag--ok' : 'adm__ud-flag'}>
                                            <i className='bx bx-group' />
                                            {selectedUser.lookingForTeam ? 'Buscando equipo' : 'No busca equipo'}
                                        </span>
                                        <span className={selectedUser.isProfileHidden ? 'adm__ud-flag adm__ud-flag--warn' : 'adm__ud-flag'}>
                                            <i className={`bx ${selectedUser.isProfileHidden ? 'bx-hide' : 'bx-show'}`} />
                                            Perfil {selectedUser.isProfileHidden ? 'oculto' : 'visible'}
                                        </span>
                                    </div>
                                </div>

                                {/* Gaming */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-joystick' /> Gaming</h4>
                                    <div className="adm__ud-grid">
                                        <Field label="Juegos" value={(selectedUser.selectedGames || []).join(', ') || '-'} />
                                        <Field label="Plataformas" value={(selectedUser.platforms || []).join(', ') || '-'} />
                                        <Field label="Experiencia" value={(selectedUser.experience || []).join(', ') || '-'} />
                                        <Field label="Objetivos" value={(selectedUser.goals || []).join(', ') || '-'} />
                                    </div>
                                </div>

                                {/* Connections */}
                                {selectedUser.connections && (
                                    <div className="adm__ud-section">
                                        <h4><i className='bx bx-link' /> Conexiones</h4>
                                        <div className="adm__ud-connections">
                                            {['discord', 'riot', 'mlbb', 'steam', 'epic'].map(key => {
                                                const conn = getConnectionStatus(selectedUser.connections, key);
                                                if (!conn) return null;
                                                return (
                                                    <div key={key} className={`adm__ud-conn ${conn.ok ? 'adm__ud-conn--ok' : 'adm__ud-conn--pending'}`}>
                                                        <i className={`bx ${key === 'discord' ? 'bxl-discord-alt' : key === 'riot' ? 'bx-target-lock' : key === 'mlbb' ? 'bx-mobile' : key === 'steam' ? 'bxl-steam' : 'bx-game'}`} />
                                                        <div>
                                                            <strong>{key.toUpperCase()}</strong>
                                                            <span>{conn.label}</span>
                                                        </div>
                                                        <i className={`bx ${conn.ok ? 'bx-check-circle' : 'bx-time'}`} />
                                                    </div>
                                                );
                                            })}
                                            {!['discord', 'riot', 'mlbb', 'steam', 'epic'].some(k => getConnectionStatus(selectedUser.connections, k)) && (
                                                <span className="adm__ud-empty-text">Sin conexiones vinculadas</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Game Profiles */}
                                {selectedUser.gameProfiles && (
                                    <div className="adm__ud-section">
                                        <h4><i className='bx bx-trophy' /> Perfiles de Juego</h4>
                                        <div className="adm__ud-grid">
                                            {selectedUser.gameProfiles.lol?.exists && (
                                                <Field label="League of Legends" value={`Nivel ${selectedUser.gameProfiles.lol.summonerLevel || '?'} — ${selectedUser.gameProfiles.lol.rank?.tier || 'Unranked'} ${selectedUser.gameProfiles.lol.rank?.division || ''}`} />
                                            )}
                                            {selectedUser.gameProfiles.valorant?.exists && (
                                                <Field label="Valorant" value={`${selectedUser.gameProfiles.valorant.rank?.tier || 'Unranked'} — ${selectedUser.gameProfiles.valorant.rank?.rr || 0} RR`} />
                                            )}
                                            {selectedUser.gameProfiles.mlbb?.exists && (
                                                <Field label="Mobile Legends" value={`${selectedUser.gameProfiles.mlbb.ign || selectedUser.gameProfiles.mlbb.playerId} — ${selectedUser.gameProfiles.mlbb.verified ? 'Verificado' : selectedUser.gameProfiles.mlbb.verificationStatus}`} />
                                            )}
                                            {!selectedUser.gameProfiles.lol?.exists && !selectedUser.gameProfiles.valorant?.exists && !selectedUser.gameProfiles.mlbb?.exists && (
                                                <span className="adm__ud-empty-text">Sin perfiles de juego vinculados</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Social Links */}
                                {selectedUser.socialLinks && Object.values(selectedUser.socialLinks).some(v => v) && (
                                    <div className="adm__ud-section">
                                        <h4><i className='bx bx-world' /> Redes Sociales</h4>
                                        <div className="adm__ud-grid">
                                            {Object.entries(selectedUser.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                                                <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Social stats */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-user-plus' /> Social</h4>
                                    <div className="adm__ud-grid">
                                        <Field label="Seguidores" value={String((selectedUser.followers || []).length)} />
                                        <Field label="Siguiendo" value={String((selectedUser.following || []).length)} />
                                        <Field label="Amigos" value={String((selectedUser.friends || []).length)} />
                                        <Field label="Equipos" value={String((selectedUser.teams || []).length)} />
                                        <Field label="Bloqueados" value={String((selectedUser.blockedUsers || []).length)} />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="adm__ud-section">
                                    <h4><i className='bx bx-cog' /> Acciones</h4>
                                    <div className="adm__ud-action-row">
                                        {!selectedUser.isAdmin && (
                                            selectedUser.isBanned ? (
                                                <button className="adm__btn adm__btn--unban" disabled={!!actionLoading} onClick={() => handleBan(selectedUser._id, 'unban')}>
                                                    <i className='bx bx-lock-open' /> Desbanear
                                                </button>
                                            ) : (
                                                <button className="adm__btn adm__btn--ban" disabled={!!actionLoading} onClick={() => { setShowBanModal(selectedUser); setBanReasonInput(''); }}>
                                                    <i className='bx bx-block' /> Banear
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* Send notification */}
                                    <div className="adm__ud-notif">
                                        <label>Enviar Notificacion</label>
                                        <input
                                            className="adm__modal-input"
                                            placeholder="Titulo (opcional)"
                                            value={notifTitle}
                                            onChange={e => setNotifTitle(e.target.value)}
                                        />
                                        <textarea
                                            className="adm__ticket-textarea"
                                            placeholder="Mensaje de la notificacion..."
                                            value={notifMsg}
                                            onChange={e => setNotifMsg(e.target.value)}
                                            rows={3}
                                        />
                                        <button
                                            className="adm__btn adm__btn--approve"
                                            disabled={!notifMsg.trim() || !!actionLoading}
                                            onClick={() => handleSendNotification(selectedUser._id)}
                                        >
                                            <i className='bx bx-send' /> Enviar
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ BAN REASON MODAL ═══ */}
            {showBanModal && (
                <div className="adm__modal-overlay" onClick={() => setShowBanModal(null)} style={{ zIndex: 1100 }}>
                    <div className="adm__modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <button className="adm__modal-x" onClick={() => setShowBanModal(null)}><i className='bx bx-x' /></button>
                        <h3><i className='bx bx-block' style={{ color: '#ef4444' }} /> Banear a {showBanModal.username}</h3>
                        <div className="adm__modal-field">
                            <label>Razon del baneo</label>
                            <textarea
                                className="adm__ticket-textarea"
                                placeholder="Describe la razon del baneo..."
                                value={banReasonInput}
                                onChange={e => setBanReasonInput(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="adm__modal-actions">
                            <button
                                className="adm__btn adm__btn--ban"
                                disabled={!banReasonInput.trim() || !!actionLoading}
                                onClick={() => handleBan(showBanModal._id, 'ban', banReasonInput)}
                            >
                                <i className='bx bx-block' /> Confirmar Baneo
                            </button>
                            <button className="adm__modal-close" onClick={() => setShowBanModal(null)}>Cancelar</button>
                        </div>
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
