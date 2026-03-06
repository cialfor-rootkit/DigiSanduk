from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models.user import User
from ..models.organization import Organization
from ..models.mfa import MFASettings
from .security import hash_password, verify_password
from .jwt import create_access_token
from .dependencies import get_current_user
from ..models.role import Role
from ..models.user_role import UserRole
from .mfa import generate_secret, verify_totp
from app.audit.utils import log_action

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class Credentials(BaseModel):
    name: str | None = None
    email: str
    password: str
    organization_name: str | None = None
    mfa_code: str | None = None


class MFAVerifyPayload(BaseModel):
    code: str


class RoleAssignPayload(BaseModel):
    user_email: str
    role_name: str


class ProfileUpdatePayload(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    current_password: str | None = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create-user")
def create_user(
    payload: Credentials,
    db: Session = Depends(get_db)
):
    email = payload.email
    password = payload.password
    organization_name = payload.organization_name
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    org = None
    if organization_name:
        org = db.query(Organization).filter(Organization.name == organization_name).first()
        if not org:
            org = Organization(name=organization_name)
            db.add(org)
            db.commit()
            db.refresh(org)

    user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(password),
        organization_id=org.id if org else None
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(
        db=db,
        action="CREATE_USER_SELF",
        user_id=user.id,
        org_id=user.organization_id or 0,
        target=f"user:{user.id}"
    )

    return {
        "message": "User created successfully",
        "user_id": user.id,
        "organization_id": user.organization_id,
        "organization_name": org.name if org else None
    }

@router.post("/login")
def login(
    payload: Credentials,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")

    mfa = db.query(MFASettings).filter(MFASettings.user_id == user.id).first()
    if mfa and mfa.enabled:
        if not payload.mfa_code or not verify_totp(mfa.secret, payload.mfa_code):
            raise HTTPException(status_code=401, detail="MFA verification failed")

    token = create_access_token({"sub": str(user.id)})
    log_action(
        db=db,
        action="LOGIN_SUCCESS",
        user_id=user.id,
        org_id=user.organization_id or 0,
        target=f"user:{user.id}"
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/mfa/setup")
def setup_mfa(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    settings = db.query(MFASettings).filter(MFASettings.user_id == user.id).first()
    if not settings:
        secret = generate_secret()
        settings = MFASettings(user_id=user.id, secret=secret, enabled=False)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "secret": settings.secret,
        "enabled": settings.enabled,
        "issuer": "DigiSanduk",
        "account": user.email
    }


@router.post("/mfa/verify")
def verify_mfa(
    payload: MFAVerifyPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    settings = db.query(MFASettings).filter(MFASettings.user_id == int(user_id)).first()
    if not settings:
        raise HTTPException(status_code=404, detail="MFA not initialized")

    if not verify_totp(settings.secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    settings.enabled = True
    db.commit()
    return {"message": "MFA enabled"}


@router.post("/mfa/disable")
def disable_mfa(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    settings = db.query(MFASettings).filter(MFASettings.user_id == int(user_id)).first()
    if not settings:
        raise HTTPException(status_code=404, detail="MFA not initialized")

    settings.enabled = False
    db.commit()
    return {"message": "MFA disabled"}


@router.get("/me")
def get_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    org = None
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "organization_id": user.organization_id,
        "organization_name": org.name if org else None,
        "is_super_admin": user.email == "admin@digisanduk",
        "is_org_admin": org.admin_user_id == user.id if org else False,
        "org_admin_user_id": org.admin_user_id if org else None
    }


@router.put("/me")
def update_profile(
    payload: ProfileUpdatePayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing and existing.id != user.id:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.password:
        if not payload.current_password or not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.password_hash = hash_password(payload.password)

    db.commit()
    return {"message": "Profile updated"}


@router.post("/assign-role")
def assign_role(
    payload: RoleAssignPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    admin = db.query(User).filter(User.id == int(user_id)).first()
    if not admin or admin.email != "admin@digisanduk":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    user = db.query(User).filter(User.email == payload.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if not role:
        role = Role(name=payload.role_name, description="Custom role")
        db.add(role)
        db.commit()
        db.refresh(role)

    assignment = db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.role_id == role.id
    ).first()
    if assignment:
        return {"message": "Role already assigned"}

    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.commit()
    return {"message": "Role assigned"}
