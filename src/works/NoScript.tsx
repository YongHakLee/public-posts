import type { Work } from "./types";

export function NoScript({ work }: { work: Work }) {
  return (
    <noscript>
      <div style={{ padding: 24 }}>
        <h1>{work.title}</h1>
        <p>{work.description}</p>
        <p>이 작업물을 보려면 JavaScript가 필요합니다.</p>
      </div>
    </noscript>
  );
}
