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

  return (
    <section
      className={cn('rounded-xl border border-border/60 bg-card', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <h2 className="font-mono text-sm font-medium leading-none">
          Team
          <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
            {members.length}
          </span>
        </h2>
        <Link
          href={Routes.OrganizationTeam}
          className="group inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {members.length > 0 ? (
        <>
          <div className="border-b border-border/50 px-4 py-3">
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

          <ul className="m-0 list-none divide-y divide-border/50 overflow-hidden rounded-lg border">
            {previewMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <Avatar className="size-7">
                  {member.image ? (
                    <AvatarImage
                      src={member.image}
                      alt={member.name}
                    />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{member.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px]"
                >
                  {memberRoleLabel(member)}
                </Badge>
              </li>
            ))}
          </ul>

          {members.length > PREVIEW_LIMIT ? (
            <p className="border-t border-border/50 py-2 text-center font-mono text-[10px] text-muted-foreground">
              +{members.length - PREVIEW_LIMIT} more
            </p>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            You&apos;re the only member.
          </p>
          <Link
            href={Routes.OrganizationTeam}
            className="mt-2 inline-block text-xs text-foreground underline underline-offset-4"
          >
            Invite teammates
          </Link>
        </div>
      )}
    </section>
  );
}
