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

  const generateWireframeMutation = useMutation({
    mutationFn: async (request: WireframeGenerationRequest) => {
      const response = await apiRequest('POST', '/api/wireframe/generate', request);
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

    const isSearch = type === 'search';
    isSearch ? setIsGeneratingSearch(true) : setIsGeneratingForm(true);

    try {
      const result = await generateWireframeMutation.mutateAsync({
        searchFilters: formData.searchFilters,
        resultColumns: formData.resultColumns,
        entityFields: formData.entityFields,
        useCaseName: formData.useCaseName,
        description: formData.description,
        additionalDescription: formData.wireframesDescription,
        aiModel: formData.aiModelForWireframes!,
        wireframeType: type,
      });

      if (result.imageUrl) {
        onUpdateFormData({
          generatedWireframes: {
            ...formData.generatedWireframes,
            [isSearch ? 'searchWireframe' : 'formWireframe']: result.imageUrl
          }
        });
        toast({
          title: "Éxito",
          description: `Wireframe de ${isSearch ? 'búsqueda' : 'formulario'} generado correctamente`,
        });
      }
    } catch (error) {
      console.error('Error generating wireframe:', error);
    } finally {
      isSearch ? setIsGeneratingSearch(false) : setIsGeneratingForm(false);
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
          value={formData.aiModelForWireframes || 'demo'}
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerar
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('search')}
                  disabled={isGeneratingSearch}
                  className="w-full"
                >
                  {isGeneratingSearch ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Generar Wireframe Buscador
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Regenerar
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('form')}
                  disabled={isGeneratingForm}
                  className="w-full"
                >
                  {isGeneratingForm ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Generar Wireframe Formulario
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}