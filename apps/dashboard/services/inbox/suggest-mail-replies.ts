import 'server-only';

import { LLM_MODELS } from '@humaner/shared/plans';

import { getAnthropicClient, isAnthropicConfigured } from '@/lib/llm/anthropic';
import {
  UNTRUSTED_MAIL_GUARD,
  wrapUntrustedMailBody
} from '@/lib/untrusted-content';

export type MailReplySuggestion = {
  label: string;
  draft: string;
};

const MAX_PROMPT_BODY_CHARS = 2500;

type SuggestMailRepliesInput = {
  subject: string;
  fromAddress: string;
  aliasAddress: string;
  bodyText: string;
};

function greetingFor(fromAddress: string): string {
  const match = fromAddress.match(/^(.*?)\s*<([^>]+)>$/);
  const display = match?.[1]?.trim().replace(/^"|"$/g, '') || '';
  const email = (match?.[2] || fromAddress).trim();
  const first =
    display.split(/\s+/)[0] ||
    email.split('@')[0]?.split(/[._-]/)[0] ||
    'there';
  if (!first || first === 'there') return 'Hi,';
  return `Hi ${first.charAt(0).toUpperCase()}${first.slice(1)},`;
}

function themeKey(subject: string, body: string): string {
  const text = `${subject}\n${body}`.toLowerCase();
  if (/demo|call|meet|schedule|book/.test(text)) return 'demo';
  if (/pric|quote|cost|plan|billing|invoice/.test(text)) return 'pricing';
  if (/sign\s*up|register|account|onboard/.test(text)) return 'signup';
  if (/bug|error|broken|issue|not working|fail/.test(text)) return 'bug';
  if (/refund|cancel|unsubscribe/.test(text)) return 'cancel';
  if (/partner|collab|sponsor/.test(text)) return 'partner';
  return 'general';
}

function subjectSnippet(subject: string): string {
  const cleaned = subject.replace(/^re:\s*/i, '').trim();
  return cleaned.length > 48
    ? `${cleaned.slice(0, 45)}…`
    : cleaned || 'your note';
}

