from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

# Western Indonesia Time / Waktu Indonesia Barat (WIB) = GMT+7
JAKARTA_TZ = ZoneInfo("Asia/Jakarta")

def get_jakarta_now() -> datetime:
    """Returns current datetime in Asia/Jakarta (GMT+7) timezone."""
    return datetime.now(JAKARTA_TZ)

def get_jakarta_now_naive() -> datetime:
    """Returns current datetime in Asia/Jakarta timezone as a naive datetime for DB compatibility."""
    return datetime.now(JAKARTA_TZ).replace(tzinfo=None)
