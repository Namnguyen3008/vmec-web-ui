import logging
from typing import Any

from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError

from src.config import Settings, get_settings

logger = logging.getLogger("vmec.persistence.cosmos")


class CosmosClientManager:
    """
    Azure Cosmos DB Client Manager for VMEC Healthcare.
    Utilizes Cosmos DB Free Tier (1,000 RU/s + 25GB Storage).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._client: CosmosClient | None = None
        self._database: Any | None = None
        self._containers: dict[str, Any] = {}

    def get_client(self) -> CosmosClient:
        if self._client is None:
            endpoint = self.settings.azure_cosmos_endpoint
            key = self.settings.azure_cosmos_key.get_secret_value()
            if not endpoint or not key:
                raise ValueError(
                    "AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY must be set."
                )
            self._client = CosmosClient(
                endpoint,
                credential=key,
                connection_verify=True,
            )
            logger.info("CosmosClient initialized successfully for %s", endpoint)
        return self._client

    def initialize_database_and_containers(self) -> None:
        """
        Ensures the database and required containers exist with proper partition keys and TTL settings.
        """
        client = self.get_client()
        db_name = self.settings.azure_cosmos_database

        logger.info("Initializing Cosmos DB database: %s", db_name)
        self._database = client.create_database_if_not_exists(id=db_name)

        container_specs = [
            {
                "id": self.settings.azure_cosmos_container_sessions,
                "partition_key": "/userId",
                "default_ttl": self.settings.cosmos_session_ttl_seconds,
            },
            {
                "id": self.settings.azure_cosmos_container_slots,
                "partition_key": "/doctorId",
                "default_ttl": self.settings.cosmos_slot_hold_ttl_seconds,
            },
            {
                "id": self.settings.azure_cosmos_container_records,
                "partition_key": "/patientId",
                "default_ttl": -1,  # Never expire
            },
            {
                "id": self.settings.azure_cosmos_container_bookings,
                "partition_key": "/patientId",
                "default_ttl": -1,  # Never expire
            },
            {
                "id": self.settings.azure_cosmos_container_audit,
                "partition_key": "/sessionId",
                "default_ttl": -1,  # Never expire
            },
        ]

        for spec in container_specs:
            cid = spec["id"]
            pkey = spec["partition_key"]
            ttl = spec["default_ttl"]
            logger.info(
                "Ensuring container '%s' exists with partition_key='%s', ttl=%s",
                cid,
                pkey,
                ttl,
            )
            container = self._database.create_container_if_not_exists(
                id=cid,
                partition_key=PartitionKey(path=pkey),
                default_ttl=ttl,
            )
            self._containers[cid] = container

        logger.info("All Cosmos DB containers verified.")

    def get_container(self, container_name: str) -> Any:
        if container_name in self._containers:
            return self._containers[container_name]

        client = self.get_client()
        if self._database is None:
            self._database = client.get_database_client(
                self.settings.azure_cosmos_database
            )

        container = self._database.get_container_client(container_name)
        self._containers[container_name] = container
        return container

    def ping(self) -> dict[str, Any]:
        """
        Verifies active connectivity to Azure Cosmos DB.
        """
        try:
            client = self.get_client()
            db_client = client.get_database_client(self.settings.azure_cosmos_database)
            props = db_client.read()
            return {
                "status": "HEALTHY",
                "database_id": props.get("id"),
                "endpoint": self.settings.azure_cosmos_endpoint,
            }
        except CosmosHttpResponseError as ex:
            logger.error("Cosmos DB ping failed: %s", ex)
            return {
                "status": "UNHEALTHY",
                "error": str(ex),
            }
        except (RuntimeError, ValueError) as ex:
            logger.error("Configuration or runtime error pinging Cosmos DB: %s", ex)
            return {
                "status": "ERROR",
                "error": str(ex),
            }


_manager_instance: CosmosClientManager | None = None


def get_cosmos_manager() -> CosmosClientManager:
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = CosmosClientManager()
    return _manager_instance
