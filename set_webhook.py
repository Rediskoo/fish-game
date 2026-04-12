import os
import json
import urllib.request


def main():
    token = os.getenv("BOT_TOKEN", "")
    base_url = os.getenv("PUBLIC_BASE_URL", "")
    secret = os.getenv("WEBHOOK_SECRET", "")

    if not token or not base_url:
        raise RuntimeError("Set BOT_TOKEN and PUBLIC_BASE_URL env vars")

    webhook_url = f"{base_url.rstrip('/')}/api/telegram/{secret}"
    api_url = f"https://api.telegram.org/bot{token}/setWebhook"

    req = urllib.request.Request(
        api_url,
        data=json.dumps({"url": webhook_url}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        print(body)


if __name__ == "__main__":
    main()
