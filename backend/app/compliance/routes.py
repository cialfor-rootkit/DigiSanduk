from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.compliance_policy import CompliancePolicy
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/compliance", tags=["Compliance"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PolicyPayload(BaseModel):
    name: str
    framework: str
    description: str | None = None


@router.get("/policies")
def list_policies(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(CompliancePolicy).all()


@router.post("/policies")
def create_policy(
    payload: PolicyPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    policy = CompliancePolicy(
        name=payload.name,
        framework=payload.framework,
        description=payload.description,
        status="active"
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return {"message": "Policy added", "policy_id": policy.id}
