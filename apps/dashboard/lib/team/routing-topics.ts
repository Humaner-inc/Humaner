/** Map inbox / integration signals onto Team profile knowledge areas. */
const TOPIC_ALIASES: Record<string, string[]> = {
  stripe: ['stripe', 'billing', 'payments'],
  billing: ['billing', 'stripe', 'payments'],
  payments: ['payments', 'stripe', 'billing'],
  github: ['github', 'devops', 'backend'],
  linear: ['linear', 'product', 'frontend'],
  inbox: ['inbox', 'mail', 'support'],
  mail: ['inbox', 'mail', 'support']
};

const SOURCE_DOMAINS: Array<[string, string]> = [
  ['stripe.com', 'stripe'],
  ['github.com', 'github'],
  ['linear.app', 'linear'],
  ['linear-app.com', 'linear']
];

const KEYWORD_TOPICS: Array<[RegExp, string]> = [
  [
    /\bstripe\b|\binvoice\b|\bpayment failed\b|\bsubscription\b|\breceipt\b/i,
    'stripe'
  ],
  [
    /\bgithub\b|\bpull request\b|\bdependabot\b|\bci failed\b|\brepository\b/i,
    'github'
  ],
  [/\blinear\b|\bissue assigned\b|\bissue created\b/i, 'linear'],
  [/\bbilling\b|\brefund\b|\bcharge\b/i, 'billing']
];

export function expandRoutingTopics(topics: string[]): string[] {
  const expanded = new Set<string>();
  for (const raw of topics) {
    const topic = raw.trim().toLowerCase();
    if (!topic) continue;
    expanded.add(topic);
    for (const alias of TOPIC_ALIASES[topic] ?? []) {
      expanded.add(alias);
    }
  }
  return [...expanded];
}

function domainTopic(address: string): string | null {
  const at = address.lastIndexOf('@');
  if (at < 0) return null;
  const domain = address.slice(at + 1).toLowerCase();
  if (!domain) return null;
  for (const [suffix, topic] of SOURCE_DOMAINS) {
    if (domain === suffix || domain.endsWith(`.${suffix}`)) {
      return topic;
    }
  }
  return null;
}

/** Infer profile skills from inbox mail or Linear / Stripe / GitHub senders. */
export function inferRoutingTopics(input: {
  subject?: string | null;
  body?: string | null;
  fromAddress?: string | null;
}): string[] {
  const topics = new Set<string>();
  const from = input.fromAddress?.trim() ?? '';
  const fromTopic = domainTopic(from);
  if (fromTopic) topics.add(fromTopic);

  const text = `${input.subject ?? ''} ${input.body ?? ''}`.slice(0, 2000);
  for (const [pattern, topic] of KEYWORD_TOPICS) {
    if (pattern.test(text)) topics.add(topic);
  }

  if (topics.size === 0) return [];
  return expandRoutingTopics([...topics]);
}
