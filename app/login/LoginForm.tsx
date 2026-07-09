'use client';

import { useState, FormEvent, useEffect } from 'react';
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
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Stagger mount so CSS entry animations fire after hydration
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) {
        setSuccess(true);
        // Let the success animation play before navigating
        setTimeout(() => {
          router.push(from);
          router.refresh();
        }, 900);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Incorrect password.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Network error. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      {/* ── LEFT — Photo Panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] flex-col" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Hero image with Ken Burns zoom */}
        <div style={{ position: 'absolute', inset: 0, animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <Image
            src="/login-bg.jpg"
            alt="HKS architectural project"
            fill
            priority
            quality={90}
            style={{ objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" style={{ zIndex: 1 }} />

        {/* Floating orbs for depth */}
        <div style={{
          position: 'absolute', zIndex: 2, inset: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
            top: '15%', left: '20%',
            animation: 'floatOrb1 12s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            bottom: '25%', right: '18%',
            animation: 'floatOrb2 9s ease-in-out infinite',
          }} />
        </div>

        {/* Top-left — HKS logo */}
        <div className="relative p-10" style={{ zIndex: 10, animation: mounted ? 'fadeSlideDown 0.7s ease forwards' : 'none', opacity: 0, animationDelay: '0.1s' }}>
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
        <div className="mt-auto p-10" style={{ position: 'relative', zIndex: 10, animation: mounted ? 'fadeSlideUp 0.8s ease forwards' : 'none', opacity: 0, animationDelay: '0.3s' }}>
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
            <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.35, margin: 0 }}>
              Building the future<br />of higher education.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 8, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 500 }}>
              BD Command Center · FY 2026–2030
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form Panel ───────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col bg-white"
        style={{
          position: 'relative', zIndex: 1,
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          opacity: success ? 0 : 1,
          transform: success ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {/* Animated top accent line */}
        <div style={{ height: 3, width: '100%', background: 'linear-gradient(90deg, #0f0f0f, #888, #e0e0e0)', backgroundSize: '200% 100%', animation: 'shimmerBar 3s ease-in-out infinite' }} />

        {/* Mobile header */}
        <div className="lg:hidden px-8 pt-8 pb-2 flex items-center gap-3" style={{ animation: mounted ? 'fadeSlideDown 0.6s ease forwards' : 'none', opacity: 0 }}>
          <Image src="/hks-logo.png" alt="HKS" width={56} height={22} style={{ objectFit: 'contain' }} />
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[340px]">

            {/* Heading */}
            <div className="mb-10" style={{ animation: mounted ? 'fadeSlideUp 0.6s ease forwards' : 'none', opacity: 0, animationDelay: '0.05s' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
                Internal Access
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', color: '#0f0f0f', lineHeight: 1.2, margin: 0 }}>
                BD Command<br />Center
              </h1>
              <p style={{ marginTop: 10, fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                Higher Education Pipeline<br />FY 2026–2030
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f0f0f0', marginBottom: 28, animation: mounted ? 'expandWidth 0.6s ease forwards' : 'none', transformOrigin: 'left', transform: 'scaleX(0)', animationDelay: '0.2s' }} />

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ animation: mounted ? 'fadeSlideUp 0.6s ease forwards' : 'none', opacity: 0, animationDelay: '0.25s' }}>
              <div className="mb-4" style={{ animation: shake ? 'shake 0.5s ease' : 'none' }}>
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
                      outline: '2px solid transparent',
                      transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                      letterSpacing: '0.05em',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#111';
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,15,15,0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = error ? '#ef4444' : '#e8e8e8';
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#ccc', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? (
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                <div aria-live="polite" style={{ minHeight: 20 }}>
                  {error && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444', fontWeight: 500, animation: 'fadeSlideUp 0.3s ease' }}>
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="login-btn"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  marginTop: 8,
                  borderRadius: 10,
                  border: '1.5px solid #0f0f0f',
                  background: loading || !password ? '#fff' : '#0f0f0f',
                  color: loading || !password ? '#0f0f0f' : '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: loading || !password ? 'default' : 'pointer',
                  transition: 'background 0.15s, color 0.15s, transform 0.1s, box-shadow 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#333';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#0f0f0f';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px) scale(1)';
                  }
                }}
              >
                {/* Shimmer sweep overlay */}
                {!loading && password && (
                  <span aria-hidden="true" style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'buttonShimmer 2.2s ease-in-out infinite',
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                  }} />
                )}
                {loading ? (
                  <>
                    <span aria-hidden="true" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Verifying…
                  </>
                ) : (
                  <>
                    Enter
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s' }}>
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Success overlay */}
            {success && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: '#0f0f0f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'checkDraw 0.4s ease 0.15s both' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#333', letterSpacing: '0.02em', animation: 'fadeSlideUp 0.4s ease 0.2s both', opacity: 0 }}>
                    Signing you in…
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: mounted ? 'fadeIn 0.8s ease forwards' : 'none', opacity: 0, animationDelay: '0.4s' }}>
              <span suppressHydrationWarning style={{ fontSize: 11, color: '#ccc' }}>© {new Date().getFullYear()} HKS Inc.</span>
              <span style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.05em' }}>CONFIDENTIAL</span>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes kenBurns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.08) translate(-1%, -1%); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes expandWidth {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @keyframes shimmerBar {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes buttonShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-4px); }
          60%       { transform: translateX(4px); }
          75%       { transform: translateX(-2px); }
          90%       { transform: translateX(2px); }
        }

        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(12px, -18px) scale(1.04); }
        }

        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-10px, 14px) scale(0.97); }
        }

        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        @keyframes checkDraw {
          from { stroke-dasharray: 28; stroke-dashoffset: 28; }
          to   { stroke-dasharray: 28; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
