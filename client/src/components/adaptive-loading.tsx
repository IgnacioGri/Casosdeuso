import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, Brain, Image as ImageIcon, TestTube, Search, Sparkles, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type LoadingContext = 
  | 'ai-assist'
  | 'document-generation'
  | 'minute-analysis'
  | 'test-generation'
  | 'test-regeneration'
  | 'wireframe-generation'
  | 'form-validation'
  | 'data-processing'
  | 'api-call';

interface LoadingConfig {
  icon: React.ReactNode;
  message: string;
  submessage?: string;
  animationStyle: 'spin' | 'pulse' | 'bounce' | 'float';
  duration: 'fast' | 'medium' | 'slow';
  color: string;
}

const loadingConfigs: Record<LoadingContext, LoadingConfig> = {
  'ai-assist': {
    icon: <Sparkles className="h-5 w-5" />,
    message: 'Mejorando con IA...',
    submessage: 'Aplicando reglas ING',
    animationStyle: 'pulse',
    duration: 'fast',
    color: 'text-purple-600'
  },
  'document-generation': {
    icon: <FileText className="h-5 w-5" />,
    message: 'Generando documento...',
    submessage: 'Creando DOCX profesional',
    animationStyle: 'spin',
    duration: 'medium',
    color: 'text-blue-600'
  },
  'minute-analysis': {
    icon: <Brain className="h-5 w-5" />,
    message: 'Analizando minuta...',
    submessage: 'Extrayendo información relevante',
    animationStyle: 'pulse',
    duration: 'slow',
    color: 'text-indigo-600'
  },
  'test-generation': {
    icon: <TestTube className="h-5 w-5" />,
    message: 'Generando casos de prueba...',
    submessage: 'Creando escenarios de validación',
    animationStyle: 'spin',
    duration: 'medium',
    color: 'text-green-600'
  },
  'test-regeneration': {
    icon: <Brain className="h-5 w-5" />,
    message: 'Regenerando casos de prueba...',
    submessage: 'Aplicando sus sugerencias',
    animationStyle: 'pulse',
    duration: 'medium',
    color: 'text-violet-600'
  },
  'wireframe-generation': {
    icon: <ImageIcon className="h-5 w-5" />,
    message: 'Creando wireframe...',
    submessage: 'Diseñando interfaz visual',
    animationStyle: 'pulse',
    duration: 'slow',
    color: 'text-pink-600'
  },
  'form-validation': {
    icon: <Search className="h-5 w-5" />,
    message: 'Validando datos...',
    animationStyle: 'spin',
    duration: 'fast',
    color: 'text-gray-600'
  },
  'data-processing': {
    icon: <FileCode className="h-5 w-5" />,
    message: 'Procesando información...',
    animationStyle: 'spin',
    duration: 'medium',
    color: 'text-orange-600'
  },
  'api-call': {
    icon: <Loader2 className="h-5 w-5" />,
    message: 'Conectando...',
    animationStyle: 'spin',
    duration: 'fast',
    color: 'text-gray-600'
  }
};

interface AdaptiveLoadingProps {
  context: LoadingContext;
  isLoading: boolean;
  progress?: number;
  message?: string;
  submessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'overlay' | 'fullscreen';
}

export function AdaptiveLoading({
  context,
  isLoading,
  progress,
  message,
  submessage,
  className,
  size = 'md',
  variant = 'inline'
}: AdaptiveLoadingProps) {
  const config = loadingConfigs[context];
  const finalMessage = message || config.message;
  const finalSubmessage = submessage || config.submessage;

  const animations = {
    spin: {
      rotate: 360,
      transition: {
        duration: config.duration === 'fast' ? 0.8 : config.duration === 'medium' ? 1.5 : 2.5,
        repeat: Infinity,
        ease: "linear"
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: config.duration === 'fast' ? 0.6 : config.duration === 'medium' ? 1 : 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: config.duration === 'fast' ? 0.5 : config.duration === 'medium' ? 0.8 : 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    float: {
      y: [0, -5, 0],
      rotate: [-5, 5, -5],
      transition: {
        duration: config.duration === 'fast' ? 1 : config.duration === 'medium' ? 2 : 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const sizeClasses = {
    sm: 'text-sm space-y-1',
    md: 'text-base space-y-2',
    lg: 'text-lg space-y-3'
  };

  if (variant === 'fullscreen') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className={cn("text-center", sizeClasses[size])}>
              <motion.div
                animate={animations[config.animationStyle]}
                className={cn("inline-block mb-4", config.color)}
              >
                {config.icon}
              </motion.div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{finalMessage}</h3>
              {finalSubmessage && (
                <p className="text-gray-600 dark:text-gray-400">{finalSubmessage}</p>
              )}
              {progress !== undefined && (
                <div className="mt-4 w-64 mx-auto">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", 
                        config.color.replace('text-', 'bg-')
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{progress}%</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10",
              className
            )}
          >
            <div className={cn("text-center", sizeClasses[size])}>
              <motion.div
                animate={animations[config.animationStyle]}
                className={cn("inline-block mb-2", config.color)}
              >
                {config.icon}
              </motion.div>
              <p className="font-medium text-gray-900 dark:text-white">{finalMessage}</p>
              {finalSubmessage && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{finalSubmessage}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn("inline-flex items-center gap-2", className)}
        >
          <motion.div
            animate={animations[config.animationStyle]}
            className={config.color}
          >
            {config.icon}
          </motion.div>
          <span className={cn("text-gray-700 dark:text-gray-300", 
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
          )}>
            {finalMessage}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton loaders for different content types
interface AdaptiveSkeletonProps {
  type: 'form-field' | 'table-row' | 'card' | 'text-block' | 'button';
  count?: number;
  className?: string;
}

export function AdaptiveSkeleton({ type, count = 1, className }: AdaptiveSkeletonProps) {
  const skeletons = {
    'form-field': (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    'table-row': (
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    ),
    'card': (
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ),
    'text-block': (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
    'button': (
      <Skeleton className="h-10 w-32 rounded-md" />
    )
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {skeletons[type]}
        </div>
      ))}
    </div>
  );
}

// Progress steps loader for multi-stage operations
interface StageInfo {
  stage: string;
  message: string;
}

interface AdaptiveProgressStepsProps {
  stages: StageInfo[];
  currentStage: number;
  className?: string;
}

export function AdaptiveProgressSteps({ stages, currentStage, className }: AdaptiveProgressStepsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {stages.map((stage, index) => {
        const isActive = index === currentStage;
        const isCompleted = index < currentStage;
        
        return (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              isCompleted ? "bg-green-500 text-white" : 
              isActive ? "bg-blue-500 text-white animate-pulse" : 
              "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            )}>
              {isCompleted ? "✓" : index + 1}
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium transition-colors",
                isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
              )}>
                {stage.stage}
              </p>
              {isActive && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {stage.message}
                </motion.p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}