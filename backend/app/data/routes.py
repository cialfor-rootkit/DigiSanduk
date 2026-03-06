from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.data_share import DataShare
from app.models.organization import Organization
from app.audit.utils import log_action
from app.database import SessionLocal
from app.models.security_data import SecurityData
from app.models.tag import Tag
from app.models.data_tag import DataTag
from app.models.privacy_setting import PrivacySetting
from app.models.data_request import DataRequest
from app.models.share_connection import ShareConnection
from app.models.user import User
from app.auth.dependencies import get_current_user
from .crypto import encrypt_text, decrypt_text

router = APIRouter(prefix="/data", tags=["Security Data"])


class SharePayload(BaseModel):
    target_org_id: int
    data_type: str
    encrypted_payload: str
    threat_type: str | None = None
    severity: str | None = None
    sector: str | None = None
    tags: list[str] | None = None
    anonymize_source: bool = False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_org_admin(db: Session, user: User):
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org or org.admin_user_id != user.id:
        raise HTTPException(status_code=403, detail="Organization admin required")
    return org


def get_connection(db: Session, org_a: int, org_b: int):
    return db.query(ShareConnection).filter(
        ((ShareConnection.org_a_id == org_a) & (ShareConnection.org_b_id == org_b)) |
        ((ShareConnection.org_a_id == org_b) & (ShareConnection.org_b_id == org_a))
    ).first()


