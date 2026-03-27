import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';

const cardStyle = {
  width: 'min(560px, 92vw)',
  background: '#ffffff',
  border: '1px solid rgba(17, 24, 39, 0.08)',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.12)'
};

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, success: false, message: 'Verificando tu correo...' });

  useEffect(() => {
    const token = String(searchParams.get('token') || '').trim();

    if (!token) {
      setState({ loading: false, success: false, message: 'El enlace de verificacion es invalido o esta incompleto.' });
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/email/verify`, { token });
        setState({
          loading: false,
          success: true,
          message: res.data?.message || 'Tu correo fue verificado correctamente.'
        });
        window.dispatchEvent(new Event('user-update'));
      } catch (error) {
        setState({
          loading: false,
          success: false,
          message: error.response?.data?.message || 'No se pudo verificar el correo.'
        });
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}
    >
      <div style={cardStyle}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 999,
            background: state.success ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
            color: state.success ? '#15803d' : '#1d4ed8',
            fontWeight: 700,
            fontSize: 13
          }}
        >
          {state.loading ? 'Procesando' : state.success ? 'Correo verificado' : 'Verificacion de correo'}
        </span>

        <h1 style={{ margin: '18px 0 12px', fontSize: '2rem', color: '#0f172a' }}>
          {state.loading ? 'Validando enlace' : state.success ? 'Correo confirmado' : 'No pudimos verificarlo'}
        </h1>

        <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
          {state.message}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          <Link
            to={state.success ? '/settings' : '/login'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 160,
              padding: '12px 18px',
              borderRadius: 12,
              background: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            {state.success ? 'Ir a settings' : 'Ir a login'}
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 160,
              padding: '12px 18px',
              borderRadius: 12,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              color: '#111827',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
