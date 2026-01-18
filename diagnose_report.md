# Diagnose Report

## Resumo Executivo
**Ponto provável da falha:** Falha ao consultar webhook (token ausente ou erro de rede).

## Evidências (saídas dos checks)

### Telegram Webhook
```json
{
  "ok": false,
  "webhookInfo": null,
  "webhookSet": null,
  "errors": [
    "TELEGRAM_BOT_TOKEN não informado."
  ],
  "notes": []
}
```

### Backend Smoke
```json
{
  "baseUrl": "http://localhost:3000",
  "health": null,
  "debug": null,
  "expenses": null,
  "errors": [
    "Health falhou: fetch failed",
    "Debug falhou: fetch failed",
    "Expenses falhou: fetch failed"
  ]
}
```

### Frontend Config Scan
```json
{
  "files": {
    "index.html": [
      "localhost"
    ],
    "app.js": [
      "localhost"
    ]
  },
  "notes": []
}
```

## Respostas obrigatórias

- **O Telegram está enviando updates para o Render?** NÃO (webhook não configurado).
- **O endpoint do webhook existe e responde 200?** NÃO (health falhou).
- **O insert no banco está acontecendo?** NÃO (debug endpoint falhou).
- **O front está buscando do endpoint correto?** NÃO (referências a localhost encontradas).
- **Há bloqueio de CORS?** INCONCLUSIVO.

## Correções aplicadas
- Logs de webhook adicionados (WEBHOOK_HIT/PARSED_OK/DB_WRITE_OK).
- Endpoint protegido `/debug/last-expenses?key=DEBUG_KEY`.
- Scripts de diagnóstico automatizados e comando `npm run diagnose`.

## Como rodar localmente
```bash
export BACKEND_BASE_URL=http://localhost:3000
export DEBUG_KEY=seu_debug_key
export TELEGRAM_BOT_TOKEN=seu_token
export TELEGRAM_WEBHOOK_URL=https://seu-backend.onrender.com/api/telegram/webhook
npm run diagnose
```

## Como rodar no Render (produção)
```bash
BACKEND_BASE_URL=https://SEU-SERVICO.onrender.com DEBUG_KEY=... TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_URL=... npm run diagnose
```

## Variáveis de ambiente necessárias
- `TELEGRAM_BOT_TOKEN` (obrigatória)
- `TELEGRAM_WEBHOOK_URL` (para setWebhook automático)
- `BACKEND_BASE_URL` (URL do backend a testar)
- `DEBUG_KEY` (para acessar /debug/last-expenses)