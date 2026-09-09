"""
SIH26100 — AuthBid API
AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings, validate_startup_config
from models.database import store_tender
from mock_apis.synthetic_data import SAMPLE_TENDER

# ── Routers ──
from routers.tenders import router as tenders_router
from routers.bidders import router as bidders_router
from routers.verification import router as verification_router
from routers.graph import router as graph_router
from mock_apis.gst_api import router as gst_router
from mock_apis.pan_api import router as pan_router
from mock_apis.udyam_api import router as udyam_router
from mock_apis.mca_api import router as mca_router
from mock_apis.blacklist_api import router as blacklist_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate configuration and seed sample data on startup."""
    validate_startup_config(settings)
    store_tender(SAMPLE_TENDER)
    print("[OK] Sample tender seeded")
    print(f"[READY] {settings.APP_NAME} v{settings.APP_VERSION} is ready (env={settings.ENVIRONMENT})")
    yield
    print("[SHUTDOWN] Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement. "
        "OSINT-style bidder intelligence system with entity resolution, cross-bidder "
        "collusion detection, and hash-chained audit trail."
    ),
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dev mode — restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──
app.include_router(tenders_router)
app.include_router(bidders_router)
app.include_router(verification_router)
app.include_router(graph_router)
app.include_router(gst_router)
app.include_router(pan_router)
app.include_router(udyam_router)
app.include_router(mca_router)
app.include_router(blacklist_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "tenders": "/api/tenders",
            "bidders": "/api/bidders",
            "verification": "/api/verification",
            "graph": "/api/graph",
            "mock_apis": {
                "gst": "/api/v1/gst",
                "pan": "/api/v1/pan",
                "udyam": "/api/v1/udyam",
                "mca": "/api/v1/mca",
                "blacklist": "/api/v1/blacklist",
            },
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
