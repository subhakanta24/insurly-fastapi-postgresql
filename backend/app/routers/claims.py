from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Claim, User
from ..schemas import ClaimOut
from ..security import get_current_user

router = APIRouter(prefix="/api/claims", tags=["Claims"])


def to_output(claim: Claim):
    return ClaimOut(
        id=claim.id,
        worker_id=claim.worker_id,
        worker_name=claim.worker.name,
        policy_number=claim.policy.policy_number,
        event_type=claim.event.event_type,
        status=claim.status,
        fraud_score=claim.fraud_score,
        fraud_reason=claim.fraud_reason,
        payout_amount=claim.payout_amount,
        auto_processed=claim.auto_processed,
        created_at=claim.created_at,
        payout=claim.payout,
    )


@router.get("", response_model=list[ClaimOut])
def list_claims(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = (
        select(Claim)
        .options(
            joinedload(Claim.worker),
            joinedload(Claim.policy),
            joinedload(Claim.event),
            joinedload(Claim.payout),
        )
        .order_by(Claim.id.desc())
    )

    if user.role != "admin":
        query = query.where(Claim.worker_id == user.id)

    return [to_output(c) for c in db.scalars(query).unique().all()]
