'use client';

import {
    ChevronFirstIcon,
    ChevronLastIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
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
import type { Lead } from '@/lib/types';

interface LeadsPaginationProps {
    table: Table<Lead>;
}

export function LeadsPagination({ table }: LeadsPaginationProps) {
    return (
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
    );
}
