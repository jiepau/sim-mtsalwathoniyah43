import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ActivityLogEntry {
  id: string;
  user_name: string;
  user_role: string | null;
  action: string;
  description: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  bendahara: 'Bendahara',
  operator: 'Operator',
  guru: 'Guru',
};

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setLogs(data as ActivityLogEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('activity-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitas Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(log.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {ROLE_LABELS[log.user_role || ''] || log.user_role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
