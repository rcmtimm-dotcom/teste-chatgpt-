import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const telegramRequest = async (token, method, body) => {
  if (!token) {
    throw new Error("Token do bot não informado.");
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.description || "Erro ao chamar Telegram.");
  }
  return payload;
};

app.get("/api/telegram/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor local ativo." });
});

app.post("/api/telegram/webhook", async (req, res) => {
  try {
    const { token, webhookUrl } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ message: "URL do webhook não informada." });
    }
    await telegramRequest(token, "setWebhook", { url: webhookUrl });
    return res.json({ message: "Webhook configurado com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/telegram/diagnose", async (req, res) => {
  try {
    const { token } = req.query;
    const result = await telegramRequest(token, "getMe", {});
    return res.json({ message: `Bot conectado: ${result.result.username}` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/telegram/test-message", async (req, res) => {
  try {
    const { token, chatId, message } = req.body;
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID não informado." });
    }
    await telegramRequest(token, "sendMessage", {
      chat_id: chatId,
      text: message || "Teste do Controle de Gastos",
    });
    return res.json({ message: "Mensagem enviada para o Telegram." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Telegram rodando na porta ${port}`);
});
