import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (editing) {
      setDraftNis(nis);
      setDraftNisn(nisn || '');
      setTimeout(() => nisRef.current?.focus(), 10);
    }
  }, [editing, nis, nisn]);

  const handleSave = async () => {
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
  };

  const handleCancel = () => {
    setDraftNis(nis);
    setDraftNisn(nisn || '');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
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
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleSave}
            disabled={saving}
            title="Simpan (Enter)"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleCancel}
            disabled={saving}
            title="Batal (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
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
