import { useState, useMemo } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
}

export function usePagination<T>(
  data: T[] | undefined,
  options: UsePaginationOptions = {}
) {
  const { initialPage = 1, initialItemsPerPage = 10 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to page 1 when data changes significantly
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const start = (safeCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, safeCurrentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    paginatedData,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange,
  };
}
