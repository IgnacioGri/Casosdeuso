import { Brain, List, Info, Edit, Filter, Columns, Database, Settings, Globe, Clock, Sparkles, Cpu, Zap, Bot, X, Plus } from "lucide-react";
import { TestCaseStep } from './steps/test-case-step';
import { MinuteAnalysisStep } from './steps/minute-analysis-step';
import { WireframesStep } from './steps/wireframes-step';
import { UseCaseFormData, EntityField, AIModel, UseCaseType } from "@/types/use-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LiveValidation } from "@/components/live-validation";
import UseCaseTemplatePreview from "@/components/use-case-template-preview";

import { AIAssistButton } from "@/components/ai-assist-button";
import { AIGeneratedTag } from "@/components/ai-generated-tag";
import { SmartAutocomplete } from './smart-autocomplete';
import { ContextualTooltip, fieldTooltips } from './contextual-tooltip';
import { AnimatedField, AddFieldButton, SmoothButton } from './micro-interactions';
import { BulletTextarea } from '@/components/bullet-textarea';

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
                <SelectTrigger className="w-full h-auto min-h-[3.5rem] px-4 py-3 border-2 border-gray-200 hover:border-ms-blue focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20 rounded-lg bg-white dark:bg-gray-800 transition-colors overflow-visible">
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
                  <SelectItem value="entity" className="h-auto min-h-[3.5rem] px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Database className="mr-3 text-blue-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">Entidad</div>
                        <div className="text-xs text-gray-500">CRUD de datos • Wireframes • Filtros y columnas</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="api" className="h-auto min-h-[3.5rem] px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer">
                    <div className="flex items-center w-full">
                      <Globe className="mr-3 text-green-500" size={20} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">API/Web Service</div>
                        <div className="text-xs text-gray-500">Endpoints • Request/Response • Documentación técnica</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="service" className="h-auto min-h-[3.5rem] px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
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
          </div>
          
          <div className="wide-form-section">
            <div className="wide-layout-grid">
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Cliente *
                </label>
                <ContextualTooltip
                  content={fieldTooltips.clientName.content}
                  example={fieldTooltips.clientName.example}
                  format={fieldTooltips.clientName.format}
                  className="ml-0.5"
                />
              </div>
              <Input
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="Ej: Banco Nacional de Argentina"
              />
              <LiveValidation value={formData.clientName} type="required" label="Nombre del Cliente" />
            </div>
            
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Proyecto *
                </label>
                <ContextualTooltip
                  content={fieldTooltips.projectName.content}
                  example={fieldTooltips.projectName.example}
                  format={fieldTooltips.projectName.format}
                  className="ml-0.5"
                />
              </div>
              <Input
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Ej: Sistema de Gestión de Usuarios"
              />
              <LiveValidation value={formData.projectName} type="required" label="Nombre del Proyecto" />
            </div>
            
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código del Caso de Uso *
                </label>
                <ContextualTooltip
                  content={fieldTooltips.useCaseCode.content}
                  example={fieldTooltips.useCaseCode.example}
                  format={fieldTooltips.useCaseCode.format}
                  className="ml-0.5"
                />
              </div>
              <Input
                value={formData.useCaseCode}
                onChange={(e) => handleInputChange('useCaseCode', e.target.value)}
                placeholder="Ej: UC001"
              />
              <LiveValidation value={formData.useCaseCode} type="required" label="Código del Caso de Uso" />
            </div>
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
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Caso de Uso *
                </label>
                <ContextualTooltip
                  content={fieldTooltips.useCaseName.content}
                  example={fieldTooltips.useCaseName.example}
                  format={fieldTooltips.useCaseName.format}
                  className="ml-0.5"
                />
              </div>
              <Input
                value={formData.useCaseName}
                onChange={(e) => handleInputChange('useCaseName', e.target.value)}
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
            
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white" 
                placeholder="Describa el alcance y objetivo del caso de uso..."
              />
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
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Describe los filtros de búsqueda (opcional)
                </label>
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
              <textarea
                value={formData.filtersDescription || ''}
                onChange={(e) => handleInputChange('filtersDescription', e.target.value)}
                placeholder="Ej: Los usuarios podrán filtrar por peso, altura y religión"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en filtros estructurados
              </p>
            </div>

            {/* Lista manual de filtros */}
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Filtros disponibles para la búsqueda
                </label>
                <ContextualTooltip
                  content="Filtros que permiten a los usuarios buscar registros específicos"
                  example="Nombre, DNI, Estado, Fecha"
                  format="Un filtro por línea"
                  className="ml-0.5"
                />
              </div>
              
              <div className="space-y-2">
              {formData.searchFilters.map((filter, index) => (
                <AnimatedField key={index} index={index} onRemove={() => onRemoveSearchFilter(index)}>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={filter}
                      onChange={(e) => onUpdateSearchFilter(index, e.target.value)}
                      placeholder="Nombre del filtro (ej: Nombre)"
                      className="flex-1"
                    />
                  </div>
                </AnimatedField>
              ))}
              </div>
              
              <div className="mt-3">
                <AddFieldButton
                  onClick={onAddSearchFilter}
                  label="Agregar filtro"
                />
              </div>
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
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Describe las columnas de resultado (opcional)
                </label>
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
              <textarea
                value={formData.columnsDescription || ''}
                onChange={(e) => handleInputChange('columnsDescription', e.target.value)}
                placeholder="Ej: La tabla de resultados debe mostrar ID, nombre completo, email y estado"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en columnas estructuradas
              </p>
            </div>

            {/* Lista manual de columnas */}
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Columnas que se mostrarán en los resultados de búsqueda
                </label>
                <ContextualTooltip
                  content="Columnas que aparecerán en la grilla de resultados"
                  example="ID, Nombre, Estado, Fecha Alta"
                  format="Una columna por línea"
                  className="ml-0.5"
                />
              </div>
              
              <div className="space-y-2">
                {formData.resultColumns.map((column, index) => (
                  <AnimatedField key={index} index={index} onRemove={() => onRemoveResultColumn(index)}>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={column}
                        onChange={(e) => onUpdateResultColumn(index, e.target.value)}
                        placeholder="Nombre de la columna (ej: ID)"
                        className="flex-1"
                      />
                    </div>
                  </AnimatedField>
                ))}
              </div>
              
              <div className="mt-3">
                <AddFieldButton
                  onClick={onAddResultColumn}
                  label="Agregar columna"
                />
              </div>
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
          </div>
          
          <div className="space-y-6">
            {/* Campo superior para texto libre */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Describe los campos de la entidad (opcional)
                </label>
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
              <textarea
                value={formData.fieldsDescription || ''}
                onChange={(e) => handleInputChange('fieldsDescription', e.target.value)}
                placeholder="Ej: La entidad Cliente debe tener: nombre completo (texto, obligatorio, máximo 100 caracteres), email (email, obligatorio), teléfono (texto, opcional, 15 caracteres), fecha de nacimiento (fecha, opcional), estado (booleano, obligatorio, por defecto activo)..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 dark:bg-gray-800 dark:text-white resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa el botón AI para convertir automáticamente tu descripción en campos estructurados con tipos y validaciones
              </p>
            </div>

            {/* Tabla de campos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campos de la entidad
              </label>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Longitud</th>
                      <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">Obligatorio</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Descripción</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Validaciones</th>
                      <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700" style={{width: '80px'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entityFields.map((field, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-300 px-2 py-1">
                          <SmartAutocomplete
                            value={field.name}
                            onChange={(value) => onUpdateEntityField(index, { name: value })}
                            placeholder="Nombre del campo"
                            suggestions={[
                              'id', 'codigo', 'nombre', 'apellido', 'descripcion', 
                              'email', 'telefono', 'direccion', 'dni', 'cuit', 
                              'estado', 'fechaAlta', 'fechaBaja', 'usuarioAlta', 
                              'usuarioBaja', 'activo', 'tipo', 'monto', 'saldo',
                              'fechaNacimiento', 'categoria', 'prioridad'
                            ]}
                            useCaseType={formData.useCaseType}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <select 
                            value={field.type}
                            onChange={(e) => onUpdateEntityField(index, { type: e.target.value as EntityField['type'] })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-ms-blue rounded"
                          >
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="decimal">Decimal</option>
                            <option value="date">Fecha</option>
                            <option value="datetime">Fecha y Hora</option>
                            <option value="boolean">Booleano</option>
                            <option value="email">Email</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input 
                            type="number" 
                            value={field.length || ''}
                            onChange={(e) => onUpdateEntityField(index, { length: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-ms-blue rounded" 
                            placeholder="Long."
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input 
                            type="checkbox" 
                            checked={field.mandatory}
                            onChange={(e) => onUpdateEntityField(index, { mandatory: e.target.checked })}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input 
                            type="text" 
                            value={field.description || ''}
                            onChange={(e) => onUpdateEntityField(index, { description: e.target.value })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-ms-blue rounded" 
                            placeholder="Descripción del campo"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input 
                            type="text" 
                            value={field.validationRules || ''}
                            onChange={(e) => onUpdateEntityField(index, { validationRules: e.target.value })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-ms-blue rounded" 
                            placeholder="Validaciones"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <Button 
                            type="button" 
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveEntityField(index)}
                            className="text-red-500 hover:text-red-700 p-1 h-auto"
                          >
                            <X size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <AddFieldButton
                  onClick={onAddEntityField}
                  label="Agregar campo"
                />
              </div>
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

  // Step 8: Wireframes (Entity only)
  if (currentStep === 8 && formData.useCaseType === 'entity') {
    return (
      <WireframesStep
        formData={formData}
        onUpdateFormData={onUpdateFormData}
      />
    );
  }

  // Step 9: Additional Options (adjusted step number for non-entity types)
  const isAdditionalOptionsStep = formData.useCaseType === 'entity' ? currentStep === 9 : currentStep === 6;
  if (isAdditionalOptionsStep) {
    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="mr-2 text-ms-blue" size={20} />
              Opciones Adicionales
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Una vez completado el caso de uso, podrás elegir si agregar casos de prueba en el siguiente paso.
              </p>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reglas de negocio adicionales
              </label>
              <BulletTextarea
                value={formData.businessRules || ''}
                onChange={(value) => handleInputChange('businessRules', value)}
                rows={5}
                placeholder="Describe las reglas de negocio con bullet points. Ej:
• Los clientes no se pueden eliminar si tienen productos activos
• El DNI debe ser único en el sistema
• Solo supervisores pueden autorizar operaciones especiales..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requerimientos especiales
              </label>
              <BulletTextarea
                value={formData.specialRequirements || ''}
                onChange={(value) => handleInputChange('specialRequirements', value)}
                rows={5}
                placeholder="Describe los requerimientos especiales con bullet points. Ej:
• Debe integrarse con servicio externo de validación
• Tiempos de respuesta menores a 3 segundos
• Validaciones de seguridad HTTPS obligatorias
• Auditoría completa de todas las operaciones..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Test Cases Step (if enabled)
  const testCaseStepNumber = () => {
    if (formData.useCaseType === 'entity') {
      return formData.generateTestCase ? 10 : null;
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
            formData={formData}
            onReplaceAllTestData={(data) => {
              onUpdateFormData({
                testCaseObjective: data.objective,
                testCasePreconditions: data.preconditions,
                testSteps: data.testSteps
              });
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Step 10/7: Pre-Final Step with Test Case Decision
  const getPreFinalStepNumber = () => {
    return formData.useCaseType === 'entity' ? 10 : 7;
  };

  const isPreFinalStep = currentStep === getPreFinalStepNumber() && !formData.generateTestCase;
  if (isPreFinalStep) {
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
              Decisión sobre Casos de Prueba
            </h3>
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">¿Deseas incluir casos de prueba?</h4>
              <p className="text-sm text-blue-700 mb-4">
                Los casos de prueba te permiten validar el funcionamiento del caso de uso con objetivos, precondiciones y pasos estructurados según estándares ING.
              </p>
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    handleInputChange('generateTestCase', true);
                    if (onNextStep) onNextStep();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Sí, agregar casos de prueba
                </Button>
                
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Final Review Step (after test cases or after decision)
  const getFinalReviewStepNumber = () => {
    const baseStep = formData.useCaseType === 'entity' ? 10 : 7;
    return formData.generateTestCase ? baseStep + 1 : baseStep;
  };

  const isFinalReviewStep = currentStep === getFinalReviewStepNumber() && 
    (formData.generateTestCase || currentStep > getPreFinalStepNumber());
  
  if (isFinalReviewStep) {
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
      
      if (formData.generateTestCase) {
        summary.push(`Casos de prueba: ${formData.testSteps?.length || 0} pasos configurados`);
      }
      
      return summary;
    };

    return (
      <Card className="shadow-sm border border-ms-border">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="mr-2 text-ms-blue" size={20} />
              Revisión Final y Generación
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Resumen completo de la configuración:</h4>
              <div className="space-y-2 text-sm">
                {getSummaryData().map((item, index) => (
                  <div key={index} className="text-gray-700">{item}</div>
                ))}
              </div>
            </div>
            
            {formData.generateTestCase && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Casos de prueba incluidos</h4>
                <p className="text-sm text-green-700">
                  Los casos de prueba se agregarán automáticamente al documento final con el formato profesional ING.
                </p>
              </div>
            )}
            
            
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
