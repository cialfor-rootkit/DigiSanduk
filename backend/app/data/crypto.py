import os
import base64
try:
    from cryptography.fernet import Fernet, InvalidToken
except Exception:  # pragma: no cover - fallback if dependency missing
    Fernet = None
    InvalidToken = Exception


def _load_key() -> bytes:
    raw = os.getenv("DATA_ENCRYPTION_KEY")
    if raw:
        return raw.encode("utf-8")
    # Fallback deterministic key for development (override in production)
    seed = (os.getenv("SECRET_KEY") or "digisanduk-dev-key").encode("utf-8")
    return base64.urlsafe_b64encode(seed.ljust(32, b"0")[:32])


def get_fernet() -> Fernet:
    if Fernet is None:
        return None
    return Fernet(_load_key())


def encrypt_text(plain_text: str) -> str:
    fernet = get_fernet()
    if fernet is None:
        return base64.b64encode(plain_text.encode("utf-8")).decode("utf-8")
    token = fernet.encrypt(plain_text.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_text(cipher_text: str) -> str:
    fernet = get_fernet()
    if fernet is None:
        try:
            return base64.b64decode(cipher_text.encode("utf-8")).decode("utf-8")
        except Exception:
            return cipher_text
    try:
        data = fernet.decrypt(cipher_text.encode("utf-8"))
        return data.decode("utf-8")
    except InvalidToken:
        return cipher_text
