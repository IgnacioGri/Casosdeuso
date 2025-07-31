import { Check, Clock, FileText, Settings, Bot, FileSearch, Search, Table, Database, Code, Cog, Zap, Info, Shield, TestTube, Globe } from "lucide-react";

interface EnhancedProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  useCaseType: string;
}

const getStepInfo = (stepNumber: number, useCaseType: string) => {
  if (useCaseType === 'entity') {
    const entitySteps = [
      { name: "Modelo IA", icon: Bot },
      { name: "Tipo", icon: FileSearch },
      { name: "Info Básica", icon: FileText },
      { name: "Descripción", icon: Info },
      { name: "Filtros", icon: Search },
      { name: "Columnas", icon: Table },
      { name: "Campos", icon: Database },
      { name: "Reglas", icon: Shield },
      { name: "Pruebas", icon: TestTube },
      { name: "Revisión", icon: Zap }
    ];
    return entitySteps[stepNumber - 1] || { name: `Paso ${stepNumber}`, icon: FileText };
  } else if (useCaseType === 'api' || useCaseType === 'service') {
    const apiServiceSteps = [
      { name: "Modelo IA", icon: Bot },
      { name: "Tipo", icon: FileSearch },
      { name: "Info Básica", icon: FileText },
      { name: "Descripción", icon: Info },
      { name: "Detalles", icon: Globe },
      { name: "Reglas", icon: Shield },
      { name: "Pruebas", icon: TestTube },
      { name: "Revisión", icon: Zap }
    ];
    return apiServiceSteps[stepNumber - 1] || { name: `Paso ${stepNumber}`, icon: FileText };
  } else {
    // Default steps while type is not selected
    return { name: `Paso ${stepNumber}`, icon: FileText };
  }
};

export default function EnhancedProgressIndicator({ currentStep, totalSteps, useCaseType }: EnhancedProgressIndicatorProps) {
  return (
    <div className="mb-8 bg-white dark:bg-gray-900 p-6 rounded-lg border shadow-sm">
      <div className="relative mb-6">
        <div className="flex items-start justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const stepInfo = getStepInfo(stepNumber, useCaseType);
            const StepIcon = stepInfo.icon;
            
            return (
              <div key={stepNumber} className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-medium transition-all duration-200 mb-1 relative
                    ${isCompleted 
                      ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105' 
                      : isCurrent 
                        ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md animate-pulse' 
                        : 'border-gray-300 text-gray-400 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : isCurrent ? <Clock className="w-4 h-4" /> : <StepIcon className="w-3 h-3" />}
                </div>
                <div className={`text-[10px] font-medium text-center max-w-16 leading-tight ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 
                  isCompleted ? 'text-green-600 dark:text-green-400' : 
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {stepInfo.name}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Background progress line - positioned to cross through center of icons */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-300 dark:bg-gray-600 -z-10" />
        
        {/* Completed progress line */}
        <div 
          className="absolute top-4 left-4 h-0.5 bg-green-600 transition-all duration-500 ease-out -z-10"
          style={{ 
            width: `${Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100)}%`
          }}
        />
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {getStepInfo(currentStep, useCaseType).name}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Paso {currentStep} de {totalSteps}
        </div>
      </div>
    </div>
  );
}