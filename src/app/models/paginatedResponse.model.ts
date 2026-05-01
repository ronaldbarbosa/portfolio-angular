
export interface PaginatedResponse<T> {
  items: T[];
  totalItemCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
