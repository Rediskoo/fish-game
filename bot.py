from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import json

TOKEN = "8738925055:AAFb_S_H1VAyfirpW3n6WW3INXV2TYdbR_o"

# хранение монет (пока в памяти)
user_coins = {}

# -------------------
# /start
# -------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton(
                "🐟 Играть",
                web_app=WebAppInfo(url="https://fish-game-delta.vercel.app/")
            )
        ]
    ]

    await update.message.reply_text(
        "Открой игру:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
# ПРИЁМ ДАННЫХ ИЗ MINI APP
# -------------------
async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = json.loads(update.message.web_app_data.data)

    user_id = update.message.from_user.id

    if data["type"] == "add_coin":
        user_coins[user_id] = user_coins.get(user_id, 0) + data["amount"]

        await update.message.reply_text(
            f"💰 Твои монеты: {user_coins[user_id]}"
        )

# -------------------
# ЗАПУСК
# -------------------
app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))

app.add_handler(
    MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data)
)

app.run_polling()