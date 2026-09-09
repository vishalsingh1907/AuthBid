"""
SIH26100 — Synthetic Data Generator

Generates 12 synthetic bidders for a sample GeM tender with DELIBERATELY
PLANTED collusion patterns for demo purposes:

COLLUSION RING 1 (Bid-rigging):
  - Bidders B001, B003, B007 share 2 directors and a common registered address
  - B007 is a shell company (incorporated 3 months ago, no GST history)

COLLUSION RING 2 (Related parties):
  - Bidders B005, B009 share a bank account (same IFSC + account prefix)
  - B009 director's phone matches B005 authorized signatory

ANOMALIES:
  - B004 has expired MSME registration
  - B008 was previously debarred (now cleared, but flagged)
  - B011 has GST filing gaps (2 quarters)
  - B006 PAN name doesn't match GST legal name

CLEAN BIDDERS: B002, B010, B012 — fully compliant, no anomalies
"""

import hashlib
from datetime import datetime, timedelta
import random

random.seed(42)  # Reproducible demo data


# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS (defined first so bidder dicts can call them)
# ═══════════════════════════════════════════════════════════════
def _generate_gst_filings(start_year: int, start_month: int, gaps: list[str] | None = None) -> list[dict]:
    """Generate monthly GST filing history from start date to Aug 2026."""
    if gaps is None:
        gaps = []
    filings = []
    current = datetime(start_year, start_month, 1)
    end = datetime(2026, 8, 1)

    while current <= end:
        period = current.strftime("%Y-%m")
        status = "Not Filed" if period in gaps else "Filed"
        filing_date = (
            (current + timedelta(days=random.randint(10, 25))).strftime("%Y-%m-%d")
            if status == "Filed"
            else None
        )
        filings.append({
            "period": period,
            "return_type": "GSTR-3B",
            "status": status,
            "filing_date": filing_date,
            "taxable_value": random.randint(200000, 800000) if status == "Filed" else 0,
        })
        if current.month == 12:
            current = datetime(current.year + 1, 1, 1)
        else:
            current = datetime(current.year, current.month + 1, 1)
    return filings


def compute_document_hash(content: str) -> str:
    """Compute SHA-256 hash for document integrity."""
    return hashlib.sha256(content.encode()).hexdigest()


# ═══════════════════════════════════════════════════════════════
# SAMPLE TENDER
# ═══════════════════════════════════════════════════════════════
SAMPLE_TENDER = {
    "tender_id": "GEM/2026/B/4521897",
    "title": "Supply of 500 Desktop Computers with 3-Year Warranty",
    "category": "IT Hardware — Desktop Computers",
    "estimated_value": 25000000,
    "currency": "INR",
    "published_date": "2026-08-15",
    "closing_date": "2026-09-15",
    "ministry": "Ministry of Electronics and Information Technology",
    "department": "National Informatics Centre",
    "eligibility_criteria": {
        "min_annual_turnover": 10000000,
        "min_experience_years": 3,
        "mse_exemption": True,
        "make_in_india_required": True,
        "make_in_india_min_percent": 50,
        "oem_authorization_required": True,
        "emd_amount": 500000,
        "required_certifications": ["ISO 9001:2015", "BIS Certification"],
        "epfo_registration_required": True,
        "gst_registration_required": True,
        "pan_required": True,
    },
    "description": (
        "Supply, installation and commissioning of 500 Desktop Computers "
        "(Intel i5 13th Gen or equivalent, 16GB RAM, 512GB SSD, 23.8\" FHD Monitor) "
        "with 3-year comprehensive on-site warranty. Make in India preference: "
        "minimum 50% domestic value addition. MSE purchase preference as per "
        "Public Procurement Policy 2012. OEM authorization mandatory."
    ),
}

