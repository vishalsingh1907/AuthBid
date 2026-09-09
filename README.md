# 🛡️ AuthBid — GeM Compliance Intelligence

> **AI-Powered Integrated Bid Compliance Verification & Collusion Detection Platform for GeM Procurement**  
> *Smart India Hackathon (SIH26100)*

---

## 📖 Quick Links
- **[Full Project Functionalities & Architecture (FEATURES.md)](file:///c:/Users/ASUS/Downloads/sih%202/FEATURES.md)**
- **Frontend URL:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚡ Quick Start (Local Run)

### 1. Start Backend
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start Frontend
```powershell
cd frontend
npm run dev
```

### 3. Or Run via Docker Compose
```bash
docker compose up -d
```

---

## 🏗️ System Architecture: Deterministic Rules vs. LLM Copilot

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

## 🌟 Core Technical Differentiators
* **Deterministic Rule Scrutiny**: Hard eligibility checks and risk scores are computed mathematically, NOT hallucinated by an LLM.
* **OSINT Graph Entity Resolution**: Detects cartel syndicates (Ring 1 & Ring 2) across shared directors, physical addresses, and banking channels.
* **Explainable 5-Component Risk Formula**: Full transparency into Consistency (30%), Collusion (25%), Financials (20%), Documents (15%), and Debarment (10%).
* **Cryptographic Tamper-Evident SHA-256 Audit Chain**: Complete mathematical ledger with external RFC 3161 Merkle anchoring.
* **Role-Based Access Control (RBAC)**: Distinct permissions for Officers, Committee Members, and System Admins.
* **Prompt-Injection Defense**: Strictly sanitizes and isolates bidder document text in Copilot prompts.
* **Document Vault with Inline Preview**: Checksum-verified certificate preview without mandatory downloads.
* **Decision Safeguards**: Mandatory justification modals and visible audit logs for disqualifications.

For comprehensive architectural details and regulatory roadmaps, please refer to [FEATURES.md](file:///c:/Users/ASUS/Downloads/sih%202/FEATURES.md), [docs/REGULATORY_INTEGRATION_ROADMAP.md](file:///c:/Users/ASUS/Downloads/sih%202/docs/REGULATORY_INTEGRATION_ROADMAP.md), and [docs/AUDIT_ANCHORING.md](file:///c:/Users/ASUS/Downloads/sih%202/docs/AUDIT_ANCHORING.md).

