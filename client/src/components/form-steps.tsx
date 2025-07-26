import { Brain, List, Info, Edit, Filter, Columns, Database, Settings } from "lucide-react";
import { UseCaseFormData, EntityField, AIModel, UseCaseType } from "@/types/use-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  onLoadDemoData: () => void;
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
  onLoadDemoData
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

  // Step 2: Use Case Type
  if (currentStep === 2) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <List className="mr-2 text-ms-blue" size={20} />
            Tipo de Caso de Uso
          </h3>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el tipo de caso de uso a generar:
            </label>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  value: 'entity' as UseCaseType,
                  title: 'Entidad',
                  description: 'Gestión completa de una entidad (CRUD, búsquedas, filtros)'
                },
                {
                  value: 'api' as UseCaseType,
                  title: 'API / Web Service',
                  description: 'Documentación de endpoints, request/response'
                },
                {
                  value: 'service' as UseCaseType,
                  title: 'Servicio / Proceso Automático',
                  description: 'Procesos automatizados, servicios programados'
                }
              ].map((option) => (
                <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="useCaseType" 
                    value={option.value}
                    checked={formData.useCaseType === option.value}
                    onChange={(e) => handleInputChange('useCaseType', e.target.value as UseCaseType)}
                    className="mr-3" 
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Basic Information
  if (currentStep === 3) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="mr-2 text-ms-blue" size={20} />
            Información Básica
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input 
                type="text" 
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: Banco Nacional de Argentina"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Proyecto *
              </label>
              <input 
                type="text" 
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: Sistema de Gestión de Usuarios"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código del Caso de Uso *
              </label>
              <input 
                type="text" 
                value={formData.useCaseCode}
                onChange={(e) => handleInputChange('useCaseCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: UC001"
              />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Edit className="mr-2 text-ms-blue" size={20} />
            Detalles del Caso de Uso
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Caso de Uso *
              </label>
              <input 
                type="text" 
                value={formData.useCaseName}
                onChange={(e) => handleInputChange('useCaseName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: Gestionar Usuarios del Sistema"
              />
              <div className="text-xs text-gray-500 mt-1">
                Debe comenzar con un verbo en infinitivo (Gestionar, Crear, Actualizar, etc.)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Archivo *
              </label>
              <input 
                type="text" 
                value={formData.fileName}
                onChange={(e) => handleInputChange('fileName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Ej: AB123GestionarUsuarios"
              />
              <div className="text-xs text-gray-500 mt-1">
                Formato: dos letras + 3 números + nombre del caso de uso
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10" 
                placeholder="Describa el alcance y objetivo del caso de uso..."
              />
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

  // Step 8: Additional Options (adjusted step number for non-entity types)
  const isAdditionalOptionsStep = formData.useCaseType === 'entity' ? currentStep === 8 : currentStep === 5;
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
  const isReviewStep = formData.useCaseType === 'entity' ? currentStep === 9 : currentStep === 6;
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
