'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, Download, FileText, Filter } from 'lucide-react';
import { fetchApi } from '../lib/api';

const LOG_FILES = ['auth.log', 'gateway.log', 'telemetry.log', 'command.log', 'system.log'];

export const LogViewer: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState('auth.log');
  const [logContent, setLogContent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLog(selectedLog);
  }, [selectedLog]);

  const loadLog = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetchApi(`/challenges/stage4/logs?log_name=${name}`);
      setLogContent(res.content || '');
    } catch (err) {
      setLogContent('Error loading log file.');
    } finally {
      setLoading(false);
    }
  };

  const lines = logContent.split('\n');
  const filteredLines = lines.filter((l) => l.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-defence-card border border-defence-border rounded-xl overflow-hidden shadow-xl">
      {/* Log Tabs */}
      <div className="bg-defence-sidebar border-b border-defence-border p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1.5 overflow-x-auto">
          {LOG_FILES.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedLog(name)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition flex items-center space-x-2 ${
                selectedLog === name
                  ? 'bg-defence-card text-defence-cyan border border-defence-cyan/40 font-bold'
                  : 'text-defence-text hover:text-defence-heading hover:bg-defence-card/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-defence-text absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="bg-defence-card border border-defence-border text-xs font-mono text-defence-heading pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-defence-cyan w-48"
            />
          </div>

          <a
            href={`/api/challenges/stage4/download/${selectedLog}`}
            download
            className="bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-heading px-3 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-defence-cyan" />
            <span>DOWNLOAD</span>
          </a>
        </div>
      </div>

      {/* Log Content View */}
      <div className="p-4 bg-defence-bg font-mono text-xs overflow-x-auto max-h-[480px] min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-defence-text">
            Loading log entries...
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="text-defence-text/60 italic p-4">No matching log entries found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <tbody>
              {filteredLines.map((line, idx) => {
                let rowStyle = 'text-defence-text/90';
                if (line.includes('ERROR') || line.includes('WARN') || line.includes('OVERRIDE')) {
                  rowStyle = 'text-defence-red font-semibold bg-defence-red/5';
                } else if (line.includes('SUCCESS') || line.includes('200 OK')) {
                  rowStyle = 'text-defence-green/90';
                }

                return (
                  <tr key={idx} className={`hover:bg-defence-card/60 transition ${rowStyle}`}>
                    <td className="w-12 py-1 pr-4 text-defence-text/40 select-none text-right font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-1 font-mono text-[11px] whitespace-pre-wrap">{line}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
