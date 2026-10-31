import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services';
import WebsiteLayout from '@/components/website/WebsiteLayout';
import RequestedDocsStep from '@/components/website/steps/RequestedDocsStep';
import { FiFileText, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from '@/components/website/ServiceExpert.module.css';
import { PAN_REGEX, GSTIN_REGEX, IFSC_REGEX, CIN_REGEX, LLPIN_REGEX, PINCODE_REGEX } from '@/components/website/utils/helpers';
import { fileToBase64, compressImage } from '@/utils/fileUtils';

const RequestedDocsPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [activeUpdates, setActiveUpdates] = useState({
    profileAssets: false,
    portfolio: false,
    entity: false,
    gst: false,
    address: false,
    bank: false
  });

  const [formData, setFormData] = useState({
    documentsRequested: true,
    requestedDocuments: [],
    entityType: 'proprietorship',
    gstRegistered: 'no',
    panNumber: '',
    gstNumber: '',
    cinNumber: '',
    llpinNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    country: 'India',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    accountType: 'savings',
    branchName: '',
    upiId: '',
    documents: [],
    logoFile: null,
    profileImageFile: null,
    gstCertificateFile: null,
    bankProofFile: null,
    addressProofFile: null,
    gstCertificateUrl: '',
    addressProofUrl: '',
    bankProofUrl: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { expertService } = await import('@/services/expertService');
        const profile = await expertService.getOnboardingFullProfile();
        
        if (profile) {
          setProfileData(profile);
          setFormData(prev => ({
            ...prev,
            ...profile,
            requestedDocuments: profile.requestedDocuments || [],
            businessName: profile.businessName || profile.displayName || '',
            // Pre-fill existing values if available
            entityType: profile.entityType || 'proprietorship',
            gstRegistered: profile.gstStatus === 'registered' || (profile.gstNumber && profile.gstNumber.length > 0) ? 'yes' : 'no',
            panNumber: profile.panNumber || '',
            gstNumber: profile.gstNumber || '',
            cinNumber: profile.cinNumber || '',
            llpinNumber: profile.llpinNumber || '',
            addressLine1: profile.registeredAddress?.line1 || '',
            addressLine2: profile.registeredAddress?.line2 || '',
            city: profile.registeredAddress?.city || '',
            state: profile.registeredAddress?.state || 'Maharashtra',
            pincode: profile.registeredAddress?.pincode || '',
            country: profile.registeredAddress?.country || 'India',
            bankName: profile.bankDetails?.bankName || '',
            accountNumber: profile.bankDetails?.accountNumber || '',
            ifscCode: profile.bankDetails?.ifscCode || '',
            accountHolderName: profile.bankDetails?.accountHolderName || '',
            accountType: profile.bankDetails?.accountType || 'savings',
            branchName: profile.bankDetails?.branchName || '',
            upiId: profile.bankDetails?.upiId || '',
            gstCertificateUrl: profile.documents?.find(d => d.documentType === 'GST Certificate' || d.documentType === 'gst_certificate')?.fileUrl || '',
            addressProofUrl: profile.registeredAddress?.proofUrl || '',
            bankProofUrl: profile.bankDetails?.proofUrl || '',
          }));

          // Compute dynamic checklist of requested documents
          let req = profile.requestedDocuments || [];
          if (req.length === 0 && !profile.kycVerified) {
            req = ['panCard', 'registeredAddressProof', 'bankDetailsProof'];
            if (profile.gstStatus === 'registered' || (profile.gstNumber && profile.gstNumber.length > 0)) {
              req.push('gstCertificate');
            }
            if (['opc', 'pvt_ltd', 'public_ltd'].includes(profile.entityType || 'proprietorship')) {
              req.push('cinCertificate');
            }
            if (profile.entityType === 'llp') {
              req.push('llpinCertificate');
            }
          }

          // Smart auto-toggles: Only enable editing on requested items if no existing data exists
          const hasLogoData = !!(profile.logoUrl || profile.profileImageUrl);
          const hasPortfolioData = !!(profile.portfolioItems?.length > 0 || profile.certifications?.length > 0);
          const hasEntityData = !!profile.panNumber;
          const hasGstData = !!(profile.gstNumber || profile.documents?.some(d => d.documentType === 'GST Certificate' || d.documentType === 'gst_certificate'));
          const hasAddressData = !!profile.registeredAddress?.line1;
          const hasBankData = !!(profile.bankDetails?.bankName && profile.bankDetails?.accountNumber);

          setActiveUpdates({
            profileAssets: (req.includes('businessLogo') || req.includes('profileImage')) ? !hasLogoData : false,
            portfolio: (req.includes('portfolioItems') || req.includes('certifications')) ? !hasPortfolioData : false,
            entity: (req.includes('panCard') || req.includes('cinCertificate') || req.includes('llpinCertificate')) ? !hasEntityData : false,
            gst: req.includes('gstCertificate') ? !hasGstData : false,
            address: req.includes('registeredAddressProof') ? !hasAddressData : false,
            bank: req.includes('bankDetailsProof') ? !hasBankData : false
          });

          if (!profile.documentsRequested) {
            // Don't redirect — allow expert to view/update compliance documents
            // even when admin hasn't explicitly requested them
            // Only show info toast if they came from a document request notification
            const fromNotification = new URLSearchParams(window.location.search).get('from') === 'notification';
            if (fromNotification) {
              toast.info("No additional documents are currently requested.");
              navigate('/expert/dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error("Failed to load request details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDocumentChange = (file, docType) => {
    if (!file) return;
    
    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File ${file.name} is too large. Max size is 10MB.`);
      return;
    }

    setFormData(prev => {
      const otherDocs = (prev.documents || []).filter(d => d.type !== docType && d.documentType !== docType);
      return {
        ...prev,
        documents: [...otherDocs, { type: docType, file: file, name: file.name }]
      };
    });
  };

  const handleSectionToggle = (section) => {
    setActiveUpdates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validate = () => {
    const errors = {};
    const requested = formData.requestedDocuments || [];

    // 1. PAN / CIN / LLPIN & Entity Documents Validation
    if (activeUpdates.entity) {
      if (requested.includes('panCard')) {
        if (!formData.panNumber?.trim()) {
          errors.panNumber = 'PAN number is required';
        } else if (!PAN_REGEX.test(formData.panNumber.trim().toUpperCase())) {
          errors.panNumber = 'Invalid PAN format';
        }
      } else if (formData.panNumber?.trim()) {
        if (!PAN_REGEX.test(formData.panNumber.trim().toUpperCase())) {
          errors.panNumber = 'Invalid PAN format';
        }
      }

      if (['opc', 'pvt_ltd', 'public_ltd'].includes(formData.entityType)) {
        if (requested.includes('cinCertificate')) {
          if (!formData.cinNumber?.trim()) {
            errors.cinNumber = 'CIN is required';
          } else if (!CIN_REGEX.test(formData.cinNumber.trim().toUpperCase())) {
            errors.cinNumber = 'Invalid CIN format';
          }
        } else if (formData.cinNumber?.trim()) {
          if (!CIN_REGEX.test(formData.cinNumber.trim().toUpperCase())) {
            errors.cinNumber = 'Invalid CIN format';
          }
        }
      }

      if (formData.entityType === 'llp') {
        if (requested.includes('llpinCertificate')) {
          if (!formData.llpinNumber?.trim()) {
            errors.llpinNumber = 'LLPIN is required';
          } else if (!LLPIN_REGEX.test(formData.llpinNumber.trim().toUpperCase())) {
            errors.llpinNumber = 'Invalid LLPIN format';
          }
        } else if (formData.llpinNumber?.trim()) {
          if (!LLPIN_REGEX.test(formData.llpinNumber.trim().toUpperCase())) {
            errors.llpinNumber = 'Invalid LLPIN format';
          }
        }
      }

      // Entity Documents Checklist validation
      const docRequirements = {
        proprietorship: ['Proprietor PAN'],
        partnership: ['Firm PAN', 'Partnership Deed'],
        llp: ['LLPIN', 'LLP PAN'],
        opc: ['CIN', 'Company PAN'],
        pvt_ltd: ['CIN', 'Company PAN'],
        public_ltd: ['CIN', 'Company PAN'],
      };
      
      const requiredTypes = docRequirements[formData.entityType] || [];
      const uploadedDocs = (formData.documents || []).map(d => d.type || d.documentType);
      const missingDocs = requiredTypes.filter(doc => {
        const isDocRequested = (doc === 'Proprietor PAN' && requested.includes('panCard')) ||
                              (doc === 'Firm PAN' && requested.includes('panCard')) ||
                              (doc === 'LLP PAN' && requested.includes('panCard')) ||
                              (doc === 'Company PAN' && requested.includes('panCard')) ||
                              (doc === 'Partnership Deed' && requested.includes('partnershipDeed')) ||
                              (doc === 'LLPIN' && requested.includes('llpinCertificate')) ||
                              (doc === 'CIN' && requested.includes('cinCertificate'));
        return isDocRequested && !uploadedDocs.includes(doc);
      });

      if (missingDocs.length > 0) {
        errors.documents = `Please upload the required documents: ${missingDocs.join(', ')}`;
      }
    }

    // 2. GST Details Validation
    if (activeUpdates.gst) {
      if (requested.includes('gstCertificate') || (formData.gstRegistered === 'yes' && !profileData?.gstNumber)) {
        if (formData.gstRegistered === 'yes') {
          if (!formData.gstNumber?.trim()) {
            errors.gstNumber = 'GST Number is required';
          } else if (!GSTIN_REGEX.test(formData.gstNumber.trim().toUpperCase())) {
            errors.gstNumber = 'Invalid GST format';
          }
          
          if (!formData.gstCertificateFile && !formData.gstCertificateUrl) {
            errors.gstCertificateFile = 'GST Certificate is required';
          }
        }
      } else if (formData.gstRegistered === 'yes' && formData.gstNumber?.trim()) {
        if (!GSTIN_REGEX.test(formData.gstNumber.trim().toUpperCase())) {
          errors.gstNumber = 'Invalid GST format';
        }
      }
    }

    // 3. Entity Type Validation
    if (!formData.entityType) {
      errors.entityType = 'Entity type is required';
    }

    // 5. Address Details Validation
    if (activeUpdates.address) {
      const hasAddressField = formData.addressLine1?.trim() || formData.city?.trim() || formData.pincode?.trim();
      const hasExistingAddress = profileData?.registeredAddress?.line1;
      
      if (requested.includes('registeredAddressProof') || (hasAddressField && !hasExistingAddress)) {
        if (!formData.addressLine1?.trim()) errors.addressLine1 = 'Address Line 1 is required';
        if (!formData.city?.trim()) errors.city = 'City is required';
        if (!formData.pincode?.trim()) {
          errors.pincode = 'Pincode is required';
        } else if (!PINCODE_REGEX.test(formData.pincode.trim())) {
          errors.pincode = 'Invalid Pincode (must be 6 digits)';
        }

        if (formData.gstRegistered !== 'yes' && !formData.addressProofFile && !formData.addressProofUrl) {
          errors.addressProofFile = 'Address proof document is required';
        }
      } else if (hasAddressField) {
        if (formData.pincode?.trim() && !PINCODE_REGEX.test(formData.pincode.trim())) {
          errors.pincode = 'Invalid Pincode (must be 6 digits)';
        }
      }
    }

    // 6. Bank Details Validation
    if (activeUpdates.bank) {
      const hasBankField = formData.bankName?.trim() || formData.accountNumber?.trim() || formData.ifscCode?.trim() || formData.accountHolderName?.trim();
      const hasExistingBank = profileData?.bankDetails?.bankName && profileData?.bankDetails?.accountNumber;
      
      if (requested.includes('bankDetailsProof') || (hasBankField && !hasExistingBank)) {
        if (!formData.accountHolderName?.trim()) errors.accountHolderName = 'Account holder name is required';
        if (!formData.bankName?.trim()) errors.bankName = 'Bank name is required';
        if (!formData.accountNumber?.trim()) errors.accountNumber = 'Account number is required';
        if (!formData.ifscCode?.trim()) {
          errors.ifscCode = 'IFSC code is required';
        } else if (!IFSC_REGEX.test(formData.ifscCode.trim().toUpperCase())) {
          errors.ifscCode = 'Invalid IFSC format';
        }
        
        if (!formData.bankProofFile && !formData.bankProofUrl) {
          errors.bankProofFile = 'Bank proof document is required';
        }
      } else if (hasBankField) {
        if (formData.ifscCode?.trim() && !IFSC_REGEX.test(formData.ifscCode.trim().toUpperCase())) {
          errors.ifscCode = 'Invalid IFSC format';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parallel File Conversion
      const conversions = {};
      const tasks = [];

      const safeConvert = async (file, key) => {
        if (!file) return;
        try {
          let base64;
          if (file.type?.startsWith('image/')) {
            base64 = await compressImage(file, 1200, 0.7);
          } else {
            base64 = await fileToBase64(file);
          }
          conversions[key] = { base64, mimeType: file.type, fileName: file.name };
        } catch (err) {
          console.error(`Failed to convert ${key}:`, err);
        }
      };

      formData.documents?.forEach((doc, i) => {
        if (doc.file) tasks.push(safeConvert(doc.file, `doc_${doc.type || i}`));
      });

      if (formData.gstCertificateFile) tasks.push(safeConvert(formData.gstCertificateFile, 'gst_certificate'));
      if (formData.bankProofFile) tasks.push(safeConvert(formData.bankProofFile, 'bank_proof'));
      if (formData.addressProofFile) tasks.push(safeConvert(formData.addressProofFile, 'address_proof'));
      if (formData.logoFile) tasks.push(safeConvert(formData.logoFile, 'logo'));
      if (formData.profileImageFile) tasks.push(safeConvert(formData.profileImageFile, 'profile_image'));

      await Promise.all(tasks);

      // Prepare payload (fully open)
      const docs = [
        ...(formData.documents || []).map((doc, i) => {
          const type = doc.documentType || doc.type;
          const conv = conversions[`doc_${type}`];
          return {
            documentType: type,
            fileUrl: conv ? `data:${conv.mimeType};base64,${conv.base64}` : doc.url || doc.fileUrl,
            verified: doc.verified || false,
            uploadedAt: doc.uploadedAt || new Date()
          };
        }),
        // Add GST Certificate if present
        ...(formData.gstRegistered === 'yes' && conversions['gst_certificate'] ? [{
          documentType: 'GST Certificate',
          fileUrl: `data:${conversions['gst_certificate'].mimeType};base64,${conversions['gst_certificate'].base64}`,
          verified: false,
          uploadedAt: new Date()
        }] : (formData.gstRegistered === 'yes' && formData.gstCertificateUrl ? [{
          documentType: 'GST Certificate',
          fileUrl: formData.gstCertificateUrl,
          verified: false,
          uploadedAt: new Date()
        }] : []))
      ];

      // De-duplicate documents array by documentType to avoid redundant slots
      const finalDocs = docs.reduce((acc, current) => {
        const x = acc.find(item => item.documentType === current.documentType);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      const stage4 = {
        // Base legal details
        entityType: activeUpdates.entity ? formData.entityType : undefined,
        subEntityType: activeUpdates.entity ? (formData.businessRole || formData.roleType || 'Independent Consultant') : undefined,
        
        // PAN/CIN/LLPIN
        panNumber: activeUpdates.entity ? formData.panNumber : undefined,
        cinNumber: (activeUpdates.entity && ['opc', 'pvt_ltd', 'public_ltd'].includes(formData.entityType)) ? formData.cinNumber : undefined,
        llpinNumber: (activeUpdates.entity && formData.entityType === 'llp') ? formData.llpinNumber : undefined,
        
        // GST Status
        gstStatus: activeUpdates.gst ? (formData.gstRegistered === 'yes' ? 'registered' : 'not_registered') : undefined,
        gstNumber: (activeUpdates.gst && formData.gstRegistered === 'yes') ? formData.gstNumber : undefined,
        
        // Supporting files list (always kept aligned)
        documents: finalDocs,
        
        // Address details conditional update
        registeredAddress: activeUpdates.address ? {
          line1: formData.addressLine1,
          line2: formData.addressLine2 || undefined,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
          proofUrl: conversions['address_proof'] ? `data:${conversions['address_proof'].mimeType};base64,${conversions['address_proof'].base64}` : formData.addressProofUrl || undefined
        } : undefined,
        
        // Bank details conditional update
        bankDetails: activeUpdates.bank ? {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          accountHolderName: formData.accountHolderName,
          accountType: formData.accountType,
          branchName: formData.branchName,
          upiId: formData.upiId,
          proofUrl: conversions['bank_proof'] ? `data:${conversions['bank_proof'].mimeType};base64,${conversions['bank_proof'].base64}` : formData.bankProofUrl || undefined
        } : undefined
      };

      const stage1 = activeUpdates.profileAssets ? {
        logoUrl: conversions['logo'] ? `data:${conversions['logo'].mimeType};base64,${conversions['logo'].base64}` : undefined,
        profileImageUrl: conversions['profile_image'] ? `data:${conversions['profile_image'].mimeType};base64,${conversions['profile_image'].base64}` : undefined,
      } : undefined;

      const response = await apiClient.post('/v1/expert/onboarding/bulk-submit', { 
        stage1, 
        stage4,
        isPartialUpdate: true
      });

      if (response.data.success) {
        setIsSubmitted(true);
        toast.success("Documents submitted successfully! Our team will review them shortly.");
        await refreshUser();
        setTimeout(() => navigate('/expert/dashboard'), 3000);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(error.response?.data?.error || "Failed to submit documents.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <FiLoader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading request details...</p>
        </div>
      </WebsiteLayout>
    );
  }

  if (isSubmitted) {
    return (
      <WebsiteLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <FiCheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Successful!</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Thank you for providing the requested documents. We have received your update and our team will review it shortly.
          </p>
          <button 
            onClick={() => navigate('/expert/dashboard')}
            className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Update Required</h1>
                <p className="text-gray-500">Please provide the specific documents requested by our team.</p>
              </div>
            </div>

            {profileData?.documentsRequestedReason && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                <FiAlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">Admin Instructions:</p>
                  <p className="text-sm text-orange-700">{profileData.documentsRequestedReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              <RequestedDocsStep
                formData={formData}
                handleInputChange={handleInputChange}
                handleDocumentChange={handleDocumentChange}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                activeUpdates={activeUpdates}
                onSectionToggle={handleSectionToggle}
              />
            </div>

            {/* Footer / Actions */}
            <div className="bg-gray-50 border-t border-gray-100 p-8 flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/expert/dashboard')}
                className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                Back to Dashboard
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit for Verification <FiCheckCircle />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default RequestedDocsPage;
