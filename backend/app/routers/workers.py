from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserOut
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/workers", tags=["Workers"])


@router.get("", response_model=list[UserOut])
def list_workers(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.scalars(select(User).where(User.role == "worker").order_by(User.id.desc())).all()


@router.get("/me", response_model=UserOut)
def worker_me(user: User = Depends(get_current_user)):
    return user
