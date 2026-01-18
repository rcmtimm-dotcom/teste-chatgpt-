import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const run = async () => {
  const baseUrl = process.env.BACKEND_BASE_URL || "http://localhost:3000";
  const debugKey = process.env.DEBUG_KEY || "";
  const result = {
    baseUrl,
    health: null,
    debug: null,
    expenses: null,
    errors: [],
  };

  try {
    const { response, data } = await fetchJson(`${baseUrl}/api/telegram/health`);
    result.health = { httpStatus: response.status, data };
  } catch (error) {
    result.errors.push(`Health falhou: ${error.message}`);
  }

  try {
    const { response, data } = await fetchJson(
      `${baseUrl}/debug/last-expenses?key=${encodeURIComponent(debugKey)}`
    );
    result.debug = { httpStatus: response.status, data };
  } catch (error) {
    result.errors.push(`Debug falhou: ${error.message}`);
  }

  try {
    const { response, data } = await fetchJson(`${baseUrl}/api/expenses`);
    result.expenses = { httpStatus: response.status, data };
  } catch (error) {
    result.errors.push(`Expenses falhou: ${error.message}`);
  }

  return result;
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  run()
    .then((result) => fs.writeFile("diagnose_backend_smoke.json", JSON.stringify(result, null, 2)))
    .then(() => {
      console.log("smoke_backend concluído (saida em diagnose_backend_smoke.json)");
    })
    .catch((error) => {
      console.error("Falha smoke_backend:", error.message);
      process.exitCode = 1;
    });
}

export { run };
