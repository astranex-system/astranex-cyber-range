'use client';

import React, { useState, useEffect } from 'react';
import { FileCode, Binary, ShieldAlert, Copy, Check } from 'lucide-react';
import { fetchApi } from '../lib/api';

export const ScriptInspector: React.FC = () => {
  const [content, setContent] = useState('');
  const [b64Input, setB64Input] = useState('d2dldCBodHRwOi8vMTkyLjE2OC40NS4xODg6ODA4MC9heDA3X2MydHJpZ2dlcg==');
  const [b64Output, setB64Output] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadScript();
    decodeBase64(b64Input);
  }, []);

  const loadScript = async () => {
    try {
      const data = await fetchApi('/challenges/stage6/file');
      setContent(data.content || '');
    } catch (err) {
      console.error(err);
    }
  };

  const decodeBase64 = (str: string) => {
    try {
      setB64Output(atob(str.trim()));
    } catch (e) {
      setB64Output('Invalid Base64 input string.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Script Source Box */}
      <div className="bg-defence-card border border-defence-border rounded-xl overflow-hidden shadow-xl">
        <div className="bg-defence-sidebar border-b border-defence-border p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono text-xs text-defence-heading font-bold">
            <FileCode className="w-4 h-4 text-defence-cyan" />
            <span>SUSPICIOUS ARTIFACT // TELEMETRY_UPDATE.SH</span>
          </div>

          <button
            onClick={handleCopy}
            className="bg-defence-card border border-defence-border hover:border-defence-cyan text-defence-heading px-3 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-defence-green" /> : <Copy className="w-3.5 h-3.5 text-defence-cyan" />}
            <span>{copied ? 'COPIED' : 'COPY CODE'}</span>
          </button>
        </div>

        <div className="p-4 bg-defence-bg font-mono text-xs overflow-x-auto max-h-80">
          <pre className="text-defence-heading/90 whitespace-pre">{content}</pre>
        </div>
      </div>

      {/* Built-in Base64 Decoder Tool */}
      <div className="bg-defence-card border border-defence-border rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 font-mono text-xs text-defence-amber font-bold">
          <Binary className="w-4 h-4 text-defence-amber" />
          <span>DE-OBFUSCATION HELPER // BASE64 DECODER</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-defence-text mb-1">Base64 Encoded Input:</label>
            <input
              type="text"
              value={b64Input}
              onChange={(e) => {
                setB64Input(e.target.value);
                decodeBase64(e.target.value);
              }}
              className="w-full bg-defence-sidebar border border-defence-border rounded-lg px-3 py-2 text-xs font-mono text-defence-heading focus:outline-none focus:border-defence-cyan"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-defence-text mb-1">Decoded Output String:</label>
            <div className="bg-defence-sidebar border border-defence-border rounded-lg px-3 py-2 text-xs font-mono text-defence-cyan font-bold truncate">
              {b64Output}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
