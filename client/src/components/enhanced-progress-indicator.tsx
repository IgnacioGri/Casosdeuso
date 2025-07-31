import { Check, Clock, FileText, Settings, Bot, FileSearch, Search, Table, Database, Code, Cog, Zap, Info, Shield, TestTube, Globe } from "lucide-react";

interface EnhancedProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  useCaseType: string;
}

const getStepInfo = (stepNumber: number, useCaseType: string) => {
  // Step names for display in the main area
  const stepNames = [
    "Tipo de Caso de Uso",
    "Análisis Inteligente de Minutas", 
    "Información Básica",
    "Detalles del Caso de Uso",
    "Filtros de Búsqueda",
    "Columnas de Resultado",
    "Datos de la Entidad",
    "Opciones Adicionales",
    "Decisión sobre Casos de Prueba",
    "Casos de Prueba",
    "Revisión Final y Generación"
  ];

  // Icons based on step number and type
  const getIcon = () => {
    if (stepNumber === 1) return FileSearch;
    if (stepNumber === 2) return Bot;
    if (stepNumber === 3) return FileText;
    if (stepNumber === 4) return Info;
    
    if (useCaseType === 'entity') {
      if (stepNumber === 5) return Search;
      if (stepNumber === 6) return Table;
      if (stepNumber === 7) return Database;
      if (stepNumber === 8) return Shield;
      if (stepNumber === 9) return TestTube;
      if (stepNumber === 10) return TestTube;
      if (stepNumber === 11) return Zap;
    } else if (useCaseType === 'api' || useCaseType === 'service') {
      if (stepNumber === 5) return Globe;
      if (stepNumber === 6) return Shield;
      if (stepNumber === 7) return TestTube;
      if (stepNumber === 8) return Zap;
    }
    return FileText;
  };

  return {
    name: stepNames[stepNumber - 1] || `Paso ${stepNumber}`,
    icon: getIcon()
  };
};

const getStepShortName = (stepNumber: number, useCaseType: string) => {
  // Short names for display under icons
  const shortNames = [
    "Tipo",
    "Análisis",
    "Info Básica",
    "Detalles",
    "Filtros",
    "Columnas",
    "Campos",
    "Opciones",
    "Decisión",
    "Pruebas",
    "Generar"
  ];
  
  // Adjust short names based on use case type
  if (useCaseType === 'api' || useCaseType === 'service') {
    if (stepNumber === 5) return "Config";
    if (stepNumber === 6) return "Reglas";
    if (stepNumber === 7) return "Pruebas";
    if (stepNumber === 8) return "Generar";
  }
  
  return shortNames[stepNumber - 1] || `${stepNumber}`;
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
                  {getStepShortName(stepNumber, useCaseType)}
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
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Paso {currentStep} de {totalSteps}
        </div>
      </div>
    </div>
  );
}