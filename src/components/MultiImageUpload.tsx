import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle, Star } from 'lucide-react';
import apiClient from '../api/client';

/**
 * Multi-image picker for car listings. AM_008: replaces the old "paste image
 * URL" text input with a dedicated upload area. Enforces caller-supplied
 * limits on file count + per-file size and surfaces inline error messages.
 *
 * First image is treated as the cover; the rest go to gallery. The caller
 * gets both fields via `onChange(cover, gallery)`.
 */
type Props = {
  cover: string;
  gallery: string[];
  onChange: (cover: string, gallery: string[]) => void;
  /** Total images allowed (cover + gallery). Default 5. */
  maxImages?: number;
  /** Per-file size cap in bytes. Default 5 MB. */
  maxBytes?: number;
  folder?: string;
};

const DEFAULT_MAX_IMAGES = 5;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export default function MultiImageUpload({
  cover, gallery, onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxBytes = DEFAULT_MAX_BYTES,
  folder = 'cars',
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allImages = [cover, ...gallery].filter(Boolean) as string[];
  const remaining = Math.max(0, maxImages - allImages.length);

  const setFromList = (list: string[]) => {
    const [first, ...rest] = list;
    onChange(first ?? '', rest);
  };

  const pick = () => {
    if (remaining === 0) {
      setError(`Maximum ${maxImages} image${maxImages === 1 ? '' : 's'} allowed.`);
      return;
    }
    inputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const picked = Array.from(files);
    if (picked.length > remaining) {
      setError(`You can upload only ${remaining} more image${remaining === 1 ? '' : 's'} (max ${maxImages}).`);
      return;
    }
    for (const f of picked) {
      if (!f.type.startsWith('image/')) {
        setError('Only image files are supported.');
        return;
      }
      if (f.size > maxBytes) {
        const mb = Math.round(maxBytes / 1024 / 1024);
        setError(`"${f.name}" is too large — each image must be ${mb} MB or smaller.`);
        return;
      }
    }

    setUploading(true);
    const next = [...allImages];
    try {
      for (const f of picked) {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('folder', folder);
        const res = await apiClient.post('/uploads/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res.data?.data?.url;
        if (!url) throw new Error('Upload returned no URL');
        next.push(url);
      }
      setFromList(next);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => {
    const next = allImages.filter((_, i) => i !== idx);
    setFromList(next);
  };

  const makeCover = (idx: number) => {
    if (idx === 0) return;
    const next = [...allImages];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    setFromList(next);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-700">Car Images</p>
          <p className="text-xs text-slate-400 mt-1">
            Upload up to {maxImages} images. Each image must be {Math.round(maxBytes / 1024 / 1024)} MB or less.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {allImages.length} / {maxImages}
        </span>
      </div>

      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((url, idx) => (
            <div key={url + idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
              <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 flex items-center gap-1 bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  <Star className="w-2.5 h-2.5 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx !== 0 && (
                  <button type="button" onClick={() => makeCover(idx)}
                    className="bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded hover:bg-brand-primary hover:text-white">
                    Set as cover
                  </button>
                )}
                <button type="button" onClick={() => removeAt(idx)}
                  className="bg-red-500 text-white rounded-full p-1.5" title="Remove">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={pick}
        disabled={uploading || remaining === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          : remaining === 0
            ? <>Limit reached ({maxImages} images)</>
            : <><Upload className="w-4 h-4" /> Add image{remaining > 1 ? 's' : ''} ({remaining} left)</>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
