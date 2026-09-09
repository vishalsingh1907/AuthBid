"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  X,
  Printer,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { api } from "../lib/api";

interface ShowCauseNoticeData {
  notice_number: string;
  date: string;
  issuing_authority: string;
  tender_id: string;
  bidder: {
    bidder_id: string;
    entity_name: string;
    pan: string;
    gstin: string;
    registered_address: {
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  charges: string[];
  legal_clauses: string[];
  response_deadline_days: number;
  officer_name: string;
  officer_designation: string;
}

interface ShowCauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidderId: string;
}

export default function ShowCauseModal({
  isOpen,
  onClose,
  bidderId,
}: ShowCauseModalProps) {
  const [data, setData] = useState<ShowCauseNoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !bidderId) return;

    let isMounted = true;
    setLoading(true);

    api
      .getShowCauseNotice(bidderId)
      .then((res) => {
        if (isMounted && res.success) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load show-cause notice:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, bidderId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    const text = `
GOVERNMENT OF INDIA
DIRECTORATE GENERAL OF SUPPLIES & DISPOSALS / GeM VIGILANCE WING
STATUTORY SHOW-CAUSE NOTICE

Notice Ref: ${data.notice_number}
Date: ${data.date}
Tender Ref: ${data.tender_id}

To:
${data.bidder.entity_name} (ID: ${data.bidder.bidder_id})
GSTIN: ${data.bidder.gstin} | PAN: ${data.bidder.pan}
Address: ${data.bidder.registered_address.line1 || ""}, ${data.bidder.registered_address.city || ""}, ${data.bidder.registered_address.state || ""} - ${data.bidder.registered_address.pincode || ""}

SUBJECT: NOTICE UNDER RULE 175 OF GFR 2017 & SECTION 3(3) COMPETITION ACT 2002

CHARGES:
${data.charges.map((c, i) => `${i + 1}. ${c}`).join("\n")}

LEGAL PROVISIONS INVOKED:
${data.legal_clauses.map((l, i) => `• ${l}`).join("\n")}

You are hereby directed to show cause in writing within ${data.response_deadline_days} days why your bid should not be summarily rejected, your EMD forfeited, and your entity debarred under Rule 151 of GFR 2017.

Issuing Officer:
${data.officer_name}
${data.officer_designation}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Statutory Show-Cause Notice Generator
              </h3>
              <p className="text-xs text-slate-500">
                Rule 175 General Financial Rules (GFR) 2017 & Competition Act 2002
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              title="Copy Notice Text"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              title="Print Document"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Notice Document */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="animate-spin text-red-600" />
              <p className="text-xs font-medium text-slate-500">
                Drafting statutory notice with forensic evidence...
              </p>
            </div>
          ) : data ? (
            <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm space-y-6 text-slate-800 font-serif print:border-none print:shadow-none">
              {/* Official Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="font-sans text-[11px] font-bold tracking-widest uppercase text-slate-600">
                  Government of India • Ministry of Electronics & Information Technology
                </div>
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight mt-1">
                  Government e-Marketplace (GeM)
                </h1>
                <div className="text-xs text-slate-700 font-sans font-medium mt-0.5">
                  Directorate of Vigilance & Anti-Collusion Technical Scrutiny
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                  New Delhi - 110001
                </div>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between items-start text-xs font-sans">
                <div>
                  <p className="font-semibold text-slate-900">
                    Notice Ref: <span className="font-mono text-red-700 font-bold">{data.notice_number}</span>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Tender Reference: <span className="font-mono font-bold text-slate-800">{data.tender_id}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-700 font-semibold">
                    Date: <span className="font-mono">{data.date}</span>
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded">
                    URGENT / STATUTORY NOTICE
                  </span>
                </div>
              </div>

              {/* Addressee */}
              <div className="text-xs font-sans bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  To Authorized Signatory:
                </p>
                <p className="text-sm font-bold text-slate-900">{data.bidder.entity_name}</p>
                <p className="text-slate-600 mt-0.5">
                  {data.bidder.registered_address.line1 || "Industrial Area Phase III"},{" "}
                  {data.bidder.registered_address.city || "New Delhi"},{" "}
                  {data.bidder.registered_address.state || "Delhi"} - {data.bidder.registered_address.pincode || "110020"}
                </p>
                <div className="flex gap-4 mt-2 font-mono text-[11px] text-slate-700">
                  <span>GSTIN: <strong>{data.bidder.gstin}</strong></span>
                  <span>•</span>
                  <span>PAN: <strong>{data.bidder.pan}</strong></span>
                  <span>•</span>
                  <span>Bidder ID: <strong>{data.bidder.bidder_id}</strong></span>
                </div>
              </div>

              {/* Subject */}
              <div className="font-sans text-xs">
                <p className="font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                  SUBJECT: SHOW-CAUSE NOTICE FOR ENGAGING IN COLLUSIVE BID RIGGING / IRREGULARITIES UNDER GFR RULE 175 AND SECTION 3(3) OF COMPETITION ACT, 2002
                </p>
              </div>

              {/* Preamble */}
              <p className="text-xs leading-relaxed text-slate-700 text-justify">
                WHEREAS, during the automated algorithmic scrutiny and graph intelligence verification
                conducted for Tender <strong>{data.tender_id}</strong>, prima facie evidence of grave
                procedural irregularities, cartelization, and/or non-compliance with the General Financial Rules (GFR)
                was established against your firm.
              </p>

              {/* Specific Charges */}
              <div className="space-y-2">
                <h4 className="font-sans text-xs font-bold text-red-900 uppercase tracking-wider">
                  Specific Forensic Findings & Allegations:
                </h4>
                <div className="space-y-1.5 pl-2">
                  {data.charges.map((charge, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                      <span className="font-bold text-red-600 font-sans">{idx + 1}.</span>
                      <p className="leading-relaxed">{charge}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Provisions */}
              <div className="space-y-2">
                <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Statutory Clauses & Authority Invoked:
                </h4>
                <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 font-sans">
                  {data.legal_clauses.map((clause, idx) => (
                    <li key={idx} className="font-semibold text-slate-800">
                      {clause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requisition */}
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg font-sans text-xs space-y-2">
                <p className="font-bold text-red-900">
                  MANDATORY TIME-BOUND DIRECTIVE:
                </p>
                <p className="text-red-800 leading-relaxed">
                  You are hereby called upon to submit a detailed written explanation along with audited documentary
                  rebuttal to the Competent Authority within <strong>{data.response_deadline_days} (seven) calendar days</strong> from the date of receipt of this notice.
                </p>
                <p className="text-red-800 leading-relaxed font-semibold">
                  FAILURE TO RESPOND: In the event of non-submission or unsatisfactory defense within the stipulated deadline,
                  your bid shall be summarily rejected, Earnest Money Deposit (EMD) forfeited, and formal debarment/blacklisting
                  proceedings initiated across all Central Ministries for up to 24 months.
                </p>
              </div>

              {/* Signature Block */}
              <div className="pt-6 flex justify-between items-end font-sans">
                <div className="text-[11px] text-slate-500">
                  <p>Copy forward for information to:</p>
                  <p>1. Competition Commission of India (CCI), New Delhi</p>
                  <p>2. Central Vigilance Commission (CVC), Satarkta Bhavan</p>
                  <p>3. Procurement Grievance Redressal Cell, MeitY</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm">{data.officer_name}</div>
                  <div className="text-xs text-slate-600">{data.officer_designation}</div>
                  <div className="text-[11px] text-slate-500 mt-1">GeM Technical Scrutiny Directorate</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">Digitally Signed with SHA-256 Token</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Notice data not available for this entity.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Official GeM Form 18-A • Statutory Notice under Rule 175 GFR 2017
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
}
