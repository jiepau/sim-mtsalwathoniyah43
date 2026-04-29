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
    <div className="mb-6 space-y-3">
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

      {/* Header utama — formal, ada accent bar kiri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-primary/20">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              {icon}
            </div>
          )}
          {!icon && <div className="w-1 h-12 rounded-full bg-primary" />}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight uppercase">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
