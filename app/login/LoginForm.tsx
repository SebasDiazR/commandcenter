'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Incorrect password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — Photo Panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] relative overflow-hidden flex-col">

        {/* Hero image via Next.js Image (fills the panel) */}
        <Image
          src="/login-bg.jpg"
          alt="HKS architectural project"
          fill
          priority
          quality={90}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />

        {/* Top-left — HKS logo */}
        <div className="relative z-10 p-10">
          <Image
            src="/hks-logo.png"
            alt="HKS"
            width={72}
            height={28}
            style={{ objectFit: 'contain', objectPosition: 'left' }}
            priority
          />
        </div>

        {/* Bottom caption */}
        <div className="relative z-10 mt-auto p-10">
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              padding: '16px 22px',
              maxWidth: 400,
            }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              Building the future<br />of Texas higher education.
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                marginTop: 8,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              BD Command Center · FY 2026–2030
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form Panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white relative">

        {/* Top accent line */}
        <div className="h-[3px] w-full bg-gradient-to-r from-gray-900 via-gray-400 to-gray-100" />

        {/* Mobile header */}
        <div className="lg:hidden px-8 pt-8 pb-2 flex items-center gap-3">
          <Image src="/hks-logo.png" alt="HKS" width={56} height={22} style={{ objectFit: 'contain' }} />
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[340px]">

            {/* Heading */}
            <div className="mb-10">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
                Internal Access
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', color: '#0f0f0f', lineHeight: 1.2, margin: 0 }}>
                BD Command<br />Center
              </h1>
              <p style={{ marginTop: 10, fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                Texas Higher Education Pipeline<br />FY 2026–2030
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f0f0f0', marginBottom: 28 }} />

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}
                >
                  Password
                </label>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 16px',
                      fontSize: 14,
                      color: '#111',
                      background: '#fafafa',
                      border: error ? '1.5px solid #ef4444' : '1.5px solid #e8e8e8',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.15s, background 0.15s',
                      letterSpacing: '0.05em',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.background = '#fff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#e8e8e8'; e.currentTarget.style.background = '#fafafa'; }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#ccc', display: 'flex', alignItems: 'center' }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {error && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  marginTop: 8,
                  borderRadius: 10,
                  border: 'none',
                  background: password && !loading ? '#0f0f0f' : '#e0e0e0',
                  color: password && !loading ? '#fff' : '#bbb',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: password && !loading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => { if (password && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#333'; }}
                onMouseLeave={(e) => { if (password && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#0f0f0f'; }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Verifying…
                  </>
                ) : (
                  <>
                    Enter Dashboard
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#ccc' }}>© {new Date().getFullYear()} HKS Inc.</span>
              <span style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.05em' }}>CONFIDENTIAL</span>
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
