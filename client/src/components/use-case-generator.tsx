import { useState, useRef } from "react";
import { FileText, RefreshCw, ArrowLeft, ArrowRight, Cog, Upload, X } from "lucide-react";
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
import { AdaptiveLoading, AdaptiveProgressSteps } from "@/components/adaptive-loading";

import { UseCase, AIModel } from "@/types/use-case";

export default function UseCaseGenerator() {
  const [generatedUseCase, setGeneratedUseCase] = useState<UseCase | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [minuteText, setMinuteText] = useState<string>("");

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
    resetForm
  } = useUseCaseForm();

  // Calculate total steps based on use case type and test case decision
  const getTotalSteps = () => {
    let baseSteps;
    switch (formData.useCaseType) {
      case 'entity':
        baseSteps = 10; // All steps including entity fields
        break;
      case 'reports':
        baseSteps = 9; // Similar to entity but without entity fields step, has export config instead
        break;
      case 'api':
      case 'service':
        baseSteps = 7; // Simplified flow for API/Service
        break;
      default:
        baseSteps = 10;
    }
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
      
      console.log('Generated data response:', {
        success: generatedData.success,
        hasUseCase: !!generatedData.useCase,
        hasExpandedDescription: !!generatedData.expandedDescription,
        expandedDescriptionLength: generatedData.expandedDescription?.length,
        originalDescriptionLength: data.description?.length
      });
      
      if (!generatedData.success || !generatedData.useCase) {
        throw new Error(generatedData.error || 'Error generando el caso de uso');
      }
      
      // Update form data with expanded description if available
      if (generatedData.expandedDescription && generatedData.expandedDescription !== data.description) {
        console.log('Updating form with expanded description:', generatedData.expandedDescription.substring(0, 100) + '...');
        updateFormData({ description: generatedData.expandedDescription });
      } else {
        console.log('Not updating description:', {
          hasExpandedDescription: !!generatedData.expandedDescription,
          areEqual: generatedData.expandedDescription === data.description
        });
      }
      
      setProgressPercentage(80);
      setGenerationProgress("Creando documento DOCX...");
      
      // Then immediately export to DOCX - using fetch directly for binary response
      console.log('Exporting to DOCX with data:', {
        hasContent: !!generatedData.content,
        fileName: generatedData.useCase.fileName,
        hasFormData: !!data
      });
      
      // Update the data with the expanded description if available
      const exportData = generatedData.expandedDescription ? 
        { ...data, description: generatedData.expandedDescription } : 
        data;
      
      // Use fetch directly to handle binary response properly
      const exportResponse = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedData.content,
          fileName: generatedData.useCase.fileName,
          useCaseName: generatedData.useCase.useCaseName,
          formData: exportData
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
      
      // Update form data with expanded description if available
      if (data.expandedDescription) {
        updateFormData({ description: data.expandedDescription });
      }
      
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
    // Special validation for step 2 (Minute Analysis) - check if minute text is empty
    if (currentStep === 2) {
      // Check if minuteText is empty (this would be tracked in the MinuteAnalysisStep component)
      // Since we don't have direct access to minuteText here, we'll check if basic fields are filled
      // after minute analysis, or if the user wants to proceed without minute analysis
      const hasBasicInfo = formData.clientName || formData.projectName || formData.useCaseName || formData.description;
      
      if (!minuteText.trim() && !hasBasicInfo) {
        const confirmed = window.confirm(
          "⚠️ Sin Análisis de Minuta\n\n" +
          "No se ha ingresado texto de minuta para analizar automáticamente.\n\n" +
          "Opciones:\n" +
          "• Volver atrás y agregar el texto de la minuta\n" +
          "• Continuar y llenar el formulario manualmente\n\n" +
          "¿Deseas continuar sin análisis de minuta y llenar el formulario manualmente?"
        );
        
        if (!confirmed) {
          return; // User cancelled, stay on current step
        }
      }
    }

    // Check if we're on the test case step
    const isTestCaseStep = () => {
      if (!formData.generateTestCase) return false;
      
      const testCaseStepNumber = formData.useCaseType === 'entity' ? 10 : 7;
      return currentStep === testCaseStepNumber;
    };

    // Check if test cases are incomplete
    const areTestCasesIncomplete = () => {
      if (!formData.generateTestCase) return false;
      
      const hasEmptyFields = !formData.testCaseObjective || !formData.testCasePreconditions;
      const hasNoTestSteps = !formData.testSteps || formData.testSteps.length === 0;
      const hasIncompleteSteps = formData.testSteps?.some(step => 
        !step.action || !step.inputData || !step.expectedResult
      );
      
      return hasEmptyFields || hasNoTestSteps || hasIncompleteSteps;
    };

    // Special validation for test case step
    if (isTestCaseStep() && areTestCasesIncomplete()) {
      const confirmed = window.confirm(
        "⚠️ Casos de Prueba Incompletos\n\n" +
        "Los casos de prueba no están completamente definidos o no se generaron con IA.\n\n" +
        "Se recomienda:\n" +
        "• Completar todos los campos (Objetivo, Precondiciones, Pasos)\n" +
        "• Usar el botón 'Generar con IA' para crear casos de prueba automáticamente\n\n" +
        "¿Desea continuar de todas formas?"
      );
      
      if (!confirmed) {
        return; // User cancelled, stay on current step
      }
    }

    // Standard validation for other steps
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





  const isReviewStep = () => {
    // Final review step happens only after test case decision step
    let testCaseDecisionStep: number;
    switch (formData.useCaseType) {
      case 'entity':
        testCaseDecisionStep = 10; // Test case decision is step 10
        break;
      case 'reports':
        testCaseDecisionStep = 9; // Test case decision is step 9
        break;
      case 'api':
      case 'service':
        testCaseDecisionStep = 7; // Test case decision is step 7
        break;
      default:
        testCaseDecisionStep = 7;
    }
    
    if (formData.generateTestCase) {
      return currentStep === testCaseDecisionStep + 1; // Step after test cases (actual test case step)
    } else {
      return currentStep === testCaseDecisionStep; // Only on decision step when user selects "finish without test cases"
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
            variant="outline"
            className="ai-button variant-outline flex items-center"
            style={{ 
              backgroundColor: '#f9f9f9', 
              borderColor: '#7c3aed', 
              color: '#7c3aed' 
            }}
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
        <div className="max-w-none xl:max-w-7xl 2xl:max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center py-4">
            {/* Columna izquierda - Logo */}
            <div className="flex items-center space-x-3 flex-1">
              {/* Logo responsive: logo completo en pantallas grandes, logo pequeño en móvil */}
              <img 
                src="/ingematica-logo-full.png" 
                alt="Ingematica Logo" 
                className="hidden sm:block h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setCurrentStep(1);
                  handleReset();
                }}
                title="Volver al inicio"
              />
              <img 
                src="/attached_assets/company-logo.png" 
                alt="Ingematica Logo" 
                className="sm:hidden h-8 w-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setCurrentStep(1);
                  handleReset();
                }}
                title="Volver al inicio"
              />
            </div>
            
            {/* Columna centro - Título */}
            <div className="flex justify-center flex-1">
              <h1 className="text-gray-900 hidden sm:block font-bold text-[30px]">
                Generador de Casos de Uso
              </h1>
            </div>
            
            {/* Columna derecha - Controles */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-1">
              <div className="scale-90 sm:scale-100">
                <AIModelHeader 
                  currentModel={formData.aiModel}
                  onModelChange={(model: AIModel) => updateFormData({ aiModel: model })}
                />
              </div>

              <Button 
                variant="ghost" 
                size="default"
                onClick={handleReset}
                className="text-ms-blue hover:text-ms-blue/80 h-12 w-12 p-0"
              >
                <RefreshCw size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>


      <div className="max-w-none xl:max-w-7xl 2xl:max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
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
            onAddAlternativeFlow={() => {}} // Placeholder - not implemented yet
            onRemoveAlternativeFlow={() => {}} // Placeholder - not implemented yet
            onUpdateAlternativeFlow={() => {}} // Placeholder - not implemented yet
            onAddTestStep={addTestStep}
            onRemoveTestStep={removeTestStep}
            onUpdateTestStep={updateTestStep}

            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onMinuteTextChange={setMinuteText}
          />

          {/* Navigation Buttons - Bottom */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <NavigationButtons />
          </div>
        </div>


      </div>
    </div>
      {/* Adaptive Loading for Document Generation */}
      {generateAndDownloadUseCaseMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:border-gray-700 z-50">
          <AdaptiveProgressSteps
            stages={[
              { stage: "Preparando datos", message: "Organizando información del formulario" },
              { stage: "Generando contenido", message: "Creando caso de uso con IA" },
              { stage: "Aplicando formato", message: "Estructurando documento según estándar ING" },
              { stage: "Creando documento", message: "Generando archivo DOCX profesional" },
              { stage: "Descargando", message: "Preparando descarga del documento" }
            ]}
            currentStage={
              progressPercentage < 20 ? 0 :
              progressPercentage < 40 ? 1 :
              progressPercentage < 60 ? 2 :
              progressPercentage < 80 ? 3 : 4
            }
          />
          <div className="mt-4">
            <AdaptiveLoading
              context="document-generation"
              isLoading={true}
              progress={progressPercentage}
              message={generationProgress}
              submessage="Esto puede tomar de 20 a 60 segundos"
              variant="inline"
            />
          </div>
        </div>
      )}
    </>
  );
}
