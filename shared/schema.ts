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
  generatedContent: text("generated_content"),
  aiModel: text("ai_model").notNull(),
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
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'boolean', 'email']),
  length: z.number().optional(),
  mandatory: z.boolean().default(false),
});

export const useCaseFormSchema = z.object({
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
  fileName: z.string().min(1, "El nombre del archivo es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  searchFilters: z.array(z.string()).default([]),
  resultColumns: z.array(z.string()).default([]),
  entityFields: z.array(entityFieldSchema).default([]),
  businessRules: z.string().optional(),
  specialRequirements: z.string().optional(),
  generateWireframes: z.boolean().default(false),
  aiModel: z.enum(['demo', 'openai', 'claude', 'grok', 'gemini']),
});

export type UseCaseFormData = z.infer<typeof useCaseFormSchema>;
export type EntityField = z.infer<typeof entityFieldSchema>;
