import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_VERSION, CHANGELOG } from '@/config/version';

const SEEN_VERSION_KEY = 'whats-new-seen-version';

export function WhatsNewDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(SEEN_VERSION_KEY);
    if (seenVersion !== APP_VERSION) {
      // Small delay so it doesn't compete with splash screen
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
    setOpen(false);
  };

  const latestEntry = CHANGELOG[0];
  if (!latestEntry) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Yang Baru di v{latestEntry.version}
          </DialogTitle>
          <DialogDescription>
            Diperbarui {formatDate(latestEntry.date)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {latestEntry.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5">✦</span>
              <span>{change}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <Button variant="link" size="sm" asChild className="p-0 h-auto">
            <a href="/changelog">Lihat semua perubahan →</a>
          </Button>
          <Button onClick={handleClose} size="sm">Mengerti</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
