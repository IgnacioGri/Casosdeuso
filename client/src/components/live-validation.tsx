import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveValidationProps {
  value: string;
  type: 'fileName' | 'useCaseName' | 'email' | 'required';
  label?: string;
}

export function LiveValidation({ value, type, label }: LiveValidationProps) {
  const getValidation = () => {
    switch (type) {
      case 'fileName':
        return validateFileName(value);
      case 'useCaseName':
        return validateUseCaseName(value);
      case 'email':
        return validateEmail(value);
      case 'required':
        return validateRequired(value);
      default:
        return { isValid: true, message: '', type: 'success' as const };
    }
  };

  const validateFileName = (fileName: string) => {
    if (!fileName) {
      return { isValid: false, message: 'El nombre del archivo es obligatorio', type: 'error' as const };
    }
    
    // Patrón: 2 letras + 3 números + nombre descriptivo
    const pattern = /^[A-Z]{2}\d{3}[A-Za-z]+$/;
    
    if (!pattern.test(fileName)) {
      return { 
        isValid: false, 
        message: 'Formato: AB123NombreDescriptivo (2 letras + 3 números + nombre)', 
        type: 'error' as const 
      };
    }
    
    if (fileName.length < 8) {
      return { 
        isValid: false, 
        message: 'Debe tener al menos 8 caracteres', 
        type: 'error' as const 
      };
    }
    
    return { isValid: true, message: 'Formato correcto', type: 'success' as const };
  };

  const validateUseCaseName = (name: string) => {
    if (!name) {
      return { isValid: false, message: 'El nombre del caso de uso es obligatorio', type: 'error' as const };
    }
    
    // Lista de verbos válidos en infinitivo
    const validVerbs = [
      'gestionar', 'crear', 'modificar', 'eliminar', 'consultar', 'buscar', 'generar',
      'procesar', 'validar', 'enviar', 'recibir', 'actualizar', 'registrar', 'configurar',
      'administrar', 'mantener', 'calcular', 'exportar', 'importar', 'sincronizar'
    ];
    
    const firstWord = name.toLowerCase().split(' ')[0];
    
    if (!validVerbs.includes(firstWord)) {
      return { 
        isValid: false, 
        message: `Debe comenzar con un verbo en infinitivo (ej: ${validVerbs.slice(0, 3).join(', ')})`, 
        type: 'error' as const 
      };
    }
    
    if (name.length < 10) {
      return { 
        isValid: false, 
        message: 'Debe ser más descriptivo (mín. 10 caracteres)', 
        type: 'warning' as const 
      };
    }
    
    return { isValid: true, message: 'Nombre válido', type: 'success' as const };
  };

  const validateEmail = (email: string) => {
    if (!email) {
      return { isValid: true, message: '', type: 'info' as const };
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailPattern.test(email)) {
      return { isValid: false, message: 'Formato de email inválido', type: 'error' as const };
    }
    
    return { isValid: true, message: 'Email válido', type: 'success' as const };
  };

  const validateRequired = (value: string) => {
    if (!value?.trim()) {
      return { isValid: false, message: `${label || 'Este campo'} es obligatorio`, type: 'error' as const };
    }
    
    return { isValid: true, message: '', type: 'success' as const };
  };

  const validation = getValidation();

  if (!validation.message) {
    return null;
  }

  const getIcon = () => {
    switch (validation.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
    }
  };

  const getVariant = () => {
    switch (validation.type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getColors = () => {
    switch (validation.type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-1 p-2 rounded-md border text-sm ${getColors()}`}>
      {getIcon()}
      <span>{validation.message}</span>
    </div>
  );
}

export function LiveValidationSummary({ 
  validations 
}: { 
  validations: Array<{ field: string; isValid: boolean; message: string }> 
}) {
  const errors = validations.filter(v => !v.isValid);
  const allValid = errors.length === 0;

  if (allValid) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Todos los campos son válidos</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Se encontraron {errors.length} error(es):</span>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm ml-6">
        {errors.map((error, index) => (
          <li key={index}>
            <span className="font-medium">{error.field}:</span> {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}