function fallbackSuggestions(
  input: SuggestMailRepliesInput
): MailReplySuggestion[] {
  const greeting = greetingFor(input.fromAddress);
  const theme = themeKey(input.subject, input.bodyText);
  const topic = subjectSnippet(input.subject);
  const signOff = input.aliasAddress;

  switch (theme) {
    case 'demo':
      return [
        {
          label: `Yes — book a demo for ${topic}`,
          draft: `${greeting}\n\nThanks for reaching out about ${topic}. We’d love to show you around.\n\nWhat times work this week for a 20–30 min call?\n\nBest,\n${signOff}`
        },
        {
          label: 'Share calendar link first',
          draft: `${greeting}\n\nAppreciate the interest in ${topic}. Here’s the easiest next step: share two or three slots that work for you, or I can send a booking link.\n\nBest,\n${signOff}`
        },
        {
          label: 'Not a fit — redirect politely',
          draft: `${greeting}\n\nThanks for writing about ${topic}. We’re not the right fit for a demo right now, but I’m happy to point you to resources that may help.\n\nBest,\n${signOff}`
        }
      ];
    case 'pricing':
      return [
        {
          label: `Send pricing for ${topic}`,
          draft: `${greeting}\n\nThanks for asking about ${topic}. I can share current pricing and what each plan includes.\n\nWhich team size / volume are you planning for?\n\nBest,\n${signOff}`
        },
        {
          label: 'Ask usage details first',
          draft: `${greeting}\n\nHappy to help with ${topic}. To quote accurately — roughly how many seats or monthly conversations do you expect?\n\nBest,\n${signOff}`
        },
        {
          label: 'Offer a short walkthrough',
          draft: `${greeting}\n\nThanks for the note on ${topic}. A quick walkthrough often clarifies pricing faster than a static sheet — want to book 15 minutes?\n\nBest,\n${signOff}`
        }
      ];
    case 'signup':
      return [
        {
          label: 'Help finish signup',
          draft: `${greeting}\n\nThanks for reaching out about ${topic}. I can help you get set up quickly.\n\nWhere are you getting stuck in the flow?\n\nBest,\n${signOff}`
        },
        {
          label: 'Send onboarding checklist',
          draft: `${greeting}\n\nWelcome — for ${topic}, here’s what usually unblocks people fastest: confirm email, connect your workspace, then invite one teammate.\n\nWant me to walk you through it?\n\nBest,\n${signOff}`
        },
        {
          label: 'Escalate to human help',
          draft: `${greeting}\n\nSorry you’re hitting friction with ${topic}. I’m looping a teammate who can finish setup with you today.\n\nBest,\n${signOff}`
        }
      ];
    case 'bug':
      return [
        {
          label: `Troubleshoot ${topic}`,
          draft: `${greeting}\n\nSorry you’re running into this with ${topic}. We’ll dig in right away.\n\nCan you share a screenshot, browser, and the exact steps that reproduce it?\n\nBest,\n${signOff}`
        },
        {
          label: 'Confirm workaround now',
          draft: `${greeting}\n\nThanks for flagging ${topic}. While we investigate, try refreshing / signing out and back in — does that change anything?\n\nBest,\n${signOff}`
        },
        {
          label: 'Open a priority ticket',
          draft: `${greeting}\n\nGot it — I’m treating ${topic} as high priority and will update you as soon as we have a fix path.\n\nBest,\n${signOff}`
        }
      ];
    case 'cancel':
      return [
        {
          label: 'Confirm cancellation path',
          draft: `${greeting}\n\nThanks for writing about ${topic}. I can help with cancellation or a pause option if that’s better.\n\nWhich would you prefer?\n\nBest,\n${signOff}`
        },
        {
          label: 'Offer retain / pause',
          draft: `${greeting}\n\nUnderstood on ${topic}. Before we cancel, would a temporary pause or plan change help?\n\nBest,\n${signOff}`
        },
        {
          label: 'Process refund request',
          draft: `${greeting}\n\nThanks — I’ve noted your request regarding ${topic}. I’ll confirm the next billing step and any refund eligibility shortly.\n\nBest,\n${signOff}`
        }
      ];
    case 'partner':
      return [
        {
          label: `Explore partnership on ${topic}`,
          draft: `${greeting}\n\nThanks for reaching out about ${topic}. We’re open to the right partnerships.\n\nCould you share audience size and what success looks like for you?\n\nBest,\n${signOff}`
        },
        {
          label: 'Intro to partnerships lead',
          draft: `${greeting}\n\nAppreciate the note on ${topic}. I’ll introduce you to the teammate who owns partnerships so you get a clear yes/no quickly.\n\nBest,\n${signOff}`
        },
        {
          label: 'Not taking partners now',
          draft: `${greeting}\n\nThanks for thinking of us for ${topic}. We’re not opening new partnerships at the moment, but feel free to check back next quarter.\n\nBest,\n${signOff}`
        }
      ];
    default:
      return [
        {
          label: `Reply about ${topic}`,
          draft: `${greeting}\n\nThanks for your message about ${topic}. Happy to help.\n\nWhat’s the main outcome you need from us?\n\nBest,\n${signOff}`
        },
        {
          label: 'Ask one clarifying question',
          draft: `${greeting}\n\nThanks for writing in re: ${topic}. To move quickly — what’s the single most important detail we should know?\n\nBest,\n${signOff}`
        },
        {
          label: 'Route to the right teammate',
          draft: `${greeting}\n\nGot your note on ${topic}. I’m routing this to the teammate best placed to help and they’ll follow up shortly.\n\nBest,\n${signOff}`
        }
      ];
  }
}

export async function suggestMailReplies(
  input: SuggestMailRepliesInput
): Promise<MailReplySuggestion[]> {
  if (!isAnthropicConfigured()) {
    return fallbackSuggestions(input);
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: LLM_MODELS.HAIKU_45.id,
      max_tokens: 900,
      system: `You draft quick-reply options for a collaborative support inbox.

Return ONLY compact JSON:
{"suggestions":[{"label":"short action label","draft":"full email reply ready to send"}]}

Rules:
- Exactly 3 suggestions.
- Labels MUST reflect THIS email's concrete ask/theme (subject + body). Good: "Book a demo with Albin", "Send Enterprise pricing", "Help finish Polar signup". Bad: "Acknowledge and help", "Ask a clarifying question", "Polite decline".
- Include a distinctive noun from the email in each label when possible.
- Labels max 8 words. Drafts concise, human, brand-safe. No markdown.

${UNTRUSTED_MAIL_GUARD}`,
      messages: [
        {
          role: 'user',
          content: [
            `Subject: ${input.subject}`,
            `From: ${input.fromAddress}`,
            `Reply-as alias: ${input.aliasAddress}`,
            '',
            wrapUntrustedMailBody(input.bodyText, MAX_PROMPT_BODY_CHARS) ?? ''
          ].join('\n')
        }
      ]
    });

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackSuggestions(input);

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions?: Array<{ label?: string; draft?: string }>;
    };

    const suggestions = (parsed.suggestions ?? [])
      .map((item) => ({
        label: item.label?.trim() || '',
        draft: item.draft?.trim() || ''
      }))
      .filter((item) => item.label && item.draft)
      .slice(0, 3);

    return suggestions.length === 3 ? suggestions : fallbackSuggestions(input);
  } catch {
    return fallbackSuggestions(input);
  }
}
