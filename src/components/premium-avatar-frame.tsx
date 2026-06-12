"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PremiumAvatarFrame({ children, className }: Props) {
  return (
    <div className={`relative inline-flex shrink-0 ${className || ""}`}>
      <div
        className="absolute rounded-full -z-10"
        style={{
          top: -3,
          right: -3,
          bottom: -3,
          left: -3,
          background: "linear-gradient(135deg, #f59e0b, #a855f7, #3b82f6, #f59e0b)",
          backgroundSize: "300% 300%",
          animation: "premium-border 3s ease infinite",
        }}
      />
      <div
        className="absolute rounded-full -z-10"
        style={{
          top: -3,
          right: -3,
          bottom: -3,
          left: -3,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
          backgroundSize: "200% 100%",
          animation: "premium-shine 4s ease-in-out infinite",
          pointerEvents: "none",
          opacity: 0.3,
        }}
      />
      {children}
    </div>
  );
}
