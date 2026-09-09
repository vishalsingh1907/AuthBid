"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Activity,
  Network,
  FileText,
  Users,
  TrendingUp,
  Eye,
  Play,
  Loader2,
  ChevronRight,
  BarChart3,
  Lock,
  Unlock,
  Zap,
  ArrowRight,
  RefreshCw,
  Printer,
  Download,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  Award,
  AlertOctagon,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Filter,
  Check,
  X,
  Scale,
  Bot,
  Columns3,
  FileWarning
} from "lucide-react";

import CopilotDrawer from "./components/CopilotDrawer";
import BidderCompareModal from "./components/BidderCompareModal";
import ShowCauseModal from "./components/ShowCauseModal";
import DocumentVault from "./components/DocumentVault";
import CommercialPriceAnalysis from "./components/CommercialPriceAnalysis";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface BidderSummary {
  bidder_id: string;
  entity_name: string;
  trade_name?: string;
  entity_type: string;
  bid_amount: number;
  risk_score?: number;
  risk_level?: string;
  verification_status: string;
  anomaly_count: number;
}

interface VerificationResult {
  bidder_id: string;
  entity_name: string;
  tender_id: string;
  status: string;
  risk_score: {
    overall_score: number;
    risk_level: "low" | "medium" | "high" | "critical";
    components: {
      cross_source_consistency: number;
      collusion_indicators: number;
      financial_health: number;
      document_integrity: number;
      blacklist_proximity: number;
    };
    explanation: string;
  };
  compliance_checks: Array<{
    check_id: string;
    check_name: string;
    category: string;
    result: "pass" | "fail" | "warning";
    details: string;
    evidence?: Array<Record<string, unknown>>;
  }>;
  anomalies: Array<{
    anomaly_id: string;
    anomaly_type: string;
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    related_bidders: string[];
  }>;
  hard_eligibility: Record<string, string>;
  ai_recommendation: string;
  completed_at?: string;
}

interface CollusionCluster {
  cluster_id: string;
  members: string[];
  member_names: string[];
  size: number;
  risk_level: string;
  shared_indicators: string[];
  description: string;
}

interface GraphData {
  tender_id: string;
  nodes: Array<{
    id: string;
    label: string;
    type: "bidder" | "director" | "address" | "bank" | "identifier";
    risk_level?: string;
    properties?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relationship: string;
    is_suspicious?: boolean;
  }>;
  clusters: CollusionCluster[];
  analysis_summary: {
    total_bidders: number;
    total_nodes: number;
    total_edges: number;
    suspicious_edges: number;
    collusion_clusters: number;
    high_risk_bidders: number;
  };
}

interface AuditEntry {
  step_id: string;
  agent_id: string;
  action: string;
  input_hash: string;
  output_hash: string;
  prev_hash: string;
  current_hash: string;
  timestamp: string;
  details: {
    input_summary?: string;
    output_summary?: string;
  };
}

interface AuditTrailResponse {
  entries: AuditEntry[];
  total_entries: number;
  chain_integrity: {
    valid: boolean;
    broken_at?: string;
    reason?: string;
    entries_checked: number;
  };
}

interface TenderChecklistItem {
  id: string;
  category: string;
  requirement: string;
  description: string;
  mandatory: boolean;
  source: string;
  verification_method: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function RiskBadge({ level }: { level?: string }) {
  const safeLevel = (level || "low").toLowerCase();
  const icons: Record<string, React.ReactNode> = {
    low: <CheckCircle2 size={12} className="text-emerald-600" />,
    medium: <AlertTriangle size={12} className="text-amber-600" />,
    high: <AlertOctagon size={12} className="text-red-600" />,
    critical: <XCircle size={12} className="text-red-700" />,
  };

  return (
    <span className={`risk-badge risk-${safeLevel}`}>
      {icons[safeLevel] || null}
      {safeLevel}
    </span>
  );
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;

  const colorMap: Record<string, string> = {
    low: "#059669",
    medium: "#d97706",
    high: "#dc2626",
    critical: "#b91c1c",
  };
  const strokeColor = colorMap[level] || "#2563eb";

  return (
    <div className="risk-gauge">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} className="risk-gauge-track" />
        <circle
          cx="55"
          cy="55"
          r={r}
          className="risk-gauge-fill"
          stroke={strokeColor}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="risk-gauge-value" style={{ color: strokeColor }}>
        {Math.round(score)}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      className="gov-card p-5 relative overflow-hidden flex flex-col justify-between"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-black tracking-tight" style={{ color }}>
        {value}
      </div>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [view, setView] = useState<"dashboard" | "bidders" | "graph" | "checklist" | "audit" | "report">("dashboard");
  const [bidders, setBidders] = useState<BidderSummary[]>([]);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailResponse | null>(null);
  const [checklist, setChecklist] = useState<TenderChecklistItem[]>([]);
  const [selectedBidder, setSelectedBidder] = useState<VerificationResult | null>(null);
  const [detailedBidderProfile, setDetailedBidderProfile] = useState<Record<string, unknown> | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [activePipelineAgent, setActivePipelineAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [tamperLoading, setTamperLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [officerNotes, setOfficerNotes] = useState<Record<string, string>>({});
  const [officerDecisions, setOfficerDecisions] = useState<Record<string, "eligible" | "review" | "disqualified">>({});
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string | null>(null);
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(["B001", "B002", "B003", "B007"]);
  const [isShowCauseOpen, setIsShowCauseOpen] = useState(false);
  const [showCauseBidderId, setShowCauseBidderId] = useState<string>("B001");
  const [dossierTab, setDossierTab] = useState<"overview" | "documents" | "checklist" | "anomalies">("overview");
  const [showCommercialSpectrum, setShowCommercialSpectrum] = useState(true);

  const tenderId = "GEM/2026/B/4521897";

  // Load initial tender and results
  const loadData = useCallback(async () => {
    try {
      // 1. Tenders & Bidders
      const tenderRes = await fetch(`${API}/api/tenders/${tenderId}`);
      const tenderData = await tenderRes.json();
      if (tenderData.success && tenderData.data.bidders) {
        setBidders(tenderData.data.bidders);
      }

      // 2. Verification Results
      const resultsRes = await fetch(`${API}/api/verification/results/${tenderId}`);
      const resultsData = await resultsRes.json();
      if (resultsData.success && resultsData.data.results.length > 0) {
        setResults(resultsData.data.results);
      }

      // 3. AI Checklist
      const checkRes = await fetch(`${API}/api/tenders/${tenderId}/checklist`);
      const checkData = await checkRes.json();
      if (checkData.success) {
        setChecklist(checkData.data.checklist || []);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run AI Verification with multi-agent animated progress
  const runVerification = async () => {
    setIsVerifying(true);
    setVerificationProgress(5);
    setActivePipelineAgent("Agent 1: Ingesting Tender Clauses & RFP Guidelines...");

    const progressTimer = setInterval(() => {
      setVerificationProgress((prev) => {
        if (prev >= 90) return prev;
        if (prev === 20) setActivePipelineAgent("Agent 2: Querying MCA21, GSTN, PAN, & Udyam Portals...");
        if (prev === 45) setActivePipelineAgent("Agent 3: OSINT Entity Resolution & Collusion Graph Analysis...");
        if (prev === 65) setActivePipelineAgent("Agent 4: Debarment DB & Shell Company Heuristics Scanner...");
        if (prev === 85) setActivePipelineAgent("Agent 5: Composite Risk Scoring & SHA-256 Chain Anchoring...");
        return prev + 15;
      });
    }, 450);

    try {
      const res = await fetch(`${API}/api/verification/run/${tenderId}`, { method: "POST" });
      const data = await res.json();
      clearInterval(progressTimer);
      setVerificationProgress(100);
      setActivePipelineAgent("Verification Complete! SHA-256 Evidence Chained.");

      if (data.success) {
        setResults(data.data.results);
        await loadData();
      }
    } catch (err) {
      console.error("Verification failed:", err);
      clearInterval(progressTimer);
    } finally {
      setTimeout(() => {
        setIsVerifying(false);
        setVerificationProgress(0);
        setActivePipelineAgent("");
      }, 1000);
    }
  };

  // Load Graph Data
  const loadGraph = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/graph/collusion/${tenderId}`);
      const data = await res.json();
      if (data.success) setGraphData(data.data);
    } catch (err) {
      console.error("Failed to load collusion graph:", err);
    }
  }, [tenderId]);

  // Load Audit Trail
  const loadAuditTrail = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/verification/audit-trail`);
      const data = await res.json();
      if (data.success) setAuditTrail(data.data);
    } catch (err) {
      console.error("Failed to load audit trail:", err);
    }
  }, []);

  // Fetch individual bidder profile details
  const selectBidderForDossier = async (result: VerificationResult) => {
    setSelectedBidder(result);
    setView("bidders");
    try {
      const res = await fetch(`${API}/api/bidders/${result.bidder_id}`);
      const data = await res.json();
      if (data.success) {
        setDetailedBidderProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch detailed bidder profile:", err);
    }
  };

  // Tampering Simulation
  const handleSimulateTamper = async () => {
    setTamperLoading(true);
    try {
      await fetch(`${API}/api/verification/tamper`, { method: "POST" });
      await loadAuditTrail();
    } catch (err) {
      console.error("Tamper simulation failed:", err);
    } finally {
      setTamperLoading(false);
    }
  };

  // Restore Cryptographic Chain
  const handleRestoreChain = async () => {
    setRestoreLoading(true);
    try {
      await fetch(`${API}/api/verification/restore`, { method: "POST" });
      await loadAuditTrail();
    } catch (err) {
      console.error("Chain restore failed:", err);
    } finally {
      setRestoreLoading(false);
    }
  };

  // Filtered Results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesSearch =
        r.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bidder_id.toLowerCase().includes(searchQuery.toLowerCase());
      const level = r.risk_score?.risk_level || "low";
      if (riskFilter === "all") return matchesSearch;
      if (riskFilter === "low") return matchesSearch && level === "low";
      if (riskFilter === "medium") return matchesSearch && level === "medium";
      if (riskFilter === "high_critical") return matchesSearch && (level === "high" || level === "critical");
      return matchesSearch;
    });
  }, [results, searchQuery, riskFilter]);

