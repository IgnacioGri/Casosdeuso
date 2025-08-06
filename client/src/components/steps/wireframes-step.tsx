import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';


import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UseCaseFormData } from '@/types/use-case';
import { ImageIcon, RefreshCw, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AdaptiveLoading } from '@/components/adaptive-loading';



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
  wireframeType: 'search' | 'form';
}

export function WireframesStep({ formData, onUpdateFormData }: WireframesStepProps) {
  const [isGeneratingSearch, setIsGeneratingSearch] = useState(false);
  const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  const { toast } = useToast();

  const generateWireframeMutation = useMutation({
    mutationFn: async (request: {
      type: 'search' | 'form';
      title: string;
      filters?: string[];
      columns?: string[];
      fields?: Array<{
        name: string;
        type: string;
        mandatory?: boolean;
        length?: number;
      }>;
    }) => {
      const response = await apiRequest('POST', '/api/generate-wireframe', request);
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
    // Generate HTML-based wireframe
    if (type === 'search') {
      setIsGeneratingSearch(true);
    } else {
      setIsGeneratingForm(true);
    }

    try {
      const requestData = {
        type,
        title: formData.useCaseName || 'Entity Management',
        filters: formData.searchFilters?.filter(f => f.trim()) || [],
        columns: formData.resultColumns?.filter(c => c.trim()) || [],
        fields: formData.entityFields?.filter(f => f.name?.trim()).map(f => ({
          name: f.name,
          type: f.type,
          mandatory: f.mandatory,
          length: f.length
        })) || []
      };
      
      const result = await generateWireframeMutation.mutateAsync(requestData);

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
          description: `Se generó exitosamente el wireframe de ${type === 'search' ? 'búsqueda' : 'formulario'}`,
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





  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Wireframes de Interfaz</h2>
        <p className="text-gray-600 mb-6">
          Genera bocetos visuales de las interfaces de usuario basados en la información del caso de uso.
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
              placeholder=""
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
                    className="w-full ai-button variant-outline"
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
                        <RefreshCw className="h-4 w-4 mr-2 text-violet-600" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('search')}
                  disabled={isGeneratingSearch}
                  className="w-full ai-button variant-outline"
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
                      <ImageIcon className="h-4 w-4 mr-2 text-violet-600" />
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
                    className="w-full ai-button variant-outline"
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
                        <RefreshCw className="h-4 w-4 mr-2 text-violet-600" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateWireframe('form')}
                  disabled={isGeneratingForm}
                  className="w-full ai-button variant-outline"
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
                      <ImageIcon className="h-4 w-4 mr-2 text-violet-600" />
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