import { BASE_PATH } from "../site.config";
import { startServer } from "./lib/serve";

async function main() {
  const flag = process.argv.indexOf("--port");
  const port = flag >= 0 ? Number(process.argv[flag + 1]) : 4173;
  const server = await startServer({ root: "out", basePath: BASE_PATH, port });
  console.log(`out/ 을 ${server.url} 에서 서빙합니다 (Ctrl+C로 종료)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
