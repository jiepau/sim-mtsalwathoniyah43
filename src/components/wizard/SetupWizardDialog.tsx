import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SetupWizard } from './SetupWizard';

interface SetupWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetupWizardDialog({ open, onOpenChange }: SetupWizardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Setup Wizard</DialogTitle>
        </DialogHeader>
        <SetupWizard onClose={() => onOpenChange(false)} isModal />
      </DialogContent>
    </Dialog>
  );
}
