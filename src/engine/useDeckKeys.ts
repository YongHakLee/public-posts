"use client";

import { useEffect, useEffectEvent } from "react";
import { isEditableTarget } from "./dom";
import { keyToCommand, type Command } from "./input";

export function useDeckKeys(onCommand: (command: Command) => void): void {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;
    const command = keyToCommand(event);
    if (!command) return;
    event.preventDefault();
    onCommand(command);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handle(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
