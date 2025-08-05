import { motion } from 'framer-motion';
import { Check, Plus, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// Success checkmark animation
export function SuccessCheckmark({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <div className="rounded-full bg-green-100 p-2">
        <Check className="h-4 w-4 text-green-600" />
      </div>
    </motion.div>
  );
}

// Shake animation for errors
export function ShakeError({ children, shake }: { children: ReactNode; shake: boolean }) {
  return (
    <motion.div
      animate={shake ? {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {children}
    </motion.div>
  );
}

// Smooth hover button
interface SmoothButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function SmoothButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className,
  type = 'button'
}: SmoothButtonProps) {
  const variants = {
    primary: 'bg-ms-blue text-white hover:bg-ms-blue-dark',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// Animated field add/remove
interface AnimatedFieldProps {
  children: ReactNode;
  index: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function AnimatedField({ children, index, onRemove, showRemove = true }: AnimatedFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="relative group"
    >
      {children}
      {showRemove && onRemove && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 shadow-md z-10"
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
    </motion.div>
  );
}

// Add field button with animation
interface AddFieldButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function AddFieldButton({ onClick, label, disabled = false, className }: AddFieldButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium text-ms-blue border border-ms-blue rounded-md hover:bg-ms-blue hover:text-white transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.div
        animate={{ rotate: disabled ? 0 : 360 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
      >
        <Plus className="h-4 w-4" />
      </motion.div>
      {label}
    </motion.button>
  );
}

// Floating save indicator
export function FloatingSaveIndicator({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (!saving && !saved) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2"
    >
      {saving ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Save className="h-4 w-4 text-ms-blue" />
          </motion.div>
          <span className="text-sm text-gray-700">Guardando...</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Guardado</span>
        </>
      )}
    </motion.div>
  );
}

// Progress step indicator
interface ProgressStepProps {
  step: number;
  currentStep: number;
  label: string;
  onClick?: () => void;
}

export function ProgressStep({ step, currentStep, label, onClick }: ProgressStepProps) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!isCompleted && !isActive}
      whileHover={isCompleted ? { scale: 1.05 } : {}}
      whileTap={isCompleted ? { scale: 0.95 } : {}}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
        isActive && "bg-ms-blue bg-opacity-10 text-ms-blue",
        isCompleted && "text-green-600 cursor-pointer hover:bg-green-50",
        !isActive && !isCompleted && "text-gray-400 cursor-not-allowed"
      )}
    >
      <motion.div
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          backgroundColor: isCompleted ? "#16a34a" : isActive ? "#0066cc" : "#e5e7eb"
        }}
        transition={{
          scale: { repeat: isActive ? Infinity : 0, duration: 2 },
          backgroundColor: { duration: 0.3 }
        }}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isCompleted || isActive ? "text-white" : "text-gray-500"
        )}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : step}
      </motion.div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

// Hover card effect
export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ 
        y: -2,
        boxShadow: "0 10px 30px -10px rgba(0, 102, 204, 0.3)"
      }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn("bg-white rounded-lg border border-gray-200", className)}
    >
      {children}
    </motion.div>
  );
}