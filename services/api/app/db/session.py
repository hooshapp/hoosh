"""Guard accidental repository entry outside a verified-user transaction."""

from uuid import UUID

from sqlalchemy import event
from sqlalchemy.orm import Session

CONTEXT = "_disconnect_verified_user"
TRANSACTION = "_disconnect_verified_transaction"


class DatabaseContextError(RuntimeError):
    def __init__(self):
        super().__init__("A verified-user database transaction is required")


class UserSession(Session):
    """Only Database.transaction may establish this session's user authority."""

    def commit(self) -> None:
        # SessionTransaction (owned by the wrapper) performs the real finalization.
        raise DatabaseContextError()

    def rollback(self) -> None:
        raise DatabaseContextError()


def require_user_context(session: Session) -> UUID:
    transaction = session.get_transaction()
    user_id = session.info.get(CONTEXT)
    if (
        not isinstance(user_id, UUID)
        or transaction is None
        or not transaction.is_active
        or session.info.get(TRANSACTION) is not transaction
    ):
        raise DatabaseContextError()
    return user_id


@event.listens_for(UserSession, "do_orm_execute")
def guard_execution(state):
    require_user_context(state.session)


@event.listens_for(UserSession, "before_flush")
def guard_flush(session, context, instances):
    require_user_context(session)


@event.listens_for(UserSession, "before_commit")
def guard_commit(session):
    require_user_context(session)


@event.listens_for(UserSession, "after_transaction_end")
def clear_context(session, transaction):
    if transaction.parent is None:
        session.info.pop(CONTEXT, None)
        session.info.pop(TRANSACTION, None)
