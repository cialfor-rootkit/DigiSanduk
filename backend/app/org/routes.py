from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.organization import Organization
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.auth.security import hash_password
from app.audit.utils import log_action

router = APIRouter(prefix="/org", tags=["Organizations"])


class OrgCreatePayload(BaseModel):
    name: str


class TrustLevelPayload(BaseModel):
    org_id: int
    trust_level: str


def require_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.email != "admin@digisanduk":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_org_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=400, detail="User not assigned to organization")
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org or org.admin_user_id != user.id:
        raise HTTPException(status_code=403, detail="Organization admin required")
    return org


@router.get("/list")
def list_organizations(
    db: Session = Depends(get_db)
):
    orgs = db.query(Organization).order_by(Organization.name.asc()).all()
    return [
        {
            "id": org.id,
            "name": org.name,
            "trust_level": org.trust_level
        }
        for org in orgs
    ]


@router.post("/create")
def create_organization(
    payload: OrgCreatePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    name = payload.name
    existing = db.query(Organization).filter(Organization.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization already exists")

    org = Organization(name=name)  # trust_level defaults to "low"
    db.add(org)
    db.commit()
    db.refresh(org)

    # attach org to user
    user = db.query(User).filter(User.id == int(user_id)).first()
    user.organization_id = org.id
    db.commit()
    log_action(
        db=db,
        action="CREATE_ORGANIZATION",
        user_id=int(user_id),
        org_id=org.id,
        target=f"org:{org.id}"
    )

    return {
        "message": "Organization created and user assigned",
        "org_id": org.id,
        "trust_level": org.trust_level
    }


@router.get("/me")
def get_my_org(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": org.id,
        "name": org.name,
        "trust_level": org.trust_level
    }


@router.get("/admin/users")
def list_org_users(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    org = require_org_admin(db, user_id)
    users = db.query(User).filter(User.organization_id == org.id).all()
    return {
        "org_admin_user_id": org.admin_user_id,
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "is_active": user.is_active,
                "is_org_admin": user.id == org.admin_user_id
            }
            for user in users
        ]
    }


class OrgUserCreatePayload(BaseModel):
    name: str | None = None
    email: str
    password: str


@router.post("/admin/users")
def create_org_user(
    payload: OrgUserCreatePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    org = require_org_admin(db, user_id)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(
        db=db,
        action="CREATE_ORG_USER",
        user_id=int(user_id),
        org_id=org.id,
        target=f"user:{user.id} -> org:{org.id}"
    )
    return {"message": "User created", "user_id": user.id}


class OrgUserStatusPayload(BaseModel):
    user_id: int
    is_active: bool


@router.put("/admin/users/status")
def update_org_user_status(
    payload: OrgUserStatusPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    org = require_org_admin(db, user_id)
    target = db.query(User).filter(
        User.id == payload.user_id,
        User.organization_id == org.id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == org.admin_user_id and not payload.is_active:
        raise HTTPException(status_code=400, detail="Cannot disable organization admin")

    target.is_active = payload.is_active
    db.commit()

    log_action(
        db=db,
        action="UPDATE_USER_STATUS",
        user_id=int(user_id),
        org_id=org.id,
        target=f"user:{target.id} active:{target.is_active}"
    )

    return {"message": "User status updated", "user_id": target.id, "is_active": target.is_active}


@router.put("/set-trust")
def set_trust_level(
    payload: TrustLevelPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_admin(db, user_id)
    org_id = payload.org_id
    trust_level = payload.trust_level
    org = db.query(Organization).filter(Organization.id == org_id).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if trust_level not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid trust level. Use: low, medium, or high"
        )

    org.trust_level = trust_level
    db.commit()
    db.refresh(org)
    log_action(
        db=db,
        action="UPDATE_TRUST_LEVEL",
        user_id=int(user_id),
        org_id=org.id,
        target=f"org:{org.id} trust:{org.trust_level}"
    )

    return {
        "message": "Trust level updated",
        "org_id": org.id,
        "trust_level": org.trust_level
    }
