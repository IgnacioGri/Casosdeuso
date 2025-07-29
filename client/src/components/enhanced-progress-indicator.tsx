import { Check, Clock, FileText, Settings, Boxes, Search, Table, Database, Code, Cog, Zap } from "lucide-react";

interface EnhancedProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  useCaseType: string;
}

const getStepInfo = (stepNumber: number, useCaseType: string) => {
  const baseSteps = [
    { name: "Información básica", icon: FileText },
    { name: "Detalles del caso", icon: Settings },
    { name: "Reglas de negocio", icon: Boxes }
  ];

  if (useCaseType === 'entity') {
    return [
      ...baseSteps,
      { name: "Filtros de búsqueda", icon: Search },
      { name: "Columnas resultado", icon: Table },
      { name: "Campos entidad", icon: Database },
      { name: "Configuración", icon: Cog },
      { name: "Revisión y Generación", icon: Zap }
    ][stepNumber - 1] || { name: `Paso ${stepNumber}`, icon: FileText };
  } else if (useCaseType === 'api') {
    return [
      ...baseSteps,
      { name: "Configuración API", icon: Code },
      { name: "Formatos de datos", icon: Settings },
      { name: "Revisión y Generación", icon: Zap }
    ][stepNumber - 1] || { name: `Paso ${stepNumber}`, icon: FileText };
  } else {
    return [
      ...baseSteps,
      { name: "Configuración servicio", icon: Cog },
      { name: "Parámetros ejecución", icon: Settings },
      { name: "Revisión y Generación", icon: Zap }
    ][stepNumber - 1] || { name: `Paso ${stepNumber}`, icon: FileText };
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
                    flex items-center justify-center w-12 h-12 rounded-full border-2 text-sm font-medium transition-all duration-200 mb-2 relative
                    ${isCompleted 
                      ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105' 
                      : isCurrent 
                        ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md animate-pulse' 
                        : 'border-gray-300 text-gray-400 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : isCurrent ? <Clock className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <div className={`text-xs font-medium text-center max-w-20 leading-tight ${
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
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-300 dark:bg-gray-600 -z-10" />
        
        {/* Completed progress line */}
        <div 
          className="absolute top-6 left-6 h-0.5 bg-green-600 transition-all duration-500 ease-out -z-10"
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