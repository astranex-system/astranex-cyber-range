'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Award, Clock, FileText, CheckCircle2, Save, Terminal, AlertTriangle } from 'lucide-react';
import { fetchApi } from '../../../../lib/api';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportScore, setReportScore] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSavedSuccess, setScoreSavedSuccess] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [params.id]);

  const loadDetail = async () => {
    try {
      const data = await fetchApi(`/admin/candidates/${params.id}`);
      setDetail(data);
      setReportScore(data.report_score || 0);
      setAdminNotes(data.report_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingScore(true);

    try {
      const res = await fetchApi(`/admin/reports/${detail.attempt_id}/score`, {
        method: 'POST',
        body: JSON.stringify({ score: Number(reportScore), admin_notes: adminNotes }),
      });

      setScoreSavedSuccess(true);
      setTimeout(() => setScoreSavedSuccess(false), 3000);
      loadDetail();
    } catch (err: any) {
      alert(err.message || 'Error saving report review.');
    } finally {
      setSavingScore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen defence-grid flex items-center justify-center font-mono text-sm text-defence-cyan">
        LOADING CANDIDATE EVALUATION DOSSIER...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen defence-grid flex items-center justify-center font-mono text-sm text-defence-red">
        CANDIDATE DOSSIER NOT FOUND.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-defence-bg text-defence-heading p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-defence-border">
        <div className="flex items-center space-x-3">
          <a
            href="/admin"
            className="p-2 rounded-lg bg-defence-sidebar border border-defence-border text-defence-text hover:text-defence-heading transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-mono text-xl font-bold text-defence-heading">
              CANDIDATE EVALUATION: {detail.full_name}
            </h1>
            <p className="text-xs font-mono text-defence-cyan">{detail.email} // ID: {detail.candidate_id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-defence-card border border-defence-border px-4 py-2 rounded-xl hud-border-amber font-mono text-xs">
          <Award className="w-4 h-4 text-defence-amber" />
          <span>OVERALL SCORE:</span>
          <span className="font-bold text-base text-defence-amber">{detail.total_score} / 100 PTS</span>
        </div>
      </div>

      {/* Stage Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-defence-card border border-defence-border p-6 rounded-xl space-y-4 shadow-xl">
          <h2 className="font-mono text-sm font-bold text-defence-cyan border-b border-defence-border pb-2">
            STAGE SCORE BREAKDOWN
          </h2>
          <div className="space-y-2 font-mono text-xs">
            {Object.entries(detail.stage_scores || {}).map(([stName, score]: [string, any]) => (
              <div key={stName} className="flex justify-between items-center bg-defence-sidebar p-2.5 rounded border border-defence-border">
                <span className="text-defence-heading font-semibold">{stName}</span>
                <span className="text-defence-amber font-bold">+{score} PTS</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-defence-card border border-defence-border p-6 rounded-xl space-y-4 shadow-xl font-mono text-xs">
          <h2 className="font-mono text-sm font-bold text-defence-cyan border-b border-defence-border pb-2">
            ASSESSMENT METRICS & AUDIT
          </h2>
          <div className="space-y-2">
            <p><span className="text-defence-text">Attempt Status:</span> <strong className="text-defence-green uppercase">{detail.status}</strong></p>
            <p><span className="text-defence-text">Started At:</span> {new Date(detail.started_at).toLocaleString()}</p>
            <p><span className="text-defence-text">Completed At:</span> {detail.completed_at ? new Date(detail.completed_at).toLocaleString() : 'In Progress'}</p>
            <p><span className="text-defence-text">Hints Requested:</span> {detail.hints_used_count}</p>
            <p><span className="text-defence-text">Failed Flag Attempts:</span> {detail.failed_attempts_count}</p>
          </div>
        </div>
      </div>

      {/* Code Submissions Inspection */}
      {detail.code_submissions && detail.code_submissions.length > 0 && (
        <div className="bg-defence-card border border-defence-border p-6 rounded-xl space-y-4 shadow-xl font-mono text-xs">
          <h2 className="font-mono text-sm font-bold text-defence-cyan flex items-center space-x-2">
            <Terminal className="w-4 h-4" />
            <span>STAGE 7 CODE SUBMISSION INSPECTION</span>
          </h2>
          <div className="bg-defence-bg p-4 rounded-lg border border-defence-border overflow-x-auto max-h-60">
            <pre className="text-defence-heading/90 whitespace-pre">{detail.code_submissions[0].code}</pre>
          </div>
        </div>
      )}

      {/* Manual Report Evaluation Section */}
      {detail.report && (
        <div className="bg-defence-card border border-defence-border p-6 rounded-xl space-y-6 shadow-xl">
          <div className="border-b border-defence-border pb-3 flex items-center justify-between">
            <h2 className="font-mono text-base font-bold text-defence-heading flex items-center space-x-2">
              <FileText className="w-5 h-5 text-defence-cyan" />
              <span>SUBMITTED INCIDENT RESPONSE REPORT</span>
            </h2>
            <span className="text-xs font-mono text-defence-amber bg-defence-amber/10 border border-defence-amber/30 px-3 py-1 rounded">
              MAX 10 REPORT POINTS
            </span>
          </div>

          {/* Rendered Report Fields */}
          <div className="space-y-4 font-mono text-xs">
            {Object.entries(detail.report).map(([key, val]: [string, any]) => (
              val && (
                <div key={key} className="bg-defence-sidebar p-4 rounded-lg border border-defence-border space-y-1">
                  <span className="text-defence-cyan font-bold capitalize">{key.replace('_', ' ')}</span>
                  <p className="text-defence-heading/90 whitespace-pre-wrap font-sans text-xs">{val}</p>
                </div>
              )
            ))}
          </div>

          {/* Admin Manual Scoring Form */}
          <form onSubmit={handleScoreReport} className="pt-4 border-t border-defence-border space-y-4 bg-defence-sidebar p-5 rounded-xl border">
            <h3 className="font-mono text-sm font-bold text-defence-amber">
              ADMIN MANUAL REPORT EVALUATION & SCORING
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-xs font-semibold text-defence-text mb-1">
                  Report Score (0.0 to 10.0 PTS):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={reportScore}
                  onChange={(e) => setReportScore(Number(e.target.value))}
                  className="w-full bg-defence-card border border-defence-border rounded-lg px-3 py-2 font-mono text-sm text-defence-amber font-bold focus:outline-none focus:border-defence-amber"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-mono text-xs font-semibold text-defence-text mb-1">
                  Admin Evaluator Notes:
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Evaluation feedback or rationale..."
                  className="w-full bg-defence-card border border-defence-border rounded-lg px-3 py-2 font-mono text-xs text-defence-heading focus:outline-none focus:border-defence-cyan"
                />
              </div>
            </div>

            {scoreSavedSuccess && (
              <div className="p-2.5 bg-defence-green/10 border border-defence-green/40 text-defence-green font-mono text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>REPORT SCORE UPDATED & RE-CALCULATED IN OVERALL CANDIDATE SCORE!</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingScore}
                className="bg-defence-amber hover:bg-defence-amber/80 text-black font-mono font-bold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-2 shadow-lg"
              >
                <Save className="w-4 h-4 fill-current" />
                <span>{savingScore ? 'SAVING...' : 'SAVE REVIEW SCORE'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
