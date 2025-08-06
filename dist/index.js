// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  useCases;
  constructor() {
    this.useCases = /* @__PURE__ */ new Map();
  }
  async createUseCase(insertUseCase) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const useCase = {
      ...insertUseCase,
      id,
      searchFilters: insertUseCase.searchFilters || [],
      resultColumns: insertUseCase.resultColumns || [],
      entityFields: insertUseCase.entityFields || [],
      createdAt: now,
      updatedAt: now
    };
    this.useCases.set(id, useCase);
    return useCase;
  }
  async getUseCase(id) {
    return this.useCases.get(id);
  }
  async getUserUseCases() {
    return Array.from(this.useCases.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }
  async updateUseCase(id, updates) {
    const existing = this.useCases.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.useCases.set(id, updated);
    return updated;
  }
  async deleteUseCase(id) {
    return this.useCases.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var useCases = pgTable("use_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  projectName: text("project_name").notNull(),
  useCaseCode: text("use_case_code").notNull(),
  useCaseName: text("use_case_name").notNull(),
  fileName: text("file_name").notNull(),
  useCaseType: text("use_case_type").notNull(),
  // 'entity', 'api', 'service'
  description: text("description").notNull(),
  searchFilters: jsonb("search_filters").default("[]"),
  resultColumns: jsonb("result_columns").default("[]"),
  entityFields: jsonb("entity_fields").default("[]"),
  businessRules: text("business_rules"),
  specialRequirements: text("special_requirements"),
  generateWireframes: boolean("generate_wireframes").default(false),
  wireframeDescriptions: jsonb("wireframe_descriptions").default("[]"),
  wireframesDescription: text("wireframes_description"),
  generatedContent: text("generated_content"),
  aiModel: text("ai_model").notNull(),
  // Minute analysis fields
  uploadedMinute: text("uploaded_minute"),
  aiGeneratedFields: jsonb("ai_generated_fields").default("{}"),
  // Track which fields were AI-generated
  // Test case fields
  generateTestCase: boolean("generate_test_case").default(false),
  testCaseObjective: text("test_case_objective"),
  testCasePreconditions: text("test_case_preconditions"),
  testSteps: jsonb("test_steps").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUseCaseSchema = createInsertSchema(useCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var entityFieldSchema = z.object({
  name: z.string(),
  // Permitir nombres vacíos, la validación se hace a nivel de formulario
  type: z.enum(["text", "number", "decimal", "date", "datetime", "boolean", "email"]),
  length: z.number().nullable().optional(),
  mandatory: z.boolean().default(false),
  description: z.string().default(""),
  // Documentar propósito del campo
  validationRules: z.string().default("")
  // Reglas de validación específicas
});
var testStepSchema = z.object({
  number: z.number(),
  action: z.string(),
  inputData: z.string(),
  expectedResult: z.string(),
  observations: z.string(),
  status: z.enum(["P", "F", "", "pending"]).default("")
});
var baseUseCaseFormSchema = z.object({
  useCaseType: z.enum(["entity", "api", "service"]),
  // Solo campos básicos obligatorios - Información Básica y Detalles del Caso de Uso
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  projectName: z.string().min(1, "El nombre del proyecto es requerido"),
  useCaseCode: z.string().min(1, "El c\xF3digo del caso de uso es requerido"),
  useCaseName: z.string().min(1, "El nombre del caso de uso es requerido").refine(
    (val) => {
      const words = val.toLowerCase().split(" ");
      const firstWord = words[0];
      const infinitivePattern = /^[a-záéíóúñ]+(ar|er|ir)$/;
      const irregularVerbs = ["ver", "ser", "ir"];
      return infinitivePattern.test(firstWord) || irregularVerbs.includes(firstWord);
    },
    "Debe comenzar con un verbo en infinitivo (terminar en -ar, -er, -ir)"
  ),
  fileName: z.string().min(1, "El nombre del archivo es requerido").refine(
    (val) => {
      const pattern = /^[A-Z]{2}\d{3}.+$/;
      return pattern.test(val);
    },
    "Formato requerido: 2 letras + 3 n\xFAmeros + nombre del caso de uso (ej: AB123GestionarUsuarios)"
  ),
  description: z.string().min(1, "La descripci\xF3n es requerida"),
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
  aiModel: z.enum(["demo", "openai", "claude", "grok", "gemini", "copilot"])
});
var useCaseFormSchema = baseUseCaseFormSchema;

// server/services/ai-service.ts
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
var openai = null;
var anthropic = null;
var grokClient = null;
var gemini = null;
var copilotClient = null;
function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}
async function getAnthropicClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    const AnthropicSDK = (await import("@anthropic-ai/sdk")).default;
    anthropic = new AnthropicSDK({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return anthropic;
}
function getGrokClient() {
  if (!grokClient && process.env.XAI_API_KEY) {
    grokClient = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }
  return grokClient;
}
function getGeminiClient() {
  if (!gemini && process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return gemini;
}
function getCopilotClient() {
  if (!copilotClient && process.env.COPILOT_API_KEY) {
    copilotClient = new OpenAI({
      baseURL: "https://api.copilot.microsoft.com/v1",
      // URL hipotética para Microsoft Copilot
      apiKey: process.env.COPILOT_API_KEY
    });
  }
  return copilotClient;
}
var AIService = class _AIService {
  static async generateUseCase(request) {
    const { aiModel, formData, rules } = request;
    if (aiModel === "demo") {
      console.log("Generating demo content with pre-loaded data");
      return this.generateDemoContent(formData);
    }
    try {
      const wordCount = formData.description?.split(/\s+/).length || 0;
      let expandedDescription = null;
      if (wordCount < 50) {
        console.log(`Description is short (${wordCount} words), expanding it first...`);
        console.log(`Original description: "${formData.description}"`);
        expandedDescription = await this.expandDescription(formData, aiModel);
        if (expandedDescription) {
          formData.description = expandedDescription;
          console.log("Description expanded successfully");
          console.log(`Expanded description (first 200 chars): "${formData.description.substring(0, 200)}..."`);
        } else {
          console.log("Failed to expand description, keeping original");
        }
      }
      const prompt = this.buildPrompt(formData, rules);
      const aiModels = ["copilot", "gemini", "openai", "claude", "grok"];
      const modelOrder = [aiModel, ...aiModels.filter((m) => m !== aiModel)];
      const errors = [];
      let content = null;
      for (const model of modelOrder) {
        try {
          console.log(`Attempting to generate use case with AI model: ${model}`);
          switch (model) {
            case "openai":
              content = await this.generateWithOpenAI(prompt);
              break;
            case "claude":
              content = await this.generateWithClaude(prompt);
              break;
            case "grok":
              content = await this.generateWithGrok(prompt);
              break;
            case "gemini":
              content = await this.generateWithGemini(prompt);
              break;
            case "copilot":
              content = await this.generateWithCopilot(prompt);
              break;
            default:
              continue;
          }
          if (content) {
            console.log(`Successfully generated use case with ${model}`);
            break;
          }
        } catch (error) {
          console.error(`Failed to generate with ${model}:`, error.message || error);
          errors.push({
            model,
            error: error.message || "Unknown error"
          });
        }
      }
      if (!content) {
        const errorDetails = errors.map((e) => `${e.model}: ${e.error}`).join("\n");
        throw new Error(`No se pudo generar el caso de uso con ning\xFAn modelo de IA disponible. Por favor, configure al menos una clave API v\xE1lida.

Errores:
${errorDetails}`);
      }
      let cleanedContent = this.cleanAIResponse(content);
      console.log("\u{1F527} Calling ensureApiSections AFTER cleaning with:", {
        useCaseType: formData.useCaseType,
        contentLength: cleanedContent.length
      });
      cleanedContent = this.ensureApiSections(cleanedContent, formData.useCaseType);
      return {
        content: cleanedContent,
        success: true,
        expandedDescription: expandedDescription || formData.description
      };
    } catch (error) {
      console.error("Error generating use case:", error);
      return {
        content: "",
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      };
    }
  }
  static async expandDescription(formData, aiModel) {
    const expandPrompt = `Como experto en documentaci\xF3n bancaria/empresarial, expande la siguiente descripci\xF3n de caso de uso a exactamente 2 p\xE1rrafos profesionales:

Descripci\xF3n original: "${formData.description}"
Caso de uso: ${formData.useCaseName}
Cliente: ${formData.clientName}
Proyecto: ${formData.projectName}

INSTRUCCIONES OBLIGATORIAS:
1. Primer p\xE1rrafo (75+ palabras): Explicar QU\xC9 hace el caso de uso, su prop\xF3sito principal, qu\xE9 procesos abarca, qu\xE9 \xE1rea del negocio atiende, c\xF3mo se integra en el sistema.
2. Segundo p\xE1rrafo (75+ palabras): Detallar los BENEFICIOS clave para el negocio, valor agregado, mejoras operativas, problemas que resuelve, impacto en eficiencia.

IMPORTANTE: Genera SOLO los 2 p\xE1rrafos de texto sin t\xEDtulos, HTML o formato adicional. Usa contexto profesional relevante del sector ${formData.clientName?.includes("Banco") ? "bancario" : "empresarial"}.`;
    try {
      const aiModels = ["copilot", "gemini", "openai", "claude", "grok"];
      const modelOrder = [aiModel, ...aiModels.filter((m) => m !== aiModel)];
      for (const model of modelOrder) {
        try {
          let expandedText = null;
          switch (model) {
            case "openai":
              expandedText = await this.generateWithOpenAI(expandPrompt);
              break;
            case "claude":
              expandedText = await this.generateWithClaude(expandPrompt);
              break;
            case "grok":
              expandedText = await this.generateWithGrok(expandPrompt);
              break;
            case "gemini":
              expandedText = await this.generateWithGemini(expandPrompt);
              break;
            case "copilot":
              expandedText = await this.generateWithCopilot(expandPrompt);
              break;
          }
          if (expandedText) {
            return expandedText.replace(/<[^>]*>/g, "").trim();
          }
        } catch (error) {
          console.error(`Failed to expand description with ${model}:`, error);
        }
      }
    } catch (error) {
      console.error("Error expanding description:", error);
    }
    return null;
  }
  static buildPrompt(formData, rules) {
    console.log(`Building prompt with description: "${formData.description?.substring(0, 100)}..."`);
    console.log(`Description length: ${formData.description?.length} characters`);
    return `Eres un experto en documentaci\xF3n de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que ser\xE1 convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripci\xF3n, Actores, Precondiciones, Flujo B\xE1sico, Flujos Alternativos, Postcondiciones, etc.

\u26A0\uFE0F INSTRUCCI\xD3N CR\xCDTICA Y OBLIGATORIA PARA DESCRIPCI\xD3N \u26A0\uFE0F
La secci\xF3n de DESCRIPCI\xD3N debe contener EXACTAMENTE el texto proporcionado en formData.description.
NO modifiques, resumas o cambies la descripci\xF3n proporcionada.
USA LITERALMENTE el contenido de formData.description tal como viene.

IMPORTANTE: La descripci\xF3n ya viene procesada y expandida cuando es necesario.
- Si es larga (2 p\xE1rrafos), \xFAsala completa tal cual
- Si es corta, \xFAsala tal cual (el sistema ya la proces\xF3)
- NUNCA la modifiques o reescribas

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la informaci\xF3n en secciones claras con t\xEDtulos y subt\xEDtulos
2. Para flujos, usa numeraci\xF3n jer\xE1rquica profesional con indentaci\xF3n:
   1. Flujo B\xE1sico
     a. Men\xFA principal
       i. Ingreso de filtros
       ii. Ejecuci\xF3n de b\xFAsqueda
     b. Subflujo: Alta
       i. Validaci\xF3n de datos
       ii. Confirmaci\xF3n
   Indenta 0.2 pulgadas por nivel a la derecha.

3. Incluye una historia de revisiones con: Versi\xF3n (1.0), Fecha actual, Autor (Sistema), Descripci\xF3n (Creaci\xF3n inicial del documento)

${rules}

INSTRUCCIONES CR\xCDTICAS PARA PREVENIR ERRORES:
- NUNCA uses valores por defecto o gen\xE9ricos como "Apellido", "DNI", "Segmento" - estos son SOLO ejemplos ilustrativos
- SIEMPRE usa EXACTAMENTE los datos provistos en el formulario
- Para filtros de b\xFAsqueda: usa SOLO los valores exactos provistos en formData.searchFilters
- Para columnas de resultado: usa SOLO los valores exactos en formData.resultColumns  
- Para campos de entidad: usa SOLO los campos exactos en formData.entityFields con sus propiedades (tipo, requerido, longitud)
- Si no hay datos provistos, indica "No especificado" pero NO inventes valores
- TODO ejemplo en el documento debe ser marcado como "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- Para el actor principal: Si no hay actor expl\xEDcito, usar "Actor no identificado"
- Para procesos autom\xE1ticos: incluir configurables (path archivos, usuario/clave/URL web services)

\u26A0\uFE0F REGLA CR\xCDTICA DE NOMBRES DE ARCHIVO \u26A0\uFE0F
- NUNCA agregues extensiones de archivo (.json, .docx, .xml, .txt, etc.) al campo fileName
- El fileName debe usarse EXACTAMENTE como viene sin modificaciones ni extensiones
- El archivo ya tiene su formato definido (ser\xE1 DOCX autom\xE1ticamente)
- Ejemplo CORRECTO: "BP005GestionarClientes" 
- Ejemplo INCORRECTO: "BP005GestionarClientes.json" o "BP005GestionarClientes.docx"

DATOS DEL FORMULARIO COMPLETOS:
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- C\xF3digo: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripci\xF3n: ${formData.description}
- Filtros de b\xFAsqueda: ${formData.searchFilters?.join(", ") || "Ninguno"}
- Columnas de resultado: ${formData.resultColumns?.join(", ") || "Ninguna"}
- Campos de entidad: ${formData.entityFields?.map((f) => `${f.name} (${f.type}${f.mandatory ? ", obligatorio" : ""}, largo: ${f.length || "N/A"}, ${f.description || "sin descripci\xF3n"}, validaciones: ${f.validationRules || "ninguna"})`).join("; ") || "Ninguno"}
- Reglas de negocio: ${formData.businessRules || "Ninguna espec\xEDfica"}
- Requerimientos especiales: ${formData.specialRequirements || "Ninguno"}
- Generar wireframes: ${formData.generateWireframes ? "S\xED" : "No"}
${formData.wireframeDescriptions?.length ? `- Descripciones de wireframes: ${formData.wireframeDescriptions.filter((w) => w.trim()).join("; ")}` : ""}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mant\xE9n consistencia en la numeraci\xF3n y formato
- Incluye TODAS las secciones requeridas
- Aseg\xFArate de que la descripci\xF3n sea detallada y profesional
- Incluye t\xEDtulo en MAY\xDASCULAS con color azul RGB(0,112,192) en la secci\xF3n inicial
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
- Asegura indentaci\xF3n de 0.2 pulgadas en listas editadas (1-a-i para flujos)`;
  }
  static cleanAIResponse(content) {
    if (content.includes("FLUJO PRINCIPAL DE EVENTOS") || content.includes("FLUJOS ALTERNATIVOS")) {
      console.log("\u{1F50D} SECTIONS FOUND in AI response before cleaning");
    } else {
      console.log("\u26A0\uFE0F REQUIRED SECTIONS NOT FOUND in original AI response");
    }
    let cleaned = content;
    cleaned = cleaned.replace(/([A-Z]{2}\d{3}[^.\s]*)(\.json)/gi, "$1");
    cleaned = cleaned.replace(/([A-Z]{2}\d{3}[^.\s]*)(\.docx)/gi, "$1");
    cleaned = cleaned.replace(/([A-Z]{2}\d{3}[^.\s]*)(\.xml)/gi, "$1");
    cleaned = cleaned.replace(/([A-Z]{2}\d{3}[^.\s]*)(\.txt)/gi, "$1");
    const unwantedPhrases = [
      /Claro,.*?aquí.*?tienes.*?\./gi,
      /Por.*?supuesto.*?\./gi,
      /Aquí.*?está.*?\./gi,
      /Aquí.*?tienes.*?\./gi,
      /Te.*?presento.*?\./gi,
      /^.*?documento.*?actualizado.*?mejoras.*?\./gi,
      /^.*?manteniendo.*?formato.*?HTML.*?\./gi,
      /^.*?como.*?lo.*?haría.*?experto.*?\./gi,
      /^.*?Se.*?han.*?incorporado.*?mejoras.*?\./gi,
      /^.*?estructura.*?profesional.*?\./gi,
      /^.*?historial.*?de.*?revisiones.*?\./gi,
      /^.*?claridad.*?y.*?consistencia.*?\./gi,
      /^.*?corrección.*?de.*?HTML.*?\./gi,
      /^.*?prototipos.*?mejorados.*?\./gi,
      /^.*?actualizado.*?cambios.*?recientes.*?\./gi,
      /^.*?estructurado.*?profesionalmente.*?\./gi,
      /^.*?añadido.*?nuevos.*?campos.*?\./gi,
      /^.*?tabla.*?control.*?versiones.*?\./gi,
      /^.*?reflejar.*?modificaciones.*?\./gi,
      /^\*\*.*?\*\*.*?\./gm,
      /\*\*\*.*?\*\*\*/gm,
      /^-+$/gm,
      /###.*?$/gm,
      /```html/gi,
      /```css/gi,
      /```/gi,
      /---\s*/gi,
      /^.*?font-family.*?$/gm,
      /^.*?line-height.*?$/gm,
      /^.*?color.*?rgb.*?$/gm,
      /^.*?margin.*?$/gm,
      /^.*?padding.*?$/gm,
      /^body.*?\{[\s\S]*?\}/gi,
      /^p.*?\{[\s\S]*?\}/gi,
      /^h\d.*?\{[\s\S]*?\}/gi,
      /^\..*?\{[\s\S]*?\}/gi,
      /^ol.*?\{[\s\S]*?\}/gi
    ];
    unwantedPhrases.forEach((phrase) => {
      if (phrase.toString().includes("h\\d") || phrase.toString().includes("color.*rgb")) {
        if (!cleaned.includes("FLUJO PRINCIPAL DE EVENTOS") && !cleaned.includes("FLUJOS ALTERNATIVOS")) {
          cleaned = cleaned.replace(phrase, "");
        }
      } else {
        cleaned = cleaned.replace(phrase, "");
      }
    });
    const htmlStart = cleaned.search(/<(?:div|h1|h2|h3|p|ol|ul|table)/i);
    if (htmlStart !== -1) {
      cleaned = cleaned.substring(htmlStart);
    }
    const lastCloseTag = cleaned.lastIndexOf("</");
    if (lastCloseTag !== -1) {
      const endOfLastTag = cleaned.indexOf(">", lastCloseTag) + 1;
      if (endOfLastTag > 0) {
        cleaned = cleaned.substring(0, endOfLastTag);
      }
    }
    cleaned = cleaned.replace(/^[^<]*(?=<)/, "");
    return cleaned.trim();
  }
  static ensureApiSections(content, useCaseType) {
    console.log("\u{1F3AF}\u{1F3AF}\u{1F3AF} ENSUREAPI FUNCTION CALLED \u{1F3AF}\u{1F3AF}\u{1F3AF}");
    console.log("\u{1F3AF} Received useCaseType:", useCaseType);
    console.log("\u{1F3AF} Content length:", content?.length || "undefined");
    if (useCaseType === "api") {
      console.log("\u{1F3AF}\u{1F3AF}\u{1F3AF} INSIDE API CONDITION \u{1F3AF}\u{1F3AF}\u{1F3AF}");
      const hasFlujoPrincipal = content.includes("FLUJO PRINCIPAL DE EVENTOS");
      const hasFlujoAlternativo = content.includes("FLUJOS ALTERNATIVOS");
      console.log("\u{1F3AF} hasFlujoPrincipal:", hasFlujoPrincipal);
      console.log("\u{1F3AF} hasFlujoAlternativo:", hasFlujoAlternativo);
      if (!hasFlujoPrincipal || !hasFlujoAlternativo) {
        console.log("\u{1F6A8} Adding missing mandatory API sections");
        const mandatorySections = `

<h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">FLUJO PRINCIPAL DE EVENTOS</h2>

<ol style="margin: 12px 0; padding-left: 24px; color: rgb(68, 68, 68); font-family: 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6;">
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Identificaci\xF3n:</strong> El cliente se autentica en el sistema utilizando sus credenciales v\xE1lidas
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">El sistema valida las credenciales y genera un token de acceso</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se establecen los permisos y l\xEDmites asociados al perfil del cliente</li>
    </ol>
  </li>
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Solicitud:</strong> El cliente env\xEDa una petici\xF3n HTTP POST al endpoint especificado
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">El sistema recibe y valida el formato de la solicitud</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se verifican los par\xE1metros obligatorios y opcionales</li>
    </ol>
  </li>
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Procesamiento:</strong> El sistema ejecuta la l\xF3gica de negocio correspondiente
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">Se aplican las reglas de negocio definidas</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se actualiza la informaci\xF3n en la base de datos</li>
    </ol>
  </li>
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Respuesta:</strong> El sistema retorna el resultado de la operaci\xF3n
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">Se genera la respuesta en formato JSON</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se incluye el c\xF3digo de estado HTTP apropiado</li>
    </ol>
  </li>
</ol>

<h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">FLUJOS ALTERNATIVOS</h2>

<ol style="margin: 12px 0; padding-left: 24px; color: rgb(68, 68, 68); font-family: 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.6;">
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Error 400 - Bad Request:</strong> Cuando la solicitud contiene par\xE1metros inv\xE1lidos o faltantes
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">El sistema retorna c\xF3digo HTTP 400</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se incluye un mensaje descriptivo del error en la respuesta JSON</li>
    </ol>
  </li>
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Error 401/403 - Unauthorized/Forbidden:</strong> Cuando hay problemas de autenticaci\xF3n o autorizaci\xF3n
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">El sistema retorna c\xF3digo HTTP 401 o 403 seg\xFAn corresponda</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se registra el intento de acceso no autorizado en los logs de auditor\xEDa</li>
    </ol>
  </li>
  <li style="margin: 6px 0; text-indent: 0.2in;">
    <strong>Error 500 - Internal Server Error:</strong> Cuando ocurre un error interno del sistema
    <ol style="list-style-type: lower-alpha; margin: 6px 0 6px 20px;">
      <li style="margin: 3px 0; text-indent: 0.2in;">El sistema retorna c\xF3digo HTTP 500</li>
      <li style="margin: 3px 0; text-indent: 0.2in;">Se registra el error detallado en los logs del sistema para investigaci\xF3n</li>
    </ol>
  </li>
</ol>

`;
        console.log("\u{1F527} Appending mandatory sections to content");
        content = content + mandatorySections;
        console.log("\u{1F527} New content length after adding sections:", content.length);
      }
    }
    return content;
  }
  static async generateWithOpenAI(prompt) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key no est\xE1 configurada");
    }
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un experto en documentaci\xF3n de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4e3
    });
    return response.choices[0].message.content || "";
  }
  static async generateWithClaude(prompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key no est\xE1 configurada");
    }
    const client = await getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4e3,
      system: "Eres un experto en documentaci\xF3n de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    return response.content[0].text || "";
  }
  static async generateWithGrok(prompt) {
    if (!process.env.XAI_API_KEY) {
      throw new Error("Grok API key no est\xE1 configurada");
    }
    const client = getGrokClient();
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "Eres un experto en documentaci\xF3n de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4e3
    });
    return response.choices[0].message.content || "";
  }
  static async generateWithGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key no est\xE1 configurada");
    }
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      // Modelo más rápido
      config: {
        systemInstruction: "Eres un experto en documentaci\xF3n de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.",
        maxOutputTokens: 16e3,
        // Aumentado para contenido completo
        temperature: 0.3
      },
      contents: prompt
    });
    return response.text || "";
  }
  static generateDemoContent(formData) {
    const content = `
      <div style="font-family: 'Segoe UI', sans-serif; line-height: 1.2;">
        <h1 style="color: rgb(0, 112, 192); font-size: 18px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase;">
          ${formData.useCaseName || "CASO DE USO DEMO"}
        </h1>
        
        <div style="margin-bottom: 16px;"><strong>Nombre del Cliente:</strong> ${formData.clientName || "Cliente Demo"}</div>
        <div style="margin-bottom: 16px;"><strong>Nombre del Proyecto:</strong> ${formData.projectName || "Proyecto Demo"}</div>
        <div style="margin-bottom: 16px;"><strong>C\xF3digo del Caso de Uso:</strong> ${formData.useCaseCode || "UC001"}</div>
        <div style="margin-bottom: 16px;"><strong>Nombre del Caso de Uso:</strong> ${formData.useCaseName || "Gestionar Entidad Demo"}</div>
        <div style="margin-bottom: 20px;"><strong>Nombre del Archivo:</strong> ${formData.fileName || "AB123Demo"}</div>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Descripci\xF3n</h2>
        <p style="margin-bottom: 20px; text-align: justify;">${formData.description || "Este es un caso de uso generado en modo demo para probar la funcionalidad del sistema."}</p>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Flujo Principal de Eventos</h2>
        <ol style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 8px;">Buscar datos de la entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Filtros de b\xFAsqueda disponibles: ${formData.searchFilters?.join(", ") || "ID, Nombre, Estado"}</li>
              <li style="margin-bottom: 4px;">Columnas del resultado de b\xFAsqueda: ${formData.resultColumns?.join(", ") || "ID, Nombre, Fecha Creaci\xF3n, Estado"}</li>
            </ol>
          </li>
          <li style="margin-bottom: 8px;">Agregar una nueva entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Campos de la entidad: ${formData.entityFields?.map((f) => `${f.name} (${f.type}${f.mandatory ? ", obligatorio" : ""})`).join(", ") || "Nombre (texto, obligatorio), Descripci\xF3n (texto)"}</li>
              <li style="margin-bottom: 4px;">Al agregar se registra autom\xE1ticamente la fecha y usuario de alta</li>
            </ol>
          </li>
        </ol>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Flujos Alternativos</h2>
        <ol style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 8px;">Modificar o actualizar una entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Se debe mostrar el identificador \xFAnico</li>
              <li style="margin-bottom: 4px;">Se muestra la fecha y usuario de alta</li>
              <li style="margin-bottom: 4px;">Al modificar se registra la fecha y usuario de modificaci\xF3n</li>
            </ol>
          </li>
          <li style="margin-bottom: 8px;">Eliminar una entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Se debe verificar que no tenga relaciones con otras entidades</li>
            </ol>
          </li>
        </ol>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Reglas de Negocio</h2>
        ${formData.businessRules ? `<div style="margin-left: 20px; margin-bottom: 20px;">${formData.businessRules}</div>` : `
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Los datos obligatorios deben ser validados antes de guardar</li>
          <li style="margin-bottom: 4px;">Se debe mantener un log de auditor\xEDa de todas las operaciones</li>
        </ul>`}
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Requerimientos Especiales</h2>
        ${formData.specialRequirements ? `<div style="margin-left: 20px; margin-bottom: 20px;">${formData.specialRequirements}</div>` : `
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">El sistema debe responder en menos de 3 segundos</li>
          <li style="margin-bottom: 4px;">Se debe implementar paginaci\xF3n para resultados mayores a 50 registros</li>
        </ul>`}
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Precondiciones</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">El usuario debe estar autenticado en el sistema</li>
          <li style="margin-bottom: 4px;">El usuario debe tener permisos para gestionar la entidad</li>
        </ul>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Postcondiciones</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Los cambios se reflejan inmediatamente en la base de datos</li>
          <li style="margin-bottom: 4px;">Se genera una entrada en el log de auditor\xEDa</li>
        </ul>
        
        ${formData.generateWireframes ? `
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Boceto Gr\xE1fico de Interfaz de Usuario</h2>
        
        <h3 style="font-weight: 600; margin: 16px 0 8px 0;">Buscador de Entidades</h3>
        <p style="margin-bottom: 12px; text-align: justify;">La interfaz del buscador incluye una secci\xF3n superior con campos de filtro organizados horizontalmente. En el centro se muestra una grilla con los resultados de b\xFAsqueda con paginaci\xF3n en la parte inferior. Los botones de acci\xF3n (Buscar, Limpiar, Agregar) se ubican en la parte superior derecha. Cada fila de resultados incluye botones de Editar y Eliminar al final.</p>
        
        <h4 style="font-weight: 600; margin: 12px 0 6px 0;">Funcionalidades del buscador:</h4>
        <ul style="margin-left: 20px; margin-bottom: 16px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Filtros de b\xFAsqueda: ${formData.searchFilters?.join(", ") || "ID, Nombre, Estado"}</li>
          <li style="margin-bottom: 4px;">Columnas de resultado: ${formData.resultColumns?.join(", ") || "ID, Nombre, Fecha Creaci\xF3n, Estado"}</li>
          <li style="margin-bottom: 4px;">Implementa paginaci\xF3n cuando hay m\xE1s de 50 registros</li>
        </ul>
        
        <h3 style="font-weight: 600; margin: 16px 0 8px 0;">Interfaz para Agregar Entidad</h3>
        <p style="margin-bottom: 12px; text-align: justify;">El formulario de alta se presenta en una ventana modal o p\xE1gina separada con campos organizados en secciones l\xF3gicas. Los botones Aceptar y Cancelar se ubican en la parte inferior derecha. Los campos de fecha y usuario de alta/modificaci\xF3n se muestran como solo lectura.</p>
        
        <h4 style="font-weight: 600; margin: 12px 0 6px 0;">Funcionalidades del formulario:</h4>
        <ul style="margin-left: 20px; margin-bottom: 16px; padding-left: 0;">
          ${formData.entityFields?.map(
      (f) => `<li style="margin-bottom: 4px;">${f.name}: ${f.type}${f.mandatory ? " (obligatorio)" : ""}${f.length ? `, longitud m\xE1xima ${f.length}` : ""}</li>`
    ).join("") || '<li style="margin-bottom: 4px;">Nombre: texto (obligatorio), longitud m\xE1xima 100</li><li style="margin-bottom: 4px;">Descripci\xF3n: texto, longitud m\xE1xima 500</li>'}
          <li style="margin-bottom: 4px;">Fecha y usuario de alta: autom\xE1tico, solo lectura</li>
          <li style="margin-bottom: 4px;">Fecha y usuario de modificaci\xF3n: autom\xE1tico, solo lectura</li>
        </ul>
        ` : ""}
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0;">HISTORIA DE REVISIONES Y APROBACIONES</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Fecha</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Acci\xF3n</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Responsable</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle; width: 200px;">Comentario</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">26/7/2025</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Versi\xF3n original</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Sistema Demo</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Generado v\xEDa modo demo</td>
            </tr>
            <tr>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;"></td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;"></td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;"></td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    const generatedWireframes = formData.generateWireframes ? {
      searchWireframe: "/attached_assets/generated_images/Search_interface_wireframe_59d3b735.png",
      formWireframe: "/attached_assets/generated_images/Form_interface_wireframe_bf6aaf30.png"
    } : void 0;
    return {
      content,
      success: true,
      ...generatedWireframes && { generatedWireframes }
    };
  }
  static async editUseCase(content, instructions, aiModel) {
    if (aiModel === "demo") {
      return {
        content: content + `

<div style="background-color: #e6ffe6; padding: 10px; margin-top: 20px; border-left: 4px solid #28a745;"><strong>Modo Demo:</strong> Se aplicar\xEDan los cambios: "${instructions}"</div>`,
        success: true
      };
    }
    try {
      const prompt = `Eres un experto en documentaci\xF3n de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: "${instructions}"

Documento actual:
${content}

INSTRUCCIONES:
- Mant\xE9n la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la informaci\xF3n no afectada por los cambios
- Aseg\xFArate de que el documento siga siendo coherente y profesional
- Asegura indentaci\xF3n 0.2 en listas editadas si se modifican flujos
- Mant\xE9n el estilo y formato corporativo ING`;
      let modifiedContent;
      switch (aiModel) {
        case "openai":
          modifiedContent = await this.generateWithOpenAI(prompt);
          break;
        case "claude":
          modifiedContent = await this.generateWithClaude(prompt);
          break;
        case "grok":
          modifiedContent = await this.generateWithGrok(prompt);
          break;
        case "gemini":
          modifiedContent = await this.generateWithGemini(prompt);
          break;
        case "copilot":
          modifiedContent = await this.generateWithCopilot(prompt);
          break;
        default:
          throw new Error(`Modelo de IA no soportado: ${aiModel}`);
      }
      const cleanedContent = this.cleanAIResponse(modifiedContent);
      return {
        content: cleanedContent,
        success: true
      };
    } catch (error) {
      console.error("Error editing use case:", error);
      return {
        content,
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      };
    }
  }
  static async improveField(fieldName, fieldValue, fieldType, context, aiModel) {
    const service = new _AIService();
    if (aiModel && aiModel !== "demo") {
      service.selectedModel = aiModel;
    }
    return service.improveFieldInstance(fieldName, fieldValue, fieldType, context, aiModel);
  }
  // Test case generation method  
  async generateTestCases(prompt, context, aiModel) {
    if (aiModel === "demo") {
      return JSON.stringify({
        objective: `Verificar el funcionamiento completo del caso de uso: ${context.basicInfo?.useCaseName || "Gesti\xF3n de entidades"}`,
        preconditions: `\u2022 Usuario QA_OPERADOR con perfil autorizado para realizar operaciones
\u2022 Usuario QA_SUPERVISOR para validar auditor\xEDa
\u2022 Cliente con DNI 25123456, CUIT 20251234561 en estado activo
\u2022 Datos de prueba v\xE1lidos seg\xFAn reglas de negocio del caso de uso
\u2022 Sistema de ${context.basicInfo?.projectName || "Gesti\xF3n"} desplegado y accesible
\u2022 Base de datos con datos de prueba disponible
\u2022 Servicios externos simulados o disponibles`,
        testSteps: [
          {
            number: 1,
            action: "Acceder al m\xF3dulo del caso de uso",
            inputData: "Credenciales v\xE1lidas de usuario",
            expectedResult: "Sistema muestra la interfaz principal",
            observations: "Verificar carga correcta de la interfaz"
          },
          {
            number: 2,
            action: "Ejecutar funci\xF3n principal",
            inputData: "Datos de prueba v\xE1lidos",
            expectedResult: "Operaci\xF3n completada exitosamente",
            observations: "Validar procesamiento correcto"
          }
        ],
        analysisNotes: "Casos de prueba generados autom\xE1ticamente basados en el an\xE1lisis completo del caso de uso"
      });
    }
    const aiModels = ["copilot", "gemini", "openai", "claude", "grok"];
    const modelOrder = [aiModel, ...aiModels.filter((m) => m !== aiModel)];
    const errors = [];
    for (const model of modelOrder) {
      try {
        console.log(`Attempting to generate test cases with AI model: ${model}`);
        let result;
        switch (model) {
          case "openai":
            result = await _AIService.processWithOpenAI(prompt, JSON.stringify(context));
            break;
          case "claude":
            result = await _AIService.processWithClaude(prompt, JSON.stringify(context));
            break;
          case "grok":
            result = await _AIService.processWithGrok(prompt, JSON.stringify(context));
            break;
          case "gemini":
            result = await _AIService.processWithGemini(prompt, JSON.stringify(context));
            break;
          case "copilot":
            result = await _AIService.processWithCopilot(prompt, JSON.stringify(context));
            break;
          default:
            continue;
        }
        console.log(`Successfully generated test cases with ${model}`);
        return result;
      } catch (error) {
        console.error(`Failed to generate test cases with ${model}:`, error.message || error);
        errors.push({
          model,
          error: error.message || "Unknown error"
        });
      }
    }
    const errorDetails = errors.map((e) => `${e.model}: ${e.error}`).join("\n");
    throw new Error(`No se pudo generar casos de prueba con ning\xFAn modelo de IA disponible. Errores:
${errorDetails}`);
  }
  static async processFieldWithAI(systemPrompt, fieldValue, aiModel) {
    const aiModels = ["copilot", "gemini", "openai", "claude", "grok"];
    const modelOrder = [aiModel, ...aiModels.filter((m) => m !== aiModel)];
    const errors = [];
    for (const model of modelOrder) {
      try {
        console.log(`Attempting to process with AI model: ${model}`);
        let result;
        switch (model) {
          case "openai":
            result = await this.processWithOpenAI(systemPrompt, fieldValue);
            break;
          case "claude":
            result = await this.processWithClaude(systemPrompt, fieldValue);
            break;
          case "grok":
            result = await this.processWithGrok(systemPrompt, fieldValue);
            break;
          case "gemini":
            result = await this.processWithGemini(systemPrompt, fieldValue);
            break;
          case "copilot":
            result = await this.processWithCopilot(systemPrompt, fieldValue);
            break;
          default:
            continue;
        }
        console.log(`Successfully processed with ${model}`);
        return result;
      } catch (error) {
        console.error(`Failed to process with ${model}:`, error.message || error);
        errors.push({
          model,
          error: error.message || "Unknown error"
        });
      }
    }
    const errorDetails = errors.map((e) => `${e.model}: ${e.error}`).join("\n");
    throw new Error(`No se pudo procesar con ning\xFAn modelo de IA disponible. Errores:
${errorDetails}`);
  }
  static async processWithOpenAI(systemPrompt, fieldValue) {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content || "";
  }
  static async processWithClaude(systemPrompt, fieldValue) {
    const client = await getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4e3,
      system: systemPrompt,
      messages: [
        { role: "user", content: fieldValue }
      ]
    });
    return response.content[0].text || "";
  }
  static async processWithGrok(systemPrompt, fieldValue) {
    const client = getGrokClient();
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content || "";
  }
  static async processWithGemini(systemPrompt, fieldValue) {
    const client = getGeminiClient();
    const isTestCaseGeneration = systemPrompt.includes("casos de prueba") || systemPrompt.includes("test cases");
    const isMinuteAnalysis = systemPrompt.includes("minuta") || systemPrompt.includes("an\xE1lisis de documento");
    const maxTokens = isTestCaseGeneration ? 12e3 : isMinuteAnalysis ? 1e4 : 4e3;
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      // Modelo más rápido
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "text/plain",
        maxOutputTokens: maxTokens,
        temperature: 0.3
      },
      contents: fieldValue
    });
    return response.text || "";
  }
  async improveFieldInstance(fieldName, fieldValue, fieldType, context, aiModel) {
    try {
      if (fieldType === "wireframeDescription") {
        return this.generateIntelligentWireframeDescription(fieldValue, context);
      }
      if (fieldType === "alternativeFlow") {
        return this.generateIntelligentAlternativeFlow(fieldValue);
      }
      if (fieldType === "businessRules") {
        return this.generateIntelligentBusinessRules(fieldValue);
      }
      if (fieldType === "specialRequirements") {
        return this.generateIntelligentSpecialRequirements(fieldValue);
      }
      if (fieldType === "wireframesDescription") {
        return this.generateIntelligentWireframesDescription(fieldValue, context);
      }
      if (fieldType === "alternativeFlowsDescription") {
        return this.generateIntelligentAlternativeFlowsDescription(fieldValue);
      }
      if (!aiModel || aiModel === "demo") {
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      if (fieldType === "filtersFromText") {
        return await this.processFiltersWithAI(fieldValue, aiModel);
      }
      if (fieldType === "columnsFromText") {
        return await this.processColumnsWithAI(fieldValue, aiModel);
      }
      if (fieldType === "fieldsFromText") {
        try {
          return await this.processEntityFieldsWithAI(fieldValue, aiModel);
        } catch (error) {
          return this.generateEnhancedEntityFields(fieldValue);
        }
      }
      const rules = this.getFieldRules(fieldName, fieldType, context);
      const contextPrompt = this.buildContextualPrompt(context);
      const prompt = this.buildProviderSpecificPrompt(aiModel, contextPrompt, fieldName, fieldValue, rules);
      if (process.env.NODE_ENV === "development") {
        console.log("\n\u{1F916} AI ASSIST PROMPT LOG:");
        console.log("Field:", fieldName);
        console.log("Type:", fieldType);
        console.log("AI Model:", aiModel);
        console.log("Use Case Type:", context?.fullFormData?.useCaseType || "N/A");
        console.log("Full Prompt:");
        console.log("---");
        console.log(prompt);
        console.log("---\n");
      }
      let improvedValue;
      switch (aiModel) {
        case "openai":
          improvedValue = await this.callOpenAIForImprovement(prompt);
          break;
        case "claude":
          improvedValue = await this.callClaudeForImprovement(prompt);
          break;
        case "grok":
          improvedValue = await this.callGrokForImprovement(prompt);
          break;
        case "gemini":
          improvedValue = await this.callGeminiForImprovement(prompt);
          break;
        default:
          return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      if (process.env.NODE_ENV === "development") {
        console.log("\u{1F916} AI RESPONSE:", improvedValue);
        console.log("---\n");
      }
      if (!improvedValue || improvedValue.trim() === "") {
        console.log("AI returned empty, falling back to demo mode for field:", fieldName);
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      return improvedValue;
    } catch (error) {
      console.error("Error improving field:", error);
      return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
    }
  }
  getFieldRules(fieldName, fieldType, context) {
    const fieldName_lower = fieldName.toLowerCase();
    const useCaseType = context?.fullFormData?.useCaseType || "entidad";
    const ingCompliance = this.getINGComplianceRules(useCaseType);
    if (fieldName_lower.includes("nombre") && fieldName_lower.includes("cliente")) {
      return `${ingCompliance}
- Debe ser un nombre de empresa real o banco
- Primera letra may\xFAscula
- Sin abreviaciones innecesarias`;
    }
    if (fieldName_lower.includes("proyecto")) {
      return `${ingCompliance}
- Debe describir un sistema o proyecto tecnol\xF3gico
- Formato profesional
- Relacionado con el cliente`;
    }
    if (fieldName_lower.includes("codigo")) {
      return `${ingCompliance}
- Formato: 2 letras may\xFAsculas + 3 n\xFAmeros (ej: CL005, AB123)
- Las letras deben relacionarse con el m\xF3dulo o \xE1rea`;
    }
    if (fieldName_lower.includes("nombre") && fieldName_lower.includes("caso")) {
      return `${ingCompliance}
- OBLIGATORIO: Debe comenzar con verbo en infinitivo (Gestionar, Crear, Consultar, etc.)
- Prepara para t\xEDtulo en may\xFAsculas RGB(0,112,192)
- Describe claramente la funcionalidad
- Sin art\xEDculos innecesarios
${this.getUseCaseTypeSpecificRules(useCaseType)}`;
    }
    if (fieldName_lower.includes("archivo")) {
      return `${ingCompliance}
- Formato exacto: 2 letras + 3 n\xFAmeros + nombre descriptivo sin espacios
- Ejemplo: BP005GestionarClientesPremium
- Sin caracteres especiales`;
    }
    if (fieldName_lower.includes("descripcion")) {
      return `${ingCompliance}
\u26A0\uFE0F EXPANSI\xD3N OBLIGATORIA \u26A0\uFE0F
- SIEMPRE expandir a 2 p\xE1rrafos completos (M\xCDNIMO 150 palabras total)
- Primer p\xE1rrafo (75+ palabras): QU\xC9 hace el caso de uso, prop\xF3sito principal, procesos que abarca, \xE1rea de negocio que atiende
- Segundo p\xE1rrafo (75+ palabras): BENEFICIOS clave, valor agregado, mejoras operativas, problemas que resuelve
- Si la descripci\xF3n es corta (ej: "Mostrar proveedores"), EXPANDIRLA COMPLETAMENTE con contexto profesional
- Incluir alcance/objetivo como en minuta ING
- Si aplica, menciona flujos principales con lista indentada (1-a-i):
  1. Flujo principal (ej. Buscar [entidad])
    a. Detallar filtros y columnas
    i. Criterios de b\xFAsqueda
- Tono profesional y claro
- Contexto relevante del negocio bancario/empresarial
${this.getUseCaseTypeSpecificRules(useCaseType)}`;
    }
    if (fieldName_lower.includes("reglas") && fieldName_lower.includes("negocio")) {
      return `${ingCompliance}
\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente, NO listas numeradas
- Cada regla como bullet point separado: \u2022 Texto de la regla
- Cada regla debe ser clara, espec\xEDfica y verificable
- Incluye validaciones, restricciones y pol\xEDticas
- Considera aspectos regulatorios si aplica
- Para modificar/eliminar: incluir verificaciones
Ejemplo correcto:
\u2022 El DNI debe ser \xFAnico en el sistema y validar formato correcto
\u2022 No se puede eliminar un cliente con productos activos
\u2022 Solo usuarios con rol Supervisor pueden eliminar clientes
\u2022 Registro autom\xE1tico en bit\xE1cora de todas las operaciones`;
    }
    if (fieldName_lower.includes("requerimientos")) {
      return `${ingCompliance}
\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente, NO listas numeradas
- Cada requerimiento como bullet point separado: \u2022 Texto del requerimiento
- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)
- Especifica m\xE9tricas cuando sea posible
- Considera integraciones con otros sistemas
Ejemplo correcto:
\u2022 Integraci\xF3n con servicio externo de validaci\xF3n
\u2022 Tiempos de respuesta menores a 3 segundos
\u2022 Validaciones de seguridad HTTPS obligatorias
\u2022 El sistema debe procesar m\xE1s de 1000 transacciones por minuto`;
    }
    if (fieldName_lower.includes("objetivo") && (fieldName_lower.includes("prueba") || fieldName_lower.includes("test") || fieldType === "testCaseObjective")) {
      return `${ingCompliance}
\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente
- Cada objetivo como bullet point separado: \u2022 Texto del objetivo
- Enfocarse en validaci\xF3n de funcionalidades espec\xEDficas
- Incluir verificaci\xF3n de controles de seguridad
- Mencionar integridad de datos
- Ser espec\xEDfico del caso de uso
Ejemplo correcto:
\u2022 Validar la funcionalidad completa de gesti\xF3n de usuarios
\u2022 Verificar controles de seguridad y permisos de acceso
\u2022 Comprobar integridad de datos en todas las operaciones
\u2022 Confirmar manejo correcto de errores y validaciones`;
    }
    if (fieldName_lower.includes("precondiciones") && (fieldName_lower.includes("prueba") || fieldName_lower.includes("test") || fieldType === "testCasePreconditions")) {
      return `${ingCompliance}
\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente
- Cada precondici\xF3n como bullet point separado: \u2022 Texto de la precondici\xF3n
- Incluir estado de usuarios y permisos necesarios
- Mencionar datos de prueba requeridos
- Especificar infraestructura y configuraci\xF3n
- Listar dependencias del sistema
Ejemplo correcto:
\u2022 Usuario autenticado con permisos adecuados para realizar operaciones
\u2022 Datos de prueba cargados en el sistema de desarrollo
\u2022 Conexi\xF3n a base de datos disponible y configurada
\u2022 Ambiente de pruebas desplegado y accesible`;
    }
    if (fieldType === "searchFilter") {
      return `${ingCompliance}
- Nombre del campo de b\xFAsqueda
- Debe ser un campo l\xF3gico de la entidad
- Formato lista multi-nivel: 1. Filtro por [campo], a. L\xF3gica [igual/mayor]`;
    }
    if (fieldType === "resultColumn") {
      return `${ingCompliance}
- Columnas para tabla de resultados
- Informaci\xF3n relevante para identificar registros
- Formato multi-nivel con indent 0.2`;
    }
    if (fieldType === "entityField") {
      return `${ingCompliance}
- Campo de entidad con tipo/longitud/obligatorio
- Auto-incluir campos de auditor\xEDa:
  \u2022 fechaAlta (date, mandatory)
  \u2022 usuarioAlta (text, mandatory)
  \u2022 fechaModificacion (date, optional)
  \u2022 usuarioModificacion (text, optional)
- Tipos v\xE1lidos: text/email/number/date/boolean/decimal
- Para montos usar tipo "decimal"
- Para IDs usar tipo "number"
- Incluir SIEMPRE description y validationRules`;
    }
    return `${ingCompliance}
- Seguir buenas pr\xE1cticas de documentaci\xF3n t\xE9cnica
- Usar lenguaje claro y profesional
- Mantener coherencia con el resto del formulario`;
  }
  getINGComplianceRules(useCaseType) {
    return `CUMPLE MINUTA ING vr19: Segoe UI Semilight, interlineado simple, t\xEDtulos azul RGB(0,112,192), listas multi-nivel (1-a-i), formato profesional`;
  }
  getUseCaseTypeSpecificRules(useCaseType) {
    switch (useCaseType) {
      case "entidad":
        return "\n- Para entidades: incluye filtros/columnas de b\xFAsqueda\n- Flujos CRUD (buscar, agregar, modificar, eliminar)\n- Wireframes con paginado y botones est\xE1ndar";
      case "api":
        return "\n- Para APIs: incluye request/response detallados\n- C\xF3digos de error y manejo de excepciones\n- Documentaci\xF3n de endpoints";
      case "proceso":
        return "\n- Para procesos: describe secuencia de pasos\n- Validaciones en cada etapa\n- Puntos de control y rollback";
      default:
        return "\n- Adapta seg\xFAn tipo de caso de uso especificado";
    }
  }
  buildContextualPrompt(context) {
    if (!context || !context.fullFormData) {
      return "CONTEXTO: Informaci\xF3n limitada disponible.";
    }
    const formData = context.fullFormData;
    let contextPrompt = "CONTEXTO DEL PROYECTO:\n";
    if (formData.clientName) {
      contextPrompt += `- Cliente: ${formData.clientName}
`;
    }
    if (formData.projectName) {
      contextPrompt += `- Proyecto: ${formData.projectName}
`;
    }
    if (formData.useCaseName) {
      contextPrompt += `- Caso de Uso: ${formData.useCaseName}
`;
    }
    if (formData.useCaseType) {
      contextPrompt += `- Tipo: ${formData.useCaseType}
`;
    }
    if (formData.description) {
      contextPrompt += `- Descripci\xF3n: ${formData.description}
`;
    }
    return contextPrompt;
  }
  async callOpenAIForImprovement(prompt) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        const error = new Error("OpenAI API key not configured");
        console.error("\u274C", error.message);
        throw error;
      }
      const openai2 = getOpenAIClient();
      console.log("\u{1F4E4} Calling OpenAI API...");
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });
      const result = response.choices[0]?.message?.content || "";
      if (!result || result.trim() === "") {
        throw new Error("OpenAI returned empty response");
      }
      console.log("\u2705 OpenAI Response:", result.substring(0, 100) + "...");
      return result;
    } catch (error) {
      console.error("\u274C OpenAI API Error:", error.message || error);
      throw error;
    }
  }
  async callClaudeForImprovement(prompt) {
    try {
      console.log("\u{1F4E4} Calling Claude API...");
      const anthropic2 = await getAnthropicClient();
      const response = await anthropic2.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });
      const result = response.content[0]?.text || "";
      if (!result || result.trim() === "") {
        throw new Error("Claude returned empty response");
      }
      console.log("\u2705 Claude Response:", result.substring(0, 100) + "...");
      return result;
    } catch (error) {
      console.error("\u274C Claude API Error:", error.message || error);
      throw error;
    }
  }
  async callGrokForImprovement(prompt) {
    try {
      console.log("\u{1F4E4} Calling Grok API...");
      const grok = getGrokClient();
      const response = await grok.chat.completions.create({
        model: "grok-2-1212",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });
      const result = response.choices[0]?.message?.content || "";
      if (!result || result.trim() === "") {
        throw new Error("Grok returned empty response");
      }
      console.log("\u2705 Grok Response:", result.substring(0, 100) + "...");
      return result;
    } catch (error) {
      console.error("\u274C Grok API Error:", error.message || error);
      throw error;
    }
  }
  async callGeminiForImprovement(prompt) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        const error = new Error("Gemini API key not configured");
        console.error("\u274C", error.message);
        throw error;
      }
      console.log("\u{1F4E4} Calling Gemini API...");
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 1e3,
          temperature: 0.3
        }
      });
      const result = response.text || "";
      if (!result || result.trim() === "") {
        throw new Error("Gemini returned empty response");
      }
      console.log("\u2705 Gemini Response:", result.substring(0, 100) + "...");
      return result;
    } catch (error) {
      console.error("\u274C Gemini API Error:", error.message || error);
      throw error;
    }
  }
  async processFiltersWithAI(fieldValue, aiModel) {
    if (!fieldValue || fieldValue.trim() === "") {
      console.log("\u26A0\uFE0F Empty field value, using smart filter generation");
      return this.generateSmartFilters(fieldValue || "general");
    }
    const prompt = `CUMPLE MINUTA ING vr19: Convierte esta descripci\xF3n en filtros de b\xFAsqueda profesionales para un sistema bancario.

Descripci\xF3n: "${fieldValue}"

Reglas:
- Responde SOLO con los nombres de filtros, uno por l\xEDnea
- Usa nombres descriptivos en espa\xF1ol para sistemas bancarios
- NO agregues explicaciones ni comentarios
- Formato: un filtro por l\xEDnea
- Incluye filtros est\xE1ndar ING: fechas, usuarios, estados

Ejemplo de respuesta:
N\xFAmero de cliente
Nombre completo
Estado del cliente
Fecha de registro desde
Fecha de registro hasta`;
    try {
      console.log(`\u{1F4DD} Processing filters for: "${fieldValue}" with ${aiModel}`);
      let response;
      switch (aiModel) {
        case "openai":
          response = await this.callOpenAIForImprovement(prompt);
          break;
        case "claude":
          response = await this.callClaudeForImprovement(prompt);
          break;
        case "grok":
          response = await this.callGrokForImprovement(prompt);
          break;
        case "gemini":
          response = await this.callGeminiForImprovement(prompt);
          break;
        default:
          console.log("\u26A0\uFE0F Unknown AI model, using smart filter generation");
          return this.generateSmartFilters(fieldValue);
      }
      const lines = response.split("\n").map((line) => line.trim()).filter((line) => line && !line.toLowerCase().includes("filtros") && !line.includes(":")).slice(0, 8);
      const result = lines.join("\n");
      console.log(`\u2705 Generated ${lines.length} filters`);
      return result;
    } catch (error) {
      console.error("\u274C Error processing filters with AI:", error.message);
      console.log("\u{1F504} Falling back to smart filter generation");
      return this.generateSmartFilters(fieldValue);
    }
  }
  async processColumnsWithAI(fieldValue, aiModel) {
    if (!fieldValue || fieldValue.trim() === "") {
      console.log("\u26A0\uFE0F Empty field value, using smart column generation");
      return this.generateSmartColumns(fieldValue || "general");
    }
    const prompt = `CUMPLE MINUTA ING vr19: Convierte esta descripci\xF3n en columnas de resultado para una grilla de sistema bancario.

Descripci\xF3n: "${fieldValue}"

Reglas:
- Responde SOLO con los nombres de columnas, uno por l\xEDnea
- Usa nombres descriptivos en espa\xF1ol para sistemas bancarios
- NO agregues explicaciones ni comentarios
- Formato: una columna por l\xEDnea
- Incluye columnas est\xE1ndar ING: ID, fechas, usuarios, estados

Ejemplo de respuesta:
ID Cliente
Nombre Completo
Email
Tel\xE9fono
Estado
Fecha Registro`;
    try {
      console.log(`\u{1F4DD} Processing columns for: "${fieldValue}" with ${aiModel}`);
      let response;
      switch (aiModel) {
        case "openai":
          response = await this.callOpenAIForImprovement(prompt);
          break;
        case "claude":
          response = await this.callClaudeForImprovement(prompt);
          break;
        case "grok":
          response = await this.callGrokForImprovement(prompt);
          break;
        case "gemini":
          response = await this.callGeminiForImprovement(prompt);
          break;
        default:
          console.log("\u26A0\uFE0F Unknown AI model, using smart column generation");
          return this.generateSmartColumns(fieldValue);
      }
      const lines = response.split("\n").map((line) => line.trim()).filter((line) => line && !line.toLowerCase().includes("columnas") && !line.includes(":")).slice(0, 10);
      const result = lines.join("\n");
      console.log(`\u2705 Generated ${lines.length} columns`);
      return result;
    } catch (error) {
      console.error("\u274C Error processing columns with AI:", error.message);
      console.log("\u{1F504} Falling back to smart column generation");
      return this.generateSmartColumns(fieldValue);
    }
  }
  async processEntityFieldsWithAI(fieldValue, aiModel) {
    if (!fieldValue || fieldValue.trim() === "") {
      return this.generateDefaultEntityFieldsWithINGCompliance();
    }
    const prompt = `CUMPLE MINUTA ING vr19: Auto-incluir campos obligatorios para entidades, tipos est\xE1ndar ING.

Convierte esta descripci\xF3n de campos en JSON:

"${fieldValue}"

Formato requerido COMPLETO (TODOS los campos son obligatorios):
[
  {
    "name": "nombreCampo",
    "type": "text",
    "mandatory": true,
    "length": 100,
    "description": "Descripci\xF3n clara del prop\xF3sito del campo",
    "validationRules": "Reglas de validaci\xF3n espec\xEDficas (ej: solo letras, formato espec\xEDfico, etc.)"
  }
]

Reglas ING:
- Auto-incluir SIEMPRE estos campos de auditor\xEDa: 
  * {"name": "fechaAlta", "type": "date", "mandatory": true, "description": "Fecha de creaci\xF3n del registro", "validationRules": "Fecha v\xE1lida, no futura"}
  * {"name": "usuarioAlta", "type": "text", "mandatory": true, "length": 50, "description": "Usuario que cre\xF3 el registro", "validationRules": "Usuario v\xE1lido del sistema"}
  * {"name": "fechaModificacion", "type": "date", "mandatory": false, "description": "Fecha de \xFAltima modificaci\xF3n", "validationRules": "Fecha v\xE1lida, no futura"}  
  * {"name": "usuarioModificacion", "type": "text", "mandatory": false, "length": 50, "description": "Usuario que modific\xF3 el registro", "validationRules": "Usuario v\xE1lido del sistema"}
- Nombres en camelCase espa\xF1ol
- Tipos v\xE1lidos: "text", "email", "number", "decimal", "date", "datetime", "boolean"
- mandatory: true si es obligatorio/requerido, false si es opcional
- length: especificar para campos text (max caracteres) o number/decimal (d\xEDgitos totales)
- description: SIEMPRE incluir una descripci\xF3n clara del prop\xF3sito del campo
- validationRules: SIEMPRE incluir reglas de validaci\xF3n espec\xEDficas (ej: "Solo n\xFAmeros", "Formato CBU: 22 d\xEDgitos", "Monto mayor a 0", etc.)
- Para montos usar tipo "decimal"
- Para IDs usar tipo "number" con mandatory: true
- Responde SOLO el JSON sin explicaciones`;
    try {
      let response;
      switch (aiModel) {
        case "openai":
          response = await this.callOpenAIForImprovement(prompt);
          break;
        case "claude":
          response = await this.callClaudeForImprovement(prompt);
          break;
        case "grok":
          response = await this.callGrokForImprovement(prompt);
          break;
        case "gemini":
          response = await this.callGeminiForImprovement(prompt);
          break;
        default:
          return this.getDemoFieldImprovement("", fieldValue, "fieldsFromText");
      }
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "");
      const jsonStart = cleanedResponse.indexOf("[");
      const jsonEnd = cleanedResponse.lastIndexOf("]") + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd);
        try {
          JSON.parse(jsonContent);
          return jsonContent;
        } catch (e) {
          return this.generateEnhancedEntityFields(fieldValue);
        }
      }
      return this.generateEnhancedEntityFields(fieldValue);
    } catch (error) {
      return this.generateEnhancedEntityFields(fieldValue);
    }
  }
  generateEnhancedEntityFields(fieldValue) {
    if (!fieldValue || fieldValue.trim() === "") {
      return this.generateDefaultEntityFieldsWithINGCompliance();
    }
    const text2 = fieldValue.toLowerCase();
    const fields = [];
    const fieldPatterns = [
      // Nombre patterns
      { patterns: ["nombre completo", "nombre"], name: "nombreCompleto", type: "text" },
      { patterns: ["apellido"], name: "apellido", type: "text" },
      // Contact patterns
      { patterns: ["email", "correo electronico", "correo"], name: "email", type: "email" },
      { patterns: ["telefono", "tel\xE9fono", "celular"], name: "telefono", type: "text" },
      // Date patterns
      { patterns: ["fecha de nacimiento", "fechanacimiento", "nacimiento"], name: "fechaNacimiento", type: "date" },
      { patterns: ["fecha de alta", "fecha alta", "fechaalta"], name: "fechaAlta", type: "date" },
      { patterns: ["fecha de registro", "fecha registro"], name: "fechaRegistro", type: "date" },
      { patterns: ["fecha"], name: "fecha", type: "date" },
      // ID patterns
      { patterns: ["numero de cliente", "numero cliente", "numerocliente"], name: "numeroCliente", type: "text" },
      { patterns: ["dni", "documento"], name: "dni", type: "text" },
      { patterns: ["cuit", "cuil"], name: "cuit", type: "text" },
      { patterns: ["codigo"], name: "codigo", type: "text" },
      { patterns: ["id"], name: "id", type: "number" },
      // Status patterns
      { patterns: ["estado", "estatus"], name: "estado", type: "boolean" },
      { patterns: ["activo"], name: "activo", type: "boolean" },
      // Address patterns
      { patterns: ["direccion", "direcci\xF3n"], name: "direccion", type: "text" },
      { patterns: ["ciudad"], name: "ciudad", type: "text" },
      { patterns: ["provincia"], name: "provincia", type: "text" },
      { patterns: ["codigo postal", "codigopostal"], name: "codigoPostal", type: "text" },
      // Other common patterns
      { patterns: ["edad"], name: "edad", type: "number" },
      { patterns: ["sueldo", "salario"], name: "sueldo", type: "number" }
    ];
    fieldPatterns.forEach((pattern) => {
      pattern.patterns.forEach((pat) => {
        if (text2.includes(pat)) {
          if (!fields.some((f) => f.name === pattern.name)) {
            const lengthMatch = text2.match(new RegExp(`${pat}[^,]*?(?:m\xE1ximo|maximo)\\s+(\\d+)\\s+caracteres`, "i"));
            const length = lengthMatch ? parseInt(lengthMatch[1]) : void 0;
            const mandatory = text2.includes(`${pat}[^,]*?obligatorio`) || text2.includes(`${pat}[^,]*?requerido`);
            const optional = text2.includes(`${pat}[^,]*?opcional`);
            fields.push({
              name: pattern.name,
              type: pattern.type,
              mandatory: mandatory ? true : optional ? false : true,
              // Default to true if not specified
              ...length && { length }
            });
          }
        }
      });
    });
    if (fields.length === 0) {
      return '[\n  {"name": "nombre", "type": "text", "mandatory": true},\n  {"name": "email", "type": "email", "mandatory": true},\n  {"name": "telefono", "type": "text", "mandatory": false}\n]';
    }
    const ingFields = [
      { name: "fechaAlta", type: "date", mandatory: true, description: "Fecha de creaci\xF3n del registro", validationRules: "Formato ISO 8601" },
      { name: "usuarioAlta", type: "text", mandatory: true, length: 50, description: "Usuario que cre\xF3 el registro", validationRules: "Debe existir en el sistema de usuarios" },
      { name: "fechaModificacion", type: "date", mandatory: false, description: "Fecha de \xFAltima modificaci\xF3n", validationRules: "Fecha posterior a fechaAlta" },
      { name: "usuarioModificacion", type: "text", mandatory: false, length: 50, description: "Usuario que modific\xF3 el registro", validationRules: "Debe existir en el sistema de usuarios" }
    ];
    fields.push(...ingFields);
    return JSON.stringify(fields, null, 2);
  }
  generateSmartFilters(description) {
    const keywords = description.toLowerCase();
    let filters = [];
    if (keywords.includes("cliente") || keywords.includes("usuario")) {
      filters.push("N\xFAmero de cliente", "Nombre completo", "Email", "Estado del cliente");
    }
    if (keywords.includes("cuenta") || keywords.includes("banking")) {
      filters.push("N\xFAmero de cuenta", "Tipo de cuenta", "Estado de cuenta");
    }
    if (keywords.includes("producto") || keywords.includes("servicio")) {
      filters.push("C\xF3digo de producto", "Nombre del producto", "Categor\xEDa");
    }
    if (keywords.includes("fecha") || keywords.includes("periodo") || keywords.includes("tiempo")) {
      filters.push("Fecha desde", "Fecha hasta");
    }
    if (keywords.includes("estado") || keywords.includes("status")) {
      filters.push("Estado", "Estado operativo");
    }
    if (keywords.includes("transaccion") || keywords.includes("movimiento")) {
      filters.push("Tipo de transacci\xF3n", "Monto desde", "Monto hasta");
    }
    if (filters.length === 0) {
      filters = ["C\xF3digo", "Nombre", "Estado", "Fecha de creaci\xF3n desde", "Fecha de creaci\xF3n hasta"];
    }
    return filters.slice(0, 6).join("\n");
  }
  generateSmartColumns(description) {
    const keywords = description.toLowerCase();
    let columns = ["ID"];
    if (keywords.includes("cliente") || keywords.includes("usuario")) {
      columns.push("Nombre Completo", "Email", "Tel\xE9fono", "Estado", "Fecha de Registro");
    } else if (keywords.includes("cuenta")) {
      columns.push("N\xFAmero de Cuenta", "Tipo", "Saldo", "Estado", "Fecha de Apertura");
    } else if (keywords.includes("producto")) {
      columns.push("C\xF3digo", "Nombre del Producto", "Categor\xEDa", "Estado", "Precio");
    } else if (keywords.includes("transaccion") || keywords.includes("movimiento")) {
      columns.push("Fecha", "Tipo", "Monto", "Cuenta Origen", "Cuenta Destino", "Estado");
    } else {
      columns.push("Nombre", "Descripci\xF3n", "Estado", "Fecha de Creaci\xF3n", "\xDAltimo Modificado");
    }
    return columns.slice(0, 8).join("\n");
  }
  generateDefaultEntityFieldsWithINGCompliance() {
    const defaultFields = [
      { name: "numeroCliente", type: "text", mandatory: true, length: 20, description: "N\xFAmero \xFAnico del cliente", validationRules: "Formato alfanum\xE9rico" },
      { name: "nombreCompleto", type: "text", mandatory: true, length: 100, description: "Nombre completo del cliente", validationRules: "Solo letras y espacios" },
      { name: "email", type: "email", mandatory: true, description: "Correo electr\xF3nico", validationRules: "Formato email v\xE1lido" },
      { name: "telefono", type: "text", mandatory: false, length: 15, description: "N\xFAmero de tel\xE9fono", validationRules: "Solo n\xFAmeros y s\xEDmbolos telef\xF3nicos" },
      { name: "fechaAlta", type: "date", mandatory: true, description: "Fecha de creaci\xF3n", validationRules: "Formato ISO 8601" },
      { name: "usuarioAlta", type: "text", mandatory: true, length: 50, description: "Usuario creador", validationRules: "Debe existir en el sistema" },
      { name: "fechaModificacion", type: "date", mandatory: false },
      { name: "usuarioModificacion", type: "text", mandatory: false, length: 50 }
    ];
    return JSON.stringify(defaultFields, null, 2);
  }
  cleanInputText(text2) {
    text2 = text2.replace(/^["'"'"„«»]+|["'"'"„«»]+$/g, "");
    text2 = text2.replace(/"([^"]+)"/g, "$1");
    text2 = text2.replace(/'([^']+)'/g, "$1");
    text2 = text2.replace(/'([^']+)'/g, "$1");
    text2 = text2.replace(/"([^"]+)"/g, "$1");
    text2 = text2.replace(/\s+/g, " ").trim();
    if (text2.length > 0) {
      text2 = text2.charAt(0).toUpperCase() + text2.slice(1).toLowerCase();
    }
    return text2;
  }
  formatProfessionalText(text2) {
    text2 = this.cleanInputText(text2);
    text2 = text2.charAt(0).toUpperCase() + text2.slice(1);
    if (!text2.endsWith(".") && !text2.endsWith(";") && !text2.endsWith(":")) {
      text2 += ".";
    }
    return text2;
  }
  formatBusinessRuleText(text2) {
    text2 = text2.replace(/^["'"'"„«»]+|["'"'"„«»]+$/g, "");
    text2 = text2.replace(/"([^"]+)"/g, "$1");
    text2 = text2.replace(/'([^']+)'/g, "$1");
    text2 = text2.replace(/'([^']+)'/g, "$1");
    text2 = text2.replace(/"([^"]+)"/g, "$1");
    text2 = text2.replace(/\s+/g, " ").trim();
    if (text2.length > 0) {
      text2 = text2.charAt(0).toUpperCase() + text2.slice(1);
    }
    if (!text2.endsWith(".") && !text2.endsWith(";") && !text2.endsWith(":")) {
      text2 += ".";
    }
    return text2;
  }
  generateIntelligentWireframeDescription(fieldValue, context) {
    const formData = context?.fullFormData;
    if (formData && formData.useCaseType === "entidad") {
      return this.generateEntitySearchWireframe(fieldValue, formData);
    } else if (formData && (formData.useCaseType === "api" || formData.useCaseType === "proceso")) {
      return this.generateServiceWireframe(fieldValue, formData);
    }
    if (!fieldValue || fieldValue.trim() === "") {
      return "Wireframe ING con panel de b\xFAsqueda (filtros: N\xFAmero de cliente, Apellido, DNI), botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING mostrando columnas relevantes y botones Editar/Eliminar por fila. UI textual seg\xFAn minuta ING.";
    }
    let description = this.cleanInputText(fieldValue);
    const text2 = description.toLowerCase();
    if (text2.length < 50) {
      if (text2.includes("buscar") || text2.includes("filtro")) {
        description = `Panel de b\xFAsqueda ING con ${description}, botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING y opciones de editar/eliminar por fila.`;
      } else if (text2.includes("formulario") || text2.includes("form")) {
        description = `Formulario ING estructurado con ${description}. Incluye validaciones ING est\xE1ndar y botones Guardar/Cancelar. Layout seg\xFAn minuta ING.`;
      } else if (text2.includes("tabla") || text2.includes("list")) {
        description = `${description} con paginado ING, ordenamiento y botones de acci\xF3n (Editar/Eliminar/Ver Detalle) por fila seg\xFAn est\xE1ndares ING.`;
      } else {
        description = `Wireframe ING con ${description}. Incluye botones est\xE1ndar (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado ING. UI textual describiendo layout seg\xFAn minuta ING.`;
      }
    } else {
      if (!text2.includes("ing") && !text2.includes("boton") && !text2.includes("paginado")) {
        description += ". Incluye botones est\xE1ndar ING (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado seg\xFAn minuta ING";
      }
    }
    return this.formatProfessionalText(description);
  }
  generateEntitySearchWireframe(userDescription, formData) {
    const filters = formData.searchFilters || [];
    const columns = formData.resultColumns || [];
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : "";
    const wireframe = `Wireframe textual ING para buscador de entidades ${formData.useCaseName || "entidad"}.

IMPORTANTE: Este wireframe usa EXACTAMENTE los datos provistos en el formulario. NO sustituir con valores gen\xE9ricos.

Panel de b\xFAsqueda superior con los siguientes filtros${filters.length > 0 ? ":" : " (no especificados por el usuario):"}
${filters.length > 0 ? filters.map((filter) => `- ${filter}`).join("\n") : "- (El usuario no especific\xF3 filtros)"}

Botones: Buscar, Limpiar y Agregar (estilo ING est\xE1ndar).

Tabla de resultados con paginado ING activado, mostrando las siguientes columnas${columns.length > 0 ? ":" : " (no especificadas por el usuario):"}
${columns.length > 0 ? columns.map((column) => `- ${column}`).join("\n") : "- (El usuario no especific\xF3 columnas)"}

Cada fila incluye botones Editar y Eliminar al final.

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ""}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).`;
    return this.formatProfessionalText(wireframe);
  }
  generateServiceWireframe(userDescription, formData) {
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : "";
    const wireframe = `Wireframe textual ING para ${formData.useCaseType === "api" ? "interfaz de API" : "proceso autom\xE1tico"} ${formData.useCaseName || "servicio"}.

Panel de configuraci\xF3n con:
- Par\xE1metros de ejecuci\xF3n ${formData.apiEndpoint ? `(Endpoint: ${formData.apiEndpoint})` : ""}
- Configuraci\xF3n de frecuencia ${formData.serviceFrequency ? `(${formData.serviceFrequency})` : ""}
- Botones: Ejecutar, Configurar, Ver Logs

Panel de monitoreo con:
- Estado de ejecuci\xF3n en tiempo real
- Log de actividades
- M\xE9tricas de rendimiento

Panel de resultados con:
- Datos de salida formateados
- C\xF3digos de respuesta
- Mensajes de error/\xE9xito

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ""}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).`;
    return this.formatProfessionalText(wireframe);
  }
  generateCompleteEntityWireframes(userDescription, formData) {
    const filters = formData.searchFilters || [];
    const columns = formData.resultColumns || [];
    const fields = formData.entityFields || [];
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : "";
    const wireframes = `Sistema completo de wireframes ING para gesti\xF3n de ${formData.useCaseName || "entidad"}.

PANTALLA PRINCIPAL - B\xDASQUEDA:
Panel superior con filtros${filters.length > 0 ? ":" : " (definidos por el usuario):"}
${filters.length > 0 ? filters.map((filter) => `- ${filter}`).join("\n") : "- (Filtros especificados en el caso de uso)"}
Botones: Buscar, Limpiar, Agregar.

Tabla de resultados con paginado ING, columnas${columns.length > 0 ? ":" : " (definidas por el usuario):"}
${columns.length > 0 ? columns.map((column) => `- ${column}`).join("\n") : "- (Columnas especificadas en el caso de uso)"}
Botones Editar/Eliminar por fila.

FORMULARIO MODAL - ALTA/MODIFICACI\xD3N:
Campos organizados seg\xFAn est\xE1ndares ING${fields.length > 0 ? ":" : " (definidos por el usuario):"}
${fields.length > 0 ? fields.map((field) => `- ${field.name || field} (${field.type || "text"})${field.mandatory ? " - Obligatorio" : ""}`).join("\n") : "- (Campos especificados en la entidad)"}

Campos de auditor\xEDa obligatorios:
- Fecha de alta (autom\xE1tico)
- Usuario de alta (autom\xE1tico) 
- Fecha de modificaci\xF3n (autom\xE1tico)
- Usuario de modificaci\xF3n (autom\xE1tico)

Botones: Aceptar, Cancelar.

MENSAJES DE CONFIRMACI\xD3N:
- Operaciones exitosas
- Errores de validaci\xF3n
- Confirmaciones de eliminaci\xF3n

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ""}

Formato estilo Microsoft (fuente Segoe UI, layout seg\xFAn minuta ING vr19).`;
    return this.formatProfessionalText(wireframes);
  }
  generateCompleteServiceWireframes(userDescription, formData) {
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : "";
    const wireframes = `Sistema completo de wireframes ING para ${formData.useCaseType === "api" ? "API/Web Service" : "Proceso Autom\xE1tico"} ${formData.useCaseName || "servicio"}.

PANTALLA DE CONFIGURACI\xD3N:
Panel de par\xE1metros${formData.apiEndpoint ? ` (Endpoint: ${formData.apiEndpoint})` : ""}:
- URL/Endpoint de destino
- Credenciales de autenticaci\xF3n
- Headers requeridos
- Timeout y reintentos

Configuraci\xF3n de ejecuci\xF3n${formData.serviceFrequency ? ` (${formData.serviceFrequency})` : ""}:
- Frecuencia programada
- Condiciones de activaci\xF3n
- Par\xE1metros variables

Botones: Guardar Configuraci\xF3n, Probar Conexi\xF3n, Ejecutar Ahora.

PANTALLA DE MONITOREO:
Dashboard en tiempo real con:
- Estado actual del servicio
- \xDAltima ejecuci\xF3n exitosa
- Pr\xF3xima ejecuci\xF3n programada
- M\xE9tricas de rendimiento

Log de actividades:
- Historial de ejecuciones
- Mensajes de error/\xE9xito
- Tiempos de respuesta

PANTALLA DE RESULTADOS:
${formData.useCaseType === "api" ? "Request/Response detallado:" : "Salida del proceso:"}
- Datos de entrada formateados
- Respuesta/resultado obtenido  
- C\xF3digos de estado
- Datos procesados

Botones: Exportar Resultados, Ver Detalles, Reejecutar.

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ""}

Formato estilo Microsoft (fuente Segoe UI, layout seg\xFAn minuta ING vr19).`;
    return this.formatProfessionalText(wireframes);
  }
  generateIntelligentAlternativeFlow(fieldValue) {
    if (!fieldValue || fieldValue.trim() === "") {
      return 'Cliente inexistente: Al buscar un cliente que no existe en la base de datos, mostrar mensaje "Cliente no encontrado" con opciones para "Crear nuevo cliente" o "Refinar b\xFAsqueda".';
    }
    let flow = this.cleanInputText(fieldValue);
    const text2 = flow.toLowerCase();
    if (!flow.includes(":")) {
      if (text2.includes("error") || text2.includes("falla")) {
        flow = `Error del sistema: ${flow}`;
      } else if (text2.includes("no encontr") || text2.includes("inexistent")) {
        flow = `Registro inexistente: ${flow}`;
      } else if (text2.includes("permiso") || text2.includes("acceso")) {
        flow = `Sin permisos: ${flow}`;
      } else {
        flow = `Situaci\xF3n alternativa: ${flow}`;
      }
    }
    if (!text2.includes("mostrar") && !text2.includes("mensaje") && !text2.includes("opcion")) {
      flow += ". Mostrar mensaje informativo con opciones para el usuario";
    }
    return this.formatProfessionalText(flow);
  }
  generateIntelligentWireframesDescription(fieldValue, context) {
    const formData = context?.fullFormData;
    if (formData && formData.useCaseType === "entidad") {
      return this.generateCompleteEntityWireframes(fieldValue, formData);
    } else if (formData && (formData.useCaseType === "api" || formData.useCaseType === "proceso")) {
      return this.generateCompleteServiceWireframes(fieldValue, formData);
    }
    if (!fieldValue || fieldValue.trim() === "") {
      return `Pantalla principal con panel de b\xFAsqueda (filtros definidos por el usuario), botones Buscar/Limpiar/Agregar.
Tabla de resultados con paginado ING mostrando columnas especificadas en el caso de uso y botones Editar/Eliminar.
Formulario modal para alta/modificaci\xF3n con campos definidos en la entidad y validaciones ING.
Mensaje de confirmaci\xF3n para operaciones exitosas o de error seg\xFAn corresponda.`;
    }
    let description = this.cleanInputText(fieldValue);
    const text2 = description.toLowerCase();
    if (text2.length < 100) {
      if (text2.includes("buscar") || text2.includes("filtro")) {
        description = `${description}. Incluye panel superior con filtros ING est\xE1ndar, botones Buscar/Limpiar/Agregar, tabla de resultados con paginado ING y botones de acci\xF3n por fila.`;
      } else if (text2.includes("formulario") || text2.includes("form")) {
        description = `${description}. Modal o p\xE1gina con campos organizados seg\xFAn est\xE1ndares ING, validaciones en tiempo real, botones Guardar/Cancelar y mensajes de confirmaci\xF3n.`;
      } else if (text2.includes("tabla") || text2.includes("list")) {
        description = `${description}. Con paginado ING, ordenamiento por columnas, filtros superiores y botones de acci\xF3n (Editar/Eliminar/Ver) por cada fila.`;
      } else {
        description = `${description}. Sistema completo con wireframes ING: pantalla de b\xFAsqueda con filtros, tabla de resultados paginada, formularios modales para CRUD y mensajes de confirmaci\xF3n/error.`;
      }
    }
    return this.formatProfessionalText(description);
  }
  generateIntelligentAlternativeFlowsDescription(fieldValue) {
    if (!fieldValue || fieldValue.trim() === "") {
      return `Error de sistema: Cuando ocurre un error t\xE9cnico, mostrar mensaje "Error temporal del sistema. Intente nuevamente" con opciones Reintentar/Cancelar.
Registro inexistente: Al buscar un elemento que no existe, mostrar "No se encontraron resultados" con opciones para "Crear nuevo" o "Modificar b\xFAsqueda".
Sin permisos: Cuando el usuario no tiene permisos, mostrar "No tiene autorizaci\xF3n para esta operaci\xF3n" y redirigir a pantalla principal.
Validaci\xF3n fallida: Si fallan las validaciones de negocio, resaltar campos incorrectos con mensajes espec\xEDficos y mantener datos ingresados.`;
    }
    let description = this.cleanInputText(fieldValue);
    const text2 = description.toLowerCase();
    if (text2.length < 100) {
      if (text2.includes("error") || text2.includes("falla")) {
        description = `${description}. Incluir manejo de errores t\xE9cnicos, mensajes claros al usuario, opciones de reintentar/cancelar y log autom\xE1tico del incidente.`;
      } else if (text2.includes("no encontr") || text2.includes("inexistent")) {
        description = `${description}. Mostrar mensaje informativo, opciones para crear nuevo registro o refinar criterios de b\xFAsqueda, mantener contexto de la operaci\xF3n.`;
      } else if (text2.includes("permiso") || text2.includes("acceso")) {
        description = `${description}. Mensaje de autorizaci\xF3n insuficiente, redirecci\xF3n segura a pantalla permitida, log de intento de acceso no autorizado.`;
      } else if (text2.includes("validaci") || text2.includes("campo")) {
        description = `${description}. Resaltar campos con errores, mensajes espec\xEDficos por validaci\xF3n, mantener datos v\xE1lidos ingresados, permitir correcci\xF3n selectiva.`;
      } else {
        description = `${description}. Conjunto completo de flujos alternativos: errores de sistema, registros inexistentes, permisos insuficientes, validaciones fallidas y timeouts de conexi\xF3n.`;
      }
    }
    return this.formatProfessionalText(description);
  }
  generateIntelligentBusinessRules(fieldValue) {
    if (!fieldValue || fieldValue.trim() === "") {
      return '\u2022 El DNI debe ser \xFAnico en el sistema y validar formato correcto\n\u2022 No se puede eliminar un cliente con productos activos\n\u2022 El email debe tener formato v\xE1lido\n\u2022 Solo usuarios con rol "Supervisor" pueden eliminar clientes\n\u2022 Registro autom\xE1tico en bit\xE1cora de alta/modificaci\xF3n/eliminaci\xF3n';
    }
    let text2 = this.cleanInputText(fieldValue);
    let lines = text2.split(/(?:\n•\s*|\n\d+\.\s*|\n-\s*|\n)/m).filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      lines = [text2];
    }
    let items = [];
    lines.forEach((line) => {
      let item = line.trim();
      if (item.length === 0) return;
      item = item.replace(/^\d+\.\s*/, "").replace(/^[•\-]\s*/, "");
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      item = this.cleanInputText(item);
      let bulletItem = `\u2022 ${item}`;
      items.push(this.formatProfessionalText(bulletItem));
    });
    if (items.length === 0) {
      return `\u2022 ${this.formatProfessionalText(text2)}`;
    }
    return items.join("\n");
  }
  generateIntelligentSpecialRequirements(fieldValue, context) {
    const formData = context?.fullFormData;
    const isProcess = formData && (formData.useCaseType === "api" || formData.useCaseType === "proceso");
    if (!fieldValue || fieldValue.trim() === "") {
      let defaultRequirements = '\u2022 Integraci\xF3n con servicio externo de scoring crediticio al momento del alta\n\u2022 Combo "Segmento" cargado din\xE1micamente desde tabla param\xE9trica\n\u2022 Tiempo de respuesta m\xE1ximo: 3 segundos para b\xFAsquedas\n\u2022 Validaci\xF3n HTTPS obligatoria para todas las transacciones\n\u2022 Auditoria completa de cambios con timestamp y usuario';
      if (isProcess) {
        defaultRequirements += "\n\u2022 Para procesos autom\xE1ticos, incluir configurables de paths y credenciales\n\u2022 Usuario/clave de servicios web configurables\n\u2022 URL de web services externos parametrizables";
      }
      return defaultRequirements;
    }
    let text2 = this.cleanInputText(fieldValue);
    let lines = text2.split(/(?:•\s*|^\s*-\s*|\n)/m).filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      lines = [text2];
    }
    let items = [];
    lines.forEach((line) => {
      let item = line.trim();
      if (item.length === 0) return;
      item = item.replace(/^\d+\.\s*/, "").replace(/^[•\-]\s*/, "");
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      item = this.cleanInputText(item);
      let bulletItem = `\u2022 ${item}`;
      items.push(this.formatProfessionalText(bulletItem));
    });
    if (items.length === 0) {
      return `\u2022 ${this.formatProfessionalText(text2)}`;
    }
    return items.join("\n");
  }
  // Provider-specific prompt optimization for different AI models
  buildProviderSpecificPrompt(aiModel, contextPrompt, fieldName, fieldValue, rules) {
    const baseTask = `TAREA: Mejora el siguiente campo seg\xFAn las reglas especificadas.

CAMPO: ${fieldName}
VALOR ACTUAL: "${fieldValue}"
REGLAS: ${rules}`;
    switch (aiModel) {
      case "openai":
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES PASO A PASO:
1. Analiza el valor actual del campo
2. Aplica las reglas especificadas de ING
3. Mejora el contenido manteniendo el contexto profesional
4. Responde \xDANICAMENTE con el contenido mejorado
5. NO agregues explicaciones ni comentarios adicionales
6. NO uses formato markdown ni bloques de c\xF3digo

RESPUESTA:`;
      case "claude":
        return `${contextPrompt}

${baseTask}

CONTEXTO: Est\xE1s mejorando documentaci\xF3n t\xE9cnica para un sistema bancario siguiendo est\xE1ndares ING.

OBJETIVO: Transformar el valor actual en una versi\xF3n profesional que cumpla con las reglas especificadas.

FORMATO DE RESPUESTA: Proporciona \xFAnicamente el contenido mejorado, sin explicaciones adicionales.

CONTENIDO MEJORADO:`;
      case "grok":
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES DIRECTAS:
- Mejora el contenido siguiendo las reglas ING
- Mant\xE9n el estilo profesional bancario
- Responde solo con el contenido mejorado
- Sin explicaciones ni formateo extra

RESULTADO:`;
      case "gemini":
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES:
{
  "accion": "mejorar_campo",
  "estilo": "profesional_bancario_ING",
  "formato_respuesta": "solo_contenido_mejorado",
  "restricciones": ["sin_explicaciones", "sin_markdown", "aplicar_reglas_ING"]
}

CONTENIDO MEJORADO:`;
      default:
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES:
1. Mejora el contenido siguiendo las reglas especificadas
2. Mant\xE9n el contexto profesional ING
3. Responde \xDANICAMENTE con el contenido mejorado
4. NO agregues explicaciones ni comentarios adicionales

CONTENIDO MEJORADO:`;
    }
  }
  // Enhanced multi-level list generator for ING compliance
  generateMultiLevelList(fieldValue, listType) {
    let text2 = fieldValue.trim();
    const parts = text2.split(/[.,;\n]/).filter((part) => part.trim() !== "");
    let items = [];
    parts.forEach((part) => {
      let item = part.trim();
      if (item.length === 0) return;
      item = item.replace(/^\d+\.\s*/, "");
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      item = listType === "businessRules" ? this.formatBusinessRuleText(item) : this.cleanInputText(item);
      const lowerItem = item.toLowerCase();
      let mainItem = `${items.length + 1}. ${item}`;
      let subItems = [];
      if (listType === "businessRules") {
        if (lowerItem.includes("dni") || lowerItem.includes("unico")) {
          subItems.push("a. Validar formato correcto");
          subItems.push("b. Verificar no duplicaci\xF3n en sistema");
        }
        if (lowerItem.includes("validac") && (lowerItem.includes("format") || lowerItem.includes("email"))) {
          subItems.push("a. Verificar estructura de email");
          subItems.push("b. Confirmar dominio v\xE1lido");
        }
        if (lowerItem.includes("eliminar") || lowerItem.includes("activ")) {
          subItems.push("a. Validar productos asociados");
          subItems.push("b. Mostrar mensaje informativo");
        }
      }
      if (listType === "specialRequirements") {
        if (lowerItem.includes("integra") || lowerItem.includes("servicio")) {
          subItems.push("a. Definir formato de intercambio de datos");
          subItems.push("b. Configurar timeout de respuesta");
        }
        if (lowerItem.includes("combo") || lowerItem.includes("dinamico")) {
          subItems.push("a. Cache local para mejorar performance");
          subItems.push("b. Actualizaci\xF3n autom\xE1tica peri\xF3dica");
        }
        if (lowerItem.includes("tiempo") && !lowerItem.includes("m\xE1ximo")) {
          mainItem += " (especificar l\xEDmite m\xE1ximo aceptable)";
        }
        if (lowerItem.includes("validac") && !lowerItem.includes("obligator")) {
          mainItem += " con validaci\xF3n obligatoria";
        }
      }
      if (subItems.length > 0) {
        items.push(mainItem + "\n   " + subItems.join("\n   "));
      } else {
        items.push(mainItem);
      }
    });
    return items.join("\n");
  }
  getDemoFieldImprovement(fieldName, fieldValue, fieldType) {
    const fieldName_lower = fieldName.toLowerCase();
    const valueStr = typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue);
    if (!valueStr || valueStr.trim() === "") {
      if (fieldName_lower.includes("nombre") && fieldName_lower.includes("cliente") || fieldName_lower === "clientname") {
        return "Banco Provincia";
      }
      if (fieldName_lower.includes("proyecto") || fieldName_lower === "projectname") {
        return "Gesti\xF3n Integral de Clientes";
      }
      if (fieldName_lower.includes("codigo")) {
        return "CL005";
      }
      if (fieldName_lower.includes("nombre") && fieldName_lower.includes("caso")) {
        return "Gestionar Clientes Premium";
      }
      if (fieldName_lower.includes("archivo")) {
        return "BP005GestionarClientesPremium";
      }
      if (fieldName_lower.includes("descripcion")) {
        return "Este caso de uso permite al operador del \xE1rea de atenci\xF3n gestionar los datos de clientes del segmento Premium. Incluye funcionalidades de b\xFAsqueda, alta, modificaci\xF3n y eliminaci\xF3n de clientes, validando condiciones espec\xEDficas seg\xFAn pol\xEDticas del banco.";
      }
      if (fieldType === "searchFilter") {
        return "N\xFAmero de cliente";
      }
      if (fieldType === "resultColumn") {
        return "ID Cliente";
      }
      if (fieldType === "entityField") {
        return "numeroCliente";
      }
      if (fieldType === "apiEndpoint") {
        return "https://api.banco.com/v1/clientes";
      }
      if (fieldName_lower.includes("request")) {
        return '{\n  "numeroCliente": "string",\n  "nombre": "string",\n  "email": "string"\n}';
      }
      if (fieldName_lower.includes("response")) {
        return '{\n  "success": "boolean",\n  "data": {\n    "id": "number",\n    "cliente": "object"\n  },\n  "status": 200\n}';
      }
      if (fieldType === "filtersFromText") {
        return this.generateSmartFilters(valueStr);
      }
      if (fieldType === "columnsFromText") {
        return this.generateSmartColumns(valueStr);
      }
      if (fieldType === "fieldsFromText") {
        return this.generateDefaultEntityFieldsWithINGCompliance();
      }
      if (fieldType === "wireframeDescription") {
        return this.generateIntelligentWireframeDescription(fieldValue);
      }
      if (fieldType === "alternativeFlow") {
        return this.generateIntelligentAlternativeFlow(fieldValue);
      }
      if (fieldType === "businessRules") {
        return this.generateIntelligentBusinessRules(fieldValue);
      }
      if (fieldType === "specialRequirements") {
        return this.generateIntelligentSpecialRequirements(fieldValue);
      }
      if (fieldType === "testCasePreconditions") {
        return `\u2022 Usuarios de prueba:
  - Usuario QA_OPERADOR con perfil de operador autorizado
  - Usuario QA_SUPERVISOR con perfil de supervisor para validaciones
  - Usuario QA_ADMIN con permisos administrativos

\u2022 Datos de prueba:
  - Base de datos con datos de prueba precargados
  - Cliente de prueba con DNI 25123456 en estado activo
  - Registros hist\xF3ricos para validar consultas y reportes

\u2022 Infraestructura:
  - Sistema desplegado en ambiente de pruebas
  - Servicios externos configurados (validaci\xF3n DNI, servicios bancarios)
  - Conexi\xF3n estable a base de datos y servicios`;
      }
      return "Ejemplo generado autom\xE1ticamente seg\xFAn reglas ING";
    }
    if (fieldName_lower.includes("nombre") && fieldName_lower.includes("caso")) {
      const verbs = ["gestionar", "crear", "consultar", "administrar", "configurar", "procesar"];
      const startsWithVerb = verbs.some((verb) => fieldValue.toLowerCase().startsWith(verb));
      if (!startsWithVerb) {
        return `Gestionar ${fieldValue}`;
      }
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    if (fieldName_lower.includes("codigo")) {
      if (!/^[A-Z]{2}\d{3}$/.test(fieldValue)) {
        return "CL005";
      }
    }
    if (fieldName_lower.includes("archivo")) {
      return fieldValue.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    }
    if (fieldType === "filtersFromText") {
      const text2 = fieldValue.toLowerCase();
      let filters = [];
      if (text2.includes("filtrar por")) {
        const afterFiltrar = text2.split("filtrar por")[1];
        if (afterFiltrar) {
          filters = afterFiltrar.split(/[,y]/).map((f) => f.trim()).filter((f) => f.length > 0).map((f) => {
            return f.replace(/^(el|la|los|las|de|del|para|con)\s+/gi, "").trim().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
          });
        }
      }
      if (filters.length === 0) {
        return "Nombre\nFecha de registro\nEstado\nTipo";
      }
      return filters.join("\n");
    }
    if (fieldType === "testCasePreconditions" && valueStr.trim()) {
      const lines = valueStr.split("\n").filter((line) => line.trim());
      let formatted = "";
      const hasUsersSection = lines.some((line) => line.toLowerCase().includes("usuario"));
      const hasDataSection = lines.some((line) => line.toLowerCase().includes("dato"));
      const hasInfraSection = lines.some((line) => line.toLowerCase().includes("infraestructura") || line.toLowerCase().includes("sistema"));
      if (!hasUsersSection) {
        formatted += "\u2022 Usuarios de prueba:\n";
        formatted += "  - Usuario con permisos necesarios para ejecutar las pruebas\n\n";
      }
      if (!hasDataSection) {
        formatted += "\u2022 Datos de prueba:\n";
        formatted += "  - Datos necesarios precargados en el sistema\n\n";
      }
      if (!hasInfraSection) {
        formatted += "\u2022 Infraestructura:\n";
        formatted += "  - Sistema disponible y accesible\n";
      }
      if (hasUsersSection || hasDataSection || hasInfraSection) {
        formatted = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().includes("usuario") && trimmed.endsWith(":")) {
            return `\u2022 ${trimmed}`;
          }
          if (trimmed.toLowerCase().includes("dato") && trimmed.endsWith(":")) {
            return `\u2022 ${trimmed}`;
          }
          if ((trimmed.toLowerCase().includes("infraestructura") || trimmed.toLowerCase().includes("sistema")) && trimmed.endsWith(":")) {
            return `\u2022 ${trimmed}`;
          }
          if (trimmed.startsWith("-") || trimmed.startsWith("\u2022")) {
            return `  ${trimmed.replace(/^[-•]\s*/, "- ")}`;
          }
          return `  - ${trimmed}`;
        }).join("\n");
      }
      return formatted || valueStr;
    }
    if (fieldType === "columnsFromText") {
      const text2 = fieldValue.toLowerCase();
      let columns = [];
      const patterns = [
        "mostrar",
        "columnas de",
        "tener columnas de",
        "incluir",
        "campos de"
      ];
      for (const pattern of patterns) {
        if (text2.includes(pattern)) {
          const afterPattern = text2.split(pattern)[1];
          if (afterPattern) {
            columns = afterPattern.split(/[,y]/).map((c) => c.trim()).filter((c) => c.length > 0).map((c) => {
              return c.replace(/^(el|la|los|las|de|del|para|con)\s+/gi, "").trim().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
            });
            break;
          }
        }
      }
      if (columns.length === 0) {
        return "ID\nNombre\nEmail\nEstado\nFecha Registro";
      }
      return columns.join("\n");
    }
    if (fieldType === "fieldsFromText") {
      return this.generateEnhancedEntityFields(fieldValue);
    }
    if (fieldName_lower.includes("descripcion") || fieldName_lower === "description") {
      const placeholderText = ["completar", "algo relevante", "rellenar", "escribir aqui", "ejemplo"];
      const hasPlaceholder = placeholderText.some(
        (placeholder) => fieldValue.toLowerCase().includes(placeholder)
      );
      if (hasPlaceholder || fieldValue.length < 20) {
        return "Este caso de uso permite al operador del \xE1rea de atenci\xF3n gestionar los datos de clientes del segmento Premium. Incluye funcionalidades de b\xFAsqueda, alta, modificaci\xF3n y eliminaci\xF3n de clientes, validando condiciones espec\xEDficas seg\xFAn pol\xEDticas del banco.";
      }
      const improved = fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
      if (!improved.endsWith(".")) {
        return improved + ".";
      }
      return improved;
    }
    if (fieldName_lower.includes("cliente") || fieldName_lower === "clientname") {
      if (fieldValue.toLowerCase().includes("ejemplo") || fieldValue.toLowerCase().includes("test")) {
        return "Banco Provincia";
      }
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    if (fieldName_lower.includes("proyecto") || fieldName_lower === "projectname") {
      if (fieldValue.toLowerCase().includes("ejemplo") || fieldValue.toLowerCase().includes("test")) {
        return "Gesti\xF3n Integral de Clientes";
      }
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    if (fieldType === "text" || fieldType === "textarea") {
      const improved = fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
      return improved;
    }
    return fieldValue;
  }
  static async generateWithCopilot(prompt) {
    const copilot = getCopilotClient();
    const response = await copilot.chat.completions.create({
      model: "gpt-4",
      // Microsoft Copilot usa modelos GPT
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4e3
    });
    return response.choices[0]?.message?.content || "No response from Microsoft Copilot";
  }
  static async processWithCopilot(systemPrompt, fieldValue) {
    const copilot = getCopilotClient();
    const response = await copilot.chat.completions.create({
      model: "gpt-4",
      // Microsoft Copilot usa modelos GPT
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3,
      max_tokens: 2e3
    });
    return response.choices[0]?.message?.content || "No response from Microsoft Copilot";
  }
};

