import { useState, useRef, useEffect } from 'react';
import { Phone, Pencil, Check, X, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  siswaId: string;
  value: string | null;
  onSaved: (newValue: string | null) => void;
  /** if false, render plain text (no edit) — used for read-only roles */
  canEdit?: boolean;
}

/**
 * Normalize phone number: strip non-digits, convert 08xx -> 628xx,
 * strip leading 62 prefix if duplicated, return cleaned digits.
 * Empty string means "no number".
 */
export function normalizeWa(raw: string): string {
  let s = (raw || '').replace(/[^\d]/g, '');
  if (!s) return '';
  // Remove a leading 0
  if (s.startsWith('0')) s = '62' + s.substring(1);
  // Add 62 if missing
  else if (!s.startsWith('62')) s = '62' + s;
  return s;
}

/** Validate Indonesian mobile: 62 + 9..13 digits (total 11..15) */
function isValidWa(digits: string): boolean {
  if (!digits) return true; // empty is allowed (clearing)
  return /^62\d{8,13}$/.test(digits);
}

/** Format for display: 62 812-3456-7890 */
function formatDisplay(digits: string): string {
  if (!digits) return '';
  const rest = digits.substring(2);
  const parts = rest.match(/^(\d{1,4})(\d{0,4})(\d{0,5})$/);
  if (!parts) return digits;
  return `+62 ${[parts[1], parts[2], parts[3]].filter(Boolean).join('-')}`;
}

export function WaOrtuInlineEdit({ siswaId, value, onSaved, canEdit = true }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value || '');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [editing, value]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    const normalized = trimmed ? normalizeWa(trimmed) : '';

    if (!isValidWa(normalized)) {
      toast.error('Nomor WA tidak valid (harus 10-15 digit)');
      inputRef.current?.focus();
      return;
    }

    const newVal = normalized || null;
    if (newVal === (value || null)) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('siswa')
      .update({ wa_ortu: newVal })
      .eq('id', siswaId);
    setSaving(false);

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
      return;
    }
    toast.success('Nomor WA tersimpan');
    onSaved(newVal);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            else if (e.key === 'Escape') handleCancel();
          }}
          placeholder="08xxxxxxxxxx"
          inputMode="tel"
          className="h-8 w-40 text-xs"
          disabled={saving}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleSave}
          disabled={saving}
          title="Simpan (Enter)"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleCancel}
          disabled={saving}
          title="Batal (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!value) {
    if (!canEdit) return <span className="text-muted-foreground">-</span>;
    return (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <Plus className="h-3 w-3 mr-1" />
        Tambah
      </Button>
    );
  }

  const normalized = normalizeWa(value);
  return (
    <div className="group inline-flex items-center gap-1">
      <a
        href={`https://wa.me/${normalized}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline text-xs"
        onClick={(e) => e.stopPropagation()}
        title={formatDisplay(normalized)}
      >
        <Phone className="h-3 w-3" />
        {value}
      </a>
      {canEdit && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          title="Edit nomor WA"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
