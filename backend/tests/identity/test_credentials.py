from datetime import UTC, datetime, timedelta

import pytest

from app.modules.identity.passwords import PasswordHasher
from app.modules.identity.sessions import SessionTokens, require_matching_csrf


def test_password_hash_roundtrip() -> None:
    hasher = PasswordHasher()

    password_hash = hasher.hash("correct horse battery staple")

    assert password_hash != "correct horse battery staple"
    assert hasher.verify("correct horse battery staple", password_hash) is True
    assert hasher.verify("wrong", password_hash) is False


def test_session_token_hash_is_stable_and_secret_is_not_stored() -> None:
    tokens = SessionTokens.issue(timedelta(days=7))

    assert tokens.raw_session_token != tokens.session_token_hash
    assert SessionTokens.hash(tokens.raw_session_token) == tokens.session_token_hash
    assert tokens.expires_at > datetime.now(UTC)


def test_csrf_requires_cookie_and_header_match() -> None:
    require_matching_csrf("same", "same")

    with pytest.raises(ValueError, match="CSRF"):
        require_matching_csrf("cookie", "header")