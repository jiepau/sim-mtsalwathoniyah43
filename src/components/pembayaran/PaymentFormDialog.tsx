import { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/supabase-helpers';

const paymentSchema = z.object({
  nominal_bayar: z
    .number({ invalid_type_error: 'Nominal harus berupa angka' })
    .positive({ message: 'Nominal harus lebih dari 0' })
    .max(999999999, { message: 'Nominal terlalu besar' }),
});

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sisaTagihan: number;
  onSubmit: (nominalBayar: number) => Promise<void>;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  sisaTagihan,
  onSubmit,
}: PaymentFormDialogProps) {
  const [nominalBayar, setNominalBayar] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNominalBayar('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedValue = parseFloat(nominalBayar);
    
    // Validate using zod schema
    const result = paymentSchema.safeParse({ nominal_bayar: parsedValue });
    
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Nominal tidak valid');
      return;
    }

    // Additional validation: cannot exceed remaining balance
    if (parsedValue > sisaTagihan) {
      setError(`Nominal tidak boleh melebihi sisa tagihan (${formatCurrency(sisaTagihan)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parsedValue);
      onOpenChange(false);
    } catch (err) {
      // Error handling done in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bayar Tagihan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Sisa Tagihan</p>
            <p className="text-lg font-semibold text-destructive">
              {formatCurrency(sisaTagihan)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nominal_bayar">Jumlah Bayar (Rp)</Label>
            <Input
              id="nominal_bayar"
              type="number"
              min="1"
              max={sisaTagihan}
              step="1"
              value={nominalBayar}
              onChange={(e) => {
                setNominalBayar(e.target.value);
                setError('');
              }}
              placeholder="Masukkan jumlah bayar"
              required
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Bayar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
