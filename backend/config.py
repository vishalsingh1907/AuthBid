"""
SIH26100 — Backend Configuration
Loads environment variables with sensible defaults for development.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── App ──
    APP_NAME: str = "AuthBid — GeM Compliance Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── LLM ──
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"

    # ── PostgreSQL ──
    POSTGRES_USER: str = "bidverify"
    POSTGRES_PASSWORD: str = "bidverify_secret_2026"
    POSTGRES_DB: str = "bid_compliance"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def DATABASE_URL_SYNC(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # ── Neo4j ──
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "neo4j_secret_2026"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Security & Environment ──
    ENVIRONMENT: str = "development"
    STRICT_CONFIG_VALIDATION: bool = False
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── External Anchoring ──
    EXTERNAL_ANCHOR_SERVICE_URL: str = "https://transparency.gem.gov.in/rfc3161"

    # ── CORS ──
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


INSECURE_SECRET_KEYS = {
    "change-this-to-a-random-secret-key-in-production",
    "secret",
    "default",
    "changeme",
    "secret123",
    "",
}

INSECURE_POSTGRES_PASSWORDS = {
    "bidverify_secret_2026",
    "password",
    "postgres",
    "admin",
    "123456",
}

INSECURE_NEO4J_PASSWORDS = {
    "neo4j_secret_2026",
    "password",
    "admin",
    "123456",
}


def validate_startup_config(s: Settings) -> dict:
    """
    Validates application settings on startup.
    Refuses to boot in production if SECRET_KEY or DB passwords match insecure defaults.
    """
    is_prod = s.ENVIRONMENT.lower() in ["production", "prod"] or s.STRICT_CONFIG_VALIDATION
    violations = []

    if s.SECRET_KEY in INSECURE_SECRET_KEYS or len(s.SECRET_KEY) < 32:
        violations.append(
            "SECRET_KEY matches insecure placeholder or is shorter than 32 characters."
        )

    if s.POSTGRES_PASSWORD in INSECURE_POSTGRES_PASSWORDS:
        violations.append(
            "POSTGRES_PASSWORD matches default placeholder 'bidverify_secret_2026'."
        )

    if s.NEO4J_PASSWORD in INSECURE_NEO4J_PASSWORDS:
        violations.append(
            "NEO4J_PASSWORD matches default placeholder 'neo4j_secret_2026'."
        )

    if is_prod and violations:
        error_msg = (
            "FATAL: Production startup configuration check failed. Refusing to boot with insecure defaults:\n"
            + "\n".join(f" - {v}" for v in violations)
        )
        raise RuntimeError(error_msg)

    if violations:
        print("[SECURITY WARNING] Running with development default credentials.")
        for v in violations:
            print(f"  * {v}")
        print("  These MUST be replaced with secure values before production deployment.")

    return {
        "status": "valid" if not violations else "insecure_dev_mode",
        "environment": s.ENVIRONMENT,
        "strict_mode": is_prod,
        "warnings": violations,
    }


settings = Settings()
