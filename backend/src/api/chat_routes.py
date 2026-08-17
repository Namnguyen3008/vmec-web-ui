"""
FastAPI Chat Router for Stateful Multi-Turn Conversational Clinical Agent.
Endpoints:
- POST /api/chat/message : Send patient message and process 1 turn.
- GET /api/chat/session/{session_id} : Retrieve current session state.
- DELETE /api/chat/session/{session_id} : Reset or delete session.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from src.agents.executor import get_agent_executor
from src.repositories.session_repository import get_session_repository

logger = logging.getLogger("vmec.api.chat")
router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessageRequest(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    sessionId: str | None = Field(
        default=None, validation_alias=AliasChoices("sessionId", "session_id")
    )
    userId: str | None = Field(
        default=None, validation_alias=AliasChoices("userId", "user_id")
    )
    content: str | None = Field(
        default=None,
        validation_alias=AliasChoices("content", "user_message", "message"),
    )

    @property
    def clean_session_id(self) -> str:
        return self.sessionId or "default_session"

    @property
    def clean_user_id(self) -> str:
        return self.userId or "anonymous_patient"

    @property
    def clean_content(self) -> str:
        return (self.content or "").strip()


@router.post("/message", status_code=status.HTTP_200_OK)
async def send_chat_message(payload: ChatMessageRequest) -> dict[str, Any]:
    if not payload.clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty",
        )

    executor = get_agent_executor()
    try:
        result = await executor.process_turn(
            session_id=payload.clean_session_id,
            user_id=payload.clean_user_id,
            user_message=payload.clean_content,
        )
        return {"success": True, "data": result}
    except Exception as ex:
        logger.exception("Error processing chat turn")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {ex}",
        ) from ex


@router.get("/session/{session_id}", status_code=status.HTTP_200_OK)
async def get_session(
    session_id: str,
    user_id: str = Query(default="anonymous_patient"),
) -> dict[str, Any]:
    repo = get_session_repository()
    session = await repo.get_session(session_id=session_id, user_id=user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' for user '{user_id}' not found",
        )
    return {"success": True, "data": session.model_dump()}


@router.delete("/session/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: str,
    user_id: str = Query(default="anonymous_patient"),
) -> dict[str, Any]:
    repo = get_session_repository()
    deleted = await repo.delete_session(session_id=session_id, user_id=user_id)
    return {"success": deleted, "session_id": session_id}
