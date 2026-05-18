"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ColumnReorderControlsProps {
  columnId?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  onMove: (direction: "up" | "down") => void | Promise<void>;
}

export function ColumnReorderControls({
  canMoveUp,
  canMoveDown,
  disabled,
  onMove,
}: ColumnReorderControlsProps) {
  const [pending, setPending] = React.useState(false);

  const handle = async (direction: "up" | "down") => {
    if (pending) return;
    try {
      setPending(true);
      await onMove(direction);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-0.5">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={!canMoveUp || pending || disabled}
        onClick={() => handle("up")}
        aria-label="上移"
        className="h-6 w-6 p-0"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={!canMoveDown || pending || disabled}
        onClick={() => handle("down")}
        aria-label="下移"
        className="h-6 w-6 p-0"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default ColumnReorderControls;
