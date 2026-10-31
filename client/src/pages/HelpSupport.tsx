import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppDashboardLayout } from '@/components/layout/AppDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSidebar } from '@/hooks/useAppSidebar';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Book,
  Send,
  Search,
} from 'lucide-react';

import { useMutation } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import { faqSections, FAQ_CONTACT_EMAIL } from '@/data/faqData';
import { FAQAccordion } from '@/components/faq/FAQAccordion';

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sidebarSections = useAppSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general',
  });

  const createTicketMutation = useMutation({
    mutationFn: supportService.createTicket,
    onSuccess: () => {
      toast.success('Your message has been sent. We\'ll get back to you soon!');
      setContactForm({ subject: '', message: '', category: 'general' });
    },
    onError: () => {
      toast.error('Failed to send message. Please try again.');
    }
  });

  const handleSubmit = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }
    createTicketMutation.mutate(contactForm);
  };

  const filteredSections = faqSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <AppDashboardLayout
      user={{
        name: user?.name || 'User',
        role: user?.role === 'expert' ? 'Marketing Expert' : user?.role === 'admin' ? 'Platform Administrator' : 'Business Owner',
      }}
      sections={sidebarSections}
      onSignOut={() => navigate('/login')}
      headerTitle="Help & Support"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Help & Support</h1>
            <p className="text-sm text-muted-foreground mt-1">Find answers or contact our team</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                <Book className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Browse through our detailed guides and tutorials to master the platform.</CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Chat with our support team in real-time for immediate assistance.</CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                <Mail className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-lg">Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Send us an email for complex queries. We typically respond within 24 hours.</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQs Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for answers..."
                className="pl-9 h-11 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <FAQAccordion
                sections={filteredSections}
                showSearch={false}
              />

              {filteredSections.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                  <div className="flex justify-center mb-3">
                    <Search className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search terms or browse the categories above.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="account">Account Issues</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Detailed explanation of your issue..."
                    className="min-h-[150px]"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-primary" disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? 'Sending...' : 'Send Message'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full mt-0.5">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Still have questions?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Contact us at {FAQ_CONTACT_EMAIL}. We're here to clarify—never to push.
                  </p>
                  <Button
                    variant="link"
                    className="px-0 text-blue-700 h-auto mt-2 font-medium"
                    onClick={() => window.location.href = `mailto:${FAQ_CONTACT_EMAIL}`}
                  >
                    Send Email &rarr;
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppDashboardLayout>
  );
};

export default HelpSupport;
