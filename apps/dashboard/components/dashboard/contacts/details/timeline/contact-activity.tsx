'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { ContactTimelineActivity } from '@/components/dashboard/contacts/details/timeline/contact-timeline-activity';
import { ContactTimelineAddComment } from '@/components/dashboard/contacts/details/timeline/contact-timeline-add-comment';
import { ContactTimelineComment } from '@/components/dashboard/contacts/details/timeline/contact-timeline-comment';
import { Button } from '@/components/ui/button';
import { ResponsiveScrollArea } from '@/components/ui/scroll-area';
import { MediaQueries } from '@/constants/media-queries';
import type { ContactDto } from '@/types/dtos/contact-dto';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { TimelineEventDto } from '@/types/dtos/timeline-event-dto';

const threshold = 6;

export type ContactActivityProps = {
  profile: ProfileDto;
  contact: ContactDto;
  events: TimelineEventDto[];
};

export function ContactActivity({
  profile,
  contact,
  events
}: ContactActivityProps): React.JSX.Element {
  const [showComments, setShowComments] = React.useState<boolean>(true);
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const amount = showComments
    ? events.length
    : events.filter((event) => event.type !== 'comment').length;
  const handleToggleShowMore = (): void => {
    setShowMore((value) => !value);
  };
  return (
    <ResponsiveScrollArea
      breakpoint={MediaQueries.MdUp}
      mediaQueryOptions={{ ssr: true }}
      className="h-full"
    >
      <div className="size-full max-w-xl grow p-6">
        <div className="overflow-visible border-none bg-transparent">
          <ul
            role="list"
            className="space-y-6"
          >
            <li className="relative flex gap-x-4">
              <Line position="start" />
              <ContactTimelineAddComment
                profile={profile}
                contact={contact}
                showComments={showComments}
                onShowCommentsChange={setShowComments}
              />
            </li>
            {events
              .filter((event) => showComments || event.type !== 'comment')
              .slice(0, showMore ? amount : threshold)
              .map((event, index) => (
                <li
                  key={event.id}
                  className="relative flex gap-x-4 py-2"
                >
                  <Line
                    position={
                      index ===
                      (showMore ? amount : Math.min(amount, threshold)) - 1
                        ? 'end'
                        : 'middle'
                    }
                  />
                  {event.type === 'activity' && (
                    <ContactTimelineActivity event={event} />
                  )}
                  {event.type === 'comment' && (
                    <ContactTimelineComment
                      profile={profile}
                      event={event}
                    />
                  )}
                </li>
              ))}
            {amount > threshold && (
              <li className="ml-8">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleShowMore}
                >
                  {showMore ? 'Show less' : 'Show more'}
                  {showMore ? (
                    <ChevronUpIcon className="ml-1 size-4 shrink-0" />
                  ) : (
                    <ChevronDownIcon className="ml-1 size-4 shrink-0" />
                  )}
                </Button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </ResponsiveScrollArea>
  );
}

type LineProps = {
  position: 'start' | 'middle' | 'end';
};

function Line({ position }: LineProps): React.JSX.Element {
  if (position === 'start') {
    return (
      <div className="absolute -bottom-6 left-0 top-3 flex w-6 justify-center">
        <div className="w-px bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (position === 'middle') {
    return (
      <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
        <div className="w-px bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 flex size-6 justify-center">
      <div className="w-px bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
