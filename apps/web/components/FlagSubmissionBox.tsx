'use client';

import React, { useState } from 'react';
import { Flag, Send, HelpCircle, CheckCircle2, AlertTriangle, ShieldAlert, Award } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface FlagSubmissionBoxProps {
  challengeId: number;
  maxPoints: number;
  hint1Available?: boolean;
  hint2Available?: boolean;
  hint3Available?: boolean;
  hint1Unlocked?: boolean;
  hint2Unlocked?: boolean;
  hint3Unlocked?: boolean;
  hint1Text?: string;
  hint2Text?: string;
  hint3Text?: string;
  onSuccess: () => void;
}

export const FlagSubmissionBox: React.FC<FlagSubmissionBoxProps> = ({
  challengeId,
  maxPoints,
  hint1Available,
  hint2Available,
  hint3Available,
  hint1Unlocked,
  hint2Unlocked,
  hint3Unlocked,
  hint1Text,
  hint2Text,
  hint3Text,
  onSuccess
}) => {
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [h1, setH1] = useState<string | null>(hint1Text || null);
  const [h2, setH2] = useState<string | null>(hint2Text || null);
  const [h3, setH3] = useState<string | null>(hint3Text || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetchApi(`/challenges/${challengeId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, flag: flag.trim() }),
      });

      if (res.is_correct) {
        setMessage({ type: 'success', text: `${res.message} (+${res.points_awarded} PTS)` });
        setFlag('');
        setTimeout(() => onSuccess(), 1000);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Submission error' });
    } finally {
      setSubmitting(false);
    }
  };

  const requestHint = async (level: number) => {
    try {
      const res = await fetchApi(`/challenges/${challengeId}/hint`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, hint_level: level }),
      });
      if (level === 1) setH1(res.hint_text);
      if (level === 2) setH2(res.hint_text);
      if (level === 3) setH3(res.hint_text);
    } catch (err: any) {
      alert(err.message || 'Could not fetch hint');
    }
  };

  return (
    <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-sm font-bold text-defence-heading flex items-center space-x-2">
            <Flag className="w-4 h-4 text-defence-cyan" />
            <span>EVIDENCE / FLAG VERIFICATION</span>
          </h3>
          <span className="text-xs font-mono text-defence-amber bg-defence-amber/10 border border-defence-amber/30 px-2 py-0.5 rounded">
            MAX {maxPoints} POINTS
          </span>
        </div>
        <p className="text-xs text-defence-text">
          Submit the extracted proof flag string in format <code className="text-defence-cyan font-mono font-bold">FLAG&#123;...&#125;</code>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2.5 sm:space-y-0 sm:space-x-3">
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="FLAG{...}"
            className="flex-1 bg-defence-sidebar border border-defence-border rounded-lg px-4 py-2.5 text-sm font-mono text-defence-heading placeholder-defence-text/40 focus:outline-none focus:border-defence-cyan focus:ring-1 focus:ring-defence-cyan"
          />
          <button
            type="submit"
            disabled={submitting || !flag.trim()}
            className="bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold px-6 py-2.5 rounded-lg text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'VERIFYING...' : 'SUBMIT FLAG'}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border flex items-center space-x-3 text-xs font-mono ${
              message.type === 'success'
                ? 'bg-defence-green/10 border-defence-green/40 text-defence-green'
                : 'bg-defence-red/10 border-defence-red/40 text-defence-red'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </form>

      {/* Hints Panel */}
      <div className="pt-4 border-t border-defence-border/80">
        <h4 className="font-mono text-xs font-semibold text-defence-text flex items-center space-x-2 mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-defence-amber" />
          <span>TACTICAL HINTS & ASSISTANCE (SCORE PENALTY APPLIES)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Hint 1 */}
          <div className="bg-defence-sidebar/80 border border-defence-border p-3 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-defence-text font-bold">HINT 1 (-10%)</span>
              {!h1 ? (
                <button
                  onClick={() => requestHint(1)}
                  className="text-[10px] font-mono bg-defence-amber/10 text-defence-amber border border-defence-amber/30 px-2 py-0.5 rounded hover:bg-defence-amber/20"
                >
                  UNLOCK (90% SCORE)
                </button>
              ) : (
                <span className="text-[10px] font-mono text-defence-green">UNLOCKED</span>
              )}
            </div>
            {h1 ? (
              <p className="font-mono text-defence-heading/90 bg-defence-card p-2 rounded border border-defence-border text-[11px]">
                {h1}
              </p>
            ) : (
              <p className="text-defence-text/60 italic text-[11px]">Hint locked. Click to view.</p>
            )}
          </div>

          {/* Hint 2 */}
          <div className="bg-defence-sidebar/80 border border-defence-border p-3 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-defence-text font-bold">HINT 2 (-25%)</span>
              {!h2 ? (
                <button
                  onClick={() => requestHint(2)}
                  className="text-[10px] font-mono bg-defence-amber/10 text-defence-amber border border-defence-amber/30 px-2 py-0.5 rounded hover:bg-defence-amber/20"
                >
                  UNLOCK (75% SCORE)
                </button>
              ) : (
                <span className="text-[10px] font-mono text-defence-green">UNLOCKED</span>
              )}
            </div>
            {h2 ? (
              <p className="font-mono text-defence-heading/90 bg-defence-card p-2 rounded border border-defence-border text-[11px]">
                {h2}
              </p>
            ) : (
              <p className="text-defence-text/60 italic text-[11px]">Hint locked. Click to view.</p>
            )}
          </div>

          {/* Hint 3 */}
          <div className="bg-defence-sidebar/80 border border-defence-border p-3 rounded-lg text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-defence-text font-bold">HINT 3 (-50%)</span>
              {!h3 ? (
                <button
                  onClick={() => requestHint(3)}
                  className="text-[10px] font-mono bg-defence-amber/10 text-defence-amber border border-defence-amber/30 px-2 py-0.5 rounded hover:bg-defence-amber/20"
                >
                  UNLOCK (50% SCORE)
                </button>
              ) : (
                <span className="text-[10px] font-mono text-defence-green">UNLOCKED</span>
              )}
            </div>
            {h3 ? (
              <p className="font-mono text-defence-heading/90 bg-defence-card p-2 rounded border border-defence-border text-[11px]">
                {h3}
              </p>
            ) : (
              <p className="text-defence-text/60 italic text-[11px]">Hint locked. Click to view.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
