from datetime import datetime, timezone


def utcnow_str() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_get(d: dict, *keys, default=None):
    """Safe nested dict access."""
    for key in keys:
        if not isinstance(d, dict):
            return default
        d = d.get(key, default)
    return d
