import os
import time
import json
import base64
import hmac
import secrets
import hashlib
from typing import Optional, Dict, Any

# Chave secreta para assinatura dos tokens (configurável via variável de ambiente)
SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "corrida-de-leito-secret-key-prod-2026-auth-token")


def hash_password(password: str) -> str:
    """
    Gera um hash seguro da senha utilizando PBKDF2-HMAC-SHA256 com 100.000 iterações
    e um salt criptograficamente aleatório de 16 bytes.
    Formato retornado: <salt_hex>$<key_hex>
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica a senha informada contra o hash armazenado em tempo constante
    para mitigar ataques de timing (side-channel attacks).
    """
    try:
        salt, expected_key = hashed_password.split("$")
        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100_000
        )
        return hmac.compare_digest(computed_key.hex(), expected_key)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_in_seconds: int = 86400) -> str:
    """
    Gera um token de acesso seguro assinado com HMAC-SHA256 e expiração configurada (padrão: 24h).
    Formato: <base64_payload>.<hex_signature>
    """
    payload = {
        **data,
        "exp": int(time.time()) + expires_in_seconds,
        "iat": int(time.time())
    }
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Valida a integridade da assinatura e a expiração do token de acesso.
    Retorna o payload se válido, ou None se inválido ou expirado.
    """
    try:
        parts = token.strip().split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            return None

        # Restaura o padding do base64 se necessário
        padded_b64 = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(padded_b64.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Verifica expiração
        if payload.get("exp", 0) < int(time.time()):
            return None

        return payload
    except Exception:
        return None
