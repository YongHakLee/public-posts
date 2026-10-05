import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { pretendard } from "@/fonts";
import { themes } from "@/themes";
import { themeToCssVars } from "@/themes/css-vars";
import { SITE_DESCRIPTION, SITE_TITLE } from "../../site.config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // paper 변수를 루트 기본값으로 둔다. ThemeScope가 하위 트리에서 덮어쓴다.
  return (
    <html lang="ko" className={pretendard.variable} style={themeToCssVars(themes.paper) as CSSProperties}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
