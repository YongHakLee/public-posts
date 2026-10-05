import type { NextConfig } from "next";
import { BASE_PATH } from "./site.config";

const isDev = process.env.NODE_ENV !== "production";

const config: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  // *.dev.tsx 페이지(테마 갤러리)는 개발 모드에서만 라우트가 된다.
  pageExtensions: isDev ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
};

export default config;
