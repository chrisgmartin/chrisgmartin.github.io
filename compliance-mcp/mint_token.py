"""Mint a JWT for testing the compliance-toolkit HTTP server.

In production this lives in a server-side mint endpoint with proper user auth,
short TTLs, and scoping. For learning, we'll mint a 1-hour token for a fake user.
"""

import jwt
from datetime import datetime, timedelta, timezone

SECRET = "dev-secret-do-not-use-in-production"

def mint(user_id: str, allowed_tools: list[str], ttl_minutes: int = 60) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl_minutes)).timestamp()),
        "scope": {"tools": allowed_tools},
        "purpose": "compliance-toolkit-access",
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


if __name__ == "__main__":
    # Issue a token that allows all tools
    token = mint(
        user_id="analyst.demo@example.com",
        allowed_tools=["lookup_sanctions_hit", "check_jurisdiction_risk", "summarize_alert"],
    )
    print(token)