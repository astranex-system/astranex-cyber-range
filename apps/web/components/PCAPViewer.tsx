'use client';

import React, { useState, useEffect } from 'react';
import { Network, Download, Search, Activity, FileCode } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface PacketFrame {
  frame: number;
  timestamp: string;
  src: string;
  dst: string;
  protocol: string;
  info: string;
  details: string;
}

export const PCAPViewer: React.FC = () => {
  const [packets, setPackets] = useState<PacketFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<PacketFrame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPcap();
  }, []);

  const loadPcap = async () => {
    try {
      const data = await fetchApi('/challenges/stage5/pcap');
      setPackets(data);
      if (data.length > 0) setSelectedFrame(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-defence-card border border-defence-border rounded-xl overflow-hidden shadow-xl space-y-4 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-defence-border">
        <div className="flex items-center space-x-2 font-mono text-xs text-defence-heading font-bold">
          <Network className="w-4 h-4 text-defence-cyan" />
          <span>NETWORK TRAFFIC CAPTURE // AX07_CAPTURE.PCAP</span>
        </div>

        <a
          href="/api/challenges/stage5/download"
          download
          className="bg-defence-sidebar border border-defence-border hover:border-defence-cyan text-defence-heading px-3 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-defence-cyan" />
          <span>DOWNLOAD PCAP FILE</span>
        </a>
      </div>

      {/* Packet Table */}
      <div className="bg-defence-bg border border-defence-border rounded-lg overflow-x-auto max-h-64">
        {loading ? (
          <div className="p-6 text-center text-xs text-defence-text font-mono">
            Parsing PCAP packet streams...
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-defence-sidebar text-defence-text border-b border-defence-border">
              <tr>
                <th className="px-3 py-2">NO.</th>
                <th className="px-3 py-2">TIMESTAMP</th>
                <th className="px-3 py-2">SOURCE</th>
                <th className="px-3 py-2">DESTINATION</th>
                <th className="px-3 py-2">PROTOCOL</th>
                <th className="px-3 py-2">INFO</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((pkt) => {
                const isSelected = selectedFrame?.frame === pkt.frame;
                let protoBadge = 'text-defence-cyan bg-defence-cyan/10 border-defence-cyan/30';
                if (pkt.protocol === 'HTTP') protoBadge = 'text-defence-amber bg-defence-amber/10 border-defence-amber/30';
                if (pkt.protocol === 'DNS') protoBadge = 'text-defence-purple bg-defence-purple/10 border-defence-purple/30';

                return (
                  <tr
                    key={pkt.frame}
                    onClick={() => setSelectedFrame(pkt)}
                    className={`cursor-pointer border-b border-defence-border/40 hover:bg-defence-card/80 transition ${
                      isSelected ? 'bg-defence-card font-semibold text-defence-cyan' : 'text-defence-text'
                    }`}
                  >
                    <td className="px-3 py-2 text-defence-heading">{pkt.frame}</td>
                    <td className="px-3 py-2">{pkt.timestamp.split('T')[1].replace('Z', '')}</td>
                    <td className="px-3 py-2">{pkt.src}</td>
                    <td className="px-3 py-2">{pkt.dst}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] ${protoBadge}`}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="px-3 py-2 truncate max-w-xs">{pkt.info}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Frame Inspector */}
      {selectedFrame && (
        <div className="bg-defence-sidebar border border-defence-border p-4 rounded-lg font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-defence-cyan border-b border-defence-border/60 pb-2">
            <span className="font-bold">FRAME {selectedFrame.frame} STREAM INSPECTOR</span>
            <span className="text-[11px] text-defence-text">{selectedFrame.protocol} PROTOCOL DECODE</span>
          </div>
          <div className="space-y-1 text-defence-heading/90 pt-1">
            <p><span className="text-defence-text">Timestamp:</span> {selectedFrame.timestamp}</p>
            <p><span className="text-defence-text">Stream:</span> {selectedFrame.src} → {selectedFrame.dst}</p>
            <p><span className="text-defence-text">Payload Details:</span> {selectedFrame.details}</p>
          </div>
        </div>
      )}
    </div>
  );
};
