import React, { useState, useEffect } from 'react';
import { ArrowLeft, Radio, Clock, UserCheck, LogOut, Award } from 'lucide-react';
import { removeAuthToken } from '../lib/api';

interface HUDHeaderProps {
  candidateName?: string;
  currentStageName?: string;
  remainingSeconds?: number;
  expiresAt?: string;
  totalScore?: number;
  attemptStatus?: string;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  candidateName = 'Operative',
  currentStageName = 'STAGE 0 - BRIEFING',
  remainingSeconds = 5400,
  expiresAt,
  totalScore = 0,
  attemptStatus = 'IN_PROGRESS'
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(remainingSeconds);

  // Sync state when props change
  useEffect(() => {
    if (expiresAt) {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setSecondsLeft(diff);
    } else {
      setSecondsLeft(remainingSeconds);
    }
  }, [remainingSeconds, expiresAt]);

  // Continuous real-time 1-second interval ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (expiresAt) {
        const targetTime = new Date(expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
        setSecondsLeft(diff);
      } else {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <header className="bg-defence-sidebar border-b border-defence-border px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-text hover:text-defence-cyan px-2.5 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
          title="Navigate Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">BACK</span>
        </button>

        {/* Logo & Title */}
        <div className="bg-defence-card px-3 py-1.5 rounded border border-defence-border flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="AstraNex Defence Logo"
            className="w-7 h-7 object-contain rounded"
          />
          <div>
            <h1 className="font-mono font-bold text-xs tracking-wider text-defence-heading">
              ASTRANEX DEFENCE
            </h1>
            <p className="text-[9px] font-mono text-defence-cyan uppercase tracking-widest">
              CYBER RANGE // OP BLACKOUT
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-defence-card/60 rounded border border-defence-border/80">
          <Radio className="w-4 h-4 text-defence-amber animate-spin" style={{ animationDuration: '4s' }} />
          <div className="text-xs font-mono">
            <span className="text-defence-text">ASSET: </span>
            <span className="text-defence-heading font-semibold">UGV AX-07</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-defence-card/90 px-3 py-1.5 rounded border border-defence-border">
          <Clock className="w-4 h-4 text-defence-cyan" />
          <span className="text-xs font-mono text-defence-text hidden sm:inline">ELAPSED:</span>
          <span className="font-mono text-xs font-bold text-defence-cyan">
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-defence-card/90 px-3 py-1.5 rounded border border-defence-border">
          <Award className="w-4 h-4 text-defence-amber" />
          <span className="text-xs font-mono text-defence-text hidden sm:inline">SCORE:</span>
          <span className="font-mono text-xs font-bold text-defence-amber">
            {totalScore} / 100 PTS
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-defence-heading">
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
