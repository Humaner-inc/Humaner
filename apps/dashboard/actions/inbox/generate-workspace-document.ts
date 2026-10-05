'use server';

import { WorkspaceDocumentKind } from '@prisma/client';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import { extractMailDocument } from '@/lib/inbox/extract-mail-document';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { resolveMailBrandLogoUrl } from '@/lib/inbox/resolve-mail-brand-logo';
import { addDays } from '@/lib/inbox/workspace-document-view';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

const kindSchema = z.enum(['invoice', 'quote']);

function prefixFor(kind: WorkspaceDocumentKind): string {
  return kind === WorkspaceDocumentKind.INVOICE ? 'INV' : 'QUO';
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const generateWorkspaceDocument = pageActionClient('inbox')
  .metadata({ actionName: 'generateWorkspaceDocument' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      kind: kindSchema
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    const kind =
      parsedInput.kind === 'invoice'
        ? WorkspaceDocumentKind.INVOICE
        : WorkspaceDocumentKind.QUOTE;

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    const thread = await prisma.mailThread.findFirst({
      where: {
        id: parsedInput.threadId,
        ...mailThreadAccessWhere({
          organizationId,
          userId: session.user.id,
          scope
        })
      },
      select: {
        id: true,
        subject: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            fromAddress: true,
            bodyText: true,
            bodyHtml: true
          }
        }
      }
    });
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const existing = await prisma.workspaceDocument.findFirst({
      where: { organizationId, sourceThreadId: thread.id, kind },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        kind: true,
        status: true,
        reference: true,
        sequence: true,
        counterpartyName: true,
        counterpartyEmail: true,
        amountCents: true,
        currency: true,
        dueAt: true,
        issuedAt: true
      }
    });
    if (existing && existing.status !== 'DRAFT') {
      return {
        id: existing.id,
        kind: existing.kind,
        status: existing.status,
        reference: existing.reference,
        counterpartyName: existing.counterpartyName,
        counterpartyEmail: existing.counterpartyEmail,
        amountCents: existing.amountCents,
        currency: existing.currency,
        dueAt: existing.dueAt?.toISOString() ?? null,
        issuedAt: existing.issuedAt.toISOString()
      };
    }

    const latest = thread.messages[0];
    if (!latest) {
      throw new PreConditionError('This thread has no messages yet.');
    }

    const [extracted, organization] = await Promise.all([
      extractMailDocument({
        kind: parsedInput.kind,
        subject: thread.subject,
        fromAddress: latest.fromAddress,
        bodyText: latest.bodyText,
        bodyHtml: latest.bodyHtml
      }),
      prisma.organization.findFirst({
        where: { id: organizationId },
        select: {
          name: true,
          email: true,
          website: true,
          logoUrl: true,
          accentColor: true,
          address: true,
          phone: true,
          taxId: true
        }
      })
    ]);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    const last = existing
      ? null
      : await prisma.workspaceDocument.findFirst({
          where: { organizationId, kind },
          orderBy: { sequence: 'desc' },
          select: { sequence: true }
        });
    const sequence = existing?.sequence ?? (last?.sequence ?? 0) + 1;
    const reference =
      existing?.reference ??
      `${prefixFor(kind)}-${String(sequence).padStart(3, '0')}`;
    const issuedAt = parseDate(extracted.issuedAt) ?? new Date();
    const dueAt = parseDate(extracted.dueAt) ?? addDays(issuedAt, 30);
    const issuerLogoUrl =
      parsedInput.kind === 'invoice'
        ? resolveMailBrandLogoUrl(
            extracted.issuerWebsite,
            extracted.issuerEmail ?? extracted.counterpartyEmail
          )
        : organization.logoUrl;
    const payload = {
      notes: extracted.notes,
      lineItems: extracted.lineItems,
      subject: thread.subject,
      originalReference: extracted.originalReference,
      counterpartyAddress: extracted.counterpartyAddress,
      counterpartyPhone: extracted.counterpartyPhone,
      counterpartyTaxId: extracted.counterpartyTaxId,
      issuerName: extracted.issuerName,
      issuerLegalName: extracted.issuerLegalName,
      issuerAddress: extracted.issuerAddress,
      issuerEmail: extracted.issuerEmail,
      issuerPhone: extracted.issuerPhone,
      issuerWebsite: extracted.issuerWebsite,
      issuerTaxId: extracted.issuerTaxId,
      issuerLogoUrl,
      billToName: extracted.billToName,
      billToAddress: extracted.billToAddress,
      billToEmail: extracted.billToEmail,
      billToPhone: extracted.billToPhone,
      billToTaxId: extracted.billToTaxId,
      subtotalCents: extracted.subtotalCents,
      taxAmountCents: extracted.taxAmountCents,
      taxRatePercent: extracted.taxRatePercent,
      supplyAt: extracted.supplyAt,
      paymentTerms: extracted.paymentTerms,
      paymentDetails: extracted.paymentDetails
    };

    const documentFields = {
      counterpartyName: extracted.counterpartyName,
      counterpartyEmail: extracted.counterpartyEmail,
      amountCents: extracted.amountCents,
      currency: extracted.currency,
      issuedAt,
      dueAt,
      sourceMessageId: latest.id,
      payload
    };
    const created = existing
      ? await prisma.workspaceDocument.update({
          where: { id: existing.id },
          data: documentFields
        })
      : await prisma.workspaceDocument.create({
          data: {
            organizationId,
            kind,
            status: 'DRAFT',
            reference,
            sequence,
            sourceThreadId: thread.id,
            createdById: session.user.id,
            ...documentFields
          }
        });

    return {
      id: created.id,
      kind: created.kind,
      status: created.status,
      reference: created.reference,
      counterpartyName: created.counterpartyName,
      counterpartyEmail: created.counterpartyEmail,
      amountCents: created.amountCents,
      currency: created.currency,
      dueAt: created.dueAt?.toISOString() ?? null,
      issuedAt: created.issuedAt.toISOString()
    };
  });
