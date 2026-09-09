# 🛡️ AuthBid — GeM Compliance Intelligence
## AI-Powered Integrated Bid Compliance Verification & Collusion Detection Platform
**Project ID:** SIH26100 | Smart India Hackathon  
**Target Domain:** Public Procurement & Bid Scrutiny on Government e-Marketplace (GeM)

---

## 📌 Executive Summary

**AuthBid** is an end-to-end intelligent compliance verification system designed for procurement officers scrutinizing tenders on the Government e-Marketplace (GeM). It replaces time-consuming, error-prone manual document verification with an automated multi-agent AI pipeline, detects organized bid-rigging and cartel formation via graph neural entity resolution, and maintains an immutable, cryptographically verifiable SHA-256 hash-chained audit trail.

---

## 🏗️ System Architecture & Workflow

```mermaid
graph TD
    subgraph INGESTION["Input Data Ingestion"]
        Tender["GeM Tender RFP & Bids<br/>(GEM/2026/B/4521897)"]
        BidderDocs["Bidder Documents<br/>(GST REG-06, PAN, Balance Sheets)"]
    end

    subgraph DETERMINISTIC["Deterministic & Rule-Based Engines (Non-LLM / Mathematically Verifiable)"]
        direction TB
        RegEngine["<b>1. Regulatory Rules Engine</b><br/>• GSTN active filing check<br/>• CBDT PAN exact name matching<br/>• MCA21 incorporation & DIN scan<br/>• MSME Udyam GFR 153 exemption<br/>• CPPP / GeM Debarment check"]
        
        EntityRes["<b>2. Entity Resolution & Graph Engine</b><br/>• Common director DIN matching<br/>• Physical address string unification<br/>• Bank IFSC + account prefix linkage<br/>• Shell company age & filing heuristic"]
        
        RiskEngine["<b>3. 5-Vector Weighted Risk Scoring</b><br/>• Cross-Source Consistency (30%)<br/>• Collusion Indicators (25%)<br/>• Financial Health (20%)<br/>• Document Integrity (15%)<br/>• Blacklist Proximity (10%)"]
        
        AuditChain["<b>4. Cryptographic Audit Defense</b><br/>• SHA-256 block-by-block hash chaining<br/>• Merkle root commitment<br/>• External RFC 3161 timestamp anchoring<br/>• Tamper detection & broken block pinpointing"]
        
        LegalTemplates["<b>5. Statutory Legal Engine</b><br/>• Show Cause Notice drafting (GFR 151 / Competition Act 3(3))<br/>• Committee Scrutiny Memo generation"]
    end

    subgraph GENERATIVE["Generative AI Component (LLM-Backed)"]
        Copilot["<b>GeM Legal & Vigilance Copilot</b><br/>(Gemini 2.5 Flash)<br/>• Natural language bidder intelligence<br/>• Statutory cross-examination<br/>• <i>Protected by XML context isolation & input sanitization</i>"]
    end

    subgraph OUTPUTS["Outputs & Officer Actions"]
        Dash["Procurement Officer Dashboard"]
        CollusionGraph["Interactive Collusion Graph (2D)"]
        SCN["Formal Show Cause Notice"]
        DecisionLog["Immutable Decision Audit Log"]
    end

    Tender --> RegEngine
    BidderDocs --> RegEngine
    RegEngine --> EntityRes
    EntityRes --> RiskEngine
    RiskEngine --> AuditChain
    RiskEngine --> LegalTemplates

    AuditChain --> Dash
    EntityRes --> CollusionGraph
    LegalTemplates --> SCN
    RiskEngine --> Dash
    Dash --> DecisionLog

    RiskEngine -. Sanitized Context .-> Copilot
    Tender -. Sanitized Context .-> Copilot
    Copilot --> Dash

    classDef deterministic fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef generative fill:#fdf4ff,stroke:#c026d3,stroke-width:2px,stroke-dasharray: 5 5,color:#701a75;
    classDef inputs fill:#f8fafc,stroke:#64748b,stroke-width:1px,color:#0f172a;
    classDef outputs fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;

    class RegEngine,EntityRes,RiskEngine,AuditChain,LegalTemplates deterministic;
    class Copilot generative;
    class Tender,BidderDocs inputs;
    class Dash,CollusionGraph,SCN,DecisionLog outputs;
```

---

## 🚀 Core Functionalities

### 1. 🤖 Automated Multi-Agent Verification Pipeline
Instead of procurement committees spending days manually examining certificates, a 5-stage sequential agent pipeline automates evaluation:
* **Agent 1: RFP & Eligibility Ingestion**
  * Parses tender criteria, including technical specifications, minimum annual turnover, minimum years of operational experience, and domestic local content (Make-in-India) thresholds.
