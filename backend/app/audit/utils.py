from app.models.audit_log import AuditLog
from app.integrations.siem import send_siem_event


def log_action(db, action, user_id, org_id, target):
    log = AuditLog(
        action=action,
        actor_user_id=user_id,
        actor_org_id=org_id,
        target_resource=target
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        send_siem_event(
            db,
            {
                "event_type": "AUDIT_LOG",
                "action": action,
                "actor_user_id": user_id,
                "actor_org_id": org_id,
                "target": target,
                "timestamp": log.timestamp.isoformat()
            }
        )
    except Exception:
        # Never block app flow on SIEM issues
        pass

    return log
