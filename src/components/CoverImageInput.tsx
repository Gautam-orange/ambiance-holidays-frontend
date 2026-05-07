import React, { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import apiClient from '../api/client';

/**
 * Cover-image picker used on the admin Add/Edit screens for cars, tours and
 * day-trips. Lets the user either paste an image URL or click "Upload" to
 * push a file through the backend's /uploads/image endpoint (which falls
 * back to local-FS storage when S3 isn't configured).
 */
type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Sub-folder under /uploads/files/{folder}/... for the saved file. */
  folder?: string;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — must match backend ceiling

export default function CoverImageInput({ value, onChange, folder = 'cars' }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await apiClient.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL in response');
      onChange(url);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
      {value ? (
        <div className="w-full aspect-video rounded-2xl overflow-hidden relative">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Cover Image</p>
            <p className="text-xs text-slate-400 mt-1">Upload a file or paste a URL</p>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {uploading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
          : <><Upload className="w-3.5 h-3.5" /> Upload Image</>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {/* type=text (not url) — uploads return a same-origin path like
          "/api/v1/uploads/files/..." which the browser's HTML5 URL validator
          rejects, blocking form submit after a successful upload. */}
      <input
        type="text"
        placeholder="…or paste an image URL"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-primary"
      />

      {error && (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
