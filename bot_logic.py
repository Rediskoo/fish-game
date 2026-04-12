import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

WEBAPP_URL = "https://fish-game-delta.vercel.app/"
FISH_PRICE = 10

users = {}


def get_user(user_id: int):
    if user_id not in users:
        users[user_id] = {
            "coins": 0,
            "algae": 0,
            "fishes": [{"name": "Fish1", "age": 1, "type": "common"}],
        }
    return users[user_id]


def profile_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("🏪 Магазин", callback_data="shop")],
            [InlineKeyboardButton("🐟 Мои рыбки", callback_data="my_fish")],
            [InlineKeyboardButton("🍎 Купить корм", callback_data="buy_food")],
        ]
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    get_user(update.effective_user.id)
    await update.message.reply_text(
        f"🐟 Привет, {update.effective_user.first_name}!\nДобро пожаловать в твой аквариум.",
        reply_markup=InlineKeyboardMarkup(
            [
                [InlineKeyboardButton("🎮 Открыть аквариум", web_app=WebAppInfo(WEBAPP_URL))],
                [InlineKeyboardButton("👤 Профиль", callback_data="profile")],
            ]
        ),
    )


async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)
    text = (
        "👤 Профиль\n"
        f"💰 coins: {user['coins']}\n"
        f"🌿 algae: {user['algae']}\n"
        f"🐟 fishes: {len(user['fishes'])}"
    )
    await q.message.edit_text(text, reply_markup=profile_keyboard())


async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)
    keyboard = InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("🐟 Купить рыбу (10 coins)", callback_data="buy_fish")],
            [InlineKeyboardButton("⬅️ Назад", callback_data="profile")],
        ]
    )
    await q.message.edit_text(f"🏪 Магазин\n💰 coins: {user['coins']}", reply_markup=keyboard)


async def my_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)
    fish_names = ", ".join([fish["name"] for fish in user["fishes"]]) or "-"
    await q.message.edit_text(
        f"🐟 Твои рыбки ({len(user['fishes'])}):\n{fish_names}",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Назад", callback_data="profile")]]),
    )


async def buy_food(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer("Функция корма пока в разработке", show_alert=True)


async def buy_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)
    if user["coins"] < FISH_PRICE:
        await q.answer("Нет coins ❌", show_alert=True)
        return
    user["coins"] -= FISH_PRICE
    user["fishes"].append({"name": "NewFish", "age": 1, "type": "common"})
    await q.answer("Рыба куплена 🐟")
    await profile(update, context)


async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)
    try:
        data = json.loads(update.message.web_app_data.data)
    except (TypeError, json.JSONDecodeError):
        await update.message.reply_text("Не понял данные от WebApp.")
        return

    if data.get("action") == "collect_algae":
        amount = int(data.get("amount", 0))
        if amount <= 0:
            return
        user["algae"] += amount
        coins = amount // 10
        user["coins"] += coins
        await update.message.reply_text(
            f"🌿 Ты собрал {amount} водорослей!\n💰 Получено {coins} coins"
        )


async def buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if q.data == "profile":
        await profile(update, context)
    elif q.data == "shop":
        await shop(update, context)
    elif q.data == "buy_fish":
        await buy_fish(update, context)
    elif q.data == "my_fish":
        await my_fish(update, context)
    elif q.data == "buy_food":
        await buy_food(update, context)


def build_application(token: str):
    application = ApplicationBuilder().token(token).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(buttons))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data))
    return application
