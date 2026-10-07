import os

from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import User, Policy
from app.security import hash_password


def required_seed_value(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Set {name} in the environment before running the seed script.")
    return value


admin_email = required_seed_value("SEED_ADMIN_EMAIL")
admin_password = required_seed_value("SEED_ADMIN_PASSWORD")
worker_email = required_seed_value("SEED_WORKER_EMAIL")
worker_password = required_seed_value("SEED_WORKER_PASSWORD")

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == admin_email))
        if not admin:
            admin = User(
                name="Insurly Admin",
                email=admin_email,
                password_hash=hash_password(admin_password),
                role="admin",
                zone="HQ",
            )
            db.add(admin)

        worker = db.scalar(select(User).where(User.email == worker_email))
        if not worker:
            worker = User(
                name="Demo Worker",
                email=worker_email,
                password_hash=hash_password(worker_password),
                role="worker",
                zone="Patia",
            )
            db.add(worker)
            db.flush()

            db.add(
                Policy(
                    worker_id=worker.id,
                    policy_number="POL-DEMO-001",
                    event_type="heavy_rain",
                    trigger_threshold=15,
                    threshold_unit="mm/hr",
                    payout_amount=2500,
                    status="active",
                )
            )

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