// server/services/document-service.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber, VerticalAlign, ImageRun, TabStopType } from "docx";
import * as fs from "fs";
import * as path from "path";

// server/services/spell-checker.ts
var ACCENT_CORRECTIONS = [
  // Common business/banking terms
  { incorrect: "descripcion", correct: "descripci\xF3n", context: "word-boundary" },
  { incorrect: "operacion", correct: "operaci\xF3n", context: "word-boundary" },
  { incorrect: "informacion", correct: "informaci\xF3n", context: "word-boundary" },
  { incorrect: "validacion", correct: "validaci\xF3n", context: "word-boundary" },
  { incorrect: "autenticacion", correct: "autenticaci\xF3n", context: "word-boundary" },
  { incorrect: "autorizacion", correct: "autorizaci\xF3n", context: "word-boundary" },
  { incorrect: "transaccion", correct: "transacci\xF3n", context: "word-boundary" },
  { incorrect: "configuracion", correct: "configuraci\xF3n", context: "word-boundary" },
  { incorrect: "administracion", correct: "administraci\xF3n", context: "word-boundary" },
  { incorrect: "gestion", correct: "gesti\xF3n", context: "word-boundary" },
  { incorrect: "creacion", correct: "creaci\xF3n", context: "word-boundary" },
  { incorrect: "modificacion", correct: "modificaci\xF3n", context: "word-boundary" },
  { incorrect: "eliminacion", correct: "eliminaci\xF3n", context: "word-boundary" },
  { incorrect: "integracion", correct: "integraci\xF3n", context: "word-boundary" },
  { incorrect: "notificacion", correct: "notificaci\xF3n", context: "word-boundary" },
  { incorrect: "verificacion", correct: "verificaci\xF3n", context: "word-boundary" },
  { incorrect: "confirmacion", correct: "confirmaci\xF3n", context: "word-boundary" },
  { incorrect: "cancelacion", correct: "cancelaci\xF3n", context: "word-boundary" },
  { incorrect: "actualizacion", correct: "actualizaci\xF3n", context: "word-boundary" },
  { incorrect: "revision", correct: "revisi\xF3n", context: "word-boundary" },
  { incorrect: "sesion", correct: "sesi\xF3n", context: "word-boundary" },
  { incorrect: "usuario", correct: "usuario", context: "word-boundary" },
  // This one is correct, keeping for completeness
  // Common verbs in infinitive (frequently used in use cases)
  { incorrect: "verificar", correct: "verificar", context: "word-boundary" },
  // Already correct
  { incorrect: "validar", correct: "validar", context: "word-boundary" },
  // Already correct
  { incorrect: "procesar", correct: "procesar", context: "word-boundary" },
  // Already correct
  // Time and date related
  { incorrect: "ejecucion", correct: "ejecuci\xF3n", context: "word-boundary" },
  { incorrect: "programacion", correct: "programaci\xF3n", context: "word-boundary" },
  { incorrect: "planificacion", correct: "planificaci\xF3n", context: "word-boundary" },
  // Common adjectives
  { incorrect: "automatico", correct: "autom\xE1tico", context: "word-boundary" },
  { incorrect: "automatica", correct: "autom\xE1tica", context: "word-boundary" },
  { incorrect: "electronico", correct: "electr\xF3nico", context: "word-boundary" },
  { incorrect: "electronica", correct: "electr\xF3nica", context: "word-boundary" },
  { incorrect: "publico", correct: "p\xFAblico", context: "word-boundary" },
  { incorrect: "publica", correct: "p\xFAblica", context: "word-boundary" },
  { incorrect: "basico", correct: "b\xE1sico", context: "word-boundary" },
  { incorrect: "basica", correct: "b\xE1sica", context: "word-boundary" },
  { incorrect: "logico", correct: "l\xF3gico", context: "word-boundary" },
  { incorrect: "logica", correct: "l\xF3gica", context: "word-boundary" },
  { incorrect: "tecnico", correct: "t\xE9cnico", context: "word-boundary" },
  { incorrect: "tecnica", correct: "t\xE9cnica", context: "word-boundary" },
  { incorrect: "practico", correct: "pr\xE1ctico", context: "word-boundary" },
  { incorrect: "practica", correct: "pr\xE1ctica", context: "word-boundary" },
  // Common nouns
  { incorrect: "sistema", correct: "sistema", context: "word-boundary" },
  // Already correct
  { incorrect: "metodo", correct: "m\xE9todo", context: "word-boundary" },
  { incorrect: "codigo", correct: "c\xF3digo", context: "word-boundary" },
  { incorrect: "numero", correct: "n\xFAmero", context: "word-boundary" },
  { incorrect: "telefono", correct: "tel\xE9fono", context: "word-boundary" },
  { incorrect: "direccion", correct: "direcci\xF3n", context: "word-boundary" },
  { incorrect: "ubicacion", correct: "ubicaci\xF3n", context: "word-boundary" },
  { incorrect: "razon", correct: "raz\xF3n", context: "word-boundary" },
  { incorrect: "organizacion", correct: "organizaci\xF3n", context: "word-boundary" },
  { incorrect: "institucion", correct: "instituci\xF3n", context: "word-boundary" },
  { incorrect: "solucion", correct: "soluci\xF3n", context: "word-boundary" },
  { incorrect: "funcion", correct: "funci\xF3n", context: "word-boundary" },
  { incorrect: "opcion", correct: "opci\xF3n", context: "word-boundary" },
  { incorrect: "situacion", correct: "situaci\xF3n", context: "word-boundary" },
  { incorrect: "condicion", correct: "condici\xF3n", context: "word-boundary" },
  { incorrect: "posicion", correct: "posici\xF3n", context: "word-boundary" },
  { incorrect: "relacion", correct: "relaci\xF3n", context: "word-boundary" },
  { incorrect: "aplicacion", correct: "aplicaci\xF3n", context: "word-boundary" },
  { incorrect: "comunicacion", correct: "comunicaci\xF3n", context: "word-boundary" },
  { incorrect: "presentacion", correct: "presentaci\xF3n", context: "word-boundary" },
  { incorrect: "documentacion", correct: "documentaci\xF3n", context: "word-boundary" },
  // Banking specific terms
  { incorrect: "transferencia", correct: "transferencia", context: "word-boundary" },
  // Already correct
  { incorrect: "cuenta", correct: "cuenta", context: "word-boundary" },
  // Already correct
  { incorrect: "deposito", correct: "dep\xF3sito", context: "word-boundary" },
  { incorrect: "credito", correct: "cr\xE9dito", context: "word-boundary" },
  { incorrect: "debito", correct: "d\xE9bito", context: "word-boundary" },
  { incorrect: "comision", correct: "comisi\xF3n", context: "word-boundary" },
  { incorrect: "interes", correct: "inter\xE9s", context: "word-boundary" },
  { incorrect: "periodo", correct: "per\xEDodo", context: "word-boundary" },
  { incorrect: "prestamo", correct: "pr\xE9stamo", context: "word-boundary" },
  { incorrect: "garantia", correct: "garant\xEDa", context: "word-boundary" },
  // Pronouns and articles that commonly lose accents
  { incorrect: " el ", correct: " \xE9l ", context: "anywhere" },
  // Only when it should be the pronoun
  { incorrect: " tu ", correct: " t\xFA ", context: "anywhere" },
  // Only when it should be the pronoun
  { incorrect: " mi ", correct: " m\xED ", context: "anywhere" },
  // Only when it should be the pronoun
  { incorrect: " si ", correct: " s\xED ", context: "anywhere" }
  // Only when it should be "yes"
];
var EXCLUSION_PATTERNS = [
  // Banking codes and abbreviations
  /\b[A-Z]{2,}\b/,
  // All caps abbreviations (CBU, CUIT, DNI, API, etc.)
  /\b[A-Z]{2}\d{3}\b/,
  // Code patterns like ST003, BP001
  /\b\w+\d+\b/,
  // Words with numbers (cuenta1, dato1, etc.)
  /\b\d+\w*\b/,
  // Numbers with letters (2FA, 3DES, etc.)
  // Technical terms (English/Mixed)
  /\b(endpoint|token|timestamp|payload|response|request|callback|webhook)\b/i,
  /\b(username|password|login|logout|signup|email|url|uri|http|https)\b/i,
  /\b(json|xml|html|css|javascript|sql|api|rest|soap|oauth)\b/i,
  // File extensions and technical formats
  /\.\w{2,4}\b/,
  // .docx, .json, .xml, etc.
  // Compound technical words
  /\b\w+[A-Z]\w+\b/,
  // camelCase words (fechaCreacion, montoMaximo, etc.)
  /\b\w+_\w+\b/,
  // snake_case words
  /\b\w+-\w+\b/,
  // hyphenated words
  // Database/field names
  /\bid\w*\b/i,
  // id, idCliente, idOperacion, etc.
  /\b\w*(Id|ID)\b/
  // clienteId, operacionID, etc.
];
var SpellChecker = class {
  /**
   * Applies selective accent correction to text
   * Only corrects common Spanish words, preserves technical terms
   */
  static correctAccents(text2) {
    if (!text2 || typeof text2 !== "string") {
      return text2;
    }
    let correctedText = text2;
    for (const rule of ACCENT_CORRECTIONS) {
      if (this.shouldExclude(rule.incorrect, correctedText)) {
        continue;
      }
      let regex;
      if (rule.context === "word-boundary") {
        regex = new RegExp(`\\b${this.escapeRegex(rule.incorrect)}\\b`, "gi");
      } else {
        regex = new RegExp(this.escapeRegex(rule.incorrect), "gi");
      }
      correctedText = correctedText.replace(regex, (match) => {
        return this.preserveCase(match, rule.correct);
      });
    }
    return correctedText;
  }
  /**
   * Check if a word should be excluded from correction
   */
  static shouldExclude(word, context) {
    const wordRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, "gi");
    const matches = Array.from(context.matchAll(wordRegex));
    for (const match of matches) {
      const matchText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchText.length;
      const beforeContext = context.substring(Math.max(0, startIndex - 20), startIndex);
      const afterContext = context.substring(endIndex, Math.min(context.length, endIndex + 20));
      const fullContext = beforeContext + matchText + afterContext;
      for (const pattern of EXCLUSION_PATTERNS) {
        if (pattern.test(fullContext)) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Escape special regex characters
   */
  static escapeRegex(text2) {
    return text2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Preserve the original case when replacing
   */
  static preserveCase(original, replacement) {
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    return replacement.toLowerCase();
  }
  /**
   * Check if text contains any technical terms that might need protection
   */
  static containsTechnicalTerms(text2) {
    return EXCLUSION_PATTERNS.some((pattern) => pattern.test(text2));
  }
  /**
   * Get a summary of what would be corrected (for debugging/preview)
   */
  static getCorrectionsPreview(text2) {
    const corrections = [];
    for (const rule of ACCENT_CORRECTIONS) {
      if (this.shouldExclude(rule.incorrect, text2)) {
        continue;
      }
      const regex = rule.context === "word-boundary" ? new RegExp(`\\b${this.escapeRegex(rule.incorrect)}\\b`, "gi") : new RegExp(this.escapeRegex(rule.incorrect), "gi");
      const matches = Array.from(text2.matchAll(regex));
      for (const match of matches) {
        corrections.push({
          original: match[0],
          corrected: this.preserveCase(match[0], rule.correct)
        });
      }
    }
    return corrections;
  }
};

// server/services/document-service.ts
var DocumentService = class {
  // Helper method to create styled heading with borders
  static createStyledHeading(text2) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 240 },
      indent: { left: 120 },
      // 0.21 cm
      keepNext: true,
      keepLines: true,
      border: {
        bottom: {
          color: "006BB6",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8
          // 1pt
        },
        left: {
          color: "006BB6",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 8
          // 1pt
        }
      },
      children: [new TextRun({
        text: text2.toUpperCase(),
        // Simulating small caps with uppercase
        bold: true,
        size: 24,
        // 12pt
        color: "006BB6",
        font: "Segoe UI"
      })]
    });
  }
  // Generate DOCX directly from form data - no HTML conversion needed
  static async generateDirectFromFormData(formData, testCases, customHeaderImage, aiGeneratedContent) {
    const logoPath = path.join(process.cwd(), "attached_assets", "image_1754501839527.png");
    let logoImageData = null;
    if (fs.existsSync(logoPath)) {
      logoImageData = fs.readFileSync(logoPath);
    } else {
      const fallbackLogos = ["Logo.png", "company-logo.png", "ingematica-logo-full.png"];
      for (const fallback of fallbackLogos) {
        const fallbackPath = path.join(process.cwd(), "attached_assets", fallback);
        if (fs.existsSync(fallbackPath)) {
          logoImageData = fs.readFileSync(fallbackPath);
          break;
        }
      }
    }
    const doc = new Document({
      sections: [{
        children: [
          // Title - Use case name in uppercase
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({
              text: (formData.useCaseName || "CASO DE USO").toUpperCase(),
              bold: true,
              size: 48,
              color: "0070C0",
              font: "Segoe UI Semilight"
            })]
          }),
          // Project Information Section
          this.createStyledHeading("Informaci\xF3n del Proyecto"),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Cliente: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.clientName || "", font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Proyecto: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.projectName || "", font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 C\xF3digo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseCode || "", font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Archivo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.fileName || "", font: "Segoe UI Semilight" })
            ]
          }),
          // Use Case Description Section
          this.createStyledHeading("Descripci\xF3n del Caso de Uso"),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Nombre: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: SpellChecker.correctAccents(formData.useCaseName || ""), font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Tipo: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: formData.useCaseType === "entity" ? "Gesti\xF3n de Entidades" : formData.useCaseType || "", font: "Segoe UI Semilight" })
            ]
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "\u2022 Descripci\xF3n: ", bold: true, font: "Segoe UI Semilight" }),
              new TextRun({ text: SpellChecker.correctAccents(formData.description || ""), font: "Segoe UI Semilight" })
            ]
          }),
          // Add remaining sections based on form data (includes test cases)
          ...this.addFormDataSections(formData, aiGeneratedContent),
          // History table
          ...this.createHistorySection()
        ],
        headers: {
          default: new Header({
            children: [
              // Create header table instead of image
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "006BB6" }
                },
                rows: [
                  new TableRow({
                    height: { value: 500, rule: "exact" },
                    children: [
                      // Logo cell (spans 2 rows)
                      new TableCell({
                        rowSpan: 2,
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: {
                          top: 60,
                          bottom: 60,
                          left: 120,
                          right: 120
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: logoImageData ? [
                              new ImageRun({
                                type: "png",
                                data: logoImageData,
                                transformation: {
                                  width: 160,
                                  // Width adjusted to fit in cell
                                  height: 64
                                  // Height calculated to preserve 199:80 aspect ratio (160 * 80/199 = 64)
                                }
                              })
                            ] : [
                              new TextRun({
                                text: "INGEMATICA",
                                bold: true,
                                size: 24,
                                color: "006BB6",
                                font: "Segoe UI"
                              })
                            ]
                          })
                        ]
                      }),
                      // "Documento de Casos de Uso" cell
                      new TableCell({
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "Documento de Casos de Uso",
                                bold: true,
                                size: 28,
                                // 14pt in Word
                                color: "000000",
                                // Black text instead of blue
                                font: "Segoe UI"
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  new TableRow({
                    height: { value: 700, rule: "exact" },
                    children: [
                      // Project name cell
                      new TableCell({
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: formData.projectName || "Proyecto",
                                bold: true,
                                size: 26,
                                // 13pt in Word
                                color: "000000",
                                // Pure black for consistency
                                font: "Segoe UI Semilight"
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              // Add spacing after header table
              new Paragraph({
                spacing: { after: 240 },
                children: []
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "p\xE1gina ",
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    text: " de ",
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: "Segoe UI Semilight",
                    size: 18
                  }),
                  new TextRun({
                    text: "	" + (formData.useCaseName || "CASO DE USO"),
                    // Tab + use case name
                    font: "Segoe UI Semilight",
                    size: 18
                  })
                ],
                tabStops: [{
                  type: TabStopType.RIGHT,
                  position: 9360
                  // Use specific position like C# version
                }]
              })
            ]
          })
        },
        properties: {
          page: {
            margin: {
              top: 1440,
              // 1 inch = 1440 DOCX units
              right: 1440,
              bottom: 1440,
              left: 1440,
              header: 340
              // 0.6 cm = 340 DOCX units (1 cm = 567 DOCX units)
            }
          }
        }
      }]
    });
    return await Packer.toBuffer(doc);
  }
  static addFormDataSections(formData, aiGeneratedContent) {
    const sections = [];
    if (formData.useCaseType === "api") {
      console.log("\u{1F4C4} Generating API sections directly from formData");
      sections.push(this.createStyledHeading("FLUJO PRINCIPAL DE EVENTOS"));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: `1. El cliente realiza una petici\xF3n HTTP ${formData.httpMethod || "POST"} al endpoint ${formData.apiEndpoint || formData.endpoint || "/api/endpoint"}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.requestFormat || formData.requestExample) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Formato de solicitud:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.requestFormat || formData.requestExample || "JSON con los par\xE1metros requeridos",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "2. El sistema valida los datos de entrada",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Validaci\xF3n de estructura del mensaje",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Validaci\xF3n de datos obligatorios",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "3. El sistema procesa la solicitud",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Ejecuta la l\xF3gica de negocio correspondiente",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Registra la operaci\xF3n en el log de auditor\xEDa",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "4. El sistema retorna la respuesta",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.responseFormat || formData.responseExample) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Formato de respuesta:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 120 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.responseFormat || formData.responseExample || "JSON con el resultado de la operaci\xF3n",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      sections.push(this.createStyledHeading("FLUJOS ALTERNATIVOS"));
      const errorCodes = formData.errorCodes || ["400", "401", "403", "404", "500"];
      errorCodes.forEach((code, index) => {
        const errorDescription = code === "400" ? "Solicitud incorrecta - datos de entrada inv\xE1lidos" : code === "401" ? "No autorizado - credenciales inv\xE1lidas o expiradas" : code === "403" ? "Prohibido - sin permisos suficientes para la operaci\xF3n" : code === "404" ? "No encontrado - el recurso solicitado no existe" : code === "500" ? "Error interno del servidor - problema en el procesamiento" : `Error ${code} - error en la aplicaci\xF3n`;
        sections.push(new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: `${index + 1}. Error ${code}: ${errorDescription}`,
            bold: true,
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `a. El sistema detecta un error de tipo ${code}`,
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "b. Se registra el error en el log del sistema",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: index === errorCodes.length - 1 ? 120 : 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `c. Se retorna el c\xF3digo de error ${code} con el mensaje correspondiente`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
      if (formData.businessRules) {
        sections.push(this.createStyledHeading("Reglas de Negocio"));
        let rules = [];
        if (typeof formData.businessRules === "string") {
          rules = formData.businessRules.split("\n").filter((r) => r.trim());
        } else if (Array.isArray(formData.businessRules)) {
          rules = formData.businessRules.filter((r) => r && r.toString().trim());
        }
        rules.forEach((rule, index) => {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 288 },
            children: [new TextRun({
              text: `${index + 1}. ${rule.toString().trim()}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      if (formData.specialRequirements) {
        sections.push(this.createStyledHeading("Requerimientos Especiales"));
        let requirements = [];
        if (typeof formData.specialRequirements === "string") {
          requirements = formData.specialRequirements.split("\n").filter((r) => r.trim());
        } else if (Array.isArray(formData.specialRequirements)) {
          requirements = formData.specialRequirements.filter((r) => r && r.toString().trim());
        } else {
          requirements = [String(formData.specialRequirements)];
        }
        requirements.forEach((req, index) => {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 288 },
            children: [new TextRun({
              text: `${index + 1}. ${req.toString().trim()}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      sections.push(this.createStyledHeading("Precondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.preconditions || "El cliente debe tener credenciales v\xE1lidas de autenticaci\xF3n API y los permisos necesarios para acceder al endpoint.",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(this.createStyledHeading("Postcondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.postconditions || "La operaci\xF3n se completa exitosamente y se registra en el log de auditor\xEDa del sistema.",
          font: "Segoe UI Semilight"
        })]
      }));
      return sections;
    }
    if (formData.useCaseType === "service") {
      console.log("\u{1F4C4} Generating Service/Process sections directly from formData");
      sections.push(this.createStyledHeading("FLUJO PRINCIPAL DE EVENTOS"));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: `1. El servicio se ejecuta ${formData.serviceFrequency || "Diariamente"} a las ${formData.executionTime || "02:00 AM"}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: `a. Frecuencia de ejecuci\xF3n: ${formData.serviceFrequency || "Cada 24 horas"}`,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: `b. Hora programada: ${formData.executionTime || "02:00 AM (configuraci\xF3n est\xE1ndar)"}`,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "2. El proceso inicia autom\xE1ticamente seg\xFAn la programaci\xF3n establecida",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.configurationPaths) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Captura archivos desde rutas configurables:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.configurationPaths || "Las rutas deben ser configurables en el sistema",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      if (formData.webServiceCredentials) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "b. Conecta con web services externos:",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 576 },
          children: [new TextRun({
            text: formData.webServiceCredentials || "Usuario, clave y URL deben ser configurables",
            font: "Segoe UI Semilight"
          })]
        }));
      }
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "3. El sistema procesa los datos seg\xFAn las reglas de negocio",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Valida la integridad de los datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Aplica las transformaciones necesarias",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "c. Registra el progreso en el log de auditor\xEDa",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "4. El proceso genera los resultados y notificaciones",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Genera archivos de salida o actualiza base de datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Env\xEDa notificaciones de finalizaci\xF3n",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(this.createStyledHeading("FLUJOS ALTERNATIVOS"));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "1. Error en captura de archivos",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. El sistema no encuentra archivos en la ruta configurada",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Se registra el error y se notifica al administrador",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "2. Error de conexi\xF3n con web service",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Falla la conexi\xF3n con el servicio externo",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Se intenta reconectar seg\xFAn pol\xEDtica de reintentos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "3. Error en procesamiento de datos",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Se detecta inconsistencia en los datos",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Se genera reporte de errores y se detiene el proceso",
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.businessRules) {
        sections.push(this.createStyledHeading("Reglas de Negocio"));
        let rules = [];
        if (typeof formData.businessRules === "string") {
          rules = formData.businessRules.split("\n").filter((r) => r.trim());
        } else if (Array.isArray(formData.businessRules)) {
          rules = formData.businessRules.filter((r) => r && r.toString().trim());
        }
        rules.forEach((rule, index) => {
          sections.push(new Paragraph({
            spacing: { after: 80 },
            indent: { left: 288 },
            children: [new TextRun({
              text: `${index + 1}. ${rule.toString().trim()}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      sections.push(this.createStyledHeading("Requerimientos Especiales"));
      const serviceRequirements = [];
      if (formData.configurationPaths) {
        serviceRequirements.push("Las rutas de captura de archivos deben ser configurables");
      }
      if (formData.webServiceCredentials) {
        serviceRequirements.push("El usuario, clave y URL del web service deben ser configurables");
      }
      serviceRequirements.push("La frecuencia y hora de ejecuci\xF3n deben ser configurables");
      if (formData.specialRequirements) {
        let additionalReqs = [];
        if (typeof formData.specialRequirements === "string") {
          additionalReqs = formData.specialRequirements.split("\n").filter((r) => r.trim());
        } else if (Array.isArray(formData.specialRequirements)) {
          additionalReqs = formData.specialRequirements.filter((r) => r && r.toString().trim());
        }
        serviceRequirements.push(...additionalReqs);
      }
      serviceRequirements.forEach((req, index) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${req}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
      sections.push(this.createStyledHeading("Precondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.preconditions || "El servicio debe estar configurado correctamente con las credenciales y rutas necesarias para su ejecuci\xF3n autom\xE1tica.",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(this.createStyledHeading("Postcondiciones"));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: formData.postconditions || "El proceso se completa exitosamente y genera los archivos de salida o actualizaciones correspondientes, registrando toda la actividad en el log.",
          font: "Segoe UI Semilight"
        })]
      }));
      return sections;
    }
    if (formData.useCaseType === "entity") {
      sections.push(this.createStyledHeading("Flujo Principal de Eventos"));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "1. Buscar datos de la entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.searchFilters && formData.searchFilters.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          // 0.2 inch = 288 twips
          children: [new TextRun({
            text: "a. Filtros de b\xFAsqueda disponibles:",
            font: "Segoe UI Semilight"
          })]
        }));
        formData.searchFilters.forEach((filter, index) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            // 0.4 inch = 576 twips (additional 0.2)
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${SpellChecker.correctAccents(filter)}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      if (formData.resultColumns && formData.resultColumns.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60, before: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "b. Columnas del resultado de b\xFAsqueda:",
            font: "Segoe UI Semilight"
          })]
        }));
        formData.resultColumns.forEach((column, index) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${SpellChecker.correctAccents(column)}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      sections.push(new Paragraph({
        spacing: { after: 80, before: 80 },
        children: [new TextRun({
          text: "2. Agregar una nueva entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.entityFields && formData.entityFields.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Datos de la entidad:",
            font: "Segoe UI Semilight"
          })]
        }));
        formData.entityFields.forEach((field, index) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${SpellChecker.correctAccents(field.name)} (${field.type}${field.length ? `, ${field.length}` : ""}${field.mandatory ? ", obligatorio" : ", opcional"})${field.description ? ` - ${SpellChecker.correctAccents(field.description)}` : ""}`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      sections.push(new Paragraph({
        spacing: { after: 120, before: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Al agregar se registra autom\xE1ticamente la fecha y usuario de alta",
          font: "Segoe UI Semilight"
        })]
      }));
    }
    if (formData.useCaseType === "entity") {
      sections.push(this.createStyledHeading("Flujos Alternativos"));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: "1. Modificar o actualizar una entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      if (formData.entityFields && formData.entityFields.length > 0) {
        sections.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 288 },
          children: [new TextRun({
            text: "a. Datos de la entidad a modificar:",
            font: "Segoe UI Semilight"
          })]
        }));
        formData.entityFields.forEach((field, index) => {
          sections.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 576 },
            children: [new TextRun({
              text: `${this.toRomanNumeral(index + 1)}. ${field.name} (${field.type}${field.length ? `, ${field.length}` : ""}${field.mandatory ? ", obligatorio" : ", opcional"})`,
              font: "Segoe UI Semilight"
            })]
          }));
        });
      }
      sections.push(new Paragraph({
        spacing: { after: 60, before: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "b. Mostrar el identificador \xFAnico de la entidad",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "c. Mostrar la fecha y el usuario de alta originales",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "d. Al modificar se registra autom\xE1ticamente la fecha y usuario de modificaci\xF3n",
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 80, before: 80 },
        children: [new TextRun({
          text: "2. Eliminar una entidad",
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      sections.push(new Paragraph({
        spacing: { after: 120 },
        indent: { left: 288 },
        children: [new TextRun({
          text: "a. Verificar que la entidad no tenga relaciones con otras entidades antes de eliminar",
          font: "Segoe UI Semilight"
        })]
      }));
    }
    if (formData.businessRules) {
      sections.push(this.createStyledHeading("Reglas de Negocio"));
      let rules = [];
      if (typeof formData.businessRules === "string") {
        rules = formData.businessRules.split("\n").filter((r) => r.trim());
      } else if (Array.isArray(formData.businessRules)) {
        rules = formData.businessRules.filter((r) => r && r.toString().trim());
      }
      rules.forEach((rule, index) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${rule.toString().trim()}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
    }
    if (formData.specialRequirements) {
      sections.push(this.createStyledHeading("Requerimientos Especiales"));
      let requirements = [];
      if (typeof formData.specialRequirements === "string") {
        requirements = formData.specialRequirements.split("\n").filter((r) => r.trim());
      } else if (Array.isArray(formData.specialRequirements)) {
        requirements = formData.specialRequirements.filter((r) => r && r.toString().trim());
      } else {
        requirements = [String(formData.specialRequirements)];
      }
      requirements.forEach((req, index) => {
        sections.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: 288 },
          children: [new TextRun({
            text: `${index + 1}. ${req.toString().trim()}`,
            font: "Segoe UI Semilight"
          })]
        }));
      });
    }
    sections.push(this.createStyledHeading("Precondiciones"));
    sections.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: formData.preconditions || "El usuario debe estar autenticado en el sistema y tener los permisos necesarios para acceder a este caso de uso.",
        font: "Segoe UI Semilight"
      })]
    }));
    sections.push(this.createStyledHeading("Postcondiciones"));
    sections.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: formData.postconditions || "Los datos de la entidad quedan actualizados en el sistema y se registra la auditor\xEDa correspondiente.",
        font: "Segoe UI Semilight"
      })]
    }));
    if (formData.generateWireframes && formData.generatedWireframes) {
      sections.push(this.createStyledHeading("BOCETOS GR\xC1FICOS DE INTERFAZ DE USUARIO"));
      if (formData.generatedWireframes.searchWireframe) {
        sections.push(new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: "Wireframe 1: Interfaz de B\xFAsqueda",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        try {
          let imageData;
          const searchWireframePath = formData.generatedWireframes.searchWireframe;
          if (searchWireframePath.startsWith("data:image/")) {
            const base64Data = searchWireframePath.split(",")[1];
            imageData = Buffer.from(base64Data, "base64");
          } else {
            let filePath = searchWireframePath;
            if (filePath.startsWith("/")) {
              filePath = filePath.substring(1);
            }
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
              imageData = fs.readFileSync(fullPath);
            } else {
              throw new Error(`File not found: ${fullPath}`);
            }
          }
          const searchWidth = 450;
          const searchHeight = 338;
          sections.push(new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "png",
                data: imageData,
                transformation: {
                  width: searchWidth,
                  height: searchHeight
                }
              })
            ]
          }));
        } catch (error) {
          console.error("Error loading search wireframe:", error);
        }
      }
      if (formData.generatedWireframes.formWireframe) {
        sections.push(new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: "Wireframe 2: Formulario de Gesti\xF3n",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        try {
          let imageData;
          const formWireframePath = formData.generatedWireframes.formWireframe;
          if (formWireframePath.startsWith("data:image/")) {
            const base64Data = formWireframePath.split(",")[1];
            imageData = Buffer.from(base64Data, "base64");
          } else {
            let filePath = formWireframePath;
            if (filePath.startsWith("/")) {
              filePath = filePath.substring(1);
            }
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
              imageData = fs.readFileSync(fullPath);
            } else {
              throw new Error(`File not found: ${fullPath}`);
            }
          }
          const formWidth = 450;
          const formHeight = 450;
          sections.push(new Paragraph({
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "png",
                data: imageData,
                transformation: {
                  width: formWidth,
                  height: formHeight
                }
              })
            ]
          }));
        } catch (error) {
          console.error("Error loading form wireframe:", error);
        }
      }
    }
    if (formData.generateTestCase && formData.testSteps && formData.testSteps.length > 0) {
      sections.push(this.createStyledHeading("CASOS DE PRUEBA"));
      if (formData.testCaseObjective) {
        sections.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 120, after: 80 },
          children: [new TextRun({
            text: "Objetivo:",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        sections.push(new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: SpellChecker.correctAccents(String(formData.testCaseObjective || "")),
            font: "Segoe UI Semilight"
          })]
        }));
      }
      if (formData.testCasePreconditions) {
        sections.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 120, after: 80 },
          children: [new TextRun({
            text: "Precondiciones:",
            bold: true,
            size: 24,
            color: "0070C0",
            font: "Segoe UI Semilight"
          })]
        }));
        const preconditionsText = String(formData.testCasePreconditions || "");
        const lines = preconditionsText.split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            const trimmedLine = line.trim();
            let indentLevel = 0;
            let formattedText = trimmedLine;
            if (/^\d+\./.test(trimmedLine)) {
              indentLevel = 0;
            } else if (/^[a-z]\./.test(trimmedLine)) {
              indentLevel = 432;
            } else if (/^[ivx]+\./.test(trimmedLine)) {
              indentLevel = 864;
            } else {
              const leadingSpaces = line.length - line.trimStart().length;
              indentLevel = Math.floor(leadingSpaces / 3) * 288;
            }
            sections.push(new Paragraph({
              spacing: { after: 40 },
              indent: { left: indentLevel },
              children: [new TextRun({
                text: SpellChecker.correctAccents(formattedText),
                font: "Segoe UI Semilight"
              })]
            }));
          }
        });
        sections.push(new Paragraph({
          spacing: { after: 80 }
        }));
      }
      sections.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 120, after: 80 },
        children: [new TextRun({
          text: "Pasos de Prueba:",
          bold: true,
          size: 24,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })]
      }));
      formData.testSteps.forEach((testStep, index) => {
        sections.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 120, after: 60 },
          children: [new TextRun({
            text: `Paso ${testStep.number || index + 1}`,
            bold: true,
            font: "Segoe UI Semilight",
            size: 22
          })]
        }));
        if (testStep.action) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Acci\xF3n: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.action),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        if (testStep.inputData) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Datos de entrada: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.inputData),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        if (testStep.expectedResult) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Resultado esperado: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: SpellChecker.correctAccents(testStep.expectedResult),
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        if (testStep.observations) {
          sections.push(new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: "Observaciones: ",
                bold: true,
                font: "Segoe UI Semilight"
              }),
              new TextRun({
                text: testStep.observations,
                font: "Segoe UI Semilight"
              })
            ]
          }));
        }
        sections.push(new Paragraph({
          bullet: { level: 1 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "Estado: ",
              bold: true,
              font: "Segoe UI Semilight"
            }),
            new TextRun({
              text: "Pendiente",
              font: "Segoe UI Semilight"
            })
          ]
        }));
      });
    }
    return sections;
  }
  static parseHtmlContent(html) {
    const paragraphs = [];
    const cleanText = html.replace(/<ol[^>]*>/gi, "").replace(/<\/ol>/gi, "").replace(/<ul[^>]*>/gi, "").replace(/<\/ul>/gi, "").replace(/<li[^>]*>/gi, "\u2022 ").replace(/<\/li>/gi, "\n").replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "\n").replace(/<strong>/gi, "").replace(/<\/strong>/gi, "").replace(/<[^>]+>/g, "").trim();
    const lines = cleanText.split("\n").filter((line) => line.trim());
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        paragraphs.push(new Paragraph({
          spacing: { after: 80 },
          indent: { left: trimmedLine.startsWith("\u2022") ? 288 : 0 },
          children: [new TextRun({
            text: SpellChecker.correctAccents(trimmedLine),
            font: "Segoe UI Semilight"
          })]
        }));
      }
    });
    return paragraphs;
  }
  static toRomanNumeral(num) {
    const romanNumerals = [
      "i",
      "ii",
      "iii",
      "iv",
      "v",
      "vi",
      "vii",
      "viii",
      "ix",
      "x",
      "xi",
      "xii",
      "xiii",
      "xiv",
      "xv",
      "xvi",
      "xvii",
      "xviii",
      "xix",
      "xx"
    ];
    return romanNumerals[num - 1] || num.toString();
  }
  static createHistorySection() {
    const today = /* @__PURE__ */ new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const elements = [];
    elements.push(this.createStyledHeading("HISTORIA DE REVISIONES Y APROBACIONES"));
    const table = new Table({
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Fecha",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Acci\xF3n",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Responsable",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 2500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "Comentario",
                  bold: true,
                  font: "Segoe UI Semilight"
                })]
              })],
              shading: { fill: "DEEAF6" },
              width: { size: 4500, type: WidthType.DXA }
            })
          ]
        }),
        // Data row
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: formattedDate,
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Creaci\xF3n",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Sistema",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 2500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: "Versi\xF3n original",
                  font: "Segoe UI Semilight"
                })]
              })],
              width: { size: 4500, type: WidthType.DXA }
            })
          ]
        })
      ],
      width: {
        size: 9500,
        type: WidthType.DXA
      },
      margins: {
        top: 72,
        // 0.05 inches in twips
        bottom: 72,
        right: 72,
        left: 72
      }
    });
    elements.push(table);
    elements.push(new Paragraph({
      spacing: { after: 240 },
      children: []
    }));
    return elements;
  }
  static formatTestCases(testCases, useCaseName) {
    const paragraphs = [];
    paragraphs.push(this.createStyledHeading("CASOS DE PRUEBA"));
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Objetivo:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    paragraphs.push(new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({
        text: `Verificar el funcionamiento completo de la gesti\xF3n de entidades: ${useCaseName}`,
        font: "Segoe UI Semilight"
      })]
    }));
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Precondiciones:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    const preconditions = [
      "Usuario autenticado en el sistema",
      "Permisos de acceso configurados correctamente",
      "Sistema operativo y base de datos disponibles",
      "Conexi\xF3n de red estable",
      "Datos de prueba disponibles en la base de datos",
      "Validaciones de negocio configuradas"
    ];
    preconditions.forEach((condition) => {
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "\u2022 ", font: "Segoe UI Semilight" }),
          new TextRun({ text: condition, font: "Segoe UI Semilight" })
        ]
      }));
    });
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 80 },
      children: [new TextRun({
        text: "Pasos de Prueba:",
        bold: true,
        size: 24,
        color: "0070C0",
        font: "Segoe UI Semilight"
      })]
    }));
    testCases.forEach((testCase, index) => {
      paragraphs.push(new Paragraph({
        spacing: { after: 120, before: 80 },
        children: [new TextRun({
          text: `${index + 1}. ${testCase.action}`,
          bold: true,
          font: "Segoe UI Semilight"
        })]
      }));
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "\u2022 Datos de Entrada: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.inputData, font: "Segoe UI Semilight" })
        ]
      }));
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "\u2022 Resultado Esperado: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.expectedResult, font: "Segoe UI Semilight" })
        ]
      }));
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: "\u2022 Observaciones: ", bold: true, font: "Segoe UI Semilight" }),
          new TextRun({ text: testCase.observations, font: "Segoe UI Semilight" })
        ]
      }));
    });
    return paragraphs;
  }
  static createHistoryTable() {
    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Fecha", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Acci\xF3n", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Responsable", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Comentario", bold: true, font: "Segoe UI Semilight", size: 20 })]
              })],
              shading: { fill: "D9E2F3" }
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "27/7/2025", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Versi\xF3n original", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Sistema", font: "Segoe UI Semilight", size: 20 })]
              })]
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Documento generado autom\xE1ticamente", font: "Segoe UI Semilight", size: 20 })]
              })]
            })
          ]
        })
      ],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "666666" }
      }
    });
  }
  static addTestCasesToDocument(paragraphs, testCaseData) {
    const testCaseTitle = new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: "CASOS DE PRUEBA",
          bold: true,
          size: 28,
          color: "0070C0",
          font: "Segoe UI Semilight"
        })
      ]
    });
    paragraphs.push(testCaseTitle);
    const objective = testCaseData.testCaseObjective || testCaseData.objective;
    if (objective) {
      const objectiveTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Objetivo:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(objectiveTitle);
      const objectiveContent = new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: objective,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(objectiveContent);
    }
    const preconditions = testCaseData.testCasePreconditions || testCaseData.preconditions;
    if (preconditions) {
      const preconditionsTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Precondiciones:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(preconditionsTitle);
      const formattedPreconditions = this.formatPreconditionsForDocx(preconditions);
      if (typeof formattedPreconditions === "string") {
        const preconditionsContent = new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: formattedPreconditions,
              size: 22,
              font: "Segoe UI Semilight"
            })
          ]
        });
        paragraphs.push(preconditionsContent);
      } else {
        paragraphs.push(...formattedPreconditions);
      }
    }
    if (testCaseData.testSteps && testCaseData.testSteps.length > 0) {
      const testStepsTitle = new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "Pasos de Prueba:",
            bold: true,
            size: 22,
            font: "Segoe UI Semilight"
          })
        ]
      });
      paragraphs.push(testStepsTitle);
      const testStepsTable = this.createTestCaseTable(testCaseData.testSteps);
      paragraphs.push(testStepsTable);
    }
  }
  static formatPreconditionsForDocx(preconditions) {
    if (typeof preconditions === "string" && /^\d+\./.test(preconditions.trim())) {
      return preconditions;
    }
    if (typeof preconditions === "string") {
      const lines = preconditions.split("\n");
      const cleanedLines = [];
      let currentSection = "";
      let sectionNumber = 1;
      let itemLetter = "a";
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("\u2022 \u2022")) {
          continue;
        }
        if (trimmedLine.startsWith("\u2022") && trimmedLine.endsWith(":")) {
          currentSection = trimmedLine.replace(/^•\s*/, "").replace(/:$/, "");
          cleanedLines.push(`${sectionNumber}. ${currentSection}`);
          sectionNumber++;
          itemLetter = "a";
        } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("\u2022")) {
          let text2 = trimmedLine.replace(/^[-•]\s*/, "");
          text2 = text2.replace(/\[object Object\]/g, "").replace(/\{[^}]+\}/g, (match) => {
            try {
              const obj = JSON.parse(match);
              if (obj.requirement) return obj.requirement;
              if (obj.requisito) return obj.requisito;
              if (obj.user) return obj.user;
              if (obj.description) return obj.description;
              return "";
            } catch {
              return "";
            }
          }).trim();
          if (text2) {
            cleanedLines.push(`   ${itemLetter}. ${text2}`);
            itemLetter = String.fromCharCode(itemLetter.charCodeAt(0) + 1);
          }
        }
      }
      if (cleanedLines.length > 0) {
        return cleanedLines.join("\n");
      }
    }
    return `1. Usuarios de prueba
   a. Usuario con perfil autorizado con permisos completos
   b. Usuario con permisos limitados
   c. Usuario sin acceso al m\xF3dulo
   
2. Datos de prueba
   a. Registros v\xE1lidos que cumplen con todas las validaciones
   b. Registros inv\xE1lidos para pruebas de validaci\xF3n
   
3. Infraestructura y configuraci\xF3n
   a. Sistema desplegado en ambiente de pruebas
   b. Base de datos con datos de prueba precargados
   c. Servicios externos configurados o simulados`;
  }
  static createTestCaseTable(testSteps) {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "#",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 5, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Acci\xF3n",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Datos de entrada",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Resultado esperado",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Observaciones",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Estado\n(P/F)",
              bold: true,
              size: 18,
              font: "Segoe UI Semilight"
            })]
          })],
          width: { size: 7, type: WidthType.PERCENTAGE },
          shading: { fill: "DEEAF6" },
          borders: this.getTableBorders()
        })
      ],
      tableHeader: true
    });
    const dataRows = testSteps.map((step) => new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: step.number?.toString() || "",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            alignment: AlignmentType.CENTER
          })],
          borders: this.getTableBorders(),
          width: { size: 5, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: step.action || "",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 20, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: step.inputData || "",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 18, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: step.expectedResult || "",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 22, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: step.observations || "",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            spacing: { after: 120 }
          })],
          borders: this.getTableBorders(),
          width: { size: 18, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: "Pendiente",
              size: 18,
              font: "Segoe UI Semilight"
            })],
            alignment: AlignmentType.CENTER
          })],
          borders: this.getTableBorders(),
          width: { size: 7, type: WidthType.PERCENTAGE }
        })
      ]
    }));
    return new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "666666" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "666666" }
      }
    });
  }
  static getTableBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    };
  }
};

