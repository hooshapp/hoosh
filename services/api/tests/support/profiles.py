"""Selective disposable profile snapshots and ephemeral owner headers."""

from tests.support import database
from tests.support.http import signed_headers


def snapshot(values, identities):
    with database.connect(values, "TEST_MIGRATION_DATABASE_URL") as admin:
        return admin.execute(
            "SELECT * FROM public.profiles WHERE user_id=ANY(%s) ORDER BY user_id",
            ([identity.user_id for identity in identities],),
        ).fetchall()


def headers(signer, identity, **claims):
    return signed_headers(signer, {"sub": str(identity.user_id), **claims})
