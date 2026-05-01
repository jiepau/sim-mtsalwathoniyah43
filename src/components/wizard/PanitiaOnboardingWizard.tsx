import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PanitiaStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const steps: PanitiaStep[] = [
  {
    id: 1,
    title: 'Lihat Dashboard',
    description: 'Pantau statistik dan ringkasan data madrasah',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 2,
    title: 'Buka Halaman SPMB',
    description: 'Kelola pendaftaran dan pengaturan penerimaan murid baru',
    icon: UserPlus,
    path: '/spmb',
  },
  {
    id: 3,
    title: 'Verifikasi Pendaftar',
    description: 'Periksa data, terima atau tolak calon siswa',
    icon: UserCheck,
    path: '/spmb',
  },
  {
    id: 4,
    title: 'Export Data EMIS 4.0',
    description: 'Download CSV pendaftar diterima untuk import ke EMIS 4.0',
    icon: FileSpreadsheet,
    path: '/spmb',
  },
];

const STORAGE_KEY = 'panitia_onboarding_done';

export function usePanitiaOnboarding() {
  const isDone = localStorage.getItem(STORAGE_KEY) === 'true';
  const markDone = () => localStorage.setItem(STORAGE_KEY, 'true');
  return { isDone, markDone };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PanitiaOnboardingWizard({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const { markDone } = usePanitiaOnboarding();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = () => {
    markDone();
    onClose();
    navigate('/spmb');
  };

  const handleSkip = () => {
    markDone();
    onClose();
  };

  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Selamat Datang, Panitia SPMB!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Panduan singkat untuk memulai tugas Anda sebagai Panitia Sistem Penerimaan Murid Baru.
          </p>

          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            Langkah {currentStep + 1} dari {steps.length}
          </p>

          {/* Steps overview */}
          <div className="space-y-2">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                    isActive && 'border-primary bg-primary/5 shadow-sm',
                    isPast && 'border-green-200 bg-green-50',
                    !isActive && !isPast && 'border-border opacity-60'
                  )}
                  onClick={() => setCurrentStep(idx)}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-full shrink-0',
                      isPast && 'bg-green-500 text-white',
                      isActive && 'bg-primary text-primary-foreground',
                      !isActive && !isPast && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', isActive && 'text-primary')}>{s.title}</p>
                    {isActive && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    )}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Lewati
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                  Kembali
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={handleFinish} className="gap-1">
                  Mulai Bekerja <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext} className="gap-1">
                  Lanjut <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
