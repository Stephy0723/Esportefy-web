import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICE_STATUS_ENDPOINTS } from '../../config/serviceStatus';
import { useLang } from '../../context/LanguageContext';
import './StatusPage.css';

const SERVICES = (t) => [
    { key: 'gameServers', label: t('stpServiceGameServers'), icon: 'bx-server', endpoint: SERVICE_STATUS_ENDPOINTS.gameServers },
    { key: 'tournamentApi', label: t('stpServiceTournamentApi'), icon: 'bx-trophy', endpoint: SERVICE_STATUS_ENDPOINTS.tournamentApi },
    { key: 'matchmaking', label: t('stpServiceMatchmaking'), icon: 'bx-target-lock', endpoint: SERVICE_STATUS_ENDPOINTS.matchmaking },
    { key: 'liveChat', label: t('stpServiceLiveChat'), icon: 'bx-chat', endpoint: SERVICE_STATUS_ENDPOINTS.liveChat },
];

const STATUS_MAP = (t) => ({
    operational: { label: t('stpStatusOperational'), color: '#00ff88', className: 'online' },
    degraded: { label: t('stpStatusDegraded'), color: '#ffd700', className: 'warning' },
    outage: { label: t('stpStatusOutage'), color: '#ef4444', className: 'offline' },
    checking: { label: t('stpStatusChecking'), color: '#4facfe', className: 'checking' },
});

const pingEndpoint = async (url) => {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        const latency = Date.now() - start;
        return { status: res.ok ? 'operational' : 'degraded', latency };
    } catch {
        return { status: 'outage', latency: null };
    }
};

