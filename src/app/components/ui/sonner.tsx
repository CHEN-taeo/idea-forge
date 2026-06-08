"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "rgba(18, 18, 24, 0.85)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "0.75rem",
          fontWeight: 380,
          borderRadius: "0.625rem",
          padding: "8px 14px",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
