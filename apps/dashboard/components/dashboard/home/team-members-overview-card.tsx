import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from '@humaner/shared/icons';
import { Role, WorkspaceRole } from '@prisma/client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Badge } from '@/components/ui/badge';
import { Routes } from '@/constants/routes';
import { cn, getInitials } from '@/lib/utils';
import type { MemberDto } from '@/types/dtos/member-dto';

const PREVIEW_LIMIT = 4;

export type TeamMembersOverviewCardProps = {
  members: MemberDto[];
  className?: string;
};

function memberRoleLabel(member: MemberDto): string {
  if (member.role === Role.ADMIN) {
    return 'Platform admin';
  }

  return member.workspaceRole === WorkspaceRole.OWNER ? 'Owner' : 'Teammate';
}

export function TeamMembersOverviewCard({
  members,
  className
}: TeamMembersOverviewCardProps): React.JSX.Element {
  const previewMembers = members.slice(0, PREVIEW_LIMIT);
  const ownerCount = members.filter(
    (member) => member.workspaceRole === WorkspaceRole.OWNER
  ).length;

  return (
    <section
      className={cn('flex flex-col rounded-xl border bg-card p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Team
          </p>
          <h2 className="mt-1 font-display text-lg leading-none">
            Team members
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? '' : 's'}
            {ownerCount > 0
              ? ` · ${ownerCount} owner${ownerCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
        <Link
          href={Routes.OrganizationTeam}
          className="group inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage team
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {members.length > 0 ? (
        <>
          <div className="mt-5">
            <AvatarGroup
              avatars={members.map((member) => ({
                id: member.id,
                name: member.name,
                image: member.image
              }))}
              max={6}
              size="sm"
              spacing="tight"
            />
          </div>

          <ul className="mt-5 flex-1 divide-y rounded-lg border">
            {previewMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Avatar className="size-8">
                  {member.image ? (
                    <AvatarImage
                      src={member.image}
                      alt={member.name}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[11px]"
                >
                  {memberRoleLabel(member)}
                </Badge>
              </li>
            ))}
          </ul>

          {members.length > PREVIEW_LIMIT ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              +{members.length - PREVIEW_LIMIT} more on the team page
            </p>
          ) : null}
        </>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            You&apos;re the only member so far.
          </p>
          <Link
            href={Routes.OrganizationTeam}
            className="mt-3 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Invite teammates
          </Link>
        </div>
      )}
    </section>
  );
}
