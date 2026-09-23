'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      toast.error('Masukkan password admin.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || 'Unauthorized');
      }
      toast.success('Login berhasil.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : 'Password salah atau tidak diizinkan.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-between px-4 py-8 login-screen-wrap"
      style={{ background: 'var(--brutal-bg)', color: 'var(--text-primary)' }}
    >
      <div className="login-bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="hero-grid" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', zIndex: 2 }}>
        <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
          <div className="brutal-card-lg admin-login-card" style={{ padding: '36px 30px', textAlign: 'center' }}>
            <div className="login-logo-header">
              <div className="login-logo-icon">
                <svg className="w-11 h-11 mx-auto" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C9.5 6 9 9.5 9 12c0 2.5 1.5 4.5 3 5 1.5-.5 3-2.5 3-5 0-2.5-.5-6-3-10z" fill="#F472B6" />
                  <path d="M8.5 7.5C6 10 5 13 6 15c1 2 3.5 2.5 5 1.5-1-1.5-1.5-4-2.5-9z" fill="#A78BFA" opacity="0.8" />
                  <path d="M15.5 7.5c2.5 2.5 3.5 5.5 2.5 7.5-1 2-3.5 2.5-5 1.5 1-1.5 1.5-4 2.5-9z" fill="#22D3EE" opacity="0.8" />
                </svg>
              </div>
              <h2 className="login-logo-title">VAULTMAIL</h2>
              <p className="login-logo-subtitle">TEMPORARY EMAIL SYSTEM</p>
            </div>

            <div className="login-welcome-block">
              <h1 className="login-welcome-title" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
                Selamat Datang!
              </h1>
              <p className="login-welcome-subtitle" style={{ fontSize: '0.82rem', marginBottom: 22 }}>
                Masuk untuk mengelola dashboard admin Anda.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="login-field-wrap">
                <label className="login-field-label">PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="brutal-input login-input"
                    style={{ width: '100%', padding: '13px 44px 13px 14px', fontSize: '0.9rem', outline: 'none' }}
                    placeholder="Masukkan password admin"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !loading) handleLogin();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="toggle-pass-btn"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="login-submit-btn"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: 'var(--brutal-accent)',
                  color: 'var(--brutal-on-accent)',
                  border: '2px solid var(--ink)',
                  borderRadius: 12,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  boxShadow: 'var(--brutal-shadow)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Masuk'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="login-footer" style={{ zIndex: 2, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        © Made By Yasir | VaultMail
      </footer>
    </main>
  );
}