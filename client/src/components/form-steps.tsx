import { Brain, List, Info, Edit, Filter, Columns, Database, Settings, Globe, Clock, Sparkles, Cpu, Zap, Bot } from "lucide-react";
import { UseCaseFormData, EntityField, AIModel, UseCaseType } from "@/types/use-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveValidation } from "@/components/live-validation";
import UseCaseTemplatePreview from "@/components/use-case-template-preview";
import ContextualHelp from "@/components/contextual-help";
import { AIAssistButton } from "@/components/ai-assist-button";

interface FormStepsProps {
  currentStep: number;
  formData: UseCaseFormData;
  onUpdateFormData: (updates: Partial<UseCaseFormData>) => void;
  onAddSearchFilter: () => void;
  onRemoveSearchFilter: (index: number) => void;
  onUpdateSearchFilter: (index: number, value: string) => void;
  onAddResultColumn: () => void;
  onRemoveResultColumn: (index: number) => void;
  onUpdateResultColumn: (index: number, value: string) => void;
  onAddEntityField: () => void;
  onRemoveEntityField: (index: number) => void;
  onUpdateEntityField: (index: number, field: Partial<EntityField>) => void;
  onAddWireframeDescription: () => void;
  onRemoveWireframeDescription: (index: number) => void;
  onUpdateWireframeDescription: (index: number, value: string) => void;
  onAddAlternativeFlow: () => void;
  onRemoveAlternativeFlow: (index: number) => void;
  onUpdateAlternativeFlow: (index: number, value: string) => void;
  onLoadDemoData: () => void;
  onLoadPremiumExample?: () => void;
}

