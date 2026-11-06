"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

// Cloudflare Turnstile for Supabase Auth's CAPTCHA protection. Renders nothing
// (and `TURNSTILE_ENABLED` is false) until NEXT_PUBLIC_TURNSTILE_SITE_KEY is
// set, so the code can ship before the protection is switched on in Supabase.
// A token is single-use: callers read it with `getToken()` and call `reset()`
// after every attempt so the next one gets a fresh token.

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const TURNSTILE_ENABLED = TURNSTILE_SITE_KEY.length > 0;

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      appearance?: "always" | "execute" | "interaction-only";
      theme?: "auto" | "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "before-interactive-callback"?: () => void;
      "after-interactive-callback"?: () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** The current single-use token, or undefined while the check is unfinished. */
  getToken(): string | undefined;
  /** Discards the used token and asks for a new one. */
  reset(): void;
}

export default function TurnstileWidget({ ref }: { ref?: React.Ref<TurnstileHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | undefined>(undefined);
  // The widget takes no layout space while it runs invisibly. It expands only when
  // Cloudflare needs a tap or has an error to show, so the form has no blank gap.
  const [visible, setVisible] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      getToken: () => tokenRef.current,
      reset: () => {
        tokenRef.current = undefined;
        if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          // Invisible unless Cloudflare needs the visitor to do something.
          appearance: "interaction-only",
          theme: "auto",
          callback: (token) => {
            tokenRef.current = token;
            setVisible(false);
          },
          "expired-callback": () => {
            tokenRef.current = undefined;
          },
          "error-callback": () => {
            tokenRef.current = undefined;
            // Show Cloudflare's own failure message and retry link.
            setVisible(true);
          },
          "before-interactive-callback": () => setVisible(true),
          "after-interactive-callback": () => setVisible(false),
        });
      })
      .catch(() => {
        console.error("Turnstile could not be loaded");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      tokenRef.current = undefined;
    };
  }, []);

  if (!TURNSTILE_ENABLED) return null;
  // Collapsed: out of the layout flow (so a flex gap adds no space) but still
  // rendered, because Turnstile needs a live container to run its check.
  return (
    <div
      ref={containerRef}
      className={visible ? "mt-3 flex justify-center" : "absolute size-0 overflow-hidden"}
    />
  );
}
