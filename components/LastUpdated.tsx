"use client";

import React, { useState, useEffect } from "react";

interface LastUpdatedProps {
  updatedAt: number | undefined;
}

export default function LastUpdated({ updatedAt }: LastUpdatedProps) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!updatedAt) return;

    const update = () => {
      setSecondsAgo(Math.floor((Date.now() - updatedAt) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (secondsAgo === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/70 font-medium px-6 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Last updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
    </div>
  );
}
