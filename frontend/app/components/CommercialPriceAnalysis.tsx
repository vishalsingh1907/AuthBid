"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Scale,
  Award,
  ShieldAlert
} from "lucide-react";

interface BidderSummary {
  bidder_id: string;
  entity_name: string;
  bid_amount: number;
}

interface VerificationResult {
  bidder_id: string;
  entity_name: string;
  risk_score?: {
    overall_score: number;
    risk_level: "low" | "medium" | "high" | "critical";
  };
  anomalies: Array<{
    anomaly_type: string;
  }>;
}

interface CommercialPriceAnalysisProps {
  bidders: BidderSummary[];
  results: VerificationResult[];
  onSelectBidder?: (bidderId: string) => void;
}

export default function CommercialPriceAnalysis({
  bidders,
  results,
  onSelectBidder,
}: CommercialPriceAnalysisProps) {
  const [hoveredBidder, setHoveredBidder] = useState<string | null>(null);

  const estimatedValue = 25000000; // ₹2.50 Cr

  // Sort bidders by bid amount ascending (lowest first)
  const sorted = [...bidders].sort((a, b) => a.bid_amount - b.bid_amount);

  const formatCurrency = (amt: number) => {
    return `₹${(amt / 10000000).toFixed(2)} Cr`;
  };

  const getRingMembership = (id: string) => {
    if (["B001", "B003", "B007"].includes(id)) return "Ring 1 (Bid Rigging Cartel)";
    if (["B005", "B009"].includes(id)) return "Ring 2 (Related Party Nexus)";
    return null;
  };

  const getRiskLevel = (id: string) => {
    const res = results.find((r) => r.bidder_id === id);
    return res?.risk_score?.risk_level || "low";
  };

  return (
    <div className="gov-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Scale size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Commercial Price Discovery & Cover Bidding Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Forensic comparison of financial bids against the ₹2.50 Cr Tender Estimate to detect artificial suppression or cartel pegging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Approved Tender Estimate
            </span>
            <p className="text-sm font-mono font-black text-slate-800">
              ₹2.50 Cr (₹25,000,000)
            </p>
          </div>
        </div>
      </div>

      {/* Cartel Cover Bidding Alert Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={17} />
        </div>
        <div className="text-xs">
          <h5 className="font-bold text-amber-900">
            Price Clustering & Cover Bidding Pattern Observed
          </h5>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Entity <strong>Quantum Digital (B007)</strong> submitted an artificially depressed quote (₹2.20 Cr) to set the floor, while syndicate partners <strong>TechVision (B001, ₹2.35 Cr)</strong> and <strong>DigiCore (B003, ₹2.48 Cr)</strong> bracketed the benchmark. When B007's shell status is disqualified, TechVision is positioned to claim L1 unless the entire cartel is disqualified.
          </p>
        </div>
      </div>

      {/* Visual Price Discovery Spectrum / Bar Graph */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>Bidder & Classification</span>
          <div className="flex items-center gap-4">
            <span>Variance vs Estimate</span>
            <span>Quoted Commercial Bid</span>
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((bidder, index) => {
            const ring = getRingMembership(bidder.bidder_id);
            const risk = getRiskLevel(bidder.bidder_id);
            const variance = ((bidder.bid_amount - estimatedValue) / estimatedValue) * 100;
            const isHovered = hoveredBidder === bidder.bidder_id;
            const barWidthPercent = Math.min(Math.max(((bidder.bid_amount - 21000000) / (26000000 - 21000000)) * 100, 10), 100);

            // Determine status badge
            let statusBadge = (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Compliant Bid
              </span>
            );
            if (ring?.includes("Ring 1")) {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                  <ShieldAlert size={11} /> Cartel Cover Bid (Ring 1)
                </span>
              );
            } else if (ring?.includes("Ring 2")) {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertTriangle size={11} /> Related Party Bid (Ring 2)
                </span>
              );
            } else if (risk === "medium") {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  MSE Clarification
                </span>
              );
            }

            return (
              <div
                key={bidder.bidder_id}
                onMouseEnter={() => setHoveredBidder(bidder.bidder_id)}
                onMouseLeave={() => setHoveredBidder(null)}
                onClick={() => onSelectBidder && onSelectBidder(bidder.bidder_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? "bg-blue-50/70 border-blue-300 shadow-xs"
                    : ring
                    ? "bg-red-50/30 border-red-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {bidder.entity_name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ({bidder.bidder_id})
                    </span>
                    {statusBadge}
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span
                      className={`font-mono font-bold ${
                        variance < 0 ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {variance < 0 ? `${variance.toFixed(1)}% below` : `+${variance.toFixed(1)}%`}
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {formatCurrency(bidder.bid_amount)}
                    </span>
                  </div>
                </div>

                {/* Relative Bar Visualization */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      ring
                        ? "bg-red-500"
                        : risk === "low"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation Committee Recommendation Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Lowest Unfiltered Bid
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-red-600">₹2.20 Cr</span>
            <span className="text-xs text-slate-500">(B007 Quantum Digital)</span>
          </div>
          <p className="text-[11px] text-red-700 mt-1 font-semibold">
            Status: Disqualified (Shell company & Ring 1 member)
          </p>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            Recommended Clean L1 Bidder
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-blue-800">₹2.28 Cr - ₹2.30 Cr</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            B004 (₹2.28 Cr pending MSE confirmation) or B011 (₹2.30 Cr)
          </p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Estimated Public Exchequer Savings
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-emerald-800">₹20.00 - ₹22.00 Lakhs</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            8.0% - 8.8% reduction against ₹2.50 Cr sanction
          </p>
        </div>
      </div>
    </div>
  );
}
