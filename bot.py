from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters
)
import json

TOKEN = "ТВОЙ_ТОКЕН"
WEBAPP_URL = "https://fish-game-delta.vercel.app/"

users = {}

# -------------------
def get_user(user_id):
    if user_id not in users:
        users[user_id] = {
            "coins": 0,
            "algae": 0,
            "fishes": [
                {"name": "Fish1", "age": 1, "type": "common"}
            ]
        }
    return users[user_id]

# -------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)

    keyboard = [
        [InlineKeyboardButton("🎮 Открыть аквариум", web_app=WebAppInfo(WEBAPP_URL))],
        [InlineKeyboardButton("👤 Профиль", callback_data="profile")],
        [InlineKeyboardButton("🏪 Магазин", callback_data="shop")]
    ]

    await update.message.reply_text(
        f"🐟 Привет, {update.effective_user.first_name}!\n"
        f"Добро пожаловать в аквариум.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()

    user = get_user(q.from_user.id)

    keyboard = [
        [InlineKeyboardButton("🏪 Магазин", callback_data="shop")],
        [InlineKeyboardButton("🐟 Мои рыбки", callback_data="my_fish")],
        [InlineKeyboardButton("⬅️ Назад", callback_data="start")]
    ]

    text = (
        f"👤 ПРОФИЛЬ\n\n"
        f"💰 coins: {user['coins']}\n"
        f"🌿 algae: {user['algae']}\n"
        f"🐟 fishes: {len(user['fishes'])}"
    )

    await q.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

# -------------------
async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()

    user = get_user(q.from_user.id)

    keyboard = [
        [InlineKeyboardButton("🐟 Купить рыбу (10 coins)", callback_data="buy_fish")],
        [InlineKeyboardButton("⬅️ Назад", callback_data="profile")]
    ]

    await q.message.edit_text(
        f"🏪 МАГАЗИН\n💰 coins: {user['coins']}",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
async def buy_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()

    user = get_user(q.from_user.id)

    if user["coins"] < 10:
        await q.answer("Недостаточно coins ❌", show_alert=True)
        return

    user["coins"] -= 10
    user["fishes"].append({
        "name": f"Fish{len(user['fishes'])+1}",
        "age": 1,
        "type": "common"
    })

    await shop(update, context)

# -------------------
async def buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()

    data = q.data
    user = get_user(q.from_user.id)

    print("CALLBACK:", data)

    if data == "profile":
        await profile(update, context)

    elif data == "shop":
        await shop(update, context)

    elif data == "buy_fish":
        await buy_fish(update, context)

    elif data == "start":
        await start(update, context)

    elif data == "my_fish":
        text = "🐟 ТВОИ РЫБКИ:\n\n"
        for f in user["fishes"]:
            text += f"{f['name']} — {f['age']} лет\n"

        await q.message.edit_text(text)

# -------------------
# WEBAPP DATA (ВАЖНО — ИСПРАВЛЕНО)
# -------------------
async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user = get_user(update.effective_user.id)

        data = json.loads(update.message.web_app_data.data)
        print("WEBAPP DATA:", data)

        if data["action"] == "collect_algae":
            amount = data["amount"]

            user["algae"] += amount
            coins = amount // 10
            user["coins"] += coins

            await update.message.reply_text(
                f"🌿 Собрано: {amount} водорослей\n"
                f"💰 Получено: {coins} coins"
            )

    except Exception as e:
        print("WEBAPP ERROR:", e)

# -------------------
app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(buttons))

# 🔥 ВАЖНО: правильный handler
app.add_handler(MessageHandler(filters.WEB_APP_DATA, webapp_data))

app.run_polling()