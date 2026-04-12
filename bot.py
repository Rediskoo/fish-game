<<<<<<< ours
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters
import json

TOKEN = "ТВОЙ_ТОКЕН"
=======
﻿from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters
import json

TOKEN = "РўР’РћР™_РўРћРљР•Рќ"
>>>>>>> theirs
WEBAPP_URL = "https://fish-game-delta.vercel.app/"
FISH_PRICE = 10

users = {}


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
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


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    get_user(update.effective_user.id)

    await update.message.reply_text(
<<<<<<< ours
        f"🐟 Привет, {update.effective_user.first_name}!\n"
        f"Добро пожаловать в твой аквариум.",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 Открыть аквариум", web_app=WebAppInfo(WEBAPP_URL))],
            [InlineKeyboardButton("👤 Профиль", callback_data="profile")]
=======
        f"рџђџ РџСЂРёРІРµС‚, {update.effective_user.first_name}!\n"
        f"Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ С‚РІРѕР№ Р°РєРІР°СЂРёСѓРј.",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("рџЋ® РћС‚РєСЂС‹С‚СЊ Р°РєРІР°СЂРёСѓРј", web_app=WebAppInfo(WEBAPP_URL))],
            [InlineKeyboardButton("рџ‘¤ РџСЂРѕС„РёР»СЊ", callback_data="profile")]
>>>>>>> theirs
        ])
    )


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    keyboard = [
<<<<<<< ours
        [InlineKeyboardButton("🏪 Магазин", callback_data="shop")],
        [InlineKeyboardButton("🐟 Мои рыбки", callback_data="my_fish")],
        [InlineKeyboardButton("🍎 Купить корм", callback_data="buy_food")]
    ]

    text = (
        f"👤 Профиль\n"
        f"💰 coins: {user['coins']}\n"
        f"🌿 algae: {user['algae']}\n"
        f"🐟 fishes: {len(user['fishes'])}"
=======
        [InlineKeyboardButton("рџЏЄ РњР°РіР°Р·РёРЅ", callback_data="shop")],
        [InlineKeyboardButton("рџђџ РњРѕРё СЂС‹Р±РєРё", callback_data="my_fish")],
        [InlineKeyboardButton("рџЌЋ РљСѓРїРёС‚СЊ РєРѕСЂРј", callback_data="buy_food")]
    ]

    text = (
        f"рџ‘¤ РџСЂРѕС„РёР»СЊ\n"
        f"рџ’° coins: {user['coins']}\n"
        f"рџЊї algae: {user['algae']}\n"
        f"рџђџ fishes: {len(user['fishes'])}"
>>>>>>> theirs
    )

    await q.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard))


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    keyboard = [
<<<<<<< ours
        [InlineKeyboardButton("🐟 Купить рыбу (10 coins)", callback_data="buy_fish")],
        [InlineKeyboardButton("⬅️ Назад", callback_data="profile")]
    ]

    await q.message.edit_text(
        f"🏪 Магазин\n💰 coins: {user['coins']}",
=======
        [InlineKeyboardButton("рџђџ РљСѓРїРёС‚СЊ СЂС‹Р±Сѓ (10 coins)", callback_data="buy_fish")],
        [InlineKeyboardButton("в¬…пёЏ РќР°Р·Р°Рґ", callback_data="profile")]
    ]

    await q.message.edit_text(
        f"рџЏЄ РњР°РіР°Р·РёРЅ\nрџ’° coins: {user['coins']}",
>>>>>>> theirs
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
async def buy_fish(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    user = get_user(q.from_user.id)

    if user["coins"] < FISH_PRICE:
<<<<<<< ours
        await q.answer("Нет coins ❌", show_alert=True)
=======
        await q.answer("РќРµС‚ coins вќЊ", show_alert=True)
>>>>>>> theirs
        return

    user["coins"] -= FISH_PRICE
    user["fishes"].append({"name": "NewFish", "age": 1, "type": "common"})

<<<<<<< ours
    await q.answer("Рыба куплена 🐟")
    await profile(update, context)


=======
    await q.answer("Р С‹Р±Р° РєСѓРїР»РµРЅР° рџђџ")
    await profile(update, context)


# -------------------
>>>>>>> theirs
async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = get_user(update.effective_user.id)

    try:
        data = json.loads(update.message.web_app_data.data)
    except (TypeError, json.JSONDecodeError):
<<<<<<< ours
        await update.message.reply_text("Не понял данные от WebApp.")
=======
        await update.message.reply_text("РќРµ РїРѕРЅСЏР» РґР°РЅРЅС‹Рµ РѕС‚ WebApp.")
>>>>>>> theirs
        return

    if data.get("action") == "collect_algae":
        amount = int(data.get("amount", 0))
        if amount <= 0:
            return

        user["algae"] += amount
        coins = amount // 10
        user["coins"] += coins

        await update.message.reply_text(
<<<<<<< ours
            f"🌿 Ты собрал {amount} водорослей!\n"
            f"💰 Получено {coins} coins"
        )


=======
            f"рџЊї РўС‹ СЃРѕР±СЂР°Р» {amount} РІРѕРґРѕСЂРѕСЃР»РµР№!\n"
            f"рџ’° РџРѕР»СѓС‡РµРЅРѕ {coins} coins"
        )


# -------------------
>>>>>>> theirs
async def buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()

    if q.data == "profile":
        await profile(update, context)

    elif q.data == "shop":
        await shop(update, context)

    elif q.data == "buy_fish":
        await buy_fish(update, context)


<<<<<<< ours
=======
# -------------------
>>>>>>> theirs
app = ApplicationBuilder().token(TOKEN).build()

app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(buttons))
app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data))

app.run_polling()
