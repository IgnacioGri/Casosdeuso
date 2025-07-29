import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, FileText, Download, RefreshCw, TestTube2 } from "lucide-react";
import { UseCaseFormData, TestStep } from "@/types/use-case";
import { TestCaseStep } from "./steps/test-case-step";

interface EnhancedDocumentPreviewProps {
  formData: UseCaseFormData;
  currentStep: number;
  generatedContent?: string;
  onRefresh?: () => void;
  onDownload?: () => void;
  onTestCaseUpdate?: (testData: { generateTestCase: boolean; testCaseObjective: string; testCasePreconditions: string; testSteps: any[] }) => void;
}

export default function EnhancedDocumentPreview({ 
  formData, 
  currentStep, 
  generatedContent,
  onRefresh,
  onDownload,
  onTestCaseUpdate
}: EnhancedDocumentPreviewProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [previewSections, setPreviewSections] = useState<string[]>([]);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);

  // Generate dynamic preview based on current form state
  useEffect(() => {
    const sections = [];
    
    if (formData.clientName || formData.projectName) {
      sections.push(`
        <h1>Información del Proyecto</h1>
        <p><strong>Cliente:</strong> ${formData.clientName || 'Por definir'}</p>
        <p><strong>Proyecto:</strong> ${formData.projectName || 'Por definir'}</p>
        <p><strong>Código:</strong> ${formData.useCaseCode || 'Por definir'}</p>
      `);
    }

    if (formData.useCaseName || formData.description) {
      sections.push(`
        <h1>Caso de Uso: ${formData.useCaseName || 'Por definir'}</h1>
        <p><strong>Archivo:</strong> ${formData.fileName || 'Por definir'}</p>
        <p><strong>Tipo:</strong> ${formData.useCaseType === 'entity' ? 'Gestión de Entidades' : 
                                  formData.useCaseType === 'api' ? 'Integración API' : 
                                  'Proceso Automático'}</p>
        ${formData.description ? `<p><strong>Descripción:</strong> ${formData.description}</p>` : ''}
      `);
    }

    if (formData.businessRules) {
      sections.push(`
        <h2>Reglas de Negocio</h2>
        <div>${formData.businessRules.split('\n').map(rule => 
          rule.trim() ? `<p>• ${rule.trim()}</p>` : ''
        ).join('')}</div>
      `);
    }

    if (formData.useCaseType === 'entity') {
      if (formData.searchFilters?.some(f => typeof f === 'string' && f.trim())) {
        sections.push(`
          <h2>Filtros de Búsqueda</h2>
          <ul>
            ${formData.searchFilters.filter(f => typeof f === 'string' && f.trim()).map(filter => 
              `<li>${filter}</li>`
            ).join('')}
          </ul>
        `);
      }

      if (formData.resultColumns?.some(c => typeof c === 'string' && c.trim())) {
        sections.push(`
          <h2>Columnas de Resultado</h2>
          <ul>
            ${formData.resultColumns.filter(c => typeof c === 'string' && c.trim()).map(column => 
              `<li>${column}</li>`
            ).join('')}
          </ul>
        `);
      }

      if (formData.entityFields?.some(f => f && f.name && typeof f.name === 'string' && f.name.trim())) {
        sections.push(`
          <h2>Campos de la Entidad</h2>
          <ul>
            ${formData.entityFields.filter(f => f && f.name && typeof f.name === 'string' && f.name.trim()).map(field => 
              `<li><strong>${field.name}</strong>: ${field.type}${field.length ? `(${field.length})` : ''} ${field.mandatory ? '- Obligatorio' : '- Opcional'}</li>`
            ).join('')}
          </ul>
        `);
      }
    }

    if (formData.useCaseType === 'api') {
      if (formData.apiEndpoint || formData.requestFormat) {
        sections.push(`
          <h2>Configuración de API</h2>
          ${formData.apiEndpoint ? `<p><strong>Endpoint:</strong> ${formData.apiEndpoint}</p>` : ''}
          ${formData.requestFormat ? `<p><strong>Formato de Petición:</strong></p><pre>${formData.requestFormat}</pre>` : ''}
          ${formData.responseFormat ? `<p><strong>Formato de Respuesta:</strong></p><pre>${formData.responseFormat}</pre>` : ''}
        `);
      }
    }

    if (formData.useCaseType === 'service') {
      if (formData.serviceFrequency || formData.executionTime) {
        sections.push(`
          <h2>Configuración del Servicio</h2>
          ${formData.serviceFrequency ? `<p><strong>Frecuencia:</strong> ${formData.serviceFrequency}</p>` : ''}
          ${formData.executionTime ? `<p><strong>Tiempo de Ejecución:</strong> ${formData.executionTime}</p>` : ''}
          ${formData.configurationPaths ? `<p><strong>Rutas de Configuración:</strong> ${formData.configurationPaths}</p>` : ''}
        `);
      }
    }

    if (formData.specialRequirements) {
      sections.push(`
        <h2>Requerimientos Especiales</h2>
        <p>${formData.specialRequirements}</p>
      `);
    }

    setPreviewSections(sections);
  }, [formData]);

  const getCompletionPercentage = () => {
    const requiredFields = [
      formData.clientName,
      formData.projectName,
      formData.useCaseName,
      formData.fileName,
      formData.description,
      formData.businessRules
    ];

    if (formData.useCaseType === 'entity') {
      requiredFields.push(
        formData.searchFilters?.some(f => f.trim()) ? 'filters' : '',
        formData.resultColumns?.some(c => c.trim()) ? 'columns' : '',
        formData.entityFields?.some(f => f.name.trim()) ? 'fields' : ''
      );
    }

    const filledFields = requiredFields.filter(field => field && field.trim()).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const handleDownloadHtml = () => {
    if (!generatedContent) return;
    
    try {
      // Create HTML file content with proper structure
      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.useCaseName || 'Caso de Uso'}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 40px; }
    </style>
</head>
<body>
    ${generatedContent}
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.fileName || 'caso-de-uso'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML:', error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Mostrar Vista Previa
        </Button>
      </div>
    );
  }

  return (
    <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vista Previa del Documento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {getCompletionPercentage()}% Completo
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {generatedContent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Documento Generado
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Dialog open={isTestCaseModalOpen} onOpenChange={setIsTestCaseModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                      <TestTube2 className="w-4 h-4 mr-2" />
                      Casos de Prueba
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl text-purple-900">
                        Casos de Prueba - {formData.useCaseName || 'Caso de Uso'}
                      </DialogTitle>
                    </DialogHeader>
                    <TestCaseStep
                      testCaseObjective={formData.testCaseObjective || ''}
                      testCasePreconditions={formData.testCasePreconditions || ''}
                      testSteps={formData.testSteps || []}
                      onUpdateObjective={(value: string) => {
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({ 
                            generateTestCase: true, 
                            testCaseObjective: value, 
                            testCasePreconditions: formData.testCasePreconditions || '', 
                            testSteps: formData.testSteps || [] 
                          });
                        }
                      }}
                      onUpdatePreconditions={(value: string) => {
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({ 
                            generateTestCase: true, 
                            testCaseObjective: formData.testCaseObjective || '', 
                            testCasePreconditions: value, 
                            testSteps: formData.testSteps || [] 
                          });
                        }
                      }}
                      onAddTestStep={() => {
                        const nextNumber = (formData.testSteps || []).length + 1;
                        const newTestSteps = [...(formData.testSteps || []), {
                          number: nextNumber,
                          action: '',
                          inputData: '',
                          expectedResult: '',
                          observations: '',
                          status: 'pending'
                        }];
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({ 
                            generateTestCase: true, 
                            testCaseObjective: formData.testCaseObjective || '', 
                            testCasePreconditions: formData.testCasePreconditions || '', 
                            testSteps: newTestSteps 
                          });
                        }
                      }}
                      onRemoveTestStep={(index: number) => {
                        const newTestSteps = (formData.testSteps || []).filter((_, i) => i !== index).map((step, i) => ({
                          ...step,
                          number: i + 1
                        }));
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({ 
                            generateTestCase: true, 
                            testCaseObjective: formData.testCaseObjective || '', 
                            testCasePreconditions: formData.testCasePreconditions || '', 
                            testSteps: newTestSteps 
                          });
                        }
                      }}
                      onUpdateTestStep={(index: number, field: keyof TestStep, value: string | number) => {
                        const newTestSteps = (formData.testSteps || []).map((step, i) => 
                          i === index ? { ...step, [field]: value } : step
                        );
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({ 
                            generateTestCase: true, 
                            testCaseObjective: formData.testCaseObjective || '', 
                            testCasePreconditions: formData.testCasePreconditions || '', 
                            testSteps: newTestSteps 
                          });
                        }
                      }}
                      clientName={formData.clientName}
                      projectName={formData.projectName}
                      useCaseName={formData.useCaseName}
                      aiModel={formData.aiModel}
                      formData={formData}
                      onReplaceAllTestData={(data) => {
                        if (onTestCaseUpdate) {
                          onTestCaseUpdate({
                            generateTestCase: true,
                            testCaseObjective: data.objective,
                            testCasePreconditions: data.preconditions,
                            testSteps: data.testSteps
                          });
                        }
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <Button size="sm" onClick={onDownload} disabled={!generatedContent}>
                  <Download className="w-4 h-4 mr-2" />
                  .docx
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadHtml} disabled={!generatedContent}>
                  <Download className="w-4 h-4 mr-2" />
                  .html
                </Button>
              </div>
            </div>
            <div 
              className="prose dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                Vista Previa en Tiempo Real
              </Badge>
              <span className="text-xs text-gray-500">
                Paso {currentStep}
              </span>
            </div>
            
            {previewSections.length > 0 ? (
              <div 
                className="prose dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: previewSections.join('') 
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Completa el formulario para ver la vista previa</p>
                <p className="text-xs mt-2">
                  La vista previa se actualiza automáticamente mientras introduces la información
                </p>
              </div>
            )}

            {getCompletionPercentage() >= 70 && !generatedContent && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  ✨ Tu formulario está casi completo. ¡Continúa al siguiente paso para generar el documento final!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}