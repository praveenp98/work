"use client";
import { TextLink } from "./TextLink";

/** Opens Messages with "Hey Rocco 👋 Help me with <ask>" ready to send (link made only on tap). */
export function AskRoccoButton({ ask, label = "Ask Rocco about my account" }: { ask: string; label?: string }) {
  return <TextLink q={ask}>💬 {label}</TextLink>;
}
