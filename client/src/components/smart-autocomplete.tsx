import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SmartAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  useCaseType?: string;
}

// Common field suggestions based on use case type
const contextualSuggestions: Record<string, string[]> = {
  entity: [
    'Código', 'Nombre', 'Descripción', 'Estado', 'Fecha Alta', 'Usuario Alta',
    'Fecha Modificación', 'Usuario Modificación', 'Activo', 'Tipo',
    'Categoría', 'Prioridad', 'Observaciones', 'Referencia'
  ],
  entity_banking: [
    'CBU', 'Alias', 'Número Cuenta', 'Titular', 'DNI', 'CUIT', 'CUIL',
    'Saldo', 'Tipo Cuenta', 'Sucursal', 'Banco', 'Moneda', 'Estado Cuenta',
    'Fecha Apertura', 'Límite Descubierto'
  ],
  api: [
    'ID', 'Endpoint', 'Method', 'Status Code', 'Response Time', 'Request Body',
    'Response Body', 'Headers', 'Authorization', 'API Key', 'Token',
    'Content Type', 'Accept', 'User Agent'
  ],
  process: [
    'Proceso ID', 'Nombre Proceso', 'Estado Proceso', 'Fecha Inicio', 'Fecha Fin',
    'Usuario Ejecutor', 'Parámetros', 'Resultado', 'Error', 'Duración',
    'Prioridad', 'Cola', 'Reintentos', 'Última Ejecución'
  ]
};

export function SmartAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder = "Escriba para ver sugerencias...",
  className,
  icon,
  useCaseType
}: SmartAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get contextual suggestions based on use case type
  const getContextualSuggestions = () => {
    const basesuggestions = [...suggestions];
    
    // Protect against null/undefined values
    if (useCaseType === 'entity' && value && value.toLowerCase().includes('banc')) {
      basesuggestions.push(...contextualSuggestions.entity_banking);
    } else if (contextualSuggestions[useCaseType || '']) {
      basesuggestions.push(...contextualSuggestions[useCaseType || '']);
    } else {
      basesuggestions.push(...contextualSuggestions.entity);
    }
    
    return Array.from(new Set(basesuggestions)); // Remove duplicates
  };

  useEffect(() => {
    const allSuggestions = getContextualSuggestions();
    const filtered = allSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes((inputValue || '').toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [inputValue, suggestions, useCaseType]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
    
    // Micro-interaction: subtle success animation
    if (inputRef.current) {
      inputRef.current.classList.add('ring-2', 'ring-green-500', 'ring-opacity-50');
      setTimeout(() => {
        inputRef.current?.classList.remove('ring-2', 'ring-green-500', 'ring-opacity-50');
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <Input
          ref={inputRef}
          value={inputValue || ''}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pr-8 transition-all duration-200",
            icon && "pl-10",
            open && "ring-2 ring-ms-blue ring-opacity-30"
          )}
          autoComplete="new-password"
          name={`field_${Math.random().toString(36).substr(2, 9)}`}
          id={`field_${Math.random().toString(36).substr(2, 9)}`}
        />
        <motion.button
          type="button"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setOpen(!open)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1"
          >
            <div className="rounded-md border bg-white shadow-lg">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {filteredSuggestions.map((suggestion, index) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={handleSelect}
                        className={cn(
                          "cursor-pointer transition-colors",
                          highlightedIndex === index && "bg-ms-blue bg-opacity-10"
                        )}
                      >
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between w-full"
                        >
                          <span>{suggestion}</span>
                          {value === suggestion && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </motion.div>
                          )}
                        </motion.div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {filteredSuggestions.length === 0 && (
                    <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                      No se encontraron sugerencias
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}