import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Sparkles, History } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG } from '@/config/version';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function Changelog() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pembaruan"
        description="Catatan perubahan dan fitur baru di setiap versi aplikasi"
      />

      {/* Current Version Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Versi Saat Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge className="font-mono text-sm px-3 py-1">v{APP_VERSION}</Badge>
            <span className="text-sm text-muted-foreground">
              Dibangun pada {formatDate(APP_BUILD_DATE)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Changelog Entries */}
      <div className="space-y-4">
        {CHANGELOG.map((entry, index) => (
          <Card key={entry.version} className={index === 0 ? 'border-primary/30' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant={index === 0 ? 'default' : 'secondary'} className="font-mono">
                    v{entry.version}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">Terbaru</Badge>
                  )}
                </CardTitle>
                <CardDescription className="ml-auto text-xs">
                  {formatDate(entry.date)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