const formatTime = (date) => date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const StatusPage = () => {
    const { t } = useLang();
    const services_list = SERVICES(t);
    const status_map = STATUS_MAP(t);

    const [services, setServices] = useState(
        Object.fromEntries(services_list.map(s => [s.key, { status: 'checking', latency: null }]))
    );
    const [lastChecked, setLastChecked] = useState(null);
    const [history, setHistory] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const intervalRef = useRef(null);

    const checkAll = useCallback(async () => {
        setServices(prev => {
            const next = {};
            for (const k of Object.keys(prev)) next[k] = { ...prev[k], status: 'checking' };
            return next;
        });

        const results = await Promise.all(
            services_list.map(async (s) => {
                const result = await pingEndpoint(s.endpoint);
                return [s.key, result];
            })
        );

        const now = new Date();
        const newServices = Object.fromEntries(results);
        setServices(newServices);
        setLastChecked(now);

        setHistory(prev => {
            const allOk = Object.values(newServices).every(v => v.status === 'operational');
            const hasOutage = Object.values(newServices).some(v => v.status === 'outage');
            const overall = hasOutage ? 'outage' : allOk ? 'operational' : 'degraded';
            const entry = { time: now, overall, details: { ...newServices } };
            return [entry, ...prev].slice(0, 30);
        });
    }, []);

    useEffect(() => {
        checkAll();
    }, [checkAll]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(checkAll, 30000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, checkAll]);

    const allStatuses = Object.values(services).map(s => s.status);
    const isChecking = allStatuses.some(s => s === 'checking');
    const hasOutage = allStatuses.some(s => s === 'outage');
    const allOk = allStatuses.every(s => s === 'operational');
    const overallStatus = isChecking ? 'checking' : hasOutage ? 'outage' : allOk ? 'operational' : 'degraded';
    const overallInfo = status_map[overallStatus];

    const overallLabel = isChecking
        ? t('stpCheckingAll')
        : allOk
            ? t('stpAllOk')
            : hasOutage
                ? t('stpSomeOutage')
                : t('stpSomeDegraded');

    const uptimePct = history.length > 0
        ? Math.round((history.filter(h => h.overall === 'operational').length / history.length) * 100)
        : null;

    return (
        <div className="stp">
            <div className="stp__wrapper">
                {/* Header */}
                <header className="stp__header">
                    <a href="/settings" className="stp__back">
                        <i className='bx bx-arrow-back'></i>
                    </a>
                    <div className="stp__header-text">
                        <h1>{t('stpTitle')}</h1>
                        <p>{t('stpSubtitle')}</p>
                    </div>
                </header>

                {/* Overall Banner */}
                <div className={`stp__banner stp__banner--${overallInfo.className}`}>
                    <div className={`stp__banner-dot stp__banner-dot--${overallInfo.className}`} />
                    <div className="stp__banner-info">
                        <strong>{overallLabel}</strong>
                        {lastChecked && (
                            <span>{t('stpLastChecked')} {formatTime(lastChecked)}</span>
                        )}
                    </div>
                    <div className="stp__banner-actions">
                        <label className="stp__auto-toggle">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={() => setAutoRefresh(p => !p)}
                            />
                            <span>{t('stpAutoLabel')}</span>
                        </label>
                        <button
                            className="stp__refresh-btn"
                            onClick={checkAll}
                            disabled={isChecking}
                        >
                            <i className={`bx bx-refresh ${isChecking ? 'stp__spin' : ''}`} />
                            {t('stpVerifyBtn')}
                        </button>
                    </div>
                </div>

                {/* Uptime bar */}
                {uptimePct !== null && (
                    <div className="stp__uptime">
                        <div className="stp__uptime-header">
                            <span>{t('stpUptimeRecent')}</span>
                            <strong>{uptimePct}%</strong>
                        </div>
                        <div className="stp__uptime-bar">
                            <div
                                className="stp__uptime-fill"
                                style={{ width: `${uptimePct}%` }}
                            />
                        </div>
                        <span className="stp__uptime-note">{t('stpUptimeNote').replace('{{n}}', history.length)}</span>
                    </div>
                )}

                {/* Services grid */}
                <section className="stp__services">
                    <h2>{t('stpServices')}</h2>
                    <div className="stp__services-grid">
                        {services_list.map(s => {
                            const data = services[s.key];
                            const info = status_map[data.status];
                            return (
                                <div key={s.key} className={`stp__service stp__service--${info.className}`}>
                                    <div className="stp__service-icon">
                                        <i className={`bx ${s.icon}`}></i>
                                    </div>
                                    <div className="stp__service-info">
                                        <span className="stp__service-name">{s.label}</span>
                                        <div className="stp__service-status">
                                            <span
                                                className={`stp__service-dot stp__service-dot--${info.className}`}
                                            />
                                            <span>{info.label}</span>
                                        </div>
                                    </div>
                                    {data.latency !== null && (
                                        <span className="stp__service-latency">{data.latency}ms</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* History timeline */}
                {history.length > 0 && (
                    <section className="stp__history">
                        <h2>{t('stpHistory')}</h2>
                        <div className="stp__history-list">
                            {history.map((entry, i) => {
                                const info = status_map[entry.overall];
                                return (
                                    <div key={i} className="stp__history-row">
                                        <span
                                            className={`stp__history-dot stp__history-dot--${info.className}`}
                                        />
                                        <span className="stp__history-time">{formatTime(entry.time)}</span>
                                        <span className="stp__history-label">{info.label}</span>
                                        <div className="stp__history-services">
                                            {SERVICES.map(s => {
                                                const d = entry.details[s.key];
                                                const sInfo = STATUS_MAP[d?.status || 'checking'];
                                                return (
                                                    <span
                                                        key={s.key}
                                                        className={`stp__history-pip stp__history-pip--${sInfo.className}`}
                                                        title={`${s.label}: ${sInfo.label}${d?.latency ? ` (${d.latency}ms)` : ''}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Info note */}
                <div className="stp__note">
                    <i className='bx bx-info-circle'></i>
                    <p>{t('stpNote')}</p>
                </div>

                {/* Footer */}
                <footer className="stp__footer">
                    <span>GLITCH GANG</span>
                    <span className="stp__footer-sep">·</span>
                    <span>{t('stpFooterStatus')}</span>
                    <span className="stp__footer-sep">·</span>
                    <a href="/settings">{t('stpBackToSettings')}</a>
                </footer>
            </div>
        </div>
    );
};

export default StatusPage;
