export type UseCaseType = 'entity' | 'api' | 'service' | 'reports';

export type AIModel = 'demo' | 'openai' | 'claude' | 'grok' | 'gemini' | 'copilot';



export interface EntityField {
  name: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'email' | 'decimal';
  length?: number;
  mandatory: boolean;
  description?: string; // Documentar propósito del campo
  validationRules?: string; // Reglas de validación específicas
}

export interface TestStep {
  number: number;
  action: string;
  inputData: string;
  expectedResult: string;
  observations: string;
  status: 'P' | 'F' | '' | 'pending'; // Pass/Fail/Empty/Not executed
}

export interface UseCaseFormData {
  useCaseType: UseCaseType;
  // Minute analysis fields
  uploadedMinute?: string;
  minuteFile?: File;
  aiGeneratedFields?: Record<string, boolean>; // Track which fields were AI-generated
  clientName: string;
  projectName: string;
  useCaseCode: string;
  useCaseName: string;
  fileName: string;
  description: string;
  filtersDescription?: string;
  columnsDescription?: string;
  fieldsDescription?: string;
  searchFilters: string[];
  resultColumns: string[];
  entityFields: EntityField[];
  businessRules?: string;
  specialRequirements?: string;
  generateWireframes: boolean;
  wireframeDescriptions?: string[];
  wireframesDescription?: string;

  generatedWireframes?: {
    searchWireframe?: string;
    formWireframe?: string;
  };
  // Test case fields
  generateTestCase?: boolean;
  testCaseObjective?: string;
  testCasePreconditions?: string;
  testSteps?: TestStep[];
  testCaseSuggestions?: string;
  testCasesGeneratedWithAI?: boolean;
  aiModel: AIModel;
  // Campos específicos para tipos de casos de uso
  apiEndpoint?: string;
  requestFormat?: string;
  responseFormat?: string;
  serviceFrequency?: string;
  executionTime?: string;
  configurationPaths?: string;
  webServiceCredentials?: string;
  // Campos específicos para Reportes
  exportFormats?: string; // Excel, CSV, PDF
  exportLimit?: string; // Límite de registros a exportar
  groupingFields?: string; // Campos para agrupación
  aggregationFunctions?: string; // Funciones de agregación (suma, promedio, etc.)
  defaultSorting?: string; // Ordenamiento por defecto
  reportSchedule?: string; // Si es programado o no
  reportRecipients?: string; // Destinatarios del reporte
}

export interface UseCase {
  id: string;
  clientName: string;
  projectName: string;
  useCaseCode: string;
  useCaseName: string;
  fileName: string;
  useCaseType: UseCaseType;
  description: string;
  searchFilters: string[];
  resultColumns: string[];
  entityFields: EntityField[];
  businessRules?: string;
  specialRequirements?: string;
  generateWireframes: boolean;
  generatedContent?: string;
  aiModel: AIModel;
  createdAt: Date;
  updatedAt: Date;
}
