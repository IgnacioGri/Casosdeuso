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

  // Calculate total steps based on use case type and test case decision
  const getTotalSteps = () => {
    const baseSteps = formData.useCaseType === 'entity' ? 9 : 7;
    // Always show one more step for test case decision or final review
    return baseSteps + (formData.generateTestCase ? 1 : 0);
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
      // ✨ CRITICAL FIX: En el paso final, aplicar formato al contenido existente, no generar nuevo
      // Construir el contenido completo con datos del formulario + casos de prueba
      const contentSections = [];
      
      // Header con estilos Microsoft
      contentSections.push(`
        <div style="border-bottom: 3px solid rgb(0, 112, 192); padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 24px; margin: 0;">ESPECIFICACIÓN DE CASO DE USO</h1>
        </div>
        
        <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 24px 0 12px 0;">Información del Proyecto</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold; width: 150px;">Cliente</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.clientName || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Proyecto</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.projectName || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Código</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.useCaseCode || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Archivo</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.fileName || 'No especificado'}</td>
          </tr>
        </table>
      `);

      // Caso de uso principal
      contentSections.push(`
        <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 24px 0 12px 0;">Descripción del Caso de Uso</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold; width: 150px;">Nombre</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.useCaseName || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Tipo</td>
            <td style="border: 1px solid #666; padding: 8px;">${
              formData.useCaseType === 'entity' ? 'Gestión de Entidades' : 
              formData.useCaseType === 'api' ? 'Integración API' : 
              'Proceso Automático'
            }</td>
          </tr>
          ${formData.description ? `<tr>
            <td style="border: 1px solid #666; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Descripción</td>
            <td style="border: 1px solid #666; padding: 8px;">${formData.description}</td>
          </tr>` : ''}
        </table>
      `);

      // Filtros de búsqueda si existen
      if (formData.searchFilters?.length) {
        contentSections.push(`
          <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 24px 0 12px 0;">Filtros de Búsqueda</h2>
          <ul style="font-family: 'Segoe UI Semilight', sans-serif; margin-left: 20px;">
            ${formData.searchFilters.map(filter => filter.trim() ? `<li>${filter.trim()}</li>` : '').join('')}
          </ul>
        `);
      }

      // Columnas de resultado si existen
      if (formData.resultColumns?.length) {
        contentSections.push(`
          <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 24px 0 12px 0;">Columnas de Resultado</h2>
          <ul style="font-family: 'Segoe UI Semilight', sans-serif; margin-left: 20px;">
            ${formData.resultColumns.map(column => column.trim() ? `<li>${column.trim()}</li>` : '').join('')}
          </ul>
        `);
      }

      // Campos de entidad si existen
      if (formData.entityFields?.length) {
        contentSections.push(`
          <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 24px 0 12px 0;">Campos de Entidad</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Nombre</th>
                <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Tipo</th>
                <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Longitud</th>
                <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Obligatorio</th>
                <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Descripción</th>
              </tr>
            </thead>
            <tbody>
              ${formData.entityFields.map(field => `
                <tr>
                  <td style="border: 1px solid #666; padding: 8px;">${field.name || ''}</td>
                  <td style="border: 1px solid #666; padding: 8px;">${field.type || ''}</td>
                  <td style="border: 1px solid #666; padding: 8px; text-align: center;">${field.length || ''}</td>
                  <td style="border: 1px solid #666; padding: 8px; text-align: center;">${field.mandatory ? 'Sí' : 'No'}</td>
                  <td style="border: 1px solid #666; padding: 8px;">${field.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `);
      }

      // Reglas de negocio
      if (formData.businessRules) {
        contentSections.push(`
          <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif;">Reglas de Negocio</h2>
          <div style="font-family: 'Segoe UI Semilight', sans-serif;">${
            Array.isArray(formData.businessRules) 
              ? formData.businessRules.map(rule => 
                  typeof rule === 'string' && rule.trim() ? `<p>• ${rule.trim()}</p>` : ''
                ).join('')
              : typeof formData.businessRules === 'string'
                ? formData.businessRules.split('\n').map(rule => 
                    rule.trim() ? `<p>• ${rule.trim()}</p>` : ''
                  ).join('')
                : `<p>• ${formData.businessRules}</p>`
          }</div>
        `);
      }

      // Casos de prueba si están habilitados
      if (formData.generateTestCase && (formData.testSteps?.length > 0 || formData.testCaseObjective || formData.testCasePreconditions)) {
        let testCaseSection = `
          <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">CASOS DE PRUEBA</h2>
        `;

        if (formData.testCaseObjective) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Objetivo:</h3>
            <p style="margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;">${formData.testCaseObjective}</p>
          `;
        }

        if (formData.testCasePreconditions) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Precondiciones:</h3>
            <p style="margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;">${formData.testCasePreconditions}</p>
          `;
        }

        if (formData.testSteps?.length) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Pasos de Prueba:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 50px;">#</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Acción</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Datos de Entrada</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Resultado Esperado</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Observaciones</th>
                </tr>
              </thead>
              <tbody>
          `;

          formData.testSteps.forEach((step) => {
            testCaseSection += `
              <tr>
                <td style="border: 1px solid #666; padding: 8px; text-align: center;">${step.number}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.action || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.inputData || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.expectedResult || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.observations || ''}</td>
              </tr>
            `;
          });

          testCaseSection += `
              </tbody>
            </table>
          `;
        }

        contentSections.push(testCaseSection);
      }

      // Agregar tabla de historial de revisiones
      const currentDate = new Date().toLocaleDateString('es-ES');
      contentSections.push(`
        <h2 style="color: rgb(0, 112, 192); font-family: 'Segoe UI Semilight', sans-serif; font-size: 16px; margin: 32px 0 12px 0;">Historial de Revisiones</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 80px;">Versión</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 100px;">Fecha</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 150px;">Responsable</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #666; padding: 8px; text-align: center;">1.0</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: center;">${currentDate}</td>
              <td style="border: 1px solid #666; padding: 8px;">Analista de Sistemas</td>
              <td style="border: 1px solid #666; padding: 8px;">Creación inicial del documento de caso de uso.</td>
            </tr>
          </tbody>
        </table>
      `);

      // Construir el documento final completo
      const finalContent = contentSections.join('');
      
      // Simular la respuesta sin llamar al servidor - NO generamos contenido nuevo con IA
      setGeneratedContent(finalContent);
      
      // También simular el objeto generatedUseCase para que las descargas funcionen
      setGeneratedUseCase({
        clientName: formData.clientName || 'No especificado',
        projectName: formData.projectName || 'No especificado',
        useCaseCode: formData.useCaseCode || 'No especificado',
        useCaseName: formData.useCaseName || 'No especificado',
        fileName: formData.fileName || 'documento',
        description: formData.description || '',
        useCaseType: formData.useCaseType || 'entity',
        searchFilters: formData.searchFilters || [],
        resultColumns: formData.resultColumns || [],
        entityFields: formData.entityFields || [],
        businessRules: formData.businessRules || '',
        specialRequirements: formData.specialRequirements || '',
        generateWireframes: formData.generateWireframes || false,
        wireframeDescriptions: formData.wireframeDescriptions || [],
        alternativeFlows: formData.alternativeFlows || []
      });
      
      toast({
        title: "Éxito",
        description: "Documento generado con formato aplicado correctamente"
      });
      
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

            />
          </div>
        </div>
      </div>
    </div>
  );
}
