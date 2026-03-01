import { ReactNode, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  paginated?: boolean;
  defaultPageSize?: number;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  emptyMessage = 'Tidak ada data',
  onRowClick,
  paginated = false,
  defaultPageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = paginated ? data.slice(page * pageSize, (page + 1) * pageSize) : data;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={cn('font-semibold text-foreground', column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50'
                )}
              >
                {columns.map((column, index) => (
                  <TableCell key={index} className={column.className}>
                    {column.cell 
                      ? column.cell(item)
                      : column.accessorKey 
                        ? String(item[column.accessorKey] ?? '-')
                        : '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {paginated && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tampilkan</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>dari {data.length} data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Halaman {page + 1} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
