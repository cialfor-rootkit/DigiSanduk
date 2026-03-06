from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.integration import Integration
from app.models.user import User
from app.audit.utils import log_action
from app.auth.dependencies import get_current_user
import json
import ssl
import urllib.request

router = APIRouter(prefix="/integrations", tags=["Integrations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IntegrationPayload(BaseModel):
    name: str
    type: str
    config: str | None = None


class SiemConfig(BaseModel):
    vendor: str = "Splunk HEC"
    endpoint_url: str
    token: str | None = None
    token_prefix: str | None = None
    auth_header: str | None = None
    index: str | None = None
    sourcetype: str | None = None
    verify_ssl: bool = True


class SiemTestPayload(SiemConfig):
    test_event: dict | None = None


@router.get("")
def list_integrations(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(Integration).all()


@router.post("")
def add_integration(
    payload: IntegrationPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    integration = Integration(
        name=payload.name,
        type=payload.type,
        config=payload.config,
        status="active"
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else 0
    log_action(
        db=db,
        action="ADD_INTEGRATION",
        user_id=int(user_id),
        org_id=org_id or 0,
        target=f"integration:{integration.id}"
    )
    return {"message": "Integration added", "integration_id": integration.id}


@router.post("/siem")
def add_siem_integration(
    payload: SiemConfig,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    config = json.dumps(payload.dict())
    integration = Integration(
        name=payload.vendor,
        type="siem",
        config=config,
        status="active"
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else 0
    log_action(
        db=db,
        action="ADD_SIEM_INTEGRATION",
        user_id=int(user_id),
        org_id=org_id or 0,
        target=f"siem:{integration.id}"
    )
    return {"message": "SIEM integration added", "integration_id": integration.id}


@router.post("/siem/test")
def test_siem_integration(
    payload: SiemTestPayload,
    user_id: int = Depends(get_current_user)
):
    event = payload.test_event or {
        "event_type": "SIEM_TEST",
        "message": "DigiSanduk SIEM integration test",
        "vendor": payload.vendor
    }
    endpoint_url = payload.endpoint_url
    if payload.vendor == "Splunk HEC" and endpoint_url.endswith("/services/collector"):
        endpoint_url = f"{endpoint_url}/event"
    if payload.vendor == "Splunk HEC":
        body = {"event": event}
        if payload.index:
            body["index"] = payload.index
        if payload.sourcetype:
            body["sourcetype"] = payload.sourcetype
    else:
        body = {
            "event": event,
            "source": "digisanduk",
            "vendor": payload.vendor
        }

    data = json.dumps(body).encode("utf-8")
    auth_header = payload.auth_header or "Authorization"
    token_prefix = payload.token_prefix
    if payload.vendor == "Splunk HEC" and not token_prefix:
        token_prefix = "Splunk "
    elif token_prefix is None:
        token_prefix = ""

    headers = {"Content-Type": "application/json"}
    if payload.token:
        headers[auth_header] = f"{token_prefix}{payload.token}"
    request = urllib.request.Request(
        endpoint_url,
        data=data,
        headers=headers,
        method="POST"
    )
    context = None
    if not payload.verify_ssl:
        context = ssl._create_unverified_context()

    try:
        with urllib.request.urlopen(request, context=context, timeout=10) as response:
            response_body = response.read().decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"SIEM test failed: {exc}") from exc

    # Write audit event for test
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        org_id = user.organization_id if user else 0
        log_action(
            db=db,
            action="TEST_SIEM_INTEGRATION",
            user_id=int(user_id),
            org_id=org_id or 0,
            target=f"siem:{payload.vendor}"
        )
    finally:
        db.close()

    return {"message": "SIEM test event sent", "response": response_body}


@router.put("/{integration_id}")
def update_integration(
    integration_id: int,
    payload: IntegrationPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.name = payload.name
    integration.type = payload.type
    integration.config = payload.config
    db.commit()

    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else 0
    log_action(
        db=db,
        action="UPDATE_INTEGRATION",
        user_id=int(user_id),
        org_id=org_id or 0,
        target=f"integration:{integration_id}"
    )

    return {"message": "Integration updated"}


@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    db.delete(integration)
    db.commit()

    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else 0
    log_action(
        db=db,
        action="DELETE_INTEGRATION",
        user_id=int(user_id),
        org_id=org_id or 0,
        target=f"integration:{integration_id}"
    )

    return {"message": "Integration deleted"}


@router.put("/{integration_id}/status")
def update_status(
    integration_id: int,
    status: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.status = status
    db.commit()
    user = db.query(User).filter(User.id == int(user_id)).first()
    org_id = user.organization_id if user else 0
    log_action(
        db=db,
        action="UPDATE_INTEGRATION_STATUS",
        user_id=int(user_id),
        org_id=org_id or 0,
        target=f"integration:{integration_id} status:{status}"
    )
    return {"message": "Status updated"}
