import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Brain, RefreshCw } from "lucide-react";
import { TestStep } from "@/types/use-case";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIAssistButton } from "@/components/ai-assist-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulletTextarea } from "@/components/bullet-textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ProgressIndicator } from "@/components/progress-indicator";
import { AdaptiveLoading, AdaptiveProgressSteps } from "@/components/adaptive-loading";


interface TestCaseStepProps {
  testCaseObjective: string;
  testCasePreconditions: string;
  testSteps: TestStep[];
  testCaseSuggestions?: string;
  testCasesGeneratedWithAI?: boolean;
  onUpdateObjective: (value: string) => void;
  onUpdatePreconditions: (value: string) => void;
  onUpdateSuggestions?: (value: string) => void;
  onAddTestStep: () => void;
  onRemoveTestStep: (index: number) => void;
  onUpdateTestStep: (index: number, field: keyof TestStep, value: string | number) => void;
  clientName: string;
  projectName: string;
  useCaseName: string;
  aiModel: string;
  // Add the complete form data for intelligent test generation
  formData?: any;
  onReplaceAllTestData?: (data: { objective: string; preconditions: string; testSteps: TestStep[] }) => void;
  onSetAIGenerated?: (value: boolean) => void;
}

export function TestCaseStep({
  testCaseObjective,
  testCasePreconditions,
  testSteps,
  testCaseSuggestions = '',
  testCasesGeneratedWithAI = false,
  onUpdateObjective,
  onUpdatePreconditions,
  onUpdateSuggestions,
  onAddTestStep,
  onRemoveTestStep,
  onUpdateTestStep,
  clientName,
  projectName,
  useCaseName,
  aiModel,
  formData,
  onReplaceAllTestData,
  onSetAIGenerated
}: TestCaseStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateProgress, setRegenerateProgress] = useState(0);
  const [regenerateMessage, setRegenerateMessage] = useState('');

  const handleIntelligentGeneration = async () => {
    if (!formData || !onReplaceAllTestData) return;
    
    setIsGenerating(true);
    setProgress(10);
    setProgressMessage('Analizando caso de uso...');
    
    try {
      // Simular progreso gradual
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 80));
      }, 2000);
      
      const response = await fetch('/api/generate-intelligent-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          aiModel
        }),
      });

      clearInterval(progressInterval);
      setProgress(90);
      setProgressMessage('Procesando respuesta...');

      if (response.ok) {
        const result = await response.json();
        console.log('Intelligent test case result:', result);
        setProgress(100);
        setProgressMessage('¡Casos de prueba generados!');
        
        onReplaceAllTestData({
          objective: result.objective || '',
          preconditions: result.preconditions || '',
          testSteps: result.testSteps || []
        });
        
        // Mark test cases as AI-generated
        if (onSetAIGenerated) {
          onSetAIGenerated(true);
        }
        
        // Reset progress after a delay
        setTimeout(() => {
          setProgress(0);
          setProgressMessage('');
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Error al generar casos de prueba: ${errorText}`);
      }
    } catch (error) {
      console.error('Error generating intelligent tests:', error);
      alert('Error al generar casos de prueba inteligentes. Por favor, intente nuevamente.');
    } finally {
      setIsGenerating(false);
      if (progress < 100) {
        setProgress(0);
        setProgressMessage('');
      }
    }
  };

  const handleRegenerateWithSuggestions = async () => {
    if (!formData || !onReplaceAllTestData || !testCaseSuggestions) return;
    
    setIsRegenerating(true);
    setRegenerateProgress(10);
    setRegenerateMessage('Procesando sugerencias...');
    
    try {
      // Simular progreso gradual
      const progressInterval = setInterval(() => {
        setRegenerateProgress(prev => Math.min(prev + 10, 80));
      }, 2000);
      
      const response = await fetch('/api/generate-intelligent-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          aiModel,
          suggestions: testCaseSuggestions,
          isRegeneration: true
        }),
      });

      clearInterval(progressInterval);
      setRegenerateProgress(90);
      setRegenerateMessage('Aplicando mejoras...');

      if (response.ok) {
        const result = await response.json();
        console.log('Regenerated test case result:', result);
        setRegenerateProgress(100);
        setRegenerateMessage('¡Casos de prueba regenerados con sus sugerencias!');
        
        onReplaceAllTestData({
          objective: result.objective || '',
          preconditions: result.preconditions || '',
          testSteps: result.testSteps || []
        });
        
        // Clear suggestions after successful regeneration
        if (onUpdateSuggestions) {
          onUpdateSuggestions('');
        }
        
        // Reset progress after a delay
        setTimeout(() => {
          setRegenerateProgress(0);
          setRegenerateMessage('');
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Error al regenerar casos de prueba: ${errorText}`);
      }
    } catch (error) {
      console.error('Error regenerating tests:', error);
      alert('Error al regenerar casos de prueba. Por favor, intente nuevamente.');
    } finally {
      setIsRegenerating(false);
      if (regenerateProgress < 100) {
        setRegenerateProgress(0);
        setRegenerateMessage('');
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Casos de Prueba</h3>
        </div>
        
        {formData && onReplaceAllTestData && (
          <Button 
            onClick={handleIntelligentGeneration} 
            disabled={isGenerating}
            size="sm"
            variant="outline"
            className="ai-button variant-outline"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin text-violet-600" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2 text-violet-600" />
                Generar con IA
              </>
            )}
          </Button>
        )}
      </div>

      {/* Suggestions Field - Show after AI generation at the top */}
      {testCasesGeneratedWithAI && onUpdateSuggestions && (
        <Card className="border-violet-200 bg-violet-50/50 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-600" />
              Sugerencias para Mejorar los Casos de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Si desea mejorar los casos de prueba generados, escriba sus sugerencias a continuación:
              </p>
              <BulletTextarea
                value={testCaseSuggestions}
                onChange={onUpdateSuggestions}
                placeholder="Escriba sus sugerencias con bullet points. Ej:
• Agregar validación de campos vacíos
• Incluir caso de prueba para usuarios con permisos limitados
• Probar el comportamiento con conexión lenta
• Verificar mensajes de error específicos..."
                rows={5}
                className="bg-white"
              />
              {testCaseSuggestions && (
                <Button
                  onClick={handleRegenerateWithSuggestions}
                  disabled={isRegenerating}
                  className="w-full ai-button variant-outline"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-violet-600" />
                      Regenerando con sus sugerencias...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 text-violet-600" />
                      Regenerar Casos de Prueba con Sugerencias
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="testCaseObjective">Objetivo del Caso de Prueba</Label>
            <AIAssistButton
              fieldName="testCaseObjective"
              fieldValue={testCaseObjective}
              fieldType="testCaseObjective"
              context={{ 
                clientName,
                projectName,
                useCaseName,
                useCaseType: 'entity'
              }}
              aiModel={aiModel}
              onImprovement={onUpdateObjective}
            />
          </div>
          <BulletTextarea
            value={testCaseObjective}
            onChange={onUpdateObjective}
            placeholder="Describe el objetivo con bullet points. Ej:
• Validar la funcionalidad completa de gestión de usuarios
• Verificar controles de seguridad y permisos
• Comprobar integridad de datos en todas las operaciones..."
            rows={4}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="testCasePreconditions">Precondiciones de Prueba</Label>
            <AIAssistButton
              fieldName="testCasePreconditions"
              fieldValue={testCasePreconditions}
              fieldType="testCasePreconditions"
              context={{
                clientName,
                projectName,
                useCaseName,
                useCaseType: 'entity'
              }}
              aiModel={aiModel}
              onImprovement={onUpdatePreconditions}
            />
          </div>
          <BulletTextarea
            value={testCasePreconditions}
            onChange={onUpdatePreconditions}
            placeholder="Describe las precondiciones con bullet points. Ej:
• Usuario autenticado con permisos adecuados
• Datos de prueba cargados en el sistema
• Conexión a base de datos disponible
• Ambiente de pruebas configurado correctamente..."
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use el botón AI para estructurar las precondiciones con formato profesional
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Pasos de la Prueba</Label>
            <Button onClick={onAddTestStep} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Paso
            </Button>
          </div>

          {testSteps.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No hay pasos de prueba definidos</p>
              <p className="text-sm">Haga clic en "Agregar Paso" para comenzar</p>
            </div>
          )}

          {testSteps.length > 0 && (
            <div className="space-y-4">
              {testSteps.map((step, index) => (
                <Card key={index} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ms-blue text-white text-sm font-medium">
                          {step.number}
                        </div>
                        Paso {step.number}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select
                          value={step.status}
                          onValueChange={(value) => onUpdateTestStep(index, 'status', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="---" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">---</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => onRemoveTestStep(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Acción
                      </Label>
                      <BulletTextarea
                        value={step.action}
                        onChange={(value) => onUpdateTestStep(index, 'action', value)}
                        placeholder="Describe la acción con bullet points. Ej:
• Acceder al módulo de gestión de usuarios
• Hacer clic en el botón 'Nuevo Usuario'
• Completar formulario con datos válidos..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Datos de Entrada
                      </Label>
                      <BulletTextarea
                        value={step.inputData}
                        onChange={(value) => onUpdateTestStep(index, 'inputData', value)}
                        placeholder="Especifica los datos necesarios con bullet points. Ej:
• Nombre: Juan Pérez
• DNI: 12345678
• Email: juan.perez@example.com
• Rol: Usuario estándar..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Resultado Esperado
                      </Label>
                      <BulletTextarea
                        value={step.expectedResult}
                        onChange={(value) => onUpdateTestStep(index, 'expectedResult', value)}
                        placeholder="Define el resultado esperado con bullet points. Ej:
• Usuario creado exitosamente en el sistema
• Mensaje de confirmación mostrado
• Usuario visible en la grilla de usuarios
• Email de bienvenida enviado automáticamente..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Observaciones
                      </Label>
                      <BulletTextarea
                        value={step.observations}
                        onChange={(value) => onUpdateTestStep(index, 'observations', value)}
                        placeholder="Agrega observaciones importantes con bullet points. Ej:
• Verificar validación de formato de email
• Comprobar unicidad del DNI
• Validar permisos del usuario actual
• Registrar operación en log de auditoría..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Progress Indicator */}
    {/* Adaptive Loading for Test Case Generation */}
    {isGenerating && (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:border-gray-700 z-50">
        <AdaptiveProgressSteps
          stages={[
            { stage: "Analizando caso de uso", message: "Revisando información ingresada" },
            { stage: "Identificando escenarios", message: "Detectando flujos y condiciones" },
            { stage: "Generando casos", message: "Creando escenarios de prueba con IA" },
            { stage: "Validando resultados", message: "Verificando completitud y coherencia" }
          ]}
          currentStage={
            progress < 25 ? 0 :
            progress < 50 ? 1 :
            progress < 75 ? 2 : 3
          }
        />
        <div className="mt-4">
          <AdaptiveLoading
            context="test-generation"
            isLoading={true}
            progress={progress}
            message={progressMessage}
            submessage="Creando casos de prueba inteligentes"
            variant="inline"
          />
        </div>
      </div>
    )}
    
    {/* Progress Indicator for Regeneration with Suggestions */}
    {isRegenerating && (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 border border-violet-300 dark:border-violet-700 z-50">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-violet-600 animate-pulse" />
          <span className="font-medium text-violet-700">Aplicando sus sugerencias</span>
        </div>
        <AdaptiveProgressSteps
          stages={[
            { stage: "Procesando sugerencias", message: "Analizando mejoras solicitadas" },
            { stage: "Refinando casos", message: "Aplicando sus comentarios" },
            { stage: "Regenerando pruebas", message: "Creando versión mejorada" },
            { stage: "Finalizando", message: "Completando actualización" }
          ]}
          currentStage={
            regenerateProgress < 25 ? 0 :
            regenerateProgress < 50 ? 1 :
            regenerateProgress < 75 ? 2 : 3
          }
        />
        <div className="mt-4">
          <AdaptiveLoading
            context="test-regeneration"
            isLoading={true}
            progress={regenerateProgress}
            message={regenerateMessage}
            submessage="Mejorando casos con sus sugerencias"
            variant="inline"
          />
        </div>
      </div>
    )}
    </>
  );
}