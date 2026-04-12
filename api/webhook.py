import os
from fastapi import FastAPI, Request, HTTPException
from telegram import Update
from bot_logic import build_application

TOKEN = os.getenv("BOT_TOKEN", "")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

if not TOKEN:
    raise RuntimeError("BOT_TOKEN env var is required for webhook mode")

telegram_app = build_application(TOKEN)
app = FastAPI()


@app.on_event("startup")
async def on_startup():
    await telegram_app.initialize()
    await telegram_app.start()


@app.on_event("shutdown")
async def on_shutdown():
    await telegram_app.stop()
    await telegram_app.shutdown()


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.post("/api/telegram/{secret}")
async def telegram_webhook(secret: str, request: Request):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    payload = await request.json()
    update = Update.de_json(payload, telegram_app.bot)
    if update is not None:
        await telegram_app.process_update(update)
    return {"ok": True}
