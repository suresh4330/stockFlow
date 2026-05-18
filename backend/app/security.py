import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from .config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt, stored_digest = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return hmac.compare_digest(digest, stored_digest)


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": int((datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    header_part = _b64encode(json.dumps(header, separators=(",", ":")).encode())
    payload_part = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_part}.{payload_part}"
    signature = hmac.new(settings.jwt_secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}"
        expected_signature = hmac.new(settings.jwt_secret.encode(), signing_input.encode(), hashlib.sha256).digest()
        supplied_signature = _b64decode(signature_part)
        if not hmac.compare_digest(expected_signature, supplied_signature):
            return None

        payload = json.loads(_b64decode(payload_part))
        if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return payload
    except Exception:
        return None

