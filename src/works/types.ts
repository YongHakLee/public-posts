import type { ComponentType } from "react";
import type { ThemeName } from "@/themes";

export type WorkKind = "deck" | "motion";

export type Work = {
  kind: WorkKind;
  /** URL 세그먼트. 소문자·숫자·하이픈. 같은 kind 안에서 고유. */
  slug: string;
  title: string;
  /** 목록과 링크 미리보기(OG)에 쓰인다 */
  description: string;
  /** YYYY-MM-DD */
  date: string;
  theme: ThemeName;
  /** true면 개발 모드에서만 보이고 프로덕션 빌드에서 제외 */
  draft?: boolean;
  load: () => Promise<{ default: ComponentType }>;
};
