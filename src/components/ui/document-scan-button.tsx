"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";

export function DocumentScanButton<T>({
  label,
  action,
  onExtracted,
}: {
  label: string;
  action: (formData: FormData) => Promise<{ data?: T; error?: string }>;
  onExtracted: (data: T) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await action(formData);

    setIsScanning(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      onExtracted(result.data);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isScanning}
        onClick={() => inputRef.current?.click()}
      >
        {isScanning ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {isScanning ? "Reading document…" : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
