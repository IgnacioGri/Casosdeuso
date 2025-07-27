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

  async improveField(fieldName: string, fieldValue: string, fieldType: string, context?: any): Promise<string> {
    try {
      // Define field-specific rules based on ING specifications
      const fieldRules = this.getFieldRules(fieldName, fieldType, context);
      
      const prompt = `
MEJORA ESTE CAMPO SEGÚN LAS REGLAS DE ING:

CAMPO: ${fieldName}
TIPO: ${fieldType}
VALOR ACTUAL: "${fieldValue}"
CONTEXTO: ${JSON.stringify(context || {})}

REGLAS ESPECÍFICAS:
${fieldRules}

INSTRUCCIONES:
- Corrige cualquier error de formato
- Aplica las reglas específicas del campo
- Mantén el significado original si es correcto
- Si está vacío, proporciona un ejemplo apropiado
- Solo devuelve el valor mejorado, sin explicaciones
- No agregues comillas ni formato markdown

VALOR MEJORADO:`;

      if (this.selectedModel === 'demo') {
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }

      const response = await this.callAIProvider(prompt, this.selectedModel);
      
      if (!response.success || !response.content) {
        throw new Error('No se pudo mejorar el campo');
      }

      // Clean the response
      return response.content.trim().replace(/^["']|["']$/g, '');
      
    } catch (error) {
      console.error('Error improving field:', error);
      // Return original value if AI fails
      return fieldValue || '';
    }
  }

  private getFieldRules(fieldName: string, fieldType: string, context?: any): string {
    const fieldName_lower = fieldName.toLowerCase();
    
    if (fieldName_lower.includes('nombre') && fieldName_lower.includes('cliente')) {
      return '- Debe ser un nombre de empresa real o banco\n- Primera letra mayúscula\n- Sin abreviaciones innecesarias';
    }
    
    if (fieldName_lower.includes('proyecto')) {
      return '- Debe describir un sistema o proyecto tecnológico\n- Formato profesional\n- Relacionado con el cliente';
    }
    
    if (fieldName_lower.includes('codigo')) {
      return '- Formato: 2 letras mayúsculas + 3 números (ej: CL005, AB123)\n- Las letras deben relacionarse con el módulo o área';
    }
    
    if (fieldName_lower.includes('nombre') && fieldName_lower.includes('caso')) {
      return '- OBLIGATORIO: Debe comenzar con verbo en infinitivo (Gestionar, Crear, Consultar, etc.)\n- Describe claramente la funcionalidad\n- Sin artículos innecesarios';
    }
    
    if (fieldName_lower.includes('archivo')) {
      return '- Formato: 2 letras + 3 números + nombre descriptivo sin espacios\n- Ejemplo: BP005GestionarClientesPremium\n- Sin caracteres especiales';
    }
    
    if (fieldName_lower.includes('descripcion')) {
      return '- Explicación clara del alcance del caso de uso\n- Menciona las funcionalidades principales\n- Entre 50-200 palabras\n- Lenguaje técnico pero comprensible';
    }
    
    if (fieldName_lower.includes('reglas') && fieldName_lower.includes('negocio')) {
      return '- Lista de reglas numeradas con viñetas\n- Cada regla debe ser específica y verificable\n- Incluir validaciones de datos\n- Mencionar restricciones de seguridad';
    }
    
    if (fieldName_lower.includes('requerimientos')) {
      return '- Requerimientos técnicos específicos\n- Tiempos de respuesta, integraciones\n- Formato de lista con viñetas\n- Mencionar tecnologías si aplica';
    }
    
    if (fieldType === 'searchFilter') {
      return '- Nombre del campo de búsqueda\n- Debe ser un campo lógico de la entidad\n- Formato: "Nombre del campo" sin tipo de dato';
    }
    
    if (fieldType === 'resultColumn') {
      return '- Nombre de columna para mostrar en resultados\n- Debe ser información relevante para identificar registros\n- Formato claro y profesional';
    }
    
    if (fieldType === 'entityField') {
      return '- Nombre del campo de la entidad\n- Debe ser claro y sin abreviaciones\n- Relacionado con el dominio del negocio';
    }
    
    if (fieldType === 'apiEndpoint') {
      return '- URL completa del endpoint\n- Protocolo HTTPS preferido\n- Versionado en la URL (v1, v2)\n- RESTful naming convention\n- Ejemplo: https://api.banco.com/v1/clientes';
    }
    
    if (fieldName_lower.includes('request') || fieldName_lower.includes('response')) {
      return '- Formato JSON estructurado\n- Incluir campos requeridos y opcionales\n- Especificar tipos de datos\n- Códigos de estado para responses\n- Ejemplos concretos';
    }
    
    return '- Seguir convenciones profesionales\n- Lenguaje claro y preciso\n- Sin errores ortográficos';
  }

  private getDemoFieldImprovement(fieldName: string, fieldValue: string, fieldType: string): string {
    const fieldName_lower = fieldName.toLowerCase();
    
    if (!fieldValue || fieldValue.trim() === '') {
      // Provide examples for empty fields
      if (fieldName_lower.includes('nombre') && fieldName_lower.includes('cliente')) {
        return 'Banco Provincia';
      }
      if (fieldName_lower.includes('proyecto')) {
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
      return fieldValue;
    }
    
    // Improve existing values
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
    
    return fieldValue;
  }
}
