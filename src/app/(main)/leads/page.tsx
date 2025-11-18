'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  MoreHorizontal,
  Loader2,
  Sparkles,
  Download,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead, ChatSession } from '@/lib/types';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { analyzeSessionsForLeads } from '@/app/actions/leads';
import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';

const columns: ColumnDef<Lead>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name') || 'N/A'}</div>,
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => row.getValue('email') || 'N/A',
  },
  {
    header: 'Phone',
    accessorKey: 'phone',
     cell: ({ row }) => row.getValue('phone') || 'N/A',
  },
  {
    header: 'Summary',
    accessorKey: 'summary',
    cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('summary')}</div>
  },
  {
    header: 'Captured At',
    accessorKey: 'createdAt',
     cell: ({ row }) => {
      const createdAt = row.getValue('createdAt');
      if (!createdAt) return 'N/A';
      const date = (createdAt as Timestamp).toDate();
      return format(date, 'MMM d, yyyy');
    },
  },
  {
    id: 'actions',
    cell: () => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Chat</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    size: 40,
    enableSorting: false,
  },
];

export default function LeadsPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'createdAt',
      desc: true,
    },
  ]);
  
  const [isAnalyzing, startAnalysis] = useTransition();
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();
  const { toast } = useToast();

  const leadsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'leads'));
  }, [user, firestore, activeAgent?.id]);
  
  const { data: leads, loading } = useCollection<Lead>(leadsQuery);

  const sessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'));
  }, [user, firestore, activeAgent?.id]);
  
  const { data: sessions } = useCollection<ChatSession>(sessionsQuery);

  const table = useReactTable({
    data: leads || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  const handleAnalyze = () => {
    if (!user || !activeAgent?.id) return;
    
    startAnalysis(async () => {
        toast({ title: 'Starting analysis...', description: 'Searching for new leads in your chat logs.' });
        const result = await analyzeSessionsForLeads(user.uid, activeAgent.id!);
        if (result.success) {
            toast({ title: 'Analysis Complete!', description: `${result.leadsFound} new lead(s) found.` });
        } else {
            toast({ title: 'Analysis Failed', description: result.error, variant: 'destructive' });
        }
    });
  }

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      toast({
        title: 'No leads to export',
        description: 'There is no data to export to a CSV file.',
        variant: 'destructive',
      });
      return;
    }
    
    const sessionsMap = new Map(sessions?.map(session => [session.id, session]));

    const headers = [
        'Lead Name', 'Lead Email', 'Lead Phone', 'Lead Summary', 'Lead Captured At',
        'Session ID', 'Session Title', 'Source', 'Last Activity',
        'Visitor IP', 'Visitor City', 'Visitor Country', 
        'Browser', 'OS', 'Device Type'
    ];

    const rows = leads.map(lead => {
        const session = lead.sessionId ? sessionsMap.get(lead.sessionId) : undefined;
        
        const leadData = [
            lead.name || 'N/A',
            lead.email || 'N/A',
            lead.phone || 'N/A',
            `"${(lead.summary || 'N/A').replace(/"/g, '""')}"`,
            lead.createdAt ? format((lead.createdAt as Timestamp).toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        ];

        const sessionData = [
            lead.sessionId || 'N/A',
            session?.title || 'N/A',
            'Widget', // Source is static for now
            session?.lastActivity ? format((session.lastActivity as Timestamp).toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
            session?.visitorInfo?.ip || 'N/A',
            session?.visitorInfo?.location?.city || 'N/A',
            session?.visitorInfo?.location?.country || 'N/A',
            `${session?.visitorInfo?.browser?.name || ''} ${session?.visitorInfo?.browser?.version || ''}`.trim() || 'N/A',
            `${session?.visitorInfo?.os?.name || ''} ${session?.visitorInfo?.os?.version || ''}`.trim() || 'N/A',
            session?.visitorInfo?.device?.type || 'Desktop'
        ];

        return [...leadData, ...sessionData].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_with_details.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export successful!', description: 'Your leads have been downloaded as leads_with_details.csv.' });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className='grid gap-2'>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">View and manage leads captured by your agents.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!leads || leads.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze conversations
            </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                        className="h-11 px-3"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <ChevronUpIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                              desc: (
                                <ChevronDownIcon
                                  className="shrink-0 opacity-60"
                                  size={16}
                                  aria-hidden="true"
                                />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No leads found. Click "Analyze conversations" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Label htmlFor="rows-per-page" className="max-sm:sr-only">
              Rows per page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger id="rows-per-page" className="w-fit whitespace-nowrap h-9 px-3 py-2">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex grow justify-center text-sm whitespace-nowrap text-muted-foreground">
            <p
              className="text-sm whitespace-nowrap text-muted-foreground"
              aria-live="polite"
            >
              Page{' '}
              <span className="font-medium text-foreground">
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>
            </p>
          </div>
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to first page"
                  >
                    <ChevronFirstIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeftIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to next page"
                  >
                    <ChevronRightIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to last page"
                  >
                    <ChevronLastIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
