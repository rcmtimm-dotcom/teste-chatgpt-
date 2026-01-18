import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const scanFile = async (path, patterns) => {
  const content = await fs.readFile(path, "utf8");
  const matches = [];
  patterns.forEach((pattern) => {
    if (content.includes(pattern)) {
      matches.push(pattern);
    }
  });
  return matches;
};

const run = async () => {
  const patterns = ["localhost", "127.0.0.1"];
  const result = {
    files: {},
    notes: [],
  };

  const filesToScan = ["index.html", "app.js"];
  await Promise.all(
    filesToScan.map(async (file) => {
      const matches = await scanFile(file, patterns);
      result.files[file] = matches;
    })
  );

  const hasLocalhost = Object.values(result.files).some((matches) => matches.length);
  if (!hasLocalhost) {
    result.notes.push("Nenhuma referência a localhost encontrada.");
  }

  return result;
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  run()
    .then((result) =>
      fs.writeFile("diagnose_frontend_config.json", JSON.stringify(result, null, 2))
    )
    .then(() => {
      console.log("check_frontend_config concluído (saida em diagnose_frontend_config.json)");
    })
    .catch((error) => {
      console.error("Falha check_frontend_config:", error.message);
      process.exitCode = 1;
    });
}

export { run };
