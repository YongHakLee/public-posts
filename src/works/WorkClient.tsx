"use client";

import dynamic from "next/dynamic";
import type { WorkKind } from "./types";

// 작업물은 뷰포트·URL에 따라 모드가 정해지므로 클라이언트에서만 렌더한다.
const WorkView = dynamic(() => import("./WorkView").then((m) => m.WorkView), { ssr: false });

export function WorkClient(props: { kind: WorkKind; slug: string }) {
  return <WorkView {...props} />;
}
