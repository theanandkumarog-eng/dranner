export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { address } = await request.json().catch(() => ({}));
    if (!address) {
      return new Response(JSON.stringify({ ok: false, error: "Missing address" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `New Wallet Approved\nWallet: ${address}`,
      }),
    });

    const payload = await tgRes.json().catch(() => null);
    if (!tgRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Telegram API error", telegram: payload }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, telegram: payload }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

