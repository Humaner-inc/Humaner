'use client';

import * as React from 'react';
import { BuildingIcon, GridIcon, SearchIcon, UserIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';

import { searchParams } from '@/components/dashboard/contacts/contacts-search-params';
import { Button } from '@/components/ui/button';
import { DataTableFilter } from '@/components/ui/data-table';
import { InputSearch } from '@/components/ui/input-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  UnderlinedTabs,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@/components/ui/tabs';
import { MediaQueries } from '@/constants/media-queries';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTransitionContext } from '@/hooks/use-transition-context';
import { RecordsOption } from '@/schemas/contacts/get-contacts-schema';
import type { TagDto } from '@/types/dtos/tag-dto';

export type ContactsFiltersProps = {
  tags: TagDto[];
};

export function ContactsFilters({
  tags
}: ContactsFiltersProps): React.JSX.Element {
  const { startTransition } = useTransitionContext();
  const [showMobileSerch, setShowMobileSearch] = React.useState<boolean>(false);
  const smUp = useMediaQuery(MediaQueries.SmUp, { fallback: false });

  const [searchQuery, setSearchQuery] = useQueryState(
    'searchQuery',
    searchParams.searchQuery.withOptions({
      startTransition,
      shallow: false
    })
  );

  const [records, setRecords] = useQueryState(
    'records',
    searchParams.records.withOptions({
      startTransition,
      shallow: false
    })
  );

  const [selectedTags, setSelectedTags] = useQueryState(
    'tags',
    searchParams.tags.withOptions({
      startTransition,
      shallow: false
    })
  );

  const handleSearchQueryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchQuery(e.target?.value || '');
  };

  const handleShowMobileSearch = (): void => {
    setShowMobileSearch(true);
  };

  const handleHideMobileSearch = (): void => {
    setShowMobileSearch(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <UnderlinedTabs
          value={records}
          onValueChange={(value) => setRecords(value as RecordsOption)}
          className="hidden sm:flex"
        >
          <UnderlinedTabsList className="mr-2 h-12 max-h-12 min-h-12 gap-x-2 border-none">
            {recordsOptions.map((option) => (
              <UnderlinedTabsTrigger
                key={option.value}
                value={option.value}
                className="mx-0 border-t-4 border-t-transparent"
              >
                <div className="flex flex-row items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
                  {option.icon}
                  {option.label}
                </div>
              </UnderlinedTabsTrigger>
            ))}
          </UnderlinedTabsList>
        </UnderlinedTabs>
        <Select
          value={records}
          onValueChange={(value) => setRecords(value as RecordsOption)}
        >
          <SelectTrigger className="flex sm:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recordsOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                <div className="flex flex-row items-center gap-2 pr-2">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DataTableFilter
          title="Tags"
          options={tags.map((tag) => ({ value: tag.text, label: tag.text }))}
          selected={selectedTags || []}
          onChange={setSelectedTags}
        />
      </div>
      <div>
        {smUp ? (
          <InputSearch
            placeholder="Search by name or email..."
            className="w-[240px]"
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleShowMobileSearch}
            >
              <SearchIcon className="size-4 shrink-0" />
            </Button>
            {showMobileSerch && (
              <div className="absolute inset-0 z-30 bg-background pl-3 pr-5">
                <InputSearch
                  autoFocus
                  alwaysShowClearButton
                  placeholder="Search by name or email..."
                  className="h-12 w-full border-none !ring-0"
                  containerClassName="h-12"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  onClear={handleHideMobileSearch}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const recordsOptions = [
  {
    label: 'All',
    value: RecordsOption.All,
    icon: <GridIcon className="size-4 shrink-0" />
  },
  {
    label: 'People',
    value: RecordsOption.People,
    icon: <UserIcon className="size-4 shrink-0" />
  },
  {
    label: 'Companies',
    value: RecordsOption.Companies,
    icon: <BuildingIcon className="size-4 shrink-0" />
  }
];
