'use client';

import React from 'react';
import { Shield, Radio, Clock, UserCheck, LogOut, Award } from 'lucide-react';
import { removeAuthToken } from '../lib/api';

interface HUDHeaderProps {
  candidateName?: string;
  currentStageName?: string;
  remainingSeconds?: number;
  totalScore?: number;
  attemptStatus?: string;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  candidateName = 'John Doe',
  currentStageName = 'STAGE 0 - BRIEFING',
  remainingSeconds = 5400,
  totalScore = 0,
  attemptStatus = 'IN_PROGRESS'
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  return (
    <header className="bg-defence-sidebar border-b border-defence-border px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="bg-defence-card p-2 rounded border border-defence-border flex items-center space-x-2">
          <Shield className="w-6 h-6 text-defence-cyan animate-pulse" />
          <div>
            <h1 className="font-mono font-bold text-sm tracking-wider text-defence-heading">
              ASTRANEX DEFENCE
            </h1>
            <p className="text-[10px] font-mono text-defence-cyan uppercase tracking-widest">
              CYBER RANGE // OP BLACKOUT
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-defence-card/60 rounded border border-defence-border/80">
          <Radio className="w-4 h-4 text-defence-amber animate-spin" style={{ animationDuration: '4s' }} />
          <div className="text-xs font-mono">
            <span className="text-defence-text">TARGET ASSET: </span>
            <span className="text-defence-heading font-semibold">UGV AX-07</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-defence-card/90 px-3 py-1.5 rounded border border-defence-border">
          <Clock className="w-4 h-4 text-defence-cyan" />
          <span className="text-xs font-mono text-defence-text">ELAPSED:</span>
          <span className="font-mono text-sm font-bold text-defence-cyan">
            {formatTime(remainingSeconds)}
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-defence-card/90 px-3 py-1.5 rounded border border-defence-border">
          <Award className="w-4 h-4 text-defence-amber" />
          <span className="text-xs font-mono text-defence-text">SCORE:</span>
          <span className="font-mono text-sm font-bold text-defence-amber">
            {totalScore} / 100 PTS
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-defence-heading">
          <UserCheck className="w-4 h-4 text-defence-green" />
          <span>{candidateName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-defence-text hover:text-defence-red p-1.5 rounded hover:bg-defence-card transition"
          title="Logout Assessment Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
