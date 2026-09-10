'use client';

import React, { useState, useEffect } from 'react';
import { Play, Terminal, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface CodeEditorProps {
  challengeId: number;
  onSuccess: () => void;
}

export const CodeEditorComponent: React.FC<CodeEditorProps> = ({ challengeId, onSuccess }) => {
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    tests_passed: number;
    tests_total: number;
    passed_all: boolean;
    score_awarded: number;
    output: string;
  } | null>(null);

  useEffect(() => {
    loadCodeTemplate();
  }, []);

  const loadCodeTemplate = async () => {
    try {
      const data = await fetchApi('/challenges/stage7/code');
      setCode(data.content || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunTests = async () => {
    setRunning(true);
    setTestResult(null);

    try {
      const res = await fetchApi(`/code/${challengeId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });

      setTestResult(res);
      if (res.passed_all) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Error running test suite.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Editor Panel */}
      <div className="bg-defence-card border border-defence-border rounded-xl overflow-hidden shadow-xl">
        <div className="bg-defence-sidebar border-b border-defence-border p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono text-xs text-defence-heading font-bold">
            <Terminal className="w-4 h-4 text-defence-cyan" />
            <span>SECURE CODE ENVIRONMENT // AUTH.PY</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadCodeTemplate}
              className="text-defence-text hover:text-defence-heading text-xs font-mono flex items-center space-x-1"
              title="Reset Code Template"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>

            <button
              onClick={handleRunTests}
              disabled={running || !code.trim()}
              className="bg-defence-green hover:bg-defence-green/80 text-black font-mono font-bold px-4 py-1.5 rounded-lg text-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{running ? 'TESTING...' : 'RUN TEST SUITE'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-defence-bg font-mono text-xs">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full bg-transparent text-defence-heading/90 focus:outline-none resize-none font-mono leading-relaxed text-xs"
          />
        </div>
      </div>

      {/* Test Execution Output Box */}
      {testResult && (
        <div
          className={`border rounded-xl p-5 shadow-xl font-mono text-xs space-y-3 ${
            testResult.passed_all
              ? 'bg-defence-green/5 border-defence-green/40'
              : 'bg-defence-red/5 border-defence-red/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {testResult.passed_all ? (
                <CheckCircle2 className="w-5 h-5 text-defence-green" />
              ) : (
                <XCircle className="w-5 h-5 text-defence-red" />
              )}
              <span className="font-bold text-sm text-defence-heading">
                TEST SUITE RESULT: {testResult.tests_passed} / {testResult.tests_total} PASSED
              </span>
            </div>

            <span className="font-bold text-sm text-defence-amber bg-defence-amber/10 border border-defence-amber/30 px-3 py-1 rounded">
              SCORE: {testResult.score_awarded} / 10.0 PTS
            </span>
          </div>

          <div className="bg-defence-bg p-3 rounded-lg border border-defence-border/80 overflow-x-auto max-h-48">
            <pre className="text-defence-text whitespace-pre">{testResult.output}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
