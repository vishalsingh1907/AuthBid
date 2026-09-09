# 🛡️ BidVerify — GeM Compliance Intelligence

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

## 🌟 Highlights
* **Automated 5-Agent Verification Pipeline** (GSTN, PAN, MCA21, Udyam, Debarment).
* **Interactive 2D Knowledge & Collusion Graph** (Uncovers bid-rigging rings, shared directors, addresses, and banks).
* **Commercial Price & L1 Outlier Analysis** (Flags predatory and clustered pricing).
* **Cryptographic SHA-256 Hash-Chained Audit Trail** with interactive tamper simulation and restoration.
* **Document Vault** with cryptographic checksum validation.
* **Automated Legal Show Cause Notice Generation** citing Competition Act 2002 Sec 3(3) and GFR 2017 Rule 151.
* **AI Procurement Copilot** for natural language bidder intelligence queries.

For in-depth documentation, please refer to [FEATURES.md](file:///c:/Users/ASUS/Downloads/sih%202/FEATURES.md).
