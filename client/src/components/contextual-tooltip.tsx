import { ReactNode } from 'react';
import { Info, HelpCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  content: ReactNode;
  example?: string;
  format?: string;
  warning?: string;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  variant?: "info" | "help" | "warning";
  className?: string;
}

export function ContextualTooltip({
  content,
  example,
  format,
  warning,
  children,
  side = "top",
  align = "center",
  variant = "info",
  className
}: ContextualTooltipProps) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    help: <HelpCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />
  };

  const iconColors = {
    info: "text-ms-blue hover:text-ms-blue-dark",
    help: "text-gray-500 hover:text-gray-700",
    warning: "text-orange-500 hover:text-orange-600"
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex items-center justify-center transition-colors",
                iconColors[variant],
                className
              )}
            >
              {icons[variant]}
            </motion.button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-xs bg-gray-900 text-white border-gray-800"
        >
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 text-sm"
          >
            <div>{content}</div>
            
            {format && (
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-400">Formato:</span>
                <code className="ml-1 px-1 py-0.5 bg-gray-800 rounded text-xs">
                  {format}
                </code>
              </div>
            )}
            
            {example && (
              <div>
                <span className="text-gray-400">Ejemplo:</span>
                <span className="ml-1 text-green-400">{example}</span>
              </div>
            )}
            
            {warning && (
              <div className="flex items-center gap-1 text-orange-400">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">{warning}</span>
              </div>
            )}
          </motion.div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Field-specific tooltip configurations
export const fieldTooltips = {
  clientName: {
    content: "Nombre completo del cliente o empresa para quien se desarrolla el caso de uso",
    example: "Banco Santander Argentina S.A.",
    format: "Máximo 100 caracteres"
  },
  projectName: {
    content: "Nombre descriptivo del proyecto o sistema donde se implementará el caso de uso",
    example: "Sistema de Gestión de Préstamos Personales",
    format: "Máximo 200 caracteres"
  },
  useCaseCode: {
    content: "Código único que identifica el caso de uso dentro del proyecto",
    example: "UC001, PRE-003, GES-PRES-01",
    format: "Alfanumérico, sin espacios"
  },
  useCaseName: {
    content: "Nombre del caso de uso comenzando con un verbo en infinitivo",
    example: "Gestionar Solicitudes de Préstamo",
    format: "Verbo + Sustantivo"
  },
  cbu: {
    content: "Clave Bancaria Uniforme para identificar cuentas bancarias",
    format: "22 dígitos numéricos",
    example: "0170099220000067797370",
    warning: "Debe ser un CBU válido del sistema bancario argentino"
  },
  dni: {
    content: "Documento Nacional de Identidad del titular",
    format: "7-8 dígitos sin puntos",
    example: "12345678",
    warning: "Sin puntos ni espacios"
  },
  cuit: {
    content: "Clave Única de Identificación Tributaria",
    format: "XX-XXXXXXXX-X",
    example: "20-12345678-9",
    warning: "Incluir guiones"
  },
  email: {
    content: "Dirección de correo electrónico válida",
    format: "usuario@dominio.com",
    example: "juan.perez@empresa.com.ar"
  },
  phone: {
    content: "Número de teléfono con código de área",
    format: "+54 11 XXXX-XXXX",
    example: "+54 11 4567-8900"
  },
  date: {
    content: "Fecha en formato estándar argentino",
    format: "DD/MM/AAAA",
    example: "28/01/2025"
  },
  currency: {
    content: "Monto en pesos argentinos",
    format: "$ XXX,XXX.XX",
    example: "$ 125,500.00",
    warning: "Usar coma para miles y punto para decimales"
  },
  percentage: {
    content: "Valor porcentual",
    format: "XX.XX%",
    example: "15.50%",
    warning: "Máximo 2 decimales"
  }
};