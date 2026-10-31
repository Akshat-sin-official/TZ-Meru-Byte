/**
 * FAQ Accordion Component
 * 
 * Reusable component for displaying FAQs in accordion format
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { FAQItem, FAQSection } from '@/data/faqData';

interface FAQAccordionProps {
  sections?: FAQSection[];
  items?: FAQItem[];
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export function FAQAccordion({
  sections,
  items,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  className = '',
}: FAQAccordionProps) {
  // If items are provided directly, use them
  if (items) {
    const filteredItems = showSearch && searchQuery
      ? items.filter(
          (item) =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

    return (
      <div className={className}>
        <Accordion type="single" collapsible className="w-full">
          {filteredItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white border rounded-lg px-4 mb-2"
            >
              <AccordionTrigger className="hover:no-underline py-4 text-sm font-medium">
                <div className="flex items-center gap-3 text-left">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pl-7">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  // If sections are provided, organize by section
  if (sections) {
    const filteredSections = showSearch && searchQuery
      ? sections.map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        })).filter((section) => section.items.length > 0)
      : sections;

    return (
      <div className={className}>
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              <Accordion type="single" collapsible className="w-full">
                {section.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.id}-${index}`}
                    className="bg-white border rounded-lg px-4 mb-2"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-medium">
                      <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                        {item.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 pl-7">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

