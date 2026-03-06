from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from .dependencies import get_current_user


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_role(role_name: str):
    def checker(
        user_id: int = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role not found")

        assignment = db.query(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")

        return user

    return checker
