"""
SIH26100 — Pydantic Schemas
Canonical entity schema: Entity → Identifiers → Attributes → Documents → Source + Timestamp + Hash
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════
class VerificationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CheckResult(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    NOT_APPLICABLE = "not_applicable"


class AnomalyType(str, Enum):
    COLLUSION_RING = "collusion_ring"
    SHELL_COMPANY = "shell_company"
    PAN_NAME_MISMATCH = "pan_name_mismatch"
    GST_FILING_GAP = "gst_filing_gap"
    EXPIRED_MSME = "expired_msme"
    PREVIOUSLY_DEBARRED = "previously_debarred"
    TURNOVER_INCONSISTENCY = "turnover_inconsistency"
    ADDRESS_OVERLAP = "address_overlap"
    DIRECTOR_OVERLAP = "director_overlap"
    BANK_OVERLAP = "bank_overlap"
    PHONE_OVERLAP = "phone_overlap"


# ═══════════════════════════════════════════════════════════════
# PROVENANCE — every extracted field carries source lineage
# ═══════════════════════════════════════════════════════════════
class Provenance(BaseModel):
    source: str = Field(..., description="Source system (GST_PORTAL, PAN_NSDL, MCA21, etc.)")
    document_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    hash: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# ENTITY IDENTIFIERS
# ═══════════════════════════════════════════════════════════════
class EntityIdentifiers(BaseModel):
    pan: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None
    udyam_no: Optional[str] = None
    din_list: list[str] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════════
# DIRECTOR / PERSON
# ═══════════════════════════════════════════════════════════════
class Director(BaseModel):
    name: str
    din: Optional[str] = None
    pan: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: str = "Director"


# ═══════════════════════════════════════════════════════════════
# ADDRESS
# ═══════════════════════════════════════════════════════════════
class Address(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str


# ═══════════════════════════════════════════════════════════════
# BANK ACCOUNT
# ═══════════════════════════════════════════════════════════════
class BankAccount(BaseModel):
    bank_name: str
    ifsc: str
    account_no: str
    branch: str


# ═══════════════════════════════════════════════════════════════
# TENDER
# ═══════════════════════════════════════════════════════════════
class TenderCreate(BaseModel):
    title: str
    category: str
    estimated_value: float
    description: str
    ministry: Optional[str] = None
    department: Optional[str] = None


class TenderResponse(BaseModel):
    tender_id: str
    title: str
    category: str
    estimated_value: float
    currency: str = "INR"
    published_date: str
    closing_date: str
    ministry: Optional[str] = None
    department: Optional[str] = None
    description: str
    eligibility_criteria: dict = Field(default_factory=dict)
    bidder_count: int = 0
    verification_status: VerificationStatus = VerificationStatus.PENDING


class TenderChecklist(BaseModel):
    """AI-generated compliance checklist from tender document."""
    tender_id: str
    checklist_items: list[dict] = Field(default_factory=list)
    generated_by: str = "AI"
    generated_at: datetime = Field(default_factory=datetime.now)


# ═══════════════════════════════════════════════════════════════
# BIDDER
# ═══════════════════════════════════════════════════════════════
class BidderSummary(BaseModel):
    bidder_id: str
    entity_name: str
    trade_name: Optional[str] = None
    entity_type: str
    bid_amount: float
    risk_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    verification_status: VerificationStatus = VerificationStatus.PENDING
    hard_eligibility: Optional[dict] = None
    anomaly_count: int = 0


class BidderDetail(BaseModel):
    bidder_id: str
    entity_name: str
    trade_name: Optional[str] = None
    entity_type: str
    identifiers: EntityIdentifiers
    registered_address: Address
    directors: list[Director] = Field(default_factory=list)
    bank_account: Optional[BankAccount] = None
    bid_amount: float
    annual_turnover: list[dict] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    gst_status: Optional[str] = None
    msme_category: Optional[str] = None
    msme_valid_until: Optional[str] = None
    make_in_india_percent: Optional[float] = None
    oem_authorization: bool = False
    oem_name: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# VERIFICATION RESULTS
# ═══════════════════════════════════════════════════════════════
class ComplianceCheck(BaseModel):
    """Single compliance check result with evidence."""
    check_id: str
    check_name: str
    category: str  # "GST", "PAN", "MSME", "MCA", "BLACKLIST", "ELIGIBILITY"
    result: CheckResult
    details: str
    evidence: list[dict] = Field(default_factory=list)
    provenance: Optional[Provenance] = None


class AnomalyFlag(BaseModel):
    """Detected anomaly with explanation."""
    anomaly_id: str
    anomaly_type: AnomalyType
    severity: RiskLevel
    title: str
    description: str
    evidence: list[dict] = Field(default_factory=list)
    related_bidders: list[str] = Field(default_factory=list)


class RiskScore(BaseModel):
    """Composite risk score with breakdown."""
    overall_score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    components: dict = Field(default_factory=dict)
    # Breakdown:
    # - cross_source_consistency: 30%
    # - collusion_indicators: 25%
    # - financial_health: 20%
    # - document_integrity: 15%
    # - blacklist_proximity: 10%
    explanation: str = ""


class VerificationResult(BaseModel):
    """Complete verification result for a bidder."""
    bidder_id: str
    entity_name: str
    tender_id: str
    status: VerificationStatus
    risk_score: Optional[RiskScore] = None
    compliance_checks: list[ComplianceCheck] = Field(default_factory=list)
    anomalies: list[AnomalyFlag] = Field(default_factory=list)
    hard_eligibility: dict = Field(default_factory=dict)
    ai_recommendation: Optional[str] = None
    ai_confidence: Optional[float] = None
    evidence_chain: list[dict] = Field(default_factory=list)
    completed_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════
# GRAPH / COLLUSION
# ═══════════════════════════════════════════════════════════════
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "bidder", "director", "address", "bank", "phone"
    properties: dict = Field(default_factory=dict)
    risk_level: Optional[RiskLevel] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str  # "HAS_DIRECTOR", "REGISTERED_AT", "BANKS_WITH", "SHARED_DIRECTOR", etc.
    properties: dict = Field(default_factory=dict)
    is_suspicious: bool = False


class GraphData(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    clusters: list[dict] = Field(default_factory=list)  # Collusion clusters


# ═══════════════════════════════════════════════════════════════
# AUDIT TRAIL
# ═══════════════════════════════════════════════════════════════
class AuditEntry(BaseModel):
    step_id: str
    agent_id: str
    action: str
    input_hash: str
    output_hash: str
    prev_hash: str
    timestamp: datetime = Field(default_factory=datetime.now)
    details: dict = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════
# AGENT PIPELINE
# ═══════════════════════════════════════════════════════════════
class AgentStep(BaseModel):
    agent_name: str
    status: VerificationStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    findings: list[dict] = Field(default_factory=list)
    error: Optional[str] = None


class PipelineStatus(BaseModel):
    tender_id: str
    bidder_id: str
    overall_status: VerificationStatus
    steps: list[AgentStep] = Field(default_factory=list)
    progress_percent: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
