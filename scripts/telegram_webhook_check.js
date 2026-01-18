import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const maskToken = (token = "") => {
  if (!token) return "";
  const visible = token.slice(-6);
  return `***${visible}`;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const run = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const result = {
    ok: false,
    webhookInfo: null,
    webhookSet: null,
    errors: [],
    notes: [],
  };

  if (!token) {
    result.errors.push("TELEGRAM_BOT_TOKEN não informado.");
    return result;
  }

  const infoUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  const { response, data } = await fetchJson(infoUrl);
  result.webhookInfo = {
    httpStatus: response.status,
    url: data.result?.url || "",
    last_error_message: data.result?.last_error_message || "",
  };

  if (webhookUrl) {
    const setUrl = `https://api.telegram.org/bot${token}/setWebhook`;
    const { response: setResponse, data: setData } = await fetchJson(setUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    result.webhookSet = {
      httpStatus: setResponse.status,
      ok: Boolean(setData.ok),
      description: setData.description || "",
    };
  } else {
    result.notes.push("TELEGRAM_WEBHOOK_URL não informado; setWebhook não executado.");
  }

  result.ok = true;
  result.notes.push(`Token usado: ${maskToken(token)}`);
  return result;
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  run()
    .then((result) => fs.writeFile("diagnose_telegram_webhook.json", JSON.stringify(result, null, 2)))
    .then(() => {
      console.log("telegram_webhook_check concluído (saida em diagnose_telegram_webhook.json)");
    })
    .catch((error) => {
      console.error("Falha telegram_webhook_check:", error.message);
      process.exitCode = 1;
    });
}

export { run };
