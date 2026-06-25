import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';

import {
  GetContactsSortBy,
  RecordsOption
} from '@/schemas/contacts/get-contacts-schema';
import { SortDirection } from '@/types/sorty-direction';

export const searchParams = {
  pageIndex: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(50),
  records: parseAsStringLiteral(Object.values(RecordsOption)).withDefault(
    RecordsOption.All
  ),
  sortBy: parseAsStringLiteral(Object.values(GetContactsSortBy)).withDefault(
    GetContactsSortBy.Name
  ),
  sortDirection: parseAsStringLiteral(Object.values(SortDirection)).withDefault(
    SortDirection.Asc
  ),
  searchQuery: parseAsString.withDefault(''),
  tags: parseAsArrayOf(parseAsString).withDefault([])
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serializer = createSerializer(searchParams);
