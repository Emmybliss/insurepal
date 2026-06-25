import {
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    Pagination as ShadcnPagination,
} from '@/components/ui/pagination';
import { Link } from '@inertiajs/react';

interface PaginationLinkType {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

interface PaginationProps {
    links: PaginationLinkType[];
    meta: PaginationMeta;
}

export function Pagination({ links, meta }: PaginationProps) {
    if (!links || links.length <= 3 || !meta || meta.last_page <= 1) {
        return null;
    }

    const currentPage = meta.current_page;
    const lastPage = meta.last_page;

    // Get previous and next links
    const prevLink = links[0];
    const nextLink = links[links.length - 1];

    // Get page number links (exclude first and last which are prev/next)
    const pageLinks = links.slice(1, -1);

    const renderPageNumbers = () => {
        const items = [];

        // Show first page if we're not near the beginning
        if (currentPage > 3) {
            const firstPageLink = pageLinks.find((link) => link.label === '1');
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        size="default"
                        href={firstPageLink?.url || '#'}
                        isActive={false}
                        {...(firstPageLink?.url ? { asChild: true } : {})}
                    >
                        {firstPageLink?.url ? <Link href={firstPageLink.url}>1</Link> : '1'}
                    </PaginationLink>
                </PaginationItem>,
            );

            // Add ellipsis if there's a gap
            if (currentPage > 4) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }
        }

        // Show pages around current page
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(lastPage, currentPage + 1);

        for (let page = startPage; page <= endPage; page++) {
            const pageLink = pageLinks.find((link) => link.label === page.toString());
            if (pageLink) {
                items.push(
                    <PaginationItem key={page}>
                        <PaginationLink
                            size="default"
                            href={pageLink.url || '#'}
                            isActive={page === currentPage}
                            {...(pageLink.url ? { asChild: true } : {})}
                        >
                            {pageLink.url ? <Link href={pageLink.url}>{page}</Link> : page}
                        </PaginationLink>
                    </PaginationItem>,
                );
            }
        }

        // Show last page if we're not near the end
        if (currentPage < lastPage - 2) {
            // Add ellipsis if there's a gap
            if (currentPage < lastPage - 3) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }

            const lastPageLink = pageLinks.find((link) => link.label === lastPage.toString());
            items.push(
                <PaginationItem key={lastPage}>
                    <PaginationLink size="default" href={lastPageLink?.url || '#'} isActive={false} {...(lastPageLink?.url ? { asChild: true } : {})}>
                        {lastPageLink?.url ? <Link href={lastPageLink.url}>{lastPage}</Link> : lastPage}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing <span className="font-medium">{meta?.from ?? 0}</span> to <span className="font-medium">{meta?.to ?? 0}</span> of{' '}
                <span className="font-medium">{meta?.total ?? 0}</span> results
            </div>

            <ShadcnPagination>
                <PaginationContent>
                    <PaginationItem>
                        {prevLink.url ? (
                            <PaginationPrevious size="default" href={prevLink.url} />
                        ) : (
                            <PaginationPrevious size="default" href="#" className="pointer-events-none opacity-50" />
                        )}
                    </PaginationItem>

                    {renderPageNumbers()}

                    <PaginationItem>
                        {nextLink.url ? (
                            <PaginationNext size="default" href={nextLink.url} />
                        ) : (
                            <PaginationNext size="default" href="#" className="pointer-events-none opacity-50" />
                        )}
                    </PaginationItem>
                </PaginationContent>
            </ShadcnPagination>
        </div>
    );
}
