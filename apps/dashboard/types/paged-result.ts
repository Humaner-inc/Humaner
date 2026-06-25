export type PagedResult<T> = {
  pageSize: number;
  pageNumber: number;
  totalCount: number;
  totalPages: number;
  records: T[];
};
