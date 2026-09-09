# Regulatory Integration Roadmap: AuthBid (BidVerify)

> **Document Classification:** Technical Architecture & Compliance Roadmap  
> **Target Domain:** Indian Public Procurement Verification Ecosystem (GeM, MCA21, GSTN, CBDT, MSME, CPPP)

---

## 1. Executive Context

In the current demonstration and sandbox environment, AuthBid executes compliance checks and entity resolution against **deterministic mock APIs** (`/api/v1/gst`, `/api/v1/pan`, `/api/v1/udyam`, `/api/v1/mca`, `/api/v1/blacklist`) with seeded synthetic bidder records. 

This document defines the formal engineering and legal roadmap to transition from synthetic simulation to live production integrations with official Indian statutory registries.

---

## 2. Statutory Registry Integration Specifications

### 2.1 GSTN (Goods & Services Tax Network)
- **Production Authority:** Goods and Services Tax Network (GSTN) / NIC
- **Access Protocol:** GSP (GST Suvidha Provider) / ASP Channel with OAuth2 mTLS.
- **API Endpoints:**
  - `GET /taxpayerapi/v1.2/returns`: Monthly GSTR-3B and GSTR-1 filing status, dates, and turnover slabs.
  - `GET /taxpayerapi/v1.0/search`: Legal name, trade name, active/cancelled/suspended registration status, principal place of business.
- **Verification Logic:**
  - Automated detection of unfiled returns within the preceding 12 calendar months.
  - Cross-verification of taxable turnover in GSTR-3B against bidder's self-declared financial bid figures.
- **Sandboxing & Live Staging:**
  - Phase 1: GSTN Developer Portal Sandbox (GSP staging environment).
  - Phase 2: Production Whitelisted Static IP gateway with digitally signed payloads.

---

### 2.2 MCA21 (Ministry of Corporate Affairs)
- **Production Authority:** Ministry of Corporate Affairs (MCA), Government of India
- **Access Protocol:** MCA21 V3 RESTful Services via National Data & Analytics Platform (NDAP) / API Setu.
- **API Endpoints:**
  - `GET /mca/v3/company/{CIN}`: Company master data (incorporation date, paid-up capital, registered office address, active status).
  - `GET /mca/v3/director/{DIN}`: List of all associated directorships across Indian corporations.
- **Verification Logic:**
  - **Entity Resolution Engine**: Ingests DIN numbers of all active directors to compute cross-bidder bipartite graph ties.
  - **Shell Company Heuristic**: Cross-references company age with filed annual returns (MGT-7, AOC-4).
- **Access Requirements:**
  - Authorization under GeM Inter-Departmental Data Sharing MoU.

---

### 2.3 CBDT / NSDL (Permanent Account Number Verification)
- **Production Authority:** Central Board of Direct Taxes (CBDT) / Protean eGov Technologies (formerly NSDL)
- **Access Protocol:** Online PAN Verification (OPV) API with AES-256 encrypted payload and asymmetric RSA key exchange.
- **API Endpoints:**
  - `POST /pan/v2/verify`: Verification of 10-digit alphanumeric PAN, entity status (Individual, Firm, Company), and Aadhaar-PAN linkage status.
- **Verification Logic:**
  - Levenshtein distance matching between the PAN database registered legal name and the GeM bidder registration name.
  - Alerts when PAN is inoperative or name similarity is below 85%.

---

### 2.4 Ministry of MSME (Udyam Portal)
- **Production Authority:** Ministry of Micro, Small and Medium Enterprises
- **Access Protocol:** Udyam API via API Setu / NIC National Portal.
- **API Endpoints:**
  - `GET /udyam/v1/verify/{Udyam_Registration_Number}`: Enterprise type (Micro, Small, Medium), major activity (Manufacturing / Services), date of commencement, investment in plant/machinery.
- **Verification Logic:**
  - Determines eligibility for statutory exemptions under GFR 2017 Rule 153 (exemption from EMD and prior turnover/experience requirements).
  - Flags expired provisional certificates or mismatches in declared category.

---

### 2.5 CPPP & GeM Incident Management (Blacklist / Debarment)
- **Production Authority:** Central Public Procurement Portal (CPPP) / GeM Debarment Repository
- **Access Protocol:** Automated batch query and webhook ingestion.
- **API Endpoints:**
  - `GET /cppp/v1/debarred-entities?pan={PAN}&cin={CIN}`: Current active debarment orders, order date, debarring ministry/PSU, and debarment period under GFR Rule 151.
- **Verification Logic:**
  - Strict binary disqualification check: Any active debarment order results in mandatory hard eligibility failure.

---

## 3. UI Labeling & Disclaimer Architecture

To eliminate any ambiguity between demonstration data and live regulatory checks:
1. **Prominent UI Badges:**
   - Every registry component carries an explicit `[SIMULATED DEMO REGISTRY]` badge.
2. **Document Vault Watermarks:**
   - Simulated documents display watermark: `"DEMO DATA — SYNTHETIC RECORD FOR EVALUATION"`.
3. **Audit Trail Transparency:**
   - Audit blocks clearly record `source: "SIMULATED_SANDBOX"` until production certificates are installed.

---

## 4. Phased Production Rollout Schedule

| Milestone | Target Horizon | Deliverables |
|:---|:---|:---|
| **Phase 1: API Setu Onboarding** | Q3 2026 | Register AuthBid application on API Setu gateway with government agency credentials. |
| **Phase 2: GSTN & PAN Integration** | Q4 2026 | Switch GST and PAN verification from mock controllers to GSP sandbox and NSDL production. |
| **Phase 3: MCA21 & DIN Graph Ingestion** | Q1 2027 | Integrate live MCA21 V3 director master API for real-time corporate linkage resolution. |
| **Phase 4: Full Production Certification** | Q2 2027 | STQC security audit, Cert-In vulnerability certification, and formal GeM production deployment. |
