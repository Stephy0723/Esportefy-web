import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';

const parseFragment = (hash = '') => {
  const raw = String(hash || '').startsWith('#') ? String(hash || '').slice(1) : String(hash || '');
  return new URLSearchParams(raw);
};

export default function SteamOAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Procesando autorización de Steam...');
  const [details, setDetails] = useState('Validando el token y vinculando la cuenta en Esportefy.');

  useEffect(() => {
    let active = true;

    const finalizeSteamLink = async () => {
      const fragment = parseFragment(window.location.hash);
      const accessToken = String(fragment.get('access_token') || '').trim();
      const state = String(fragment.get('state') || '').trim();
      const providerError = String(fragment.get('error') || '').trim();
      const providerErrorDescription = String(fragment.get('error_description') || '').trim();

      if (providerError) {
        navigate(
          `/settings?oauthProvider=steam&oauthStatus=error&oauthMessage=${encodeURIComponent(providerErrorDescription || 'Steam canceló la autorización.')}`,
          { replace: true }
        );
        return;
      }

      if (!accessToken || !state) {
        navigate(
          `/settings?oauthProvider=steam&oauthStatus=error&oauthMessage=${encodeURIComponent('Callback inválido de Steam.')}`,
          { replace: true }
        );
        return;
      }

      try {
        await axios.post(`${API_URL}/api/auth/steam/finalize`, {
          accessToken,
          state
        });

        if (!active) return;
        window.dispatchEvent(new Event('user-update'));
        setStatus('Steam conectado');
        setDetails('La cuenta se vinculó correctamente. Redirigiendo a ajustes...');

        window.setTimeout(() => {
          navigate('/settings?oauthProvider=steam&oauthStatus=connected', { replace: true });
        }, 600);
      } catch (error) {
        const message = error?.response?.data?.message || 'No se pudo completar la vinculación con Steam.';
        navigate(
          `/settings?oauthProvider=steam&oauthStatus=error&oauthMessage=${encodeURIComponent(message)}`,
          { replace: true }
        );
      }
    };

    finalizeSteamLink();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at top, rgba(29, 78, 216, 0.18), transparent 38%), #05070d',
        color: '#f8fafc',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          background: 'rgba(8, 12, 24, 0.92)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.38)',
          padding: '32px'
        }}
      >
        <p style={{ margin: 0, color: '#7dd3fc', letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>
          Steam OAuth
        </p>
        <h1 style={{ margin: '16px 0 12px', fontSize: '40px', lineHeight: 1.05 }}>
          {status}
        </h1>
        <p style={{ margin: 0, color: 'rgba(248,250,252,0.74)', fontSize: '16px', lineHeight: 1.6 }}>
          {details}
        </p>
      </div>
    </div>
  );
}
