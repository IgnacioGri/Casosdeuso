import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Brain, RefreshCw } from "lucide-react";
import { TestStep } from "@/types/use-case";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIAssistButton } from "@/components/ai-assist-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ProgressIndicator } from "@/components/progress-indicator";


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
          <Textarea
            id="testCaseObjective"
            value={testCaseObjective}
            onChange={(e) => onUpdateObjective(e.target.value)}
            placeholder="Ej: Validar que el sistema permita realizar la búsqueda, alta, modificación y eliminación de usuarios con los controles de seguridad apropiados..."
            className="min-h-20 resize-y"
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
          <Textarea
            id="testCasePreconditions"
            value={testCasePreconditions}
            onChange={(e) => onUpdatePreconditions(e.target.value)}
            placeholder="Ej: • Usuario autenticado con permisos adecuados&#10;• Datos de prueba cargados en el sistema&#10;• Conexión a base de datos disponible"
            className="min-h-32 resize-y font-mono text-sm"
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-center w-16">#</th>
                    <th className="text-left min-w-[200px]">Acción</th>
                    <th className="text-left min-w-[200px]">Datos de Entrada</th>
                    <th className="text-left min-w-[200px]">Resultado Esperado</th>
                    <th className="text-left min-w-[200px]">Observaciones</th>
                    <th className="text-center w-32">Estado (P/F)</th>
                    <th className="text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {testSteps.map((step, index) => (
                    <tr key={index}>
                      <td className="text-center font-medium">{step.number}</td>
                      <td className="p-2">
                        <Textarea
                          value={step.action}
                          onChange={(e) => onUpdateTestStep(index, 'action', e.target.value)}
                          placeholder="Describir la acción a realizar..."
                          className="min-h-16 resize-y w-full"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea
                          value={step.inputData}
                          onChange={(e) => onUpdateTestStep(index, 'inputData', e.target.value)}
                          placeholder="Datos o información necesaria..."
                          className="min-h-16 resize-y w-full"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea
                          value={step.expectedResult}
                          onChange={(e) => onUpdateTestStep(index, 'expectedResult', e.target.value)}
                          placeholder="Resultado que se espera obtener..."
                          className="min-h-16 resize-y w-full"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea
                          value={step.observations}
                          onChange={(e) => onUpdateTestStep(index, 'observations', e.target.value)}
                          placeholder="Notas adicionales o consideraciones..."
                          className="min-h-16 resize-y w-full"
                        />
                      </td>
                      <td className="text-center p-2">
                        <Select
                          value={step.status}
                          onValueChange={(value) => onUpdateTestStep(index, 'status', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="---" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">---</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-center p-2">
                        <Button
                          onClick={() => onRemoveTestStep(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Progress Indicator */}
    <ProgressIndicator
      isVisible={isGenerating}
      progress={progress}
      message={progressMessage}
      subMessage="Generando casos de prueba basados en el análisis completo del caso de uso"
    />
    </>
  );
}