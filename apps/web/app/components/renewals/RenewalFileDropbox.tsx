"use client";

import { useRef, useState } from 'react';
import { Button, Label } from '@heroui/react';
import { IconUpload } from '@tabler/icons-react';
import { SIGNED_LEASE_ACCEPT, validateSignedLeaseFile } from '@/lib/signed-lease';

interface RenewalFileDropboxProps {
  id: string;
  label: string;
  file: File | null;
  busy?: boolean;
  onFileChange: (file: File | null) => void;
}

export default function RenewalFileDropbox({ id, label, file, busy = false, onFileChange }: RenewalFileDropboxProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = (candidate: File | null) => {
    if (!candidate) {
      onFileChange(null);
      setError(null);
      return;
    }
    const validationError = validateSignedLeaseFile(candidate);
    if (validationError) {
      onFileChange(null);
      setError(validationError);
      return;
    }
    setError(null);
    onFileChange(candidate);
  };

  const clearFile = () => {
    onFileChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <label
        htmlFor={id}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${dragging ? 'border-primary bg-primary/5' : 'border-border'} ${error ? 'border-danger/60' : ''} focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (busy) return;
          const dropped = e.dataTransfer.files?.[0] ?? null;
          selectFile(dropped);
          if (inputRef.current) inputRef.current.value = '';
        }}
      >
        <IconUpload size={24} className="text-muted-foreground" aria-hidden />
        <span className="text-sm">
          <span className="font-semibold text-primary">{file ? 'Choose a different file' : 'Choose File'}</span> or drag and drop
        </span>
        <span className="max-w-full break-all text-xs text-muted-foreground">{file ? file.name : 'No file chosen · Up to 10 MB'}</span>
        <input
          ref={inputRef}
          id={id}
          aria-label={label}
          type="file"
          accept={SIGNED_LEASE_ACCEPT}
          onChange={(e) => {
            selectFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
          disabled={busy}
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {file && !busy && (
        <div>
          <Button type="button" variant="outline" onPress={clearFile}>
            Remove file
          </Button>
        </div>
      )}
    </div>
  );
}
