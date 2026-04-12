from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters
import json

TOKEN = "ТВОЙ_ТОКЕН"
WEBAPP_URL = "https://fish-game-delta.vercel.app/"

users = {}

def get_user(user_id):
    if user_id not in users:
        users[user_id] = {
            "coins": 0,
            "algae": 0,
            "fishes": []
        }
    return users[user_id]

# ---------------- START ----------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.message.from_user.id)

    keyboard = [
        [InlineKeyboardButton("🐟 Играть", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("👤 Профиль", callback_data="profile")]
    ]

    await update.message.reply_text(
        "🐟 Добро пожаловать в Аквариум!",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# ---------------- PROFILE ----------------
async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    keyboard = [
        [InlineKeyboardButton("🏪 Магазин", callback_data="shop")]
    ]

    await q.message.edit_text(
        f"👤 Профиль\n💰 coins: {user['coins']}\n🌿 algae: {user['algae']}",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# ---------------- SHOP ----------------
async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query

    keyboard = [
        [InlineKeyboardButton("🐟 Купить рыбу (10💰)", callback_data="buy_fish")],
        [InlineKeyboardButton("⬅️ Назад", callback_data="profile")]
    ]

    await q.message.edit_text(
        "🏪 Магазин",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# ---------------- BUY FISH ----------------
async def buy_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    if user["coins"] < 10:
        await q.answer("Не хватает coins ❌", show_alert=True)
        return

    user["coins"] -= 10
    user["fishes"].append({"name": f"Fish{len(user['fishes'])+1}"})

    await q.answer("Рыба куплена 🐟")
    await shop(update, context)

# ---------------- WEBAPP DATA ----------------
async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.message.from_user.id)

    data = json.loads(update.message.web_app_data.data)

    if data["action"] == "collect_algae":
        amount = data["amount"]

        user["algae"] += amount
        coins = amount // 10
        user["coins"] += coins

        await update.message.reply_text(
            f"🌿 Собрано: {amount}\n💰 +{coins} coins"
        )

# ---------------- CALLBACKS ----------------
async def buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query

    if q.data == "profile":
        await profile(update, context)

    elif q.data == "shop":
        await shop(update, context)

    elif q.data == "buy_fish":
        await buy_fish(update, context)

# ---------------- APP ----------------
app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(buttons))
app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data))

app.run_polling()