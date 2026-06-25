import * as React from 'react';

import type { Metadata } from 'next';

import Link from 'next/link';

import { getPlanForTier } from '@humaner/shared/plans';

import { ArrowUpRight, BarChart3, BookOpen, Bot, Plus } from '@humaner/shared/icons';



import { AgentOverviewCard } from '@/components/dashboard/home/agent-overview-card';

import { IndustryTag } from '@/components/dashboard/home/industry-tag';

import { Button } from '@/components/ui/button';

import { EmptyState } from '@/components/ui/empty-state';

import { SectionPage } from '@/components/ui/section-shell';
import { Routes } from '@/constants/routes';

import { getAgentsOverview } from '@/data/agents/get-agents-overview';

import { dedupedAuth } from '@/lib/auth';

import { prisma } from '@/lib/db/prisma';

import { getBusinessLogoUrl } from '@/lib/urls/get-business-logo-url';

import { createTitle } from '@/lib/utils';



export const metadata: Metadata = {

  title: createTitle('Overview')

};



export default async function HomePage(): Promise<React.JSX.Element> {

  const session = await dedupedAuth();

  const [organization, agents] = await Promise.all([

    session?.user?.organizationId

      ? prisma.organization.findFirst({

          where: { id: session.user.organizationId },

          select: {

            name: true,

            website: true,

            logoUrl: true,

            industry: true,

            tier: true

          }

        })

      : Promise.resolve(null),

    getAgentsOverview()

  ]);



  const plan = getPlanForTier(organization?.tier ?? 'free');

  const logoUrl = getBusinessLogoUrl(organization?.website, {
    logoUrl: organization?.logoUrl
  });



  return (

    <SectionPage width="lg">

        <div className="space-y-8">

          <div className="flex justify-end">
            <Button
              asChild
              size="sm"
            >
              <Link href={Routes.Agents}>
                <Plus className="mr-1.5 size-4" />
                New agent
              </Link>
            </Button>
          </div>

          <section className="flex flex-col gap-5 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-secondary">

                {logoUrl ? (

                  // eslint-disable-next-line @next/next/no-img-element

                  <img

                    src={logoUrl}

                    alt={`${organization?.name ?? 'Business'} logo`}

                    width={56}

                    height={56}

                    className="size-full object-cover"

                  />

                ) : (

                  <Bot className="size-6 text-muted-foreground" />

                )}

              </div>

              <div className="space-y-2">

                <h2 className="font-display text-2xl leading-none">

                  {organization?.name ?? 'Your business'}

                </h2>

                <IndustryTag industry={organization?.industry ?? null} />

              </div>

            </div>

            <div className="rounded-lg border bg-secondary/40 px-4 py-3 text-sm">

              <p className="text-muted-foreground">Current plan</p>

              <p className="mt-0.5 font-display text-lg leading-none">

                {plan.name}

              </p>

              <p className="mt-1 text-xs text-muted-foreground">

                {plan.modelLabel} · {plan.includedMessages.toLocaleString()}{' '}

                messages/mo

              </p>

            </div>

          </section>



          <section className="space-y-4">

            <div className="flex items-end justify-between gap-4">

              <div>

                <h2 className="font-display text-2xl leading-none">

                  Your agents

                </h2>

                <p className="mt-1.5 text-sm text-muted-foreground">

                  Satisfaction from resolved issues · expertise from trained docs

                  and answer coverage.

                </p>

              </div>

              {agents.length > 0 && (

                <Button

                  asChild

                  variant="outline"

                  size="sm"

                >

                  <Link href={Routes.Agents}>View all</Link>

                </Button>

              )}

            </div>



            {agents.length === 0 ? (

              <EmptyState

                icon={<Bot className="size-8 text-muted-foreground" />}

                title="No agents yet"

                description="Create your first character, feed it knowledge, and track how well it resolves issues."

              >

                <Button asChild>

                  <Link href={Routes.Agents}>Create an agent</Link>

                </Button>

              </EmptyState>

            ) : (

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {agents.map((agent) => (

                  <AgentOverviewCard

                    key={agent.id}

                    agent={agent}

                  />

                ))}

              </div>

            )}

          </section>



          <section className="grid gap-4 md:grid-cols-3">

            <QuickLinkCard

              href={Routes.Agents}

              icon={Bot}

              title="Agents"

              description="Create and configure personality-driven support agents."

            />

            <QuickLinkCard

              href={Routes.Knowledge}

              icon={BookOpen}

              title="Knowledge"

              description="Ingest URLs, PDFs, and text for grounded answers."

            />

            <QuickLinkCard

              href={Routes.Analytics}

              icon={BarChart3}

              title="Analytics"

              description="Track volume, gaps, and resolution over time."

            />

          </section>

        </div>

    </SectionPage>

  );

}



type QuickLinkCardProps = {

  href: string;

  icon: React.ComponentType<{ className?: string }>;

  title: string;

  description: string;

};



function QuickLinkCard({

  href,

  icon: Icon,

  title,

  description

}: QuickLinkCardProps): React.JSX.Element {

  return (

    <Link
      href={href}
      className="group relative flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary/25 hover:bg-primary/[0.02]"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-5 shrink-0 text-primary" />
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
      <ArrowUpRight
        className="absolute bottom-4 right-4 size-4 text-primary/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>

  );

}


