import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PreconditionCategory {
  id: string;
  title: string;
  placeholder: string;
  items: string[];
}

interface StructuredPreconditionsProps {
  value: string;
  onChange: (value: string) => void;
  aiAssistButton?: React.ReactNode;
}

export function StructuredPreconditions({ value, onChange, aiAssistButton }: StructuredPreconditionsProps) {
  const [categories, setCategories] = useState<PreconditionCategory[]>(() => {
    // Try to parse existing value into categories
    const parsed = parsePreconditions(value);
    return parsed.length > 0 ? parsed : getDefaultCategories();
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['users', 'data', 'infrastructure'])
  );

  function getDefaultCategories(): PreconditionCategory[] {
    return [
      {
        id: 'users',
        title: 'Usuarios de prueba',
        placeholder: 'Ej: Usuario QA_OPERADOR con perfil autorizado...',
        items: []
      },
      {
        id: 'data',
        title: 'Datos de prueba',
        placeholder: 'Ej: Cliente con DNI 25123456, CUIT 20251234561...',
        items: []
      },
      {
        id: 'infrastructure',
        title: 'Infraestructura',
        placeholder: 'Ej: Sistema de Gestión Integral desplegado y accesible...',
        items: []
      }
    ];
  }

  function parsePreconditions(text: string): PreconditionCategory[] {
    // Handle non-string values
    const textValue = typeof text === 'string' ? text : '';
    if (!textValue.trim()) return [];
    
    const lines = textValue.split('\n').filter(line => line.trim());
    const result = getDefaultCategories();
    let currentCategory: PreconditionCategory | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if it's a category header
      if (trimmed.toLowerCase().includes('usuarios de prueba:') || 
          trimmed.toLowerCase().includes('usuarios:')) {
        currentCategory = result.find(c => c.id === 'users') || null;
      } else if (trimmed.toLowerCase().includes('datos de prueba:') || 
                 trimmed.toLowerCase().includes('datos:')) {
        currentCategory = result.find(c => c.id === 'data') || null;
      } else if (trimmed.toLowerCase().includes('infraestructura:') || 
                 trimmed.toLowerCase().includes('sistema:')) {
        currentCategory = result.find(c => c.id === 'infrastructure') || null;
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        // It's a bullet point
        const content = trimmed.replace(/^[•\-]\s*/, '').trim();
        if (content && currentCategory) {
          currentCategory.items.push(content);
        }
      } else if (trimmed && !trimmed.endsWith(':')) {
        // It's content without bullet, try to assign to current category or general
        if (currentCategory) {
          currentCategory.items.push(trimmed);
        } else {
          // Try to guess the category based on content
          if (trimmed.toLowerCase().includes('usuario') || 
              trimmed.toLowerCase().includes('perfil')) {
            result.find(c => c.id === 'users')?.items.push(trimmed);
          } else if (trimmed.toLowerCase().includes('cliente') || 
                     trimmed.toLowerCase().includes('dni') ||
                     trimmed.toLowerCase().includes('cuit')) {
            result.find(c => c.id === 'data')?.items.push(trimmed);
          } else {
            result.find(c => c.id === 'infrastructure')?.items.push(trimmed);
          }
        }
      }
    }
    
    return result;
  }

  function formatPreconditions(): string {
    let result = '';
    
    for (const category of categories) {
      if (category.items.length > 0) {
        if (result) result += '\n\n';
        result += `${category.title}:\n`;
        for (const item of category.items) {
          result += `• ${item}\n`;
        }
      }
    }
    
    return result.trim();
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }

  function addItem(categoryId: string) {
    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, items: [...cat.items, ''] };
        }
        return cat;
      });
      return updated;
    });
  }

  function updateItem(categoryId: string, index: number, value: string) {
    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === categoryId) {
          const newItems = [...cat.items];
          newItems[index] = value;
          return { ...cat, items: newItems };
        }
        return cat;
      });
      
      // Update the parent component with formatted text
      const formatted = formatPreconditionsFromCategories(updated);
      onChange(formatted);
      
      return updated;
    });
  }

  function removeItem(categoryId: string, index: number) {
    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === categoryId) {
          const newItems = cat.items.filter((_, i) => i !== index);
          return { ...cat, items: newItems };
        }
        return cat;
      });
      
      // Update the parent component with formatted text
      const formatted = formatPreconditionsFromCategories(updated);
      onChange(formatted);
      
      return updated;
    });
  }

  function formatPreconditionsFromCategories(cats: PreconditionCategory[]): string {
    let result = '';
    
    for (const category of cats) {
      if (category.items.length > 0) {
        if (result) result += '\n\n';
        result += `${category.title}:\n`;
        for (const item of category.items) {
          if (item.trim()) {
            result += `• ${item}\n`;
          }
        }
      }
    }
    
    return result.trim();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Label>Precondiciones</Label>
        {aiAssistButton}
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-gray-700"
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {category.title}
                  {category.items.length > 0 && (
                    <span className="text-xs text-gray-500">({category.items.length})</span>
                  )}
                </button>
                
                {expandedCategories.has(category.id) && (
                  <Button
                    type="button"
                    onClick={() => addItem(category.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {expandedCategories.has(category.id) && (
                <div className="ml-6 space-y-2">
                  {category.items.length === 0 ? (
                    <Button
                      type="button"
                      onClick={() => addItem(category.id)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-gray-500"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Agregar {category.title.toLowerCase()}
                    </Button>
                  ) : (
                    category.items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateItem(category.id, index, e.target.value)}
                          placeholder={category.placeholder}
                          className="min-h-[60px] flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => removeItem(category.id, index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 h-[60px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-4 pt-4 border-t">
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer hover:text-gray-800">Vista previa del texto</summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs whitespace-pre-wrap">
                {formatPreconditions() || 'Las precondiciones aparecerán aquí...'}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}