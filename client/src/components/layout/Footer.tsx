import { Link } from 'react-router-dom';
import { Linkedin, Facebook, Youtube, Instagram, Globe } from 'lucide-react';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { abridgedFAQ } from '@/data/faqData';

const MAIN_WEBSITE_URL = 'https://martechadda.com';

interface FooterLinkItem {
  label: string;
  path: string;
  isExternal?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Marketing Services",
    links: [
      { label: "Brand Strategy", path: `${MAIN_WEBSITE_URL}/services?cat=Branding+Services`, isExternal: true },
      { label: "Digital Marketing", path: `${MAIN_WEBSITE_URL}/services?cat=Advertising+Services`, isExternal: true },
      { label: "Performance Marketing", path: `${MAIN_WEBSITE_URL}/services?cat=Paid+%26+Performance+Advertising`, isExternal: true },
      { label: "Creative & Design", path: `${MAIN_WEBSITE_URL}/services?cat=Branding+Services`, isExternal: true },
      { label: "Content Marketing", path: `${MAIN_WEBSITE_URL}/services?cat=Strategic+Marketing+Services`, isExternal: true },
      { label: "Marketing Technology", path: `${MAIN_WEBSITE_URL}/services`, isExternal: true },
    ],
  },
  {
    title: "How It Works",
    links: [
      { label: "Share Requirement", path: `${MAIN_WEBSITE_URL}/how-it-works`, isExternal: true },
      { label: "Get Matched", path: `${MAIN_WEBSITE_URL}/how-it-works`, isExternal: true },
      { label: "Collaborate", path: `${MAIN_WEBSITE_URL}/how-it-works`, isExternal: true },
      { label: "Manage Projects", path: `${MAIN_WEBSITE_URL}/how-it-works`, isExternal: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Marketing Guides", path: `${MAIN_WEBSITE_URL}/resources/outsourcing-guides`, isExternal: true },
      { label: "Service Explanations", path: `${MAIN_WEBSITE_URL}/resources`, isExternal: true },
      { label: "Hiring & Evaluation Guides", path: `${MAIN_WEBSITE_URL}/resources/hiring-guides`, isExternal: true },
      { label: "Marketing Glossary", path: `${MAIN_WEBSITE_URL}/resources/glossary`, isExternal: true },
      { label: "FAQs", path: `${MAIN_WEBSITE_URL}/resources/faq`, isExternal: true },
    ],
  },
  {
    title: "For Experts",
    links: [
      { label: "Join as Expert", path: "/register" },
      { label: "Independent Consultants", path: "/experts" },
      { label: "Freelance Experts", path: "/experts" },
      { label: "Boutique Agencies", path: "/experts" },
      { label: "Expert Firms", path: "/experts" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Why MarTechAdda", path: `${MAIN_WEBSITE_URL}/why-martechadda`, isExternal: true },
      { label: "Trust & Safety", path: `${MAIN_WEBSITE_URL}/why-martechadda`, isExternal: true },
      { label: "Requirement-First Model", path: `${MAIN_WEBSITE_URL}/how-it-works`, isExternal: true },
      { label: "Privacy Policy", path: `${MAIN_WEBSITE_URL}/privacy`, isExternal: true },
      { label: "Terms of Service", path: `${MAIN_WEBSITE_URL}/terms`, isExternal: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", path: `${MAIN_WEBSITE_URL}/about`, isExternal: true },
      { label: "Contact Us", path: `${MAIN_WEBSITE_URL}/contact`, isExternal: true },
      { label: "Refund Policy", path: `${MAIN_WEBSITE_URL}/refund-policy`, isExternal: true },
      { label: "Newsroom", path: `${MAIN_WEBSITE_URL}/about`, isExternal: true },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background text-foreground">
      {/* Columns */}
      <div className="mx-auto max-w-[1240px] px-5 py-14">
        <div className="grid gap-10 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLUMNS.map((c) => (
            <div key={c.title}>
              <h4 className="text-[12px] font-semibold font-poppins uppercase tracking-[0.18em] text-foreground">
                {c.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((linkItem) => (
                  <li key={linkItem.label}>
                    {linkItem.isExternal ? (
                      <a
                        href={linkItem.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                      >
                        {linkItem.label}
                      </a>
                    ) : (
                      <Link
                        to={linkItem.path}
                        className="text-[14px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                      >
                        {linkItem.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Corporate & Registration Information */}
        <div className="mt-14 border-t border-border pt-8 grid gap-4 text-[13px] leading-relaxed text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="font-semibold text-foreground block mb-1">Corporate Details</span>
            <span className="block text-foreground font-medium">MarTechAdda Private Limited</span>
            <span className="block">CIN: U62099MH2025PTC456979</span>
            <span className="block">GSTIN: 27AATCM8716B1Z6</span>
            <span className="block">Startup India: DIPP237729</span>
            <span className="block">Udyam: UDYAM-MH-19-0393544</span>
          </div>
          <div className="md:mx-auto">
            <span className="font-semibold text-foreground block mb-1">Registered Office</span>
            <span>Parinee Crescenzo, 17th Floor</span>
            <span className="block">Bandra Kurla Complex (BKC)</span>
            <span className="block">Mumbai – 400051</span>
            <span className="block">Maharashtra, India</span>
          </div>
          <div className="md:ml-auto">
            <span className="font-semibold text-foreground block mb-1">Support</span>
            <a href="tel:+918104860682" className="hover:text-foreground block">Phone: +91 81048 60682</a>
            <a href="mailto:contact@martechadda.com" className="hover:text-foreground block">Email: contact@martechadda.com</a>
          </div>
        </div>

        {/* Abridged FAQ Section */}
        <div className="mt-12 border-t border-border/20 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h3>
            <a href={`${MAIN_WEBSITE_URL}/resources/faq`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              View All FAQs →
            </a>
          </div>
          <div className="max-w-4xl">
            <FAQAccordion items={abridgedFAQ} />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-border/50 pt-8 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> English (IN)
              </span>
              <span>© {new Date().getFullYear()} MarTechAdda Private Limited. All Rights Reserved.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: Linkedin, href: "https://www.linkedin.com/company/martechadda/" },
              { icon: Youtube, href: "https://www.youtube.com/@MarTechAdda" },
              { icon: Instagram, href: "https://www.instagram.com/martechadda/" },
              { icon: Facebook, href: "https://www.facebook.com/martechadda/" }
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                aria-label="Social link"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
