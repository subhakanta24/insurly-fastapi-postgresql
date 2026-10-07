import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Policy, User
from ..schemas import PolicyCreate, PolicyOut
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.get("", response_model=list[PolicyOut])
def list_policies(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Policy).order_by(Policy.id.desc())
    if user.role != "admin":
        query = query.where(Policy.worker_id == user.id)
    return db.scalars(query).all()


@router.post("", response_model=PolicyOut)
def create_policy(
    payload: PolicyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    worker = db.get(User, payload.worker_id)
    if not worker or worker.role != "worker":
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = Policy(
        worker_id=payload.worker_id,
        policy_number=f"POL-{secrets.token_hex(4).upper()}",
        event_type=payload.event_type,
        trigger_threshold=payload.trigger_threshold,
        threshold_unit=payload.threshold_unit,
        payout_amount=payload.payout_amount,
        status=payload.status,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy
