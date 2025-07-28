import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// Initialize clients lazily to avoid startup errors when API keys are missing
let openai: OpenAI | null = null;
let anthropic: any | null = null;
let grokClient: OpenAI | null = null;
let gemini: GoogleGenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
  return openai!;
}

async function getAnthropicClient(): Promise<any> {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    const AnthropicSDK = (await import('@anthropic-ai/sdk')).default;
    anthropic = new AnthropicSDK({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic!;
}

function getGrokClient(): OpenAI {
  if (!grokClient && process.env.XAI_API_KEY) {
    grokClient = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
  }
  return grokClient!;
}

function getGeminiClient(): GoogleGenAI {
  if (!gemini && process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return gemini!;
}

export interface GenerateUseCaseRequest {
  aiModel: string;
  formData: any;
  rules: string;
}

export interface GenerateUseCaseResponse {
  content: string;
  success: boolean;
  error?: string;
}

export class AIService {
  
  static async generateUseCase(request: GenerateUseCaseRequest): Promise<GenerateUseCaseResponse> {
    const { aiModel, formData, rules } = request;

    if (aiModel === 'demo') {
      return this.generateDemoContent(formData);
    }

    try {
      const prompt = this.buildPrompt(formData, rules);
      
      let content: string;
      
      switch (aiModel) {
        case 'openai':
          content = await this.generateWithOpenAI(prompt);
          break;
        case 'claude':
          content = await this.generateWithClaude(prompt);
          break;
        case 'grok':
          content = await this.generateWithGrok(prompt);
          break;
        case 'gemini':
          content = await this.generateWithGemini(prompt);
          break;
        default:
          throw new Error(`Modelo de IA no soportado: ${aiModel}`);
      }

      // Clean content to remove any explanatory text before HTML
      const cleanedContent = this.cleanAIResponse(content);
      
      return {
        content: cleanedContent,
        success: true
      };
    } catch (error) {
      console.error('Error generating use case:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private static buildPrompt(formData: any, rules: string): string {
    return `INSTRUCCIÓN CRÍTICA: Tu respuesta DEBE comenzar inmediatamente con una etiqueta HTML (<div>, <h1>, <table>, etc.) y terminar con su etiqueta de cierre correspondiente. NO escribas NADA antes del HTML. NO escribas NADA después del HTML. NO incluyas explicaciones como "Claro, aquí tienes...", "Se han incorporado mejoras...", "actualizado con los cambios más recientes", etc. NO incluyas bloques de código con \`\`\`html. Responde SOLO con HTML puro.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO, no un resultado de ejecución. Debe contener secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

Genera un documento de caso de uso formal siguiendo estrictamente estas reglas:

${rules}

FORMATO ESPECÍFICO REQUERIDO:
1. Presenta los metadatos como tabla HTML con estilo inline:
   <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
     <tr><td style="border:1px solid #ccc; padding:8px; font-weight:bold;">Campo</td><td style="border:1px solid #ccc; padding:8px; font-weight:bold;">Valor</td></tr>
     <tr><td style="border:1px solid #ccc; padding:8px;">Nombre del Cliente</td><td style="border:1px solid #ccc; padding:8px;">${formData.clientName}</td></tr>
     <!-- etc... -->
   </table>

2. Para flujos, usa numeración jerárquica mejorada:
   4. Flujo Básico
     4.1 Menú principal
     4.2 Subflujo: Búsqueda
       4.2.1 Ingreso de filtros
       4.2.2 Ejecución de búsqueda
     4.3 Subflujo: Alta
       4.3.1 Validación de datos
       4.3.2 Confirmación

3. Historia de revisiones como tabla con estilo profesional:
   <table style="width:100%; border-collapse:collapse; font-size:11px; line-height:1.2;">
     <tr style="background-color:#f5f5f5;">
       <th style="border:1px solid #999; padding:6px;">Versión</th>
       <th style="border:1px solid #999; padding:6px;">Fecha</th>
       <th style="border:1px solid #999; padding:6px;">Autor</th>
       <th style="border:1px solid #999; padding:6px;">Descripción del Cambio</th>
     </tr>
     <tr>
       <td style="border:1px solid #999; padding:6px;">1.0</td>
       <td style="border:1px solid #999; padding:6px;">15/04/2024</td>
       <td style="border:1px solid #999; padding:6px;">Analista de Sistemas</td>
       <td style="border:1px solid #999; padding:6px;">Creación inicial del documento de caso de uso.</td>
     </tr>
   </table>

Datos del formulario:
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'Ninguno'}
- Columnas de resultado: ${formData.resultColumns?.join(', ') || 'Ninguna'}
- Campos de entidad: ${formData.entityFields?.map((f: any) => `${f.name} (${f.type}${f.mandatory ? ', obligatorio' : ''})`).join(', ') || 'Ninguno'}
- Reglas de negocio: ${formData.businessRules || 'Ninguna específica'}
- Requerimientos especiales: ${formData.specialRequirements || 'Ninguno'}
- Generar wireframes: ${formData.generateWireframes ? 'Sí' : 'No'}
${formData.wireframeDescriptions?.length ? `- Descripciones de wireframes: ${formData.wireframeDescriptions.filter((w: string) => w.trim()).join('; ')}` : ''}
${formData.alternativeFlows?.length ? `- Flujos alternativos: ${formData.alternativeFlows.filter((f: string) => f.trim()).join('; ')}` : ''}

Responde SOLO con el HTML del documento completo. Usa estilos inline para el formato Microsoft especificado. NO agregues explicaciones antes o después.`;
  }

  private static cleanAIResponse(content: string): string {
    // Remove any explanatory text before HTML
    let cleaned = content;
    
    // Remove common AI explanatory phrases and unwanted patterns
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
      /^.*?flujos.*?alternativos.*?\./gi,
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
    
    // Remove unwanted phrases
    unwantedPhrases.forEach(phrase => {
      cleaned = cleaned.replace(phrase, '');
    });
    
    // Find first HTML tag and start from there
    const htmlStart = cleaned.search(/<(?:div|h1|h2|h3|p|ol|ul|table)/i);
    if (htmlStart !== -1) {
      cleaned = cleaned.substring(htmlStart);
    }
    
    // Remove any trailing explanatory text after the last closing tag
    const lastCloseTag = cleaned.lastIndexOf('</');
    if (lastCloseTag !== -1) {
      const endOfLastTag = cleaned.indexOf('>', lastCloseTag) + 1;
      if (endOfLastTag > 0) {
        cleaned = cleaned.substring(0, endOfLastTag);
      }
    }
    
    // Final cleanup - remove any remaining unwanted content at the beginning
    cleaned = cleaned.replace(/^[^<]*(?=<)/, '');
    
    return cleaned.trim();
  }

  private static async generateWithOpenAI(prompt: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key no está configurada");
    }
    
    const client = getOpenAIClient();
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
    });

    return response.choices[0].message.content || '';
  }

  private static async generateWithClaude(prompt: string): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key no está configurada");
    }
    
    const client = await getAnthropicClient();
    // "claude-sonnet-4-20250514"
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.content[0].text || '';
  }

  private static async generateWithGrok(prompt: string): Promise<string> {
    if (!process.env.XAI_API_KEY) {
      throw new Error("Grok API key no está configurada");
    }
    
    const client = getGrokClient();
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
    });

    return response.choices[0].message.content || '';
  }

  private static async generateWithGemini(prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key no está configurada");
    }
    
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.",
      },
      contents: prompt,
    });

    return response.text || '';
  }

  private static generateDemoContent(formData: any): GenerateUseCaseResponse {
    const content = `
      <div style="font-family: 'Segoe UI', sans-serif; line-height: 1.2;">
        <h1 style="color: rgb(0, 112, 192); font-size: 18px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase;">
          ${formData.useCaseName || 'CASO DE USO DEMO'}
        </h1>
        
        <div style="margin-bottom: 16px;"><strong>Nombre del Cliente:</strong> ${formData.clientName || 'Cliente Demo'}</div>
        <div style="margin-bottom: 16px;"><strong>Nombre del Proyecto:</strong> ${formData.projectName || 'Proyecto Demo'}</div>
        <div style="margin-bottom: 16px;"><strong>Código del Caso de Uso:</strong> ${formData.useCaseCode || 'UC001'}</div>
        <div style="margin-bottom: 16px;"><strong>Nombre del Caso de Uso:</strong> ${formData.useCaseName || 'Gestionar Entidad Demo'}</div>
        <div style="margin-bottom: 20px;"><strong>Nombre del Archivo:</strong> ${formData.fileName || 'AB123Demo'}</div>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Descripción</h2>
        <p style="margin-bottom: 20px; text-align: justify;">${formData.description || 'Este es un caso de uso generado en modo demo para probar la funcionalidad del sistema.'}</p>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Flujo Principal de Eventos</h2>
        <ol style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 8px;">Buscar datos de la entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Filtros de búsqueda disponibles: ${formData.searchFilters?.join(', ') || 'ID, Nombre, Estado'}</li>
              <li style="margin-bottom: 4px;">Columnas del resultado de búsqueda: ${formData.resultColumns?.join(', ') || 'ID, Nombre, Fecha Creación, Estado'}</li>
            </ol>
          </li>
          <li style="margin-bottom: 8px;">Agregar una nueva entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Campos de la entidad: ${formData.entityFields?.map((f: any) => `${f.name} (${f.type}${f.mandatory ? ', obligatorio' : ''})`).join(', ') || 'Nombre (texto, obligatorio), Descripción (texto)'}</li>
              <li style="margin-bottom: 4px;">Al agregar se registra automáticamente la fecha y usuario de alta</li>
            </ol>
          </li>
        </ol>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Flujos Alternativos</h2>
        <ol style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 8px;">Modificar o actualizar una entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Se debe mostrar el identificador único</li>
              <li style="margin-bottom: 4px;">Se muestra la fecha y usuario de alta</li>
              <li style="margin-bottom: 4px;">Al modificar se registra la fecha y usuario de modificación</li>
            </ol>
          </li>
          <li style="margin-bottom: 8px;">Eliminar una entidad
            <ol style="margin-left: 0.2in; list-style-type: lower-alpha; margin-top: 4px;">
              <li style="margin-bottom: 4px;">Se debe verificar que no tenga relaciones con otras entidades</li>
            </ol>
          </li>
        </ol>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Reglas de Negocio</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Los datos obligatorios deben ser validados antes de guardar</li>
          <li style="margin-bottom: 4px;">Se debe mantener un log de auditoría de todas las operaciones</li>
          ${formData.businessRules ? `<li style="margin-bottom: 4px;">${formData.businessRules}</li>` : ''}
        </ul>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Requerimientos Especiales</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">El sistema debe responder en menos de 3 segundos</li>
          <li style="margin-bottom: 4px;">Se debe implementar paginación para resultados mayores a 50 registros</li>
          ${formData.specialRequirements ? `<li style="margin-bottom: 4px;">${formData.specialRequirements}</li>` : ''}
        </ul>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Precondiciones</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">El usuario debe estar autenticado en el sistema</li>
          <li style="margin-bottom: 4px;">El usuario debe tener permisos para gestionar la entidad</li>
        </ul>
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Postcondiciones</h2>
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Los cambios se reflejan inmediatamente en la base de datos</li>
          <li style="margin-bottom: 4px;">Se genera una entrada en el log de auditoría</li>
        </ul>
        
        ${formData.generateWireframes ? `
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Boceto Gráfico de Interfaz de Usuario</h2>
        
        <h3 style="font-weight: 600; margin: 16px 0 8px 0;">Buscador de Entidades</h3>
        <p style="margin-bottom: 12px; text-align: justify;">La interfaz del buscador incluye una sección superior con campos de filtro organizados horizontalmente. En el centro se muestra una grilla con los resultados de búsqueda con paginación en la parte inferior. Los botones de acción (Buscar, Limpiar, Agregar) se ubican en la parte superior derecha. Cada fila de resultados incluye botones de Editar y Eliminar al final.</p>
        
        <h4 style="font-weight: 600; margin: 12px 0 6px 0;">Funcionalidades del buscador:</h4>
        <ul style="margin-left: 20px; margin-bottom: 16px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'ID, Nombre, Estado'}</li>
          <li style="margin-bottom: 4px;">Columnas de resultado: ${formData.resultColumns?.join(', ') || 'ID, Nombre, Fecha Creación, Estado'}</li>
          <li style="margin-bottom: 4px;">Implementa paginación cuando hay más de 50 registros</li>
        </ul>
        
        <h3 style="font-weight: 600; margin: 16px 0 8px 0;">Interfaz para Agregar Entidad</h3>
        <p style="margin-bottom: 12px; text-align: justify;">El formulario de alta se presenta en una ventana modal o página separada con campos organizados en secciones lógicas. Los botones Aceptar y Cancelar se ubican en la parte inferior derecha. Los campos de fecha y usuario de alta/modificación se muestran como solo lectura.</p>
        
        <h4 style="font-weight: 600; margin: 12px 0 6px 0;">Funcionalidades del formulario:</h4>
        <ul style="margin-left: 20px; margin-bottom: 16px; padding-left: 0;">
          ${formData.entityFields?.map((f: any) => 
            `<li style="margin-bottom: 4px;">${f.name}: ${f.type}${f.mandatory ? ' (obligatorio)' : ''}${f.length ? `, longitud máxima ${f.length}` : ''}</li>`
          ).join('') || '<li style="margin-bottom: 4px;">Nombre: texto (obligatorio), longitud máxima 100</li><li style="margin-bottom: 4px;">Descripción: texto, longitud máxima 500</li>'}
          <li style="margin-bottom: 4px;">Fecha y usuario de alta: automático, solo lectura</li>
          <li style="margin-bottom: 4px;">Fecha y usuario de modificación: automático, solo lectura</li>
        </ul>
        ` : ''}
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0;">HISTORIA DE REVISIONES Y APROBACIONES</h2>
        <table style="width: 2.17in; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Fecha</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Acción</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle;">Responsable</th>
              <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; vertical-align: middle; width: 200px;">Comentario</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">26/7/2025</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Versión original</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Sistema Demo</td>
              <td style="border: 1px solid #666; padding: 8px; text-align: left; vertical-align: middle;">Generado vía modo demo</td>
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

    return {
      content,
      success: true
    };
  }

  static async editUseCase(content: string, instructions: string, aiModel: string): Promise<GenerateUseCaseResponse> {
    if (aiModel === 'demo') {
      return {
        content: content + `\n\n<div style="background-color: #e6ffe6; padding: 10px; margin-top: 20px; border-left: 4px solid #28a745;"><strong>Modo Demo:</strong> Se aplicarían los cambios: "${instructions}"</div>`,
        success: true
      };
    }

    try {
      const prompt = `INSTRUCCIÓN CRÍTICA: Tu respuesta DEBE comenzar inmediatamente con una etiqueta HTML (<div>, <h1>, <table>, etc.) y terminar con su etiqueta de cierre correspondiente. NO escribas NADA antes del HTML. NO escribas NADA después del HTML. NO incluyas explicaciones como "Claro, aquí tienes...", "Se han incorporado mejoras...", "actualizado con los cambios más recientes", "estructurado profesionalmente", etc. NO incluyas bloques de código con \`\`\`html. Responde SOLO con HTML puro.

Modifica el siguiente documento de caso de uso aplicando estos cambios: "${instructions}"

Documento actual:
${content}

Devuelve el documento completo modificado manteniendo exactamente el formato HTML y el estilo Microsoft. NO agregues texto explicativo.`;

      let modifiedContent: string;
      
      switch (aiModel) {
        case 'openai':
          modifiedContent = await this.generateWithOpenAI(prompt);
          break;
        case 'claude':
          modifiedContent = await this.generateWithClaude(prompt);
          break;
        case 'grok':
          modifiedContent = await this.generateWithGrok(prompt);
          break;
        case 'gemini':
          modifiedContent = await this.generateWithGemini(prompt);
          break;
        default:
          throw new Error(`Modelo de IA no soportado: ${aiModel}`);
      }

      // Clean content to remove any explanatory text before HTML
      const cleanedContent = this.cleanAIResponse(modifiedContent);
      
      return {
        content: cleanedContent,
        success: true
      };
    } catch (error) {
      console.error('Error editing use case:', error);
      return {
        content,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async improveField(fieldName: string, fieldValue: string, fieldType: string, context?: any, aiModel?: string): Promise<string> {
    const service = new AIService();
    // Set the model if provided, otherwise keep the default 'demo'
    if (aiModel && aiModel !== 'demo') {
      (service as any).selectedModel = aiModel;
    }
    return service.improveFieldInstance(fieldName, fieldValue, fieldType, context, aiModel);
  }

  private async improveFieldInstance(fieldName: string, fieldValue: string, fieldType: string, context?: any, aiModel?: string): Promise<string> {
    try {
      // Handle specialized field types FIRST (works for both AI and demo modes)
      if (fieldType === 'wireframeDescription') {
        return this.generateIntelligentWireframeDescription(fieldValue);
      }
      if (fieldType === 'alternativeFlow') {
        return this.generateIntelligentAlternativeFlow(fieldValue);
      }
      if (fieldType === 'businessRules') {
        return this.generateIntelligentBusinessRules(fieldValue);
      }
      if (fieldType === 'specialRequirements') {
        return this.generateIntelligentSpecialRequirements(fieldValue);
      }
      
      // If no AI model specified or it's demo, use demo mode for other fields
      if (!aiModel || aiModel === 'demo') {
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      
      // For special field types, use the specialized processing logic
      if (fieldType === 'filtersFromText' || fieldType === 'columnsFromText') {
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      
      // For fieldsFromText, try AI first but fallback to enhanced demo if it fails
      if (fieldType === 'fieldsFromText') {
        try {
          return await this.processEntityFieldsWithAI(fieldValue, aiModel);
        } catch (error) {
          return this.generateEnhancedEntityFields(fieldValue);
        }
      }
      
      // Use real AI for regular field improvements
      const rules = this.getFieldRules(fieldName, fieldType, context);
      const contextPrompt = this.buildContextualPrompt(context);
      
      const prompt = `${contextPrompt}

TAREA: Mejora el siguiente campo según las reglas especificadas.

CAMPO: ${fieldName}
VALOR ACTUAL: "${fieldValue}"
TIPO: ${fieldType}

REGLAS:
${rules}

INSTRUCCIONES:
- Devuelve SOLO el valor mejorado, sin explicaciones
- Mantén el formato y estructura apropiados
- Si el campo está vacío, proporciona un ejemplo profesional y relevante
- Para descripciones, usa lenguaje técnico pero comprensible

RESPUESTA:`;

      // Log prompt in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🤖 AI ASSIST PROMPT LOG:');
        console.log('Field:', fieldName);
        console.log('Type:', fieldType);
        console.log('AI Model:', aiModel);
        console.log('Use Case Type:', context?.fullFormData?.useCaseType || 'N/A');
        console.log('Full Prompt:');
        console.log('---');
        console.log(prompt);
        console.log('---\n');
      }

      let improvedValue: string;
      
      switch (aiModel) {
        case 'openai':
          improvedValue = await this.callOpenAIForImprovement(prompt);
          break;
        case 'claude':
          improvedValue = await this.callClaudeForImprovement(prompt);
          break;
        case 'grok':
          improvedValue = await this.callGrokForImprovement(prompt);
          break;
        case 'gemini':
          improvedValue = await this.callGeminiForImprovement(prompt);
          break;
        default:
          return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      
      // Log AI response in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 AI RESPONSE:', improvedValue);
        console.log('---\n');
      }

      return improvedValue || fieldValue;
      
    } catch (error) {
      console.error('Error improving field:', error);
      // Fallback to demo mode if AI fails
      return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
    }
  }

  private getFieldRules(fieldName: string, fieldType: string, context?: any): string {
    const fieldName_lower = fieldName.toLowerCase();
    const useCaseType = context?.fullFormData?.useCaseType || 'entidad';
    
    // Base ING compliance rules
    const ingCompliance = this.getINGComplianceRules(useCaseType);
    
    if (fieldName_lower.includes('nombre') && fieldName_lower.includes('cliente')) {
      return `${ingCompliance}\n- Debe ser un nombre de empresa real o banco\n- Primera letra mayúscula\n- Sin abreviaciones innecesarias`;
    }
    
    if (fieldName_lower.includes('proyecto')) {
      return `${ingCompliance}\n- Debe describir un sistema o proyecto tecnológico\n- Formato profesional\n- Relacionado con el cliente`;
    }
    
    if (fieldName_lower.includes('codigo')) {
      return `${ingCompliance}\n- Formato: 2 letras mayúsculas + 3 números (ej: CL005, AB123)\n- Las letras deben relacionarse con el módulo o área`;
    }
    
    if (fieldName_lower.includes('nombre') && fieldName_lower.includes('caso')) {
      return `${ingCompliance}\n- OBLIGATORIO: Debe comenzar con verbo en infinitivo (Gestionar, Crear, Consultar, etc.)\n- Prepara para título en mayúsculas RGB(0,112,192)\n- Describe claramente la funcionalidad\n- Sin artículos innecesarios\n${this.getUseCaseTypeSpecificRules(useCaseType)}`;
    }
    
    if (fieldName_lower.includes('archivo')) {
      return `${ingCompliance}\n- Formato exacto: 2 letras + 3 números + nombre descriptivo sin espacios\n- Ejemplo: BP005GestionarClientesPremium\n- Sin caracteres especiales`;
    }
    
    if (fieldName_lower.includes('descripcion')) {
      return `${ingCompliance}\n- Explicación clara del alcance del caso de uso (50-200 palabras)\n- Incluye flujos principales con listas indentadas:\n  1. Flujo principal (ej. Buscar [entidad])\n  a. Detallar filtros y columnas\n- Menciona precondiciones y postcondiciones\n- Lenguaje técnico pero comprensible\n${this.getUseCaseTypeSpecificRules(useCaseType)}`;
    }
    
    if (fieldName_lower.includes('reglas') && fieldName_lower.includes('negocio')) {
      return `${ingCompliance}\n- Lista numerada multi-nivel (1, a, i) con indent 0.2\n- Cada regla debe ser específica y verificable\n- Incluir validaciones de datos obligatorias\n- Mencionar restricciones de seguridad\n- Para modificar/eliminar: incluir verificaciones`;
    }
    
    if (fieldName_lower.includes('requerimientos')) {
      return `${ingCompliance}\n- Requerimientos técnicos específicos en lista numerada\n- Tiempos de respuesta con límites máximos\n- Integraciones con formato de intercambio\n- Validaciones obligatorias\n- Tecnologías si aplica`;
    }
    
    if (fieldType === 'searchFilter') {
      return `${ingCompliance}\n- Nombre del campo de búsqueda\n- Debe ser un campo lógico de la entidad\n- Formato lista multi-nivel: 1. Filtro por [campo], a. Lógica [igual/mayor]`;
    }
    
    if (fieldType === 'resultColumn') {
      return `${ingCompliance}\n- Columnas para tabla de resultados\n- Información relevante para identificar registros\n- Formato multi-nivel con indent 0.2`;
    }
    
    if (fieldType === 'entityField') {
      return `${ingCompliance}\n- Campo de entidad con tipo/longitud/obligatorio\n- Auto-incluir: fechaAlta (date, mandatory), usuarioAlta (text, mandatory)\n- Tipos ING: text/email/number/date/boolean\n- Nombres descriptivos técnicamente precisos`;
    }
    
    return `${ingCompliance}\n- Seguir buenas prácticas de documentación técnica\n- Usar lenguaje claro y profesional\n- Mantener coherencia con el resto del formulario`;
  }

  private getINGComplianceRules(useCaseType: string): string {
    return `CUMPLE MINUTA ING vr19: Segoe UI Semilight, interlineado simple, títulos azul RGB(0,112,192), listas multi-nivel (1-a-i), formato profesional`;
  }

  private getUseCaseTypeSpecificRules(useCaseType: string): string {
    switch (useCaseType) {
      case 'entidad':
        return '\n- Para entidades: incluye filtros/columnas de búsqueda\n- Flujos CRUD (buscar, agregar, modificar, eliminar)\n- Wireframes con paginado y botones estándar';
      case 'api':
        return '\n- Para APIs: incluye request/response detallados\n- Códigos de error y manejo de excepciones\n- Documentación de endpoints';
      case 'proceso':
        return '\n- Para procesos: describe secuencia de pasos\n- Validaciones en cada etapa\n- Puntos de control y rollback';
      default:
        return '\n- Adapta según tipo de caso de uso especificado';
    }
  }

  private buildContextualPrompt(context?: any): string {
    if (!context || !context.fullFormData) {
      return 'CONTEXTO: Información limitada disponible.';
    }
    
    const formData = context.fullFormData;
    let contextPrompt = 'CONTEXTO DEL PROYECTO:\n';
    
    if (formData.clientName) {
      contextPrompt += `- Cliente: ${formData.clientName}\n`;
    }
    
    if (formData.projectName) {
      contextPrompt += `- Proyecto: ${formData.projectName}\n`;
    }
    
    if (formData.useCaseName) {
      contextPrompt += `- Caso de Uso: ${formData.useCaseName}\n`;
    }
    
    if (formData.useCaseType) {
      contextPrompt += `- Tipo: ${formData.useCaseType}\n`;
    }
    
    if (formData.description) {
      contextPrompt += `- Descripción: ${formData.description}\n`;
    }
    
    return contextPrompt;
  }

  private async callOpenAIForImprovement(prompt: string): Promise<string> {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });
    return response.choices[0].message.content || '';
  }

  private async callClaudeForImprovement(prompt: string): Promise<string> {
    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    return response.content[0].text || '';
  }

  private async callGrokForImprovement(prompt: string): Promise<string> {
    const grok = getGrokClient();
    const response = await grok.chat.completions.create({
      model: 'grok-2-1212',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });
    return response.choices[0].message.content || '';
  }

  private async callGeminiForImprovement(prompt: string): Promise<string> {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
        temperature: 0.3
      }
    });
    return response.text || '';
  }

  private async processEntityFieldsWithAI(fieldValue: string, aiModel: string): Promise<string> {
    if (!fieldValue || fieldValue.trim() === '') {
      // Return demo content for empty fields with ING compliance
      return this.generateDefaultEntityFieldsWithINGCompliance();
    }

    const prompt = `CUMPLE MINUTA ING vr19: Auto-incluir campos obligatorios para entidades, tipos estándar ING.

Convierte esta descripción de campos en JSON:

"${fieldValue}"

Formato requerido:
[
  {"name": "nombreCampo", "type": "text", "mandatory": true, "length": 100}
]

Reglas ING:
- Auto-incluir SIEMPRE: 
  * {"name": "fechaAlta", "type": "date", "mandatory": true}
  * {"name": "usuarioAlta", "type": "text", "mandatory": true, "length": 50}
  * {"name": "fechaModificacion", "type": "date", "mandatory": false}  
  * {"name": "usuarioModificacion", "type": "text", "mandatory": false, "length": 50}
- Nombres en camelCase español
- Tipos ING: "text", "email", "number", "date", "boolean"
- mandatory: true si dice "obligatorio", false si dice "opcional"
- length: especificar cuando sea relevante
- Para IDs: usar "number" y mandatory: true
- Responde SOLO el JSON sin explicaciones`;

    try {
      let response: string;
      
      switch (aiModel) {
        case 'openai':
          response = await this.callOpenAIForImprovement(prompt);
          break;
        case 'claude':
          response = await this.callClaudeForImprovement(prompt);
          break;
        case 'grok':
          response = await this.callGrokForImprovement(prompt);
          break;
        case 'gemini':
          response = await this.callGeminiForImprovement(prompt);
          break;
        default:
          return this.getDemoFieldImprovement('', fieldValue, 'fieldsFromText');
      }
      
      // Clean the response to extract just the JSON
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
      
      const jsonStart = cleanedResponse.indexOf('[');
      const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd);
        // Validate it's proper JSON
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

  private generateEnhancedEntityFields(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return this.generateDefaultEntityFieldsWithINGCompliance();
    }

    const text = fieldValue.toLowerCase();
    const fields: any[] = [];

    // Patterns to identify different field types and characteristics
    const fieldPatterns = [
      // Nombre patterns
      { patterns: ['nombre completo', 'nombre'], name: 'nombreCompleto', type: 'text' },
      { patterns: ['apellido'], name: 'apellido', type: 'text' },
      
      // Contact patterns
      { patterns: ['email', 'correo electronico', 'correo'], name: 'email', type: 'email' },
      { patterns: ['telefono', 'teléfono', 'celular'], name: 'telefono', type: 'text' },
      
      // Date patterns
      { patterns: ['fecha de nacimiento', 'fechanacimiento', 'nacimiento'], name: 'fechaNacimiento', type: 'date' },
      { patterns: ['fecha de alta', 'fecha alta', 'fechaalta'], name: 'fechaAlta', type: 'date' },
      { patterns: ['fecha de registro', 'fecha registro'], name: 'fechaRegistro', type: 'date' },
      { patterns: ['fecha'], name: 'fecha', type: 'date' },
      
      // ID patterns
      { patterns: ['numero de cliente', 'numero cliente', 'numerocliente'], name: 'numeroCliente', type: 'text' },
      { patterns: ['dni', 'documento'], name: 'dni', type: 'text' },
      { patterns: ['cuit', 'cuil'], name: 'cuit', type: 'text' },
      { patterns: ['codigo'], name: 'codigo', type: 'text' },
      { patterns: ['id'], name: 'id', type: 'number' },
      
      // Status patterns
      { patterns: ['estado', 'estatus'], name: 'estado', type: 'boolean' },
      { patterns: ['activo'], name: 'activo', type: 'boolean' },
      
      // Address patterns
      { patterns: ['direccion', 'dirección'], name: 'direccion', type: 'text' },
      { patterns: ['ciudad'], name: 'ciudad', type: 'text' },
      { patterns: ['provincia'], name: 'provincia', type: 'text' },
      { patterns: ['codigo postal', 'codigopostal'], name: 'codigoPostal', type: 'text' },
      
      // Other common patterns
      { patterns: ['edad'], name: 'edad', type: 'number' },
      { patterns: ['sueldo', 'salario'], name: 'sueldo', type: 'number' }
    ];

    // Extract field information from text
    fieldPatterns.forEach(pattern => {
      pattern.patterns.forEach(pat => {
        if (text.includes(pat)) {
          // Check if field already exists
          if (!fields.some(f => f.name === pattern.name)) {
            // Extract length if specified
            const lengthMatch = text.match(new RegExp(`${pat}[^,]*?(?:máximo|maximo)\\s+(\\d+)\\s+caracteres`, 'i'));
            const length = lengthMatch ? parseInt(lengthMatch[1]) : undefined;
            
            // Check if mandatory
            const mandatory = text.includes(`${pat}[^,]*?obligatorio`) || text.includes(`${pat}[^,]*?requerido`);
            const optional = text.includes(`${pat}[^,]*?opcional`);
            
            fields.push({
              name: pattern.name,
              type: pattern.type,
              mandatory: mandatory ? true : optional ? false : true, // Default to true if not specified
              ...(length && { length })
            });
          }
        }
      });
    });

    // If no fields were extracted, provide a basic structure
    if (fields.length === 0) {
      return '[\n  {"name": "nombre", "type": "text", "mandatory": true},\n  {"name": "email", "type": "email", "mandatory": true},\n  {"name": "telefono", "type": "text", "mandatory": false}\n]';
    }

    // Always add mandatory ING compliance fields
    const ingFields = [
      { name: 'fechaAlta', type: 'date', mandatory: true },
      { name: 'usuarioAlta', type: 'text', mandatory: true, length: 50 },
      { name: 'fechaModificacion', type: 'date', mandatory: false },
      { name: 'usuarioModificacion', type: 'text', mandatory: false, length: 50 }
    ];

    fields.push(...ingFields);

    return JSON.stringify(fields, null, 2);
  }

  private generateDefaultEntityFieldsWithINGCompliance(): string {
    const defaultFields = [
      { name: 'numeroCliente', type: 'text', mandatory: true, length: 20 },
      { name: 'nombreCompleto', type: 'text', mandatory: true, length: 100 },
      { name: 'email', type: 'email', mandatory: true },
      { name: 'telefono', type: 'text', mandatory: false, length: 15 },
      { name: 'fechaAlta', type: 'date', mandatory: true },
      { name: 'usuarioAlta', type: 'text', mandatory: true, length: 50 },
      { name: 'fechaModificacion', type: 'date', mandatory: false },
      { name: 'usuarioModificacion', type: 'text', mandatory: false, length: 50 }
    ];
    
    return JSON.stringify(defaultFields, null, 2);
  }

  private cleanInputText(text: string): string {
    // Remove quotes at the beginning and end (including smart quotes)
    text = text.replace(/^["'"'"„«»]+|["'"'"„«»]+$/g, '');
    
    // Remove quotes around individual phrases within commas
    text = text.replace(/"([^"]+)"/g, '$1');
    text = text.replace(/'([^']+)'/g, '$1');
    text = text.replace(/'([^']+)'/g, '$1');
    text = text.replace(/"([^"]+)"/g, '$1');
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Convert to lowercase for better processing, except first letter
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    
    return text;
  }

  private formatProfessionalText(text: string): string {
    // Clean the text first
    text = this.cleanInputText(text);
    
    // Ensure first letter is uppercase
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Add period if missing
    if (!text.endsWith('.') && !text.endsWith(';') && !text.endsWith(':')) {
      text += '.';
    }
    
    return text;
  }

  private formatBusinessRuleText(text: string): string {
    // Remove quotes at the beginning and end
    text = text.replace(/^["'"'"„«»]+|["'"'"„«»]+$/g, '');
    
    // Remove quotes around individual phrases
    text = text.replace(/"([^"]+)"/g, '$1');
    text = text.replace(/'([^']+)'/g, '$1');
    text = text.replace(/'([^']+)'/g, '$1');
    text = text.replace(/"([^"]+)"/g, '$1');
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter and keep the rest as is (don't force lowercase)
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    // Add period if missing
    if (!text.endsWith('.') && !text.endsWith(';') && !text.endsWith(':')) {
      text += '.';
    }
    
    return text;
  }

  private generateIntelligentWireframeDescription(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return 'Wireframe ING con panel de búsqueda (filtros: Número de cliente, Apellido, DNI, Segmento, Estado, Fecha de alta), botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING mostrando ID Cliente, Nombre Completo, Email, Teléfono, Estado y botones Editar/Eliminar por fila. UI textual según minuta ING.';
    }

    let description = this.cleanInputText(fieldValue);
    const text = description.toLowerCase();

    // Enhance basic descriptions with ING-specific details
    if (text.length < 50) {
      // Add ING context if description is too short
      if (text.includes('buscar') || text.includes('filtro')) {
        description = `Panel de búsqueda ING con ${description}, botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING y opciones de editar/eliminar por fila.`;
      } else if (text.includes('formulario') || text.includes('form')) {
        description = `Formulario ING estructurado con ${description}. Incluye validaciones ING estándar y botones Guardar/Cancelar. Layout según minuta ING.`;
      } else if (text.includes('tabla') || text.includes('list')) {
        description = `${description} con paginado ING, ordenamiento y botones de acción (Editar/Eliminar/Ver Detalle) por fila según estándares ING.`;
      } else {
        description = `Wireframe ING con ${description}. Incluye botones estándar (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado ING. UI textual describiendo layout según minuta ING.`;
      }
    } else {
      // For longer descriptions, add ING compliance elements
      if (!text.includes('ing') && !text.includes('boton') && !text.includes('paginado')) {
        description += '. Incluye botones estándar ING (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado según minuta ING';
      }
    }

    return this.formatProfessionalText(description);
  }

  private generateIntelligentAlternativeFlow(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return 'Cliente inexistente: Al buscar un cliente que no existe en la base de datos, mostrar mensaje "Cliente no encontrado" con opciones para "Crear nuevo cliente" o "Refinar búsqueda".';
    }

    let flow = this.cleanInputText(fieldValue);
    const text = flow.toLowerCase();

    // Add structure if missing
    if (!flow.includes(':')) {
      // Add a descriptive title
      if (text.includes('error') || text.includes('falla')) {
        flow = `Error del sistema: ${flow}`;
      } else if (text.includes('no encontr') || text.includes('inexistent')) {
        flow = `Registro inexistente: ${flow}`;
      } else if (text.includes('permiso') || text.includes('acceso')) {
        flow = `Sin permisos: ${flow}`;
      } else {
        flow = `Situación alternativa: ${flow}`;
      }
    }

    // Ensure professional formatting and add resolution if missing
    if (!text.includes('mostrar') && !text.includes('mensaje') && !text.includes('opcion')) {
      flow += '. Mostrar mensaje informativo con opciones para el usuario';
    }

    return this.formatProfessionalText(flow);
  }

  private generateIntelligentBusinessRules(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return '1. El DNI debe ser único en el sistema\n2. No se puede eliminar un cliente con productos activos\n3. El email debe tener formato válido\n4. Solo usuarios con rol "Supervisor" pueden eliminar clientes\n5. Registro automático en bitácora de alta/modificación/eliminación';
    }

    // Clean input without forcing lowercase for business rules  
    let text = fieldValue.trim();
    
    // Split by sentences, commas, or line breaks
    const parts = text.split(/[.,;\n]/).filter(part => part.trim() !== '');
    let rules: string[] = [];

    parts.forEach((part) => {
      let rule = part.trim();
      if (rule.length === 0) return;
      
      // Remove existing numbering to avoid duplication
      rule = rule.replace(/^\d+\.\s*/, '');
      
      // Skip if it's just a number or empty after cleaning
      if (rule.match(/^\d+\.?\s*$/) || rule.length === 0) return;
      
      // Clean the rule text without forcing lowercase
      rule = this.formatBusinessRuleText(rule);
      
      // Add new numbering
      rule = `${rules.length + 1}. ${rule}`;
      
      rules.push(rule);
    });

    return rules.join('\n');
  }

  private generateIntelligentSpecialRequirements(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return '1. Integración con servicio externo de scoring crediticio al momento del alta\n2. Combo "Segmento" cargado dinámicamente desde tabla paramétrica\n3. Tiempo de respuesta máximo: 3 segundos para búsquedas\n4. Validación HTTPS obligatoria para todas las transacciones\n5. Auditoria completa de cambios con timestamp y usuario';
    }

    // Clean and normalize input
    let text = this.cleanInputText(fieldValue);
    
    // Split by sentences, commas, or line breaks
    const parts = text.split(/[.,;\n]/).filter(part => part.trim() !== '');
    let requirements: string[] = [];

    parts.forEach((part) => {
      let req = part.trim();
      if (req.length === 0) return;
      
      // Remove existing numbering to avoid duplication
      req = req.replace(/^\d+\.\s*/, '');
      
      // Skip if it's just a number or empty after cleaning
      if (req.match(/^\d+\.?\s*$/) || req.length === 0) return;
      
      // Clean the requirement text
      req = this.cleanInputText(req);
      
      // Add new numbering
      req = `${requirements.length + 1}. ${req}`;
      
      // Enhance technical requirements
      const lowerReq = req.toLowerCase();
      if (lowerReq.includes('tiempo') && !lowerReq.includes('máximo') && !lowerReq.includes('segundos')) {
        req += ' (especificar límite máximo aceptable)';
      }
      if (lowerReq.includes('integra') && !lowerReq.includes('formato')) {
        req += ' - definir formato de intercambio de datos';
      }
      if (lowerReq.includes('validac') && !lowerReq.includes('obligator')) {
        req += ' con validación obligatoria';
      }
      
      // Professional formatting
      req = this.formatProfessionalText(req);
      
      requirements.push(req);
    });

    return requirements.join('\n');
  }

  private getDemoFieldImprovement(fieldName: string, fieldValue: string, fieldType: string): string {
    const fieldName_lower = fieldName.toLowerCase();
    
    if (!fieldValue || fieldValue.trim() === '') {
      // Provide examples for empty fields
      if ((fieldName_lower.includes('nombre') && fieldName_lower.includes('cliente')) || fieldName_lower === 'clientname') {
        return 'Banco Provincia';
      }
      if (fieldName_lower.includes('proyecto') || fieldName_lower === 'projectname') {
        return 'Gestión Integral de Clientes';
      }
      if (fieldName_lower.includes('codigo')) {
        return 'CL005';
      }
      if (fieldName_lower.includes('nombre') && fieldName_lower.includes('caso')) {
        return 'Gestionar Clientes Premium';
      }
      if (fieldName_lower.includes('archivo')) {
        return 'BP005GestionarClientesPremium';
      }
      if (fieldName_lower.includes('descripcion')) {
        return 'Este caso de uso permite al operador del área de atención gestionar los datos de clientes del segmento Premium. Incluye funcionalidades de búsqueda, alta, modificación y eliminación de clientes, validando condiciones específicas según políticas del banco.';
      }
      if (fieldType === 'searchFilter') {
        return 'Número de cliente';
      }
      if (fieldType === 'resultColumn') {
        return 'ID Cliente';
      }
      if (fieldType === 'entityField') {
        return 'numeroCliente';
      }
      if (fieldType === 'apiEndpoint') {
        return 'https://api.banco.com/v1/clientes';
      }
      if (fieldName_lower.includes('request')) {
        return '{\n  "numeroCliente": "string",\n  "nombre": "string",\n  "email": "string"\n}';
      }
      if (fieldName_lower.includes('response')) {
        return '{\n  "success": "boolean",\n  "data": {\n    "id": "number",\n    "cliente": "object"\n  },\n  "status": 200\n}';
      }
      if (fieldType === 'filtersFromText') {
        return 'Número de cliente\nNombre completo\nEstado del cliente\nFecha de registro';
      }
      if (fieldType === 'columnsFromText') {
        return 'ID Cliente\nNombre Completo\nEmail\nTeléfono\nEstado';
      }
      if (fieldType === 'fieldsFromText') {
        return this.generateDefaultEntityFieldsWithINGCompliance();
      }
      if (fieldType === 'wireframeDescription') {
        return this.generateIntelligentWireframeDescription(fieldValue);
      }
      if (fieldType === 'alternativeFlow') {
        return this.generateIntelligentAlternativeFlow(fieldValue);
      }
      if (fieldType === 'businessRules') {
        return this.generateIntelligentBusinessRules(fieldValue);
      }
      if (fieldType === 'specialRequirements') {
        return this.generateIntelligentSpecialRequirements(fieldValue);
      }
      
      // Fallback for any unhandled empty field
      return 'Ejemplo generado automáticamente según reglas ING';
    }
    
    // NOTE: Specialized field types are now handled in improveFieldInstance BEFORE calling this function
    // This section is kept for backwards compatibility but should not be reached for specialized types
    
    // Improve existing values that have content
    if (fieldName_lower.includes('nombre') && fieldName_lower.includes('caso')) {
      const verbs = ['gestionar', 'crear', 'consultar', 'administrar', 'configurar', 'procesar'];
      const startsWithVerb = verbs.some(verb => fieldValue.toLowerCase().startsWith(verb));
      if (!startsWithVerb) {
        return `Gestionar ${fieldValue}`;
      }
      // Capitalize first letter
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    
    if (fieldName_lower.includes('codigo')) {
      // Ensure format XX000
      if (!/^[A-Z]{2}\d{3}$/.test(fieldValue)) {
        return 'CL005';
      }
    }
    
    if (fieldName_lower.includes('archivo')) {
      // Ensure no spaces and proper format
      return fieldValue.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    }
    
    // Process filters from text description
    if (fieldType === 'filtersFromText') {
      // Extract filter names from natural language description
      const text = fieldValue.toLowerCase();
      let filters: string[] = [];
      
      // Look for "filtrar por" pattern
      if (text.includes('filtrar por')) {
        const afterFiltrar = text.split('filtrar por')[1];
        if (afterFiltrar) {
          // Extract the filter list part and split by common separators
          filters = afterFiltrar
            .split(/[,y]/)
            .map(f => f.trim())
            .filter(f => f.length > 0)
            .map(f => {
              // Remove common words and capitalize
              return f.replace(/^(el|la|los|las|de|del|para|con)\s+/gi, '')
                .trim()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            });
        }
      }
      
      // If no filters extracted or empty, provide fallback
      if (filters.length === 0) {
        return 'Nombre\nFecha de registro\nEstado\nTipo';
      }
      
      return filters.join('\n');
    }

    // Process columns from text description  
    if (fieldType === 'columnsFromText') {
      // Extract column names from natural language description
      const text = fieldValue.toLowerCase();
      let columns: string[] = [];
      
      // Look for various column patterns
      const patterns = [
        'mostrar',
        'columnas de',
        'tener columnas de',
        'incluir',
        'campos de'
      ];
      
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          const afterPattern = text.split(pattern)[1];
          if (afterPattern) {
            // Split by common separators and clean
            columns = afterPattern
              .split(/[,y]/)
              .map(c => c.trim())
              .filter(c => c.length > 0)
              .map(c => {
                // Remove common words and capitalize
                return c.replace(/^(el|la|los|las|de|del|para|con)\s+/gi, '')
                  .trim()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
              });
            break;
          }
        }
      }
      
      // If no columns extracted, provide fallback
      if (columns.length === 0) {
        return 'ID\nNombre\nEmail\nEstado\nFecha Registro';
      }
      
      return columns.join('\n');
    }

    // Process fields from text description for entity fields  
    if (fieldType === 'fieldsFromText') {
      return this.generateEnhancedEntityFields(fieldValue);
    }

    // Improve description fields with meaningful content
    if (fieldName_lower.includes('descripcion') || fieldName_lower === 'description') {
      // Check if it's placeholder text that needs replacement
      const placeholderText = ['completar', 'algo relevante', 'rellenar', 'escribir aqui', 'ejemplo'];
      const hasPlaceholder = placeholderText.some(placeholder => 
        fieldValue.toLowerCase().includes(placeholder)
      );
      
      if (hasPlaceholder || fieldValue.length < 20) {
        return 'Este caso de uso permite al operador del área de atención gestionar los datos de clientes del segmento Premium. Incluye funcionalidades de búsqueda, alta, modificación y eliminación de clientes, validando condiciones específicas según políticas del banco.';
      }
      
      // If it's already a good description, just improve formatting
      const improved = fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
      if (!improved.endsWith('.')) {
        return improved + '.';
      }
      return improved;
    }
    
    // Improve client name field
    if (fieldName_lower.includes('cliente') || fieldName_lower === 'clientname') {
      if (fieldValue.toLowerCase().includes('ejemplo') || fieldValue.toLowerCase().includes('test')) {
        return 'Banco Provincia';
      }
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    
    // Improve project name field
    if (fieldName_lower.includes('proyecto') || fieldName_lower === 'projectname') {
      if (fieldValue.toLowerCase().includes('ejemplo') || fieldValue.toLowerCase().includes('test')) {
        return 'Gestión Integral de Clientes';
      }
      return fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
    }
    
    // Default improvement: capitalize first letter for text fields
    if (fieldType === 'text' || fieldType === 'textarea') {
      const improved = fieldValue.charAt(0).toUpperCase() + fieldValue.slice(1);
      return improved;
    }
    
    return fieldValue;
  }
}
