import { useState } from 'react';
import { 
  Info, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG } from '@/config/version';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';

export function VersionChecker() {
  const { updateInfo, checking, checkForUpdates } = useUpdateChecker();
  const [changelogOpen, setChangelogOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Determine if we should show update status (only after checking)
  const showUpdateStatus = updateInfo.checkedAt !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Informasi Aplikasi
        </CardTitle>
        <CardDescription>
          Versi aplikasi dan riwayat pembaruan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Version */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Versi Saat Ini:</span>
              <Badge variant="secondary" className="font-mono">
                v{APP_VERSION}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Dibangun pada {formatDate(APP_BUILD_DATE)}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkForUpdates}
            disabled={checking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Memeriksa...' : 'Cek Update'}
          </Button>
        </div>

        {/* Update Status */}
        {showUpdateStatus && (
          <div className={`p-4 rounded-lg border ${
            updateInfo.error 
              ? 'bg-destructive/10 border-destructive/20' 
              : updateInfo.hasUpdate 
                ? 'bg-primary/10 border-primary/20' 
                : 'bg-success/10 border-success/20'
          }`}>
            {updateInfo.error ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Gagal Memeriksa Update</p>
                  <p className="text-sm text-muted-foreground">{updateInfo.error}</p>
                </div>
              </div>
            ) : updateInfo.hasUpdate ? (
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-primary">Update Tersedia!</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Versi <span className="font-mono font-medium">v{updateInfo.latestVersion}</span> sudah tersedia.
                    Anda menggunakan versi <span className="font-mono">v{APP_VERSION}</span>.
                  </p>
                  {updateInfo.releaseUrl && (
                    <Button size="sm" asChild>
                      <a href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Lihat Release Notes
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="font-medium text-success">Aplikasi Sudah Terbaru</p>
                  <p className="text-sm text-muted-foreground">
                    Anda menggunakan versi terbaru (v{APP_VERSION}).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Changelog */}
        <Collapsible open={changelogOpen} onOpenChange={setChangelogOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Riwayat Perubahan (Changelog)</span>
              {changelogOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {CHANGELOG.map((entry, index) => (
                <div 
                  key={entry.version} 
                  className={`p-4 rounded-lg ${
                    index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="font-mono">
                      v{entry.version}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Terbaru
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1.5">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
