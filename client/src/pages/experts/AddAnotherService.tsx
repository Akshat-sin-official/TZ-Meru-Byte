/**
 * Add Another Service Flow
 * 
 * Smart reuse of previous preferences when adding a new service
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { CORE_SERVICE_CATEGORIES, SUB_SERVICES } from '@/data/taxonomy';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';

const AddAnotherService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previousService = searchParams.get('previousService') || '';
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([]);

  // Fetch saved requirement (last engagement's filters)
  const { data: savedRequirements } = useQuery({
    queryKey: ['savedRequirements'],
    queryFn: () => searchService.getSavedRequirements(),
  });

  // Get the most recent saved requirement
  const lastRequirement = savedRequirements?.[0];

  useEffect(() => {
    // Auto-select service if provided
    if (previousService) {
      setSelectedService(previousService);
    }
  }, [previousService]);

  const handleServiceSelect = (service: string) => {
    if (service === previousService) {
      return; // Can't select the same service
    }
    setSelectedService(service);
    setSelectedSubServices([]);
  };

  const toggleSubService = (subService: string) => {
    setSelectedSubServices((prev) =>
      prev.includes(subService)
        ? prev.filter((s) => s !== subService)
        : [...prev, subService]
    );
  };

  const handleContinue = () => {
    if (!selectedService) {
      return;
    }

    // Build filters from saved requirement + new service selection
    const filters: any = {};

    // New service selection
    filters.coreServiceCategories = [selectedService];
    if (selectedSubServices.length > 0) {
      filters.subServices = selectedSubServices;
    }

    // Reuse all other filters from saved requirement
    if (lastRequirement?.filters) {
      const savedFilters = lastRequirement.filters;
      // Don't override service category, but reuse everything else
      if (savedFilters.industrySectors) filters.industrySectors = savedFilters.industrySectors;
      if (savedFilters.subIndustries) filters.subIndustries = savedFilters.subIndustries;
      if (savedFilters.location) filters.location = savedFilters.location;
      if (savedFilters.clientScales) filters.clientScales = savedFilters.clientScales;
      if (savedFilters.businessTypesServed) filters.businessTypesServed = savedFilters.businessTypesServed;
      if (savedFilters.clientEngagementTypes) filters.clientEngagementTypes = savedFilters.clientEngagementTypes;
      if (savedFilters.engagementModels) filters.engagementModels = savedFilters.engagementModels;
      if (savedFilters.deliveryChannels) filters.deliveryChannels = savedFilters.deliveryChannels;
      if (savedFilters.preferredDeliverySpeed) filters.preferredDeliverySpeed = savedFilters.preferredDeliverySpeed;
      if (savedFilters.languages) filters.languages = savedFilters.languages;
      if (savedFilters.pricingStyle) filters.pricingStyle = savedFilters.pricingStyle;
      if (savedFilters.hasPortfolio !== undefined) filters.hasPortfolio = savedFilters.hasPortfolio;
      if (savedFilters.hasToolsListed !== undefined) filters.hasToolsListed = savedFilters.hasToolsListed;
      if (savedFilters.kycVerified !== undefined) filters.kycVerified = savedFilters.kycVerified;
      if (savedFilters.verifiedCertifications !== undefined) filters.verifiedCertifications = savedFilters.verifiedCertifications;
      if (savedFilters.complianceCompleted !== undefined) filters.complianceCompleted = savedFilters.complianceCompleted;
      if (savedFilters.serviceDeliveryStates) filters.serviceDeliveryStates = savedFilters.serviceDeliveryStates;
      if (savedFilters.panIndiaAvailable !== undefined) filters.panIndiaAvailable = savedFilters.panIndiaAvailable;
      if (savedFilters.subEntityType) filters.subEntityType = savedFilters.subEntityType;
      if (savedFilters.experienceRange) filters.experienceRange = savedFilters.experienceRange;
    }

    // Save filters to sessionStorage for ExpertDiscovery to pick up
    sessionStorage.setItem('addServiceFilters', JSON.stringify(filters));

    // Navigate to expert discovery
    navigate(`/experts?mode=add-service&service=${encodeURIComponent(selectedService)}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto border-2 border-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">What else do you need help with?</CardTitle>
            <CardDescription>
              We've reused your previous preferences. You can change anything if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Choose New Service */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose New Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORE_SERVICE_CATEGORIES.map((service) => {
                  const isPrevious = service === previousService;
                  const isSelected = service === selectedService;
                  return (
                    <button
                      key={service}
                      onClick={() => !isPrevious && handleServiceSelect(service)}
                      disabled={isPrevious}
                      className={`p-6 border-2 rounded-lg transition-all text-left ${isPrevious
                        ? 'border-foreground/20 bg-muted opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-foreground/20 hover:border-primary/50 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{service}</h4>
                        {isPrevious && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Sub-Services */}
            {selectedService && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Sub-Services</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose specific services within {selectedService}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(SUB_SERVICES[selectedService] || []).map((subService) => (
                    <label
                      key={subService}
                      className="flex items-center space-x-2 p-3 border-2 border-foreground/10 rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubServices.includes(subService)}
                        onChange={() => toggleSubService(subService)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{subService}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reused Preferences Info */}
            {lastRequirement && (
              <div className="p-4 bg-muted/50 rounded-lg border-2 border-foreground/10">
                <h4 className="font-semibold mb-2">Reused from Previous Requirement</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  We've reused your previous preferences. You can change anything if needed.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lastRequirement.filters.industrySectors && (
                    <Badge variant="outline">Industry: {lastRequirement.filters.industrySectors[0]}</Badge>
                  )}
                  {lastRequirement.filters.location && (
                    <Badge variant="outline">Location: {lastRequirement.filters.location}</Badge>
                  )}
                  {lastRequirement.filters.engagementModels && (
                    <Badge variant="outline">Model: {lastRequirement.filters.engagementModels[0]}</Badge>
                  )}
                  {lastRequirement.filters.clientScales && (
                    <Badge variant="outline">Client Scale: {lastRequirement.filters.clientScales[0]}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedService}
                className="flex-1 gap-2"
              >
                Continue to Search & Filter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AddAnotherService;

