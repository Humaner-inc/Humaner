import type { CharacterType, IndustryType } from '@prisma/client';

export type IndustryIconKey = 'store' | 'graduation-cap' | 'dumbbell' | 'airplane';

export type IndustryDefinition = {
  id: IndustryType;
  label: string;
  description: string;
  iconKey: IndustryIconKey;
  /** Default character preset that suits the vertical. */
  defaultCharacter: CharacterType;
  /** Topics the agent should refuse by default — overridable per agent. */
  forbiddenTopics: string[];
  /** Industry-specific system prompt fragment injected at runtime. */
  promptFragment: string;
  /** Suggested knowledge sources + legal pages, adapted to the niche. */
  knowledgePages: string[];
  legalPages: string[];
};

export const INDUSTRIES: Record<IndustryType, IndustryDefinition> = {
  ECOMMERCE: {
    id: 'ECOMMERCE',
    label: 'Ecommerce & Retail',
    description: 'Product questions, shipping, and returns',
    iconKey: 'store',
    defaultCharacter: 'CASUAL',
    forbiddenTopics: ['Competitor pricing comparisons', 'Legal disputes'],
    promptFragment: `You handle customer support for an ecommerce/retail business.
Priority topics: product details, shipping timelines, returns, and order issues.
When order-specific info is needed (tracking, specific order status), you don't have access to the order system — direct to the business's order portal or support email.
Never speculate on stock availability unless your knowledge base explicitly covers it.`,
    knowledgePages: [
      'Product catalog or FAQs',
      'Shipping policy',
      'Returns & refunds policy',
      'Size guide',
      'Contact / escalation info'
    ],
    legalPages: ['Terms of Sale', 'Refund & Returns Policy', 'Privacy Policy', 'Shipping Policy']
  },
  EDUCATION: {
    id: 'EDUCATION',
    label: 'Education & Training',
    description: 'Admissions, enrolment, and student questions',
    iconKey: 'graduation-cap',
    defaultCharacter: 'CORPORATE',
    forbiddenTopics: ['Academic integrity advice', 'Recommending competing courses'],
    promptFragment: `You handle student and prospective student support for an education or training business.
Priority topics: course content, enrollment process, pricing, access, and policies.
Tone: encouraging and clear — many users are new to the subject or feeling uncertain.
Never give academic advice (what to study, grades) — redirect to instructors.
For access/technical issues, collect basic info (browser, device) before suggesting fixes.`,
    knowledgePages: [
      'Course catalog / syllabus',
      'Enrollment & payment FAQ',
      'Refund & cancellation policy',
      'Platform access / login help',
      'Instructor or contact info'
    ],
    legalPages: ['Terms of Enrollment', 'Refund & Cancellation Policy', 'Privacy Policy', 'Code of Conduct']
  },
  FITNESS: {
    id: 'FITNESS',
    label: 'Fitness & Wellness',
    description: 'Bookings, cancelations, and member support',
    iconKey: 'dumbbell',
    defaultCharacter: 'CASUAL',
    forbiddenTopics: ['Medical advice', 'Injury diagnosis', 'Nutrition prescriptions'],
    promptFragment: `You handle member support for a fitness or wellness business.
Priority topics: memberships, bookings, cancellations, policies, and general facility info.
Energy: match the brand — if their agents are CASUAL, be upbeat and motivating.
Hard limit: never give medical advice, diagnose injuries, or prescribe nutrition.
If a member asks something medical, acknowledge warmly and direct to a qualified professional.`,
    knowledgePages: [
      'Membership & pricing plans',
      'Class schedule or booking info',
      'Cancellation & freeze policies',
      'Trainer/coach bios',
      'Facility location & hours'
    ],
    legalPages: ['Membership Terms', 'Cancellation & Freeze Policy', 'Privacy Policy', 'Health & Liability Waiver']
  },
  TRAVEL: {
    id: 'TRAVEL',
    label: 'Travel & Hospitality',
    description: 'Bookings, disruptions, and refunds',
    iconKey: 'airplane',
    defaultCharacter: 'CORPORATE',
    forbiddenTopics: ['Competitor comparisons', 'Legal dispute advice'],
    promptFragment: `You handle guest support for a travel or hospitality business.
Priority topics: bookings, cancellations, refunds, property info, and disruption handling.
Tone: reassuring and responsive — travel issues cause genuine stress.
When a booking-specific question requires system access (reservation lookup, refund status), you cannot retrieve live data — direct to the booking portal or support line clearly.
Never speculate on availability or pricing not present in your knowledge base.`,
    knowledgePages: [
      'Booking & cancellation policy',
      'Property or service descriptions',
      'Check-in / check-out info',
      'FAQ for common disruptions',
      'Contact escalation info'
    ],
    legalPages: ['Booking Terms & Conditions', 'Cancellation & Refund Policy', 'Privacy Policy', 'Guest Liability Terms']
  }
};

export const INDUSTRY_LIST: IndustryDefinition[] = Object.values(INDUSTRIES);

export function getIndustry(industry: IndustryType): IndustryDefinition {
  return INDUSTRIES[industry];
}
