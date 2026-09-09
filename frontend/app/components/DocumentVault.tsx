"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Hash,
  Eye,
  Loader2,
  Download
} from "lucide-react";
import { api } from "../lib/api";

interface ExtractedDoc {
  doc_id: string;
  doc_name: string;
  verification_source: string;
  status: "verified" | "flagged" | "not_applicable";
  ocr_match_score: number;
  sha256_hash: string;
  extracted_data: Record<string, unknown>;
}

interface DocumentVaultProps {
  bidderId: string;
}

export default function DocumentVault({ bidderId }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<ExtractedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDoc | null>(null);

  useEffect(() => {
    if (!bidderId) return;

    let isMounted = true;
    setLoading(true);

    api
      .getBidderDocuments(bidderId)
      .then((res) => {
        if (isMounted && res.success) {
          setDocuments(res.data.documents || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load bidder documents:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bidderId]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (loading) {
    return (
      <div className="gov-card p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">
          Fetching cryptographically verified document records from MCA21, GSTN, & CBDT...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simulated Registry Notice Banner */}
      <div className="flex items-center justify-between gap-3 bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-700 flex-shrink-0" />
          <span>
            <strong className="font-bold">SIMULATED DEMO REGISTRY:</strong> Records displayed below are synthetically generated for demonstration. In production, these integrate live with GSTN, MCA21 V3, and CBDT via API Setu.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-amber-200/60 px-2 py-0.5 rounded font-bold uppercase">
          Sandbox Mode
        </span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <FileCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Verified Digital Document Vault & OCR Pipeline
            </h4>
            <p className="text-xs text-slate-500">
              Statutory documents cross-verified with SHA-256 cryptographic hashes and inline previews
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            {documents.filter((d) => d.status === "verified").length} / {documents.length} Verified
          </span>
          {documents.some((d) => d.status === "flagged") && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1.5">
              <XCircle size={13} />
              {documents.filter((d) => d.status === "flagged").length} Flagged
            </span>
          )}
        </div>
      </div>

      {/* Grid of Verified Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const isVerified = doc.status === "verified";
          const isFlagged = doc.status === "flagged";

          return (
            <div
              key={doc.doc_id}
              className={`gov-card p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer border-t-4 ${
                isFlagged
                  ? "border-t-red-600 bg-red-50/20"
                  : isVerified
                  ? "border-t-emerald-600"
                  : "border-t-slate-400"
              }`}
              onClick={() => setSelectedDoc(doc)}
            >
              <div>
                {/* Doc Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {doc.doc_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-800"
                        : isFlagged
                        ? "bg-red-100 text-red-800 animate-pulse"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isVerified ? "Verified" : isFlagged ? "Discrepancy" : "N/A"}
                  </span>
                </div>

                {/* Title */}
                <h5 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {doc.doc_name}
                </h5>

                {/* Verification Source */}
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Source:</span>
                  <span>{doc.verification_source}</span>
                </p>

                {/* OCR Confidence Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-500">OCR & Schema Match:</span>
                    <span
                      className={`font-mono font-bold ${
                        doc.ocr_match_score >= 95
                          ? "text-emerald-700"
                          : doc.ocr_match_score >= 80
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {doc.ocr_match_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        doc.ocr_match_score >= 95
                          ? "bg-emerald-500"
                          : doc.ocr_match_score >= 80
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${doc.ocr_match_score}%` }}
                    />
                  </div>
                </div>

                {/* Checksum Badge */}
                <div className="flex items-center justify-between pt-1 mb-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    SHA-256 Verified
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Eye size={12} /> Preview
                  </span>
                </div>

                {/* Extracted Fields Summary */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-xs font-mono space-y-1 border border-slate-100 mb-3">
                  {Object.entries(doc.extracted_data).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHA-256 Cryptographic Hash */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 truncate">
                  <Hash size={11} className="flex-shrink-0" />
                  <span className="truncate">{doc.sha256_hash.substring(0, 16)}...</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyHash(doc.sha256_hash);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                >
                  {copiedHash === doc.sha256_hash ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Hash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Detailed Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedDoc.doc_name}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      SHA-256 Sealed
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedDoc.doc_id} • Source: {selectedDoc.verification_source}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Realistic Government Certificate Sheet Preview */}
              <div className="border-2 border-slate-300 rounded-xl p-5 bg-gradient-to-b from-slate-50/70 to-white relative overflow-hidden shadow-xs">
                {/* Diagonal Demo Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <span className="text-6xl font-black text-slate-900 -rotate-24 uppercase select-none">
                    SIMULATED DEMO RECORD
                  </span>
                </div>

                {/* Certificate Header */}
                <div className="text-center border-b-2 border-slate-200 pb-4 mb-4">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center mb-1 text-slate-700 font-black text-xs">
                    GOI
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                    Government of India • Statutory Regulatory Certificate
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Verified through National Single Sign-On / API Setu Registry Gateway
                  </p>
                </div>

                {/* Certificate Body */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px] uppercase">Certificate Type</span>
                    <span className="font-bold text-slate-900">{selectedDoc.doc_name}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium block text-[10px] uppercase">Issuing Registry</span>
                    <span className="font-bold text-slate-900">{selectedDoc.verification_source}</span>
                  </div>
                </div>

                {/* Extracted Structured Data Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs mb-4">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px]">
                    Extracted Statutory Declarations
                  </div>
                  <div className="divide-y divide-slate-100 font-mono">
                    {Object.entries(selectedDoc.extracted_data).map(([k, v]) => (
                      <div key={k} className="px-3 py-1.5 flex justify-between bg-white text-[11px]">
                        <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}:</span>
                        <span className="font-bold text-slate-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Signature & Seal Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                      ✓
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Digitally Signed & Timestamped</span>
                      <span className="text-slate-500 font-mono">OCR Match: {selectedDoc.ocr_match_score}%</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-slate-500">
                    <div>Status: {selectedDoc.status.toUpperCase()}</div>
                    <div className="text-[9px] text-emerald-700 font-bold">CHECKSUM VERIFIED</div>
                  </div>
                </div>
              </div>

              {/* SHA-256 Digest Box */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cryptographic SHA-256 Checksum Digest
                </h5>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono break-all flex items-center justify-between gap-3">
                  <span>{selectedDoc.sha256_hash}</span>
                  <button
                    onClick={() => copyHash(selectedDoc.sha256_hash)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition flex-shrink-0"
                    title="Copy full SHA-256 hash"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                🔒 Validated against official GeM compliance criteria
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
