from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.chat import ChatRecommendationRequest, ChatRecommendationResponse
from app.security.deps import get_current_user
from app.services.chat_recommendation_service import ChatRecommendationService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/recommendations", response_model=ChatRecommendationResponse)
async def chat_recommendations(
    payload: ChatRecommendationRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatRecommendationResponse:
    return await ChatRecommendationService().recommend_async(db=db, user=user, request=payload)
