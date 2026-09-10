'use client';

import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { fetchApi, setAuthToken } from '../../lib/api';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { email, password, full_name: fullName } : { email, password };

      const res = await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setAuthToken(res.access_token);
      if (res.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/assessment';
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen defence-grid flex items-center justify-center p-4 relative">
      {/* Top Navigation Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-text hover:text-defence-cyan px-4 py-2 rounded-lg font-mono text-xs flex items-center space-x-2 transition shadow-lg"
        title="Navigate Back"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK</span>
      </button>

      <div className="w-full max-w-md bg-defence-card border border-defence-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-defence-sidebar border border-defence-border mb-2">
            <img
              src="/logo.jpg"
              alt="AstraNex Defence Logo"
              className="w-16 h-16 object-contain rounded-xl"
            />
          </div>
          <h1 className="font-mono text-2xl font-bold tracking-wider text-defence-heading">
            ASTRANEX CYBER RANGE
          </h1>
          <p className="font-mono text-xs text-defence-cyan tracking-widest uppercase font-semibold">
            &quot;Investigate. Exploit. Defend.&quot;
          </p>
          <p className="text-xs text-defence-text pt-1">
            AstraNex Defence Internal Technical Assessment Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-defence-sidebar p-1 rounded-xl border border-defence-border text-xs font-mono">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-bold transition ${!isRegister ? 'bg-defence-card text-defence-cyan border border-defence-cyan/40' : 'text-defence-text hover:text-defence-heading'}`}
          >
            CANDIDATE / ADMIN LOGIN
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-bold transition ${isRegister ? 'bg-defence-card text-defence-cyan border border-defence-cyan/40' : 'text-defence-text hover:text-defence-heading'}`}
          >
            NEW CANDIDATE REGISTRATION
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-defence-text">
                FULL NAME:
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-defence-text absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-defence-sidebar border border-defence-border rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-defence-heading focus:outline-none focus:border-defence-cyan"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-defence-text">
              SERVICE EMAIL / IDENTITY:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-defence-text absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-defence-sidebar border border-defence-border rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-defence-heading focus:outline-none focus:border-defence-cyan"
                placeholder="identity@astranex.defence"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-defence-text">
              ACCESS PASSWORD:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-defence-text absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-defence-sidebar border border-defence-border rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-defence-heading focus:outline-none focus:border-defence-cyan"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-defence-red/10 border border-defence-red/40 text-defence-red font-mono text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold py-3 rounded-lg text-sm transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'PROCESSING...' : isRegister ? 'REGISTER & START ASSESSMENT' : 'AUTHENTICATE SESSION'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
