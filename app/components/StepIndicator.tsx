'use client';

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            {/* Circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                step.number === currentStep
                  ? 'bg-black border-black text-white'
                  : step.number < currentStep
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {step.number < currentStep ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="font-semibold">{step.number}</span>
              )}
            </div>
            {/* Labels */}
            <div className="text-center mt-3">
              <p className={`text-sm font-medium ${step.number === currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>
            </div>
          </div>
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-gray-200 mx-4 mt-[-50px]">
              <div
                className={`h-full transition-all ${step.number < currentStep ? 'bg-black' : 'bg-gray-200'}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

