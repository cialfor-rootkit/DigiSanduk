import base64
import hashlib
import hmac
import os
import struct
import time


def generate_secret() -> str:
    random_bytes = os.urandom(20)
    return base64.b32encode(random_bytes).decode("utf-8").replace("=", "")


def _int_to_bytes(value: int) -> bytes:
    return struct.pack(">Q", value)


def totp_code(secret: str, interval: int = 30, digits: int = 6) -> str:
    key = base64.b32decode(secret + "=" * ((8 - len(secret) % 8) % 8))
    counter = int(time.time() / interval)
    msg = _int_to_bytes(counter)
    hmac_digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = hmac_digest[-1] & 0x0F
    code = struct.unpack(">I", hmac_digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(code % (10 ** digits)).zfill(digits)


def verify_totp(secret: str, code: str, window: int = 1) -> bool:
    code = (code or "").strip()
    if not code.isdigit():
        return False

    for offset in range(-window, window + 1):
        if _totp_at(secret, offset) == code:
            return True
    return False


def _totp_at(secret: str, offset: int, interval: int = 30, digits: int = 6) -> str:
    key = base64.b32decode(secret + "=" * ((8 - len(secret) % 8) % 8))
    counter = int(time.time() / interval) + offset
    msg = _int_to_bytes(counter)
    hmac_digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset_bits = hmac_digest[-1] & 0x0F
    code = struct.unpack(">I", hmac_digest[offset_bits:offset_bits + 4])[0] & 0x7FFFFFFF
    return str(code % (10 ** digits)).zfill(digits)
