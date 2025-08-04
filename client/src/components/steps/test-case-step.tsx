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
  onUpdateObjective: (value: string) => void;
  onUpdatePreconditions: (value: string) => void;
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
}

export function TestCaseStep({
  testCaseObjective,
  testCasePreconditions,
  testSteps,
  onUpdateObjective,
  onUpdatePreconditions,
  onAddTestStep,
  onRemoveTestStep,
  onUpdateTestStep,
  clientName,
  projectName,
  useCaseName,
  aiModel,
  formData,
  onReplaceAllTestData
}: TestCaseStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

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
            className="border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar con IA
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
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
          <div className="flex items-center gap-2 mb-2">
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
    </>
  );
}