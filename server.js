import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const expenses = [];

const normalizeAmount = (rawAmount) => {
  if (!rawAmount) return null;
  const value = Number(String(rawAmount).replace(",", "."));
  if (Number.isNaN(value)) return null;
  return value;
};

const parseExpenseFromMessage = (text = "") => {
  const cleaned = text.trim();
  if (!cleaned) return null;

  const arrowParts = cleaned.split("->").map((part) => part.trim());
  const mainText = arrowParts[0];
  const typeHint = arrowParts[1] || "";

  const amountMatch = mainText.match(/(\d+[.,]?\d*)/);
  if (!amountMatch) return null;

  const amount = normalizeAmount(amountMatch[1]);
  if (!amount) return null;

  const description = mainText.replace(amountMatch[0], "").trim() || "Gasto via bot";
  let type = "shared";
  if (/individual|pessoal|solo/i.test(typeHint)) {
    type = "individual";
  } else if (/compart|shared/i.test(typeHint)) {
    type = "shared";
  }

  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    description,
    category: "Bot",
    amount,
    type,
    date: new Date().toISOString().slice(0, 10),
    source: "telegram",
  };
};

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
    const { token, webhookUrl, message, update_id } = req.body;
    if (webhookUrl && token) {
      await telegramRequest(token, "setWebhook", { url: webhookUrl });
      return res.json({ message: "Webhook configurado com sucesso." });
    }

    const payloadMessage = message || req.body?.message;
    if (payloadMessage?.text || update_id) {
      const expense = parseExpenseFromMessage(payloadMessage?.text || "");
      if (expense) {
        expenses.unshift(expense);
        return res.json({ status: "ok", stored: true });
      }
      return res.json({ status: "ok", stored: false });
    }

    return res.status(400).json({ message: "Payload inválido." });
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

app.get("/api/expenses", (req, res) => {
  res.json({ expenses });
});

app.post("/api/expenses", (req, res) => {
  const { description, category, amount, type, date } = req.body || {};
  const normalizedAmount = normalizeAmount(amount);
  if (!description || !normalizedAmount) {
    return res.status(400).json({ message: "Descrição e valor são obrigatórios." });
  }
  const expense = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    description,
    category: category || "Manual",
    amount: normalizedAmount,
    type: type || "shared",
    date: date || new Date().toISOString().slice(0, 10),
    source: "manual",
  };
  expenses.unshift(expense);
  return res.json({ message: "Gasto registrado.", expense });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Telegram rodando na porta ${port}`);
});
