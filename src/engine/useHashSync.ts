"use client";

import { useEffect, useEffectEvent } from "react";
import { formatHash, parseHash } from "./navigation";

/** 현재 슬라이드를 주소 해시(#1부터)에 쓰고, 사용자가 해시를 바꾸면 알려준다. 기록(history)은 쌓지 않는다. */
export function useHashSync(current: number, count: number, onExternalChange: (index: number) => void): void {
  useEffect(() => {
    const next = formatHash(current);
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [current]);

  const onHash = useEffectEvent(() => {
    const index = parseHash(window.location.hash, count);
    onExternalChange(index);
    // 범위 밖·잘못된 값이 현재 슬라이드로 보정되면 current가 안 바뀌므로 주소창을 직접 정리한다.
    const canonical = formatHash(index);
    if (window.location.hash !== canonical) window.history.replaceState(null, "", canonical);
  });

  useEffect(() => {
    const listener = () => onHash();
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
}
