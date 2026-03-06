import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from .models.organization import Organization
from .models.user import User
from .models.role import Role
from .models.user_role import UserRole
from .models.mfa import MFASettings
from .models.tag import Tag
from .models.data_tag import DataTag
from .models.incident import Incident
from .models.incident_comment import IncidentComment
from .models.threat_feed import ThreatFeed
from .models.threat_intel_item import ThreatIntelItem
from .models.integration import Integration
from .models.privacy_setting import PrivacySetting
from .models.playbook import Playbook
from .models.notification import Notification
from .models.marketplace_item import MarketplaceItem
from .models.compliance_policy import CompliancePolicy
from .models.training_resource import TrainingResource
from .models.data_request import DataRequest
from .models.share_connection import ShareConnection
from .auth.security import hash_password
from .auth.routes import router as auth_router
from .auth.dependencies import get_current_user
from app.org.routes import router as org_router
from app.data.routes import router as data_router
from app.incidents.routes import router as incident_router
from app.threat.routes import router as threat_router
from app.integrations.routes import router as integration_router
from app.analytics.routes import router as analytics_router
from app.privacy.routes import router as privacy_router
from app.automation.routes import router as automation_router
from app.monitoring.routes import router as monitoring_router
from app.visualization.routes import router as visualization_router
from app.compliance.routes import router as compliance_router
from app.training.routes import router as training_router
from app.marketplace.routes import router as marketplace_router
from app.admin.routes import router as admin_router
from app.dashboard.routes import router as dashboard_router
from app.audit.routes import router as audit_router


app = FastAPI(
    title="Secure Data Sharing Platform",
    version="1.0.0"
)

# Allow custom origins via env; fall back to permissive wildcard to enable LAN access
raw_origins = os.getenv("FRONTEND_ORIGINS", "")
default_origins = ["*"]
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()] or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def ensure_admin_user():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@digisanduk").first()
        if not admin:
            admin = User(
                email="admin@digisanduk",
                password_hash=hash_password("digisanduk")
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        role = db.query(Role).filter(Role.name == "admin").first()
        if not role:
            role = Role(name="admin", description="Platform administrator")
            db.add(role)
            db.commit()
            db.refresh(role)

        assignment = db.query(UserRole).filter(
            UserRole.user_id == admin.id,
            UserRole.role_id == role.id
        ).first()
        if not assignment:
            db.add(UserRole(user_id=admin.id, role_id=role.id))
            db.commit()
    finally:
        db.close()

app.include_router(auth_router)
app.include_router(org_router)
app.include_router(data_router)
app.include_router(incident_router)
app.include_router(threat_router)
app.include_router(integration_router)
app.include_router(analytics_router)
app.include_router(privacy_router)
app.include_router(automation_router)
app.include_router(monitoring_router)
app.include_router(visualization_router)
app.include_router(compliance_router)
app.include_router(training_router)
app.include_router(marketplace_router)
app.include_router(admin_router)
app.include_router(dashboard_router)
app.include_router(audit_router)

@app.on_event("startup")
def startup_tasks():
    ensure_admin_user()

@app.get("/")
def root():
    return {"message": "Secure Data Sharing API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/protected")
def protected(user_id: str = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user_id": user_id
    }