// server/services/minute-analysis-service.ts
var MinuteAnalysisService = class {
  constructor(aiService) {
    this.aiService = aiService;
  }
  async analyzeMinute(text2, useCaseType, aiModel) {
    if (aiModel === "demo") {
      return this.generateDemoAnalysis(useCaseType);
    }
    const prompts = this.buildAnalysisPrompts(useCaseType);
    try {
      const analysisResult = await AIService.processFieldWithAI(
        prompts.systemPrompt,
        text2,
        aiModel
      );
      return this.parseAnalysisResult(analysisResult, useCaseType);
    } catch (error) {
      console.error("Error analyzing minute:", error);
      return this.generateDemoAnalysis(useCaseType);
    }
  }
  buildAnalysisPrompts(useCaseType) {
    const baseSystemPrompt = `
Eres un analista de sistemas experto en casos de uso seg\xFAn est\xE1ndares ING.
Analiza el texto de la minuta proporcionada y extrae la informaci\xF3n relevante para completar autom\xE1ticamente un formulario de caso de uso.

IMPORTANTE: Responde \xDANICAMENTE con un objeto JSON v\xE1lido sin explicaciones adicionales.
`;
    const context = {
      step: "minute-analysis",
      useCaseType,
      action: "parse-minute"
    };
    switch (useCaseType) {
      case "entity":
        return {
          systemPrompt: baseSystemPrompt + this.getEntityAnalysisRules(),
          context
        };
      case "api":
        return {
          systemPrompt: baseSystemPrompt + this.getApiAnalysisRules(),
          context
        };
      case "service":
        return {
          systemPrompt: baseSystemPrompt + this.getServiceAnalysisRules(),
          context
        };
      default:
        return {
          systemPrompt: baseSystemPrompt + this.getEntityAnalysisRules(),
          context
        };
    }
  }
  getEntityAnalysisRules() {
    return `
Para casos de uso tipo ENTIDAD, extrae y estructura la siguiente informaci\xF3n:

INSTRUCCIONES CR\xCDTICAS DE EXTRACCI\xD3N:
1. clientName: Es el nombre de la EMPRESA/BANCO/ORGANIZACI\xD3N cliente (NO el nombre del caso de uso)
   - Buscar palabras como "Banco", "Cohen", "Macro", "Provincia", nombres de empresas
   - Ejemplo correcto: "Cohen Aliados Financieros", "Banco Macro", "Banco Provincia"
   
2. projectName: Es el nombre del PROYECTO o SISTEMA (NO el caso de uso)
   - Buscar frases como "Sistema de", "M\xF3dulo de", "Plataforma de"
   - Si no est\xE1 expl\xEDcito, inferir del contexto (ej: si habla de proveedores, podr\xEDa ser "Sistema de Gesti\xF3n de Proveedores")
   - NO dejar vac\xEDo si se puede inferir del contexto
   
3. useCaseCode: Es el C\xD3DIGO alfanum\xE9rico del caso de uso
   - Formato: letras+n\xFAmeros (ej: PV003, BP005, UC001)
   - NO confundir con nombres o descripciones
   
4. useCaseName: Es el NOMBRE del caso de uso (acci\xF3n + entidad)
   - DEBE empezar con verbo infinitivo
   - Ejemplo: "Gestionar Clientes", "Mostrar proveedores", "Consultar Saldos"
   - NO poner aqu\xED el nombre del cliente ni proyecto

5. description: Descripci\xF3n del QU\xC9 HACE el caso de uso
   - Si viene muy corta (menos de 10 palabras), devolver tal cual viene
   - NO expandir aqu\xED, solo extraer lo que dice la minuta

NUNCA MEZCLAR:
- NO poner el nombre del cliente en useCaseName
- NO poner el nombre del caso de uso en clientName
- NO dejar projectName vac\xEDo si se puede inferir

\u{1F6A8} REGLA CR\xCDTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo c\xF3digo + descripci\xF3n sin extensiones
- Ejemplo correcto: "ST003GestionarTransferencias" (NO "ST003GestionarTransferencias.json")
- Si encuentras extensiones, elim\xEDnalas completamente

{
  "clientName": "Nombre de la empresa/banco cliente",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "C\xF3digo alfanum\xE9rico del caso de uso", 
  "useCaseName": "Nombre del caso de uso con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patr\xF3n: c\xF3digo+descripci\xF3n",
  "description": "Descripci\xF3n del objetivo del caso de uso tal como viene en la minuta",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no est\xE1 expl\xEDcito",
  "searchFilters": ["usar SOLO filtros mencionados en la minuta"],
  "filtersDescription": "Descripci\xF3n de los filtros de b\xFAsqueda necesarios",
  "resultColumns": ["usar SOLO columnas mencionadas en la minuta"],
  "columnsDescription": "Descripci\xF3n de las columnas que se mostrar\xE1n en resultados",
  "entityFields": [
    {
      "name": "usar SOLO campos mencionados en la minuta",
      "type": "tipo seg\xFAn el campo",
      "mandatory": true,
      "length": 50,
      "description": "Descripci\xF3n clara del prop\xF3sito del campo",
      "validationRules": "Reglas de validaci\xF3n espec\xEDficas"
    }
  ],
  "fieldsDescription": "Descripci\xF3n de los campos de la entidad",
  "wireframeDescriptions": ["usar SOLO pantallas mencionadas en la minuta"],
  "wireframesDescription": "Descripci\xF3n de las pantallas necesarias",
  "alternativeFlows": ["usar SOLO flujos alternativos mencionados en la minuta"],
  "alternativeFlowsDescription": "Descripci\xF3n de flujos alternativos y errores",
  "businessRules": "\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente, NO listas numeradas. Usar SOLO reglas mencionadas en la minuta. Ejemplo: \u2022 Regla de validaci\xF3n \u2022 Regla de acceso",
  "specialRequirements": "\u26A0\uFE0F FORMATO OBLIGATORIO: Usar BULLETS (\u2022) exclusivamente, NO listas numeradas. Usar SOLO requerimientos mencionados en la minuta. Ejemplo: \u2022 Tiempo de respuesta < 3s \u2022 Validaci\xF3n HTTPS",
  "isAIGenerated": true
}

REGLAS ESPEC\xCDFICAS:
- useCaseName debe empezar con verbo infinitivo (Gestionar, Consultar, Procesar, etc.)
- fileName sigue patr\xF3n: 2 letras + 3 n\xFAmeros + descripci\xF3n (Ejemplo ilustrativo: BP005GestionarClientes)
- entityFields debe incluir TODOS los campos obligatorios del schema: name, type, mandatory, length, description, validationRules
- Tipos v\xE1lidos: "text", "number", "decimal", "date", "datetime", "boolean", "email"
- Para montos usar tipo "decimal", para IDs usar "number"
- entityFields incluir SIEMPRE campos de auditor\xEDa con descripciones completas:
  * fechaAlta (date, mandatory: true, description: "Fecha de creaci\xF3n del registro", validationRules: "Fecha v\xE1lida")
  * usuarioAlta (text, mandatory: true, length: 50, description: "Usuario que cre\xF3 el registro", validationRules: "Usuario del sistema")
  * fechaModificacion (date, mandatory: false, description: "Fecha de \xFAltima modificaci\xF3n", validationRules: "Fecha v\xE1lida")
  * usuarioModificacion (text, mandatory: false, length: 50, description: "Usuario que modific\xF3", validationRules: "Usuario del sistema")
- Extraer informaci\xF3n espec\xEDfica del texto, NUNCA inventar datos gen\xE9ricos
`;
  }
  getApiAnalysisRules() {
    return `
Para casos de uso tipo API/WEB SERVICE, extrae y estructura la siguiente informaci\xF3n:

INSTRUCCIONES CR\xCDTICAS:
- NUNCA uses valores gen\xE9ricos o por defecto
- TODO ejemplo mostrado abajo es "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- SIEMPRE extrae datos EXACTOS del texto de la minuta
- Si alg\xFAn dato no est\xE1 en la minuta, devuelve null o array vac\xEDo seg\xFAn corresponda
- Para el actor principal: Si no hay actor expl\xEDcito, usar "Actor no identificado"

\u{1F6A8} REGLA CR\xCDTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo c\xF3digo + descripci\xF3n sin extensiones
- Ejemplo correcto: "API001ConsultarSaldo" (NO "API001ConsultarSaldo.json")
- Si encuentras extensiones, elim\xEDnalas completamente

{
  "clientName": "Nombre del cliente/organizaci\xF3n",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "C\xF3digo del caso de uso (Ejemplo ilustrativo: API001, WS002)",
  "useCaseName": "Nombre del servicio empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patr\xF3n: 2letras+3n\xFAmeros+descripci\xF3n",
  "description": "Descripci\xF3n del prop\xF3sito del API/servicio",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no est\xE1 expl\xEDcito",
  "apiEndpoint": "URL del endpoint (Ejemplo ilustrativo: /api/v1/consulta-saldo)",
  "httpMethod": "M\xE9todo HTTP (GET, POST, PUT, DELETE)",
  "requestFormat": "Formato de request con ejemplos",
  "responseFormat": "Formato de response con ejemplos",
  "alternativeFlows": ["Error de autenticaci\xF3n", "Timeout", "Datos no encontrados"],
  "businessRules": "\u2022 Regla de autenticaci\xF3n extra\xEDda de la minuta \u2022 Regla de validaci\xF3n espec\xEDfica mencionada",
  "specialRequirements": "\u2022 Seguridad SSL obligatoria \u2022 Rate limiting seg\xFAn requerimientos",
  "isAIGenerated": true
}
`;
  }
  getServiceAnalysisRules() {
    return `
Para casos de uso tipo SERVICIO/PROCESO, extrae y estructura la siguiente informaci\xF3n:

\u{1F6A8} REGLA CR\xCDTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo c\xF3digo + descripci\xF3n sin extensiones
- Ejemplo correcto: "SRV001ProcesarPagos" (NO "SRV001ProcesarPagos.json")
- Si encuentras extensiones, elim\xEDnalas completamente

\u{1F4CB} INSTRUCCIONES ESPEC\xCDFICAS PARA SERVICIOS/PROCESOS AUTOM\xC1TICOS:
- Busca informaci\xF3n sobre frecuencia de ejecuci\xF3n (diario, semanal, mensual, cada hora, etc.)
- Identifica horarios espec\xEDficos de ejecuci\xF3n (02:00 AM, 18:30, etc.)
- Detecta rutas de archivos o directorios que deben ser configurables
- Identifica credenciales de web services, APIs o integraciones externas
- Extrae flujos alternativos relacionados con fallos del proceso

{
  "clientName": "Nombre del cliente/organizaci\xF3n",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "C\xF3digo del caso de uso (ej: SRV001, PROC002)",
  "useCaseName": "Nombre del proceso empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patr\xF3n: 2letras+3n\xFAmeros+descripci\xF3n",
  "description": "Descripci\xF3n completa del proceso autom\xE1tico y sus etapas",
  "serviceFrequency": "Frecuencia de ejecuci\xF3n: Diariamente, Cada hora, Semanalmente, Mensualmente, etc. Si hay m\xFAltiples frecuencias, sep\xE1ralas con comas",
  "executionTime": "Hora(s) de ejecuci\xF3n: 02:00 AM, 14:30, 23:59, etc. Si hay m\xFAltiples horarios, sep\xE1ralos con comas",
  "configurationPaths": "Si el proceso captura o genera archivos, lista las rutas que deben ser configurables. Ejemplo: /sftp/incoming/, /sftp/processed/, /logs/. Si no hay rutas, devuelve cadena vac\xEDa",
  "webServiceCredentials": "Si llama a web services o APIs externas, indica qu\xE9 credenciales deben ser configurables. Ejemplo: Usuario: srv_proceso, URL: https://api.ejemplo.com, M\xE9todo: OAuth 2.0. Si no hay servicios externos, devuelve cadena vac\xEDa",
  "alternativeFlows": [
    "No se encuentran archivos en la ruta configurada",
    "Falla conexi\xF3n con servicio externo",
    "Error en procesamiento de datos",
    "Timeout en operaci\xF3n",
    "Proceso anterior no finaliz\xF3"
  ],
  "businessRules": "\u2022 Reglas de validaci\xF3n de datos \u2022 L\xEDmites de procesamiento \u2022 Horarios permitidos \u2022 Validaciones espec\xEDficas del negocio",
  "specialRequirements": "\u2022 Integraci\xF3n con sistemas externos \u2022 Monitoreo en tiempo real \u2022 Notificaciones por email \u2022 Backup autom\xE1tico \u2022 Encriptaci\xF3n de datos",
  "generateTestCase": true,
  "testCaseObjective": "Verificar que el proceso autom\xE1tico ejecute correctamente todas sus etapas",
  "testCasePreconditions": "Archivos de prueba disponibles. Servicios externos accesibles. Base de datos en estado consistente",
  "isAIGenerated": true
}

EJEMPLOS DE EXTRACCI\xD3N:
- Si el documento menciona "El proceso se ejecuta todos los d\xEDas a las 2 AM", extrae:
  serviceFrequency: "Diariamente"
  executionTime: "02:00 AM"
  
- Si dice "captura archivos desde servidor SFTP", extrae:
  configurationPaths: "/sftp/incoming/, /sftp/processed/"
  
- Si menciona "integraci\xF3n con API del BCRA", extrae:
  webServiceCredentials: "Usuario y URL del servicio BCRA deben ser configurables"
`;
  }
  parseAnalysisResult(result, useCaseType) {
    try {
      console.log("Raw AI analysis result:", result.substring(0, 200) + "...");
      if (result.includes("Demo Analysis") || result.includes("generateDemoAnalysis")) {
        console.log("Detected demo content in AI response, using fallback");
        return this.generateDemoAnalysis(useCaseType);
      }
      const cleanedResult = result.replace(/^```json\s*/, "").replace(/\s*```$/, "").replace(/^```\s*/, "").replace(/^\s*\{/, "{").replace(/\}\s*$/, "}").trim();
      console.log("Cleaned result for JSON parsing:", cleanedResult.substring(0, 200) + "...");
      const finalCleanedResult = cleanedResult.replace(/"fileName":\s*"([^"]+)\.json"/g, '"fileName": "$1"').replace(/"fileName":\s*"([^"]+)\.docx"/g, '"fileName": "$1"').replace(/"fileName":\s*"([^"]+)\.xml"/g, '"fileName": "$1"').replace(/"fileName":\s*"([^"]+)\.txt"/g, '"fileName": "$1"');
      const parsed = JSON.parse(finalCleanedResult);
      let correctedData = { ...parsed };
      if (correctedData.fileName && typeof correctedData.fileName === "string") {
        correctedData.fileName = correctedData.fileName.replace(/\.(json|docx|xml|txt|pdf)$/i, "").trim();
      }
      const infinitiveVerbs = ["gestionar", "crear", "mostrar", "consultar", "ver", "actualizar", "eliminar", "procesar"];
      if (correctedData.clientName && infinitiveVerbs.some((verb) => correctedData.clientName.toLowerCase().includes(verb))) {
        console.warn("\u26A0\uFE0F clientName contains a verb, likely mixed with useCaseName");
        if (correctedData.useCaseName && !infinitiveVerbs.some((verb) => correctedData.useCaseName.toLowerCase().startsWith(verb))) {
          const temp = correctedData.clientName;
          correctedData.clientName = correctedData.useCaseName;
          correctedData.useCaseName = temp;
          console.log("\u2713 Swapped clientName and useCaseName");
        }
      }
      if (correctedData.useCaseName && !infinitiveVerbs.some((verb) => correctedData.useCaseName.toLowerCase().startsWith(verb))) {
        console.error("\u26A0\uFE0F useCaseName does not start with infinitive verb:", correctedData.useCaseName);
        if (correctedData.description && correctedData.description.toLowerCase().startsWith("mostrar")) {
          correctedData.useCaseName = correctedData.description;
          console.log("\u2713 Fixed useCaseName from description");
        }
      }
      if (!correctedData.projectName || correctedData.projectName === null) {
        console.warn("\u26A0\uFE0F projectName is empty, trying to infer...");
        if (correctedData.useCaseName && correctedData.useCaseName.toLowerCase().includes("proveedores")) {
          correctedData.projectName = "Sistema de Gesti\xF3n de Proveedores";
        } else if (correctedData.useCaseName && correctedData.useCaseName.toLowerCase().includes("clientes")) {
          correctedData.projectName = "Sistema de Gesti\xF3n de Clientes";
        } else {
          correctedData.projectName = "Sistema de Gesti\xF3n";
        }
        console.log("\u2713 Inferred projectName:", correctedData.projectName);
      }
      if (useCaseType === "service") {
        console.log("\u{1F4CB} Processing service-specific fields:");
        console.log("  serviceFrequency:", correctedData.serviceFrequency);
        console.log("  executionTime:", correctedData.executionTime);
        console.log("  configurationPaths:", correctedData.configurationPaths);
        console.log("  webServiceCredentials:", correctedData.webServiceCredentials);
        correctedData.serviceFrequency = correctedData.serviceFrequency || "";
        correctedData.executionTime = correctedData.executionTime || "";
        correctedData.configurationPaths = correctedData.configurationPaths || "";
        correctedData.webServiceCredentials = correctedData.webServiceCredentials || "";
      }
      return {
        ...correctedData,
        useCaseType,
        isAIGenerated: true
      };
    } catch (error) {
      console.error("Error parsing AI analysis result:", error);
      console.error("Raw result was:", result.substring(0, 500));
      return this.generateDemoAnalysis(useCaseType);
    }
  }
  generateDemoAnalysis(useCaseType) {
    const baseData = {
      clientName: "Banco Provincia",
      projectName: "Sistema de Gesti\xF3n Integral",
      useCaseCode: "BP001",
      useCaseName: "Gestionar informaci\xF3n del cliente",
      fileName: "BP001GestionarInformacionCliente",
      description: "Permite gestionar la informaci\xF3n completa de los clientes del banco incluyendo consulta, actualizaci\xF3n y seguimiento de la relaci\xF3n comercial.",
      isAIGenerated: true,
      useCaseType
    };
    switch (useCaseType) {
      case "entity":
        return {
          ...baseData,
          searchFilters: ["DNI/CUIT", "Apellido", "Email", "N\xFAmero de Cliente"],
          filtersDescription: "Filtros de b\xFAsqueda para localizar clientes por diferentes criterios",
          resultColumns: ["ID Cliente", "Apellido y Nombres", "Documento", "Email", "Estado"],
          columnsDescription: "Columnas principales para mostrar en la grilla de resultados",
          entityFields: [
            { name: "clienteId", type: "number", mandatory: true, length: 10, description: "Identificador \xFAnico del cliente", validationRules: "N\xFAmero entero positivo" },
            { name: "tipoDocumento", type: "text", mandatory: true, length: 10, description: "Tipo de documento de identidad", validationRules: "DNI, CUIT, CUIL" },
            { name: "numeroDocumento", type: "text", mandatory: true, length: 20, description: "N\xFAmero del documento de identidad", validationRules: "Solo n\xFAmeros, sin puntos ni guiones" },
            { name: "apellido", type: "text", mandatory: true, length: 100, description: "Apellido del cliente", validationRules: "Solo letras y espacios" },
            { name: "nombres", type: "text", mandatory: true, length: 100, description: "Nombres del cliente", validationRules: "Solo letras y espacios" },
            { name: "email", type: "text", mandatory: false, length: 150, description: "Correo electr\xF3nico del cliente", validationRules: "Formato email v\xE1lido" },
            { name: "fechaAlta", type: "date", mandatory: true, description: "Fecha de creaci\xF3n del registro", validationRules: "Formato ISO 8601" },
            { name: "usuarioAlta", type: "text", mandatory: true, length: 50, description: "Usuario que cre\xF3 el registro", validationRules: "Debe existir en el sistema" }
          ],
          fieldsDescription: "Campos principales de la entidad cliente con informaci\xF3n personal y de auditor\xEDa",
          wireframeDescriptions: ["Pantalla de b\xFAsqueda con filtros", "Grilla de resultados paginada", "Detalle del cliente"],
          wireframesDescription: "Pantallas necesarias para la gesti\xF3n completa de clientes",
          businessRules: "1. Solo usuarios autorizados pueden acceder\n2. Validar documento con organismos oficiales",
          specialRequirements: "1. Auditor\xEDa completa de cambios\n2. Integraci\xF3n con servicios externos"
        };
      case "api":
        return {
          ...baseData,
          useCaseName: "Consultar saldo de cuenta",
          fileName: "BP001ConsultarSaldoCuenta",
          apiEndpoint: "/api/v1/consulta-saldo",
          requestFormat: `{
  "numeroCliente": "12345678",
  "numeroCuenta": "001-234567-8",
  "tipoConsulta": "SALDO_ACTUAL"
}`,
          responseFormat: `{
  "success": true,
  "data": {
    "saldo": 15000.50,
    "moneda": "ARS",
    "fechaConsulta": "2025-01-27T10:30:00Z"
  }
}`,
          businessRules: "1. Autenticaci\xF3n obligatoria\n2. Rate limiting por cliente",
          specialRequirements: "1. Encriptaci\xF3n SSL\n2. Logs de auditor\xEDa"
        };
      case "service":
        return {
          ...baseData,
          useCaseName: "Procesar cierre diario",
          fileName: "BP001ProcesarCierreDiario",
          serviceFrequency: "Diariamente, Fin de mes",
          executionTime: "23:00, 00:30",
          configurationPaths: "/batch/input/, /batch/output/, /batch/logs/",
          webServiceCredentials: "Usuario: srv_batch, URL: https://api.banco.com/v1/cierre, M\xE9todo: OAuth 2.0",
          businessRules: "1. Ejecutar solo en d\xEDas h\xE1biles\n2. Generar backup antes del proceso\n3. Validar integridad de datos antes de procesar",
          specialRequirements: "1. Logging detallado\n2. Alertas por email\n3. Mecanismo de rollback\n4. Integraci\xF3n con sistema de monitoreo"
        };
      default:
        return baseData;
    }
  }
};

// server/services/intelligent-test-case-service.ts
var IntelligentTestCaseService = class {
  constructor(aiService) {
    this.aiService = aiService;
  }
  async generateIntelligentTestCases(formData, aiModel) {
    try {
      const context = this.buildUseCaseContext(formData);
      const prompt = this.buildIntelligentTestPrompt(context, formData.useCaseType);
      const testCaseResult = await AIService.processFieldWithAI(
        prompt,
        context.fullDescription,
        aiModel
      );
      return this.parseIntelligentTestResult(testCaseResult, formData);
    } catch (error) {
      console.error("Error generating intelligent test cases:", error);
      if (error instanceof Error) {
        throw new Error(`Error al generar casos de prueba inteligentes: ${error.message}`);
      } else {
        throw new Error("Error desconocido al generar casos de prueba inteligentes");
      }
    }
  }
  buildUseCaseContext(formData) {
    const context = {
      basicInfo: {
        clientName: formData.clientName,
        projectName: formData.projectName,
        useCaseCode: formData.useCaseCode,
        useCaseName: formData.useCaseName,
        useCaseType: formData.useCaseType,
        description: formData.description
      },
      technicalDetails: {},
      businessRules: formData.businessRules || "",
      specialRequirements: formData.specialRequirements || "",
      alternativeFlows: [],
      wireframes: formData.wireframeDescriptions || [],
      fullDescription: ""
    };
    switch (formData.useCaseType) {
      case "entity":
        context.technicalDetails = {
          searchFilters: formData.searchFilters || [],
          resultColumns: formData.resultColumns || [],
          entityFields: formData.entityFields || []
        };
        break;
      case "api":
        context.technicalDetails = {
          apiEndpoint: formData.apiEndpoint,
          httpMethod: formData.httpMethod,
          requestFormat: formData.requestFormat,
          responseFormat: formData.responseFormat
        };
        break;
      case "service":
        context.technicalDetails = {
          serviceFrequency: formData.serviceFrequency,
          executionTime: formData.executionTime,
          configurationPaths: formData.configurationPaths
        };
        break;
    }
    context.fullDescription = this.buildFullDescription(context);
    return context;
  }
  buildFullDescription(context) {
    const sections = [
      `CASO DE USO: ${context.basicInfo.useCaseName}`,
      `CLIENTE: ${context.basicInfo.clientName}`,
      `PROYECTO: ${context.basicInfo.projectName}`,
      `TIPO: ${context.basicInfo.useCaseType.toUpperCase()}`,
      `C\xD3DIGO: ${context.basicInfo.useCaseCode}`,
      "",
      `DESCRIPCI\xD3N:`,
      context.basicInfo.description,
      ""
    ];
    if (context.basicInfo.useCaseType === "entity") {
      sections.push("FILTROS DE B\xDASQUEDA:");
      context.technicalDetails.searchFilters?.forEach((filter) => {
        sections.push(`- ${filter}`);
      });
      sections.push("");
      sections.push("COLUMNAS DE RESULTADO:");
      context.technicalDetails.resultColumns?.forEach((column) => {
        sections.push(`- ${column}`);
      });
      sections.push("");
      sections.push("CAMPOS DE ENTIDAD:");
      context.technicalDetails.entityFields?.forEach((field) => {
        sections.push(`- ${field.name} (${field.type}${field.length ? `, longitud: ${field.length}` : ""}, ${field.mandatory ? "obligatorio" : "opcional"})`);
      });
      sections.push("");
    } else if (context.basicInfo.useCaseType === "api") {
      sections.push("CONFIGURACI\xD3N API:");
      sections.push(`- Endpoint: ${context.technicalDetails.apiEndpoint}`);
      sections.push(`- M\xE9todo HTTP: ${context.technicalDetails.httpMethod}`);
      if (context.technicalDetails.requestFormat) {
        sections.push("- Formato de Petici\xF3n:");
        sections.push(context.technicalDetails.requestFormat);
      }
      if (context.technicalDetails.responseFormat) {
        sections.push("- Formato de Respuesta:");
        sections.push(context.technicalDetails.responseFormat);
      }
      sections.push("");
    } else if (context.basicInfo.useCaseType === "service") {
      sections.push("CONFIGURACI\xD3N DEL SERVICIO:");
      if (context.technicalDetails.serviceFrequency) {
        sections.push(`- Frecuencia: ${context.technicalDetails.serviceFrequency}`);
      }
      if (context.technicalDetails.executionTime) {
        sections.push(`- Tiempo de Ejecuci\xF3n: ${context.technicalDetails.executionTime}`);
      }
      if (context.technicalDetails.configurationPaths) {
        sections.push(`- Rutas de Configuraci\xF3n: ${context.technicalDetails.configurationPaths}`);
      }
      sections.push("");
    }
    if (context.businessRules) {
      sections.push("REGLAS DE NEGOCIO:");
      sections.push(context.businessRules);
      sections.push("");
    }
    if (context.specialRequirements) {
      sections.push("REQUERIMIENTOS ESPECIALES:");
      sections.push(context.specialRequirements);
      sections.push("");
    }
    if (context.alternativeFlows?.length > 0) {
      sections.push("FLUJOS ALTERNATIVOS:");
      context.alternativeFlows.forEach((flow) => {
        sections.push(`- ${flow}`);
      });
      sections.push("");
    }
    if (context.wireframes?.length > 0) {
      sections.push("WIREFRAMES/PANTALLAS:");
      context.wireframes.forEach((wireframe) => {
        sections.push(`- ${wireframe}`);
      });
      sections.push("");
    }
    return sections.join("\n");
  }
  buildIntelligentTestPrompt(context, useCaseType) {
    const basePrompt = `
Eres un analista de QA experto especializado en generar casos de prueba completos y profesionales siguiendo est\xE1ndares bancarios ING.

INSTRUCCIONES CR\xCDTICAS:
1. Analiza TODO el caso de uso proporcionado incluyendo reglas de negocio, flujos alternativos y requerimientos especiales
2. Genera casos de prueba COMPLETOS que cubran: flujo principal, validaciones, errores, seguridad y rendimiento
3. Responde \xDANICAMENTE con JSON v\xE1lido sin explicaciones adicionales
4. Cada paso debe ser espec\xEDfico, actionable y verificable
5. DEBES incluir m\xEDnimo 5-10 pasos de prueba para cubrir todos los escenarios

ESTRUCTURA REQUERIDA:
{
  "objective": "Objetivo claro y espec\xEDfico del caso de prueba",
  "preconditions": "1. Usuarios de prueba\\n   a. Usuario con perfil autorizado: descripci\xF3n completa del usuario y sus permisos\\n   b. Usuario sin permisos: descripci\xF3n del usuario sin acceso\\n\\n2. Datos de prueba\\n   a. Datos v\xE1lidos: descripci\xF3n de datos de prueba correctos\\n   b. Datos inv\xE1lidos: descripci\xF3n de datos para pruebas negativas\\n\\n3. Infraestructura y configuraci\xF3n\\n   a. Sistema de pruebas configurado y accesible\\n   b. Base de datos con datos de prueba\\n   c. Servicios externos simulados o disponibles",
  "testSteps": [
    {
      "number": 1,
      "action": "Acci\xF3n espec\xEDfica a realizar",
      "inputData": "Datos de entrada exactos",
      "expectedResult": "Resultado esperado espec\xEDfico",
      "observations": "Observaciones t\xE9cnicas importantes, consideraciones o puntos de atenci\xF3n espec\xEDficos para esta prueba"
    },
    {
      "number": 2,
      "action": "Segunda acci\xF3n a realizar",
      "inputData": "Datos de entrada para el segundo paso",
      "expectedResult": "Resultado esperado del segundo paso",
      "observations": "Consideraciones espec\xEDficas del segundo paso, advertencias o informaci\xF3n relevante para la ejecuci\xF3n"
    }
  ],
  "analysisNotes": "An\xE1lisis del contexto y cobertura de pruebas"
}

FORMATO DE PRECONDICIONES:
Las precondiciones DEBEN seguir el formato jer\xE1rquico (1/a/b) similar a los flujos principales:
1. Categor\xEDa principal
   a. Subcategor\xEDa o elemento espec\xEDfico
   b. Otro elemento espec\xEDfico
2. Segunda categor\xEDa principal
   a. Elementos de esta categor\xEDa
   
NO uses bullets (\u2022) ni guiones (-). Usa numeraci\xF3n jer\xE1rquica.

TIPOS DE PRUEBAS A INCLUIR:
`;
    switch (useCaseType) {
      case "entity":
        return basePrompt + `
- B\xFAsqueda con diferentes filtros (v\xE1lidos e inv\xE1lidos)
- Validaci\xF3n de campos obligatorios y opcionales
- L\xEDmites de longitud de campos
- Formatos de datos (emails, fechas, n\xFAmeros)
- Paginaci\xF3n y ordenamiento de resultados
- Creaci\xF3n, modificaci\xF3n y eliminaci\xF3n de registros
- Auditor\xEDa de cambios (fechaAlta, usuarioAlta, etc.)
- Validaciones de seguridad y permisos
- Manejo de errores y excepciones
- Rendimiento con grandes vol\xFAmenes de datos

CONTEXTO BANCARIO ING:
- Validaciones estrictas de DNI/CUIT
- Cumplimiento de normativas bancarias
- Auditor\xEDa completa de operaciones
- Seguridad de datos sensibles
`;
      case "api":
        return basePrompt + `
- Llamadas con diferentes m\xE9todos HTTP
- Validaci\xF3n de formato de petici\xF3n JSON
- Validaci\xF3n de par\xE1metros obligatorios y opcionales
- C\xF3digos de respuesta HTTP (200, 400, 401, 500, etc.)
- Formato de respuesta JSON
- Validaci\xF3n de tokens de autenticaci\xF3n
- Rate limiting y throttling
- Timeouts y reintentos
- Manejo de errores de red
- Validaciones de seguridad SSL/TLS

CONTEXTO BANCARIO ING:
- Encriptaci\xF3n de datos sensibles
- Logs de auditor\xEDa de transacciones
- Validaci\xF3n de permisos por cliente
- Cumplimiento PCI DSS
`;
      case "service":
        return basePrompt + `
- Ejecuci\xF3n programada seg\xFAn frecuencia configurada
- Validaci\xF3n de par\xE1metros de configuraci\xF3n
- Procesamiento de diferentes vol\xFAmenes de datos
- Manejo de errores durante ejecuci\xF3n
- Reintentos autom\xE1ticos en caso de fallo
- Generaci\xF3n de logs detallados
- Notificaciones de \xE9xito y error
- Validaci\xF3n de recursos del sistema
- Backup y rollback de datos
- Monitoreo de rendimiento

CONTEXTO BANCARIO ING:
- Procesos de cierre contable
- Conciliaci\xF3n de cuentas
- Generaci\xF3n de reportes regulatorios
- Backup de datos cr\xEDticos
`;
      default:
        return basePrompt;
    }
  }
  parseIntelligentTestResult(aiResult, formData) {
    try {
      console.log("Raw intelligent test result:", aiResult.substring(0, 500) + "...");
      if (aiResult.startsWith("Demo Analysis Result:")) {
        console.log("Detected demo content in intelligent test response, using fallback");
        throw new Error("Demo content detected");
      }
      let cleanedResult = aiResult;
      cleanedResult = cleanedResult.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const firstBrace = cleanedResult.indexOf("{");
      const lastBrace = cleanedResult.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedResult = cleanedResult.substring(firstBrace, lastBrace + 1);
      }
      cleanedResult = cleanedResult.trim();
      console.log("Cleaned intelligent test result for JSON parsing:", cleanedResult);
      let parsed;
      try {
        parsed = JSON.parse(cleanedResult);
      } catch (jsonError) {
        console.error("Initial JSON parse failed, attempting to fix incomplete JSON...");
        const openBraces = (cleanedResult.match(/{/g) || []).length;
        const closeBraces = (cleanedResult.match(/}/g) || []).length;
        const openBrackets = (cleanedResult.match(/\[/g) || []).length;
        const closeBrackets = (cleanedResult.match(/]/g) || []).length;
        let fixedResult = cleanedResult;
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedResult += "]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedResult += "}";
        }
        try {
          parsed = JSON.parse(fixedResult);
          console.log("Successfully parsed after fixing JSON structure");
        } catch (secondError) {
          throw jsonError;
        }
      }
      console.log("Parsed intelligent test result:", parsed);
      if (!parsed.testSteps || !Array.isArray(parsed.testSteps) || parsed.testSteps.length === 0) {
        console.warn("AI response missing testSteps array or empty, generating fallback test steps");
        parsed.testSteps = this.generateFallbackTestSteps(formData);
      }
      const testSteps = (parsed.testSteps || []).map((step, index) => ({
        number: index + 1,
        action: step.action || `Acci\xF3n ${index + 1}`,
        inputData: step.inputData || "Datos de entrada",
        expectedResult: step.expectedResult || "Resultado esperado",
        observations: step.observations || "",
        status: "pending"
      }));
      const formattedPreconditions = this.formatPreconditions(parsed.preconditions, formData);
      return {
        objective: parsed.objective || `Verificar el funcionamiento completo del caso de uso: ${formData.useCaseName}`,
        preconditions: formattedPreconditions.trim(),
        testSteps,
        analysisNotes: parsed.analysisNotes || "An\xE1lisis generado autom\xE1ticamente basado en el caso de uso completo"
      };
    } catch (error) {
      console.error("Error parsing intelligent test result:", error);
      console.error("AI Result that failed to parse:", aiResult);
      if (error instanceof SyntaxError) {
        throw new Error("La respuesta de IA no tiene el formato JSON esperado. Por favor, intente nuevamente.");
      } else {
        throw new Error(`Error al procesar la respuesta de IA: ${error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }
  }
  formatPreconditions(preconditions, formData) {
    if (typeof preconditions === "string" && /^\d+\./.test(preconditions.trim())) {
      return preconditions;
    }
    let formatted = "";
    let sectionNumber = 1;
    const extractText = (item) => {
      if (typeof item === "string") {
        return item;
      }
      if (typeof item === "object" && item !== null) {
        if (item.description) return item.description;
        if (item.usuario && item.descripcion) return `${item.usuario}: ${item.descripcion}`;
        if (item.requisito) return item.requisito;
        if (item.requirement) return item.requirement;
        if (item.user) return item.user;
        if (item.data) return item.data;
        if (item.datos) {
          const dataParts = Object.entries(item.datos).map(([k, v]) => `${k}: ${v}`).join(", ");
          return `${item.descripcion || "Datos"}: ${dataParts}`;
        }
        return JSON.stringify(item);
      }
      return String(item);
    };
    if (typeof preconditions === "object" && preconditions !== null) {
      const sections = [
        { key: ["usuarios", "usuariosDePrueba", "usuarios_de_prueba", "users"], title: "Usuarios de prueba" },
        { key: ["datos", "datosDePrueba", "datos_de_prueba", "data"], title: "Datos de prueba" },
        { key: ["infraestructura", "infrastructure", "sistema"], title: "Infraestructura y configuraci\xF3n" }
      ];
      for (const section of sections) {
        const matchingKey = section.key.find((k) => preconditions[k]);
        if (matchingKey && preconditions[matchingKey]) {
          formatted += `${sectionNumber}. ${section.title}
`;
          const items = preconditions[matchingKey];
          if (Array.isArray(items)) {
            items.forEach((item, index) => {
              const letter = String.fromCharCode(97 + index);
              const text2 = extractText(item);
              const cleanText = text2.replace(/[{}]/g, "").replace(/"/g, "");
              formatted += `   ${letter}. ${cleanText}
`;
            });
          } else {
            formatted += `   a. ${extractText(items)}
`;
          }
          formatted += "\n";
          sectionNumber++;
        }
      }
      for (const [key, value] of Object.entries(preconditions)) {
        if (!sections.some((s) => s.key.includes(key))) {
          formatted += `${sectionNumber}. ${key.charAt(0).toUpperCase() + key.slice(1)}
`;
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              const letter = String.fromCharCode(97 + index);
              formatted += `   ${letter}. ${extractText(item)}
`;
            });
          } else {
            formatted += `   a. ${extractText(value)}
`;
          }
          formatted += "\n";
          sectionNumber++;
        }
      }
    } else if (typeof preconditions === "string") {
      const lines = preconditions.split("\n").filter((line) => line.trim());
      let currentSection = "";
      let itemLetter = "a";
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("\u2022 \u2022")) {
          continue;
        }
        if (trimmedLine.startsWith("\u2022") && trimmedLine.endsWith(":")) {
          currentSection = trimmedLine.replace(/^•\s*/, "").replace(/:$/, "");
          formatted += `${sectionNumber}. ${currentSection}
`;
          sectionNumber++;
          itemLetter = "a";
        } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("\u2022")) {
          const text2 = trimmedLine.replace(/^[-•]\s*/, "");
          const cleanText = text2.replace(/\[object Object\]/g, "").replace(/\{[^}]+\}/g, (match) => {
            try {
              const obj = JSON.parse(match);
              return extractText(obj);
            } catch {
              return match;
            }
          });
          formatted += `   ${itemLetter}. ${cleanText}
`;
          itemLetter = String.fromCharCode(itemLetter.charCodeAt(0) + 1);
        }
      }
    }
    if (!formatted.trim()) {
      return this.getDefaultPreconditions(formData);
    }
    return formatted.trim();
  }
  getDefaultPreconditions(formData) {
    const projectName = formData.projectName || "Sistema";
    const useCaseName = formData.useCaseName || "Gesti\xF3n";
    let preconditions = `\u2022 Usuario con perfil autorizado con permisos completos para ejecutar las operaciones del caso de uso
\u2022 Usuario sin permisos v\xE1lido pero sin acceso a esta funcionalidad espec\xEDfica
\u2022 Datos v\xE1lidos de prueba que cumplen con todas las validaciones y reglas de negocio
\u2022 Datos inv\xE1lidos dise\xF1ados para probar validaciones y manejo de errores
\u2022 Sistema ${projectName} desplegado en ambiente de pruebas (UAT)
\u2022 Base de datos con datos de prueba precargados
\u2022 Servicios externos simulados o disponibles seg\xFAn requerimientos`;
    if (formData.useCaseType === "api") {
      preconditions += `
\u2022 Endpoint API configurado y accesible: ${formData.apiEndpoint || "/api/endpoint"}
\u2022 Herramientas de prueba API (Postman, curl) disponibles`;
    } else if (formData.useCaseType === "service") {
      preconditions += `
\u2022 Servicio programado configurado con frecuencia: ${formData.serviceFrequency || "Diaria"}
\u2022 Logs y monitoreo habilitados para verificaci\xF3n`;
    }
    return preconditions;
  }
  generateFallbackTestSteps(formData) {
    const baseSteps = [
      {
        action: "Acceder al sistema con credenciales v\xE1lidas",
        inputData: "Usuario y contrase\xF1a correctos",
        expectedResult: "Acceso exitoso al sistema",
        observations: "Verificar logs de auditor\xEDa",
        status: "pending"
      },
      {
        action: `Navegar a la funcionalidad ${formData.useCaseName}`,
        inputData: "Men\xFA principal o acceso directo",
        expectedResult: "Pantalla de la funcionalidad desplegada correctamente",
        observations: "Verificar tiempo de carga",
        status: "pending"
      }
    ];
    switch (formData.useCaseType) {
      case "entity":
        return [
          ...baseSteps,
          {
            action: "Realizar b\xFAsqueda con filtros v\xE1lidos",
            inputData: formData.searchFilters?.join(", ") || "Filtros de b\xFAsqueda",
            expectedResult: "Resultados mostrados correctamente",
            observations: "Verificar paginaci\xF3n",
            status: "pending"
          },
          {
            action: "Validar campos obligatorios",
            inputData: "Dejar campos obligatorios vac\xEDos",
            expectedResult: "Mensaje de error correspondiente",
            observations: "Verificar mensajes de validaci\xF3n",
            status: "pending"
          },
          {
            action: "Crear nuevo registro",
            inputData: "Datos v\xE1lidos en todos los campos",
            expectedResult: "Registro creado exitosamente",
            observations: "Verificar auditor\xEDa",
            status: "pending"
          }
        ];
      case "api":
        return [
          ...baseSteps,
          {
            action: "Enviar petici\xF3n con datos v\xE1lidos",
            inputData: "JSON con estructura correcta",
            expectedResult: "Respuesta HTTP 200/201",
            observations: "Verificar headers y body",
            status: "pending"
          },
          {
            action: "Enviar petici\xF3n con datos inv\xE1lidos",
            inputData: "JSON con campos faltantes",
            expectedResult: "Respuesta HTTP 400 con mensaje de error",
            observations: "Verificar estructura del error",
            status: "pending"
          }
        ];
      case "service":
        return [
          ...baseSteps,
          {
            action: "Ejecutar servicio manualmente",
            inputData: "Par\xE1metros de configuraci\xF3n",
            expectedResult: "Servicio ejecutado correctamente",
            observations: "Verificar logs de ejecuci\xF3n",
            status: "pending"
          },
          {
            action: "Verificar procesamiento de datos",
            inputData: "Volumen de datos de prueba",
            expectedResult: "Datos procesados correctamente",
            observations: "Verificar integridad de datos",
            status: "pending"
          }
        ];
      default:
        return baseSteps;
    }
  }
  generateDemoIntelligentTests(formData) {
    const baseTestSteps = [
      {
        number: 1,
        action: "Acceder al sistema con credenciales v\xE1lidas",
        inputData: "Usuario: admin, Contrase\xF1a: validPassword123",
        expectedResult: "Login exitoso, redirecci\xF3n a p\xE1gina principal",
        observations: "Verificar que el token de sesi\xF3n se genere correctamente",
        status: "pending"
      },
      {
        number: 2,
        action: "Navegar a la funcionalidad del caso de uso",
        inputData: "Clic en m\xF3dulo correspondiente del men\xFA principal",
        expectedResult: "Pantalla del caso de uso se carga correctamente",
        observations: "Verificar tiempos de carga < 3 segundos",
        status: "pending"
      }
    ];
    switch (formData.useCaseType) {
      case "entity":
        return {
          objective: `Verificar el funcionamiento completo de la gesti\xF3n de entidades: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: "Realizar b\xFAsqueda con filtros v\xE1lidos",
              inputData: 'DNI: 12345678, Apellido: "Gonz\xE1lez"',
              expectedResult: "Lista de resultados filtrados correctamente",
              observations: "Verificar paginaci\xF3n y ordenamiento",
              status: "pending"
            },
            {
              number: 4,
              action: "Intentar b\xFAsqueda con filtros inv\xE1lidos",
              inputData: 'DNI: "abc123", Email: formato_inv\xE1lido',
              expectedResult: "Mensajes de validaci\xF3n espec\xEDficos mostrados",
              observations: "No permitir b\xFAsqueda con datos inv\xE1lidos",
              status: "pending"
            },
            {
              number: 5,
              action: "Crear nuevo registro con datos completos",
              inputData: "Todos los campos obligatorios con datos v\xE1lidos",
              expectedResult: "Registro creado exitosamente, ID asignado",
              observations: "Verificar auditor\xEDa (fechaAlta, usuarioAlta)",
              status: "pending"
            },
            {
              number: 6,
              action: "Intentar crear registro con campos obligatorios vac\xEDos",
              inputData: "Dejar campos requeridos sin completar",
              expectedResult: "Validaciones impiden el guardado",
              observations: "Mensajes de error claros para cada campo",
              status: "pending"
            }
          ],
          analysisNotes: "Cobertura completa: CRUD, validaciones, auditor\xEDa, filtros, paginaci\xF3n"
        };
      case "api":
        return {
          objective: `Verificar el funcionamiento completo de la API: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: "Realizar petici\xF3n con datos v\xE1lidos",
              inputData: "JSON con estructura y datos correctos",
              expectedResult: "Respuesta HTTP 200 con datos esperados",
              observations: "Verificar estructura del JSON de respuesta",
              status: "pending"
            },
            {
              number: 4,
              action: "Enviar petici\xF3n con JSON malformado",
              inputData: "JSON con sintaxis incorrecta",
              expectedResult: "Error HTTP 400 - Bad Request",
              observations: "Mensaje de error descriptivo",
              status: "pending"
            },
            {
              number: 5,
              action: "Probar autenticaci\xF3n inv\xE1lida",
              inputData: "Token expirado o inv\xE1lido",
              expectedResult: "Error HTTP 401 - Unauthorized",
              observations: "No revelar informaci\xF3n sensible",
              status: "pending"
            },
            {
              number: 6,
              action: "Verificar rate limiting",
              inputData: "M\xFAltiples peticiones r\xE1pidas consecutivas",
              expectedResult: "Error HTTP 429 despu\xE9s del l\xEDmite",
              observations: "Implementaci\xF3n correcta de throttling",
              status: "pending"
            }
          ],
          analysisNotes: "Cobertura completa: endpoints, validaciones, autenticaci\xF3n, rate limiting, manejo de errores"
        };
      case "service":
        return {
          objective: `Verificar el funcionamiento completo del servicio: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: "Ejecutar servicio manualmente",
              inputData: "Trigger manual del proceso programado",
              expectedResult: "Ejecuci\xF3n exitosa con logs generados",
              observations: "Verificar todas las etapas del proceso",
              status: "pending"
            },
            {
              number: 4,
              action: "Simular error durante ejecuci\xF3n",
              inputData: "Condici\xF3n de error controlada",
              expectedResult: "Manejo de error y rollback autom\xE1tico",
              observations: "Verificar mecanismos de recuperaci\xF3n",
              status: "pending"
            },
            {
              number: 5,
              action: "Verificar ejecuci\xF3n programada",
              inputData: "Configuraci\xF3n de schedule activa",
              expectedResult: "Servicio se ejecuta seg\xFAn programaci\xF3n",
              observations: "Monitorear logs de ejecuci\xF3n autom\xE1tica",
              status: "pending"
            },
            {
              number: 6,
              action: "Probar con volumen de datos alto",
              inputData: "Dataset de gran tama\xF1o",
              expectedResult: "Procesamiento exitoso sin timeouts",
              observations: "Verificar rendimiento y uso de recursos",
              status: "pending"
            }
          ],
          analysisNotes: "Cobertura completa: ejecuci\xF3n manual/autom\xE1tica, manejo de errores, rendimiento, logs"
        };
      default:
        return {
          objective: `Verificar funcionalidad b\xE1sica: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: baseTestSteps,
          analysisNotes: "Casos de prueba b\xE1sicos generados"
        };
    }
  }
};

