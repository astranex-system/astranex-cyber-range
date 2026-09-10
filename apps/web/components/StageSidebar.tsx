'use client';

import React from 'react';
import { Lock, CheckCircle2, ChevronRight, Terminal, Eye, Cpu, Database, Network, FileCode, ShieldAlert, FileText } from 'lucide-react';

interface StageInfo {
  id: number;
  stage_order: number;
  name: string;
  title: string;
  points: number;
  is_locked: boolean;
  is_completed: boolean;
}

interface StageSidebarProps {
  stages: StageInfo[];
  activeStageOrder: number;
  onSelectStage: (stageOrder: number) => void;
}

const STAGE_ICONS: Record<number, React.ReactNode> = {
  0: <Terminal className="w-4 h-4" />,
  1: <Eye className="w-4 h-4" />,
  2: <Cpu className="w-4 h-4" />,
  3: <ShieldAlert className="w-4 h-4" />,
  4: <Database className="w-4 h-4" />,
  5: <Network className="w-4 h-4" />,
  6: <FileCode className="w-4 h-4" />,
  7: <Terminal className="w-4 h-4" />,
  8: <FileText className="w-4 h-4" />
};

export const StageSidebar: React.FC<StageSidebarProps> = ({
  stages,
  activeStageOrder,
  onSelectStage
}) => {
  return (
    <aside className="w-80 bg-defence-sidebar border-r border-defence-border h-[calc(100vh-57px)] flex flex-col justify-between p-4 overflow-y-auto">
      <div>
        <div className="mb-4 pb-3 border-b border-defence-border/80">
          <h2 className="font-mono text-xs text-defence-text uppercase tracking-wider font-semibold">
            OPERATION BLACKOUT // MISSION STAGES
          </h2>
          <p className="text-[11px] text-defence-text/70 mt-0.5">
            Sequential Investigation Pipeline
          </p>
        </div>

        <nav className="space-y-1.5">
          {stages.map((stage) => {
            const isActive = stage.stage_order === activeStageOrder;
            const isCompleted = stage.is_completed;
            const isLocked = stage.is_locked;

            let badgeStyle = 'bg-slate-800/80 text-slate-400 border-slate-700';
            let badgeText = 'LOCKED';

            if (isCompleted) {
              badgeStyle = 'bg-defence-green/10 text-defence-green border-defence-green/40';
              badgeText = 'COMPLETED';
            } else if (isActive) {
              badgeStyle = 'bg-defence-cyan/10 text-defence-cyan border-defence-cyan/40 animate-pulse';
              badgeText = 'ACTIVE';
            }

            return (
              <button
                key={stage.stage_order}
                onClick={() => !isLocked && onSelectStage(stage.stage_order)}
                disabled={isLocked}
                className={`w-full text-left p-3 rounded-lg border transition duration-150 flex items-center justify-between group ${
                  isActive
                    ? 'bg-defence-card border-defence-cyan/60 hud-border-cyan'
                    : isLocked
                    ? 'bg-defence-card/30 border-defence-border/40 opacity-60 cursor-not-allowed'
                    : 'bg-defence-card/60 border-defence-border hover:border-defence-border/80 hover:bg-defence-card'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded ${isActive ? 'text-defence-cyan bg-defence-cyan/10' : isCompleted ? 'text-defence-green bg-defence-green/10' : 'text-defence-text bg-defence-border/30'}`}>
                    {STAGE_ICONS[stage.stage_order] || <Terminal className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-defence-text uppercase">
                        STAGE {stage.stage_order}
                      </span>
                      {stage.points > 0 && (
                        <span className="text-[10px] font-mono text-defence-amber font-semibold">
                          +{stage.points} PTS
                        </span>
                      )}
                    </div>
                    <h3 className={`font-mono text-xs truncate ${isActive ? 'text-defence-heading font-bold' : 'text-defence-heading/80'}`}>
                      {stage.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${badgeStyle}`}>
                    {badgeText}
                  </span>
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-defence-green" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-defence-cyan" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-defence-border text-[11px] font-mono text-defence-text/60 text-center">
        <p>ASTRANEX SECURITY EVALUATION v2.4</p>
        <p className="mt-0.5">CLASSIFIED // INTERNAL ASSIGNMENT</p>
      </div>
    </aside>
  );
};
