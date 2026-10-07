from decimal import Decimal
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import Claim, DisruptionEvent, Payout, Policy, User


def zone_matches(worker_zone: str, affected_zones: list[str]) -> bool:
    return worker_zone.strip().lower() in {z.strip().lower() for z in affected_zones}


def evaluate_claim(policy: Policy, event: DisruptionEvent, worker: User, db: Session):
    # Prevent duplicate claims for the same worker and event.
    existing = db.scalar(
        select(Claim).where(
            Claim.worker_id == worker.id,
            Claim.event_id == event.id,
            Claim.policy_id == policy.id,
        )
    )
    if existing:
        return None

    affected = [z.strip() for z in event.affected_zones.split(",") if z.strip()]
    if policy.status != "active":
        return None
    if policy.event_type != event.event_type:
        return None
    if not zone_matches(worker.zone, affected):
        return None
    if Decimal(event.reading) < Decimal(policy.trigger_threshold):
        return None

    # Simple educational fraud score. A real system would use a dedicated model/rules engine.
    fraud_score = 5
    fraud_reason = "Low-risk automated parametric claim"

    if event.source.lower() == "manual admin":
        fraud_score = 10
        fraud_reason = "Event was manually entered by an administrator"

    claim = Claim(
        worker_id=worker.id,
        policy_id=policy.id,
        event_id=event.id,
        status="approved",
        fraud_score=fraud_score,
        fraud_reason=fraud_reason,
        payout_amount=policy.payout_amount,
        auto_processed=True,
    )
    db.add(claim)
    db.flush()

    payout = Payout(
        claim_id=claim.id,
        amount=policy.payout_amount,
        status="processed",
        transaction_reference=f"INS-{uuid.uuid4().hex[:12].upper()}",
    )
    db.add(payout)
    db.flush()
    return claim


def auto_create_claims(event: DisruptionEvent, db: Session):
    zones = [z.strip() for z in event.affected_zones.split(",") if z.strip()]
    workers = db.scalars(
        select(User).where(User.role == "worker", User.is_active == True)
    ).all()

    created = []
    for worker in workers:
        if not zone_matches(worker.zone, zones):
            continue

        policies = db.scalars(
            select(Policy).where(
                Policy.worker_id == worker.id,
                Policy.status == "active",
                Policy.event_type == event.event_type,
            )
        ).all()

        for policy in policies:
            claim = evaluate_claim(policy, event, worker, db)
            if claim:
                created.append(claim)

    db.commit()
    return created