// server/routes.ts
import multer from "multer";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

// server/routes/wireframe-routes.ts
import { Router } from "express";

// server/services/screenshot-service.ts
import puppeteer from "puppeteer";
import { promises as fs2 } from "fs";
import path2 from "path";
import os from "os";
var ScreenshotService = class {
  browser = null;
  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-extensions",
          "--no-first-run",
          "--disable-default-apps",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding"
        ]
      });
    }
  }
  async captureHTMLAsImage(options) {
    await this.initialize();
    const page = await this.browser.newPage();
    try {
      await page.setViewport({
        width: options.width || 1024,
        height: options.height || 768
      });
      const tempDir = os.tmpdir();
      const tempFile = path2.join(tempDir, `wireframe-${Date.now()}.html`);
      await fs2.writeFile(tempFile, options.html, "utf-8");
      await page.goto(`file://${tempFile}`, {
        waitUntil: "networkidle0"
      });
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true,
        encoding: "binary"
      });
      await fs2.unlink(tempFile).catch(() => {
      });
      return screenshot;
    } finally {
      await page.close();
    }
  }
  async generateWireframeScreenshots(searchHTML, formHTML) {
    const [searchImage, formImage] = await Promise.all([
      this.captureHTMLAsImage({ html: searchHTML, width: 1200, height: 800 }),
      this.captureHTMLAsImage({ html: formHTML, width: 900, height: 1e3 })
    ]);
    return { searchImage, formImage };
  }
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
};
var screenshotService = null;
function getScreenshotService() {
  if (!screenshotService) {
    screenshotService = new ScreenshotService();
  }
  return screenshotService;
}

