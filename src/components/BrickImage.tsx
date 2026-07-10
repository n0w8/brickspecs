"use client";

import { useState } from "react";

/**
 * Bild mit LEGO-Fallback: Wenn das Remote-Bild (Brickset/BrickLink) nicht lädt,
 * erscheint eine Brick-Kachel mit Beschriftung.
 */
export default function BrickImage({
  src,
  alt,
  label,
  className = "",
  imgClassName = "object-contain",
}: {
  src?: string;
  alt: string;
  label: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--surface-2)] ${className}`}
      >
        <span className="text-4xl" aria-hidden>
          🧱
        </span>
        <span className="text-xs font-mono text-[var(--muted)]">{label}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Remote-Demo-Bilder mit Fallback, next/image folgt in Phase 2 */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full ${imgClassName}`}
      />
    </div>
  );
}
