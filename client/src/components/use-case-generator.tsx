import { useState, useRef } from "react";
import { FileText, RefreshCw, ArrowLeft, ArrowRight, Cog, Upload, X, Image } from "lucide-react";
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
  const [customHeaderImage, setCustomHeaderImage] = useState<string | null>(
    localStorage.getItem('customHeaderImage')
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const baseSteps = formData.useCaseType === 'entity' ? 10 : 7;
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
          formData: data,
          customHeaderImage: customHeaderImage
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Por favor seleccione un archivo de imagen",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 2MB",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload to server
      const formData = new FormData();
      formData.append('headerImage', file);
      
      const response = await apiRequest('POST', '/api/upload-header', formData);
      
      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.imageUrl;
        
        // Save to localStorage and state
        localStorage.setItem('customHeaderImage', imageUrl);
        setCustomHeaderImage(imageUrl);
        
        toast({
          title: "Imagen cargada",
          description: "La imagen del header se ha actualizado correctamente"
        });
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
        variant: "destructive"
      });
    }
  };

  const handleClearCustomHeader = () => {
    localStorage.removeItem('customHeaderImage');
    setCustomHeaderImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Imagen eliminada",
      description: "Se ha restaurado el header por defecto"
    });
  };

  const isReviewStep = () => {
    // Final review step happens after test cases (if enabled) or after decision step
    const baseStep = formData.useCaseType === 'entity' ? 10 : 7;
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
              {customHeaderImage ? (
                <div className="relative group">
                  <img 
                    src={customHeaderImage} 
                    alt="Custom Header" 
                    className="h-12 max-w-xs object-contain"
                  />
                  <button
                    onClick={handleClearCustomHeader}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar imagen personalizada"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Logo responsive: logo completo en pantallas grandes, logo pequeño en móvil */}
                  <img 
                    src="/ingematica-logo-full.png" 
                    alt="Ingematica Logo" 
                    className="hidden sm:block h-10 object-contain"
                  />
                  <img 
                    src="/attached_assets/company-logo.png" 
                    alt="Ingematica Logo" 
                    className="sm:hidden h-8 w-8 object-contain"
                  />
                </>
              )}
              <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
                Generador de Casos de Uso
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="scale-90 sm:scale-100">
                <AIModelHeader 
                  currentModel={formData.aiModel}
                  onModelChange={(model: AIModel) => updateFormData({ aiModel: model })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:flex text-gray-600 hover:text-ms-blue px-2 py-1 text-xs"
                title="Cargar imagen personalizada"
              >
                <Image size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleReset}
                className="text-ms-blue hover:text-ms-blue/80 px-2 py-1"
              >
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

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
