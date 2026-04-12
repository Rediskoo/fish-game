import os
from bot_logic import build_application


def main():
    token = os.getenv("BOT_TOKEN", "ТВОЙ_ТОКЕН")
    if token == "ТВОЙ_ТОКЕН":
        raise RuntimeError("Set BOT_TOKEN env variable before running bot.py")

    app = build_application(token)
    app.run_polling()


if __name__ == "__main__":
    main()
