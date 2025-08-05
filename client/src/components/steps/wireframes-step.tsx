import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UseCaseFormData, AIModelForWireframes } from '@/types/use-case';
import { ImageIcon, RefreshCw, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AdaptiveLoading } from '@/components/adaptive-loading';

// Demo wireframe images
import demoSearchWireframe from '@assets/generated_images/Search_interface_wireframe_59d3b735.png';
import demoFormWireframe from '@assets/generated_images/Form_interface_wireframe_bf6aaf30.png';

interface WireframesStepProps {
  formData: UseCaseFormData;
  onUpdateFormData: (data: Partial<UseCaseFormData>) => void;
}

interface WireframeGenerationRequest {
  searchFilters: string[];
  resultColumns: string[];
  entityFields: any[];
  useCaseName: string;
  description: string;
  additionalDescription?: string;
  aiModel: AIModelForWireframes;
  wireframeType: 'search' | 'form';
}

export function WireframesStep({ formData, onUpdateFormData }: WireframesStepProps) {
  const [isGeneratingSearch, setIsGeneratingSearch] = useState(false);
  const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  const { toast } = useToast();

  const generateImageMutation = useMutation({
    mutationFn: async (request: { prompt: string; fileName?: string }) => {
      const response = await apiRequest('POST', '/api/generate-image', request);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al generar el wireframe",
        variant: "destructive",
      });
    },
  });

  const handleGenerateWireframe = async (type: 'search' | 'form') => {
    if (!formData.aiModelForWireframes || formData.aiModelForWireframes === 'demo') {
      // For demo mode, use pre-generated example images
      if (type === 'search') {
        onUpdateFormData({
          generatedWireframes: {
            ...formData.generatedWireframes,
            searchWireframe: demoSearchWireframe
          }
        });
      } else {
        onUpdateFormData({
          generatedWireframes: {
            ...formData.generatedWireframes,
            formWireframe: demoFormWireframe
          }
        });
      }
      toast({
        title: "Demo",
        description: `Wireframe de ${type === 'search' ? 'búsqueda' : 'formulario'} de ejemplo mostrado`,
      });
      return;
    }

    // Generate AI-powered wireframe image
    if (type === 'search') {
      setIsGeneratingSearch(true);
    } else {
      setIsGeneratingForm(true);
    }

    try {
      const prompt = generateWireframePrompt(type);
      const fileName = `wireframe_${type}_${formData.useCaseName?.replace(/\s+/g, '_') || 'entity'}_${Date.now()}.png`;
      
      const result = await generateImageMutation.mutateAsync({
        prompt,
        fileName
      });

      if (result.success && result.imageUrl) {
        if (type === 'search') {
          onUpdateFormData({
            generatedWireframes: {
              ...formData.generatedWireframes,
              searchWireframe: result.imageUrl
            }
          });
        } else {
          onUpdateFormData({
            generatedWireframes: {
              ...formData.generatedWireframes,
              formWireframe: result.imageUrl
            }
          });
        }
        
        toast({
          title: "Wireframe generado",
          description: `Se generó exitosamente el wireframe de ${type === 'search' ? 'búsqueda' : 'formulario'} usando IA`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el wireframe",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al generar el wireframe",
        variant: "destructive",
      });
    } finally {
      if (type === 'search') {
        setIsGeneratingSearch(false);
      } else {
        setIsGeneratingForm(false);
      }
    }
  };

  const generateWireframePrompt = (type: 'search' | 'form'): string => {
    const filters = formData.searchFilters?.filter(f => f.trim()) || [];
    const columns = formData.resultColumns?.filter(c => c.trim()) || [];
    const fields = formData.entityFields?.filter(f => f.name?.trim()) || [];
    
    const additionalDescription = formData.wireframesDescription ? 
      ` Additional style requirements: ${formData.wireframesDescription}` : '';

    if (type === 'search') {
      const filtersText = filters.length > 0 ? 
        filters.map(f => f.trim()).join(', ') : 
        'standard search filters';
      
      const columnsText = columns.length > 0 ? 
        columns.map(c => c.trim()).join(', ') : 
        'result columns';

      return `Generate a simplified graphical wireframe of an enterprise UI screen for searching and listing entities for "${formData.useCaseName || 'Entity Management'}".
Follow these business rules and UI layout guidelines:

🧭 Main UI Requirements
– Add a search area at the top with various filters based on these fields: ${filtersText}
– Below the filters, include three action buttons: Buscar (Search), Limpiar (Clear), and Agregar (Add new entry)
– Below the search area, show a paginated table with results displaying these columns: ${columnsText}
– Each row must include Edit and Delete buttons (icon buttons are acceptable)

📑 Functionality Details
– Clearly list and label each search filter using the provided fields
– Clearly label columns in the results table, matching the most relevant fields
– Indicate that pagination is required (show controls like "Previous, Next, Page X of Y")

🎨 Styling & UI Rules
– Follow Microsoft-style admin UI (flat design, minimal shadows, blue section headers, sans-serif fonts)
– Prefer 2-column layout for filters if space allows
– Align all elements cleanly with consistent spacing

Generate a realistic wireframe image of the UI using Microsoft enterprise admin style.${additionalDescription}`;
    } else {
      const fieldsDetails = fields.map(f => 
        `${f.name} (${f.type}${f.mandatory ? ' - required' : ''}${f.length ? ` - max ${f.length}` : ''})`
      ).join(', ') || 'form input fields';

      return `Generate a simplified graphical wireframe of an enterprise UI screen for adding or editing an entity for "${formData.useCaseName || 'Entity Management'}".
Use the provided list of fields to determine the inputs and follow these business layout rules:

🧭 Main UI Requirements
– At the top or bottom, include action buttons: Aceptar (Save) and Cancelar (Cancel)
– Include two metadata fields at the bottom or side:
    • Fecha de alta (creation date)
    • Usuario de alta (creator user)
    • Fecha de modificación (modification date)
    • Usuario de modificación (modifier user)

📑 Functionality Details
– For each field from the provided data, indicate:
    Fields to include: ${fieldsDetails}
    • Field label
    • Type of input (text, number, date, etc.)
    • If it is required (show with asterisk *)
    • Max length (if applicable)
    • Special requirements or validations

🎨 Styling & UI Rules
– Use a clean, Microsoft-like admin form layout
– Group related fields into sections where possible
– Use blue titles or dividers for sections
– Fields should be placed in a 2- or 3-column grid when space allows

Generate a realistic Microsoft-style wireframe image of the form interface.${additionalDescription}`;
    }
  };

  const modelLabels: Record<AIModelForWireframes, string> = {
    'demo': 'Demo',
    'openai': 'OpenAI (DALL-E 3)',
    'gemini': 'Gemini (Imagen)',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Wireframes de Interfaz</h2>
        <p className="text-gray-600 mb-6">
          Genera bocetos visuales de las interfaces de usuario basados en la información del caso de uso.
        </p>
      </div>

      {/* AI Model Selector for Wireframes */}
      <div className="space-y-2">
        <Label htmlFor="aiModelForWireframes">Modelo de IA para Wireframes</Label>
        <Select
          value={formData.aiModelForWireframes || 'gemini'}
          onValueChange={(value: AIModelForWireframes) => 
            onUpdateFormData({ aiModelForWireframes: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un modelo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(modelLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Solo OpenAI y Gemini soportan generación de imágenes
        </p>
      </div>

      {/* Generate Wireframes Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="generateWireframes"
          checked={formData.generateWireframes || false}
          onChange={(e) => onUpdateFormData({ generateWireframes: e.target.checked })}
          className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <Label htmlFor="generateWireframes" className="cursor-pointer text-sm font-medium">
          ¿Desea generar wireframes visuales?
        </Label>
      </div>

      {formData.generateWireframes && (
        <>
          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="wireframesDescription">
              Descripción adicional del estilo visual (opcional)
            </Label>
            <Textarea
              id="wireframesDescription"
              value={formData.wireframesDescription || ''}
              onChange={(e) => onUpdateFormData({ wireframesDescription: e.target.value })}
              placeholder="Ej: Estilo minimalista, colores corporativos azul y blanco, diseño moderno..."
              rows={3}
            />
          </div>

          {/* Generate Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Wireframe */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Wireframe del Buscador</h3>
              <p className="text-sm text-gray-600">
                Interfaz con filtros, tabla de resultados, paginado y acciones
              </p>
              
              {formData.generatedWireframes?.searchWireframe ? (
                <div className="space-y-2">
                  <img 
                    src={formData.generatedWireframes.searchWireframe} 
                    alt="Wireframe del buscador"
                    className="w-full rounded border"
                  />
                  <Button
                    onClick={() => handleGenerateWireframe('search')}
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingSearch}
                    className="w-full"
                  >
                    {isGeneratingSearch ? (
                      <AdaptiveLoading
                        context="wireframe-generation"
                        isLoading={true}
                        size="sm"
                        variant="inline"
                      />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('search')}
                  disabled={isGeneratingSearch}
                  className="w-full"
                >
                  {isGeneratingSearch ? (
                    <AdaptiveLoading
                      context="wireframe-generation"
                      isLoading={true}
                      size="sm"
                      variant="inline"
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Generar Wireframe Buscador
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Form Wireframe */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Wireframe del Formulario</h3>
              <p className="text-sm text-gray-600">
                Interfaz para agregar/editar entidad con todos los campos
              </p>
              
              {formData.generatedWireframes?.formWireframe ? (
                <div className="space-y-2">
                  <img 
                    src={formData.generatedWireframes.formWireframe} 
                    alt="Wireframe del formulario"
                    className="w-full rounded border"
                  />
                  <Button
                    onClick={() => handleGenerateWireframe('form')}
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingForm}
                    className="w-full"
                  >
                    {isGeneratingForm ? (
                      <AdaptiveLoading
                        context="wireframe-generation"
                        isLoading={true}
                        size="sm"
                        variant="inline"
                      />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('form')}
                  disabled={isGeneratingForm}
                  className="w-full"
                >
                  {isGeneratingForm ? (
                    <AdaptiveLoading
                      context="wireframe-generation"
                      isLoading={true}
                      size="sm"
                      variant="inline"
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Generar Wireframe Formulario
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}