@router.get("/tags")
def list_tags(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(Tag).all()


@router.post("/share")
def share_data(
    payload: SharePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")

    target_org = db.query(Organization).filter(Organization.id == payload.target_org_id).first()
    if not target_org:
        raise HTTPException(status_code=404, detail="Target organization not found")
    if target_org.id == user.organization_id:
        raise HTTPException(status_code=400, detail="Cannot share with your own organization")
    if target_org.trust_level == "low":
        raise HTTPException(status_code=403, detail="Target organization is not trusted")

    connection = get_connection(db, user.organization_id, payload.target_org_id)
    if not connection or not connection.enabled:
        raise HTTPException(status_code=403, detail="No active data sharing connection for this organization")

    encrypted_content = encrypt_text(payload.encrypted_payload)
    data = SecurityData(
        title=payload.data_type,
        content=encrypted_content,
        threat_type=payload.threat_type,
        severity=payload.severity,
        sector=payload.sector,
        owner_org_id=user.organization_id
    )

    db.add(data)
    db.commit()
    db.refresh(data)

    share = DataShare(
        data_id=data.id,
        shared_with_org_id=payload.target_org_id,
        anonymized=payload.anonymize_source
    )

    db.add(share)
    db.commit()

    if payload.anonymize_source:
        privacy = db.query(PrivacySetting).filter(PrivacySetting.user_id == user.id).first()
        if not privacy or not privacy.allow_anonymous_sharing or not privacy.consented:
            raise HTTPException(status_code=403, detail="Anonymous sharing not permitted without consent")

    if payload.tags:
        for raw_tag in payload.tags:
            tag_name = raw_tag.strip()
            if not tag_name:
                continue
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
                db.commit()
                db.refresh(tag)
            db.add(DataTag(data_id=data.id, tag_id=tag.id))
        db.commit()

    log_action(
        db=db,
        action="SHARE_DATA",
        user_id=int(user_id),
        org_id=user.organization_id,
        target=f"data:{data.id} -> org:{payload.target_org_id}"
    )

    return {
        "message": "Security data shared",
        "data_id": data.id,
        "shared_with_org_id": payload.target_org_id
    }


@router.get("/shared")
def list_shared_data(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")

    shares = db.query(DataShare, SecurityData).join(
        SecurityData, DataShare.data_id == SecurityData.id
    ).filter(
        SecurityData.owner_org_id == user.organization_id
    ).all()

    return [
        {
            "id": share.id,
            "target_org_id": share.shared_with_org_id,
            "data_type": data.title,
            "status": "Shared",
            "created_at": share.created_at
        }
        for share, data in shares
    ]


@router.get("/my-org")
def read_org_data(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()

    data = db.query(SecurityData).filter(
        SecurityData.owner_org_id == user.organization_id
    ).all()

    return data


@router.post("/share-with-org")
def share_data_with_org(
    data_id: int,
    target_org_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    data = db.query(SecurityData).filter(SecurityData.id == data_id).first()

    if not data:
        raise HTTPException(status_code=404, detail="Security data not found")

    if data.owner_org_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Not owner of this data")

    target_org = db.query(Organization).filter(
        Organization.id == target_org_id
    ).first()

    if not target_org:
        raise HTTPException(status_code=404, detail="Target organization not found")

    if target_org.trust_level == "low":
        raise HTTPException(
            status_code=403,
            detail="Target organization is not trusted"
        )

    connection = get_connection(db, user.organization_id, target_org_id)
    if not connection or not connection.enabled:
        raise HTTPException(status_code=403, detail="No active data sharing connection for this organization")

    existing = db.query(DataShare).filter(
        DataShare.data_id == data_id,
        DataShare.shared_with_org_id == target_org_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already shared with this org")

    share = DataShare(
        data_id=data_id,
        shared_with_org_id=target_org_id
    )

    db.add(share)
    db.commit()

    log_action(
    db=db,
    action="SHARE_DATA_WITH_ORG",
    user_id=int(user_id),
    org_id=user.organization_id,
    target=f"data:{data_id} -> org:{target_org_id}"
    )

    return {
        "message": "Data shared with organization",
        "data_id": data_id,
        "shared_with_org_id": target_org_id
    }

@router.get("/shared-with-me")
def get_data_shared_with_my_org(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()

    shared_items = db.query(DataShare, SecurityData).join(
        SecurityData,
        SecurityData.id == DataShare.data_id
    ).filter(
        DataShare.shared_with_org_id == user.organization_id
    ).all()

    log_action(
    db=db,
    action="READ_SHARED_DATA",
    user_id=int(user_id),
    org_id=user.organization_id,
    target="shared_data_access"
    )

    results = []
    for share, data in shared_items:
        tags = db.query(Tag).join(DataTag, Tag.id == DataTag.tag_id).filter(
            DataTag.data_id == data.id
        ).all()
        results.append(
            {
                "share_id": share.id,
                "data_id": data.id,
                "owner_org_id": None if share.anonymized else data.owner_org_id,
                "data_type": data.title,
                "encrypted_payload": decrypt_text(data.content),
                "shared_with_org_id": share.shared_with_org_id,
                "threat_type": data.threat_type,
                "severity": data.severity,
                "sector": data.sector,
                "tags": [tag.name for tag in tags]
            }
        )

    return results


class DataRequestPayload(BaseModel):
    target_org_id: int
    data_type: str
    reason: str | None = None


class RequestDecisionPayload(BaseModel):
    approve: bool = True


@router.post("/requests")
def create_request(
    payload: DataRequestPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    if org.id == payload.target_org_id:
        raise HTTPException(status_code=400, detail="Cannot request from same organization")

    request = DataRequest(
        requester_org_id=org.id,
        target_org_id=payload.target_org_id,
        requested_by_user_id=user.id,
        data_type=payload.data_type,
        reason=payload.reason,
        status="pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    log_action(
        db=db,
        action="CREATE_DATA_REQUEST",
        user_id=int(user_id),
        org_id=org.id,
        target=f"request:{request.id} -> org:{payload.target_org_id}"
    )
    return {"message": "Request created", "request_id": request.id}


@router.get("/requests/outgoing")
def list_outgoing_requests(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    requests = db.query(DataRequest).filter(DataRequest.requester_org_id == org.id).all()
    org_map = {o.id: o.name for o in db.query(Organization).all()}
    return [
        {
            "id": request.id,
            "requester_org_id": request.requester_org_id,
            "requester_org_name": org_map.get(request.requester_org_id),
            "target_org_id": request.target_org_id,
            "target_org_name": org_map.get(request.target_org_id),
            "data_type": request.data_type,
            "reason": request.reason,
            "status": request.status,
            "created_at": request.created_at,
            "reviewed_at": request.reviewed_at
        }
        for request in requests
    ]


@router.get("/requests/incoming")
def list_incoming_requests(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    requests = db.query(DataRequest).filter(DataRequest.target_org_id == org.id).all()
    org_map = {o.id: o.name for o in db.query(Organization).all()}
    return [
        {
            "id": request.id,
            "requester_org_id": request.requester_org_id,
            "requester_org_name": org_map.get(request.requester_org_id),
            "target_org_id": request.target_org_id,
            "target_org_name": org_map.get(request.target_org_id),
            "data_type": request.data_type,
            "reason": request.reason,
            "status": request.status,
            "created_at": request.created_at,
            "reviewed_at": request.reviewed_at
        }
        for request in requests
    ]


@router.post("/requests/{request_id}/review")
def review_request(
    request_id: int,
    payload: RequestDecisionPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
    if not request or request.target_org_id != org.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    if not payload.approve:
        request.status = "rejected"
        request.reviewed_by_user_id = user.id
        request.reviewed_at = datetime.utcnow()
        connection = get_connection(db, request.requester_org_id, request.target_org_id)
        if connection:
            connection.enabled = False
        db.commit()
        log_action(
            db=db,
            action="REJECT_DATA_REQUEST",
            user_id=int(user_id),
            org_id=org.id,
            target=f"request:{request.id} -> org:{request.requester_org_id}"
        )
        return {"message": "Request rejected"}

    connection = get_connection(db, request.requester_org_id, request.target_org_id)
    if connection:
        connection.enabled = True
    else:
        connection = ShareConnection(
            org_a_id=request.requester_org_id,
            org_b_id=request.target_org_id,
            enabled=True
        )
        db.add(connection)
        db.commit()

    request.status = "accepted"
    request.reviewed_by_user_id = user.id
    request.reviewed_at = datetime.utcnow()
    db.commit()

    log_action(
        db=db,
        action="ACCEPT_DATA_REQUEST",
        user_id=int(user_id),
        org_id=org.id,
        target=f"request:{request.id} -> org:{request.requester_org_id}"
    )

    return {"message": "Request accepted. Data sharing enabled.", "connection_id": connection.id}


@router.get("/connections")
def list_connections(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    orgs = {o.id: o.name for o in db.query(Organization).all()}
    connections = db.query(ShareConnection).filter(
        (ShareConnection.org_a_id == org.id) | (ShareConnection.org_b_id == org.id)
    ).all()

    results = []
    for connection in connections:
        other_id = connection.org_b_id if connection.org_a_id == org.id else connection.org_a_id
        latest_request = db.query(DataRequest).filter(
            ((DataRequest.requester_org_id == org.id) & (DataRequest.target_org_id == other_id)) |
            ((DataRequest.requester_org_id == other_id) & (DataRequest.target_org_id == org.id))
        ).order_by(DataRequest.id.desc()).first()
        results.append(
            {
                "connection_id": connection.id,
                "org_id": org.id,
                "other_org_id": other_id,
                "other_org_name": orgs.get(other_id),
                "enabled": connection.enabled,
                "created_at": connection.created_at,
                "request_id": latest_request.id if latest_request else None,
                "request_status": latest_request.status if latest_request else None,
                "data_type": latest_request.data_type if latest_request else None,
                "reason": latest_request.reason if latest_request else None,
                "requested_by_org_id": latest_request.requester_org_id if latest_request else None,
                "target_org_id": latest_request.target_org_id if latest_request else None
            }
        )
    return results


@router.get("/connections/active")
def list_active_connections(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")
    org_id = user.organization_id
    orgs = {o.id: o.name for o in db.query(Organization).all()}
    connections = db.query(ShareConnection).filter(
        ((ShareConnection.org_a_id == org_id) | (ShareConnection.org_b_id == org_id)) &
        (ShareConnection.enabled == True)  # noqa: E712
    ).all()
    results = []
    for connection in connections:
        other_id = connection.org_b_id if connection.org_a_id == org_id else connection.org_a_id
        results.append(
            {
                "connection_id": connection.id,
                "other_org_id": other_id,
                "other_org_name": orgs.get(other_id),
                "enabled": connection.enabled
            }
        )
    return results


class ConnectionTogglePayload(BaseModel):
    enabled: bool


@router.post("/connections/{connection_id}/toggle")
def toggle_connection(
    connection_id: int,
    payload: ConnectionTogglePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    org = require_org_admin(db, user)
    connection = db.query(ShareConnection).filter(ShareConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if connection.org_a_id != org.id and connection.org_b_id != org.id:
        raise HTTPException(status_code=403, detail="Not authorized for this connection")

    connection.enabled = bool(payload.enabled)

    other_id = connection.org_b_id if connection.org_a_id == org.id else connection.org_a_id
    latest_request = db.query(DataRequest).filter(
        (DataRequest.requester_org_id == other_id) &
        (DataRequest.target_org_id == org.id)
    ).order_by(DataRequest.id.desc()).first()
    if latest_request:
        latest_request.status = "accepted" if connection.enabled else "rejected"
        latest_request.reviewed_by_user_id = user.id
        latest_request.reviewed_at = datetime.utcnow()

    db.commit()

    log_action(
        db=db,
        action="TOGGLE_SHARE_CONNECTION",
        user_id=int(user_id),
        org_id=org.id,
        target=f"connection:{connection.id} enabled:{connection.enabled}"
    )

    return {
        "message": "Connection updated",
        "connection_id": connection.id,
        "enabled": connection.enabled
    }
