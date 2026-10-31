/**
 * MarTechAdda FAQ Data
 * 
 * Lean, professional, psychologically convincing FAQ set
 * Crafted to reduce anxiety, pre-empt objections, and build trust
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  id: string;
  title: string;
  icon?: string;
  items: FAQItem[];
}

export const faqSections: FAQSection[] = [
  {
    id: 'about',
    title: 'About MarTechAdda',
    items: [
      {
        question: 'What is MarTechAdda?',
        answer: 'MarTechAdda is a neutral platform that helps businesses discover, connect, and engage marketing experts in a structured and transparent way. We do not sell services, rank experts, or influence outcomes. We facilitate discovery, engagement, and deposit handling—nothing more.',
      },
      {
        question: 'Is MarTechAdda a marketing agency?',
        answer: 'No. MarTechAdda is not an agency, employer, or service provider. All marketing services are delivered directly by independent experts or agencies you choose.',
      },
    ],
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    items: [
      {
        question: 'How are experts shown in search results?',
        answer: 'Search results are not AI-ranked, not sponsored, and not boosted. Results appear only based on your selected filters. Sorting options simply reorder results; they never change who appears.',
      },
      {
        question: 'Can experts pay to appear on top?',
        answer: 'No. Experts cannot buy visibility, promotions, or featured listings—ever. This keeps discovery fair, predictable, and bias-free.',
      },
    ],
  },
  {
    id: 'discussions',
    title: 'Discussions & Hiring',
    items: [
      {
        question: 'Is connecting with an expert a commitment?',
        answer: 'No. Discussions are for clarity and alignment only. There is no obligation to hire, no payment, and no pressure. You decide when (and if) to proceed.',
      },
      {
        question: 'Why is a discussion required before quotation?',
        answer: 'Because clear alignment prevents misunderstood scope, pricing disputes, and failed engagements. A quotation can be created only after a discussion is completed, or you explicitly request one.',
      },
    ],
  },
  {
    id: 'quotations',
    title: 'Quotations & Deposits',
    items: [
      {
        question: 'Is a quotation the same as an invoice?',
        answer: 'No. A quotation defines scope, milestones, timelines, and deposit structure. It does not create a payment obligation until you accept it.',
      },
      {
        question: 'Why does MarTechAdda collect a deposit instead of paying the expert directly?',
        answer: 'Deposits protect both sides. You retain control over fund release, experts are protected against non-payment, and funds move only after milestone approval. MarTechAdda holds deposits securely and releases them only when you approve.',
      },
      {
        question: 'Is the deposit refundable?',
        answer: 'Deposits may be refunded (fully or partially) if the engagement is cancelled before milestone approval, a milestone is rejected and work is terminated, or fraud, misrepresentation, or policy violations occur. Refunds depend on approved milestones and applicable policies.',
      },
    ],
  },
  {
    id: 'milestones',
    title: 'Milestones & Approvals',
    items: [
      {
        question: 'What are milestones used for?',
        answer: 'Milestones are used only as references for deposit release. They are not task trackers, project management tools, or work progress indicators.',
      },
      {
        question: 'Who controls deposit release?',
        answer: 'You do. For each milestone, you can approve & release, request revision, or reject or raise a concern. No approval = no release.',
      },
      {
        question: 'What if I don\'t respond to a milestone submission?',
        answer: 'If there is no response within two business days, MarTechAdda may release the deposit on your behalf, provided an invoice is submitted and compliance checks are satisfied. This prevents process deadlocks and protects both parties.',
      },
    ],
  },
  {
    id: 'neutrality',
    title: 'Platform Neutrality & Safety',
    items: [
      {
        question: 'Does MarTechAdda judge work quality or disputes?',
        answer: 'No. MarTechAdda does not judge quality, scope, or outcomes. Our role is limited to process verification, compliance checks, and deposit execution. Dispute resolution remains between the two parties.',
      },
      {
        question: 'Does MarTechAdda share my contact details?',
        answer: 'No contact details are shared without consent. All sensitive information is encrypted and used only for engagement, compliance, and deposit handling.',
      },
    ],
  },
  {
    id: 'fees',
    title: 'Fees & Payments',
    items: [
      {
        question: 'Does MarTechAdda charge any fees?',
        answer: 'MarTechAdda may charge platform facilitation fees and payment processing charges. All fees (if applicable) are clearly disclosed, never hidden, and never added without visibility.',
      },
      {
        question: 'Who handles invoicing and taxes?',
        answer: 'Invoices are raised directly by the service expert. MarTechAdda does not issue invoices, does not collect GST on behalf of parties, and does not assume tax liability. Tax compliance remains between the service seeker and expert.',
      },
    ],
  },
  {
    id: 'after',
    title: 'After Engagement',
    items: [
      {
        question: 'What happens after all milestones are completed?',
        answer: 'Once the final milestone is approved, the engagement is marked Completed, deposits are fully released, and platform facilitation ends. Both parties may optionally share feedback.',
      },
      {
        question: 'Is feedback mandatory?',
        answer: 'No. Feedback is optional, neutral, and collected only after engagement completion. There are no ratings pressure, no public scoring, and no retaliation risk.',
      },
    ],
  },
  {
    id: 'trust',
    title: 'Why Businesses Trust MarTechAdda',
    items: [
      {
        question: 'Why should I trust MarTechAdda?',
        answer: 'MarTechAdda provides: no paid visibility, clear separation of roles, deposit protection, milestone-based control, transparent processes, and neutral facilitation. We are here to clarify—never to push.',
      },
    ],
  },
];

/**
 * Abridged FAQ for footer (3-5 most common questions)
 */
export const abridgedFAQ: FAQItem[] = [
  {
    question: 'What is MarTechAdda?',
    answer: 'MarTechAdda is a neutral platform that helps businesses discover, connect, and engage marketing experts. We do not sell services, rank experts, or influence outcomes.',
  },
  {
    question: 'Why does MarTechAdda collect a deposit?',
    answer: 'Deposits protect both sides. You retain control over fund release, experts are protected against non-payment, and funds move only after milestone approval.',
  },
  {
    question: 'Who controls deposit release?',
    answer: 'You do. For each milestone, you can approve & release, request revision, or reject. No approval = no release.',
  },
  {
    question: 'Is the deposit refundable?',
    answer: 'Deposits may be refunded if the engagement is cancelled before milestone approval, a milestone is rejected, or fraud occurs. Refunds depend on approved milestones and applicable policies.',
  },
];

/**
 * Contact email
 */
export const FAQ_CONTACT_EMAIL = 'support@martechadda.com';

