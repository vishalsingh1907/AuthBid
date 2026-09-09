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
              Statutory documents cross-verified against official Indian registry APIs with SHA-256 hashes
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedDoc.doc_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedDoc.doc_id}
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

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Registry Source:</span>
                  <p className="font-bold text-slate-800">{selectedDoc.verification_source}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-medium">OCR Confidence:</span>
                  <p className="font-mono font-bold text-emerald-700">{selectedDoc.ocr_match_score}%</p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Extracted Regulatory Data
                </h5>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 text-xs font-mono">
                  {Object.entries(selectedDoc.extracted_data).map(([k, v]) => (
                    <div key={k} className="py-2 flex justify-between">
                      <span className="text-slate-500">{k}:</span>
                      <span className="font-bold text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cryptographic SHA-256 Digest
                </h5>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono break-all flex items-center justify-between gap-3">
                  <span>{selectedDoc.sha256_hash}</span>
                  <button
                    onClick={() => copyHash(selectedDoc.sha256_hash)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition flex-shrink-0"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
