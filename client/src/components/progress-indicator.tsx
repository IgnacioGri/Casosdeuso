import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-ms-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Progreso del Formulario</h2>
        <span className="text-sm text-gray-600">
          Paso <span className="font-medium text-ms-blue">{currentStep}</span> de {totalSteps}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                    ? 'bg-ms-blue text-white' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              
              {stepNumber < totalSteps && (
                <div className="flex-1 h-1 mx-2 bg-gray-200">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      stepNumber < currentStep ? 'bg-green-500' : 
                      stepNumber === currentStep ? 'bg-ms-blue' : 'bg-gray-200'
                    }`}
                    style={{ 
                      width: stepNumber < currentStep ? '100%' : 
                             stepNumber === currentStep ? '50%' : '0%' 
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
