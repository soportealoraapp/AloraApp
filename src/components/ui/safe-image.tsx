"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useCallback, useEffect } from "react";

const FALLBACK_SRC = "/placeholder.svg";

const BLOCKED_HOSTS = ["placehold.co"];

function isBlockedUrl(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  try {
    const url = new URL(src, window.location.origin);
    return BLOCKED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

type SafeImageProps = Omit<ImageProps, "onError"> & {
  fallbackSrc?: string;
};

export function SafeImage({ fallbackSrc = FALLBACK_SRC, src, ...props }: SafeImageProps) {
  const resolved = isBlockedUrl(src) ? fallbackSrc : src;
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(isBlockedUrl(src) ? fallbackSrc : src);
  }, [src, fallbackSrc]);

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }, [currentSrc, fallbackSrc]);

  return <Image src={currentSrc} onError={handleError} {...props} />;
}
