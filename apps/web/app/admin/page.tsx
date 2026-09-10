'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Award, Clock, HelpCircle, Download, Trophy, Eye } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const dashData = await fetchApi('/admin/dashboard');
      setStats(dashData);

      const candData = await fetchApi('/admin/candidates');
      setCandidates(candData);
    } catch (err: any) {
      console.error(err);
      if (typeof window !== 'undefined') window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen defence-grid flex items-center justify-center font-mono text-sm text-defence-cyan">
        LOADING ASTRANEX ADMIN CONSOLE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-defence-bg text-defence-heading flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-defence-sidebar border-b border-defence-border px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-text hover:text-defence-cyan px-3 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
            title="Navigate Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          <div className="flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="AstraNex Defence Logo"
              className="w-8 h-8 object-contain rounded"
            />
            <div>
              <h1 className="font-mono text-base font-bold text-defence-heading">
                ASTRANEX DEFENCE // EVALUATION COMMAND CENTER
              </h1>
              <p className="text-[10px] font-mono text-defence-amber uppercase tracking-widest">
                ADMINISTRATION PORTAL // OP BLACKOUT
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/admin/leaderboard"
            className="bg-defence-card border border-defence-border hover:border-defence-amber text-defence-heading px-3.5 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
          >
            <Trophy className="w-3.5 h-3.5 text-defence-amber" />
            <span>LEADERBOARD</span>
          </a>

          <a
            href="/api/admin/export?format=csv"
            download
            className="bg-defence-amber hover:bg-defence-amber/80 text-black px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 fill-current" />
            <span>EXPORT CSV</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-defence-card border border-defence-border p-5 rounded-xl space-y-2 hud-border-cyan">
            <div className="flex items-center justify-between text-defence-text font-mono text-xs">
              <span>TOTAL CANDIDATES</span>
              <Users className="w-4 h-4 text-defence-cyan" />
            </div>
            <p className="font-mono text-3xl font-bold text-defence-cyan">{stats?.total_candidates || 0}</p>
            <p className="text-[11px] font-mono text-defence-text">
              Active: {stats?.active_candidates || 0} | Completed: {stats?.completed_candidates || 0}
            </p>
          </div>

          <div className="bg-defence-card border border-defence-border p-5 rounded-xl space-y-2 hud-border-amber">
            <div className="flex items-center justify-between text-defence-text font-mono text-xs">
              <span>AVERAGE SCORE</span>
              <Award className="w-4 h-4 text-defence-amber" />
            </div>
            <p className="font-mono text-3xl font-bold text-defence-amber">{stats?.average_score || 0} / 100</p>
            <p className="text-[11px] font-mono text-defence-text">Based on completed attempts</p>
          </div>

          <div className="bg-defence-card border border-defence-border p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-defence-text font-mono text-xs">
              <span>AVG COMPLETION TIME</span>
              <Clock className="w-4 h-4 text-defence-green" />
            </div>
            <p className="font-mono text-3xl font-bold text-defence-green">{stats?.average_completion_time_minutes || 0} MINS</p>
            <p className="text-[11px] font-mono text-defence-text">Server authoritative timing</p>
          </div>

          <div className="bg-defence-card border border-defence-border p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-defence-text font-mono text-xs">
              <span>AVG HINTS USED</span>
              <HelpCircle className="w-4 h-4 text-defence-purple" />
            </div>
            <p className="font-mono text-3xl font-bold text-defence-purple">{stats?.average_hints_used || 0}</p>
            <p className="text-[11px] font-mono text-defence-text">Hints per candidate attempt</p>
          </div>
        </div>

        {/* Candidate Evaluation Table */}
        <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-defence-border">
            <h2 className="font-mono text-sm font-bold text-defence-heading">
              CANDIDATE ASSESSMENT EVALUATION LIST
            </h2>
            <span className="text-xs font-mono text-defence-text">
              {candidates.length} CANDIDATES REGISTERED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-defence-sidebar text-defence-text border-b border-defence-border">
                <tr>
                  <th className="px-4 py-3">CANDIDATE</th>
                  <th className="px-4 py-3">EMAIL</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">SCORE</th>
                  <th className="px-4 py-3">PROGRESS</th>
                  <th className="px-4 py-3">DURATION</th>
                  <th className="px-4 py-3">HINTS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-defence-border/40">
                {candidates.map((c) => {
                  let statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (c.status === 'SUBMITTED') statusBadge = 'bg-defence-green/10 text-defence-green border-defence-green/30';
                  if (c.status === 'IN_PROGRESS') statusBadge = 'bg-defence-cyan/10 text-defence-cyan border-defence-cyan/30 animate-pulse';

                  return (
                    <tr key={c.candidate_id} className="hover:bg-defence-sidebar/60 transition">
                      <td className="px-4 py-3 font-bold text-defence-heading">{c.full_name}</td>
                      <td className="px-4 py-3 text-defence-text">{c.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase ${statusBadge}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-defence-amber font-bold">{c.total_score} PTS</td>
                      <td className="px-4 py-3 text-defence-cyan font-bold">{c.stages_completed} / 8 STAGES</td>
                      <td className="px-4 py-3 text-defence-text">{c.duration_minutes ? `${c.duration_minutes}m` : '--'}</td>
                      <td className="px-4 py-3 text-defence-text">{c.hints_used}</td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/admin/candidates/${c.candidate_id}`}
                          className="bg-defence-sidebar border border-defence-border hover:border-defence-cyan text-defence-cyan px-3 py-1 rounded text-[11px] inline-flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>REVIEW</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
