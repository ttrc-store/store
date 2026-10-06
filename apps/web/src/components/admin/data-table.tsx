'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching the query.',
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter((item) => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(term);
    });
  }, [data, searchKey, searchTerm]);

  // Paginate data
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className={cn('space-y-4', className)}>
      {searchKey && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-9 text-xs rounded-xl bg-white border-slate-200"
            />
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredData.length} total entries
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-[#EEE8FA]/20 transition-colors">
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox size={28} className="mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-600">{emptyTitle}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
