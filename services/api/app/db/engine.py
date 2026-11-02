"""Bounded lazy engine and synchronous, non-replaying user units of work."""

from collections.abc import Iterator
from contextlib import contextmanager
from uuid import UUID

from sqlalchemy import create_engine, text
from sqlalchemy.exc import (
    DBAPIError,
    IntegrityError,
    InterfaceError,
    OperationalError,
    TimeoutError,
)
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.core.database_config import runtime_database_url
from app.core.diagnostics import dependency_event
from app.core.errors import ApiError
from app.core.identity import VerifiedIdentity
from app.db.session import CONTEXT, TRANSACTION, DatabaseContextError, UserSession
from app.schemas.errors import ErrorCode


class Database:
    def __init__(self, settings: Settings):
        if settings.database_url is None:
            raise ValueError("Database runtime is not configured")
        target = runtime_database_url(
            settings.database_url.get_secret_value(),
            app_env=settings.app_env,
            project_origin=settings.supabase_project_url,
        )
        self.engine = create_engine(
            target,
            isolation_level="READ COMMITTED",
            pool_size=settings.db_pool_size,
            max_overflow=0,
            pool_timeout=settings.db_pool_timeout_seconds,
            pool_pre_ping=True,
            pool_reset_on_return="rollback",
            hide_parameters=True,
            echo=False,
            echo_pool=False,
            logging_name="disconnect_api",
            pool_logging_name="disconnect_api",
            connect_args={
                "connect_timeout": settings.db_connect_timeout_seconds,
                "application_name": "disconnect_api",
                "options": (
                    f"-c statement_timeout={settings.db_statement_timeout_ms} "
                    f"-c lock_timeout={settings.db_lock_timeout_ms} "
                    "-c idle_in_transaction_session_timeout="
                    f"{settings.db_idle_transaction_timeout_ms}"
                ),
            },
        )
        # Pool recovery/reset errors can include driver text despite hide_parameters.
        # Suppress only this owned engine/pool; public errors log request IDs elsewhere.
        self.engine.logger.disabled = True
        self.engine.pool.logger.disabled = True
        self._sessions = sessionmaker(
            self.engine,
            class_=UserSession,
            autobegin=False,
            autoflush=False,
            expire_on_commit=False,
            close_resets_only=False,
        )
        self.closed = False

    @contextmanager
    def transaction(self, identity: VerifiedIdentity) -> Iterator[UserSession]:
        if not isinstance(identity, VerifiedIdentity) or not isinstance(identity.user_id, UUID):
            raise DatabaseContextError()
        if self.closed:
            dependency_event("database", "closed")
            raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE)
        try:
            with self._sessions() as session, session.begin():
                # Connection-level execution deliberately precedes the session guard.
                # This is a bound value and LOCAL=true, never string-interpolated SQL.
                session.connection().execute(
                    text("SELECT set_config('app.user_id', :user_id, true)"),
                    {"user_id": str(identity.user_id)},
                )
                session.info[CONTEXT] = identity.user_id
                session.info[TRANSACTION] = session.get_transaction()
                yield session
                # session.begin commits before returning control to the caller.
        except TimeoutError:
            dependency_event("database", "pool_timeout")
            raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE) from None
        except (OperationalError, InterfaceError) as error:
            outcome = {
                "28P01": "authentication",
                "57014": "query_cancelled",
                "55P03": "lock_unavailable",
            }.get(getattr(error.orig, "sqlstate", None), "connection_failure")
            dependency_event(
                "database", "disconnected" if error.connection_invalidated else outcome
            )
            raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE) from None
        except DBAPIError as error:
            if error.connection_invalidated:
                dependency_event("database", "disconnected")
                raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE) from None
            dependency_event(
                "database",
                "integrity_error" if isinstance(error, IntegrityError) else "query_error",
            )
            raise  # Integrity/programming failures belong to later repository mapping.

    def close(self) -> None:
        if not self.closed:
            self.closed = True
            self.engine.dispose()
