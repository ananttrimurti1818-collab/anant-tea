"use client";

import { useState } from "react";

type GalleryImageProps = {
  src: string;
  alt: string;
  fallback?: string;
  loading?: "eager" | "lazy";
  className?: string;
};

export default function GalleryImage({
  src,
  alt,
  fallback = "/gallery/tea-1.svg",
  loading = "lazy",
  className,
}: GalleryImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallback);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (imageSrc !== fallback) setImageSrc(fallback);
      }}
    />
  );
}
