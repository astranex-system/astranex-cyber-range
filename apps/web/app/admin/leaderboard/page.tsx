'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, ArrowLeft, Award, Clock, HelpCircle, Shield } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function LeaderboardPage() {
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await fetchApi('/admin/leaderboard');
      setBoard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen defence-grid flex items-center justify-center font-mono text-sm text-defence-cyan">
        LOADING OFFICIAL RANKINGS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-defence-bg text-defence-heading p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-defence-border">
        <div className="flex items-center space-x-3">
          <a
            href="/admin"
            className="p-2 rounded-lg bg-defence-sidebar border border-defence-border text-defence-text hover:text-defence-heading transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-mono text-xl font-bold text-defence-heading flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-defence-amber" />
              <span>ASTRANEX CYBER RANGE // OFFICIAL LEADERBOARD</span>
            </h1>
            <p className="text-xs font-mono text-defence-cyan">Ranked by Score (desc) → Completion Time (asc) → Hints (asc)</p>
          </div>
        </div>
      </div>

      <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-defence-sidebar text-defence-text border-b border-defence-border">
            <tr>
              <th className="px-4 py-3">RANK</th>
              <th className="px-4 py-3">CANDIDATE</th>
              <th className="px-4 py-3">TOTAL SCORE</th>
              <th className="px-4 py-3">COMPLETION TIME</th>
              <th className="px-4 py-3">STAGES COMPLETED</th>
              <th className="px-4 py-3">HINTS USED</th>
              <th className="px-4 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-defence-border/40">
            {board.map((item) => {
              let rankStyle = 'text-defence-heading';
              if (item.rank === 1) rankStyle = 'text-defence-amber font-bold text-sm';
              if (item.rank === 2) rankStyle = 'text-defence-cyan font-bold text-sm';
              if (item.rank === 3) rankStyle = 'text-defence-green font-bold text-sm';

              return (
                <tr key={item.candidate_id} className="hover:bg-defence-sidebar/60 transition">
                  <td className={`px-4 py-3 ${rankStyle}`}>#{item.rank}</td>
                  <td className="px-4 py-3 font-bold text-defence-heading">{item.candidate_name}</td>
                  <td className="px-4 py-3 text-defence-amber font-bold text-sm">{item.total_score} PTS</td>
                  <td className="px-4 py-3 text-defence-text">{item.completion_time_minutes ? `${item.completion_time_minutes}m` : '--'}</td>
                  <td className="px-4 py-3 text-defence-cyan font-bold">{item.stages_completed} / 8 STAGES</td>
                  <td className="px-4 py-3 text-defence-text">{item.hints_used}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded border text-[10px] uppercase bg-defence-sidebar text-defence-text border-defence-border">
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
