import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, loading } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (digit) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('En az 4 haneli PIN girin');
      return;
    }
    try {
      await login(pin);
    } catch (err) {
      setError(err.message || 'Geçersiz PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>

      <div className="login-container animate-scale-in">
        <div className="login-header">
          <div className="login-logo">🍽️</div>
          <h1 className="login-title">RestoPos</h1>
          <p className="login-subtitle">Restoran Yönetim Sistemi</p>
        </div>

        <div className={`login-pin-display ${shake ? 'shake' : ''}`}>
          <div className="pin-dots">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''} ${i === pin.length - 1 ? 'latest' : ''}`}
              />
            ))}
          </div>
          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              className="pin-btn pin-digit"
              onClick={() => handleDigit(String(digit))}
              disabled={loading}
            >
              {digit}
            </button>
          ))}
          <button className="pin-btn pin-action" onClick={handleClear} disabled={loading}>
            C
          </button>
          <button
            className="pin-btn pin-digit"
            onClick={() => handleDigit('0')}
            disabled={loading}
          >
            0
          </button>
          <button className="pin-btn pin-action pin-delete" onClick={handleDelete} disabled={loading}>
            ⌫
          </button>
        </div>

        <button
          className="btn btn-primary btn-lg login-submit"
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
        >
          {loading ? '⏳ Giriş yapılıyor...' : '🔓 Giriş Yap'}
        </button>

        <div className="login-hint">
          PIN kodunuzu girerek sisteme giriş yapın
        </div>
      </div>
    </div>
  );
}
