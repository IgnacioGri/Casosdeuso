import { useState } from "react";
import { FileText, RefreshCw, ArrowLeft, ArrowRight, Cog } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUseCaseForm } from "@/hooks/use-use-case-form";
import EnhancedProgressIndicator from "@/components/enhanced-progress-indicator";
import FormSteps from "@/components/form-steps";
// Preview components removed - DOCX generated directly from formData
import { AIModelHeader } from "@/components/ai-model-header";
import { ProgressIndicator } from "@/components/progress-indicator";

import { UseCase, AIModel } from "@/types/use-case";

export default function UseCaseGenerator() {
  const [generatedUseCase, setGeneratedUseCase] = useState<UseCase | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState(0);
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
    addTestStep,
    removeTestStep,
    updateTestStep,
    validateStep,
    loadDemoData,
    loadComplexExample,
    resetForm
  } = useUseCaseForm();

  // Calculate total steps based on use case type and test case decision
  const getTotalSteps = () => {
    const baseSteps = formData.useCaseType === 'entity' ? 9 : 7;
    // Always show one more step for test case decision or final review
    return baseSteps + (formData.generateTestCase ? 1 : 0);
  };

  const generateAndDownloadUseCaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setProgressPercentage(10);
      setGenerationProgress("Generando contenido del caso de uso...");
      
      // Simular progreso gradual
      const progressInterval = setInterval(() => {
        setProgressPercentage(prev => Math.min(prev + 10, 70));
      }, 3000);
      
      // First generate the use case
      const generateResponse = await apiRequest('POST', '/api/use-cases/generate', data);
      const generatedData = await generateResponse.json();
      
      clearInterval(progressInterval);
      
      if (!generatedData.success || !generatedData.useCase) {
        throw new Error(generatedData.error || 'Error generando el caso de uso');
      }
      
      setProgressPercentage(80);
      setGenerationProgress("Creando documento DOCX...");
      
      // Then immediately export to DOCX - using fetch directly for binary response
      console.log('Exporting to DOCX with data:', {
        hasContent: !!generatedData.content,
        fileName: generatedData.useCase.fileName,
        hasFormData: !!data
      });
      
      // Use fetch directly to handle binary response properly
      const exportResponse = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedData.content,
          fileName: generatedData.useCase.fileName,
          useCaseName: generatedData.useCase.useCaseName,
          formData: data
        }),
        credentials: 'include'
      });
      
      // Check if response is ok
      if (!exportResponse.ok) {
        const errorData = await exportResponse.text();
        console.error('Export error:', errorData);
        throw new Error(`Error exportando DOCX: ${exportResponse.status} - ${errorData}`);
      }
      
      setProgressPercentage(95);
      setGenerationProgress("Descargando documento...");
      
      // Create blob and download
      const blob = await exportResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedData.useCase.fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setProgressPercentage(100);
      setGenerationProgress("¡Documento generado exitosamente!");
      
      return generatedData;
    },
    onSuccess: (data) => {
      setGeneratedUseCase(data.useCase);
      
      // Reset progress after a brief delay
      setTimeout(() => {
        setGenerationProgress("");
        setProgressPercentage(0);
      }, 1500);
      
      toast({
        title: "Éxito",
        description: "Caso de uso generado y descargado correctamente"
      });
    },
    onError: (error) => {
      setGenerationProgress("");
      setProgressPercentage(0);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error generando el caso de uso",
        variant: "destructive"
      });
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
      // Generate and download DOCX directly
      generateAndDownloadUseCaseMutation.mutate(formData);
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
    // Final review step happens after test cases (if enabled) or after decision step
    const baseStep = formData.useCaseType === 'entity' ? 9 : 7;
    if (formData.generateTestCase) {
      return currentStep === baseStep + 1; // Step after test cases
    } else {
      return currentStep === baseStep; // Decision step becomes review when user selects "finish without test cases"
    }
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
            disabled={generateAndDownloadUseCaseMutation.isPending}
            className="bg-ms-blue hover:bg-ms-blue/90 text-white flex items-center"
          >
            <Cog className="mr-2" size={16} />
{generateAndDownloadUseCaseMutation.isPending ? (generationProgress || 'Generando documento...') : 'Generar y Descargar'}
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
    <>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Section - Always full width */}
        <div className="w-full">
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


      </div>
    </div>
    
    {/* Progress Indicator for Document Generation */}
    <ProgressIndicator
      isVisible={generateAndDownloadUseCaseMutation.isPending}
      progress={progressPercentage}
      message={generationProgress}
      subMessage="Esto puede tomar de 20 a 60 segundos dependiendo de la complejidad"
    />
    </>
  );
}
