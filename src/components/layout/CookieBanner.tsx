"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_NAME = "cookie-consent";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()\\^[\]\\+]/g, "\\$&")}=([^;]*)`),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp}; SameSite=Lax`;
}

const consentListeners = new Set<() => void>();
const subscribeConsent = (listener: () => void) => {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
};
function notifyConsent() {
  for (const fn of consentListeners) fn();
}

export function CookieBanner() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    () => readCookie(COOKIE_NAME),
    () => null,
  );

  const decide = useCallback((value: "all" | "essential") => {
    writeCookie(COOKIE_NAME, value);
    notifyConsent();
  }, []);

  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-lg p-5 md:p-6">
        <p className="text-sm text-foreground/85 mb-4">
          Използваме бисквитки за вход и за защита на формите от спам. Можеш да
          приемеш всички или само необходимите.{" "}
          <Link href="/privacy" className="text-primary underline">
            Научи повече
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={() => decide("essential")}>
            Само необходими
          </Button>
          <Button onClick={() => decide("all")}>Приемам всички</Button>
        </div>
      </div>
    </div>
  );
}
