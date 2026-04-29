import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Optional breadcrumb override. If omitted, derived from URL path. */
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * PageHeader — gaya formal ala EMIS Kemenag:
 * - Breadcrumb di atas (Home > Section > Page)
 * - Garis aksen hijau di kiri judul
 * - Tipografi tebal & rapi
 */
export function PageHeader({ title, description, icon, actions, breadcrumbs }: PageHeaderProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if not provided
  const crumbs = breadcrumbs ?? (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => ({
      label: seg
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
      href: idx < segments.length - 1
        ? '/' + segments.slice(0, idx + 1).join('/')
        : undefined,
    }));
  })();

  return (
    <div className="mb-4 space-y-2">
      {/* Breadcrumb — gaya EMIS */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-3 w-3" />
          <span>Beranda</span>
        </Link>
        {crumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 opacity-50" />
            {crumb.href ? (
              <Link to={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Header utama — compact, single-line title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-primary/20">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
              {icon}
            </div>
          )}
          {!icon && <div className="w-1 h-10 rounded-full bg-primary shrink-0" />}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight uppercase whitespace-nowrap truncate">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-xs mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
