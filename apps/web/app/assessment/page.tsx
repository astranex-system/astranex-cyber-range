'use client';

import React, { useState, useEffect } from 'react';
import { HUDHeader } from '../../components/HUDHeader';
import { StageSidebar } from '../../components/StageSidebar';
import { FlagSubmissionBox } from '../../components/FlagSubmissionBox';
import { LogViewer } from '../../components/LogViewer';
import { PCAPViewer } from '../../components/PCAPViewer';
import { ScriptInspector } from '../../components/ScriptInspector';
import { CodeEditorComponent } from '../../components/CodeEditorComponent';
import { ReportForm } from '../../components/ReportForm';
import { fetchApi } from '../../lib/api';

import { Play, CheckCircle2, ShieldAlert, Terminal, Eye, Cpu, Database, Network, FileCode, FileText } from 'lucide-react';

export default function AssessmentPage() {
  const [attempt, setAttempt] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [activeStageOrder, setActiveStageOrder] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessmentState();
  }, []);

  const loadAssessmentState = async () => {
    try {
      const attData = await fetchApi('/assessment/attempt');
      setAttempt(attData);
      setActiveStageOrder(attData.current_stage_order);

      const stagesData = await fetchApi('/stages');
      setStages(stagesData);
    } catch (err: any) {
      console.error(err);
      if (typeof window !== 'undefined') window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeBriefing = async () => {
    try {
      await fetchApi('/assessment/acknowledge_briefing', { method: 'POST' });
      loadAssessmentState();
    } catch (err: any) {
      alert(err.message || 'Error acknowledging briefing');
    }
  };

  const handleStageSuccess = () => {
    loadAssessmentState();
  };

  if (loading) {
    return (
      <div className="min-h-screen defence-grid flex items-center justify-center font-mono text-sm text-defence-cyan">
        INITIALIZING ASTRANEX DEFENCE HUD...
      </div>
    );
  }

  const currentStageObj = stages.find((s) => s.stage_order === activeStageOrder) || stages[0];
  const currentChallenge = currentStageObj?.challenges?.[0];

  return (
    <div className="min-h-screen bg-defence-bg flex flex-col">
      {/* HUD Header Bar */}
      <HUDHeader
        candidateName={attempt?.candidate_name}
        currentStageName={`STAGE ${activeStageOrder} - ${currentStageObj?.name}`}
        remainingSeconds={attempt?.remaining_seconds || 0}
        totalScore={attempt?.total_score || 0}
        attemptStatus={attempt?.status}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Stage Sidebar */}
        <StageSidebar
          stages={stages}
          activeStageOrder={activeStageOrder}
          onSelectStage={(order) => setActiveStageOrder(order)}
        />

        {/* Main Stage Content View */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Stage 0: Mission Briefing */}
          {activeStageOrder === 0 && (
            <div className="bg-defence-card border border-defence-border rounded-xl p-8 shadow-xl space-y-6 max-w-4xl">
              <div className="border-b border-defence-border pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                    STAGE 0 // MISSION BRIEFING
                  </span>
                  <h2 className="font-mono text-2xl font-bold text-defence-heading mt-2">
                    Incident ID: ASTRA-INC-AX07-0926
                  </h2>
                </div>
                <span className="text-xs font-mono text-defence-red bg-defence-red/10 border border-defence-red/30 px-3 py-1 rounded">
                  HIGH SEVERITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs bg-defence-sidebar p-4 rounded-lg border border-defence-border">
                <p><span className="text-defence-text">Asset:</span> UGV AX-07 (Autonomous Vehicle)</p>
                <p><span className="text-defence-text">Environment:</span> Remote Operational Zone</p>
                <p><span className="text-defence-text">Status:</span> ACTIVE INVESTIGATION</p>
                <p><span className="text-defence-text">Command API:</span> api.ops.astranex.local</p>
              </div>

              <div className="space-y-3 font-sans text-sm text-defence-text">
                <h3 className="font-mono text-xs font-bold text-defence-cyan uppercase">Known Symptoms & Initial Alert</h3>
                <p>
                  Security monitoring detected anomalous communication from AX-07. Telemetry values are inconsistent with satellite position locks, an unverified service account <code className="text-defence-cyan font-mono">svc-telemetry</code> executed command overrides, and autonomous navigation limits were altered.
                </p>
                <h3 className="font-mono text-xs font-bold text-defence-cyan uppercase pt-2">Candidate Mission Objectives</h3>
                <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-defence-heading">
                  <li>Progressively discover the attack vector across 8 connected technical stages.</li>
                  <li>Analyze telemetry APIs, authentication tokens, system logs, network PCAPs, and script artifacts.</li>
                  <li>Implement secure coding fixes for the command router in Stage 7.</li>
                  <li>Submit a comprehensive 11-field Incident Response Report in Stage 8.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-defence-border flex justify-end">
                <button
                  onClick={handleAcknowledgeBriefing}
                  className="bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold px-8 py-3 rounded-lg text-sm transition flex items-center space-x-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>[ START INVESTIGATION ]</span>
                </button>
              </div>
            </div>
          )}

          {/* Stage 1: Reconnaissance */}
          {activeStageOrder === 1 && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-4">
                <div className="border-b border-defence-border pb-3">
                  <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                    STAGE 1 // RECONNAISSANCE
                  </span>
                  <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                    AstraNex Internal Infrastructure Mapping
                  </h2>
                </div>

                <div className="bg-defence-sidebar border border-defence-border p-4 rounded-lg font-mono text-xs space-y-2 text-defence-heading">
                  <p className="text-defence-cyan font-bold">[!] REPO SNAPSHOT // ASTRANEX-INTERNAL-DOCS</p>
                  <p><span className="text-defence-text">Service Name:</span> telemetry-gateway</p>
                  <p><span className="text-defence-text">Active Version:</span> v2.4.1</p>
                  <p><span className="text-defence-text">API Route:</span> /api/telemetry/vehicle/&#123;vehicle_id&#125;</p>
                  <p><span className="text-defence-text">System Digest:</span> SHA256-a9f4821c9014b2e88a0</p>
                </div>
              </div>

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 2: Telemetry API Investigation */}
          {activeStageOrder === 2 && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-4">
                <div className="border-b border-defence-border pb-3">
                  <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                    STAGE 2 // TELEMETRY API INVESTIGATION
                  </span>
                  <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                    API Parameter Tampering & IDOR Analysis
                  </h2>
                </div>

                <div className="bg-defence-sidebar border border-defence-border p-4 rounded-lg font-mono text-xs space-y-2">
                  <p className="text-defence-cyan font-bold">SIMULATED ENDPOINT TEST CONSOLE</p>
                  <div className="bg-defence-bg p-3 rounded border border-defence-border text-defence-green">
                    <p>GET /api/telemetry/vehicle/AX-07 HTTP/1.1</p>
                    <p>Host: api.ops.astranex.local</p>
                    <p className="text-defence-amber">X-AstraNex-Override: TRUE  &lt;-- [!] TAMPERED HEADER DISCOVERED</p>
                    <p className="pt-2 text-defence-heading">HTTP/1.1 200 OK</p>
                    <p className="text-defence-cyan font-bold">Payload: FLAG&#123;TELEMETRY_API_IDOR_UNAUTHORIZED_ACCESS_9942&#125;</p>
                  </div>
                </div>
              </div>

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 3: Authentication & Authorization */}
          {activeStageOrder === 3 && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-4">
                <div className="border-b border-defence-border pb-3">
                  <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                    STAGE 3 // AUTHENTICATION & AUTHORIZATION
                  </span>
                  <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                    Identity Escalation & Privilege Analysis
                  </h2>
                </div>

                <div className="bg-defence-sidebar border border-defence-border p-4 rounded-lg font-mono text-xs space-y-2">
                  <p className="text-defence-cyan font-bold">COMPROMISED IDENTITY INSPECTOR</p>
                  <p><span className="text-defence-text">Service Identity:</span> svc-telemetry</p>
                  <p><span className="text-defence-text">Granted Scope:</span> [telemetry.read, telemetry.write]</p>
                  <p><span className="text-defence-text">Abused Scope:</span> [vehicle.command] (Unauthorized)</p>
                  <p><span className="text-defence-text">Evidence Flag:</span> FLAG&#123;SVC_TELEMETRY_PRIVILEGE_ESCALATION_EXPOSED&#125;</p>
                </div>
              </div>

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 4: Log Forensics */}
          {activeStageOrder === 4 && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                  STAGE 4 // LOG FORENSICS
                </span>
                <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                  Multi-Log Timeline Reconstruction & IP Correlation
                </h2>
              </div>

              <LogViewer />

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 5: Network Investigation */}
          {activeStageOrder === 5 && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                  STAGE 5 // NETWORK INVESTIGATION
                </span>
                <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                  PCAP Network Packet Exfiltration Analysis
                </h2>
              </div>

              <PCAPViewer />

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 6: Malware / File Analysis */}
          {activeStageOrder === 6 && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                  STAGE 6 // MALWARE & FILE ANALYSIS
                </span>
                <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                  Script De-obfuscation & Persistence Analysis
                </h2>
              </div>

              <ScriptInspector />

              {currentChallenge && (
                <FlagSubmissionBox
                  challengeId={currentChallenge.id}
                  maxPoints={currentChallenge.max_points}
                  hint1Text={currentChallenge.hint_1_text}
                  hint2Text={currentChallenge.hint_2_text}
                  hint3Text={currentChallenge.hint_3_text}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 7: Secure the System */}
          {activeStageOrder === 7 && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <span className="text-[10px] font-mono text-defence-cyan bg-defence-cyan/10 border border-defence-cyan/30 px-2 py-0.5 rounded">
                  STAGE 7 // SECURE THE SYSTEM
                </span>
                <h2 className="font-mono text-xl font-bold text-defence-heading mt-2">
                  Secure Coding Challenge: Fix Vehicle Command Authorization
                </h2>
                <p className="text-xs text-defence-text mt-1">
                  Modify <code className="text-defence-cyan font-mono">auth.py</code> to prevent privilege escalation by <code className="text-defence-cyan font-mono">svc-telemetry</code>, while allowing authorized commanders. Click &quot;RUN TEST SUITE&quot; to execute all 10 hidden server tests.
                </p>
              </div>

              {currentChallenge && (
                <CodeEditorComponent
                  challengeId={currentChallenge.id}
                  onSuccess={handleStageSuccess}
                />
              )}
            </div>
          )}

          {/* Stage 8: Final Incident Report */}
          {activeStageOrder === 8 && (
            <div className="space-y-6 max-w-5xl">
              <ReportForm onSubmitted={handleStageSuccess} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
