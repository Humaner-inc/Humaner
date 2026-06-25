'use server';

import { authActionClient } from '@/actions/safe-action';
import { feedbackCategoryLabels } from '@/constants/labels';
import { prisma } from '@/lib/db/prisma';
import { sendFeedbackEmail } from '@/lib/smtp/send-feedback-email';
import { sendFeedbackSchema } from '@/schemas/feedback/send-feedback-schema';

export const sendFeedback = authActionClient
  .metadata({ actionName: 'sendFeedback' })
  .schema(sendFeedbackSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const feedback = await prisma.feedback.create({
      data: {
        category: parsedInput.category,
        message: parsedInput.message,
        organizationId: session.user.organizationId,
        userId: session.user.id
      },
      select: {
        organization: {
          select: {
            name: true
          }
        }
      }
    });

    await sendFeedbackEmail({
      recipient: process.env.EMAIL_FEEDBACK as string,
      organizationName: feedback.organization.name,
      name: session.user.name,
      email: session.user.email,
      category: feedbackCategoryLabels[parsedInput.category],
      message: parsedInput.message
    });
  });
