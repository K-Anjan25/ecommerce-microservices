import type { en } from "./locales/en";

/** Every key in the English catalog — all locales must implement all of them (compile-enforced). */
export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
