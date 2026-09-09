/** API configuration */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let currentActiveRole: string = "officer";

export function setActiveRole(role: string) {
  currentActiveRole = role;
}

export function getActiveRole(): string {
  return currentActiveRole;
}

export async function fetchAPI(endpoint: string, options?: RequestInit, role?: string) {
  const effectiveRole = role || currentActiveRole;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Role": effectiveRole,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errorDetail = `${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Tenders
  getTenders: () => fetchAPI("/api/tenders"),
  getTender: (id: string) => fetchAPI(`/api/tenders/${id}`),
  getChecklist: (id: string) => fetchAPI(`/api/tenders/${id}/checklist`),

  // Bidders
  getBidders: () => fetchAPI("/api/bidders"),
  getBidder: (id: string) => fetchAPI(`/api/bidders/${id}`),
  getBidderVerification: (bidderId: string, tenderId: string) =>
    fetchAPI(`/api/bidders/${bidderId}/verification/${tenderId}`),

  // Verification
  runVerification: (tenderId: string) =>
    fetchAPI(`/api/verification/run/${tenderId}`, { method: "POST" }),
  getResults: (tenderId: string) =>
    fetchAPI(`/api/verification/results/${tenderId}`),
  getAuditTrail: () => fetchAPI("/api/verification/audit-trail"),
  tamperAuditTrail: (stepId?: string, role = "admin") =>
    fetchAPI(
      "/api/verification/tamper",
      {
        method: "POST",
        body: JSON.stringify({ step_id: stepId }),
      },
      role
    ),
  restoreAuditTrail: (role = "admin") =>
    fetchAPI("/api/verification/restore", { method: "POST" }, role),
  anchorAuditTrail: (role = "officer") =>
    fetchAPI("/api/verification/anchor", { method: "POST" }, role),
  getAnchorReceipt: () => fetchAPI("/api/verification/anchor"),
  recordDecision: (
    payload: {
      bidder_id: string;
      tender_id: string;
      decision: string;
      reason: string;
      justification: string;
      officer_name?: string;
    },
    role?: string
  ) =>
    fetchAPI(
      "/api/verification/decision",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      role
    ),
  getDecisions: (tenderId: string) =>
    fetchAPI(`/api/verification/decisions/${tenderId}`),
  getScrutinyReport: (tenderId: string) =>
    fetchAPI(`/api/verification/report/${tenderId}`),
  queryCopilot: (query: string, tenderId?: string, bidderId?: string) =>
    fetchAPI("/api/verification/copilot", {
      method: "POST",
      body: JSON.stringify({ query, tender_id: tenderId, bidder_id: bidderId }),
    }),
  getShowCauseNotice: (bidderId: string, role = "officer") =>
    fetchAPI(`/api/verification/show-cause/${bidderId}`, undefined, role),
  getBidderDocuments: (bidderId: string) =>
    fetchAPI(`/api/verification/documents/${bidderId}`),

  // Graph
  getBidderGraph: (bidderId: string) =>
    fetchAPI(`/api/graph/bidder/${bidderId}`),
  getCollusionGraph: (tenderId: string) =>
    fetchAPI(`/api/graph/collusion/${tenderId}`),
};


