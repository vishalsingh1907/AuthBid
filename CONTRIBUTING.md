# Contributing to AuthBid

Thank you for your interest in contributing to **AuthBid (BidVerify)** — an AI-powered compliance verification and collusion detection platform for public procurement on the Government e-Marketplace (GeM).

---

## Code of Conduct

All contributors are expected to uphold a professional, inclusive, and collaborative environment. Respectful communication and constructive feedback are required.

---

## Getting Started

### 1. Prerequisites
- Python 3.12+
- Node.js 20+ (with npm 10+)
- Docker & Docker Compose (optional for local full-stack containerization)

### 2. Local Backend Setup
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
pip install pytest pytest-asyncio ruff

# Run backend development server:
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Local Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

---

## Testing & Quality Assurance

All PRs must pass linting, type-checking, and test suites before merging:

### Backend Testing & Linting
```bash
# Run pytest suite:
python -m pytest backend/tests -v

# Run linter:
python -m ruff check backend/
```

### Frontend Type-Check & Linting
```bash
cd frontend
npx tsc --noEmit
npm run lint
```

---

## Branching & Commit Guidelines

1. **Branch Naming**:
   - `feat/feature-name` for new capabilities
   - `fix/bug-description` for fixes
   - `docs/documentation-update` for documentation changes
   - `test/test-enhancements` for testing additions

2. **Commit Messages**:
   Follow conventional commits:
   - `feat: add explainable risk breakdown component`
   - `fix: correct previous hash resolution in audit chain`
   - `docs: update regulatory roadmap for MCA21 V3`
   - `test: add unit test for shell company heuristic`

3. **Security**:
   - **NEVER** commit real API keys, secrets, or production database credentials.
   - Use `.env` for local secrets (gitignored).

---

## Pull Request Process

1. Fork or branch from `main`.
2. Ensure all automated tests pass locally.
3. Open a Pull Request with a clear summary of changes, rationale, and screenshots for UI modifications.
4. Ensure GitHub Actions CI passes all checks.
