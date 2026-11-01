import asyncio
import base64
import json

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.auth import SupabaseTokenVerifier, UnavailableTokenVerifier, bearer_token, signing_key
from app.core.errors import ApiError
from app.schemas.errors import ErrorCode
from tests.auth.support import NOW, USER_A, USER_B, FixedResolver, LocalSigner, settings


@pytest.fixture(scope="module", params=["ES256", "RS256"])
def signer(request):
    return LocalSigner(request.param)


def verify(signer, token, *, now=NOW, resolver=None, config=None):
    verifier = SupabaseTokenVerifier(
        config or settings(), resolver or FixedResolver(signer.key), clock=lambda: now
    )
    return asyncio.run(verifier.verify(token))


def assert_failure(signer, token, code=ErrorCode.INVALID_TOKEN, **kwargs):
    with pytest.raises(ApiError) as error:
        verify(signer, token, **kwargs)
    assert error.value.code == code


def test_valid_signed_identity_and_immutable_result(signer):
    identity = verify(signer, signer.token())
    assert identity.user_id == USER_A
    assert identity.email == "student@example.invalid"
    with pytest.raises(AttributeError):
        identity.email = "another@example.invalid"


def test_two_identities_null_email_metadata_and_canonical_uuid(signer):
    identity = verify(
        signer,
        signer.token(
            {
                "sub": str(USER_B).upper(),
                "email": None,
                "user_metadata": {"role": "service_role", "user_id": str(USER_A)},
            }
        ),
    )
    assert identity.user_id == USER_B
    assert identity.email is None
    assert verify(signer, signer.token(omit=["email"])).email is None


@pytest.mark.parametrize("claim", ["exp", "iat", "sub", "iss", "aud", "role", "is_anonymous"])
def test_required_claims(signer, claim):
    assert_failure(signer, signer.token(omit=[claim]))


@pytest.mark.parametrize(
    "claims",
    [
        {"iss": "https://wrong.supabase.co/auth/v1"},
        {"aud": "anon"},
        {"aud": ["authenticated"]},
        {"sub": "not-a-user-uuid"},
        {"sub": 123},
        {"role": "service_role"},
        {"role": "anon"},
        {"role": "admin"},
        {"is_anonymous": "false"},
        {"is_anonymous": 0},
        {"email": 123},
        {"exp": "1800003600"},
        {"exp": True},
        {"exp": None},
        {"exp": -1},
        {"exp": 10**30},
        {"iat": False},
        {"iat": NOW + 31},
        {"nbf": NOW + 31},
        {"nbf": "1800000000"},
        {"nbf": None},
        {"nbf": NOW + 3600},
        {"exp": NOW - 100, "iat": NOW},
    ],
)
def test_invalid_claims(signer, claims):
    assert_failure(signer, signer.token(claims))


def test_verified_anonymous_is_forbidden_but_not_a_public_api_key(signer):
    assert_failure(signer, signer.token({"is_anonymous": True}), ErrorCode.FORBIDDEN)
    assert_failure(signer, signer.token({"sub": "supabase", "role": "anon"}))


def test_expiration_only_after_signature_and_other_trust_checks(signer):
    token = signer.token({"exp": NOW - 31, "iat": NOW - 3600})
    assert_failure(signer, token, ErrorCode.TOKEN_EXPIRED)
    wrong_signer = LocalSigner(signer.algorithm)
    assert_failure(signer, wrong_signer.token({"exp": NOW - 31, "iat": NOW - 3600}))
    assert_failure(signer, signer.token({"exp": NOW - 31, "iat": NOW - 3600, "aud": "wrong"}))
    assert_failure(signer, signer.token({"exp": NOW - 31, "iat": NOW - 3600, "role": "anon"}))


def test_clock_skew_and_fractional_numeric_dates(signer):
    assert verify(signer, signer.token({"iat": NOW + 30, "nbf": NOW + 30})).user_id == USER_A
    assert verify(signer, signer.token({"exp": NOW - 29.5})).user_id == USER_A
    assert_failure(signer, signer.token({"exp": NOW - 30}), ErrorCode.TOKEN_EXPIRED)
    assert_failure(signer, signer.token({"iat": float("nan")}))


