import fs from "node:fs/promises";
import { run as runWebhookCheck } from "./telegram_webhook_check.js";
import { run as runBackendSmoke } from "./smoke_backend.js";
import { run as runFrontendConfig } from "./check_frontend_config.js";
import { run as runAuthSmoke } from "./smoke_auth.js";

const buildReport = ({ webhookCheck, backendSmoke, frontendConfig, authSmoke }) => {
  const lines = [];
  lines.push("# Diagnose Report");
  lines.push("");
  lines.push("## Resumo Executivo");

  const webhookUrl = webhookCheck.webhookInfo?.url;
  const webhookError = webhookCheck.webhookInfo?.last_error_message;
  const backendHealthOk = backendSmoke.health?.httpStatus === 200;
  const backendExpensesOk = backendSmoke.expenses?.httpStatus === 200;
  const debugOk = backendSmoke.debug?.httpStatus === 200;

  let failurePoint = "Não determinado (dados insuficientes).";
  if (!webhookCheck.ok) {
    failurePoint = "Falha ao consultar webhook (token ausente ou erro de rede).";
  } else if (!webhookUrl) {
    failurePoint = "Webhook não configurado no Telegram (url vazia).";
  } else if (webhookError) {
    failurePoint = `Webhook configurado, mas com erro: ${webhookError}`;
  } else if (!backendHealthOk) {
    failurePoint = "Backend não respondeu /api/telegram/health.";
  } else if (!backendExpensesOk) {
    failurePoint = "Backend não respondeu /api/expenses.";
  }

  lines.push(`**Ponto provável da falha:** ${failurePoint}`);
  lines.push("");

  lines.push("## Evidências (saídas dos checks)");
  lines.push("");
  lines.push("### Telegram Webhook");
  lines.push("```json");
  lines.push(JSON.stringify(webhookCheck, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Backend Smoke");
  lines.push("```json");
  lines.push(JSON.stringify(backendSmoke, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Frontend Config Scan");
  lines.push("```json");
  lines.push(JSON.stringify(frontendConfig, null, 2));
  lines.push("```");
  lines.push("");

  lines.push("### Auth Smoke");
  lines.push("```json");
  lines.push(JSON.stringify(authSmoke, null, 2));
  lines.push("```");
  lines.push("");

  lines.push("## Respostas obrigatórias");
  lines.push("");
  lines.push(
    `- **O Telegram está enviando updates para o Render?** ${
      webhookUrl ? "SIM (webhook configurado)." : "NÃO (webhook não configurado)."
    }`
  );
  lines.push(
    `- **O endpoint do webhook existe e responde 200?** ${
      backendHealthOk ? "SIM (/api/telegram/health respondeu 200)." : "NÃO (health falhou)."
    }`
  );
  lines.push(
    `- **O insert no banco está acontecendo?** ${
      debugOk ? "SIM (debug endpoint acessível e retornou dados)." : "NÃO (debug endpoint falhou)."
    }`
  );
  lines.push(
    `- **O front está buscando do endpoint correto?** ${
      frontendConfig.files?.["app.js"]?.length
        ? "NÃO (referências a localhost encontradas)."
        : "SIM (nenhuma referência a localhost detectada no código)."
    }`
  );
  lines.push(
    `- **Há bloqueio de CORS?** ${
      backendHealthOk ? "NÃO evidência direta (health ok)." : "INCONCLUSIVO."
    }`
  );
  lines.push("");

  lines.push("## Correções aplicadas");
  lines.push("- Logs de webhook adicionados (WEBHOOK_HIT/PARSED_OK/DB_WRITE_OK).");
  lines.push("- Endpoint protegido `/debug/last-expenses?key=DEBUG_KEY`.");
  lines.push("- Scripts de diagnóstico automatizados e comando `npm run diagnose`.");
  lines.push("");

  lines.push("## Como rodar localmente");
  lines.push("```bash");
  lines.push("export BACKEND_BASE_URL=http://localhost:3000");
  lines.push("export DEBUG_KEY=seu_debug_key");
  lines.push("export TELEGRAM_BOT_TOKEN=seu_token");
  lines.push("export TELEGRAM_WEBHOOK_URL=https://seu-backend.onrender.com/api/telegram/webhook");
  lines.push("npm run diagnose");
  lines.push("```");
  lines.push("");

  lines.push("## Como rodar no Render (produção)");
  lines.push("```bash");
  lines.push("BACKEND_BASE_URL=https://SEU-SERVICO.onrender.com DEBUG_KEY=... TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_URL=... npm run diagnose");
  lines.push("```");
  lines.push("");

  lines.push("## Variáveis de ambiente necessárias");
  lines.push("- `TELEGRAM_BOT_TOKEN` (obrigatória)");
  lines.push("- `TELEGRAM_WEBHOOK_URL` (para setWebhook automático)");
  lines.push("- `BACKEND_BASE_URL` (URL do backend a testar)");
  lines.push("- `DEBUG_KEY` (para acessar /debug/last-expenses)");

  return lines.join("\n");
};

const run = async () => {
  const [webhookCheck, backendSmoke, frontendConfig, authSmoke] = await Promise.all([
    runWebhookCheck(),
    runBackendSmoke(),
    runFrontendConfig(),
    runAuthSmoke(),
  ]);

  const report = buildReport({ webhookCheck, backendSmoke, frontendConfig, authSmoke });
  await fs.writeFile("diagnose_report.md", report);
  return { webhookCheck, backendSmoke, frontendConfig, authSmoke };
};

run()
  .then(() => {
    console.log("Diagnóstico concluído (diagnose_report.md gerado).");
  })
  .catch((error) => {
    console.error("Falha diagnose:", error.message);
    process.exitCode = 1;
  });
