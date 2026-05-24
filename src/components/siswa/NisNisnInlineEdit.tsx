import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNsm } from '@/hooks/useNsm';

interface Props {
  siswaId: string;
  nis: string;
  nisn: string | null;
  onSaved: (nis: string, nisn: string | null) => void;
}

export function NisNisnInlineEdit({ siswaId, nis, nisn, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftNis, setDraftNis] = useState(nis);
  const [draftNisn, setDraftNisn] = useState(nisn || '');
  const [saving, setSaving] = useState(false);
  const nisRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: nsm } = useNsm();

  useEffect(() => {
    if (editing) {
      setDraftNis(nis);
      setDraftNisn(nisn || '');
      setTimeout(() => nisRef.current?.focus(), 10);
    }
  }, [editing, nis, nisn]);

  const handleSave = useCallback(async () => {
    const trimNis = draftNis.trim();
    const trimNisn = draftNisn.trim() || null;

    if (!trimNis) {
      toast.error('NIS wajib diisi');
      nisRef.current?.focus();
      return;
    }

    if (trimNis === nis && trimNisn === (nisn || null)) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('siswa')
      .update({ nis: trimNis, nisn: trimNisn })
      .eq('id', siswaId);
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        toast.error(`NIS "${trimNis}" sudah terdaftar`);
      } else {
        toast.error('Gagal menyimpan: ' + error.message);
      }
      return;
    }
    toast.success('NIS/NISN tersimpan');
    onSaved(trimNis, trimNisn);
    setEditing(false);
  }, [draftNis, draftNisn, nis, nisn, siswaId, onSaved]);

  // Auto-save on blur outside the container
  useEffect(() => {
    if (!editing) return;
    const handleFocusOut = (e: FocusEvent) => {
      // If focus moves to another element inside the container, ignore
      if (containerRef.current?.contains(e.relatedTarget as Node)) return;
      handleSave();
    };
    const el = containerRef.current;
    el?.addEventListener('focusout', handleFocusOut);
    return () => el?.removeEventListener('focusout', handleFocusOut);
  }, [editing, handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setDraftNis(nis);
      setDraftNisn(nisn || '');
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div ref={containerRef} className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={nisRef}
          value={draftNis}
          onChange={(e) => setDraftNis(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="NIS"
          className="h-7 w-28 text-xs font-mono"
          disabled={saving}
        />
        <Input
          value={draftNisn}
          onChange={(e) => setDraftNisn(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="NISN"
          className="h-7 w-28 text-xs font-mono"
          disabled={saving}
        />
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
      </div>
    );
  }

  return (
    <div
      className="group font-mono text-xs leading-snug cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Klik untuk edit NIS/NISN"
    >
      <span className="font-semibold">{nis}</span>
      {nisn && <span className="text-muted-foreground block">{nisn}</span>}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block ml-1" />
    </div>
  );
}
