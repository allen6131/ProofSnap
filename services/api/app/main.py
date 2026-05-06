from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, auth, chat, health, profile, ramps, regions, source_debug

settings = get_settings()

app = FastAPI(title="rampready API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(regions.router)
app.include_router(ramps.router)
app.include_router(chat.router)
app.include_router(source_debug.router)
app.include_router(admin.router)
