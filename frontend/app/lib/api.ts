/** API configuration */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
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
  tamperAuditTrail: (stepId?: string) =>
    fetchAPI("/api/verification/tamper", {
      method: "POST",
      body: JSON.stringify({ step_id: stepId }),
    }),
  restoreAuditTrail: () =>
    fetchAPI("/api/verification/restore", { method: "POST" }),
  getScrutinyReport: (tenderId: string) =>
    fetchAPI(`/api/verification/report/${tenderId}`),
  queryCopilot: (query: string, tenderId?: string, bidderId?: string) =>
    fetchAPI("/api/verification/copilot", {
      method: "POST",
      body: JSON.stringify({ query, tender_id: tenderId, bidder_id: bidderId }),
    }),
  getShowCauseNotice: (bidderId: string) =>
    fetchAPI(`/api/verification/show-cause/${bidderId}`),
  getBidderDocuments: (bidderId: string) =>
    fetchAPI(`/api/verification/documents/${bidderId}`),

  // Graph
  getBidderGraph: (bidderId: string) =>
    fetchAPI(`/api/graph/bidder/${bidderId}`),
  getCollusionGraph: (tenderId: string) =>
    fetchAPI(`/api/graph/collusion/${tenderId}`),
};

