from fastapi import APIRouter

from app.schemas.common import HealthResponse, VersionResponse

router = APIRouter(tags=['health'])


@router.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status='ok')


@router.get('/version', response_model=VersionResponse)
def version() -> VersionResponse:
    return VersionResponse(version='0.1.0', app='rampready-api')
