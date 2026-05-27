from app.database.db import get_db

# Re-export for cleaner imports in routes
__all__ = ["get_db"]
