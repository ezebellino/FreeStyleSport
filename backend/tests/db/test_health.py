from types import TracebackType

import pytest

from app.db.health import DatabaseReadinessProbe


class FakeSession:
    def __init__(self) -> None:
        self.statement: object | None = None

    async def execute(self, statement: object) -> None:
        self.statement = statement


class FakeSessionContext:
    def __init__(self, session: FakeSession) -> None:
        self.session = session

    async def __aenter__(self) -> FakeSession:
        return self.session

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        return None


def test_database_probe_executes_select_one() -> None:
    session = FakeSession()

    coroutine = DatabaseReadinessProbe(lambda: FakeSessionContext(session)).check()

    with pytest.raises(StopIteration):
        coroutine.send(None)

    assert str(session.statement) == "SELECT 1"