* **Agent 2: Simulated Multi-Registry Verification**
  * **GSTN (GST Portal)**: Validates active registration, jurisdiction, tax slab, and regularity of monthly GSTR-3B filings.
  * **PAN (NSDL/UTIITSL)**: Verifies valid PAN status and performs exact match checks against the registered corporate entity name.
  * **MCA21 (Ministry of Corporate Affairs)**: Validates Corporate Identification Number (CIN), active Director Identification Numbers (DINs), paid-up capital, date of incorporation, and registered office.
  * **Udyam / MSME Portal**: Validates Micro/Small/Medium Enterprise registration to determine statutory relaxations (e.g., turnover and prior experience exemptions under GFR Rule 153).
  * **Debarment & Blacklist Registry**: Scans against Central Public Procurement Portal (CPPP) and GeM incident management blacklists.
* **Agent 3: Cross-Source Consistency & Triangulation**
  * Cross-verifies declared financial turnovers against actual GST taxable filings and Income Tax Returns (ITR) to catch fabricated certificates.
* **Agent 4: Composite Risk Scoring Engine**
  * Generates an explainable 0–100 risk score based on five weighted components:
    1. **Cross-Source Consistency (30%)**
    2. **Collusion Indicators (25%)**
    3. **Financial Health & Turnover (20%)**
    4. **Document Integrity & Checksums (15%)**
    5. **Blacklist Proximity & History (10%)**
* **Agent 5: Cryptographic SHA-256 Audit Anchoring**
  * Hashes all input data, rule outputs, and verification determinations, chaining them cryptographically and anchoring to an external RFC 3161 timestamp log to prevent ex-post alterations.

---

### 2. 🕸️ Interactive Collusion & Knowledge Graph (`/graph`)
Cartels and shell companies frequently submit artificial "cover bids" to simulate competition. AuthBid uncovers these syndicates using an interactive 2D Force-Directed Graph:
* **Entity Resolution**:
  * **Shared Directors / DINs**: Connects distinct bidder companies that share board members or authorized signatories.
  * **Shared Registered Addresses**: Maps multiple bidding companies operating out of the same physical building, suite, or pincode.
  * **Shared Banking Footprint**: Flags bidders using the same IFSC branch, account number prefixes, or common bank accounts.
  * **Shared Contact Details**: Links corporate profiles sharing identical phone numbers or administrative emails.
* **Shell Company Heuristics**:
  * Automatically flags entities incorporated shortly before tender issuance (e.g., < 3 months) with no verifiable GST filing history.
* **Graph Filters & Focus**:
  * Toggle between the complete ecosystem or **Suspicious Only** edges.
  * Filter by specific detected collusion rings.

---

### 3. 📊 Commercial Price & Spectrum Analysis
* **L1 Anomaly & Outlier Detection**: Identifies abnormally low tenders (bids heavily undercut to win awards but likely to result in contract abandonment or sub-par quality).
* **Price Clustering Detection**: Visualizes bid quotes across a distribution curve to identify unnaturally tight pricing spreads characteristic of collusive price fixing.
* **Budget Benchmark Comparison**: Evaluates quotes against government estimated tender sanction values (e.g., ₹1.50 Cr).

---

### 4. 🔒 Tamper-Evident Cryptographic Audit Trail (`/audit`)
* **SHA-256 Hash-Chained Blockchain-Style Ledger**:
  * Every pipeline action logs:
    $$\text{current\_hash} = \text{SHA-256}(\text{prev\_hash} \parallel \text{agent\_id} \parallel \text{action} \parallel \text{input\_hash} \parallel \text{output\_hash})$$
* **Live Chain Validation**:
  * Real-time traversal checks verifying that every block correctly points to the preceding block's hash.
* **Interactive Tamper Simulation (`Simulate Tampering`)**:
  * Allows evaluators and committee members to simulate an unauthorized database record modification, demonstrating immediate chain rupture detection with exact block identification.
* **Cryptographic Restore**:
  * Demonstrates the re-anchoring of cryptographic proofs back to a verified state.

---

### 5. 📑 Document Vault & Dossier Inspection
* Detailed digital dossier for each bidder holding extracted artifacts:
  * GST Registration Certificate (Form REG-06)
  * Corporate PAN Card
  * Audited Balance Sheets & Profit & Loss statements
  * Income Tax Return (ITR-V) Acknowledgments
  * Udyam MSME Registration Certificate
  * Make-in-India Local Value Addition Self-Declaration
