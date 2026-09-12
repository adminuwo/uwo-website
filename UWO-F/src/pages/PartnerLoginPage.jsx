import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/api';

export default function PartnerLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { partnerToken, partnerUser, loginPartner } = useAuth();

  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    if (partnerToken) {
      navigate('/partner-dashboard');
    }
  }, [partnerToken, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ text: 'Email and password required', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const result = await loginPartner(email, password);
      if (result.success) {
        setMessage({ text: 'Access Granted. Loading dashboard...', type: 'success' });
        setTimeout(() => {
          navigate('/partner-dashboard');
        }, 1000);
      } else {
        setMessage({ text: 'Login Failed: ' + (result.message || 'Invalid credentials'), type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable. Please check connection.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setMessage({ text: 'All marked fields (*) are required', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/affiliate/partner/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: data.message || 'Registration request submitted! Pending approval.',
          type: 'success'
        });
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setTimeout(() => {
          setIsRegister(false);
          setMessage({ text: 'Please sign in with your approved credentials.', type: 'info' });
        }, 2500);
      } else {
        setMessage({ text: data.message || 'Registration failed', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server unreachable. Please check connection.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 20px 60px',
        background: '#050811',
        position: 'relative',
        overflow: 'hidden',
        color: '#f1f5f9'
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(214, 165, 89, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            background: 'rgba(11, 17, 32, 0.85)',
            backdropFilter: 'blur(25px)',
            border: '1.5px solid rgba(214, 165, 89, 0.25)',
            borderRadius: '32px',
            padding: '45px 35px',
            boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8)',
            textAlign: 'center'
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: 'rgba(214, 165, 89, 0.1)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(214, 165, 89, 0.3)',
              textDecoration: 'none'
            }}
          >
            <img src="/images/uwo-logo.png" alt="UWO Logo" style={{ width: '50px', height: 'auto' }} />
          </Link>

          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>
            {isRegister ? 'JOIN SALES NETWORK' : 'SALES PARTNER PORTAL'}
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '30px'
            }}
          >
            {isRegister ? 'Authorized Distributor Registration' : 'Unified Web Options & Services'}
          </p>

          {/* Feedback message */}
          {message.text && (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13px',
                fontWeight: 600,
                background:
                  message.type === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : message.type === 'success'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(214, 165, 89, 0.15)',
                color:
                  message.type === 'error'
                    ? '#f87171'
                    : message.type === 'success'
                    ? '#4ade80'
                    : '#D6A559',
                border: `1px solid ${
                  message.type === 'error'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : message.type === 'success'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(214, 165, 89, 0.3)'
                }`
              }}
            >
              {message.text}
            </div>
          )}

          {!isRegister ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Partner Email
                </label>
                <div style={{ position: 'relative' }}>
                  <i
                    className="fa-regular fa-envelope"
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(214, 165, 89, 0.6)'
                    }}
                  ></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@domain.com"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '14px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <i
                    className="fa-solid fa-lock"
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(214, 165, 89, 0.6)'
                    }}
                  ></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 44px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '14px',
                      color: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <i
                    className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  ></i>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 10px 25px rgba(214, 165, 89, 0.3)'
                }}
              >
                {loading ? 'Signing In...' : 'Sign In to Portal'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: '#94a3b8' }}>
                Don’t have a partner account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setMessage({ text: '', type: '' });
                  }}
                  style={{ background: 'none', border: 'none', color: '#D6A559', fontWeight: 700, cursor: 'pointer' }}
                >
                  Apply Here
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Official Representative Name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Business Email *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="corporate@domain.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#D6A559',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '8px'
                  }}
                >
                  Password *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D6A559, #FABE56)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {loading ? 'Submitting...' : 'Register as Partner'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setMessage({ text: '', type: '' });
                  }}
                  style={{ background: 'none', border: 'none', color: '#D6A559', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