# ═══════════════════════════════════════════════════════════════
# SHARED ENTITIES (for collusion detection)
# ═══════════════════════════════════════════════════════════════
SHARED_DIRECTORS_RING1 = [
    {
        "name": "Rajesh Kumar Sharma",
        "din": "09876543",
        "pan": "ABCPS1234K",
        "phone": "9876543210",
        "email": "rajesh.sharma@gmail.com",
    },
    {
        "name": "Vikram Singh Chauhan",
        "din": "08765432",
        "pan": "DEFPC5678L",
        "phone": "9765432109",
        "email": "vikram.chauhan@yahoo.com",
    },
]

SHARED_ADDRESS_RING1 = {
    "line1": "Plot No. 45, Sector 18",
    "line2": "Industrial Area Phase II",
    "city": "Gurugram",
    "state": "Haryana",
    "pincode": "122015",
}

SHARED_BANK_RING2 = {
    "bank_name": "Punjab National Bank",
    "ifsc": "PUNB0123400",
    "branch": "Nehru Place, New Delhi",
}


# ═══════════════════════════════════════════════════════════════
# BIDDER DATA — 12 synthetic bidders
# ═══════════════════════════════════════════════════════════════
def _build_bidders() -> list[dict]:
    """Build the synthetic bidders list with all collusion patterns."""
    return [
        # ── B001: COLLUSION RING 1 (leader) ──
        {
            "bidder_id": "B001",
            "entity_name": "TechVision Solutions Pvt. Ltd.",
            "trade_name": "TechVision Solutions",
            "entity_type": "Private Limited Company",
            "pan": "AABCT1234A",
            "gstin": "06AABCT1234A1Z5",
            "cin": "U72200HR2018PTC075123",
            "udyam_no": "UDYAM-HR-06-0012345",
            "incorporation_date": "2018-03-15",
            "registered_address": SHARED_ADDRESS_RING1,
            "directors": [
                SHARED_DIRECTORS_RING1[0],
                SHARED_DIRECTORS_RING1[1],
                {
                    "name": "Priya Malhotra",
                    "din": "07654321",
                    "pan": "GHIPM9012M",
                    "phone": "9654321098",
                    "email": "priya.m@techvision.in",
                },
            ],
            "bank_account": {
                "bank_name": "HDFC Bank",
                "ifsc": "HDFC0001234",
                "account_no": "50100123456789",
                "branch": "Gurugram Sector 18",
            },
            "gst_status": "Active",
            "gst_registration_date": "2018-07-01",
            "gst_filing_history": _generate_gst_filings(2018, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 45000000},
                {"fy": "2024-25", "amount": 52000000},
                {"fy": "2025-26", "amount": 61000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2027-12-31",
            "certifications": ["ISO 9001:2015", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "HRGUR0012345",
            "bid_amount": 23500000,
            "make_in_india_percent": 65,
            "oem_authorization": True,
            "oem_name": "HCL Technologies",
            "debarment_history": [],
            "anomalies": ["COLLUSION_RING_1"],
        },

        # ── B002: CLEAN BIDDER ──
        {
            "bidder_id": "B002",
            "entity_name": "Reliable Computing Systems Ltd.",
            "trade_name": "ReliComp",
            "entity_type": "Public Limited Company",
            "pan": "AABCR5678B",
            "gstin": "07AABCR5678B1Z3",
            "cin": "L72200DL2012PLC234567",
            "udyam_no": None,
            "incorporation_date": "2012-06-20",
            "registered_address": {
                "line1": "A-12, Okhla Industrial Estate",
                "line2": "Phase III",
                "city": "New Delhi",
                "state": "Delhi",
                "pincode": "110020",
            },
            "directors": [
                {"name": "Anand Krishnan", "din": "06543210", "pan": "JKLPK3456N", "phone": "9543210987", "email": "anand@relicomp.com"},
                {"name": "Sunita Devi Agarwal", "din": "05432109", "pan": "MNOPA7890P", "phone": "9432109876", "email": "sunita@relicomp.com"},
            ],
            "bank_account": {"bank_name": "State Bank of India", "ifsc": "SBIN0005678", "account_no": "38765432101234", "branch": "Okhla, New Delhi"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 120000000},
                {"fy": "2024-25", "amount": 135000000},
                {"fy": "2025-26", "amount": 150000000},
            ],
            "msme_category": None,
            "msme_valid_until": None,
            "certifications": ["ISO 9001:2015", "ISO 27001:2022", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "DLOKH0056789",
            "bid_amount": 24200000,
            "make_in_india_percent": 72,
            "oem_authorization": True,
            "oem_name": "Dell Technologies",
            "debarment_history": [],
            "anomalies": [],
        },

        # ── B003: COLLUSION RING 1 (accomplice) ──
        {
            "bidder_id": "B003",
            "entity_name": "DigiCore Infosystems Pvt. Ltd.",
            "trade_name": "DigiCore Infosystems",
            "entity_type": "Private Limited Company",
            "pan": "AABCD9012C",
            "gstin": "06AABCD9012C1Z1",
            "cin": "U72200HR2019PTC078456",
            "udyam_no": "UDYAM-HR-06-0023456",
            "incorporation_date": "2019-01-10",
            "registered_address": {
                "line1": "Plot No. 47, Sector 18",
                "line2": "Industrial Area Phase II",
                "city": "Gurugram",
                "state": "Haryana",
                "pincode": "122015",
            },
            "directors": [
                SHARED_DIRECTORS_RING1[0],
                {"name": "Neha Gupta", "din": "04321098", "pan": "QRSNG1234Q", "phone": "9321098765", "email": "neha.gupta@digicore.in"},
                SHARED_DIRECTORS_RING1[1],
            ],
            "bank_account": {"bank_name": "ICICI Bank", "ifsc": "ICIC0001234", "account_no": "123456789012", "branch": "Gurugram Cyber City"},
            "gst_status": "Active",
            "gst_registration_date": "2019-04-01",
            "gst_filing_history": _generate_gst_filings(2019, 4),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 38000000},
                {"fy": "2024-25", "amount": 42000000},
                {"fy": "2025-26", "amount": 48000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2028-06-30",
            "certifications": ["ISO 9001:2015", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "HRGUR0023456",
            "bid_amount": 24800000,
            "make_in_india_percent": 60,
            "oem_authorization": True,
            "oem_name": "HCL Technologies",
            "debarment_history": [],
            "anomalies": ["COLLUSION_RING_1"],
        },

        # ── B004: EXPIRED MSME REGISTRATION ──
        {
            "bidder_id": "B004",
            "entity_name": "GreenTech Peripherals",
            "trade_name": "GreenTech",
            "entity_type": "Proprietorship",
            "pan": "DEFPG3456D",
            "gstin": "09DEFPG3456D1Z8",
            "cin": None,
            "udyam_no": "UDYAM-UP-09-0034567",
            "incorporation_date": "2016-08-01",
            "registered_address": {"line1": "B-78, UPSIDC Industrial Area", "line2": "Sector 5", "city": "Noida", "state": "Uttar Pradesh", "pincode": "201301"},
            "directors": [
                {"name": "Manoj Kumar Verma", "din": None, "pan": "DEFPG3456D", "phone": "9210987654", "email": "manoj@greentech.co.in"},
            ],
            "bank_account": {"bank_name": "Bank of Baroda", "ifsc": "BARB0NOIDA1", "account_no": "76543210987654", "branch": "Noida Sector 5"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 8000000},
                {"fy": "2024-25", "amount": 9500000},
                {"fy": "2025-26", "amount": 11000000},
            ],
            "msme_category": "Micro",
            "msme_valid_until": "2025-12-31",  # EXPIRED
            "certifications": ["ISO 9001:2015"],
            "epfo_registered": True,
            "epfo_establishment_code": "UPNOI0034567",
            "bid_amount": 22800000,
            "make_in_india_percent": 55,
            "oem_authorization": True,
            "oem_name": "Lenovo India",
            "debarment_history": [],
            "anomalies": ["EXPIRED_MSME"],
        },

        # ── B005: COLLUSION RING 2 (shared bank) ──
        {
            "bidder_id": "B005",
            "entity_name": "NexGen IT Solutions Pvt. Ltd.",
            "trade_name": "NexGen IT",
            "entity_type": "Private Limited Company",
            "pan": "GHIPN7890E",
            "gstin": "07GHIPN7890E1Z6",
            "cin": "U72200DL2017PTC067890",
            "udyam_no": "UDYAM-DL-07-0045678",
            "incorporation_date": "2017-11-25",
            "registered_address": {"line1": "201, Nehru Place Complex", "line2": "Outer Ring Road", "city": "New Delhi", "state": "Delhi", "pincode": "110019"},
            "directors": [
                {"name": "Amit Bhardwaj", "din": "03210987", "pan": "TUVAB5678R", "phone": "9109876543", "email": "amit@nexgenit.com"},
                {"name": "Pooja Rani Bhardwaj", "din": "02109876", "pan": "WXYPB9012S", "phone": "9098765432", "email": "pooja@nexgenit.com"},
            ],
            "bank_account": {"bank_name": SHARED_BANK_RING2["bank_name"], "ifsc": SHARED_BANK_RING2["ifsc"], "account_no": "6789012345001", "branch": SHARED_BANK_RING2["branch"]},
            "gst_status": "Active",
            "gst_registration_date": "2018-01-01",
            "gst_filing_history": _generate_gst_filings(2018, 1),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 28000000},
                {"fy": "2024-25", "amount": 35000000},
                {"fy": "2025-26", "amount": 40000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2028-03-31",
            "certifications": ["ISO 9001:2015", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "DLNEH0045678",
            "bid_amount": 23900000,
            "make_in_india_percent": 58,
            "oem_authorization": True,
            "oem_name": "Acer India",
            "debarment_history": [],
            "anomalies": ["COLLUSION_RING_2"],
        },

        # ── B006: PAN NAME MISMATCH ──
        {
            "bidder_id": "B006",
            "entity_name": "Bharat Electronics & Computing",
            "trade_name": "BEC Systems",
            "entity_type": "Partnership Firm",
            "pan": "AABFB2345F",
            "pan_registered_name": "Bharat Electonics & Computing",  # TYPO
            "gstin": "29AABFB2345F1Z2",
            "cin": None,
            "udyam_no": "UDYAM-KA-29-0056789",
            "incorporation_date": "2015-04-10",
            "registered_address": {"line1": "No. 23, Peenya Industrial Area", "line2": "2nd Phase", "city": "Bengaluru", "state": "Karnataka", "pincode": "560058"},
            "directors": [
                {"name": "Suresh Babu K", "din": None, "pan": "AABFB2345F", "phone": "9087654321", "email": "suresh@becsystems.in"},
                {"name": "Ramesh Babu K", "din": None, "pan": "CDEFR6789G", "phone": "9876501234", "email": "ramesh@becsystems.in"},
            ],
            "bank_account": {"bank_name": "Canara Bank", "ifsc": "CNRB0002345", "account_no": "1234567890123456", "branch": "Peenya, Bengaluru"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 55000000},
                {"fy": "2024-25", "amount": 62000000},
                {"fy": "2025-26", "amount": 70000000},
            ],
            "msme_category": "Medium",
            "msme_valid_until": "2027-09-30",
            "certifications": ["ISO 9001:2015", "BIS Certification", "ISO 14001:2015"],
            "epfo_registered": True,
            "epfo_establishment_code": "KAPEE0056789",
            "bid_amount": 24500000,
            "make_in_india_percent": 80,
            "oem_authorization": True,
            "oem_name": "HP India",
            "debarment_history": [],
            "anomalies": ["PAN_NAME_MISMATCH"],
        },

        # ── B007: COLLUSION RING 1 (shell company) ──
        {
            "bidder_id": "B007",
            "entity_name": "Quantum Digital Services Pvt. Ltd.",
            "trade_name": "Quantum Digital",
            "entity_type": "Private Limited Company",
            "pan": "AABCQ6789G",
            "gstin": "06AABCQ6789G1Z9",
            "cin": "U72200HR2026PTC098765",
            "udyam_no": None,
            "incorporation_date": "2026-06-01",  # 3 months ago = SHELL
            "registered_address": SHARED_ADDRESS_RING1,
            "directors": [
                SHARED_DIRECTORS_RING1[0],
                SHARED_DIRECTORS_RING1[1],
            ],
            "bank_account": {"bank_name": "HDFC Bank", "ifsc": "HDFC0001234", "account_no": "50100987654321", "branch": "Gurugram Sector 18"},
            "gst_status": "Active",
            "gst_registration_date": "2026-07-01",
            "gst_filing_history": [],
            "annual_turnover": [],
            "msme_category": None,
            "msme_valid_until": None,
            "certifications": [],
            "epfo_registered": False,
            "epfo_establishment_code": None,
            "bid_amount": 22000000,  # Lowest bid — suspicious
            "make_in_india_percent": 50,
            "oem_authorization": True,
            "oem_name": "HCL Technologies",
            "debarment_history": [],
            "anomalies": ["COLLUSION_RING_1", "SHELL_COMPANY"],
        },

        # ── B008: PREVIOUSLY DEBARRED ──
        {
            "bidder_id": "B008",
            "entity_name": "MegaByte Computers Pvt. Ltd.",
            "trade_name": "MegaByte",
            "entity_type": "Private Limited Company",
            "pan": "AABCM0123H",
            "gstin": "07AABCM0123H1Z7",
            "cin": "U72200DL2014PTC045678",
            "udyam_no": "UDYAM-DL-07-0067890",
            "incorporation_date": "2014-02-14",
            "registered_address": {"line1": "C-45, Wazirpur Industrial Area", "line2": "", "city": "New Delhi", "state": "Delhi", "pincode": "110052"},
            "directors": [
                {"name": "Sanjay Mittal", "din": "01098765", "pan": "YZASM3456T", "phone": "8976543210", "email": "sanjay@megabyte.co.in"},
            ],
            "bank_account": {"bank_name": "Axis Bank", "ifsc": "UTIB0003456", "account_no": "917020012345678", "branch": "Wazirpur, New Delhi"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 75000000},
                {"fy": "2024-25", "amount": 82000000},
                {"fy": "2025-26", "amount": 90000000},
            ],
            "msme_category": "Medium",
            "msme_valid_until": "2028-12-31",
            "certifications": ["ISO 9001:2015", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "DLWAZ0067890",
            "bid_amount": 24000000,
            "make_in_india_percent": 70,
            "oem_authorization": True,
            "oem_name": "Dell Technologies",
            "debarment_history": [
                {
                    "debarred_by": "Ministry of Defence",
                    "reason": "Supply of substandard equipment",
                    "debarment_date": "2022-03-15",
                    "reinstatement_date": "2024-03-14",
                    "status": "Cleared",
                }
            ],
            "anomalies": ["PREVIOUSLY_DEBARRED"],
        },

        # ── B009: COLLUSION RING 2 (shared phone / bank) ──
        {
            "bidder_id": "B009",
            "entity_name": "CloudFirst Technologies Pvt. Ltd.",
            "trade_name": "CloudFirst Tech",
            "entity_type": "Private Limited Company",
            "pan": "AABCC4567I",
            "gstin": "07AABCC4567I1Z4",
            "cin": "U72200DL2020PTC089012",
            "udyam_no": "UDYAM-DL-07-0078901",
            "incorporation_date": "2020-09-15",
            "registered_address": {"line1": "305, Kalkaji Business Centre", "line2": "Outer Ring Road", "city": "New Delhi", "state": "Delhi", "pincode": "110019"},
            "directors": [
                {"name": "Ravi Bhardwaj", "din": "00987654", "pan": "ABCDR8901U", "phone": "9098765432", "email": "ravi@cloudfirst.in"},
                {"name": "Kavita Sharma", "din": "09876540", "pan": "EFGHK2345V", "phone": "8765432109", "email": "kavita@cloudfirst.in"},
            ],
            "bank_account": {"bank_name": SHARED_BANK_RING2["bank_name"], "ifsc": SHARED_BANK_RING2["ifsc"], "account_no": "6789012345002", "branch": SHARED_BANK_RING2["branch"]},
            "gst_status": "Active",
            "gst_registration_date": "2020-10-01",
            "gst_filing_history": _generate_gst_filings(2020, 10),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 18000000},
                {"fy": "2024-25", "amount": 22000000},
                {"fy": "2025-26", "amount": 28000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2027-06-30",
            "certifications": ["ISO 9001:2015", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "DLKAL0078901",
            "bid_amount": 23200000,
            "make_in_india_percent": 55,
            "oem_authorization": True,
            "oem_name": "Acer India",
            "debarment_history": [],
            "anomalies": ["COLLUSION_RING_2"],
        },

        # ── B010: CLEAN BIDDER ──
        {
            "bidder_id": "B010",
            "entity_name": "Pinnacle Systems India Pvt. Ltd.",
            "trade_name": "Pinnacle Systems",
            "entity_type": "Private Limited Company",
            "pan": "AABCP8901J",
            "gstin": "27AABCP8901J1Z0",
            "cin": "U72200MH2016PTC056789",
            "udyam_no": None,
            "incorporation_date": "2016-05-20",
            "registered_address": {"line1": "Unit 12, MIDC Andheri", "line2": "Andheri East", "city": "Mumbai", "state": "Maharashtra", "pincode": "400093"},
            "directors": [
                {"name": "Deepak Joshi", "din": "08765401", "pan": "GHIDJ4567W", "phone": "8654321098", "email": "deepak@pinnaclesys.com"},
                {"name": "Meera Joshi", "din": "07654012", "pan": "IJKMJ8901X", "phone": "8543210987", "email": "meera@pinnaclesys.com"},
            ],
            "bank_account": {"bank_name": "Kotak Mahindra Bank", "ifsc": "KKBK0004567", "account_no": "4567890123456789", "branch": "Andheri East, Mumbai"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 95000000},
                {"fy": "2024-25", "amount": 110000000},
                {"fy": "2025-26", "amount": 125000000},
            ],
            "msme_category": None,
            "msme_valid_until": None,
            "certifications": ["ISO 9001:2015", "ISO 27001:2022", "BIS Certification"],
            "epfo_registered": True,
            "epfo_establishment_code": "MHAND0089012",
            "bid_amount": 24800000,
            "make_in_india_percent": 75,
            "oem_authorization": True,
            "oem_name": "HP India",
            "debarment_history": [],
            "anomalies": [],
        },

        # ── B011: GST FILING GAPS ──
        {
            "bidder_id": "B011",
            "entity_name": "ByteWave Electronics Pvt. Ltd.",
            "trade_name": "ByteWave",
            "entity_type": "Private Limited Company",
            "pan": "AABCB2345K",
            "gstin": "33AABCB2345K1Z6",
            "cin": "U72200TN2019PTC090123",
            "udyam_no": "UDYAM-TN-33-0089012",
            "incorporation_date": "2019-07-01",
            "registered_address": {"line1": "Plot 67, SIDCO Industrial Estate", "line2": "Ambattur", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600098"},
            "directors": [
                {"name": "Karthik Raman", "din": "06543012", "pan": "KLMKR5678Y", "phone": "7654321098", "email": "karthik@bytewave.in"},
            ],
            "bank_account": {"bank_name": "Indian Bank", "ifsc": "IDIB000A123", "account_no": "789012345678", "branch": "Ambattur, Chennai"},
            "gst_status": "Active",
            "gst_registration_date": "2019-08-01",
            "gst_filing_history": _generate_gst_filings(2019, 8, gaps=["2026-01", "2026-02"]),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 22000000},
                {"fy": "2024-25", "amount": 26000000},
                {"fy": "2025-26", "amount": 15000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2027-03-31",
            "certifications": ["ISO 9001:2015"],
            "epfo_registered": True,
            "epfo_establishment_code": "TNAMB0089012",
            "bid_amount": 23000000,
            "make_in_india_percent": 52,
            "oem_authorization": True,
            "oem_name": "Lenovo India",
            "debarment_history": [],
            "anomalies": ["GST_FILING_GAP"],
        },

        # ── B012: CLEAN BIDDER ──
        {
            "bidder_id": "B012",
            "entity_name": "Atlas Infosys Solutions Pvt. Ltd.",
            "trade_name": "Atlas Infosys",
            "entity_type": "Private Limited Company",
            "pan": "AABCA6789L",
            "gstin": "36AABCA6789L1Z3",
            "cin": "U72200TG2015PTC012345",
            "udyam_no": "UDYAM-TG-36-0090123",
            "incorporation_date": "2015-10-15",
            "registered_address": {"line1": "Flat 301, Hitech City", "line2": "Madhapur", "city": "Hyderabad", "state": "Telangana", "pincode": "500081"},
            "directors": [
                {"name": "Venkat Reddy Palle", "din": "05432012", "pan": "NOPVR6789Z", "phone": "7543210987", "email": "venkat@atlasinfosys.com"},
                {"name": "Lakshmi Devi Reddy", "din": "04321012", "pan": "PQRLR0123A", "phone": "7432109876", "email": "lakshmi@atlasinfosys.com"},
            ],
            "bank_account": {"bank_name": "Union Bank of India", "ifsc": "UBIN0567890", "account_no": "321098765432", "branch": "Madhapur, Hyderabad"},
            "gst_status": "Active",
            "gst_registration_date": "2017-07-01",
            "gst_filing_history": _generate_gst_filings(2017, 7),
            "annual_turnover": [
                {"fy": "2023-24", "amount": 42000000},
                {"fy": "2024-25", "amount": 50000000},
                {"fy": "2025-26", "amount": 58000000},
            ],
            "msme_category": "Small",
            "msme_valid_until": "2028-09-30",
            "certifications": ["ISO 9001:2015", "BIS Certification", "ISO 20000-1:2018"],
            "epfo_registered": True,
            "epfo_establishment_code": "TGMAD0090123",
            "bid_amount": 24600000,
            "make_in_india_percent": 68,
            "oem_authorization": True,
            "oem_name": "HP India",
            "debarment_history": [],
            "anomalies": [],
        },
    ]


# Build on import
SYNTHETIC_BIDDERS = _build_bidders()

# ═══════════════════════════════════════════════════════════════
# BLACKLIST DATABASE
# ═══════════════════════════════════════════════════════════════
BLACKLIST_DATABASE = [
    {
        "entity_name": "MegaByte Computers Pvt. Ltd.",
        "pan": "AABCM0123H",
        "debarred_by": "Ministry of Defence",
        "reason": "Supply of substandard equipment under contract MoD/IT/2021/456",
        "debarment_date": "2022-03-15",
        "reinstatement_date": "2024-03-14",
        "status": "Cleared",
        "order_reference": "MoD/Debar/2022/089",
    },
    {
        "entity_name": "FakeComp Technologies Pvt. Ltd.",
        "pan": "XYZFT9999Z",
        "debarred_by": "Ministry of Finance",
        "reason": "Fraudulent documentation in tender bid",
        "debarment_date": "2024-06-01",
        "reinstatement_date": None,
        "status": "Active",
        "order_reference": "MoF/Debar/2024/234",
    },
]


# ═══════════════════════════════════════════════════════════════
# ACCESSOR FUNCTIONS
# ═══════════════════════════════════════════════════════════════
def get_bidder_by_id(bidder_id: str) -> dict | None:
    for b in SYNTHETIC_BIDDERS:
        if b["bidder_id"] == bidder_id:
            return b
    return None


def get_bidder_by_gstin(gstin: str) -> dict | None:
    for b in SYNTHETIC_BIDDERS:
        if b["gstin"] == gstin:
            return b
    return None


def get_bidder_by_pan(pan: str) -> dict | None:
    for b in SYNTHETIC_BIDDERS:
        if b["pan"] == pan:
            return b
    return None


def get_all_bidders() -> list[dict]:
    return SYNTHETIC_BIDDERS


def get_tender() -> dict:
    return SAMPLE_TENDER


def check_blacklist(pan: str) -> list[dict]:
    return [entry for entry in BLACKLIST_DATABASE if entry["pan"] == pan]
