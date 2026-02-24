import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PageHud.css';

const PageHud = ({ page }) => {
    const { user } = useAuth();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    const username = user?.username || 'Jugador';
    const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="ph__strip">
            <div className="ph__left">
                <span className="ph__dot" />
                <span>{page}</span>
                <span className="ph__sep">/</span>
                <span>{username.toUpperCase()}</span>
            </div>
            <div className="ph__right">
                <span>{timeStr}</span>
                <span className="ph__sep">|</span>
                <span>{dateStr}</span>
            </div>
        </div>
    );
};

export default PageHud;
