import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const run = async () => {
  const baseUrl = process.env.BACKEND_BASE_URL || "http://localhost:3000";
  const token = process.env.TEST_JWT || "";
  const result = {
    baseUrl,
    noAuth: null,
    withAuth: null,
    errors: [],
    notes: [],
  };

  try {
    const { response, data } = await fetchJson(`${baseUrl}/api/expenses`);
    result.noAuth = { httpStatus: response.status, data };
  } catch (error) {
    result.errors.push(`Sem token falhou: ${error.message}`);
  }

  if (!token) {
    result.notes.push("TEST_JWT não informado; validação com token não executada.");
    return result;
  }

  try {
    const { response, data } = await fetchJson(`${baseUrl}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    result.withAuth = { httpStatus: response.status, data };
  } catch (error) {
    result.errors.push(`Com token falhou: ${error.message}`);
  }

  return result;
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  run()
    .then((result) => fs.writeFile("diagnose_auth_smoke.json", JSON.stringify(result, null, 2)))
    .then(() => {
      console.log("smoke_auth concluído (saida em diagnose_auth_smoke.json)");
    })
    .catch((error) => {
      console.error("Falha smoke_auth:", error.message);
      process.exitCode = 1;
    });
}

export { run };
