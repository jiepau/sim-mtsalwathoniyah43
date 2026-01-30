import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  School, 
  Users, 
  Receipt, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSetupWizard, SetupStatus } from '@/hooks/useSetupWizard';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  statusKey: keyof Pick<SetupStatus, 'hasTahunAjaran' | 'hasKelas' | 'hasSiswa' | 'hasJenisTagihan'>;
}

const steps: WizardStep[] = [
  {
    id: 1,
    title: 'Tahun Ajaran',
    description: 'Buat tahun ajaran aktif untuk memulai',
    icon: Calendar,
    path: '/tahun-ajaran',
    statusKey: 'hasTahunAjaran',
  },
  {
    id: 2,
    title: 'Data Kelas',
    description: 'Tambahkan daftar kelas yang tersedia',
    icon: School,
    path: '/kelas',
    statusKey: 'hasKelas',
  },
  {
    id: 3,
    title: 'Data Siswa',
    description: 'Input data siswa atau import dari file',
    icon: Users,
    path: '/siswa',
    statusKey: 'hasSiswa',
  },
  {
    id: 4,
    title: 'Jenis Tagihan',
    description: 'Tentukan jenis tagihan (SPP, dll)',
    icon: Receipt,
    path: '/jenis-tagihan',
    statusKey: 'hasJenisTagihan',
  },
];

interface SetupWizardProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function SetupWizard({ onClose, isModal = false }: SetupWizardProps) {
  const navigate = useNavigate();
  const status = useSetupWizard();
  const [activeStep, setActiveStep] = useState(() => {
    // Find first incomplete step
    const firstIncomplete = steps.findIndex(step => !status[step.statusKey]);
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });

  const completedSteps = steps.filter(step => status[step.statusKey]).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleGoToStep = (step: WizardStep) => {
    if (onClose) onClose();
    navigate(step.path);
  };

  const getNextIncompleteStep = () => {
    return steps.find(step => !status[step.statusKey]);
  };

  if (status.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status.isComplete) {
    return (
      <Card className={cn("border-success/30 bg-success/5", isModal && "border-0 shadow-none")}>
        <CardContent className="p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Setup Selesai! 🎉</h3>
          <p className="text-muted-foreground mb-4">
            Semua data dasar sudah lengkap. Sistem siap digunakan.
          </p>
          {onClose && (
            <Button onClick={onClose}>Tutup</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const nextStep = getNextIncompleteStep();

  return (
    <div className={cn("space-y-6", isModal && "max-h-[70vh] overflow-y-auto")}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Setup Awal
        </div>
        <h2 className="text-2xl font-bold">Selamat Datang!</h2>
        <p className="text-muted-foreground">
          Mari siapkan data dasar untuk memulai sistem
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedSteps} dari {steps.length} selesai</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = status[step.statusKey];
          const isCurrent = !isCompleted && steps.slice(0, index).every(s => status[s.statusKey]);
          
          return (
            <Card 
              key={step.id}
              className={cn(
                "transition-all cursor-pointer hover:shadow-md",
                isCompleted && "bg-success/5 border-success/30",
                isCurrent && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => handleGoToStep(step)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Step Number/Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    isCompleted ? "bg-success text-success-foreground" : 
                    isCurrent ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{step.title}</h4>
                      {isCompleted && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          Selesai
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">
                          Langkah Saat Ini
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isCompleted ? "text-success" : "text-muted-foreground"
                  )} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Button */}
      {nextStep && (
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => handleGoToStep(nextStep)}
        >
          Mulai dari {nextStep.title}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
