from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
import json

TOKEN = "ТВОЙ_ТОКЕН"

users = {}

WEBAPP_URL = "https://fish-game-delta.vercel.app/"

# -------------------
def get_user(user_id):
    if user_id not in users:
        users[user_id] = {
            "coins": 0,
            "food": 0,
            "fishes": []
        }
    return users[user_id]

# -------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🐟 Играть", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("🏪 Магазин", callback_data="shop")]
    ]

    await update.message.reply_text(
        "Добро пожаловать в аквариум 🐟",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
# МАГАЗИН
# -------------------
async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    keyboard = [
        [InlineKeyboardButton("🐟 Купить рыбку (10 coins)", callback_data="buy_fish")],
        [InlineKeyboardButton("🍎 Купить корм (5 coins = 10 еды)", callback_data="buy_food")],
        [InlineKeyboardButton("⬅️ Назад", callback_data="back")]
    ]

    await q.message.edit_text(
        f"🏪 Магазин\n💰 coins: {user['coins']}\n🍎 food: {user['food']}",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
# КУПИТЬ РЫБУ
# -------------------
async def buy_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    if user["coins"] < 10:
        await q.answer("Недостаточно coins ❌", show_alert=True)
        return

    user["coins"] -= 10
    user["fishes"].append({
        "name": f"Fish{len(user['fishes'])+1}",
        "age": 1
    })

    await q.answer("Рыбка куплена 🐟")
    await shop(update, context)

# -------------------
# КУПИТЬ ЕДУ
# -------------------
async def buy_food(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    if user["coins"] < 5:
        await q.answer("Нет coins ❌", show_alert=True)
        return

    user["coins"] -= 5
    user["food"] += 10

    await q.answer("Корм куплен 🍎")
    await shop(update, context)

# -------------------
# КОРМЛЕНИЕ
# -------------------
async def feed_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    keyboard = []

    for i, fish in enumerate(user["fishes"]):
        keyboard.append([
            InlineKeyboardButton(
                f"{fish['name']}",
                callback_data=f"feed_{i}"
            )
        ])

    await q.message.edit_text(
        "🐟 Выбери рыбу для кормления",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# -------------------
# ОБРАБОТКА КНОПОК
# -------------------
async def buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    data = q.data

    if data == "shop":
        await shop(update, context)

    elif data == "buy_fish":
        await buy_fish(update, context)

    elif data == "buy_food":
        await buy_food(update, context)

    elif data == "feed":
        await feed_menu(update, context)

    elif data.startswith("feed_"):
        idx = int(data.split("_")[1])

        if user["food"] <= 0:
            await q.answer("Нет еды ❌", show_alert=True)
            return

        user["food"] -= 1
        user["fishes"][idx]["age"] += 1

        await q.answer("Покормил 🐟")

# -------------------
app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(buttons))

app.run_polling()