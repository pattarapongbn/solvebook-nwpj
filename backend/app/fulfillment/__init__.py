from app.core.config import settings
from app.fulfillment.manual import ManualProvider
from app.fulfillment.types import (
    CanonicalShipment,
    FulfillmentProvider,
    Parcel,
    Recipient,
    ShipmentResult,
    ShipmentStatus,
)

_PROVIDERS: dict[str, type] = {
    ManualProvider.name: ManualProvider,
    # เพิ่มเจ้าใหม่ที่นี่: "shippop": ShippopProvider, "flash": FlashProvider
}


def get_provider(name: str | None = None) -> FulfillmentProvider:
    key = (name or settings.fulfillment_provider).strip().lower()
    provider_cls = _PROVIDERS.get(key)
    if provider_cls is None:
        raise ValueError(f"unknown fulfillment provider: {key}")
    provider: FulfillmentProvider = provider_cls()
    return provider


__all__ = [
    "CanonicalShipment",
    "FulfillmentProvider",
    "Parcel",
    "Recipient",
    "ShipmentResult",
    "ShipmentStatus",
    "get_provider",
]
