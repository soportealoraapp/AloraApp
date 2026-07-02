"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useCallback } from "react";

const FALLBACK_SRC = "/placeholder.svg";

type SafeImageProps = Omit<ImageProps, "onError"> & {
  fallbackSrc?: string;
};

export function SafeImage({ fallbackSrc = FALLBACK_SRC, src, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }, [currentSrc, fallbackSrc]);

  return <Image src={currentSrc} onError={handleError} {...props} />;
}