export default function FormSteps({
  currentStep,
  formData,
  onUpdateFormData,
  onAddSearchFilter,
  onRemoveSearchFilter,
  onUpdateSearchFilter,
  onAddResultColumn,
  onRemoveResultColumn,
  onUpdateResultColumn,
  onAddEntityField,
  onRemoveEntityField,
  onUpdateEntityField,
  onAddWireframeDescription,
  onRemoveWireframeDescription,
  onUpdateWireframeDescription,
  onAddAlternativeFlow,
  onRemoveAlternativeFlow,
  onUpdateAlternativeFlow,
  onLoadDemoData,
  onLoadPremiumExample
}: FormStepsProps) {

  const handleInputChange = (field: keyof UseCaseFormData, value: any) => {
    onUpdateFormData({ [field]: value });
  };

  // Step 1: AI Model Selection
  if (currentStep === 1) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Brain className="mx-auto text-ms-blue mb-3" size={32} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Configuración del Motor de IA
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Selecciona el modelo de inteligencia artificial que utilizarás para asistir en la generación de contenido
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Modelo de IA a utilizar
              </label>
              <Select 
                value={formData.aiModel} 
                onValueChange={(value) => handleInputChange('aiModel', value as AIModel)}
              >
                <SelectTrigger className="w-full h-14 px-4 border-2 border-gray-200 hover:border-ms-blue focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20 rounded-lg bg-white dark:bg-gray-800 transition-colors">
                  <SelectValue className="flex items-center">
                    {formData.aiModel === 'demo' && (
                      <div className="flex items-center">
                        <Sparkles className="mr-3 text-purple-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Modo Demo</div>
                          <div className="text-xs text-gray-500">Sin API necesaria</div>
                        </div>
                      </div>
                    )}
                    {formData.aiModel === 'openai' && (
                      <div className="flex items-center">
                        <Bot className="mr-3 text-green-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">OpenAI GPT-4</div>
                          <div className="text-xs text-gray-500">Avanzado y preciso</div>
                        </div>
                      </div>
                    )}
                    {formData.aiModel === 'claude' && (
                      <div className="flex items-center">
                        <Cpu className="mr-3 text-orange-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Anthropic Claude</div>
                          <div className="text-xs text-gray-500">Análisis profundo</div>
                        </div>
                      </div>
                    )}
                    {formData.aiModel === 'grok' && (
                      <div className="flex items-center">
                        <Zap className="mr-3 text-blue-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Grok API</div>
                          <div className="text-xs text-gray-500">Velocidad y eficiencia</div>
                        </div>
                      </div>
                    )}
                    {formData.aiModel === 'gemini' && (
                      <div className="flex items-center">
                        <Brain className="mr-3 text-red-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Google Gemini</div>
                          <div className="text-xs text-gray-500">Multimodal avanzado</div>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                  <SelectItem value="demo" className="h-14 px-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Sparkles className="mr-3 text-purple-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Modo Demo</div>
                        <div className="text-xs text-gray-500">Sin API necesaria • Ideal para pruebas</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai" className="h-14 px-4 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Bot className="mr-3 text-green-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">OpenAI GPT-4</div>
                        <div className="text-xs text-gray-500">Avanzado y preciso • Requiere API key</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="claude" className="h-14 px-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Cpu className="mr-3 text-orange-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Anthropic Claude</div>
                        <div className="text-xs text-gray-500">Análisis profundo • Requiere API key</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="grok" className="h-14 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Zap className="mr-3 text-blue-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Grok API</div>
                        <div className="text-xs text-gray-500">Velocidad y eficiencia • Requiere API key</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini" className="h-14 px-4 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Brain className="mr-3 text-red-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Google Gemini</div>
                        <div className="text-xs text-gray-500">Multimodal avanzado • Requiere API key</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" size={18} />
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    ¿Qué hace esta configuración?
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    El modelo seleccionado se usará únicamente para los <strong>botones AI Assist</strong> que aparecen junto a los campos del formulario. El documento final siempre mantiene formato profesional sin procesamiento de IA.
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    💡 Recomendación: Usa <strong>Modo Demo</strong> para probar sin APIs o <strong>OpenAI</strong> para mejores resultados.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Use Case Type with Template Preview
  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <List className="mr-2 text-ms-blue" size={20} />
            Selecciona el Tipo de Caso de Uso
          </h3>
          <ContextualHelp step={currentStep} useCaseType={formData.useCaseType} />
        </div>
        
        <UseCaseTemplatePreview 
          selectedType={formData.useCaseType}
          onTypeSelect={(type) => handleInputChange('useCaseType', type)}
        />

        {/* Botón de autocompletado para ejemplo Premium solo cuando está seleccionado "Gestión de Entidades" */}
        {formData.useCaseType === 'entity' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Ejemplo Complejo: Gestionar Clientes Premium</h4>
                  <p className="text-sm text-blue-700">
                    Autocompletar con un caso de uso bancario completo y detallado
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={onLoadPremiumExample}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Autocompletar Ejemplo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Step 3: Basic Information
  if (currentStep === 3) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Info className="mr-2 text-ms-blue" size={20} />
              Información Básica
            </h3>
            <ContextualHelp step={currentStep} useCaseType={formData.useCaseType} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Cliente *
              </label>
              <input 
                type="text" 
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Ej: Banco Nacional de Argentina"
              />
              <LiveValidation value={formData.clientName} type="required" label="Nombre del Cliente" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Proyecto *
              </label>
              <input 
                type="text" 
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Ej: Sistema de Gestión de Usuarios"
              />
              <LiveValidation value={formData.projectName} type="required" label="Nombre del Proyecto" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código del Caso de Uso *
              </label>
              <input 
                type="text" 
                value={formData.useCaseCode}
                onChange={(e) => handleInputChange('useCaseCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Ej: UC001"
              />
              <LiveValidation value={formData.useCaseCode} type="required" label="Código del Caso de Uso" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Use Case Details
  if (currentStep === 4) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Edit className="mr-2 text-ms-blue" size={20} />
              Detalles del Caso de Uso
            </h3>
            <ContextualHelp step={currentStep} useCaseType={formData.useCaseType} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Caso de Uso *
              </label>
              <input 
                type="text" 
                value={formData.useCaseName}
                onChange={(e) => handleInputChange('useCaseName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Ej: Gestionar Usuarios del Sistema"
              />
              <LiveValidation value={formData.useCaseName} type="useCaseName" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Archivo *
              </label>
              <input 
                type="text" 
                value={formData.fileName}
                onChange={(e) => handleInputChange('fileName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Ej: AB123GestionarUsuarios"
              />
              <LiveValidation value={formData.fileName} type="fileName" />
            </div>
            
            {formData.useCaseType === 'entity' && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <input 
                  type="checkbox"
                  id="generateWireframes"
                  checked={formData.generateWireframes}
                  onChange={(e) => handleInputChange('generateWireframes', e.target.checked)}
                  className="rounded border-gray-300 text-ms-blue focus:ring-ms-blue focus:ring-offset-0"
                />
                <label htmlFor="generateWireframes" className="text-sm text-gray-700 dark:text-gray-300">
                  ✨ Generar bocetos gráficos de wireframes para interfaces de usuario
                </label>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción *
              </label>
              <div className="relative">
                <textarea 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Describa el alcance y objetivo del caso de uso..."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="description"
                    fieldValue={formData.description}
                    fieldType="textarea"
                    context={{ 
                      step: 4, 
                      useCaseName: formData.useCaseName,
                      useCaseType: formData.useCaseType,
                      clientName: formData.clientName 
                    }}
                    onImprovement={(value) => handleInputChange('description', value)}
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
              <LiveValidation value={formData.description} type="required" label="Descripción" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 5: Search Filters (Entity only)
  if (currentStep === 5 && formData.useCaseType === 'entity') {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="mr-2 text-ms-blue" size={20} />
            Filtros de Búsqueda
          </h3>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe los filtros de búsqueda (opcional)
              </label>
              <div className="relative">
                <textarea
                  placeholder="Ej: Los usuarios podrán filtrar por nombre del cliente, estado del cliente (activo/inactivo), fecha de registro, y tipo de segmento..."
                  rows={4}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="searchFiltersDescription"
                    fieldValue=""
                    fieldType="filtersFromText"
                    context={{ step: 5, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar el texto y crear filtros automáticamente
                      const filters = value.split('\n').filter(f => f.trim()).map(f => f.trim());
                      filters.forEach(filter => {
                        onAddSearchFilter();
                        setTimeout(() => {
                          const currentFilters = formData.searchFilters;
                          const lastIndex = currentFilters.length - 1;
                          if (lastIndex >= 0) {
                            onUpdateSearchFilter(lastIndex, filter);
                          }
                        }, 10);
                      });
                    }}
                    aiModel={formData.aiModel}
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en filtros estructurados
              </p>
            </div>

            {/* Lista manual de filtros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtros disponibles para la búsqueda
              </label>
              
              <div className="space-y-2">
              {formData.searchFilters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={filter}
                    onChange={(e) => onUpdateSearchFilter(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                    placeholder="Nombre del filtro (ej: Nombre)"
                  />
                  <AIAssistButton
                    fieldName={`searchFilter_${index}`}
                    fieldValue={filter}
                    fieldType="searchFilter"
                    context={{ step: 5, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => onUpdateSearchFilter(index, value)}
                    size="sm"
                    aiModel={formData.aiModel}
                  />
                  <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSearchFilter(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              </div>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={onAddSearchFilter}
                className="text-ms-blue border-ms-blue hover:bg-ms-blue hover:text-white"
              >
                Agregar filtro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 6: Result Columns (Entity only)
  if (currentStep === 6 && formData.useCaseType === 'entity') {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Columns className="mr-2 text-ms-blue" size={20} />
            Columnas de Resultado
          </h3>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe las columnas de resultado (opcional)
              </label>
              <div className="relative">
                <textarea
                  placeholder="Ej: La tabla de resultados debe mostrar el ID del cliente, nombre completo, email, teléfono, fecha de registro, estado actual y tipo de segmento..."
                  rows={4}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="resultColumnsDescription"
                    fieldValue=""
                    fieldType="columnsFromText"
                    context={{ step: 6, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar el texto y crear columnas automáticamente
                      const columns = value.split('\n').filter(c => c.trim()).map(c => c.trim());
                      columns.forEach(column => {
                        onAddResultColumn();
                        setTimeout(() => {
                          const currentColumns = formData.resultColumns;
                          const lastIndex = currentColumns.length - 1;
                          if (lastIndex >= 0) {
                            onUpdateResultColumn(lastIndex, column);
                          }
                        }, 10);
                      });
                    }}
                    aiModel={formData.aiModel}
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en columnas estructuradas
              </p>
            </div>

            {/* Lista manual de columnas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Columnas que se mostrarán en los resultados de búsqueda
              </label>
              
              <div className="space-y-2">
                {formData.resultColumns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={column}
                      onChange={(e) => onUpdateResultColumn(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                      placeholder="Nombre de la columna (ej: ID)"
                    />
                    <AIAssistButton
                      fieldName={`resultColumn_${index}`}
                      fieldValue={column}
                      fieldType="resultColumn"
                      context={{ step: 6, useCaseType: formData.useCaseType }}
                      onImprovement={(value) => onUpdateResultColumn(index, value)}
                      size="sm"
                      aiModel={formData.aiModel}
                    />
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveResultColumn(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={onAddResultColumn}
                className="text-ms-blue border-ms-blue hover:bg-ms-blue hover:text-white"
              >
                Agregar columna
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 7: Entity Fields (Entity only)
  if (currentStep === 7 && formData.useCaseType === 'entity') {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="mr-2 text-ms-blue" size={20} />
            Datos de la Entidad
          </h3>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe los campos de la entidad (opcional)
              </label>
              <div className="relative">
                <textarea
                  placeholder="Ej: La entidad Cliente debe tener: nombre completo (texto, obligatorio, máximo 100 caracteres), email (email, obligatorio), teléfono (texto, opcional, 15 caracteres), fecha de nacimiento (fecha, opcional), estado (booleano, obligatorio, por defecto activo)..."
                  rows={6}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="entityFieldsDescription"
                    fieldValue=""
                    fieldType="fieldsFromText"
                    context={{ step: 7, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar JSON y crear campos de entidad automáticamente
                      try {
                        const fields = JSON.parse(value);
                        if (Array.isArray(fields)) {
                          fields.forEach(field => {
                            onAddEntityField();
                            setTimeout(() => {
                              const currentFields = formData.entityFields;
                              const lastIndex = currentFields.length - 1;
                              if (lastIndex >= 0) {
                                onUpdateEntityField(lastIndex, {
                                  name: field.name || '',
                                  type: field.type || 'text',
                                  mandatory: field.mandatory ?? false,
                                  length: field.length
                                });
                              }
                            }, 10);
                          });
                        }
                      } catch (error) {
                        console.error('Error parsing entity fields JSON:', error);
                        // Fallback: treat as text lines
                        const fieldNames = value.split('\n').filter(f => f.trim()).map(f => f.trim());
                        fieldNames.forEach(fieldName => {
                          onAddEntityField();
                          setTimeout(() => {
                            const currentFields = formData.entityFields;
                            const lastIndex = currentFields.length - 1;
                            if (lastIndex >= 0) {
                              onUpdateEntityField(lastIndex, { name: fieldName });
                            }
                          }, 10);
                        });
                      }
                    }}
                    aiModel={formData.aiModel}
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en campos estructurados con tipos y validaciones
              </p>
            </div>

            {/* Lista manual de campos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campos de la entidad
              </label>
              
              <div className="space-y-3">
              {formData.entityFields.map((field, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={field.name}
                        onChange={(e) => onUpdateEntityField(index, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                        placeholder="Nombre del campo"
                      />
                      <AIAssistButton
                        fieldName={`entityField_${index}`}
                        fieldValue={field.name}
                        fieldType="entityField"
                        context={{ step: 7, useCaseType: formData.useCaseType }}
                        onImprovement={(value) => onUpdateEntityField(index, { name: value })}
                        size="sm"
                        aiModel={formData.aiModel}
                      />
                    </div>
                    
                    <select 
                      value={field.type}
                      onChange={(e) => onUpdateEntityField(index, { type: e.target.value as EntityField['type'] })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                      <option value="boolean">Booleano</option>
                      <option value="email">Email</option>
                    </select>
                    
                    <input 
                      type="number" 
                      value={field.length || ''}
                      onChange={(e) => onUpdateEntityField(index, { length: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                      placeholder="Longitud máxima"
                    />
                    
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={field.mandatory}
                          onChange={(e) => onUpdateEntityField(index, { mandatory: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">Obligatorio</span>
                      </label>
                      
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveEntityField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={onAddEntityField}
              className="text-ms-blue border-ms-blue hover:bg-ms-blue hover:text-white"
            >
              Agregar campo
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 5: API/Service specific fields (non-entity types)
  if (currentStep === 5 && formData.useCaseType === 'api') {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="mr-2 text-ms-blue" size={20} />
            Detalles de API/Web Service
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint de la API
              </label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={formData.apiEndpoint || ''}
                  onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                  placeholder="Ej: https://api.ejemplo.com/v1/usuarios"
                />
                <AIAssistButton
                  fieldName="apiEndpoint"
                  fieldValue={formData.apiEndpoint || ''}
                  fieldType="apiEndpoint"
                  context={{ step: 5, useCaseType: formData.useCaseType }}
                  onImprovement={(value) => handleInputChange('apiEndpoint', value)}
                  aiModel={formData.aiModel}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato del Request
              </label>
              <div className="relative">
                <textarea 
                  value={formData.requestFormat || ''}
                  onChange={(e) => handleInputChange('requestFormat', e.target.value)}
                  rows={4} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                  placeholder="Describir el formato del request JSON, parámetros requeridos, headers, etc."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="requestFormat"
                    fieldValue={formData.requestFormat || ''}
                    fieldType="textarea"
                    context={{ step: 5, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => handleInputChange('requestFormat', value)}
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato del Response
              </label>
              <div className="relative">
                <textarea 
                  value={formData.responseFormat || ''}
                  onChange={(e) => handleInputChange('responseFormat', e.target.value)}
                  rows={4} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                  placeholder="Describir el formato del response JSON, códigos de estado, estructura de datos, etc."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="responseFormat"
                    fieldValue={formData.responseFormat || ''}
                    fieldType="textarea"
                    context={{ step: 5, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => handleInputChange('responseFormat', value)}
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Step 5: Service specific fields (service type)
  if (currentStep === 5 && formData.useCaseType === 'service') {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2 text-ms-blue" size={20} />
            Detalles de Servicio/Proceso Automático
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia de Ejecución
              </label>
              <input 
                type="text" 
                value={formData.serviceFrequency || ''}
                onChange={(e) => handleInputChange('serviceFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: Diariamente, Cada hora, Semanal, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Ejecución
              </label>
              <input 
                type="text" 
                value={formData.executionTime || ''}
                onChange={(e) => handleInputChange('executionTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: 02:00 AM, 18:30, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rutas de Configuración
              </label>
              <textarea 
                value={formData.configurationPaths || ''}
                onChange={(e) => handleInputChange('configurationPaths', e.target.value)}
                rows={3} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Si el proceso captura archivos, indicar que las rutas deben ser configurables"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credenciales de Web Services
              </label>
              <textarea 
                value={formData.webServiceCredentials || ''}
                onChange={(e) => handleInputChange('webServiceCredentials', e.target.value)}
                rows={3} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Si llama web services, indicar que usuario, clave y URL deben ser configurables"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 8: Additional Options (adjusted step number for non-entity types)
  const isAdditionalOptionsStep = formData.useCaseType === 'entity' ? currentStep === 8 : currentStep === 6;
  if (isAdditionalOptionsStep) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="mr-2 text-ms-blue" size={20} />
            Opciones Adicionales
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={formData.generateWireframes}
                  onChange={(e) => handleInputChange('generateWireframes', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generar descripciones de wireframes
                </span>
              </label>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                Incluye descripciones detalladas de las interfaces de usuario
              </div>
            </div>

            {formData.generateWireframes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripciones de Wireframes
                </label>
                <div className="space-y-2">
                  {(formData.wireframeDescriptions || ['']).map((description, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative">
                        <textarea
                          value={description}
                          onChange={(e) => onUpdateWireframeDescription(index, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y"
                          placeholder={`Wireframe ${index + 1}: Describe la pantalla en lenguaje natural. Ej: Una pantalla de búsqueda donde el usuario puede filtrar por nombre, ver resultados en tabla y editar registros...`}
                        />
                        <div className="absolute top-2 right-2">
                          <AIAssistButton
                            fieldName={`wireframeDescription_${index}`}
                            fieldValue={description}
                            fieldType="wireframeDescription"
                            context={{ step: 8, useCaseType: formData.useCaseType }}
                            onImprovement={(value) => onUpdateWireframeDescription(index, value)}
                            size="sm"
                            aiModel={formData.aiModel}
                          />
                        </div>
                      </div>
                      {(formData.wireframeDescriptions || []).length > 1 && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveWireframeDescription(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕ Eliminar Wireframe
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddWireframeDescription}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Agregar Wireframe
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flujos Alternativos
              </label>
              <div className="space-y-2">
                {(formData.alternativeFlows || ['']).map((flow, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={flow}
                        onChange={(e) => onUpdateAlternativeFlow(index, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y"
                        placeholder={`Flujo alternativo ${index + 1}: Describe el escenario de error en lenguaje natural. Ej: Cuando el usuario busca un cliente que no existe, que pasa y como se maneja...`}
                      />
                      <div className="absolute top-2 right-2">
                        <AIAssistButton
                          fieldName={`alternativeFlow_${index}`}
                          fieldValue={flow}
                          fieldType="alternativeFlow"
                          context={{ step: 8, useCaseType: formData.useCaseType }}
                          onImprovement={(value) => onUpdateAlternativeFlow(index, value)}
                          size="sm"
                          aiModel={formData.aiModel}
                        />
                      </div>
                    </div>
                    {(formData.alternativeFlows || []).length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveAlternativeFlow(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕ Eliminar Flujo Alternativo
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddAlternativeFlow}
                  className="text-blue-600 hover:text-blue-700"
                >
                  + Agregar Flujo Alternativo
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reglas de negocio adicionales
              </label>
              <div className="relative">
                <textarea 
                  value={formData.businessRules}
                  onChange={(e) => handleInputChange('businessRules', e.target.value)}
                  rows={5} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y" 
                  placeholder="Describe las reglas de negocio en lenguaje natural. Ej: Los clientes no se pueden eliminar si tienen productos activos, el DNI debe ser único, solo supervisores pueden hacer ciertas operaciones..."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="businessRules"
                    fieldValue={formData.businessRules}
                    fieldType="businessRules"
                    context={{ step: 8, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => handleInputChange('businessRules', value)}
                    size="sm"
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requerimientos especiales
              </label>
              <div className="relative">
                <textarea 
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  rows={5} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y" 
                  placeholder="Describe los requerimientos especiales en lenguaje natural. Ej: Debe integrarse con servicio externo, tiempos de respuesta específicos, validaciones HTTPS, auditoria completa..."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="specialRequirements"
                    fieldValue={formData.specialRequirements}
                    fieldType="specialRequirements"
                    context={{ step: 8, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => handleInputChange('specialRequirements', value)}
                    size="sm"
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 9: Review and Generation (adjusted step number for non-entity types)
  const isReviewStep = formData.useCaseType === 'entity' ? currentStep === 9 : currentStep === 7;
  if (isReviewStep) {
    const getSummaryData = () => {
      const summary = [];
      if (formData.clientName) summary.push(`Cliente: ${formData.clientName}`);
      if (formData.projectName) summary.push(`Proyecto: ${formData.projectName}`);
      if (formData.useCaseCode) summary.push(`Código: ${formData.useCaseCode}`);
      if (formData.useCaseName) summary.push(`Nombre: ${formData.useCaseName}`);
      if (formData.fileName) summary.push(`Archivo: ${formData.fileName}`);
      summary.push(`Tipo: ${formData.useCaseType}`);
      summary.push(`Modelo de IA: ${formData.aiModel}`);
      
      if (formData.useCaseType === 'entity') {
        if (formData.searchFilters?.length) {
          summary.push(`Filtros: ${formData.searchFilters.filter(f => f.trim()).length} configurados`);
        }
        if (formData.resultColumns?.length) {
          summary.push(`Columnas: ${formData.resultColumns.filter(c => c.trim()).length} configuradas`);
        }
        if (formData.entityFields?.length) {
          summary.push(`Campos: ${formData.entityFields.filter(f => f.name.trim()).length} configurados`);
        }
      }
      
      return summary;
    };

    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="mr-2 text-ms-blue" size={20} />
            Revisión y Generación
          </h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Resumen de la configuración:</h4>
              <div className="space-y-2 text-sm">
                {getSummaryData().map((item, index) => (
                  <div key={index} className="text-gray-700">{item}</div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                type="button" 
                onClick={onLoadDemoData}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Cargar Datos Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