// server/routes/wireframe-routes.ts
import sharp from "sharp";
function generateSearchWireframeHTML(data) {
  const filters = data.filters || [];
  const columns = data.columns || [];
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f4f6f9;
      margin: 0;
    }
    .header {
      background: #004b8d;
      color: white;
      padding: 12px 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      color: #0078D4;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0078D4;
    }
    .filters-panel {
      background: #1d4e89;
      color: white;
      padding: 20px;
      border-radius: 4px;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .filter-group label {
      display: block;
      font-size: 13px;
      margin-bottom: 5px;
      font-weight: 500;
    }
    .filter-group input {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 15px;
    }
    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .btn-primary {
      background: #0078D4;
      color: white;
    }
    .btn-secondary {
      background: #666;
      color: white;
    }
    .btn-success {
      background: #107C10;
      color: white;
    }
    .btn-white {
      background: white;
      color: #333;
      border: 1px solid #ccc;
    }
    .btn-white:hover {
      background: #f5f5f5;
    }
    .results-panel {
      background: white;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table th {
      background: #f0f0f0;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #ddd;
    }
    .table td {
      padding: 10px 8px;
      border: 1px solid #ddd;
    }
    .table tr:hover {
      background: #f8f8f8;
    }
    .actions {
      display: flex;
      gap: 5px;
      justify-content: center;
    }
    .action-btn {
      padding: 5px 8px;
      font-size: 12px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: 1px solid #ddd;
    }
    .action-btn svg {
      width: 16px;
      height: 16px;
    }
    .action-btn:hover {
      background: #f5f5f5;
    }
    .pagination {
      display: flex;
      justify-content: center;
      gap: 5px;
      margin-top: 20px;
      padding: 15px;
    }
    .page-btn {
      padding: 6px 12px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
      font-size: 13px;
      border-radius: 2px;
    }
    .page-btn:hover {
      background: #f5f5f5;
    }
    .page-btn.active {
      background: #0078D4;
      color: white;
      border-color: #0078D4;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">${data.title}</div>
  
  <div class="container">
    <div class="section">
      <h2 class="section-title">Filtros de b\xFAsqueda</h2>
      <div class="filters-panel">
        <div class="filters-grid">
          ${filters.map((filter) => `
            <div class="filter-group">
              <label>${filter}</label>
              <input type="text" placeholder="Ingrese ${filter.toLowerCase()}...">
            </div>
          `).join("")}
        </div>
        
        <div class="buttons">
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            Buscar
          </button>
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16l3.5-2.5 3.5 2.5L12 18.5 8.5 16z"/>
            </svg>
            Limpiar
          </button>
          <button class="btn btn-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Agregar
          </button>
        </div>
      </div>
    </div>
    
    <div class="section results-panel">
      <h2 class="section-title">Resultados</h2>
      <table class="table">
        <thead>
          <tr>
            <th style="width: 150px; text-align: center;">Acciones</th>
            ${columns.map((col) => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${[1, 2, 3, 4, 5].map((i) => `
            <tr>
              <td>
                <div class="actions">
                  <button class="action-btn edit" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button class="action-btn view" title="Ver">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </button>
                  <button class="action-btn log" title="Bit\xE1cora">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16l3.5-2.5 3.5 2.5L12 18.5 8.5 16z"/>
                    </svg>
                  </button>
                  <button class="action-btn delete" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#D13438">
                      <path d="M18.3 5.71L12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.72 5.7 21.13 12 14.83 18.3 21.13 19.71 19.72 13.41 13.42 19.71 7.12z"/>
                    </svg>
                  </button>
                </div>
              </td>
              ${columns.map(() => `<td>Dato ${i}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
      
      <div class="pagination">
        <button class="page-btn">\xAB</button>
        <button class="page-btn active">1</button>
        <button class="page-btn">2</button>
        <button class="page-btn">3</button>
        <button class="page-btn">\xBB</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}
function generateFormWireframeHTML(data) {
  const fields = data.fields || [];
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f2f4f8;
      margin: 0;
    }
    .header {
      background: #004b8d;
      color: white;
      padding: 12px 20px;
      font-size: 18px;
      font-weight: bold;
    }
    .container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .form-panel {
      background: white;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #0078D4;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0078D4;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }
    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    .required {
      color: #D13438;
      font-weight: bold;
    }
    .form-input, .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: 14px;
    }
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #0078D4;
    }
    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .metadata-section {
      background: #eef2f7;
      padding: 15px;
      border-radius: 4px;
      margin-top: 30px;
    }
    .metadata-title {
      font-size: 14px;
      font-weight: 600;
      color: #0078D4;
      margin-bottom: 10px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      font-size: 13px;
    }
    .metadata-item {
      display: flex;
      gap: 8px;
    }
    .metadata-label {
      font-weight: 500;
      color: #666;
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 30px;
    }
    .btn {
      padding: 8px 24px;
      border: none;
      border-radius: 2px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary {
      background: #0078D4;
      color: white;
    }
    .btn-secondary {
      background: #666;
      color: white;
    }
    .btn-danger {
      background: #D13438;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">Alta / Edici\xF3n de Entidad</div>
  
  <div class="container">
    <div class="form-panel">
      <div class="section">
        <h2 class="section-title">Datos Generales</h2>
        <div class="form-grid">
          ${fields.slice(0, Math.ceil(fields.length * 0.7)).map((field) => {
    const inputType = field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : field.type === "BOOLEAN" ? "checkbox" : "text";
    if (field.type === "BOOLEAN") {
      return `
                <div class="form-group">
                  <div class="form-checkbox">
                    <input type="checkbox" id="${field.name}">
                    <label for="${field.name}" class="form-label">${field.name}</label>
                  </div>
                </div>
              `;
    }
    return `
              <div class="form-group">
                <label class="form-label">
                  ${field.name} ${field.mandatory ? '<span class="required">*</span>' : ""}
                </label>
                <input 
                  type="${inputType}" 
                  class="form-input" 
                  ${field.length ? `maxlength="${field.length}"` : ""}
                  ${field.mandatory ? "required" : ""}
                >
              </div>
            `;
  }).join("")}
        </div>
      </div>

      ${fields.length > 4 ? `
      <div class="section">
        <h2 class="section-title">Informaci\xF3n Adicional</h2>
        <div class="form-grid">
          ${fields.slice(Math.ceil(fields.length * 0.7)).map((field) => {
    const inputType = field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : field.type === "BOOLEAN" ? "checkbox" : "text";
    if (field.type === "BOOLEAN") {
      return `
                <div class="form-group">
                  <div class="form-checkbox">
                    <input type="checkbox" id="${field.name}">
                    <label for="${field.name}" class="form-label">${field.name}</label>
                  </div>
                </div>
              `;
    }
    return `
              <div class="form-group">
                <label class="form-label">
                  ${field.name} ${field.mandatory ? '<span class="required">*</span>' : ""}
                </label>
                <input 
                  type="${inputType}" 
                  class="form-input" 
                  ${field.length ? `maxlength="${field.length}"` : ""}
                  ${field.mandatory ? "required" : ""}
                >
              </div>
            `;
  }).join("")}
        </div>
      </div>
      ` : ""}
      
      <div class="metadata-section">
        <div class="metadata-title">Auditor\xEDa</div>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">Fecha de alta:</span>
            <span>15/01/2025 10:30</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Usuario de alta:</span>
            <span>admin.sistema</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Fecha de modificaci\xF3n:</span>
            <span>15/01/2025 14:45</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Usuario de modificaci\xF3n:</span>
            <span>usuario.actual</span>
          </div>
        </div>
      </div>

      <div class="buttons">
        <button class="btn btn-danger">Cancelar</button>
        <button class="btn btn-primary">Aplicar</button>
        <button class="btn btn-primary">Guardar</button>
        <button class="btn btn-primary">Guardar y Agregar Nuevo</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}
var router = Router();
router.post("/api/generate-wireframe", async (req, res) => {
  try {
    const data = req.body;
    const screenshotService2 = getScreenshotService();
    const html = data.type === "search" ? generateSearchWireframeHTML(data) : generateFormWireframeHTML(data);
    const imageBuffer = await screenshotService2.captureHTMLAsImage({
      html,
      width: data.type === "search" ? 1e3 : 800,
      height: data.type === "search" ? 600 : 800
    });
    const compressedBuffer = await sharp(imageBuffer).png({
      quality: 70,
      compressionLevel: 9,
      adaptiveFiltering: true
    }).resize(data.type === "search" ? 800 : 600, null, {
      withoutEnlargement: true,
      fit: "inside"
    }).toBuffer();
    const base64Image = compressedBuffer.toString("base64");
    const imageUrl = `data:image/png;base64,${base64Image}`;
    res.json({
      success: true,
      imageUrl,
      type: data.type
    });
  } catch (error) {
    console.error("Error generating wireframe:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate wireframe"
    });
  }
});
var wireframe_routes_default = router;

// server/routes.ts
var USE_CASE_RULES = `
\u{1F6A8} PARA CASOS DE USO DE TIPO "api": OBLIGATORIO INCLUIR ESTAS SECCIONES DESPU\xC9S DE "REQUERIMIENTOS ESPECIALES":
- FLUJO PRINCIPAL DE EVENTOS
- FLUJOS ALTERNATIVOS
\u{1F6A8}

REGLAS PARA CASOS DE USO CON IA - SEGUIR ESTRICTAMENTE:

ESTRUCTURA COM\xDAN PARA TODOS LOS TIPOS:
- T\xEDtulo: igual al nombre del caso de uso EN MAY\xDASCULAS, color azul oscuro (red=0, green=112, blue=192)
- Nombre del Cliente
- Nombre del Proyecto  
- C\xF3digo del Caso de Uso
- Nombre del Caso de Uso
- Nombre del Archivo
- Descripci\xF3n: explicaci\xF3n detallada del alcance y objetivo
- Flujo Principal de Eventos
- Flujos Alternativos
- Reglas de Negocio: detallar cada una
- Requerimientos Especiales: detallar cada uno
- Precondiciones
- Postcondiciones
- Historia de Revisiones y Aprobaciones (tabla final)

CASOS DE USO DE ENTIDAD:
Flujo Principal (lista numerada multinivel):
1. Buscar datos de la entidad
   a. Detallar los filtros de b\xFAsqueda de la entidad
   b. Detallar las columnas del resultado de b\xFAsqueda
2. Agregar una nueva entidad
   a. Detallar cada uno de los datos de la entidad
   b. Cuando se agrega se registra fecha y usuario de alta

Flujos Alternativos (lista numerada multinivel):
1. Modificar o actualizar una entidad
   a. Detallar cada uno de los datos de la entidad
   b. Mostrar el identificador
   c. Mostrar fecha y usuario de alta
   d. Al modificar se registra fecha y usuario de modificaci\xF3n
2. Eliminar una entidad
   a. Verificar que no tenga relaciones con otras entidades

AGREGAR SECCIONES DE WIREFRAMES (solo para entidades):
- Boceto gr\xE1fico del buscador de entidades: incluir paginado, botones Buscar/Limpiar/Agregar, botones Editar/Eliminar por fila
- Boceto gr\xE1fico para agregar entidad: botones Aceptar/Cancelar, fechas de alta/modificaci\xF3n
- Detallar funcionalidades de cada interfaz con listas espec\xEDficas

CASOS DE USO DE API/WEB SERVICE - ESTRUCTURA OBLIGATORIA:
5. FLUJO PRINCIPAL DE EVENTOS (Heading 2, azul RGB(0,112,192))
   5.1 Identificaci\xF3n del servicio (endpoint, m\xE9todo HTTP, headers)
   5.2 Request (formato JSON con ejemplo completo)
   5.3 Response (formato JSON con ejemplo completo)
6. FLUJOS ALTERNATIVOS (Heading 2, azul RGB(0,112,192))
   6.1 Errores de validaci\xF3n (C\xF3digo 400)
   6.2 Errores de autenticaci\xF3n (C\xF3digo 401/403)
   6.3 Errores internos (C\xF3digo 500)

CASOS DE USO DE SERVICIO/PROCESO AUTOM\xC1TICO:
Flujo Principal: incluir frecuencia y/o hora de ejecuci\xF3n
Flujos Alternativos: incluir respuestas de error
Si captura archivo: indicar que el path debe ser configurable
Si llama web service: indicar que usuario, clave y URL deben ser configurables

FORMATO Y ESTILO OBLIGATORIO:
- Font: Segoe UI Semilight para todo el documento
- Interlineado: simple
- Espaciado: simple
- T\xEDtulos: color azul oscuro (red=0, green=112, blue=192)
- Listas multinivel: 1\xBA nivel n\xFAmeros (1,2,3), 2\xBA nivel letras (a,b,c) con sangr\xEDa 0.2", 3\xBA nivel romanos (i,ii,iii) con sangr\xEDa 0.2"
- Nombre del caso de uso: debe comenzar con verbo en infinitivo

TABLA FINAL OBLIGATORIA - HISTORIA DE REVISIONES:
- T\xEDtulo: "HISTORIA DE REVISIONES Y APROBACIONES" (Heading 1, azul)
- Tabla: 2 filas, 4 columnas
- Columnas: Fecha, Acci\xF3n, Responsable, Comentario
- Ancho: 2.17 pulgadas
- T\xEDtulos en negrita y centrados
- Datos alineados a la izquierda
- Bordes grises uniformes
- Una fila de datos con fecha actual, "Versi\xF3n original", "Sistema", "Documento generado autom\xE1ticamente"
`;
function getSpecificRules(useCaseType, formData) {
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES");
  if (useCaseType === "entity") {
    return `
INSTRUCCIONES CR\xCDTICAS PARA CASOS DE USO DE ENTIDAD - SIGUE EXACTAMENTE LA MINUTA ING:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- C\xF3digo: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripci\xF3n: ${formData.description}
- Filtros de b\xFAsqueda: ${formData.searchFilters?.join(", ") || "No especificado"}
- Columnas de resultado: ${formData.resultColumns?.join(", ") || "No especificado"}
- Campos de entidad: ${formData.entityFields?.map((f) => `${f.name} (${f.type}${f.length ? `, ${f.length}` : ""}${f.mandatory ? ", obligatorio" : ", opcional"})`).join(", ") || "No especificado"}
- Reglas de negocio: ${formData.businessRules || "No especificado"}
- Requerimientos especiales: ${formData.specialRequirements || "No especificado"}
- Generar wireframes: ${formData.generateWireframes ? "S\xED" : "No"}

ESTRUCTURA OBLIGATORIA SEG\xDAN MINUTA ING:

1. T\xCDTULO: "${formData.useCaseName}" en MAY\xDASCULAS, color azul oscuro RGB(0,112,192), font Segoe UI Semilight

2. INFORMACI\xD3N B\xC1SICA (presentar como tabla HTML):
   - Nombre del cliente: ${formData.clientName}
   - Nombre del proyecto: ${formData.projectName}
   - C\xF3digo del caso de uso: ${formData.useCaseCode}
   - Nombre del caso de uso: ${formData.useCaseName}
   - Nombre del archivo: ${formData.fileName}

3. DESCRIPCI\xD3N: Explicaci\xF3n detallada del alcance y objetivo del caso de uso

4. FLUJO PRINCIPAL DE EVENTOS (lista numerada con m\xFAltiples niveles - formato 1, a, i):
   DEBE incluir OBLIGATORIAMENTE estas funcionalidades:
   1. Buscar datos de la entidad
      a. Detallar los filtros de b\xFAsqueda: ${formData.searchFilters?.join(", ") || "No especificado"}
      b. Detallar las columnas del resultado: ${formData.resultColumns?.join(", ") || "No especificado"}
   2. Agregar una nueva entidad
      a. Detallar cada uno de los datos de la entidad: ${formData.entityFields?.map((f) => `${f.name} (${f.type}${f.length ? `, ${f.length}` : ""}${f.mandatory ? ", obligatorio" : ", opcional"})`).join(", ") || "No especificado"}
      b. Cuando se agrega una entidad se debe registrar la fecha y el usuario de alta

5. FLUJOS ALTERNATIVOS (lista numerada con m\xFAltiples niveles):
   DEBE incluir OBLIGATORIAMENTE:
   1. Modificar o actualizar una entidad
      a. Detallar cada uno de los datos de la entidad
      b. Mostrar el identificador
      c. Mostrar la fecha y el usuario de alta
      d. Cuando se modifica una entidad se debe registrar la fecha y el usuario de modificaci\xF3n
   2. Eliminar una entidad
      a. Para eliminar una entidad se debe verificar que no tenga relaciones con otras entidades

6. REGLAS DE NEGOCIO: ${formData.businessRules || "Detallar cada una de las reglas de negocio"}

7. REQUERIMIENTOS ESPECIALES: ${formData.specialRequirements || "Detallar los requerimientos especiales"}

8. PRECONDICIONES: Usuario autenticado con permisos correspondientes

9. POSTCONDICIONES: Datos actualizados en base de datos con registro de auditor\xEDa

${formData.generateWireframes ? `
10. BOCETOS GR\xC1FICOS SIMPLIFICADOS DE INTERFAZ DE USUARIO:

WIREFRAME 1: Buscador de Entidades
- Debe incluir: Paginado, Bot\xF3n de Buscar, Limpiar y Agregar
- Bot\xF3n de editar y Eliminar en cada fila del resultado
- Funcionalidades:
  - Listar cada uno de los filtros de b\xFAsqueda: ${formData.searchFilters?.join(", ") || "filtros apropiados"}
  - Listar cada una de las columnas del resultado: ${formData.resultColumns?.join(", ") || "columnas apropiadas"}
  - Indicar que debe paginar

WIREFRAME 2: Formulario para Agregar/Editar Entidad
- Debe incluir: Bot\xF3n para Aceptar y Cancelar
- Campos de fecha y usuario de alta, fecha y usuario de modificaci\xF3n
- Funcionalidades:
  - Listar cada uno de los datos de la entidad indicando tipo de dato, si es obligatorio, longitud

FUNCIONALIDADES DETALLADAS:
- Validaci\xF3n en tiempo real de campos obligatorios
- Formato espec\xEDfico para cada tipo de dato
- Mensajes de error contextuales
- Navegaci\xF3n entre campos con Tab
` : ""}

11. HISTORIA DE REVISIONES Y APROBACIONES (OBLIGATORIA):
- T\xEDtulo "HISTORIA DE REVISIONES Y APROBACIONES" como Heading 1, color azul RGB(0,112,192)
- Tabla con 2 filas y 4 columnas: Fecha, Acci\xF3n, Responsable, Comentario
- T\xEDtulos en negrita y centrados, datos alineados a la izquierda
- Bordes grises uniformes
- Una fila de datos: fecha actual (${today}), "Versi\xF3n original", "Sistema", "Documento generado autom\xE1ticamente"

FORMATO HTML CR\xCDTICO:
- Font Segoe UI Semilight para todo el documento
- Interlineado simple
- T\xEDtulos principales en azul oscuro RGB(0,112,192)
- Listas numeradas multinivel: 1\xBA nivel n\xFAmeros (1,2,3), 2\xBA nivel letras (a,b,c), 3\xBA nivel romanos (i,ii,iii)
- Usar estilos inline para mantener formato Microsoft
- El nombre del caso de uso debe comenzar con verbo en infinitivo`;
  }
  if (useCaseType === "api") {
    return `
\u{1F4A5}\u{1F4A5}\u{1F4A5} CR\xCDTICO: PARA API DEBES INCLUIR EXACTAMENTE ESTOS T\xCDTULOS H2 \u{1F4A5}\u{1F4A5}\u{1F4A5}

\u26A1 FLUJO PRINCIPAL DE EVENTOS \u26A1
\u26A1 FLUJOS ALTERNATIVOS \u26A1

ESTOS T\xCDTULOS DEBEN APARECER COMO H2 CON EL ESTILO EXACTO:
<h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">FLUJO PRINCIPAL DE EVENTOS</h2>

<h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">FLUJOS ALTERNATIVOS</h2>

\u{1F4A5} NO USES OTROS T\xCDTULOS - COPIA LOS H2 EXACTOS DE ARRIBA \u{1F4A5}
\u{1F6A8} SI NO INCLUYES ESTAS DOS SECCIONES H2, EL DOCUMENTO SER\xC1 INV\xC1LIDO \u{1F6A8}

INSTRUCCIONES ESPEC\xCDFICAS PARA CASOS DE USO DE API/WEB SERVICE:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- C\xF3digo: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripci\xF3n: ${formData.description}
- Endpoint: ${formData.apiEndpoint || "No especificado"}
- Formato Request: ${formData.requestFormat || "No especificado"}
- Formato Response: ${formData.responseFormat || "No especificado"}
- Reglas de negocio: ${formData.businessRules || "No especificado"}
- Requerimientos especiales: ${formData.specialRequirements || "No especificado"}

\u{1F6A8} ORDEN EXACTO DE SECCIONES DESPU\xC9S DE "REQUERIMIENTOS ESPECIALES": \u{1F6A8}

5. FLUJO PRINCIPAL DE EVENTOS (Heading 2, color azul RGB(0,112,192))
6. FLUJOS ALTERNATIVOS (Heading 2, color azul RGB(0,112,192))
7. PRECONDICIONES
8. POSTCONDICIONES

DETALLE DE SECCI\xD3N OBLIGATORIA:
FLUJO PRINCIPAL DE EVENTOS
   
   4.1. Identificaci\xF3n del servicio
        a. Endpoint: ${formData.apiEndpoint || "Definir endpoint espec\xEDfico seg\xFAn el caso de uso"}
        b. M\xE9todo HTTP: POST/GET/PUT/DELETE (seg\xFAn corresponda)
        c. Headers requeridos:
           - Authorization: Bearer [token]
           - Content-Type: application/json
           - Accept: application/json
   
   4.2. Request (Petici\xF3n)
        a. Formato de entrada: ${formData.requestFormat || "JSON estructurado"}
        b. Par\xE1metros obligatorios con tipos y validaciones espec\xEDficas
        c. Par\xE1metros opcionales y valores por defecto
        d. Ejemplo detallado de request completo en formato JSON:
           {
             "campo1": "valor_ejemplo",
             "campo2": 123,
             "campo3": true
           }
   
   4.3. Response (Respuesta)
        a. Formato de salida: ${formData.responseFormat || "JSON estructurado"}
        b. C\xF3digos de estado exitosos (200, 201, 204) con descripci\xF3n
        c. Estructura de datos de respuesta con tipos y descripci\xF3n de cada campo
        d. Ejemplo detallado de response exitoso en formato JSON:
           {
             "status": "success",
             "data": {
               "id": 12345,
               "message": "Operaci\xF3n exitosa"
             }
           }

FLUJOS ALTERNATIVOS
   
   5.1. Errores de validaci\xF3n (C\xF3digo 400 - Bad Request)
        a. Request malformado - campos faltantes o tipos incorrectos
        b. Validaciones de negocio fallidas
        c. Formato de respuesta de error:
           {
             "status": "error",
             "error_code": 400,
             "message": "Descripci\xF3n del error",
             "details": ["Lista de errores espec\xEDficos"]
           }
   
   5.2. Errores de autorizaci\xF3n (C\xF3digos 401/403)
        a. Token inv\xE1lido o expirado (401)
        b. Permisos insuficientes (403)
        c. Formato de respuesta:
           {
             "status": "error",
             "error_code": 401,
             "message": "Token inv\xE1lido o expirado"
           }
   
   5.3. Errores del servidor (C\xF3digo 500)
        a. Error interno del sistema
        b. Timeout de conexi\xF3n
        c. Servicio no disponible
        d. Formato de respuesta:
           {
             "status": "error",
             "error_code": 500,
             "message": "Error interno del servidor"
           }

\u26A0\uFE0F INSTRUCCIONES CR\xCDTICAS PARA REQUEST Y RESPONSE \u26A0\uFE0F
- SIEMPRE incluir ejemplos de JSON completos y realistas
- Los ejemplos deben estar relacionados con el caso de uso espec\xEDfico
- Incluir todos los campos obligatorios y opcionales
- Especificar tipos de datos (string, number, boolean, array, object)
- Documentar cada campo con su prop\xF3sito y validaciones
- Para c\xF3digos de error, incluir mensajes descriptivos en espa\xF1ol
- Todos los ejemplos JSON deben estar bien formateados con identaci\xF3n

ESTRUCTURA FINAL OBLIGATORIA:
- INFORMACI\xD3N DEL PROYECTO
- DESCRIPCI\xD3N DEL CASO DE USO
- REGLAS DE NEGOCIO
- REQUERIMIENTOS ESPECIALES
- FLUJO PRINCIPAL DE EVENTOS (con ejemplos JSON)
- FLUJOS ALTERNATIVOS (con c\xF3digos de error)
- PRECONDICIONES
- POSTCONDICIONES`;
  }
  if (useCaseType === "service") {
    return `
INSTRUCCIONES ESPEC\xCDFICAS PARA CASOS DE USO DE SERVICIO/PROCESO AUTOM\xC1TICO:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- C\xF3digo: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripci\xF3n: ${formData.description}
- Frecuencia: ${formData.serviceFrequency || "No especificado"}
- Hora de ejecuci\xF3n: ${formData.executionTime || "No especificado"}
- Rutas configurables: ${formData.configurationPaths || "No especificado"}
- Credenciales de servicios: ${formData.webServiceCredentials || "No especificado"}
- Reglas de negocio: ${formData.businessRules || "No especificado"}
- Requerimientos especiales: ${formData.specialRequirements || "No especificado"}

ESTRUCTURA OBLIGATORIA:

1. FLUJO PRINCIPAL DE EVENTOS
   1. Programaci\xF3n de ejecuci\xF3n
      a. Frecuencia: ${formData.serviceFrequency || "Definir frecuencia apropiada"}
      b. Hora espec\xEDfica: ${formData.executionTime || "Definir horario apropiado"}
      c. Configuraci\xF3n de horarios m\xFAltiples si aplica
   2. Proceso de ejecuci\xF3n
      a. Inicializaci\xF3n del servicio
      b. Validaci\xF3n de configuraciones
      c. Ejecuci\xF3n de la l\xF3gica principal
   3. Finalizaci\xF3n y logging
      a. Registro de resultados
      b. Notificaci\xF3n de completitud
      c. Limpieza de recursos temporales

2. FLUJOS ALTERNATIVOS
   1. Errores de configuraci\xF3n
      a. Archivos no encontrados
      b. Permisos insuficientes
      c. Configuraciones inv\xE1lidas
   2. Errores de conectividad
      a. Servicios externos no disponibles
      b. Timeout de conexiones
      c. Fallos de autenticaci\xF3n

${formData.configurationPaths ? `
3. CONFIGURACIONES REQUERIDAS
- Rutas de archivos: ${formData.configurationPaths}
- Las rutas deben ser configurables v\xEDa archivo de configuraci\xF3n
- Validaci\xF3n de existencia y permisos al inicio
- Para requerimientos especiales, indicar:
  a. Path configurables para archivos de entrada/salida
  b. Directorios de trabajo temporales
  c. Rutas de logs y archivos de error
` : ""}

${formData.webServiceCredentials ? `
3. CREDENCIALES DE SERVICIOS
- Configuraci\xF3n: ${formData.webServiceCredentials}
- Usuario, clave y URL deben ser configurables
- Almacenamiento seguro de credenciales
- Para requerimientos especiales, indicar:
  a. Usuario/clave para autenticaci\xF3n en servicios externos
  b. URLs de endpoints configurables por ambiente
  c. Tokens y certificados necesarios
` : ""}

4. REQUERIMIENTOS ESPECIALES
- Indicar configurables espec\xEDficos del proceso:
  a. Path para archivos de configuraci\xF3n y datos
  b. Usuario/clave/URL para web services externos
  c. Par\xE1metros de ejecuci\xF3n modificables sin recompilaci\xF3n
  d. Variables de entorno requeridas`;
  }
  return "";
}
async function registerRoutes(app2) {
  app2.post("/api/use-cases/generate", async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        businessRules: Array.isArray(req.body.businessRules) ? req.body.businessRules.join("\n") : req.body.businessRules || "",
        specialRequirements: Array.isArray(req.body.specialRequirements) ? req.body.specialRequirements.join("\n") : req.body.specialRequirements || "",
        // Convert null/undefined string fields to empty strings to prevent validation errors
        clientName: req.body.clientName || "",
        projectName: req.body.projectName || "",
        useCaseCode: req.body.useCaseCode || "",
        useCaseName: req.body.useCaseName || "",
        fileName: req.body.fileName || "",
        description: req.body.description || "",
        filtersDescription: req.body.filtersDescription || "",
        columnsDescription: req.body.columnsDescription || "",
        fieldsDescription: req.body.fieldsDescription || "",
        wireframesDescription: req.body.wireframesDescription || "",
        apiEndpoint: req.body.apiEndpoint || "",
        requestFormat: req.body.requestFormat || "",
        responseFormat: req.body.responseFormat || "",
        serviceFrequency: req.body.serviceFrequency || "",
        executionTime: req.body.executionTime || "",
        configurationPaths: req.body.configurationPaths || "",
        webServiceCredentials: req.body.webServiceCredentials || "",
        testCaseObjective: req.body.testCaseObjective || "",
        testCasePreconditions: req.body.testCasePreconditions || "",
        // Clean up entity fields - convert null values to empty strings
        entityFields: req.body.entityFields?.map((field) => ({
          ...field,
          name: field.name || "",
          type: field.type || "",
          description: field.description || "",
          validationRules: field.validationRules || "",
          message: field.message || "",
          length: field.length || null,
          mandatory: Boolean(field.mandatory)
        })) || [],
        // Clean up arrays
        searchFilters: Array.isArray(req.body.searchFilters) ? req.body.searchFilters : [],
        resultColumns: Array.isArray(req.body.resultColumns) ? req.body.resultColumns : [],
        wireframeDescriptions: Array.isArray(req.body.wireframeDescriptions) ? req.body.wireframeDescriptions : [],
        testSteps: Array.isArray(req.body.testSteps) ? req.body.testSteps.map((step) => ({
          number: step.number || 0,
          action: step.action || "",
          inputData: step.inputData || "",
          expectedResult: step.expectedResult || "",
          observations: step.observations || "",
          status: step.status || ""
        })) : []
      };
      const validatedData = useCaseFormSchema.parse(requestData);
      const specificRules = getSpecificRules(validatedData.useCaseType, validatedData);
      console.log(`\u{1F50D} Generating use case with type: ${validatedData.useCaseType}`);
      if (validatedData.useCaseType === "api") {
        console.log("\u{1F6A8} API rules should include FLUJO PRINCIPAL DE EVENTOS and FLUJOS ALTERNATIVOS");
        console.log(`\u{1F4DD} Rules length: ${(USE_CASE_RULES + "\n\n" + specificRules).length} characters`);
      }
      const response = await AIService.generateUseCase({
        aiModel: validatedData.aiModel,
        formData: validatedData,
        rules: USE_CASE_RULES + "\n\n" + specificRules
      });
      if (!response.success) {
        return res.status(500).json({
          message: response.error || "Error generando el caso de uso"
        });
      }
      let completeRawContent = response.content;
      if (validatedData.generateTestCase && (validatedData.testSteps?.length > 0 || validatedData.testCaseObjective || validatedData.testCasePreconditions)) {
        console.log("Adding test cases to generated document...");
        let testCaseSection = `
          <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;">CASOS DE PRUEBA</h2>
        `;
        if (validatedData.testCaseObjective) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Objetivo:</h3>
            <p style="margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;">${validatedData.testCaseObjective}</p>
          `;
        }
        if (validatedData.testCasePreconditions) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Precondiciones:</h3>
            <p style="margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;">${validatedData.testCasePreconditions}</p>
          `;
        }
        if (validatedData.testSteps?.length) {
          testCaseSection += `
            <h3 style="color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;">Pasos de Prueba:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 50px;">#</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Acci\xF3n</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Datos de Entrada</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Resultado Esperado</th>
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Observaciones</th>
                </tr>
              </thead>
              <tbody>
          `;
          validatedData.testSteps.forEach((step) => {
            testCaseSection += `
              <tr>
                <td style="border: 1px solid #666; padding: 8px; text-align: center;">${step.number}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.action || ""}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.inputData || ""}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.expectedResult || ""}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.observations || ""}</td>
              </tr>
            `;
          });
          testCaseSection += `
              </tbody>
            </table>
          `;
        }
        completeRawContent = response.content + testCaseSection;
        console.log("Test cases successfully added to raw content");
      }
      const finalContent = AIService.cleanAIResponse(completeRawContent);
      const insertData = insertUseCaseSchema.parse({
        ...validatedData,
        generatedContent: finalContent,
        searchFilters: validatedData.searchFilters,
        resultColumns: validatedData.resultColumns,
        entityFields: validatedData.entityFields
      });
      const useCase = await storage.createUseCase(insertData);
      res.json({
        success: true,
        useCase,
        content: finalContent,
        expandedDescription: response.expandedDescription
      });
    } catch (error) {
      console.error("Error generating use case:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Error de validaci\xF3n"
      });
    }
  });
  app2.post("/api/use-cases/:id/edit", async (req, res) => {
    try {
      const { id } = req.params;
      const { instructions, aiModel } = req.body;
      const useCase = await storage.getUseCase(id);
      if (!useCase) {
        return res.status(404).json({ message: "Caso de uso no encontrado" });
      }
      const response = await AIService.editUseCase(
        useCase.generatedContent || "",
        instructions,
        aiModel
      );
      if (!response.success) {
        return res.status(500).json({
          message: response.error || "Error editando el caso de uso"
        });
      }
      const updatedUseCase = await storage.updateUseCase(id, {
        generatedContent: response.content
      });
      res.json({
        success: true,
        useCase: updatedUseCase,
        content: response.content
      });
    } catch (error) {
      console.error("Error editing use case:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error interno del servidor"
      });
    }
  });
  app2.post("/api/ai-assist", async (req, res) => {
    try {
      const { fieldName, fieldValue, fieldType, context, aiModel } = req.body;
      console.log("\u{1F50D} AI Assist Request:", {
        fieldName,
        fieldValue: fieldValue || "[empty]",
        fieldType,
        aiModel,
        hasContext: !!context
      });
      if (!fieldName || !fieldType) {
        return res.status(400).json({ error: "Field name and type are required" });
      }
      const improvedValue = await AIService.improveField(fieldName, fieldValue, fieldType, context, aiModel);
      console.log("\u2705 AI Assist Response:", improvedValue ? `"${improvedValue.substring(0, 50)}..."` : "[empty]");
      res.json({ improvedValue });
    } catch (error) {
      console.error("\u274C Error with AI assist:", error);
      res.status(500).json({ error: "Error processing field with AI" });
    }
  });
  app2.post("/api/analyze-minute", async (req, res) => {
    try {
      const { minuteContent, useCaseType, aiModel = "demo", fileName } = req.body;
      if (!minuteContent && !fileName) {
        return res.status(400).json({
          error: "Se requiere contenido de minuta o archivo",
          success: false
        });
      }
      const aiServiceInstance = new AIService();
      const minuteAnalysisService = new MinuteAnalysisService(aiServiceInstance);
      const analysisResult = await minuteAnalysisService.analyzeMinute(
        minuteContent,
        useCaseType,
        aiModel
      );
      if (useCaseType === "service") {
        console.log("\u{1F3AF} Service Analysis Result:", {
          hasServiceFrequency: !!analysisResult.serviceFrequency,
          hasExecutionTime: !!analysisResult.executionTime,
          hasConfigPaths: !!analysisResult.configurationPaths,
          hasWebCredentials: !!analysisResult.webServiceCredentials,
          serviceFrequency: analysisResult.serviceFrequency,
          executionTime: analysisResult.executionTime
        });
      }
      res.json({
        success: true,
        formData: analysisResult
      });
    } catch (error) {
      console.error("Error analyzing minute:", error);
      res.status(500).json({
        error: "Failed to analyze minute",
        success: false,
        formData: {},
        aiGeneratedFields: {}
      });
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
    // 10MB limit
  });
  app2.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { originalname, buffer, mimetype } = req.file;
      const extension = originalname.substring(originalname.lastIndexOf(".")).toLowerCase();
      let extractedText = "";
      if (extension === ".docx" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } catch (error) {
          console.error("Error extracting text from DOCX:", error);
          return res.status(500).json({ error: "Error procesando el archivo DOCX" });
        }
      } else if (extension === ".xlsx" || extension === ".xls" || mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimetype === "application/vnd.ms-excel") {
        try {
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const texts = [];
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetText = XLSX.utils.sheet_to_txt(worksheet);
            texts.push(`=== Hoja: ${sheetName} ===
${sheetText}`);
          });
          extractedText = texts.join("\n\n");
        } catch (error) {
          console.error("Error extracting text from Excel:", error);
          return res.status(500).json({ error: "Error procesando el archivo Excel" });
        }
      } else if (extension === ".pptx") {
        try {
          const AdmZip = (await import("adm-zip")).default;
          const zip = new AdmZip(buffer);
          const zipEntries = zip.getEntries();
          const texts = [];
          let slideNumber = 0;
          const slideEntries = zipEntries.filter((entry) => entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")).sort((a, b) => {
            const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/)?.[1] || "0");
            const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/)?.[1] || "0");
            return numA - numB;
          });
          for (const slideEntry of slideEntries) {
            slideNumber++;
            const slideXml = slideEntry.getData().toString("utf8");
            const slideTexts = [];
            slideTexts.push(`=== Diapositiva ${slideNumber} ===`);
            const textMatches = slideXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
            if (textMatches) {
              textMatches.forEach((match) => {
                const text2 = match.replace(/<[^>]+>/g, "").trim();
                if (text2) {
                  slideTexts.push(text2);
                }
              });
            }
            const notesEntry = zipEntries.find(
              (entry) => entry.entryName === `ppt/notesSlides/notesSlide${slideNumber}.xml`
            );
            if (notesEntry) {
              const notesXml = notesEntry.getData().toString("utf8");
              const notesMatches = notesXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
              if (notesMatches && notesMatches.length > 0) {
                slideTexts.push("Notas:");
                notesMatches.forEach((match) => {
                  const text2 = match.replace(/<[^>]+>/g, "").trim();
                  if (text2) {
                    slideTexts.push(text2);
                  }
                });
              }
            }
            if (slideTexts.length > 1) {
              texts.push(slideTexts.join("\n"));
            }
          }
          extractedText = texts.join("\n\n");
          if (!extractedText || extractedText.trim() === "") {
            extractedText = "No se pudo extraer texto del archivo PowerPoint. El archivo puede estar vac\xEDo.";
          }
        } catch (error) {
          console.error("Error extracting text from PowerPoint:", error);
          return res.status(500).json({ error: "Error procesando el archivo PowerPoint" });
        }
      } else if (extension === ".ppt") {
        return res.status(400).json({
          error: "El formato .ppt (PowerPoint 97-2003) no est\xE1 soportado. Por favor, convierta el archivo a .pptx o copie y pegue el contenido manualmente."
        });
      } else {
        return res.status(400).json({ error: "Tipo de archivo no soportado" });
      }
      res.json({
        text: extractedText,
        filename: originalname
      });
    } catch (error) {
      console.error("Error extracting text:", error);
      res.status(500).json({ error: "Error procesando el archivo" });
    }
  });
  app2.post("/api/export-docx", async (req, res) => {
    try {
      const { content, fileName, useCaseName, formData, customHeaderImage } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required for DOCX export" });
      }
      console.log("\u{1F50D} DOCX Export - Using generateDirectFromFormData method");
      console.log("- formData exists:", !!formData);
      console.log("- formData keys:", formData ? Object.keys(formData) : []);
      if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
          message: "formData is required for DOCX export. The HTML conversion method is deprecated."
        });
      }
      const testCases = formData.testSteps || [];
      const docxBuffer = await DocumentService.generateDirectFromFormData(
        formData,
        testCases,
        customHeaderImage,
        content
        // Pass the AI-generated content with API sections
      );
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName || "caso-de-uso"}.docx"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error generando documento DOCX"
      });
    }
  });
  app2.get("/api/use-cases/:id/export", async (req, res) => {
    return res.status(410).json({
      message: "Este m\xE9todo de exportaci\xF3n ya no est\xE1 soportado. Por favor use el bot\xF3n de exportar en la interfaz principal que utiliza el m\xE9todo correcto con formData.",
      code: "LEGACY_EXPORT_DEPRECATED"
    });
  });
  app2.get("/api/use-cases", async (req, res) => {
    try {
      const useCases2 = await storage.getUserUseCases();
      res.json(useCases2);
    } catch (error) {
      console.error("Error fetching use cases:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error obteniendo casos de uso"
      });
    }
  });
  app2.get("/api/use-cases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const useCase = await storage.getUseCase(id);
      if (!useCase) {
        return res.status(404).json({ message: "Caso de uso no encontrado" });
      }
      res.json(useCase);
    } catch (error) {
      console.error("Error fetching use case:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error obteniendo el caso de uso"
      });
    }
  });
  app2.post("/api/generate-intelligent-tests", async (req, res) => {
    try {
      const { formData, aiModel = "demo" } = req.body;
      if (!formData) {
        return res.status(400).json({
          error: "Form data is required",
          success: false
        });
      }
      const aiServiceInstance = new AIService();
      const intelligentTestService = new IntelligentTestCaseService(aiServiceInstance);
      const testResult = await intelligentTestService.generateIntelligentTestCases(
        formData,
        aiModel
      );
      res.json({
        success: true,
        ...testResult
      });
    } catch (error) {
      console.error("Error generating intelligent test cases:", error);
      res.status(500).json({
        error: "Failed to generate intelligent test cases",
        success: false
      });
    }
  });
  app2.use(wireframe_routes_default);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use("/attached_assets", express2.static("attached_assets"));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
