'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import StepIndicator from '@/app/components/StepIndicator';
import CampaignStep from './steps/CampaignStep';
import ProductStep from './steps/ProductStep';
import CreatorsStep from './steps/CreatorsStep';
import AssetsStep from './steps/AssetsStep';
import ReviewStep from './steps/ReviewStep';

const steps = [
  { number: 1, title: 'Campaign', subtitle: 'Basic details' },
  { number: 2, title: 'Product', subtitle: 'Product info' },
  { number: 3, title: 'Creators', subtitle: 'Preferences' },
  { number: 4, title: 'Assets', subtitle: 'Requirements' },
  { number: 5, title: 'Review', subtitle: 'Summary' },
];

export default function NewCampaign() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Campaign data
    campaignName: '',
    campaignType: 'ugc',
    visibility: 'public',
    brand: '',
    
    // Product data
    product: '',
    retailPrice: '',
    shippingRequired: false,
    
    // Creator preferences
    ageRange: [],
    location: [],
    gender: [],
    ethnicity: [],
    industries: [],
    
    // Assets
    deliverables: [],
    guidelines: '',
    deadline: '',
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CampaignStep data={formData} updateData={updateFormData} />;
      case 2:
        return <ProductStep data={formData} updateData={updateFormData} />;
      case 3:
        return <CreatorsStep data={formData} updateData={updateFormData} />;
      case 4:
        return <AssetsStep data={formData} updateData={updateFormData} />;
      case 5:
        return <ReviewStep data={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Link href="/campaigns" className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-gray-900 font-medium text-sm">New Campaign</span>
          <button className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg">
            Publish
          </button>
        </div>
      </div>

      <main className="md:ml-64 flex-1 pt-16 md:pt-0">
        {/* Header */}
        <div className="hidden md:block bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">Campaigns › Create Campaign</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">New Campaign</h1>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Save Draft
              </button>
              <button className="px-4 sm:px-5 py-2 bg-black text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 md:mb-10 overflow-x-auto">
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[500px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg transition-colors order-2 sm:order-1 ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === 5}
                className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-lg transition-colors order-1 sm:order-2 ${
                  currentStep === 5
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

