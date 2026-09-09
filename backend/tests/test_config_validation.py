import pytest
from config import Settings, validate_startup_config


def test_validation_passes_with_safe_production_config():
    """Verify production settings pass when secure credentials are provided."""
    safe_settings = Settings(
        ENVIRONMENT="production",
        STRICT_CONFIG_VALIDATION=True,
        SECRET_KEY="a-very-long-and-super-secure-random-key-for-prod-32-chars!",
        POSTGRES_PASSWORD="SuperStrongUniquePassword2026!",
        NEO4J_PASSWORD="AnotherUniqueStrongPassword2026!",
    )
    result = validate_startup_config(safe_settings)
    assert result["status"] == "valid"
    assert result["environment"] == "production"


def test_validation_fails_in_production_with_default_secret_key():
    """Verify production fails to boot when SECRET_KEY is the default placeholder."""
    insecure_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="change-this-to-a-random-secret-key-in-production",
        POSTGRES_PASSWORD="SuperStrongPassword2026!",
        NEO4J_PASSWORD="SuperStrongPassword2026!",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_startup_config(insecure_settings)
    assert "SECRET_KEY matches insecure placeholder" in str(exc_info.value)


def test_validation_fails_in_production_with_default_db_passwords():
    """Verify production fails to boot when DB passwords match default placeholders."""
    insecure_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-very-long-and-super-secure-random-key-for-prod-32-chars!",
        POSTGRES_PASSWORD="bidverify_secret_2026",
        NEO4J_PASSWORD="neo4j_secret_2026",
    )
    with pytest.raises(RuntimeError) as exc_info:
        validate_startup_config(insecure_settings)
    assert "POSTGRES_PASSWORD matches default placeholder" in str(exc_info.value)
    assert "NEO4J_PASSWORD matches default placeholder" in str(exc_info.value)


def test_validation_warns_in_development_without_failing():
    """Verify development mode issues warning status without raising RuntimeError."""
    dev_settings = Settings(
        ENVIRONMENT="development",
        STRICT_CONFIG_VALIDATION=False,
        SECRET_KEY="change-this-to-a-random-secret-key-in-production",
        POSTGRES_PASSWORD="bidverify_secret_2026",
        NEO4J_PASSWORD="neo4j_secret_2026",
    )
    res = validate_startup_config(dev_settings)
    assert res["status"] == "insecure_dev_mode"
    assert len(res["warnings"]) == 3
