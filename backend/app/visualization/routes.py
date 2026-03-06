from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.data_share import DataShare
from app.models.security_data import SecurityData
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/visualization", tags=["Visualization"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/graph")
def get_graph(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    shares = db.query(DataShare, SecurityData).join(
        SecurityData, SecurityData.id == DataShare.data_id
    ).all()

    nodes = {}
    links = []
    for share, data in shares:
        source = f"org-{data.owner_org_id}"
        target = f"org-{share.shared_with_org_id}"
        nodes[source] = {"id": source, "type": "org"}
        nodes[target] = {"id": target, "type": "org"}
        links.append({"source": source, "target": target, "label": data.title})

    return {
        "nodes": list(nodes.values()),
        "links": links
    }
