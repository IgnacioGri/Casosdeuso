import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, FileText, Download, RefreshCw } from "lucide-react";
import { UseCaseFormData } from "@/types/use-case";

interface EnhancedDocumentPreviewProps {
  formData: UseCaseFormData;
  currentStep: number;
  generatedContent?: string;
  onRefresh?: () => void;
  onDownload?: () => void;
}

export default function EnhancedDocumentPreview({ 
  formData, 
  currentStep, 
  generatedContent,
  onRefresh,
  onDownload
}: EnhancedDocumentPreviewProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [previewSections, setPreviewSections] = useState<string[]>([]);

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
        <div>${Array.isArray(formData.businessRules) 
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

    if (formData.useCaseType === 'entity') {
      if (formData.searchFilters?.some(f => typeof f === 'string' && f.trim())) {
        sections.push(`
          <h2>Filtros de Búsqueda</h2>
          <ul>
            ${formData.searchFilters
              .filter(f => typeof f === 'string' && f.trim())
              .map(filter => `<li>${filter}</li>`)
              .join('')}
          </ul>
        `);
      }

      if (formData.resultColumns?.some(c => typeof c === 'string' && c.trim())) {
        sections.push(`
          <h2>Columnas del Resultado</h2>
          <ul>
            ${formData.resultColumns
              .filter(c => typeof c === 'string' && c.trim())
              .map(column => `<li>${column}</li>`)
              .join('')}
          </ul>
        `);
      }

      if (formData.entityFields?.some(f => f && f.name && typeof f.name === 'string' && f.name.trim())) {
        sections.push(`
          <h2>Campos de la Entidad</h2>
          <ul>
            ${formData.entityFields
              .filter(f => f && f.name && typeof f.name === 'string' && f.name.trim())
              .map(field => `
                <li>
                  <strong>${field.name}</strong>: ${field.type}${field.length ? `(${field.length})` : ''} 
                  - ${field.mandatory ? 'Obligatorio' : 'Opcional'}
                  ${field.description ? `<br><em>Descripción: ${field.description}</em>` : ''}
                  ${field.validationRules ? `<br><em>Validación: ${field.validationRules}</em>` : ''}
                </li>
              `).join('')}
          </ul>
        `);
      }
    }

    // ✨ CASOS DE PRUEBA - Mostrar solo si están configurados y generateTestCase es true
    if (formData.generateTestCase && (formData.testCaseObjective || formData.testCasePreconditions || formData.testSteps?.length)) {
      let testCaseSection = `
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0;">CASOS DE PRUEBA</h2>
      `;

      if (formData.testCaseObjective) {
        testCaseSection += `
          <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0;">Objetivo:</h3>
          <p style="margin-bottom: 16px;">${formData.testCaseObjective}</p>
        `;
      }

      if (formData.testCasePreconditions) {
        testCaseSection += `
          <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0;">Precondiciones:</h3>
        `;
        
        // Parse structured preconditions
        const preconditionsText = String(formData.testCasePreconditions || '');
        const lines = preconditionsText.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          let currentCategory = '';
          
          lines.forEach((line) => {
            const trimmedLine = line.trim();
            
            // Check if it's a category header (ends with ':')
            if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
              currentCategory = trimmedLine;
              testCaseSection += `
                <h4 style="color: rgb(0, 112, 192); font-size: 13px; font-weight: 600; margin: 15px 0 8px 0;">${currentCategory}</h4>
              `;
            } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
              // It's a bullet point
              const content = trimmedLine.replace(/^[•\-]\s*/, '').trim();
              if (content) {
                testCaseSection += `
                  <p style="margin: 4px 0 4px 20px;">• ${content}</p>
                `;
              }
            } else if (trimmedLine) {
              // Regular line without bullet - add as a bullet point
              testCaseSection += `
                <p style="margin: 4px 0 4px ${currentCategory ? '20px' : '0'};">${currentCategory ? '• ' : ''}${trimmedLine}</p>
              `;
            }
          });
        } else {
          // Fallback for single line preconditions
          testCaseSection += `
            <p style="margin-bottom: 16px;">${preconditionsText}</p>
          `;
        }
      }

      if (formData.testSteps?.length) {
        testCaseSection += `
          <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0;">Pasos de Prueba:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
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

      sections.push(testCaseSection);
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
        formData.searchFilters?.some(f => typeof f === 'string' && f.trim()) ? 'filters' : '',
        formData.resultColumns?.some(c => typeof c === 'string' && c.trim()) ? 'columns' : '',
        formData.entityFields?.some(f => f && f.name && typeof f.name === 'string' && f.name.trim()) ? 'fields' : ''
      );
    }

    const filledFields = requiredFields.filter(field => field && typeof field === 'string' && field.trim()).length;
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
                <Button size="sm" variant="outline" onClick={handleDownloadHtml}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar HTML
                </Button>
                <Button size="sm" variant="outline" onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar DOCX
                </Button>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none dark:prose-invert" 
              dangerouslySetInnerHTML={{ __html: generatedContent || '' }} 
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