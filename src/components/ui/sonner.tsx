"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg group-[.toaster]:text-fg group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-fg",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-fg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-fg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
