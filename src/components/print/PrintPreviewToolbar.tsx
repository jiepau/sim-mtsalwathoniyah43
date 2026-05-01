import { Eye, EyeOff, Printer, FileDigit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type PrintOrientation = 'portrait' | 'landscape';

interface PrintPreviewToolbarProps {
  preview: boolean;
  onTogglePreview: (next: boolean) => void;
  orientation: PrintOrientation;
  onOrientationChange: (o: PrintOrientation) => void;
  onPrint: () => void;
  disabled?: boolean;
  /** Optional small footnote shown only in preview mode */
  hint?: string;
}

/**
 * Reusable preview/print control bar.
 * Use together with <PrintPreviewFrame> and the helper CSS in
 * src/components/print/printPreview.css (auto-imported here).
 */
export function PrintPreviewToolbar({
  preview, onTogglePreview, orientation, onOrientationChange, onPrint,
  disabled, hint,
}: PrintPreviewToolbarProps) {
  return (
    <div className="no-print flex items-end justify-between gap-3 flex-wrap rounded-lg border bg-card p-3">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Orientasi</Label>
          <Select value={orientation} onValueChange={(v) => onOrientationChange(v as PrintOrientation)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait (tegak)</SelectItem>
              <SelectItem value="landscape">Landscape (lebar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hint && preview && (
          <p className="text-[11px] text-muted-foreground max-w-xs leading-tight">
            <FileDigit className="inline h-3 w-3 mr-1" />
            {hint}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={preview ? 'secondary' : 'outline'}
          onClick={() => onTogglePreview(!preview)}
          disabled={disabled}
        >
          {preview ? (
            <><EyeOff className="h-4 w-4 mr-2" /> Tutup Pratinjau</>
          ) : (
            <><Eye className="h-4 w-4 mr-2" /> Pratinjau A4</>
          )}
        </Button>
        <Button onClick={onPrint} disabled={disabled}>
          <Printer className="h-4 w-4 mr-2" />
          Cetak / PDF
        </Button>
      </div>
    </div>
  );
}

/**
 * Wraps the printable content. When `preview` is true, the children are
 * rendered inside an A4-sized "page" with a gray backdrop so the user can
 * see exactly how the printed page will look.
 *
 * The element is also tagged with `data-print-orientation` so the global
 * @page CSS can switch portrait/landscape on actual print.
 */
export function PrintPreviewFrame({
  preview, orientation, children,
}: {
  preview: boolean;
  orientation: PrintOrientation;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isLandscape = orientation === 'landscape';
  const pageW = isLandscape ? '297mm' : '210mm';
  const pageH = isLandscape ? '210mm' : '297mm';

  // Tag the body-level portal that contains this print-root so CSS can
  // selectively show ONLY this branch during print (no :has() needed).
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    let el: HTMLElement | null = node;
    while (el && el.parentElement && el.parentElement !== document.body) {
      el = el.parentElement;
    }
    if (el && el.parentElement === document.body) {
      el.classList.add('print-portal');
      return () => el?.classList.remove('print-portal');
    }
  }, [preview]);

  if (!preview) {
    return (
      <div ref={rootRef} data-print-orientation={orientation} className="print-root">
        {children}
        <PrintOrientationStyle orientation={orientation} />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-print-orientation={orientation}
      className="print-root print-preview-backdrop bg-muted/40 rounded-lg p-4 overflow-auto"
    >
      <div
        className="print-preview-page mx-auto bg-white text-black shadow-lg"
        style={{
          width: pageW,
          minHeight: pageH,
          padding: '12mm',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
      <PrintOrientationStyle orientation={orientation} />
    </div>
  );
}

function PrintOrientationStyle({ orientation }: { orientation: PrintOrientation }) {
  return (
    <style>{`
      @media print {
        @page { size: A4 ${orientation}; margin: 12mm; }
      }
    `}</style>
  );
}
