import express from "express";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

const expenses = [];
const webhookEvents = [];

const normalizeAmount = (rawAmount) => {
  if (!rawAmount) return null;
  const value = Number(String(rawAmount).replace(",", "."));
  if (Number.isNaN(value)) return null;
  return value;
};

const parseExpenseFromMessage = (text = "") => {
  const cleaned = text.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith("/")) return null;

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

const extractTelegramMessage = (body) => {
  if (!body) return null;
  return body.message || body.edited_message || body.channel_post || null;
};

const formatCurrency = (amount) =>
  Number(amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const getIssuer = () => {
  if (process.env.SUPABASE_ISSUER) return process.env.SUPABASE_ISSUER;
  if (process.env.SUPABASE_URL) {
    return `${process.env.SUPABASE_URL}/auth/v1`;
  }
  return "";
};

const jwksUrl = process.env.SUPABASE_JWKS_URL
  ? new URL(process.env.SUPABASE_JWKS_URL)
  : null;

const jwks = jwksUrl ? createRemoteJWKSet(jwksUrl) : null;

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Token ausente." });
    }
    if (!jwks) {
      return res.status(500).json({ message: "JWKS não configurado." });
    }
    const issuer = getIssuer();
    const audience = process.env.SUPABASE_AUDIENCE || "authenticated";
    await jwtVerify(token, jwks, { issuer, audience });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido." });
  }
};

const recordWebhookEvent = (payloadMessage, stored) => {
  webhookEvents.unshift({
    at: new Date().toISOString(),
    text: payloadMessage?.text || payloadMessage?.caption || "",
    chatId: payloadMessage?.chat?.id || null,
    stored,
  });
  if (webhookEvents.length > 20) {
    webhookEvents.length = 20;
  }
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
    const { token, webhookUrl, update_id } = req.body;
    if (webhookUrl && token) {
      await telegramRequest(token, "setWebhook", { url: webhookUrl });
      return res.json({ message: "Webhook configurado com sucesso." });
    }

    const payloadMessage = extractTelegramMessage(req.body);
    const text = payloadMessage?.text || payloadMessage?.caption || "";
    if (text || update_id) {
      console.log("WEBHOOK_HIT");
      const expense = parseExpenseFromMessage(text);
      const replyToken = process.env.BOT_TOKEN;
      if (expense) {
        expenses.unshift(expense);
        recordWebhookEvent(payloadMessage, true);
        console.log("PARSED_OK");
        console.log("DB_WRITE_OK");
        if (replyToken && payloadMessage?.chat?.id) {
          await telegramRequest(replyToken, "sendMessage", {
            chat_id: payloadMessage.chat.id,
            text: `✅ Gasto registrado: ${expense.description} ${formatCurrency(
              expense.amount
            )}`,
          });
        }
        return res.json({ status: "ok", stored: true });
      }
      recordWebhookEvent(payloadMessage, false);
      console.log("PARSED_FAIL");
      if (replyToken && payloadMessage?.chat?.id) {
        await telegramRequest(replyToken, "sendMessage", {
          chat_id: payloadMessage.chat.id,
          text:
            "Formato inválido. Use: valor descrição -> compartilhado | individual",
        });
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

app.get("/api/telegram/updates", (req, res) => {
  res.json({ events: webhookEvents });
});

app.get("/debug/last-expenses", (req, res) => {
  const debugKey = process.env.DEBUG_KEY;
  if (!debugKey || req.query.key !== debugKey) {
    return res.status(403).json({ message: "Acesso negado." });
  }
  return res.json({ expenses: expenses.slice(0, 5) });
});

app.get("/api/expenses", requireAuth, (req, res) => {
  res.json({ expenses });
});

app.post("/api/expenses", requireAuth, (req, res) => {
  const { description, category, amount, type, date, owner } = req.body || {};
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
    owner: owner || "",
    source: "manual",
  };
  expenses.unshift(expense);
  return res.json({ message: "Gasto registrado.", expense });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Telegram rodando na porta ${port}`);
});
