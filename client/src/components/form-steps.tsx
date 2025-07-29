import { Brain, List, Info, Edit, Filter, Columns, Database, Settings, Globe, Clock, Sparkles, Cpu, Zap, Bot } from "lucide-react";
import { TestCaseStep } from './steps/test-case-step';
import { MinuteAnalysisStep } from './steps/minute-analysis-step';
import { UseCaseFormData, EntityField, AIModel, UseCaseType } from "@/types/use-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveValidation } from "@/components/live-validation";
import UseCaseTemplatePreview from "@/components/use-case-template-preview";

import { AIAssistButton } from "@/components/ai-assist-button";
import { HelpButton } from "@/components/help-button";
import { AIGeneratedTag } from "@/components/ai-generated-tag";

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
  onAddTestStep?: () => void;
  onRemoveTestStep?: (index: number) => void;
  onUpdateTestStep?: (index: number, field: any, value: string | number) => void;
  onLoadDemoData: () => void;
  onLoadComplexExample?: (type: UseCaseType) => void;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
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
  onAddTestStep,
  onRemoveTestStep,
  onUpdateTestStep,
  onLoadDemoData,
  onLoadComplexExample,
  onNextStep,
  onPreviousStep
}: FormStepsProps) {

  const handleInputChange = (field: keyof UseCaseFormData, value: any) => {
    onUpdateFormData({ [field]: value });
  };

  // Step 1: Use Case Type Selection
  if (currentStep === 1) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <List className="mx-auto text-ms-blue mb-3" size={32} />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Tipo de Caso de Uso
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Selecciona el tipo de caso de uso que vas a crear para ayudar a la IA a generar contenido específico
                </p>
              </div>
              <div className="ml-4">
                <HelpButton step={1} useCaseType={formData.useCaseType} />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tipo de caso de uso
              </label>
              <Select 
                value={formData.useCaseType} 
                onValueChange={(value) => handleInputChange('useCaseType', value as UseCaseType)}
              >
                <SelectTrigger className="w-full h-14 px-4 border-2 border-gray-200 hover:border-ms-blue focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20 rounded-lg bg-white dark:bg-gray-800 transition-colors">
                  <SelectValue className="flex items-center">
                    {formData.useCaseType === 'entity' && (
                      <div className="flex items-center">
                        <Database className="mr-3 text-blue-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Entidad</div>
                          <div className="text-xs text-gray-500">CRUD de datos, wireframes, filtros</div>
                        </div>
                      </div>
                    )}
                    {formData.useCaseType === 'api' && (
                      <div className="flex items-center">
                        <Globe className="mr-3 text-green-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">API/Web Service</div>
                          <div className="text-xs text-gray-500">Endpoints, request/response</div>
                        </div>
                      </div>
                    )}
                    {formData.useCaseType === 'service' && (
                      <div className="flex items-center">
                        <Clock className="mr-3 text-purple-500" size={20} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">Servicio/Proceso</div>
                          <div className="text-xs text-gray-500">Procesos automáticos, timing</div>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                  <SelectItem value="entity" className="h-14 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Database className="mr-3 text-blue-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Entidad</div>
                        <div className="text-xs text-gray-500">CRUD de datos • Wireframes • Filtros y columnas</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="api" className="h-14 px-4 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Globe className="mr-3 text-green-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">API/Web Service</div>
                        <div className="text-xs text-gray-500">Endpoints • Request/Response • Documentación técnica</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="service" className="h-14 px-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Clock className="mr-3 text-purple-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Servicio/Proceso</div>
                        <div className="text-xs text-gray-500">Procesos automáticos • Configuración • Timing</div>
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
                    ¿Por qué seleccionar el tipo?
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    El tipo de caso de uso determina qué campos aparecerán en el formulario y cómo la IA analizará las minutas en el siguiente paso. Cada tipo tiene un enfoque específico según los estándares ING.
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    💡 Consejo: <strong>Entidad</strong> es el más completo con wireframes, <strong>API</strong> para servicios web, <strong>Servicio</strong> para procesos automáticos.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Minute Analysis 
  if (currentStep === 2) {
    return (
      <MinuteAnalysisStep
        formData={formData}
        onFormChange={onUpdateFormData}
        onNext={onNextStep || (() => {})}
        onPrevious={onPreviousStep || (() => {})}
      />
    );
  }

  // Step 3: Basic Information (previously Step 2)  
  if (currentStep === 3) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Info className="mr-2 text-ms-blue" size={20} />
              Información Básica
            </h3>
            <HelpButton step={3} useCaseType={formData.useCaseType} />
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

  // Step 4: Use Case Details (previously Step 3)
  if (currentStep === 4) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Edit className="mr-2 text-ms-blue" size={20} />
              Detalles del Caso de Uso
            </h3>
            <HelpButton step={4} useCaseType={formData.useCaseType} />
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="mr-2 text-ms-blue" size={20} />
              Filtros de Búsqueda
            </h3>
            <HelpButton step={5} useCaseType={formData.useCaseType} />
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe los filtros de búsqueda (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={formData.filtersDescription || ''}
                  onChange={(e) => handleInputChange('filtersDescription', e.target.value)}
                  placeholder="Ej: Los usuarios podrán filtrar por peso, altura y religión"
                  rows={4}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="searchFiltersDescription"
                    fieldValue={formData.filtersDescription || ''}
                    fieldType="filtersFromText"
                    context={{ step: 5, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar el texto y crear filtros automáticamente
                      const filters = value.split('\n').filter(f => f.trim()).map(f => f.trim());
                      
                      // Limpiar filtros existentes vacíos
                      const cleanedFilters = formData.searchFilters.filter(f => f.trim() !== '');
                      
                      // Crear la nueva lista de filtros
                      const allFilters = [...cleanedFilters, ...filters];
                      
                      // Actualizar el estado con todos los filtros de una vez
                      onUpdateFormData({ 
                        searchFilters: allFilters,
                        filtersDescription: value 
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Columns className="mr-2 text-ms-blue" size={20} />
              Columnas de Resultado
            </h3>
            <HelpButton step={6} useCaseType={formData.useCaseType} />
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe las columnas de resultado (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={formData.columnsDescription || ''}
                  onChange={(e) => handleInputChange('columnsDescription', e.target.value)}
                  placeholder="Ej: La tabla de resultados debe mostrar ID, nombre completo, email y estado"
                  rows={4}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="resultColumnsDescription"
                    fieldValue={formData.columnsDescription || ''}
                    fieldType="columnsFromText"
                    context={{ step: 6, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar el texto y crear columnas automáticamente
                      const columns = value.split('\n').filter(c => c.trim()).map(c => c.trim());
                      
                      // Limpiar columnas existentes vacías
                      const cleanedColumns = formData.resultColumns.filter(c => c.trim() !== '');
                      
                      // Crear la nueva lista de columnas
                      const allColumns = [...cleanedColumns, ...columns];
                      
                      // Actualizar el estado con todas las columnas de una vez
                      onUpdateFormData({ 
                        resultColumns: allColumns,
                        columnsDescription: value 
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="mr-2 text-ms-blue" size={20} />
              Datos de la Entidad
            </h3>
            <HelpButton step={7} useCaseType={formData.useCaseType} />
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe los campos de la entidad (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={formData.fieldsDescription || ''}
                  onChange={(e) => handleInputChange('fieldsDescription', e.target.value)}
                  placeholder="Ej: La entidad Cliente debe tener: nombre completo (texto, obligatorio, máximo 100 caracteres), email (email, obligatorio), teléfono (texto, opcional, 15 caracteres), fecha de nacimiento (fecha, opcional), estado (booleano, obligatorio, por defecto activo)..."
                  rows={6}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="entityFieldsDescription"
                    fieldValue={formData.fieldsDescription || ''}
                    fieldType="fieldsFromText"
                    context={{ step: 7, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => {
                      // Procesar JSON y crear campos de entidad automáticamente
                      try {
                        const fields = JSON.parse(value);
                        if (Array.isArray(fields)) {
                          // Limpiar campos existentes vacíos
                          const cleanedFields = formData.entityFields.filter(f => f.name.trim() !== '');
                          
                          // Crear la nueva lista de campos
                          const allFields = [...cleanedFields];
                          
                          // Crear texto estructurado para el feedback visual
                          const structuredText = fields.map(field => {
                            const typeText = field.type === 'text' ? 'texto' : 
                                           field.type === 'email' ? 'email' : 
                                           field.type === 'number' ? 'número' : 
                                           field.type === 'date' ? 'fecha' : 
                                           field.type === 'boolean' ? 'booleano' : field.type;
                            
                            const mandatoryText = field.mandatory ? 'obligatorio' : 'opcional';
                            const lengthText = field.length ? `, máximo ${field.length} caracteres` : '';
                            
                            return `• ${field.name} (${typeText}, ${mandatoryText}${lengthText})`;
                          }).join('\n');
                          
                          fields.forEach(field => {
                            allFields.push({
                              name: field.name || '',
                              type: field.type || 'text',
                              mandatory: field.mandatory ?? false,
                              length: field.length
                            });
                          });
                          
                          // Actualizar tanto el texto estructurado como los campos
                          onUpdateFormData({ 
                            entityFields: allFields,
                            fieldsDescription: structuredText
                          });
                        }
                      } catch (error) {
                        console.error('Error parsing entity fields JSON:', error);
                        // Fallback: treat as text lines
                        const fieldNames = value.split('\n').filter(f => f.trim()).map(f => f.trim());
                        const cleanedFields = formData.entityFields.filter(f => f.name.trim() !== '');
                        const allFields = [...cleanedFields];
                        
                        const structuredText = fieldNames.map(name => `• ${name} (texto, opcional)`).join('\n');
                        
                        fieldNames.forEach(fieldName => {
                          allFields.push({
                            name: fieldName,
                            type: 'text',
                            mandatory: false,
                            length: undefined
                          });
                        });
                        
                        onUpdateFormData({ 
                          entityFields: allFields,
                          fieldsDescription: structuredText
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="mr-2 text-ms-blue" size={20} />
              Opciones Adicionales
            </h3>
            <HelpButton step={8} useCaseType={formData.useCaseType} />
          </div>
          
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
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={formData.generateTestCase}
                  onChange={(e) => handleInputChange('generateTestCase', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generar casos de prueba
                </span>
              </label>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                Incluye casos de prueba según minuta ING con objetivo, precondiciones y pasos estructurados
              </div>
            </div>

            {formData.generateWireframes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripciones de Wireframes
                </label>
                <div className="relative mb-4">
                  <textarea 
                    value={formData.wireframesDescription || ''}
                    onChange={(e) => handleInputChange('wireframesDescription', e.target.value)}
                    rows={4} 
                    className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y" 
                    placeholder="Describe todas las pantallas del sistema en lenguaje natural. Ej: Una pantalla de búsqueda con filtros, una de listado con tabla paginada, una de detalle para ver/editar registros..."
                  />
                  <div className="absolute top-2 right-2">
                    <AIAssistButton
                      fieldName="wireframesDescription"
                      fieldValue={formData.wireframesDescription || ''}
                      fieldType="wireframesDescription"
                      context={{ step: 8, useCaseType: formData.useCaseType }}
                      onImprovement={(value) => handleInputChange('wireframesDescription', value)}
                      size="sm"
                      aiModel={formData.aiModel}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {(formData.wireframeDescriptions || ['']).map((description, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative">
                        <textarea
                          value={description}
                          onChange={(e) => onUpdateWireframeDescription(index, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y"
                          placeholder={`Wireframe ${index + 1}: Describe la pantalla en lenguaje natural. Ej: Una pantalla de búsqueda donde el usuario puede filtrar por nombre, ver resultados en tabla y editar registros...`}
                        />

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
              <div className="relative mb-4">
                <textarea 
                  value={formData.alternativeFlowsDescription || ''}
                  onChange={(e) => handleInputChange('alternativeFlowsDescription', e.target.value)}
                  rows={4} 
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y" 
                  placeholder="Describe los posibles errores y excepciones del sistema. Ej: Cuando no se encuentra un registro, cuando fallan validaciones, cuando hay problemas de conectividad..."
                />
                <div className="absolute top-2 right-2">
                  <AIAssistButton
                    fieldName="alternativeFlowsDescription"
                    fieldValue={formData.alternativeFlowsDescription || ''}
                    fieldType="alternativeFlowsDescription"
                    context={{ step: 8, useCaseType: formData.useCaseType }}
                    onImprovement={(value) => handleInputChange('alternativeFlowsDescription', value)}
                    size="sm"
                    aiModel={formData.aiModel}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {(formData.alternativeFlows || ['']).map((flow, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={flow}
                        onChange={(e) => onUpdateAlternativeFlow(index, e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y"
                        placeholder={`Flujo alternativo ${index + 1}: Describe el escenario de error en lenguaje natural. Ej: Cuando el usuario busca un cliente que no existe, que pasa y como se maneja...`}
                      />

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
                    fieldValue={formData.businessRules || ''}
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
                    fieldValue={formData.specialRequirements || ''}
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

  // Test Cases Step (if enabled)
  const testCaseStepNumber = () => {
    if (formData.useCaseType === 'entity') {
      return formData.generateTestCase ? 9 : null;
    } else {
      return formData.generateTestCase ? 7 : null;
    }
  };

  if (currentStep === testCaseStepNumber() && formData.generateTestCase && onAddTestStep && onRemoveTestStep && onUpdateTestStep) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <TestCaseStep
            testCaseObjective={formData.testCaseObjective || ''}
            testCasePreconditions={formData.testCasePreconditions || ''}
            testSteps={formData.testSteps || []}
            onUpdateObjective={(value) => handleInputChange('testCaseObjective', value)}
            onUpdatePreconditions={(value) => handleInputChange('testCasePreconditions', value)}
            onAddTestStep={onAddTestStep}
            onRemoveTestStep={onRemoveTestStep}
            onUpdateTestStep={onUpdateTestStep}
            clientName={formData.clientName}
            projectName={formData.projectName}
            useCaseName={formData.useCaseName}
            aiModel={formData.aiModel}
          />
        </CardContent>
      </Card>
    );
  }

  // Step 9/10: Review and Generation (adjusted step number based on options)
  const getReviewStepNumber = () => {
    const baseStep = formData.useCaseType === 'entity' ? 9 : 7;
    return formData.generateTestCase ? baseStep + 1 : baseStep;
  };

  const isReviewStep = currentStep === getReviewStepNumber();
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="mr-2 text-ms-blue" size={20} />
              Revisión y Generación
            </h3>
            <HelpButton step={9} useCaseType={formData.useCaseType} />
          </div>
          
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
