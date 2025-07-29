import { useState } from "react";
import { FileText, RefreshCw, ArrowLeft, ArrowRight, Cog } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUseCaseForm } from "@/hooks/use-use-case-form";
import EnhancedProgressIndicator from "@/components/enhanced-progress-indicator";
import FormSteps from "@/components/form-steps";
import EnhancedDocumentPreview from "@/components/enhanced-document-preview";
import UseCaseTemplatePreview from "@/components/use-case-template-preview";
import WireframePreview from "@/components/wireframe-preview";
import { AIModelHeader } from "@/components/ai-model-header";

import { UseCase, AIModel } from "@/types/use-case";

export default function UseCaseGenerator() {
  const [generatedUseCase, setGeneratedUseCase] = useState<UseCase | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const { toast } = useToast();

  const {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    addSearchFilter,
    removeSearchFilter,
    updateSearchFilter,
    addResultColumn,
    removeResultColumn,
    updateResultColumn,
    addEntityField,
    removeEntityField,
    updateEntityField,
    addWireframeDescription,
    removeWireframeDescription,
    updateWireframeDescription,
    addAlternativeFlow,
    removeAlternativeFlow,
    updateAlternativeFlow,
    addTestStep,
    removeTestStep,
    updateTestStep,
    validateStep,
    loadDemoData,
    loadComplexExample,
    resetForm
  } = useUseCaseForm();

  // Calculate total steps based on use case type
  const getTotalSteps = () => {
    // Add 2 for the new type selection (step 1) and minute analysis (step 2)
    const baseSteps = formData.useCaseType === 'entity' ? 9 : 7;
    return formData.generateTestCase ? baseSteps + 1 : baseSteps;
  };

  const generateUseCaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/use-cases/generate', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedUseCase(data.useCase);
      setGeneratedContent(data.content);
      toast({
        title: "Éxito",
        description: "Caso de uso generado correctamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error generando el caso de uso",
        variant: "destructive"
      });
    }
  });

  const editUseCaseMutation = useMutation({
    mutationFn: async ({ instructions }: { instructions: string }) => {
      if (!generatedUseCase) throw new Error("No use case to edit");
      
      const response = await apiRequest('POST', `/api/use-cases/${generatedUseCase.id}/edit`, {
        instructions,
        aiModel: formData.aiModel
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedUseCase(data.useCase);
      setGeneratedContent(data.content);
    }
  });

  const exportUseCaseMutation = useMutation({
    mutationFn: async () => {
      if (!generatedUseCase) throw new Error("No use case to export");
      
      const response = await apiRequest('GET', `/api/use-cases/${generatedUseCase.id}/export`);
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedUseCase.fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return response;
    }
  });

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, getTotalSteps()));
    } else {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleGenerateUseCase = () => {
    if (validateStep(currentStep)) {
      // IMPORTANTE: El último paso NUNCA usa IA, solo aplica estilos y formato
      // La IA se usa únicamente en los botones AI Assist de campos individuales
      const formDataWithDemoMode = { ...formData, aiModel: 'demo' as const };
      generateUseCaseMutation.mutate(formDataWithDemoMode);
    } else {
      toast({
        title: "Formulario incompleto",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el formulario?')) {
      resetForm();
      setGeneratedUseCase(null);
      setGeneratedContent('');
    }
  };

  const handleLoadDemo = () => {
    loadDemoData();
    toast({
      title: "Datos cargados",
      description: "Datos de demostración cargados correctamente"
    });
  };

  const isReviewStep = () => {
    return currentStep === getTotalSteps();
  };

  // Navigation buttons component for reuse
  const NavigationButtons = () => (
    <div className="flex justify-between">
      <Button 
        variant="outline"
        onClick={handlePreviousStep}
        disabled={currentStep === 1}
        className="flex items-center"
      >
        <ArrowLeft className="mr-2" size={16} />
        Anterior
      </Button>
      
      <div className="flex space-x-4">
        {isReviewStep() && (
          <Button 
            onClick={handleGenerateUseCase}
            disabled={generateUseCaseMutation.isPending}
            className="bg-ms-blue hover:bg-ms-blue/90 text-white flex items-center"
          >
            <Cog className="mr-2" size={16} />
{generateUseCaseMutation.isPending ? 'Aplicando formato...' : 'Generar Documento'}
          </Button>
        )}
        
        {!isReviewStep() && (
          <Button 
            onClick={handleNextStep}
            className="bg-ms-blue hover:bg-ms-blue/90 text-white flex items-center"
          >
            Siguiente
            <ArrowRight className="ml-2" size={16} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ms-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-ms-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <FileText className="text-ms-blue" size={24} />
              <h1 className="text-xl font-semibold text-gray-900">
                Generador de Casos de Uso
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <AIModelHeader 
                currentModel={formData.aiModel}
                onModelChange={(model: AIModel) => updateFormData({ aiModel: model })}
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleReset}
                className="text-ms-blue hover:text-ms-blue/80"
              >
                <RefreshCw className="mr-1" size={16} />
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <EnhancedProgressIndicator 
              currentStep={currentStep} 
              totalSteps={getTotalSteps()} 
              useCaseType={formData.useCaseType}
            />
            
            {/* Navigation Buttons - Top */}
            <div className="mb-6 pt-4 border-t border-gray-200">
              <NavigationButtons />
            </div>
            
            <FormSteps
              currentStep={currentStep}
              formData={formData}
              onUpdateFormData={updateFormData}
              onAddSearchFilter={addSearchFilter}
              onRemoveSearchFilter={removeSearchFilter}
              onUpdateSearchFilter={updateSearchFilter}
              onAddResultColumn={addResultColumn}
              onRemoveResultColumn={removeResultColumn}
              onUpdateResultColumn={updateResultColumn}
              onAddEntityField={addEntityField}
              onRemoveEntityField={removeEntityField}
              onUpdateEntityField={updateEntityField}
              onAddWireframeDescription={addWireframeDescription}
              onRemoveWireframeDescription={removeWireframeDescription}
              onUpdateWireframeDescription={updateWireframeDescription}
              onAddAlternativeFlow={addAlternativeFlow}
              onRemoveAlternativeFlow={removeAlternativeFlow}
              onUpdateAlternativeFlow={updateAlternativeFlow}
              onAddTestStep={addTestStep}
              onRemoveTestStep={removeTestStep}
              onUpdateTestStep={updateTestStep}
              onLoadDemoData={handleLoadDemo}
              onLoadComplexExample={loadComplexExample}
              onNextStep={handleNextStep}
              onPreviousStep={handlePreviousStep}

            />

            {/* Navigation Buttons - Bottom */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <NavigationButtons />
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <EnhancedDocumentPreview
              formData={formData}
              currentStep={currentStep}
              generatedContent={generatedContent}
              onRefresh={() => {
                if (generatedUseCase) {
                  editUseCaseMutation.mutateAsync({ instructions: "Actualizar el documento con los cambios más recientes" });
                }
              }}
              onDownload={() => {
                if (generatedUseCase) {
                  exportUseCaseMutation.mutate();
                }
              }}
              onTestCaseUpdate={(testData) => {
                updateFormData(testData);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
