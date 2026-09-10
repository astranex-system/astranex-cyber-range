'use client';

import React, { useState } from 'react';
import { FileText, Send, CheckCircle2, Save, ExternalLink } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface ReportFormProps {
  onSubmitted: () => void;
  feedbackUrl?: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  onSubmitted,
  feedbackUrl = 'https://forms.gle/zpfihZAKWVfx6CBj6'
}) => {
  const [formData, setFormData] = useState({
    executive_summary: '',
    attack_vector: '',
    vulnerabilities: '',
    compromised_components: '',
    timeline: '',
    iocs: '',
    impact: '',
    root_cause: '',
    mitigations: '',
    secure_coding_changes: '',
    additional_observations: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveDraft = () => {
    localStorage.setItem('astranex_report_draft', JSON.stringify(formData));
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetchApi('/report', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSubmittedSuccess(true);
      onSubmitted();
    } catch (err: any) {
      alert(err.message || 'Failed to submit Incident Report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="bg-defence-card border border-defence-green/40 rounded-2xl p-8 shadow-2xl text-center space-y-6 max-w-2xl mx-auto my-8 hud-border-green">
        <div className="inline-flex p-4 rounded-full bg-defence-green/10 border border-defence-green/40 text-defence-green">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="font-mono text-2xl font-bold text-defence-heading">
            Assessment Completed
          </h2>
          <p className="font-mono text-xs text-defence-cyan uppercase tracking-wider">
            ASTRANEX CYBER RANGE // EVALUATION SUBMITTED
          </p>
        </div>

        <div className="space-y-3 font-sans text-sm text-defence-text max-w-md mx-auto">
          <p>
            Thank you for completing the AstraNex Cyber Range assessment.
          </p>
          <p>
            We would appreciate your feedback. Your feedback will help us improve future assessments.
          </p>
        </div>

        <div className="pt-4">
          <a
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg hud-border-cyan"
          >
            <ExternalLink className="w-4 h-4" />
            <span>[ Share Your Feedback ]</span>
          </a>
        </div>
      </div>
    );
  }

  const FIELDS = [
    { key: 'executive_summary', label: '1. Executive Summary', ph: 'High-level incident summary for command leadership...' },
    { key: 'attack_vector', label: '2. Initial Attack Vector', ph: 'Method used by attacker to gain entry...' },
    { key: 'vulnerabilities', label: '3. Vulnerabilities Identified', ph: 'IDOR, parameter tampering, unauthenticated telemetry gateway...' },
    { key: 'compromised_components', label: '4. Compromised Components', ph: 'AX-07 navigation limits, telemetry gateway service, svc-telemetry identity...' },
    { key: 'timeline', label: '5. Attacker Timeline', ph: '02:14:22Z Initial token issuance, 02:18:05Z Override command...' },
    { key: 'iocs', label: '6. Indicators of Compromise (IOCs)', ph: 'Attacker IP: 192.168.45.188, C2 Domain: c2.ops-external.darknet...' },
    { key: 'impact', label: '7. Impact Assessment', ph: 'Unauthorized physical movement of UGV AX-07, telemetry desync...' },
    { key: 'root_cause', label: '8. Root Cause Analysis', ph: 'Missing server-side permission checks in vehicle command router...' },
    { key: 'mitigations', label: '9. Recommended Mitigations', ph: 'Enforce strict RBAC, isolate gateway subnets, implement rate limiting...' },
    { key: 'secure_coding_changes', label: '10. Secure Coding Changes', ph: 'Updated auth.py function to validate vehicle.command role and block svc-telemetry...' },
    { key: 'additional_observations', label: '11. Additional Observations', ph: 'Any additional technical notes or telemetry findings...' },
  ];

  return (
    <div className="bg-defence-card border border-defence-border rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-defence-border">
        <div className="flex items-center space-x-2 font-mono text-sm font-bold text-defence-heading">
          <FileText className="w-5 h-5 text-defence-cyan" />
          <span>STAGE 8 // FINAL INCIDENT RESPONSE REPORT</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-defence-sidebar border border-defence-border hover:border-defence-cyan text-defence-heading px-3 py-1.5 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition"
          >
            <Save className="w-3.5 h-3.5 text-defence-cyan" />
            <span>{savedDraft ? 'DRAFT SAVED' : 'SAVE DRAFT'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold text-defence-cyan">
              {f.label}
            </label>
            <textarea
              rows={3}
              value={(formData as any)[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.ph}
              className="w-full bg-defence-sidebar border border-defence-border rounded-lg p-3 font-mono text-xs text-defence-heading placeholder-defence-text/40 focus:outline-none focus:border-defence-cyan focus:ring-1 focus:ring-defence-cyan"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-defence-border flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-defence-cyan hover:bg-defence-cyan/80 text-black font-mono font-bold px-8 py-3 rounded-lg text-sm transition flex items-center space-x-2 shadow-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'SUBMITTING...' : 'SUBMIT FINAL REPORT'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
