from functools import lru_cache
from typing import Final, Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_TRUSTED_PUBLIC_CITATION_HOSTS: Final = frozenset(
    {
        "cdn.who.int",
        "icd.who.int",
        "iris.who.int",
        "medlineplus.gov",
        "moh.gov.vn",
        "pmc.ncbi.nlm.nih.gov",
        "www.cdc.gov",
        "www.ncbi.nlm.nih.gov",
        "www.niddk.nih.gov",
        "www.nhs.uk",
        "www.who.int",
    }
)


ALLOWED_GEMINI_MODELS: Final[tuple[str, str]] = (
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "VMEC-Dedicated-Backend"
    app_env: Literal["development", "review", "production", "test"] = "development"
    app_port: int = Field(default=8000, ge=1, le=65535)
    app_host: str = "0.0.0.0"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://vmec-healthcare-web.vercel.app"

    # Google Gemini Generative AI (Strict Policy: ONLY gemini-3.1-flash-lite & gemini-3.5-flash-lite)
    gemini_api_key: SecretStr = SecretStr("")
    gemini_api_key_2: SecretStr = SecretStr("")
    gemini_api_key_3: SecretStr = SecretStr("")
    gemini_api_key_4: SecretStr = SecretStr("")
    gemini_api_key_5: SecretStr = SecretStr("")
    gemini_api_key_6: SecretStr = SecretStr("")
    gemini_api_key_7: SecretStr = SecretStr("")
    gemini_generative_model_1: str = "gemini-3.1-flash-lite"
    gemini_generative_model_2: str = "gemini-3.5-flash-lite"
    gemini_call_timeout_seconds: float = Field(default=30.0, gt=0, le=120)
    gemini_max_attempts_per_model: int = Field(default=2, ge=1, le=5)

    # Mistral Semantic Embeddings (Rotation Pool: 13 Keys)
    mistral_api_key: SecretStr = SecretStr("")
    mistral_api_key_2: SecretStr = SecretStr("")
    mistral_api_key_3: SecretStr = SecretStr("")
    mistral_api_key_4: SecretStr = SecretStr("")
    mistral_api_key_5: SecretStr = SecretStr("")
    mistral_api_key_6: SecretStr = SecretStr("")
    mistral_api_key_7: SecretStr = SecretStr("")
    mistral_api_key_8: SecretStr = SecretStr("")
    mistral_api_key_9: SecretStr = SecretStr("")
    mistral_api_key_10: SecretStr = SecretStr("")
    mistral_api_key_11: SecretStr = SecretStr("")
    mistral_api_key_12: SecretStr = SecretStr("")
    mistral_api_key_13: SecretStr = SecretStr("")
    mistral_embedding_model: str = "mistral-embed"
    mistral_embedding_dimensions: int = 1024
    mistral_call_timeout_seconds: float = Field(default=10.0, gt=0, le=60)

    # Supabase pgvector Cloud Knowledge Base
    supabase_url: str = "https://nntxlqchytvfmutmixea.supabase.co"
    supabase_anon_key: SecretStr = SecretStr("")
    supabase_service_role_key: SecretStr = SecretStr("")
    retrieval_candidate_limit: int = Field(default=5, ge=1, le=50)
    retrieval_similarity_threshold: float = Field(default=0.40, ge=0.0, le=1.0)
    citation_public_hosts: str = ",".join(sorted(DEFAULT_TRUSTED_PUBLIC_CITATION_HOSTS))

    # Azure Cosmos DB Free Tier Configuration
    azure_cosmos_endpoint: str = "https://cosmos-vmec-ai-2026.documents.azure.com:443/"
    azure_cosmos_key: SecretStr = SecretStr("")
    azure_cosmos_database: str = "vmec_healthcare_db"
    azure_cosmos_container_sessions: str = "patient_sessions"
    azure_cosmos_container_slots: str = "slot_holds"
    azure_cosmos_container_records: str = "medical_records"
    azure_cosmos_container_bookings: str = "appointments"
    azure_cosmos_container_audit: str = "audit_logs"
    cosmos_session_ttl_seconds: int = Field(default=86400, ge=300, le=2_592_000)  # 24h
    cosmos_slot_hold_ttl_seconds: int = Field(default=900, ge=60, le=3600)  # 15m

    # Feature Flags for 28-Node Chat Flow
    rag_enabled: bool = True
    mcp_enabled: bool = False
    emergency_notification_enabled: bool = False
    input_max_length: int = Field(default=2000, ge=100, le=10000)

    @model_validator(mode="after")
    def validate_gemini_models(self) -> "Settings":
        configured = (self.gemini_generative_model_1, self.gemini_generative_model_2)
        if configured != ALLOWED_GEMINI_MODELS:
            raise ValueError(
                f"Gemini generative models must strictly be {ALLOWED_GEMINI_MODELS}, got {configured}"
            )
        return self

    def get_cors_origins_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    def get_gemini_api_keys(self) -> list[str]:
        keys = [
            self.gemini_api_key.get_secret_value(),
            self.gemini_api_key_2.get_secret_value(),
            self.gemini_api_key_3.get_secret_value(),
            self.gemini_api_key_4.get_secret_value(),
            self.gemini_api_key_5.get_secret_value(),
            self.gemini_api_key_6.get_secret_value(),
            self.gemini_api_key_7.get_secret_value(),
        ]
        return [k for k in keys if k]

    def get_mistral_api_keys(self) -> list[str]:
        keys = [
            self.mistral_api_key.get_secret_value(),
            self.mistral_api_key_2.get_secret_value(),
            self.mistral_api_key_3.get_secret_value(),
            self.mistral_api_key_4.get_secret_value(),
            self.mistral_api_key_5.get_secret_value(),
            self.mistral_api_key_6.get_secret_value(),
            self.mistral_api_key_7.get_secret_value(),
            self.mistral_api_key_8.get_secret_value(),
            self.mistral_api_key_9.get_secret_value(),
            self.mistral_api_key_10.get_secret_value(),
            self.mistral_api_key_11.get_secret_value(),
            self.mistral_api_key_12.get_secret_value(),
            self.mistral_api_key_13.get_secret_value(),
        ]
        return [k for k in keys if k]


@lru_cache
def get_settings() -> Settings:
    return Settings()
