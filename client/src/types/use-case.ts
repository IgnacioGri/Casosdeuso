export type UseCaseType = 'entity' | 'api' | 'service';

export type AIModel = 'demo' | 'openai' | 'claude' | 'grok' | 'gemini';

export interface EntityField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email';
  length?: number;
  mandatory: boolean;
}

export interface UseCaseFormData {
  useCaseType: UseCaseType;
  clientName: string;
  projectName: string;
  useCaseCode: string;
  useCaseName: string;
  fileName: string;
  description: string;
  searchFilters: string[];
  resultColumns: string[];
  entityFields: EntityField[];
  businessRules?: string;
  specialRequirements?: string;
  generateWireframes: boolean;
  aiModel: AIModel;
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