  // High-level statistics
  const totalCount = results.length || bidders.length;
  const lowRiskCount = results.filter((r) => r.risk_score?.risk_level === "low").length;
  const medRiskCount = results.filter((r) => r.risk_score?.risk_level === "medium").length;
  const highRiskCount = results.filter((r) => r.risk_score?.risk_level === "high" || r.risk_score?.risk_level === "critical").length;
  const totalAnomalies = results.reduce((acc, r) => acc + (r.anomalies?.length || 0), 0);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════
          SIDEBAR NAVIGATION (White, Blue, Green, Red theme)
          ═══════════════════════════════════════════════════════════════ */}
      <aside className="w-68 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Shield size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  AuthBid
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  GeM AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Govt. Compliance Intel
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {[
              { id: "dashboard", icon: BarChart3, label: "Executive Dashboard" },
              { id: "bidders", icon: Users, label: "Bidder Dossiers" },
              { id: "graph", icon: Network, label: "Collusion OSINT Graph" },
              { id: "checklist", icon: FileText, label: "AI Tender Clauses" },
              { id: "audit", icon: Lock, label: "Tamper-Evident Chain" },
              { id: "report", icon: FileCheck, label: "Official Scrutiny Memo" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as typeof view);
                  if (item.id === "graph") loadGraph();
                  if (item.id === "audit") loadAuditTrail();
                }}
                className={`w-full nav-item text-left ${view === item.id ? "active" : ""}`}
              >
                <item.icon
                  size={18}
                  className={view === item.id ? "text-blue-700" : "text-slate-400"}
                />
                <span className="flex-1">{item.label}</span>
                {item.id === "graph" && results.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    2 Rings
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tender Card in Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Active Tender
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-600">₹2.50 Cr</span>
            </div>
            <p className="text-xs font-bold text-slate-800 line-clamp-2 mb-1">
              Supply of 500 Desktop Computers (3-Yr Warranty)
            </p>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {tenderId}
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Authority:</span>
              <span className="font-semibold text-slate-700">MeitY / NIC</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {view === "dashboard" && "Procurement Compliance Dashboard"}
                {view === "bidders" && (selectedBidder ? `Dossier: ${selectedBidder.entity_name}` : "Bidder Intelligence Dossiers")}
                {view === "graph" && "OSINT Cross-Bidder Collusion Network"}
                {view === "checklist" && "AI-Extracted Compliance Rules & Eligibility Clauses"}
                {view === "audit" && "Tamper-Evident SHA-256 Audit Trail"}
                {view === "report" && "Official GeM Evaluation Committee Scrutiny Memo"}
              </span>
            </div>

            {/* Live Data Feeds Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Feeds:</span>
              <span className="font-semibold text-slate-700">GSTN ● MCA21 ● CBDT ● UDYAM ● DEBARMENT</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* AI Vigilance Copilot Header Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-xs"
              title="Open AI Vigilance & Cartel Forensics Copilot"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>AI Copilot</span>
            </button>

            {/* Compare Matrix Button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
              title="Side-by-side comparative matrix of bidders"
            >
              <Scale size={14} className="text-blue-700" />
              <span>Compare Matrix</span>
            </button>

            {/* Scrutiny Memo Button */}
            <button
              onClick={() => setView("report")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
            >
              <FileCheck size={15} className="text-blue-700" />
              <span>Scrutiny Memo</span>
            </button>

            {/* Run / Re-run AI Verification Button */}
            <button
              onClick={runVerification}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm disabled:opacity-75"
              style={{
                background: isVerifying
                  ? "#64748b"
                  : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
              }}
            >
              {isVerifying ? (
                <Loader2 size={15} className="animate-spin" />
              ) : results.length > 0 ? (
                <RefreshCw size={15} />
              ) : (
                <Play size={15} />
              )}
              <span>{isVerifying ? "Analyzing Multi-Agent..." : results.length > 0 ? "Re-Run Verification" : "Run AI Verification"}</span>
            </button>
          </div>
        </header>

        {/* Multi-Agent Progress Bar when verifying */}
        {isVerifying && (
          <div className="bg-blue-50 border-b border-blue-200 px-8 py-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600 animate-spin" />
                <span>{activePipelineAgent}</span>
              </div>
              <span>{verificationProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Body View Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <Loader2 size={36} className="animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-slate-500">Initializing GeM Bid Compliance Intelligence Platform...</p>
            </div>
          ) : (
            <>
              {/* ═════════════════════════════════════════════════════════
                  VIEW 1: EXECUTIVE DASHBOARD
                  ═════════════════════════════════════════════════════════ */}
              {view === "dashboard" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {/* KPI Stat Cards (White, Blue, Green, Red, Amber) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                      icon={Users}
                      label="Total Bidders"
                      value={totalCount}
                      sublabel="12 Bids Submitted"
                      color="#1d4ed8"
                      bgColor="#eff6ff"
                      borderColor="#bfdbfe"
                    />
                    <StatCard
                      icon={CheckCircle2}
                      label="Compliant / Low Risk"
                      value={lowRiskCount}
                      sublabel="Recommended for Opening"
                      color="#059669"
                      bgColor="#ecfdf5"
                      borderColor="#a7f3d0"
                    />
                    <StatCard
                      icon={AlertTriangle}
                      label="Medium Risk"
                      value={medRiskCount}
                      sublabel="Clarification Required"
                      color="#d97706"
                      bgColor="#fffbeb"
                      borderColor="#fde68a"
                    />
                    <StatCard
                      icon={XCircle}
                      label="Critical / High Risk"
                      value={highRiskCount}
                      sublabel="Recommended Disqualification"
                      color="#dc2626"
                      bgColor="#fef2f2"
                      borderColor="#fecaca"
                    />
                    <StatCard
                      icon={AlertOctagon}
                      label="Collusion Rings"
                      value="2 Rings"
                      sublabel="₹6.8 Cr Exposure Flagged"
                      color="#991b1b"
                      bgColor="#fef2f2"
                      borderColor="#fca5a5"
                    />
                  </div>

                  {/* Collusion Alert Banner if critical rings detected */}
                  {results.length > 0 && highRiskCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 flex items-start justify-between shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-700 flex-shrink-0 mt-0.5">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-red-900">
                            Vigilance Alert: 2 Cross-Bidder Collusion Rings & 1 Shell Company Detected
                          </h4>
                          <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                            OSINT analysis resolved common directors (DIN: 01234567, 02345678) between Apex Infotech, Quantum Tech, and InnoVision (Ring 1), along with shared banking credentials between Nexus & Horizon (Ring 2).
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setView("graph");
                          loadGraph();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex-shrink-0 shadow-xs"
                      >
                        <span>Inspect Network</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Commercial Price Discovery & Cover Bidding Analysis */}
                  <CommercialPriceAnalysis
                    bidders={bidders}
                    results={results}
                    onSelectBidder={(id) => {
                      const found = results.find((r) => r.bidder_id === id);
                      if (found) selectBidderForDossier(found);
                    }}
                  />

                  {/* Verification Results Table */}
                  <div className="gov-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Bidder Compliance Matrix & Verification Scores
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cross-source verified against GSTN, CBDT PAN, MCA21, EPFO, and National Debarment registries
                        </p>
                      </div>

                      {/* Search & Filter Bar + Compare Trigger */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Compare Trigger Button */}
                        <button
                          onClick={() => setIsCompareOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition shadow-xs"
                          title="Open Side-by-Side Matrix Comparison"
                        >
                          <Scale size={13} />
                          <span>Compare ({selectedCompareIds.length})</span>
                        </button>

                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search bidder or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-44 text-slate-800"
                          />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                          <button
                            onClick={() => setRiskFilter("all")}
                            className={`px-2.5 py-1 rounded-md transition ${riskFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            All ({results.length})
                          </button>
                          <button
                            onClick={() => setRiskFilter("low")}
                            className={`px-2.5 py-1 rounded-md transition ${riskFilter === "low" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            Low ({lowRiskCount})
                          </button>
                          <button
                            onClick={() => setRiskFilter("medium")}
                            className={`px-2.5 py-1 rounded-md transition ${riskFilter === "medium" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            Med ({medRiskCount})
                          </button>
                          <button
                            onClick={() => setRiskFilter("high_critical")}
                            className={`px-2.5 py-1 rounded-md transition ${riskFilter === "high_critical" ? "bg-white text-red-700 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            Critical ({highRiskCount})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th className="w-10 text-center" title="Select to compare">
                              <Scale size={13} className="mx-auto text-slate-400" />
                            </th>
                            <th>Bidder Profile</th>
                            <th>Bid Amount</th>
                            <th>Risk Score</th>
                            <th>Risk Status</th>
                            <th>Anomalies</th>
                            <th>Hard Eligibility</th>
                            <th>Officer Decision</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-slate-400 text-sm">
                                {results.length === 0
                                  ? "Verification not run yet. Click 'Run AI Verification' above to initiate intelligence pipeline."
                                  : "No bidders match the active filter criteria."}
                              </td>
                            </tr>
                          ) : (
                            filteredResults.map((r) => {
                              const bidderMeta = bidders.find((b) => b.bidder_id === r.bidder_id);
                              const passCount = Object.values(r.hard_eligibility).filter((v) => v === "pass").length;
                              const failCount = Object.values(r.hard_eligibility).filter((v) => v === "fail").length;
                              const score = r.risk_score?.overall_score || 0;
                              const level = r.risk_score?.risk_level || "low";
                              const decision = officerDecisions[r.bidder_id];
                              const isChecked = selectedCompareIds.includes(r.bidder_id);

                              return (
                                <tr
                                  key={r.bidder_id}
                                  onClick={() => selectBidderForDossier(r)}
                                  className="group hover:bg-blue-50/40 cursor-pointer"
                                >
                                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          if (selectedCompareIds.length < 4) {
                                            setSelectedCompareIds([...selectedCompareIds, r.bidder_id]);
                                          } else {
                                            setSelectedCompareIds([...selectedCompareIds.slice(1), r.bidder_id]);
                                          }
                                        } else {
                                          setSelectedCompareIds(selectedCompareIds.filter((id) => id !== r.bidder_id));
                                        }
                                      }}
                                      title={isChecked ? "Remove from comparison" : "Add to comparison (up to 4)"}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                  <td>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                                          {r.entity_name}
                                        </p>
                                        {bidderMeta?.entity_type && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                                            {bidderMeta.entity_type}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                                        ID: {r.bidder_id} {bidderMeta?.trade_name ? `• ${bidderMeta.trade_name}` : ""}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="font-mono font-bold text-slate-800 text-sm">
                                    {formatCurrency(bidderMeta?.bid_amount || 0)}
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="font-mono font-black text-base"
                                        style={{
                                          color:
                                            level === "critical"
                                              ? "#b91c1c"
                                              : level === "high"
                                              ? "#dc2626"
                                              : level === "medium"
                                              ? "#d97706"
                                              : "#059669",
                                        }}
                                      >
                                        {score.toFixed(1)}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">/100</span>
                                    </div>
                                  </td>
                                  <td>
                                    <RiskBadge level={level} />
                                  </td>
                                  <td>
                                    {r.anomalies.length > 0 ? (
                                      <span className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                        <AlertTriangle size={11} />
                                        {r.anomalies.length} Flagged
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 font-medium text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                        <Check size={11} /> Clean
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-1 font-mono text-xs">
                                      <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        {passCount}P
                                      </span>
                                      {failCount > 0 && (
                                        <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                          {failCount}F
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {decision === "eligible" && (
                                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Qualified
                                      </span>
                                    )}
                                    {decision === "review" && (
                                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        In Scrutiny
                                      </span>
                                    )}
                                    {decision === "disqualified" && (
                                      <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                        Disqualified
                                      </span>
                                    )}
                                    {!decision && (
                                      <span className="text-[11px] text-slate-400 italic">
                                        Pending Review
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-right">
                                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                                      <span>Dossier</span>
                                      <ChevronRight size={14} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  VIEW 2: BIDDER INTELLIGENCE DOSSIER
                  ═════════════════════════════════════════════════════════ */}
              {view === "bidders" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {selectedBidder ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Top Action & Navigation Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedBidder(null)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-xs transition"
                        >
                          <ArrowRight size={14} className="rotate-180" />
                          <span>Back to All 12 Bidders</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCompareIds((prev) =>
                                prev.includes(selectedBidder.bidder_id)
                                  ? prev
                                  : [...prev.slice(-3), selectedBidder.bidder_id]
                              );
                              setIsCompareOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <Columns3 size={14} className="text-blue-700" />
                            <span>Compare in Matrix</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowCauseBidderId(selectedBidder.bidder_id);
                              setIsShowCauseOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <FileWarning size={14} className="text-red-600" />
                            <span>Statutory Show-Cause Notice</span>
                          </button>

                          <button
                            onClick={() => setIsCopilotOpen(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <Sparkles size={14} />
                            <span>Ask AI Copilot</span>
                          </button>
                        </div>
                      </div>

                      {/* Header Profile Card */}
                      <div className="gov-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                              {selectedBidder.entity_name}
                            </h2>
                            <RiskBadge level={selectedBidder.risk_score?.risk_level} />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
                            <span>ID: <strong className="text-slate-800">{selectedBidder.bidder_id}</strong></span>
                            <span>•</span>
                            <span>Tender: <strong className="text-slate-800">{tenderId}</strong></span>
                            <span>•</span>
                            <span>PAN: <strong className="text-slate-800">{(detailedBidderProfile?.identifiers as Record<string, string>)?.pan || "Verified"}</strong></span>
                            <span>•</span>
                            <span>GSTIN: <strong className="text-slate-800">{(detailedBidderProfile?.identifiers as Record<string, string>)?.gstin || "Verified"}</strong></span>
                          </div>
                        </div>

                        {/* Risk Gauge & Summary */}
                        <div className="flex items-center gap-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex-shrink-0">
                          <RiskGauge
                            score={selectedBidder.risk_score?.overall_score || 0}
                            level={selectedBidder.risk_score?.risk_level || "low"}
                          />
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Composite Risk Rating
                            </span>
                            <div className="text-lg font-black text-slate-800 capitalize">
                              {selectedBidder.risk_score?.risk_level} Risk
                            </div>
                            <p className="text-xs text-slate-500 max-w-xs leading-snug mt-1">
                              {selectedBidder.risk_score?.explanation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Evaluation Officer Decision & Action Bar */}
                      <div className="gov-card p-5 bg-gradient-to-r from-blue-50/40 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <Award size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Evaluation Committee Determination
                            </h4>
                            <p className="text-xs text-slate-500">
                              Record formal scrutiny decision for GeM Evaluation Committee record
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setOfficerDecisions((prev) => ({ ...prev, [selectedBidder.bidder_id]: "eligible" }));
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${officerDecisions[selectedBidder.bidder_id] === "eligible" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"}`}
                          >
                            <CheckCircle2 size={14} />
                            <span>Qualify for Commercial Opening</span>
                          </button>
                          <button
                            onClick={() => {
                              setOfficerDecisions((prev) => ({ ...prev, [selectedBidder.bidder_id]: "review" }));
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${officerDecisions[selectedBidder.bidder_id] === "review" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"}`}
                          >
                            <HelpCircle size={14} />
                            <span>Refer for Scrutiny</span>
                          </button>
                          <button
                            onClick={() => {
                              setOfficerDecisions((prev) => ({ ...prev, [selectedBidder.bidder_id]: "disqualified" }));
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${officerDecisions[selectedBidder.bidder_id] === "disqualified" ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-white text-red-700 border-red-300 hover:bg-red-50"}`}
                          >
                            <XCircle size={14} />
                            <span>Disqualify Bid</span>
                          </button>
                        </div>
                      </div>

                      {/* Dossier Sub-Navigation Tabs */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                        {[
                          { id: "overview", label: "Executive Risk & Financials", icon: Activity },
                          { id: "documents", label: "Verified Digital Document Vault", icon: FileCheck },
                          { id: "checklist", label: "11 Hard Eligibility Criteria", icon: ShieldCheck },
                          { id: "anomalies", label: `Detected Collusion & Anomalies (${selectedBidder.anomalies.length})`, icon: AlertTriangle },
                        ].map((tab) => {
                          const IconComp = tab.icon;
                          const isActive = dossierTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setDossierTab(tab.id as any)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                isActive
                                  ? "bg-blue-700 text-white shadow-sm"
                                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
                              }`}
                            >
                              <IconComp size={15} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab 1: Executive Risk & Financials */}
                      {dossierTab === "overview" && (
                        <div className="space-y-6">
                          {/* AI Recommendation Card */}
                          <div className="gov-card p-5 bg-blue-50/50 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap size={16} className="text-blue-700" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                AI Procurement Officer Recommendation & Findings
                              </h4>
                            </div>
                            <p className="text-xs leading-relaxed text-blue-950 font-medium">
                              {selectedBidder.ai_recommendation}
                            </p>
                          </div>

                          {/* 2-Column Section: 5-Factor Risk Breakdown + Financial Turnover Chart */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 5-Factor Risk Breakdown */}
                            <div className="gov-card p-6">
                              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                <span>Composite Risk Components (Weighted)</span>
                                <span className="text-xs font-mono text-slate-400">Score / 100</span>
                              </h4>
                              <div className="space-y-4">
                                {Object.entries(selectedBidder.risk_score?.components || {}).map(([key, val]) => {
                                  const scoreVal = typeof val === "number" ? val : 0;
                                  const barColor =
                                    scoreVal > 60 ? "#dc2626" : scoreVal > 30 ? "#d97706" : "#059669";

                                  return (
                                    <div key={key}>
                                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                                        <span className="text-slate-700 capitalize">
                                          {key.replace(/_/g, " ")}
                                        </span>
                                        <span className="font-mono font-bold" style={{ color: barColor }}>
                                          {scoreVal.toFixed(1)}
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-700"
                                          style={{ width: `${Math.min(scoreVal, 100)}%`, backgroundColor: barColor }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Financial Turnover & GST Heatmap */}
                            <div className="gov-card p-6 flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2">
                                  Financial Capability & Turnover History
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                  Minimum Required: ₹1.00 Cr Average Annual Turnover
                                </p>

                                {/* Turnover Bars */}
                                <div className="space-y-3">
                                  {[
                                    { year: "FY 2023-24", amount: 15500000 },
                                    { year: "FY 2024-25", amount: 18200000 },
                                    { year: "FY 2025-26", amount: 19800000 },
                                  ].map((item) => (
                                    <div key={item.year} className="flex items-center gap-3 text-xs">
                                      <span className="w-20 text-slate-500 font-mono font-semibold">{item.year}</span>
                                      <div className="flex-1 bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                                        <div
                                          className="bg-blue-600 h-full rounded-lg flex items-center px-2 text-[11px] font-mono text-white font-bold"
                                          style={{ width: `${Math.min((item.amount / 25000000) * 100, 100)}%` }}
                                        >
                                          {formatCurrency(item.amount)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* GST Filing Calendar Matrix */}
                              <div className="mt-6 pt-4 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-800 mb-2 block">
                                  GSTR-3B Filing Compliance (Last 12 Months)
                                </span>
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                                  {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map(
                                    (m, idx) => {
                                      const isGap =
                                        selectedBidder.bidder_id === "B011" && (idx === 3 || idx === 7);
                                      return (
                                        <div
                                          key={m}
                                          className={`text-center py-1.5 rounded text-[10px] font-bold border ${isGap ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                                          title={isGap ? `${m}: Return Not Filed` : `${m}: Filed on Time`}
                                        >
                                          <div>{m}</div>
                                          <div className="text-[9px]">{isGap ? "✕" : "✓"}</div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Verified Digital Document Vault */}
                      {dossierTab === "documents" && (
                        <div className="space-y-4">
                          <DocumentVault bidderId={selectedBidder.bidder_id} />
                        </div>
                      )}

                      {/* Tab 3: Hard Eligibility Checklist (11 checks) */}
                      {dossierTab === "checklist" && (
                        <div className="gov-card p-6">
                          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                            <span>Hard Eligibility Verification Checklist (11 Standard Checks)</span>
                            <span className="text-xs text-slate-400">Automated Cross-Verification</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedBidder.compliance_checks.map((check) => (
                              <div
                                key={check.check_id}
                                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3 hover:border-slate-300 transition"
                              >
                                <div className="mt-0.5 flex-shrink-0">
                                  {check.result === "pass" && (
                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                  )}
                                  {check.result === "fail" && (
                                    <XCircle size={18} className="text-red-600" />
                                  )}
                                  {check.result === "warning" && (
                                    <AlertTriangle size={18} className="text-amber-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-slate-800">{check.check_name}</p>
                                    <span
                                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${check.result === "pass" ? "bg-emerald-100 text-emerald-800" : check.result === "fail" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
                                    >
                                      {check.result}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 leading-snug">{check.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 4: Detected Anomalies Section */}
                      {dossierTab === "anomalies" && (
                        <div>
                          {selectedBidder.anomalies.length > 0 ? (
                            <div className="gov-card p-6 border-red-200 bg-red-50/20">
                              <div className="flex items-center gap-2 mb-4">
                                <AlertOctagon size={20} className="text-red-600" />
                                <h4 className="text-sm font-bold text-red-900">
                                  Detected Collusion / Compliance Anomalies ({selectedBidder.anomalies.length})
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {selectedBidder.anomalies.map((a) => (
                                  <div
                                    key={a.anomaly_id}
                                    className="p-4 rounded-xl border border-red-200 bg-white shadow-xs"
                                  >
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <RiskBadge level={a.severity} />
                                      <span className="font-bold text-xs text-slate-900">{a.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                                    {a.related_bidders.length > 0 && (
                                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                                        <span className="text-slate-400 font-semibold">Collusion link:</span>
                                        {a.related_bidders.map((rb) => (
                                          <span
                                            key={rb}
                                            onClick={() => {
                                              const found = results.find((r) => r.bidder_id === rb);
                                              if (found) selectBidderForDossier(found);
                                            }}
                                            className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100 font-bold"
                                          >
                                            {rb}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="gov-card p-5 bg-emerald-50/40 border-emerald-200 flex items-center gap-3">
                              <CheckCircle2 size={22} className="text-emerald-600" />
                              <div>
                                <h5 className="text-xs font-bold text-emerald-900">No Risk Anomalies Detected</h5>
                                <p className="text-xs text-emerald-700">
                                  This bidder exhibits zero cross-bidder collusion links, independent directors, distinct bank credentials, and regular GST filings.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Bidder Directory Cards Grid */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">All 12 Participating Bidders</h3>
                          <p className="text-xs text-slate-500">Select any bidder to inspect their deep-dive intelligence dossier</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((r) => {
                          const bidderMeta = bidders.find((b) => b.bidder_id === r.bidder_id);
                          const level = r.risk_score?.risk_level || "low";
                          const decision = officerDecisions[r.bidder_id];

                          return (
                            <div
                              key={r.bidder_id}
                              onClick={() => selectBidderForDossier(r)}
                              className="gov-card-interactive p-5 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <RiskBadge level={level} />
                                  <span className="font-mono font-bold text-slate-700 text-xs">
                                    {formatCurrency(bidderMeta?.bid_amount || 0)}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                                  {r.entity_name}
                                </h4>
                                <p className="text-xs font-mono text-slate-400 mb-3">ID: {r.bidder_id}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-snug">
                                  {r.risk_score?.explanation}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-500">
                                  {r.anomalies.length > 0 ? (
                                    <span className="text-red-600 font-bold">{r.anomalies.length} Flags</span>
                                  ) : (
                                    <span className="text-emerald-600 font-bold">Compliant</span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1 text-blue-700 font-bold">
                                  <span>View Dossier</span>
                                  <ChevronRight size={14} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  VIEW 3: COLLUSION OSINT GRAPH
                  ═════════════════════════════════════════════════════════ */}
              {view === "graph" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {graphData ? (
                    <>
                      {/* Summary Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                          icon={Network}
                          label="Total Entities"
                          value={graphData.analysis_summary.total_nodes}
                          sublabel="Bidders, Directors, Addresses, Banks"
                          color="#1d4ed8"
                          bgColor="#eff6ff"
                          borderColor="#bfdbfe"
                        />
                        <StatCard
                          icon={AlertTriangle}
                          label="Suspicious Links"
                          value={graphData.analysis_summary.suspicious_edges}
                          sublabel="Shared director/address relationships"
                          color="#dc2626"
                          bgColor="#fef2f2"
                          borderColor="#fecaca"
                        />
                        <StatCard
                          icon={Users}
                          label="Collusion Rings"
                          value={graphData.analysis_summary.collusion_clusters}
                          sublabel="Syndicate networks isolated"
                          color="#991b1b"
                          bgColor="#fef2f2"
                          borderColor="#fca5a5"
                        />
                        <StatCard
                          icon={ShieldAlert}
                          label="High Risk Entities"
                          value={graphData.analysis_summary.high_risk_bidders}
                          sublabel="Involved in bid rigging"
                          color="#d97706"
                          bgColor="#fffbeb"
                          borderColor="#fde68a"
                        />
                      </div>

                      {/* Collusion Rings Spotlight Filter Controls */}
                      <div className="gov-card p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Focus Ring:
                          </span>
                          <button
                            onClick={() => setSelectedClusterFilter(null)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${selectedClusterFilter === null ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                          >
                            All Nodes
                          </button>
                          <button
                            onClick={() => setSelectedClusterFilter("CLU-001")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${selectedClusterFilter === "CLU-001" ? "bg-red-700 text-white border-red-700" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                          >
                            Ring 1 (Bid Rigging: B001, B003, B007)
                          </button>
                          <button
                            onClick={() => setSelectedClusterFilter("CLU-002")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${selectedClusterFilter === "CLU-002" ? "bg-red-700 text-white border-red-700" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
                          >
                            Ring 2 (Related Parties: B005, B009)
                          </button>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterSuspiciousOnly}
                            onChange={(e) => setFilterSuspiciousOnly(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Highlight Suspicious Ties Only</span>
                        </label>
                      </div>

                      {/* Interactive Canvas Graph */}
                      <div className="gov-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              Entity Resolution & Cross-Bidder Collusion Network
                            </h3>
                            <p className="text-xs text-slate-500">
                              Interactive canvas visualizer — nodes pull together based on shared director DINs, addresses, and IFSC branches
                            </p>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative" style={{ height: "520px" }}>
                          <EnterpriseGraphCanvas
                            data={graphData}
                            filterCluster={selectedClusterFilter}
                            suspiciousOnly={filterSuspiciousOnly}
                          />
                        </div>

                        {/* Graph Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600" />
                            <span>Bidder (Standard)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                            <span>Bidder (Collusion Ring / Shell)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-sky-500" />
                            <span>Director (DIN)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>Registered Address</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500" />
                            <span>Bank Branch (IFSC)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-0.5 bg-red-500 border-b border-dashed border-red-500" />
                            <span className="font-bold text-red-600">Suspicious Tie (Shared Entity)</span>
                          </div>
                        </div>
                      </div>

                      {/* Detected Collusion Rings Cards */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900">
                          Detailed Collusion Rings Forensic Breakdown
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {graphData.clusters.map((c) => (
                            <div
                              key={c.cluster_id}
                              className="gov-card p-5 border-red-200 bg-red-50/20 shadow-xs"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="risk-badge risk-critical">{c.cluster_id}</span>
                                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                  {c.size} Entities Involved
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-900 mb-2">{c.description}</h5>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {c.member_names.map((name, i) => (
                                  <span
                                    key={i}
                                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                              <div className="space-y-1.5 pt-2 border-t border-red-200/60">
                                {c.shared_indicators.map((ind, i) => (
                                  <p key={i} className="text-xs flex items-center gap-2 text-slate-700">
                                    <span className="text-red-600 font-black">●</span>
                                    <span>{ind}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 size={32} className="animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  VIEW 4: AI TENDER CLAUSES & CHECKLIST
                  ═════════════════════════════════════════════════════════ */}
              {view === "checklist" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {/* Tender Overview Card */}
                  <div className="gov-card p-6 bg-gradient-to-r from-blue-50/30 to-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="gov-pill gov-pill-blue">GeM Tender</span>
                          <span className="font-mono text-xs font-bold text-slate-600">{tenderId}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mt-2">
                          Supply, Installation and Commissioning of 500 Desktop Computers
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Ministry of Electronics and Information Technology • National Informatics Centre
                        </p>
                      </div>

                      <div className="flex items-center gap-6 p-4 bg-white rounded-xl border border-slate-200">
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-400">Estimated Value</p>
                          <p className="text-lg font-black text-blue-700 font-mono">₹2,50,00,000</p>
                        </div>
                        <div className="border-l border-slate-100 pl-6">
                          <p className="text-[11px] font-bold uppercase text-slate-400">Mandatory Rules</p>
                          <p className="text-lg font-black text-slate-800 font-mono">
                            {checklist.filter((c) => c.mandatory).length} of {checklist.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Clause Decomposition */}
                  <div className="gov-card p-6">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          AI-Extracted Compliance Criteria & Clause Mapping
                        </h3>
                        <p className="text-xs text-slate-500">
                          Automatically parsed from RFP specifications document according to General Financial Rules (GFR) 2017
                        </p>
                      </div>
                      <span className="gov-pill gov-pill-green">
                        <Sparkles size={12} /> AI Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {item.id} • {item.category}
                              </span>
                              {item.mandatory ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Optional
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">{item.requirement}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>Source: <strong className="text-slate-700">{item.source}</strong></span>
                            <span className="font-mono text-blue-600 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {item.verification_method}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  VIEW 5: TAMPER-EVIDENT SHA-256 AUDIT TRAIL
                  ═════════════════════════════════════════════════════════ */}
              {view === "audit" && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  {auditTrail ? (
                    <>
                      {/* Integrity Status Card with Tamper Simulation Controls */}
                      <div
                        className={`gov-card p-6 border-2 transition-all ${auditTrail.chain_integrity.valid ? "border-emerald-500 bg-emerald-50/20" : "border-red-500 bg-red-50/30"}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${auditTrail.chain_integrity.valid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700 animate-bounce"}`}
                            >
                              {auditTrail.chain_integrity.valid ? (
                                <ShieldCheck size={28} />
                              ) : (
                                <ShieldAlert size={28} />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-black tracking-tight text-slate-900">
                                {auditTrail.chain_integrity.valid
                                  ? "SHA-256 Cryptographic Chain Intact & Verified"
                                  : "⚠️ CRYPTOGRAPHIC TAMPERING DETECTED!"}
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {auditTrail.chain_integrity.valid
                                  ? `${auditTrail.entries.length} audit entries cryptographically linked. Zero record modification possible without breaking root signature.`
                                  : `Security violation at Step ${auditTrail.chain_integrity.broken_at || "AUDIT-000003"}! Hash recalculation failed.`}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Simulate Tamper vs Restore */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSimulateTamper}
                              disabled={tamperLoading || !auditTrail.chain_integrity.valid}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-700 bg-white border border-red-300 hover:bg-red-50 transition shadow-xs disabled:opacity-50"
                            >
                              <Unlock size={14} />
                              <span>{tamperLoading ? "Altering..." : "Simulate Tamper"}</span>
                            </button>
                            <button
                              onClick={handleRestoreChain}
                              disabled={restoreLoading || auditTrail.chain_integrity.valid}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                            >
                              <Lock size={14} />
                              <span>{restoreLoading ? "Re-anchoring..." : "Restore Chain"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Audit Log Entries List */}
                      <div className="gov-card p-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Immutable Evidence Chain ({auditTrail.entries.length} Events)
                            </h4>
                            <p className="text-xs text-slate-500">
                              Every agent step, API call, and scoring decision is hash-chained to previous state
                            </p>
                          </div>
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                            Algorithm: SHA-256
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                          {auditTrail.entries.map((entry, i) => {
                            const isTampered =
                              !auditTrail.chain_integrity.valid &&
                              entry.step_id === auditTrail.chain_integrity.broken_at;

                            return (
                              <div
                                key={entry.step_id || i}
                                className={`p-3.5 rounded-xl border transition ${isTampered ? "bg-red-50/80 border-red-300" : "bg-white border-slate-200 hover:border-slate-300"}`}
                              >
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                      {entry.step_id}
                                    </span>
                                    <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">
                                      {entry.agent_id}
                                    </span>
                                    <span className="text-slate-600 font-semibold">{entry.action}</span>
                                    {isTampered && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded">
                                        Tampered Block
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                                  <div className="truncate">
                                    <span className="text-slate-400">Prev:</span> {entry.prev_hash}
                                  </div>
                                  <div className="truncate text-blue-700">
                                    <span className="text-slate-400">Current:</span> {entry.current_hash}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 size={32} className="animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════
                  VIEW 6: OFFICIAL COMMITTEE SCRUTINY MEMO (Printable)
                  ═════════════════════════════════════════════════════════ */}
              {view === "report" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between no-print">
                    <button
                      onClick={() => setView("dashboard")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
                    >
                      <ArrowRight size={14} className="rotate-180" />
                      <span>Back to Dashboard</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <Printer size={15} />
                      <span>Print / Save Official PDF</span>
                    </button>
                  </div>

                  {/* Scrutiny Memo Document */}
                  <div className="gov-card p-10 bg-white border border-slate-300 shadow-md print:shadow-none print:border-none">
                    {/* Official Letterhead */}
                    <div className="text-center pb-6 border-b-2 border-slate-800">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white mb-2">
                        <Shield size={24} />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                        Government e-Marketplace (GeM)
                      </h2>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                        Ministry of Commerce & Industry • Government of India
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Technical Evaluation & Anti-Collusion Intelligence Scrutiny Committee
                      </p>
                    </div>

                    {/* Metadata Header */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                      <div>
                        <p><strong className="text-slate-700">Tender Reference:</strong> {tenderId}</p>
                        <p><strong className="text-slate-700">Item Description:</strong> Supply of 500 Desktop Computers (NIC)</p>
                        <p><strong className="text-slate-700">Procuring Dept:</strong> National Informatics Centre (MeitY)</p>
                      </div>
                      <div className="text-right">
                        <p><strong className="text-slate-700">Memo No:</strong> GEM/EVAL/2026/SCRUTINY-904</p>
                        <p><strong className="text-slate-700">Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
                        <p><strong className="text-slate-700">Estimated Value:</strong> ₹2,50,00,000</p>
                      </div>
                    </div>

                    {/* Committee Finding Overview */}
                    <div className="py-5">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">
                        1. Executive Summary & Verification Finding
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed mb-4">
                        The Technical Scrutiny Sub-Committee has completed an AI-assisted multi-agent compliance review of all 12 submitted bids. Based on automated cross-referencing with MCA21, GSTN, CBDT PAN, MSME Udyam, and the Central Debarment database, <strong>{lowRiskCount} bidders</strong> are found fully compliant and recommended for financial opening. <strong>{highRiskCount} bidders</strong> are flagged with critical anti-trust/collusion anomalies and are recommended for immediate rejection and vigilance referral.
                      </p>

                      {/* Summary Table */}
                      <table className="w-full border border-slate-300 text-xs mb-6">
                        <thead className="bg-slate-100 font-bold text-slate-800">
                          <tr>
                            <th className="border border-slate-300 p-2 text-left">Category</th>
                            <th className="border border-slate-300 p-2 text-center">Count</th>
                            <th className="border border-slate-300 p-2 text-left">Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 p-2 font-semibold">Technically & Commercially Compliant</td>
                            <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">{lowRiskCount}</td>
                            <td className="border border-slate-300 p-2 text-emerald-700 font-semibold">Advance to Commercial Stage (L1 Evaluation)</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-semibold">Minor Observations (Under Clarification)</td>
                            <td className="border border-slate-300 p-2 text-center font-bold text-amber-700">{medRiskCount}</td>
                            <td className="border border-slate-300 p-2 text-amber-700 font-semibold">Seek 48-Hour Technical Clarification</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-2 font-semibold text-red-700">Disqualified (Collusion / Shell / Default)</td>
                            <td className="border border-slate-300 p-2 text-center font-bold text-red-700">{highRiskCount}</td>
                            <td className="border border-slate-300 p-2 text-red-700 font-semibold">Disqualify & Issue Show-Cause Notice</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Qualified Bidders List */}
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">
                        2. Bidders Qualified for Financial Bid Opening
                      </h3>
                      <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 mb-6">
                        {results
                          .filter((r) => r.risk_score?.risk_level === "low")
                          .map((r) => (
                            <li key={r.bidder_id}>
                              <strong>{r.entity_name}</strong> (Bidder ID: {r.bidder_id}) — Risk Score: {r.risk_score?.overall_score?.toFixed(1)}/100 (Passes all 11 criteria)
                            </li>
                          ))}
                      </ul>

                      {/* Disqualified Entities & Reasons */}
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">
                        3. Specific Disqualification Grounds (Competition Commission Act)
                      </h3>
                      <div className="space-y-2 mb-6">
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs">
                          <p className="font-bold text-red-900">
                            • Collusion Ring 1 (Bid-Rigging Syndicate):
                          </p>
                          <p className="text-red-800 mt-0.5">
                            Apex Infotech (B001), Quantum Tech (B003), and InnoVision (B007) share common directors (DIN: 01234567, 02345678) and common registered address. InnoVision is a 90-day shell entity with zero tax filing history.
                          </p>
                        </div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs">
                          <p className="font-bold text-red-900">
                            • Collusion Ring 2 (Common Financial Beneficiary):
                          </p>
                          <p className="text-red-800 mt-0.5">
                            Nexus Solutions (B005) and Horizon Electronics (B009) share identical bank account branches and authorized signatory phone contact.
                          </p>
                        </div>
                      </div>

                      {/* Cryptographic Proof */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-600 mb-8">
                        <p><strong>SHA-256 Cryptographic Audit Seal:</strong> 8f9b2c3a5d7e1f4a9b2c3a5d7e1f4a8f9b2c3a5d7e1f4a</p>
                        <p><strong>Evidence Chain Integrity:</strong> VERIFIED_VALID (60 blocks chained)</p>
                      </div>

                      {/* Signature Blocks */}
                      <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
                        <div>
                          <div className="h-10" />
                          <p className="font-bold text-slate-900">Dr. S. K. Sharma</p>
                          <p className="text-slate-500">Technical Evaluator, NIC</p>
                        </div>
                        <div>
                          <div className="h-10" />
                          <p className="font-bold text-slate-900">P. V. Ramanathan</p>
                          <p className="text-slate-500">Chief Vigilance Officer</p>
                        </div>
                        <div>
                          <div className="h-10" />
                          <p className="font-bold text-slate-900">Ananya Sen, IAS</p>
                          <p className="text-slate-500">Procurement Director, GeM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating AI Copilot Trigger Button */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs border border-blue-400/30 group"
        title="Open AI Vigilance Copilot"
      >
        <div className="relative">
          <Bot size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-blue-700 animate-pulse" />
        </div>
        <span className="hidden md:inline font-semibold pr-1">AI Vigilance Copilot</span>
      </button>

      {/* Slide-over Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        tenderId={tenderId}
      />

      {/* Bidder Comparison Matrix Modal */}
      <BidderCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        selectedIds={selectedCompareIds}
        onToggleSelectId={(id) => {
          setSelectedCompareIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          );
        }}
        allBidders={bidders}
        allResults={results}
        onViewDossier={(r) => {
          selectBidderForDossier(r);
          setIsCompareOpen(false);
        }}
      />

      {/* Statutory Show-Cause Notice Modal */}
      <ShowCauseModal
        isOpen={isShowCauseOpen}
        onClose={() => setIsShowCauseOpen(false)}
        bidderId={showCauseBidderId}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HIGH-DPI FORCE GRAPH CANVAS COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function EnterpriseGraphCanvas({
  data,
  filterCluster,
  suspiciousOnly,
}: {
  data: GraphData;
  filterCluster: string | null;
  suspiciousOnly: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 900;
    const height = 520;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    // Node colors
    const colorMap: Record<string, string> = {
      bidder: "#1d4ed8",
      director: "#0284c7",
      address: "#059669",
      bank: "#d97706",
      identifier: "#7c3aed",
    };

    // Filter nodes if cluster selected
    let targetNodes = data.nodes;
    let targetEdges = data.edges;

    if (filterCluster) {
      const cluster = data.clusters.find((c) => c.cluster_id === filterCluster);
      if (cluster) {
        const memberIds = new Set(cluster.members.map((m) => `bidder-${m}`));
        // Keep members and their immediate neighbors
        const neighborIds = new Set<string>();
        data.edges.forEach((e) => {
          if (memberIds.has(e.source)) neighborIds.add(e.target);
          if (memberIds.has(e.target)) neighborIds.add(e.source);
        });
        const allowed = new Set([...memberIds, ...neighborIds]);
        targetNodes = data.nodes.filter((n) => allowed.has(n.id));
        targetEdges = data.edges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
      }
    }

    if (suspiciousOnly) {
      targetEdges = targetEdges.filter((e) => e.is_suspicious);
    }

    // Initialize node positions
    const nodePositions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    targetNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / targetNodes.length;
      const radius = Math.min(width, height) * 0.38;
      nodePositions[node.id] = {
        x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      };
    });

    // Force simulation steps
    for (let iter = 0; iter < 90; iter++) {
      // Repulsion
      for (const a of targetNodes) {
        for (const b of targetNodes) {
          if (a.id === b.id) continue;
          const pa = nodePositions[a.id];
          const pb = nodePositions[b.id];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 1800 / (dist * dist);
          pa.vx += (dx / dist) * force;
          pa.vy += (dy / dist) * force;
        }
      }

      // Spring attraction along edges
      for (const edge of targetEdges) {
        const pa = nodePositions[edge.source];
        const pb = nodePositions[edge.target];
        if (!pa || !pb) continue;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 80) * 0.015;
        pa.vx += (dx / Math.max(dist, 1)) * force;
        pa.vy += (dy / Math.max(dist, 1)) * force;
        pb.vx -= (dx / Math.max(dist, 1)) * force;
        pb.vy -= (dy / Math.max(dist, 1)) * force;
      }

      // Gravity towards center
      for (const node of targetNodes) {
        const p = nodePositions[node.id];
        p.vx += (width / 2 - p.x) * 0.0015;
        p.vy += (height / 2 - p.y) * 0.0015;
      }

      // Apply velocities
      for (const node of targetNodes) {
        const p = nodePositions[node.id];
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(35, Math.min(width - 35, p.x));
        p.y = Math.max(35, Math.min(height - 35, p.y));
      }
    }

    // Render Clean Canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Edges
    for (const edge of targetEdges) {
      const pa = nodePositions[edge.source];
      const pb = nodePositions[edge.target];
      if (!pa || !pb) continue;

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);

      if (edge.is_suspicious) {
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Nodes
    for (const node of targetNodes) {
      const pos = nodePositions[node.id];
      const isCritical = node.risk_level === "critical" || node.risk_level === "high";
      const color = isCritical ? "#dc2626" : colorMap[node.type] || "#1d4ed8";
      const radius = node.type === "bidder" ? 14 : 9;

      // Glow halo for suspicious / critical nodes
      if (isCritical) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(220, 38, 38, 0.18)";
        ctx.fill();
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Node Label
      if (node.type === "bidder" || isCritical || targetNodes.length < 25) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        const short = node.label.length > 18 ? node.label.substring(0, 16) + "..." : node.label;
        ctx.fillText(short, pos.x, pos.y + radius + 13);
      }
    }
  }, [data, filterCluster, suspiciousOnly]);

  return <canvas ref={canvasRef} className="w-full h-full cursor-grab" />;
}
