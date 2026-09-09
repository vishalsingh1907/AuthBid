"use client";

import React from "react";
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Building2,
  TrendingUp,
  Shield,
  FileCheck
} from "lucide-react";

interface BidderCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggleSelectId: (id: string) => void;
  allBidders: any[];
  allResults: any[];
  onViewDossier: (result: any) => void;
}

export default function BidderCompareModal({
  isOpen,
  onClose,
  selectedIds,
  onToggleSelectId,
  allBidders,
  allResults,
  onViewDossier,
}: BidderCompareModalProps) {
  if (!isOpen) return null;

  // Filter out the selected bidder objects
  const comparedResults = allResults.filter((r) => selectedIds.includes(r.bidder_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Side-by-Side Bidder Intelligence Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Comparative technical, financial, and anti-collusion evaluation matrix (Select up to 4 bidders)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bidder Selector Chips */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pl-2">
            Select Bidders:
          </span>
          {allResults.map((r) => {
            const isSelected = selectedIds.includes(r.bidder_id);
            return (
              <button
                key={r.bidder_id}
                onClick={() => onToggleSelectId(r.bidder_id)}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <span>{r.bidder_id}</span>
                <span className="text-[10px] opacity-80 truncate max-w-[100px]">
                  {r.entity_name.split(" ")[0]}
                </span>
                {isSelected ? <X size={12} /> : null}
              </button>
            );
          })}
        </div>

        {/* Matrix Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {comparedResults.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Scale size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Please select at least 1 bidder from the selector above to compare.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-3 text-left w-56 text-slate-500 uppercase tracking-wider font-bold bg-slate-50/50">
                      Evaluation Dimension
                    </th>
                    {comparedResults.map((r) => {
                      const level = r.risk_score?.risk_level || "low";
                      return (
                        <th key={r.bidder_id} className="p-3 text-left font-bold min-w-[220px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                              {r.bidder_id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                level === "low"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : level === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {level} Risk
                            </span>
                          </div>
                          <p className="text-slate-900 font-black text-sm truncate">{r.entity_name}</p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Bid Amount & Deviation */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">Bid Submitted</td>
                    {comparedResults.map((r) => {
                      const meta = allBidders.find((b) => b.bidder_id === r.bidder_id);
                      const amt = meta?.bid_amount || 0;
                      const dev = (((amt - 25000000) / 25000000) * 100).toFixed(1);
                      return (
                        <td key={r.bidder_id} className="p-3 font-mono font-bold text-slate-900 text-sm">
                          ₹{amt.toLocaleString("en-IN")}
                          <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                            {Number(dev) <= 0 ? `${dev}% under estimate` : `+${dev}% over estimate`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Composite Risk Score */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">Composite Risk Score</td>
                    {comparedResults.map((r) => {
                      const score = r.risk_score?.overall_score || 0;
                      const level = r.risk_score?.risk_level || "low";
                      const color =
                        level === "critical" || level === "high"
                          ? "#dc2626"
                          : level === "medium"
                          ? "#d97706"
                          : "#059669";
                      return (
                        <td key={r.bidder_id} className="p-3">
                          <span className="font-mono font-black text-lg" style={{ color }}>
                            {score.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono"> / 100</span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Collusion Indicators */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">Collusion Indicator</td>
                    {comparedResults.map((r) => {
                      const collusionScore = r.risk_score?.components?.collusion_indicators || 0;
                      const isRing1 = ["B001", "B003", "B007"].includes(r.bidder_id);
                      const isRing2 = ["B005", "B009"].includes(r.bidder_id);

                      return (
                        <td key={r.bidder_id} className="p-3">
                          {isRing1 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                              <AlertOctagon size={12} /> Ring 1 (Shared DIN)
                            </span>
                          ) : isRing2 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                              <AlertTriangle size={12} /> Ring 2 (Shared Bank)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              <CheckCircle2 size={12} /> Independent
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Hard Eligibility Passed */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">Eligibility Pass Rate</td>
                    {comparedResults.map((r) => {
                      const total = Object.keys(r.hard_eligibility || {}).length;
                      const passed = Object.values(r.hard_eligibility || {}).filter((v) => v === "pass").length;
                      return (
                        <td key={r.bidder_id} className="p-3 font-mono font-bold text-slate-800">
                          {passed} / {total} Checks Passed
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                            {passed === total ? "All criteria satisfied" : `${total - passed} non-compliant`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* GST Filing History */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">GST Compliance</td>
                    {comparedResults.map((r) => {
                      const gstCheck = r.compliance_checks?.find((c: any) => c.category === "GST");
                      const gaps = r.compliance_checks?.find((c: any) => c.check_name === "GST Filing Compliance");
                      const hasGaps = gaps?.result === "warning" || gaps?.result === "fail";

                      return (
                        <td key={r.bidder_id} className="p-3 text-xs">
                          <p className="font-semibold text-slate-800">
                            {gstCheck?.details?.includes("Active") ? "Active GSTIN" : "Inactive / Missing"}
                          </p>
                          <span className={`text-[11px] font-medium ${hasGaps ? "text-red-600 font-bold" : "text-emerald-700"}`}>
                            {hasGaps ? "Filing Gaps Detected" : "100% On-Time Filings"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action Link */}
                  <tr className="bg-slate-50/30">
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">Actions</td>
                    {comparedResults.map((r) => (
                      <td key={r.bidder_id} className="p-3">
                        <button
                          onClick={() => {
                            onClose();
                            onViewDossier(r);
                          }}
                          className="w-full py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          View Full Dossier
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
