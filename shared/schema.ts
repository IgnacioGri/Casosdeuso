import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const useCases = pgTable("use_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  projectName: text("project_name").notNull(),
  useCaseCode: text("use_case_code").notNull(),
  useCaseName: text("use_case_name").notNull(),
  fileName: text("file_name").notNull(),
  useCaseType: text("use_case_type").notNull(), // 'entity', 'api', 'service'
  description: text("description").notNull(),
  searchFilters: jsonb("search_filters").default('[]'),
  resultColumns: jsonb("result_columns").default('[]'),
  entityFields: jsonb("entity_fields").default('[]'),
  businessRules: text("business_rules"),
  specialRequirements: text("special_requirements"),
  generateWireframes: boolean("generate_wireframes").default(false),
  wireframeDescriptions: jsonb("wireframe_descriptions").default('[]'),
  wireframesDescription: text("wireframes_description"),
  alternativeFlows: jsonb("alternative_flows").default('[]'),
  alternativeFlowsDescription: text("alternative_flows_description"),
  generatedContent: text("generated_content"),
  aiModel: text("ai_model").notNull(),
  // Minute analysis fields
  uploadedMinute: text("uploaded_minute"),
  aiGeneratedFields: jsonb("ai_generated_fields").default('{}'), // Track which fields were AI-generated
  // Test case fields
  generateTestCase: boolean("generate_test_case").default(false),
  testCaseObjective: text("test_case_objective"),
  testCasePreconditions: text("test_case_preconditions"),
  testSteps: jsonb("test_steps").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUseCaseSchema = createInsertSchema(useCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UseCase = typeof useCases.$inferSelect;

// Form data schemas
export const entityFieldSchema = z.object({
  name: z.string(), // Permitir nombres vacíos, la validación se hace a nivel de formulario
  type: z.enum(['text', 'number', 'date', 'boolean', 'email']),
  length: z.number().optional(),
  mandatory: z.boolean().default(false),
  description: z.string().default(''), // Documentar propósito del campo
  validationRules: z.string().default(''), // Reglas de validación específicas
});

export const testStepSchema = z.object({
  number: z.number(),
  action: z.string(),
  inputData: z.string(),
  expectedResult: z.string(),
  observations: z.string(),
  status: z.enum(['P', 'F', '', 'pending']).default(''),
});

// Base schema para validación común
const baseUseCaseFormSchema = z.object({
  useCaseType: z.enum(['entity', 'api', 'service']),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  projectName: z.string().min(1, "El nombre del proyecto es requerido"),
  useCaseCode: z.string().min(1, "El código del caso de uso es requerido"),
  useCaseName: z.string().min(1, "El nombre del caso de uso es requerido").refine(
    (val) => {
      const infinitiveVerbs = ['gestionar', 'crear', 'actualizar', 'eliminar', 'consultar', 'registrar', 'modificar', 'validar', 'procesar', 'generar', 'obtener', 'establecer', 'configurar', 'sincronizar', 'enviar', 'recibir', 'ver', 'mostrar', 'listar', 'buscar', 'filtrar', 'exportar', 'importar', 'calcular', 'analizar', 'reportar'];
      return infinitiveVerbs.some(verb => val.toLowerCase().startsWith(verb));
    },
    "Debe comenzar con un verbo en infinitivo (Gestionar, Crear, Ver, Mostrar, etc.)"
  ),
  fileName: z.string().min(1, "El nombre del archivo es requerido").refine(
    (val) => {
      // Formato: 2 letras + 3 números + nombre del caso de uso
      const pattern = /^[A-Z]{2}\d{3}.+$/;
      return pattern.test(val);
    },
    "Formato requerido: 2 letras + 3 números + nombre del caso de uso (ej: AB123GestionarUsuarios)"
  ),
  description: z.string().min(1, "La descripción es requerida"),
  filtersDescription: z.string().optional(),
  columnsDescription: z.string().optional(),
  fieldsDescription: z.string().optional(),
  searchFilters: z.array(z.string()).default([]),
  resultColumns: z.array(z.string()).default([]),
  entityFields: z.array(entityFieldSchema).default([]),
  businessRules: z.string().optional(),
  specialRequirements: z.string().optional(),
  generateWireframes: z.boolean().default(false),
  wireframeDescriptions: z.array(z.string()).default([]),
  wireframesDescription: z.string().optional(),
  alternativeFlows: z.array(z.string()).default([]),
  alternativeFlowsDescription: z.string().optional(),
  // Campos específicos para diferentes tipos de casos de uso
  apiEndpoint: z.string().optional(),
  requestFormat: z.string().optional(),
  responseFormat: z.string().optional(),
  serviceFrequency: z.string().optional(),
  executionTime: z.string().optional(),
  configurationPaths: z.string().optional(),
  webServiceCredentials: z.string().optional(),
  // Test case fields
  generateTestCase: z.boolean().default(false),
  testCaseObjective: z.string().optional(),
  testCasePreconditions: z.string().optional(),
  testSteps: z.array(testStepSchema).default([]),
  
  // AI-generated content tracking
  isAIGenerated: z.boolean().default(false),
  aiModel: z.enum(['demo', 'openai', 'claude', 'grok', 'gemini', 'copilot']),
});

// Schema con validación condicional según el tipo de caso de uso
export const useCaseFormSchema = baseUseCaseFormSchema.refine(
  (data) => {
    // Para casos de uso tipo 'entity', al menos un campo de entidad debe tener nombre
    if (data.useCaseType === 'entity') {
      return data.entityFields.some(field => field.name.trim().length > 0);
    }
    // Para API y service, no se requieren campos de entidad
    return true;
  },
  {
    message: "Para casos de uso de entidad, debe especificar al menos un campo con nombre",
    path: ["entityFields"]
  }
);

export type UseCaseFormData = z.infer<typeof useCaseFormSchema>;
export type EntityField = z.infer<typeof entityFieldSchema>;
export type TestStep = z.infer<typeof testStepSchema>;
