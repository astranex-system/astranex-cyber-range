'use client';

import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function LandingPage() {
  const [assessment, setAssessment] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const assData = await fetchApi('/assessment');
      setAssessment(assData);

      const attData = await fetchApi('/assessment/attempt').catch(() => null);
      setAttempt(attData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartMission = async () => {
    try {
      await fetchApi('/assessment/start', { method: 'POST' });
      window.location.href = '/assessment';
    } catch (err: any) {
      alert(err.message || 'Error starting assessment.');
    }
  };

  return (
    <main className="min-h-screen defence-grid p-6 flex flex-col justify-between max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-4 pb-6 border-b border-defence-border">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="AstraNex Defence Logo"
            className="w-10 h-10 object-contain rounded"
          />
          <div>
            <h1 className="font-mono text-xl font-bold tracking-widest text-defence-heading">
              ASTRANEX CYBER RANGE
            </h1>
            <p className="font-mono text-xs text-defence-cyan tracking-wider">
              &quot;Investigate. Exploit. Defend.&quot;
            </p>
          </div>
        </div>

        <a
          href="/login"
          className="bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-heading px-4 py-2 rounded-lg font-mono text-xs transition"
        >
          SESSION LOGIN
        </a>
      </header>

      {/* Hero Briefing Card */}
      <section className="bg-defence-card border border-defence-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-defence-border pb-4">
          <div>
            <span className="text-[11px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2.5 py-1 rounded">
              OPERATION BLACKOUT // INCIDENT EVALUATION
            </span>
            <h2 className="font-mono text-2xl font-bold text-defence-heading mt-2">
              AstraNex UGV AX-07 Incident Investigation
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-defence-amber bg-defence-amber/10 border border-defence-amber/30 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>HIGH SEVERITY INCIDENT</span>
          </div>
        </div>

        <p className="text-sm text-defence-text leading-relaxed font-sans">
          Security monitoring has detected anomalous communication, unauthorized telemetry modifications, and suspicious API commands issuing from AstraNex Autonomous Unmanned Ground Vehicle <strong className="text-defence-heading">AX-07</strong>. You are assigned as lead cybersecurity engineer to investigate the compromise, determine the full attack path, recover evidence, and secure the system.
        </p>

        {/* Candidate & Attempt Stats */}
        {attempt && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl font-mono">
              <span className="text-[10px] text-defence-text">CANDIDATE</span>
              <p className="text-sm font-bold text-defence-heading truncate">{attempt.candidate_name}</p>
            </div>

            <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl font-mono">
              <span className="text-[10px] text-defence-text">PROGRESS</span>
              <p className="text-sm font-bold text-defence-cyan">{attempt.current_stage_order} / 8 STAGES</p>
            </div>

            <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl font-mono">
              <span className="text-[10px] text-defence-text">TOTAL SCORE</span>
              <p className="text-sm font-bold text-defence-amber">{attempt.total_score} / 100 PTS</p>
            </div>

            <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl font-mono">
              <span className="text-[10px] text-defence-text">ASSESSMENT STATUS</span>
              <p className="text-sm font-bold text-defence-green uppercase">{attempt.status}</p>
            </div>
          </div>
        )}

        {/* Mission Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl space-y-2">
            <h3 className="font-bold text-defence-cyan text-sm">INCIDENT METADATA</h3>
            <p><span className="text-defence-text">Incident ID:</span> ASTRA-INC-AX07-0926</p>
            <p><span className="text-defence-text">Target Asset:</span> UGV AX-07 (Autonomous)</p>
            <p><span className="text-defence-text">Environment:</span> Remote Operational Zone</p>
            <p><span className="text-defence-text">Duration:</span> 90 Minutes (Server Authoritative)</p>
          </div>

          <div className="bg-defence-sidebar border border-defence-border p-4 rounded-xl space-y-2">
            <h3 className="font-bold text-defence-cyan text-sm">EVALUATION DOMAINS</h3>
            <p className="text-defence-text">• Reconnaissance & Web/API Security</p>
            <p className="text-defence-text">• Authentication & Authorization Flaws</p>
            <p className="text-defence-text">• Log Forensics & PCAP Network Traffic</p>
            <p className="text-defence-text">• Malware De-obfuscation & Secure Coding</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleStartMission}
            className="bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold px-10 py-4 rounded-xl text-base transition flex items-center space-x-3 shadow-xl hud-border-cyan"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{attempt ? '[ CONTINUE MISSION ]' : '[ BEGIN MISSION ]'}</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center font-mono text-xs text-defence-text/60 py-4 border-t border-defence-border">
        ASTRANEX DEFENCE // CYBER ENGINEERING ASSESSMENT SYSTEM v2.4
      </footer>
    </main>
  );
}
