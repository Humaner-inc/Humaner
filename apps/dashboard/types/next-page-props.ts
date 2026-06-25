// Taken from
// import { type Params } from 'next/dist/server/request/params';
// import { type SearchParams } from 'next/dist/server/request/search-params';

export type Params = Record<string, string | Array<string> | undefined>;
export type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export type NextPageProps = {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
};
