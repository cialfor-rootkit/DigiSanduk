import json
import ssl
import urllib.request

from app.models.integration import Integration


def _normalize_endpoint(vendor: str, endpoint_url: str) -> str:
    if vendor == "Splunk HEC":
        if endpoint_url.endswith("/services/collector"):
            return f"{endpoint_url}/event"
    return endpoint_url


def send_siem_event(db, event: dict) -> bool:
    integration = db.query(Integration).filter(
        Integration.type == "siem",
        Integration.status == "active"
    ).order_by(Integration.id.desc()).first()

    if not integration or not integration.config:
        return False

    try:
        config = json.loads(integration.config)
    except Exception:
        return False

    vendor = config.get("vendor", "Splunk HEC")
    endpoint_url = _normalize_endpoint(vendor, config.get("endpoint_url", ""))
    token = config.get("token")
    token_prefix = config.get("token_prefix")
    auth_header = config.get("auth_header", "Authorization")
    index = config.get("index")
    sourcetype = config.get("sourcetype")
    verify_ssl = config.get("verify_ssl", True)

    if not endpoint_url:
        return False

    if vendor == "Splunk HEC":
        body = {"event": event}
        if index:
            body["index"] = index
        if sourcetype:
            body["sourcetype"] = sourcetype
        if token_prefix is None:
            token_prefix = "Splunk "
    else:
        body = {"event": event, "vendor": vendor, "source": "digisanduk"}
        if token_prefix is None:
            token_prefix = ""

    headers = {"Content-Type": "application/json"}
    if token:
        headers[auth_header] = f"{token_prefix}{token}"

    data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        endpoint_url,
        data=data,
        headers=headers,
        method="POST"
    )

    context = None
    if not verify_ssl:
        context = ssl._create_unverified_context()

    try:
        with urllib.request.urlopen(request, context=context, timeout=5) as response:
            response.read()
        return True
    except Exception:
        return False
