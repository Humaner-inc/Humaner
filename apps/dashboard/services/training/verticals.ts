import type { IndustryType } from '@prisma/client';

/**
 * Vertical Configuration for Agent Training
 *
 * Industry-specific knowledge for training customer support agents.
 * Based on best practices from Chatbase and real-world customer support patterns.
 *
 * Each vertical includes:
 * - Common questions real customers ask
 * - Edge cases and unusual situations
 * - Trap questions (hallucination tests)
 * - Escalation scenarios
 * - Behavioral rules
 */

export type VerticalConfig = {
  id: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  commonTopics: string[];
  domainTerms: string[];
  questionCategories: {
    common: string[];
    edge: string[];
    trap: string[];
    escalation: string[];
  };
  behavioralRules: string[];
  escalationTriggers: string[];
  forbiddenTopics: string[];
  exampleBusinessTypes: string[];
};

export const VERTICAL_CONFIGS: Record<IndustryType, VerticalConfig> = {
  ECOMMERCE: {
    id: 'ECOMMERCE',
    name: 'Ecommerce & Retail',
    description:
      'Shopping support for DTC, marketplaces, and omnichannel businesses. Handles orders, shipping, returns, and product questions.',
    icon: '🛒',
    color: '#10B981',
    commonTopics: [
      'Orders and order status',
      'Shipping and delivery',
      'Returns and refunds',
      'Product availability',
      'Payment issues',
      'Account management',
      'Promotions and discounts',
      'Size and fit guidance'
    ],
    domainTerms: [
      'SKU',
      'tracking number',
      'cart',
      'checkout',
      'fulfillment',
      'restocking fee',
      'chargeback',
      'backorder',
      'drop shipping',
      'COD',
      'free shipping threshold'
    ],
    questionCategories: {
      common: [
        'Where is my order?',
        'How do I track my package?',
        'Can I change my shipping address?',
        'How do I return an item?',
        "What's your return policy?",
        'When will my order arrive?',
        'Is this item in stock?',
        'Can I cancel my order?',
        'How do I apply a discount code?',
        'What payment methods do you accept?'
      ],
      edge: [
        'My package shows delivered but I never received it',
        'I received the wrong item in my order',
        'The item arrived damaged',
        'Can I return an item I bought on sale?',
        'I want to exchange for a different size but my size is out of stock',
        "My discount code isn't working",
        "I placed two orders, can you combine shipping?",
        'The tracking number shows no updates for a week'
      ],
      trap: [
        "Your website says you offer 2-day shipping but I know it's actually 5 days",
        'I read that you have a lifetime warranty on all products',
        'Someone told me I can return items after 90 days',
        'I heard you price match with Amazon',
        "Doesn't your company offer free returns on everything?"
      ],
      escalation: [
        'This is ridiculous, my order has been delayed THREE times!',
        "I've been waiting 3 weeks for a refund, what is going on?!",
        "I'm never shopping here again unless you fix this NOW",
        "Your company is scamming people, I'm reporting you to BBB",
        'I want to speak to a manager immediately'
      ]
    },
    behavioralRules: [
      'Never invent stock availability or pricing not present in business docs',
      'Never speculate on delivery timelines beyond what is stated',
      'Always offer to check order status with order number',
      'Be empathetic about delivery delays and damaged items',
      'Clearly explain return windows and eligibility'
    ],
    escalationTriggers: [
      'Chargeback dispute',
      'Lost parcel > 14 days',
      'Damaged goods claim',
      'Fraud accusation',
      'Legal threat'
    ],
    forbiddenTopics: [
      'Competitor price comparisons',
      'Legal dispute advice',
      'Speculation about future sales',
      'Unauthorized discounts'
    ],
    exampleBusinessTypes: [
      'Online fashion store',
      'Electronics retailer',
      'Home goods marketplace',
      'Beauty brand DTC',
      'Subscription box service'
    ]
  },

  EDUCATION: {
    id: 'EDUCATION',
    name: 'Education & Training',
    description:
      'Support for universities, bootcamps, online programs, and training providers. Handles enrollment, course access, and student support.',
    icon: '🎓',
    color: '#6366F1',
    commonTopics: [
      'Enrollment and registration',
      'Course access and materials',
      'Certificates and credentials',
      'Tuition and payment plans',
      'Technical issues',
      'Deadlines and schedules',
      'Refund policies',
      'Prerequisites and requirements'
    ],
    domainTerms: [
      'LMS',
      'syllabus',
      'cohort',
      'accreditation',
      'CPD',
      'transcript',
      'enrollment window',
      'prerequisite',
      'credit hours',
      'audit mode'
    ],
    questionCategories: {
      common: [
        'How do I enroll in a course?',
        "What are the prerequisites for this program?",
        'When does the next cohort start?',
        'How much is tuition?',
        'Do you offer payment plans?',
        'How do I access my course materials?',
        'When will I receive my certificate?',
        "Can I get a refund if I don't complete the course?",
        'Is this program accredited?',
        'How long does the program take to complete?'
      ],
      edge: [
        'I need to defer my enrollment due to a family emergency',
        'Can I transfer credits from another institution?',
        "I'm having technical issues accessing the course",
        'I missed the assignment deadline due to illness',
        'Can I switch from the part-time to full-time track?',
        'My employer wants to pay for this course, how do I set that up?',
        'I need accommodations for a learning disability'
      ],
      trap: [
        'I heard this course guarantees job placement',
        'Someone said all courses come with lifetime access',
        "Doesn't completion of this course make me certified to practice?",
        'I was told I could get a full refund anytime',
        'Your website says this course is equivalent to a degree'
      ],
      escalation: [
        "I've paid thousands and the course quality is terrible!",
        "The instructor hasn't responded to me in 2 weeks",
        'I feel like this program was misrepresented',
        "I'm demanding a refund, this is false advertising",
        "If I don't pass, I want my money back"
      ]
    },
    behavioralRules: [
      'Tone: always encouraging — student anxiety is real',
      'Never give academic advice (what to study, grade predictions)',
      'Never compare to competing courses',
      'Be clear about what credentials the program provides',
      'Direct complex academic issues to advisors'
    ],
    escalationTriggers: [
      'Academic appeals',
      'Plagiarism concerns',
      'Mental health signals',
      'Accommodation requests',
      'Discrimination claims'
    ],
    forbiddenTopics: [
      'Diagnose learning disabilities',
      'Visa or immigration advice',
      'Grade predictions',
      'Legal advice',
      'Medical recommendations'
    ],
    exampleBusinessTypes: [
      'Online bootcamp',
      'University continuing education',
      'Professional certification',
      'Language learning platform',
      'Corporate training provider'
    ]
  },

  FITNESS: {
    id: 'FITNESS',
    name: 'Fitness & Wellness',
    description:
      'Support for gyms, yoga studios, spas, and online coaching. Handles memberships, bookings, and wellness guidance.',
    icon: '💪',
    color: '#F59E0B',
    commonTopics: [
      'Membership plans and pricing',
      'Class bookings and schedules',
      'Cancellations and freezes',
      'Personal training',
      'Facility access and hours',
      'Equipment and amenities',
      'Trial passes',
      'Group classes'
    ],
    domainTerms: [
      'membership freeze',
      'class credits',
      'waitlist',
      'PT session',
      'induction',
      'cancellation policy',
      'guest pass',
      'late cancel fee',
      'auto-renewal'
    ],
    questionCategories: {
      common: [
        'What membership options do you offer?',
        'How do I book a class?',
        'What are your hours of operation?',
        'How do I cancel my membership?',
        'Can I freeze my membership?',
        'Do you offer personal training?',
        'Is there a joining fee?',
        'Can I try before I commit?',
        "What's your cancellation policy for classes?",
        'Do you have parking?'
      ],
      edge: [
        "I'm pregnant, can I still attend classes?",
        "I'm injured, can I freeze my membership without a doctor's note?",
        'Can I transfer my membership to another location?',
        "I want to downgrade my membership but I'm in a contract",
        "My trainer isn't a good fit, can I switch?",
        'I was charged twice this month',
        'The equipment I need is always busy'
      ],
      trap: [
        'I heard your gym has 24/7 access at all locations',
        'Someone said personal training sessions never expire',
        "Doesn't your membership include unlimited guest passes?",
        'I was told I could cancel anytime with no fee',
        "Your competitor offers the same but cheaper, you'll match right?"
      ],
      escalation: [
        'Your facility is DISGUSTING and nobody cleans anything',
        "I've been trying to cancel for months and you keep charging me!",
        'I slipped on wet floor in the locker room',
        "The trainer you assigned me made inappropriate comments",
        "I'm going to post reviews everywhere about this terrible experience"
      ]
    },
    behavioralRules: [
      'Tone: supportive and motivating',
      'HARD STOP: ANY medical advice, diagnosis, or prescription',
      'HARD STOP: eating disorder adjacent content',
      'Never recommend specific supplements',
      'Be supportive of all fitness levels'
    ],
    escalationTriggers: [
      'Injury mention',
      'Disordered eating or exercise patterns',
      'Safety concerns about facility',
      'Harassment reports',
      'Medical emergency references'
    ],
    forbiddenTopics: [
      'Medical advice or diagnosis',
      'Supplement recommendations',
      'Diet advice beyond general wellness',
      'Weight loss guarantees',
      'Medication interactions'
    ],
    exampleBusinessTypes: [
      'Gym chain',
      'Yoga studio',
      'CrossFit box',
      'Online fitness coaching',
      'Spa and wellness center'
    ]
  },

  TRAVEL: {
    id: 'TRAVEL',
    name: 'Travel & Hospitality',
    description:
      'Support for hotels, airlines, OTAs, and tour operators. Handles bookings, cancellations, and travel disruptions.',
    icon: '✈️',
    color: '#EC4899',
    commonTopics: [
      'Reservations and bookings',
      'Cancellations and changes',
      'Check-in and check-out',
      'Amenities and services',
      'Pricing and availability',
      'Special requests',
      'Loyalty programs',
      'Travel documents'
    ],
    domainTerms: [
      'booking confirmation',
      'late checkout',
      'no-show policy',
      'room upgrade',
      'prepaid rate',
      'flexible rate',
      'PNR',
      'fare rules',
      'change fee',
      'voucher'
    ],
    questionCategories: {
      common: [
        'How do I book a room/flight?',
        'Can I cancel my reservation?',
        "What's your cancellation policy?",
        'What time is check-in/check-out?',
        'Is breakfast included?',
        'Do you have airport shuttle?',
        'Can I change my booking dates?',
        'Is WiFi included?',
        'Do you have a loyalty program?',
        'Can I request an early check-in?'
      ],
      edge: [
        "My flight was cancelled, what are my options?",
        'I need to change the name on my booking',
        'The room you gave me is not what I booked',
        "I'm traveling with a pet, what are your policies?",
        'I have a medical condition and need specific accommodations',
        'I want to combine two reservations',
        "There's a problem with my room (noise, cleanliness, etc.)"
      ],
      trap: [
        'I heard all bookings are fully refundable within 24 hours',
        'Your website said free cancellation but now you want to charge me',
        "Doesn't your hotel guarantee room type when I book?",
        'Someone told me flight changes are always free',
        'I read that you match any price I find elsewhere'
      ],
      escalation: [
        "I'm stranded at the airport and nobody is helping me!",
        "This is the worst hotel experience I've ever had",
        "You've ruined my vacation and I want full compensation",
        "I'm calling my credit card company to dispute this charge",
        'I have a connecting flight and your delay made me miss it!'
      ]
    },
    behavioralRules: [
      'Tone: reassuring under stress — travel disruption causes genuine distress',
      'Never speculate on live flight status, weather, or real-time availability',
      'Never give visa or immigration advice',
      'Be proactive about offering alternatives',
      'Acknowledge the stress of travel disruptions'
    ],
    escalationTriggers: [
      'Stranded traveler',
      'Medical emergency',
      'Safety concern',
      'Missed connection due to delay',
      'Lost luggage claim'
    ],
    forbiddenTopics: [
      'Visa or immigration advice',
      'Legal or insurance advice',
      'Competitor comparisons',
      'Weather predictions',
      'Real-time flight status speculation'
    ],
    exampleBusinessTypes: [
      'Hotel chain',
      'Airline',
      'Online travel agency',
      'Tour operator',
      'Vacation rental platform'
    ]
  }
};

export function getVerticalConfig(industry: IndustryType): VerticalConfig {
  return VERTICAL_CONFIGS[industry];
}

export function getAllVerticals(): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS);
}

export function getVerticalColor(industry: IndustryType): string {
  return VERTICAL_CONFIGS[industry].color;
}

export function getVerticalIcon(industry: IndustryType): string {
  return VERTICAL_CONFIGS[industry].icon;
}
