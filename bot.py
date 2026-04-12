import os
from bot_logic import build_application


def main():
    token = os.getenv("BOT_TOKEN", "PUT_BOT_TOKEN_HERE")
    if token == "PUT_BOT_TOKEN_HERE":
        raise RuntimeError("Set BOT_TOKEN env variable before running bot.py")

    app = build_application(token)
    app.run_polling()


if __name__ == "__main__":
    main()
