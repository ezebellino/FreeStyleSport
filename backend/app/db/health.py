from collections.abc import Callable
from contextlib import AbstractAsyncContextManager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

SessionContext = Callable[[], AbstractAsyncContextManager[AsyncSession]]


class DatabaseReadinessProbe:
    def __init__(self, session_factory: SessionContext) -> None:
        self._session_factory = session_factory

    async def check(self) -> None:
        async with self._session_factory() as session:
            await session.execute(text("SELECT 1"))
