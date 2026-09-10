'use client';

import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { fetchApi, setAuthToken } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('candidate@astranex.defence');
  const [password, setPassword] = useState('candidate123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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

  const fillCandidateSeed = () => {
    setEmail('candidate@astranex.defence');
    setPassword('candidate123');
  };

  const fillAdminSeed = () => {
    setEmail('admin@astranex.defence');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen defence-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-defence-card border border-defence-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-defence-cyan/10 border border-defence-cyan/30 text-defence-cyan mb-2">
            <Shield className="w-8 h-8 animate-pulse" />
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-defence-text">
              SERVICE IDENTITY / EMAIL:
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
              ACCESS TOKEN / PASSWORD:
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
            <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE SESSION'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Seed Shortcuts */}
        <div className="pt-4 border-t border-defence-border space-y-2">
          <p className="text-[11px] font-mono text-defence-text text-center font-semibold">
            DEVELOPMENT DEMO ACCOUNTS:
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              onClick={fillCandidateSeed}
              className="bg-defence-sidebar hover:bg-defence-card border border-defence-border text-defence-heading p-2 rounded text-[11px] text-center transition"
            >
              Candidate Login
            </button>
            <button
              onClick={fillAdminSeed}
              className="bg-defence-sidebar hover:bg-defence-card border border-defence-border text-defence-amber p-2 rounded text-[11px] text-center transition"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
