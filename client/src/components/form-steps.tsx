import { Brain, List, Info, Edit, Filter, Columns, Database, Settings, Globe, Clock } from "lucide-react";
import { UseCaseFormData, EntityField, AIModel, UseCaseType } from "@/types/use-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="mr-2 text-ms-blue" size={20} />
            Selección de Modelo de IA
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo de IA a utilizar
              </label>
              <select 
                value={formData.aiModel}
                onChange={(e) => handleInputChange('aiModel', e.target.value as AIModel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10"
              >
                <option value="demo">Modo Demo (Sin API)</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="claude">Anthropic Claude</option>
                <option value="grok">Grok API</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <Info className="text-blue-500 mt-0.5 mr-2" size={16} />
                <div className="text-sm text-blue-700">
                  <strong>Modo Demo:</strong> Genera contenido de ejemplo sin necesidad de claves API. 
                  Perfecto para probar la funcionalidad antes de configurar las APIs reales.
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
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Ej: Banco Nacional de Argentina"
                />
                <AIAssistButton
                  fieldName="clientName"
                  fieldValue={formData.clientName}
                  fieldType="text"
                  context={{ step: 3 }}
                  onImprovement={(value) => handleInputChange('clientName', value)}
                />
              </div>
              <LiveValidation value={formData.clientName} type="required" label="Nombre del Cliente" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Proyecto *
              </label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Ej: Sistema de Gestión de Usuarios"
                />
                <AIAssistButton
                  fieldName="projectName"
                  fieldValue={formData.projectName}
                  fieldType="text"
                  context={{ step: 3, clientName: formData.clientName }}
                  onImprovement={(value) => handleInputChange('projectName', value)}
                />
              </div>
              <LiveValidation value={formData.projectName} type="required" label="Nombre del Proyecto" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código del Caso de Uso *
              </label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.useCaseCode}
                  onChange={(e) => handleInputChange('useCaseCode', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Ej: UC001"
                />
                <AIAssistButton
                  fieldName="useCaseCode"
                  fieldValue={formData.useCaseCode}
                  fieldType="code"
                  context={{ step: 3 }}
                  onImprovement={(value) => handleInputChange('useCaseCode', value)}
                />
              </div>
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
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.useCaseName}
                  onChange={(e) => handleInputChange('useCaseName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Ej: Gestionar Usuarios del Sistema"
                />
                <AIAssistButton
                  fieldName="useCaseName"
                  fieldValue={formData.useCaseName}
                  fieldType="text"
                  context={{ step: 4, useCaseType: formData.useCaseType }}
                  onImprovement={(value) => handleInputChange('useCaseName', value)}
                />
              </div>
              <LiveValidation value={formData.useCaseName} type="useCaseName" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Archivo *
              </label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.fileName}
                  onChange={(e) => handleInputChange('fileName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                  placeholder="Ej: AB123GestionarUsuarios"
                />
                <AIAssistButton
                  fieldName="fileName"
                  fieldValue={formData.fileName}
                  fieldType="fileName"
                  context={{ step: 4, useCaseName: formData.useCaseName }}
                  onImprovement={(value) => handleInputChange('fileName', value)}
                />
              </div>
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
          
          <div className="space-y-4">
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
          
          <div className="space-y-4">
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
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campos de la entidad
            </label>
            
            <div className="space-y-3">
              {formData.entityFields.map((field, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={field.name}
                      onChange={(e) => onUpdateEntityField(index, { name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                      placeholder="Nombre del campo"
                    />
                    
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
              <input 
                type="text" 
                value={formData.apiEndpoint || ''}
                onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: https://api.ejemplo.com/v1/usuarios"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato del Request
              </label>
              <textarea 
                value={formData.requestFormat || ''}
                onChange={(e) => handleInputChange('requestFormat', e.target.value)}
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Describir el formato del request JSON, parámetros requeridos, headers, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato del Response
              </label>
              <textarea 
                value={formData.responseFormat || ''}
                onChange={(e) => handleInputChange('responseFormat', e.target.value)}
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Describir el formato del response JSON, códigos de estado, estructura de datos, etc."
              />
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
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => onUpdateWireframeDescription(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10"
                        placeholder={`Wireframe ${index + 1}: Descripción de la pantalla...`}
                      />
                      {(formData.wireframeDescriptions || []).length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveWireframeDescription(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </Button>
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
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={flow}
                      onChange={(e) => onUpdateAlternativeFlow(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10"
                      placeholder={`Flujo alternativo ${index + 1}: Escenario de excepción...`}
                    />
                    {(formData.alternativeFlows || []).length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveAlternativeFlow(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </Button>
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
              <textarea 
                value={formData.businessRules}
                onChange={(e) => handleInputChange('businessRules', e.target.value)}
                rows={3} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Especifique reglas de negocio específicas si las hay..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requerimientos especiales
              </label>
              <textarea 
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                rows={3} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Indique cualquier requerimiento especial..."
              />
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