* Features SHA-256 file checksums, verified badges, and cross-source verification evidence.

---

### 6. ⚖️ Automated Legal Show Cause Notice Generation
* Instantly drafts formal, legally backed **Show Cause Notices** against non-compliant or colluding bidders.
* Cites statutory legal frameworks:
  * **Section 3(3) of the Competition Act, 2002**: Prohibition of anti-competitive agreements, bid-rigging, and collusive bidding.
  * **Rule 151 of General Financial Rules (GFR) 2017**: Debarment from bidding for integrity offenses and falsification.
  * **GeM Incident Management Policy**: Standard operating procedures for vendor blacklisting.
* Features integrated export and print formatting for official dispatch.

---

### 7. 💬 AI Procurement Copilot
* Conversational AI sidecar powered by Gemini (with reliable rule-based fallback).
* Allows procurement officers to query bid data in plain English:
  * *"Why was Bidder B001 marked as critical risk?"*
  * *"Show all bidders exempted under the MSE category."*
  * *"What is the evidence linking B001, B003, and B007?"*

---

### 8. 📝 Scrutiny Report & Decision Workflow
* Enables officers to record remarks and assign formal statuses:
  * 🟢 **Eligible**
  * 🟡 **Under Review / Clarification Sought**
  * 🔴 **Disqualified**
* Generates a comprehensive **Executive Scrutiny Report** suitable for tender evaluation committees, summarizing technical compliance, commercial pricing, and disqualification grounds.

---

## 🎯 Sample Demonstration Scenario

**Tender Reference:** `GEM/2026/B/4521897`  
**Description:** Supply of 500 Desktop Computers with 3-Year On-Site Warranty  
**Estimated Value:** ₹1,50,00,000 (₹1.50 Crore)  
**Dataset:** 12 Synthetic Bidders with pre-planted realistic anomalies:

| Bidder ID | Entity Name | Bid Amount | Placed Finding / Anomaly | Risk Level |
| :--- | :--- | :---: | :--- | :---: |
| **B001** | Apex Infotech Solutions | ₹1,42,50,000 | **Collusion Ring 1**: Shared directors & address with B003 & B007 | 🔴 Critical |
| **B002** | Bharat Digital Systems | ₹1,48,90,000 | Clean bidder; valid MSME, GST, and MCA records | 🟢 Low |
| **B003** | Zenith Computech Ltd | ₹1,46,20,000 | **Collusion Ring 1**: Shared directors with B001 & B007 | 🔴 Critical |
| **B004** | Precision IT Hardware | ₹1,51,00,000 | Expired MSME certificate; failed turnover threshold | 🟡 Medium |
| **B005** | Delta Edge Technologies | ₹1,39,80,000 | **Collusion Ring 2**: Shared bank account & phone with B009 | 🔴 High |
| **B006** | CyberNet Infraworks | ₹1,44,00,000 | Entity name on PAN mismatches GST legal name | 🟡 Medium |
| **B007** | NexGen Systems Pvt Ltd | ₹1,49,50,000 | **Collusion Ring 1**: Shell company (<3 mos old, no GST history) | 🔴 Critical |
| **B008** | Prime Technologies | ₹1,53,00,000 | Historical debarment record on GeM incident database | 🟡 Medium |
| **B009** | Alpha Byte Enterprises | ₹1,41,20,000 | **Collusion Ring 2**: Shared bank account & signatory with B005 | 🔴 High |
| **B010** | Trishul Computing Corp | ₹1,47,00,000 | Clean bidder; compliant BIS and ISO 9001 certifications | 🟢 Low |
| **B011** | Vayu Tech Solutions | ₹1,43,00,000 | Non-compliance in GST (2 unfiled GSTR-3B quarters) | 🟡 Medium |
| **B012** | Shaurya Electronics | ₹1,45,50,000 | Clean bidder; fully verified domestic manufacturer (MII 65%) | 🟢 Low |

---

## 💻 Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, TailwindCSS, Lucide-React, Recharts, React-Force-Graph-2D |
| **Backend** | FastAPI (Python 3.12), Pydantic v2, Uvicorn, Python-Multipart |
| **Database & Cache** | PostgreSQL (AsyncPG/SQLAlchemy), Neo4j Graph DB, Redis (with in-memory fallback for local demo) |
| **AI / NLP** | Google Gemini API (`gemini-2.5-flash`), LangChain, LangGraph |
| **Security & Integrity** | SHA-256 Hash Chaining, Cryptographic Verification, CORS, Python-Jose |
| **Deployment** | Docker & Docker Compose |
