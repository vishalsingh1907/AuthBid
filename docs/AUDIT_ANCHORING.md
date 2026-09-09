# Cryptographic Audit Trail & External Anchoring Architecture

> **Document Classification:** Information Security & Cryptographic Integrity Architecture  
> **Target Standard:** Tamper-Proof Audit Trails under RFC 3161 (Time-Stamp Protocol) & RFC 6962 (Certificate Transparency)

---

## 1. Threat Model: Tamper-Evident vs. Tamper-Proof

In the baseline implementation of AuthBid, the SHA-256 hash chain is stored within the operational PostgreSQL database. While this provides mathematical **tamper-evidence** (any manual row alteration causes subsequent block hash mismatches detected by `verify_audit_chain()`), it is not **tamper-proof** against a malicious database administrator who has direct write permissions and can recompute the entire hash chain from the altered block forward.

To achieve non-repudiation and true tamper-proof integrity, the system implements **External Cryptographic Anchoring**.

---

## 2. Cryptographic Construction

### 2.1 Internal Block Hash Formula
Every verification action logs an entry with:
$$\text{content} = \text{prev\_hash} \parallel \text{agent\_id} \parallel \text{action} \parallel \text{input\_hash} \parallel \text{output\_hash}$$
$$\text{current\_hash} = \text{SHA-256}(\text{content})$$

### 2.2 Merkle Commitment & Root Calculation
When an anchoring event triggers (automatically on verification completion or on officer demand via `POST /api/verification/anchor`):
1. The system builds a binary Merkle tree over all current block hashes in the audit chain:
   $$\text{MerkleRoot} = \text{MerkleTree}(\{H_1, H_2, \dots, H_N\})$$
2. A formal Anchor Receipt is generated containing:
   - `merkle_root`: Root cryptographic hash committing to the entire transaction sequence.
   - `total_blocks`: Number of blocks sealed.
   - `anchored_at`: ISO-8601 UTC timestamp.
   - `digital_signature`: Asymmetric ECDSA signature from the authorized officer's private key (or HSM).

---

## 3. External Publishing Channels

### Channel 1: RFC 3161 Qualified Time-Stamp Authority (TSA)
- **Mechanism:** The Merkle root is sent as a `TimeStampReq` to an accredited Time-Stamp Authority (e.g., National Informatics Centre / eMudhra TSA).
- **Outcome:** The TSA returns a cryptographically signed `TimeStampToken` (PKCS#7 / CMS) containing the atomic UTC time certified by an atomic clock, proving that the exact audit state existed prior to that time and has not been altered retroactively.

### Channel 2: Append-Only Transparency Logs (RFC 6962 / Sigstore)
- **Mechanism:** The Merkle root is published to an append-only, public transparency log (similar to Rekor / Trillian).
- **Properties:**
  - Anyone can query the inclusion proof.
  - The log operator cannot rewrite history without creating a split-view cryptographic proof detectable by monitors.

### Channel 3: National Public Distributed Ledger (India Tech Stack)
- **Mechanism:** Periodic batch commitment of the Merkle root to a sovereign permissioned blockchain (e.g., National Blockchain Framework hosted by MeitY / NIC).
- **Cost Efficiency:** Only one 32-byte hash is anchored per tender verification cycle, keeping transactions negligible in cost while providing mathematical proof.

---

## 4. API Endpoints & Operational Verification

- **Trigger Anchor:** `POST /api/verification/anchor` (Role: Officer / Admin)
- **Fetch Latest Anchor:** `GET /api/verification/anchor`
- **Tamper Simulation Verification:**
  If an adversary attempts to modify a row in the database and recomputes the internal hashes, the recalculated root hash will no longer match the externally published `merkle_root` recorded in the independent anchor receipt, permanently exposing the fraud.
