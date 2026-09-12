"use client";
import type { ReactNode } from "react";

export type IconName =
  | "lightning" | "clock" | "pause" | "play" | "reset" | "flask"
  | "check-circle" | "tag-theft" | "boxes" | "loop" | "users" | "circuitry"
  | "sun" | "trend-up" | "gauge" | "handshake" | "cloud-sun" | "house"
  | "heartbeat" | "sliders" | "shield-check" | "shield-warning" | "scales"
  | "brain" | "link" | "caret-down" | "caret-right";

const PATHS: Record<IconName, ReactNode> = {
  lightning: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  clock: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6 3.5 2-1 1.7L11 14V8h2v4.6z" />,
  pause: <path d="M7 5h4v14H7zM13 5h4v14h-4z" />,
  play: <path d="M8 5v14l11-7z" />,
  reset: <path d="M12 5V1L6.5 5.5 12 10V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-7z" />,
  flask: <path d="M9 3h6v2h-1v5.2l5 9.1a1 1 0 0 1-.9 1.7H6a1 1 0 0 1-.9-1.7l5-9.1V5H9V3zm2 7.3L7.2 18a.5.5 0 0 0 .4.8h8.8a.5.5 0 0 0 .4-.8L13 10.3V7h-2v3.3z" />,
  "check-circle": <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />,
  "tag-theft": <path d="M3 3h8l10 10-8 8L3 11V3zm4 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM15 8l-4 4 1.4 1.4L16.4 9.4 15 8z" />,
  boxes: <path d="M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.3L18.7 8 12 11.7 5.3 8 12 4.3zM5 9.7l6 3.4v6.5l-6-3.3V9.7zm8 9.9v-6.5l6-3.4v6.6l-6 3.3z" />,
  loop: <path d="M17 2h4v4h-2V4h-2V2zM7 22H3v-4h2v2h2v2zm12-4v2h-2v2h4v-4h-2zM5 6V4h2V2H3v4h2zm14 4a5 5 0 0 0-9-3H8a7 7 0 0 1 12.6 4H19zM5 14a5 5 0 0 0 9 3h2a7 7 0 0 1-12.6-4H5z" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0-2.1-5.1A5.5 5.5 0 0 1 9 8.5c-.3 0-.7 0-1-.1A5 5 0 0 1 3 13v5h9v-2H5v-3a3 3 0 0 1 3-3h1zm1 7h6v-3a4 4 0 0 0-4-4h-.5A5.5 5.5 0 0 1 17 14v5z" />,
  circuitry: <path d="M9 2h6v4h-2V4h-2v2H9V2zM4 4h2v3H4V4zm14 0h2v3h-2V4zM2 9h6v2H4v4H2V9zm20 0h-6v2h4v4h2V9zM9 13h6v2H9v-2zm-5 5h2v4H4v-4zm14 0h2v4h-2v-4zM9 18h2v2h2v-2h2v4H9v-4z" />,
  sun: <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-14h2v3h-2V3zM3 11h3v2H3v-2zm15 0h3v2h-3v-2zM5.6 4.2l1.4 1.4L5.6 7 4.2 5.6 5.6 4.2zm12.8 0 1.4 1.4-1.4 1.4-1.4-1.4 1.4-1.4zM11 19h2v3h-2v-3zm-5.4.4 1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4zm12.8 0 1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4z" />,
  "trend-up": <path d="M3 17l6-6 4 4 7-7 1.4 1.4L13 17.8l-4-4-4.6 4.6L3 17zm14-9h4v4h-2V8h-2V8z" />,
  gauge: <path d="M12 4a8 8 0 0 1 8 8h-3a5 5 0 0 0-10 0H4a8 8 0 0 1 8-8zm-1 5 5 5-1.4 1.4L10 10.8V9h1zM4 18h16v2H4v-2z" />,
  handshake: <path d="m12 13 3-3 5 5-4 4a2.4 2.4 0 0 1-3.4 0l-2.6-2.6-2.6 2.6a2.4 2.4 0 0 1-3.4 0l-2-2 5-5 3 3 2-2zm7.1-7.1a1.5 1.5 0 0 1 0 2.1l-2 2-1.4-1.4 2-2a.5.5 0 0 0-.7-.7l-2.7 2.7-1.4-1.4 2.5-2.5a2.5 2.5 0 0 1 3.7 1.2zM2.3 13.3l1.4-1.4 2 2 1.4-1.4-2-2 1.4-1.4 2.7 2.7-4.4 4.4-2.5-2.9z" />,
  "cloud-sun": <path d="M12 5a4 4 0 0 1 3.9 3H17a4 4 0 0 1 .6 8H8a5 5 0 0 1-1-9.9A5.5 5.5 0 0 1 12 5zm7-3h2v3h-2V2zM4 4h2v2H4V4zm13.7.3 1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4zM2.9 6.3l1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4z" />,
  house: <path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z" />,
  heartbeat: <path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2 5 5.5 5c2 0 3.4 1.1 4.2 2.3h4.6C15.1 6.1 16.5 5 18.5 5 22 5 23.6 8.6 22 11.7 19.5 16.3 12 21 12 21zM3 12h4l2-4 3 8 2-4h7v2h-5.6l-.7 1.4-2.3-6.2-1.6 3.2L9 14H3v-2z" />,
  sliders: <path d="M4 6h8v2H4V6zm12 0h4v2h-4V6zM4 11h4v2H4v-2zm8 0h8v2h-8v-2zm-8 5h12v2H4v-2zm16 0h4v2h-4v-2zM13 4h2v6h-2V4zm3 9h2v6h-2v-6zM7 9h2v6H7V9z" />,
  "shield-check": <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3zm-1.2 14.6-3.6-3.6 1.4-1.4 2.2 2.2 4.6-4.6 1.4 1.4-5.4 6z" />,
  "shield-warning": <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3zm-1 6h2v5h-2V8zm0 6h2v2h-2v-2z" />,
  scales: <path d="M11 3h2v2h-2V3zM4 5h16v2H4V5zm2 3h3l-2 8a3 3 0 0 1-4 0l3-8zm12 0h3l-2 8a3 3 0 0 1-4 0l3-8zM11 7h2v13h-2V7zm-2 15h6v2H9v-2z" />,
  brain: <path d="M9 2a3 3 0 0 0-3 3 3 3 0 0 0-4 3 3 3 0 0 0 1 5.7A4 4 0 0 0 5 19a3 3 0 0 0 5 2c.6 0 1.2-.2 1.7-.4V4.4A3 3 0 0 0 9 2zm3 2.4v16.2c.5.2 1.1.4 1.7.4a3 3 0 0 0 5-2 4 4 0 0 0 2-5.3A3 3 0 0 0 22 8a3 3 0 0 0-4-3 3 3 0 0 0-3-3c-.6 0-1.2.2-1.7.4zM8 8h2v2H8V8zm5 0h2v2h-2V8z" />,
  link: <path d="m10.6 13.4 1.4 1.4-2.5 2.5a3.5 3.5 0 0 1-5-5L7 9.8l1.4 1.4-1.1 1.1a1.5 1.5 0 0 0 2.1 2.1l1.2-1zM14 9.6l-1.4-1.4 2.5-2.5a3.5 3.5 0 0 1 5 5L17.6 14l-1.4-1.4 1.1-1.1a1.5 1.5 0 0 0-2.1-2.1L14 10.6v-1zM8 15l2-2 1.4 1.4-2 2L8 15zm6-8 2-2 1.4 1.4-2 2L14 7z" />,
  "caret-down": <path d="m6 9 6 6 6-6H6z" />,
  "caret-right": <path d="m9 6 6 6-6 6V6z" />,
};

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}