@pytest.mark.parametrize(
    "headers",
    [
        {"kid": ""},
        {"kid": "a" * 129},
        {"kid": "bad key"},
        {"jku": "https://attacker.invalid/jwks"},
        {"x5u": "https://attacker.invalid/cert"},
        {"jwk": {}},
        {"x5c": []},
        {"crit": []},
        {"crit": ["extension"]},
        {"b64": True},
        {"typ": "API_KEY"},
    ],
)
def test_bad_headers_fail_before_key_resolution(signer, headers):
    resolver = FixedResolver(signer.key)
    token = signer.token(headers=headers)
    if "b64" in headers:
        # PyJWT removes an explicit b64=True while encoding. Insert it directly
        # to exercise our pre-resolution JOSE policy rather than the encoder.
        header, payload, signature = token.split(".")
        obj = json.loads(base64.urlsafe_b64decode(header + "=" * (-len(header) % 4)))
        token = b64(json.dumps({**obj, **headers}).encode()) + "." + payload + "." + signature
    assert_failure(signer, token, resolver=resolver)
    assert not resolver.calls


def b64(data):
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


@pytest.mark.parametrize(
    "token",
    ["", "opaque", "a.b.c", "a..b", "a.b.c.d", "a" * 16385, "é.b.c", "e30.e30.", "e30=.e30.AA"],
)
def test_malformed_token_fails_without_network(signer, token):
    resolver = FixedResolver(signer.key)
    assert_failure(signer, token, resolver=resolver)
    assert not resolver.calls


def test_algorithm_confusion_none_missing_kid_and_duplicate_json_members(signer):
    resolver = FixedResolver(signer.key)
    tokens = [
        jwt.encode(
            {"sub": str(USER_A)},
            "symmetric-test-key" * 3,
            algorithm="HS256",
            headers={"kid": signer.kid},
        ),
        jwt.encode({}, key="", algorithm="none", headers={"kid": signer.kid}),
        jwt.encode({}, signer.private, algorithm=signer.algorithm),
        b64(b'{"alg":"ES256","alg":"RS256","kid":"local-key-a"}') + ".e30.AA",
        b64(json.dumps({"alg": signer.algorithm, "kid": signer.kid}).encode())
        + "."
        + b64(b'{"sub":"a","sub":"b"}')
        + ".AA",
    ]
    for token in tokens:
        assert_failure(signer, token, resolver=resolver)
    assert not resolver.calls


def test_configured_algorithm_and_resolver_binding_are_enforced(signer):
    other = "RS256" if signer.algorithm == "ES256" else "ES256"
    assert_failure(signer, signer.token(), config=settings(supabase_jwt_algorithms=[other]))
    wrong_id = LocalSigner(signer.algorithm, kid="other-kid")
    assert_failure(signer, signer.token(), resolver=FixedResolver(wrong_id.key))


@pytest.mark.parametrize(
    "change",
    [
        {"use": "enc"},
        {"key_ops": ["sign"]},
        {"key_ops": ["verify", "encrypt"]},
        {"d": "private-material"},
        {"k": "symmetric-secret"},
        {"alg": "HS256"},
        {"kid": None},
    ],
)
def test_incompatible_or_private_jwk_is_rejected(signer, change):
    with pytest.raises(ValueError):
        signing_key({**signer.jwk, **change}, [signer.algorithm])


def test_wrong_curve_and_weak_rsa_rejected():
    signer = LocalSigner()
    with pytest.raises(ValueError):
        signing_key({**signer.jwk, "crv": "P-384"}, ["ES256"])
    weak = rsa.generate_private_key(public_exponent=65537, key_size=1024)
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(weak.public_key()))
    with pytest.raises(ValueError):
        signing_key({**jwk, "alg": "RS256", "kid": "weak"}, ["RS256"])


@pytest.mark.parametrize("value", [None, "", "Basic secret", "Bearer", "Bearer a b", "Bearer\ta"])
def test_invalid_bearer_syntax(value):
    with pytest.raises(ApiError) as error:
        bearer_token(value)
    assert error.value.code == ErrorCode.AUTH_REQUIRED


def test_case_insensitive_scheme_and_unavailable_provider_fail_closed():
    assert bearer_token("bEaReR  opaque") == "opaque"
    with pytest.raises(ApiError) as error:
        asyncio.run(UnavailableTokenVerifier().verify("any-token"))
    assert error.value.code == ErrorCode.AUTH_UNAVAILABLE
