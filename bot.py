from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

TOKEN = "8738925055:AAFb_S_H1VAyfirpW3n6WW3INXV2TYdbR_o"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(
            "🐟 Играть",
            web_app=WebAppInfo(url="https://fish-game-delta.vercel.app/")
        )]
    ]

    await update.message.reply_text(
        "Открой игру:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

app = ApplicationBuilder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))

app.run_polling()