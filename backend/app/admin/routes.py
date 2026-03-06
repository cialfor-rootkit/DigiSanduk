from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization
from app.auth.security import hash_password
from app.auth.dependencies import get_current_user
from app.audit.utils import log_action

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_super_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.email != "admin@digisanduk":
        raise HTTPException(status_code=403, detail="Super admin required")
    return user


class OrgAdminAssignPayload(BaseModel):
    org_id: int
    user_id: int


class UserCreatePayload(BaseModel):
    name: str | None = None
    email: str
    password: str
    org_id: int


class OrgCreatePayload(BaseModel):
    name: str


class OrgClearPayload(BaseModel):
    org_id: int


@router.get("/org-users")
def list_users_by_org(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    orgs = db.query(Organization).all()
    result = []
    for org in orgs:
        users = db.query(User).filter(User.organization_id == org.id).all()
        result.append(
            {
                "org_id": org.id,
                "org_name": org.name,
                "trust_level": org.trust_level,
                "admin_user_id": org.admin_user_id,
                "users": [
                    {
                        "id": user.id,
                        "email": user.email,
                        "name": user.name
                    }
                    for user in users
                ]
            }
        )
    return result


@router.post("/assign-org-admin")
def assign_org_admin(
    payload: OrgAdminAssignPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    org = db.query(Organization).filter(Organization.id == payload.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user or target_user.organization_id != org.id:
        raise HTTPException(status_code=400, detail="User not in organization")

    org.admin_user_id = target_user.id
    db.commit()
    log_action(
        db=db,
        action="ASSIGN_ORG_ADMIN",
        user_id=int(user_id),
        org_id=org.id,
        target=f"org:{org.id} admin:{target_user.id}"
    )
    return {"message": "Organization admin assigned", "org_id": org.id, "admin_user_id": org.admin_user_id}


@router.post("/clear-org-admin")
def clear_org_admin(
    payload: OrgClearPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    org = db.query(Organization).filter(Organization.id == payload.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.admin_user_id = None
    db.commit()
    log_action(
        db=db,
        action="CLEAR_ORG_ADMIN",
        user_id=int(user_id),
        org_id=org.id,
        target=f"org:{org.id}"
    )
    return {"message": "Organization admin cleared", "org_id": org.id}


@router.post("/users")
def create_user(
    payload: UserCreatePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    org = db.query(Organization).filter(Organization.id == payload.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

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
        action="CREATE_USER",
        user_id=int(user_id),
        org_id=org.id,
        target=f"user:{user.id} -> org:{org.id}"
    )
    return {"message": "User created", "user_id": user.id}


@router.post("/orgs")
def create_org(
    payload: OrgCreatePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    existing = db.query(Organization).filter(Organization.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization already exists")

    org = Organization(name=payload.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    log_action(
        db=db,
        action="CREATE_ORG",
        user_id=int(user_id),
        org_id=org.id,
        target=f"org:{org.id}"
    )
    return {"message": "Organization created", "org_id": org.id}


@router.delete("/users/{target_user_id}")
def delete_user(
    target_user_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    require_super_admin(db, user_id)
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove admin assignment if deleting org admin
    org = db.query(Organization).filter(Organization.admin_user_id == target_user.id).first()
    if org:
        org.admin_user_id = None
        db.commit()

    db.delete(target_user)
    db.commit()
    log_action(
        db=db,
        action="DELETE_USER",
        user_id=int(user_id),
        org_id=target_user.organization_id or 0,
        target=f"user:{target_user.id}"
    )
    return {"message": "User deleted"}
