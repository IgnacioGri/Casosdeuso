import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

// Initialize clients lazily to avoid startup errors when API keys are missing
let openai: OpenAI | null = null;
let anthropic: any | null = null;
let grokClient: OpenAI | null = null;
let gemini: GoogleGenAI | null = null;
let copilotClient: OpenAI | null = null;

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

function getCopilotClient(): OpenAI {
  if (!copilotClient && process.env.COPILOT_API_KEY) {
    copilotClient = new OpenAI({ 
      baseURL: "https://api.copilot.microsoft.com/v1", // URL hipotética para Microsoft Copilot
      apiKey: process.env.COPILOT_API_KEY 
    });
  }
  return copilotClient!;
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

    // If demo mode is selected, return pre-loaded demo content
    if (aiModel === 'demo') {
      console.log('Generating demo content with pre-loaded data');
      return this.generateDemoContent(formData);
    }

    try {
      const prompt = this.buildPrompt(formData, rules);
      
      // Try to generate with selected model first, then fallback to others if it fails
      const aiModels = ['copilot', 'gemini', 'openai', 'claude', 'grok'];
      const modelOrder = [aiModel, ...aiModels.filter(m => m !== aiModel)];
      
      const errors: Array<{model: string, error: string}> = [];
      let content: string | null = null;
      
      for (const model of modelOrder) {
        try {
          console.log(`Attempting to generate use case with AI model: ${model}`);
          
          switch (model) {
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
            case 'copilot':
              content = await this.generateWithCopilot(prompt);
              break;
            default:
              continue;
          }
          
          if (content) {
            console.log(`Successfully generated use case with ${model}`);
            break;
          }
        } catch (error: any) {
          console.error(`Failed to generate with ${model}:`, error.message || error);
          errors.push({
            model,
            error: error.message || 'Unknown error'
          });
          // Continue to next model
        }
      }
      
      if (!content) {
        const errorDetails = errors.map(e => `${e.model}: ${e.error}`).join('\n');
        throw new Error(`No se pudo generar el caso de uso con ningún modelo de IA disponible. Por favor, configure al menos una clave API válida.\n\nErrores:\n${errorDetails}`);
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
    return `Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

INSTRUCCIÓN CRÍTICA PARA DESCRIPCIÓN: La sección de DESCRIPCIÓN debe contener OBLIGATORIAMENTE 1-2 párrafos completos y detallados (mínimo 150 palabras). Debe explicar:
- Primer párrafo: Qué hace el caso de uso, su propósito principal, qué procesos abarca, qué área de negocio atiende.
- Segundo párrafo: Beneficios clave, valor para el negocio, mejoras que aporta, problemas que resuelve.
NO generar descripciones de una sola línea. Expandir SIEMPRE la descripción proporcionada con contexto relevante del negocio bancario/empresarial.

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional con indentación:
   1. Flujo Básico
     a. Menú principal
       i. Ingreso de filtros
       ii. Ejecución de búsqueda
     b. Subflujo: Alta
       i. Validación de datos
       ii. Confirmación
   Indenta 0.2 pulgadas por nivel a la derecha.

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

${rules}

DATOS DEL FORMULARIO COMPLETOS:
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'Ninguno'}
- Columnas de resultado: ${formData.resultColumns?.join(', ') || 'Ninguna'}
- Campos de entidad: ${formData.entityFields?.map((f: any) => `${f.name} (${f.type}${f.mandatory ? ', obligatorio' : ''}, largo: ${f.length || 'N/A'}, ${f.description || 'sin descripción'}, validaciones: ${f.validationRules || 'ninguna'})`).join('; ') || 'Ninguno'}
- Reglas de negocio: ${formData.businessRules || 'Ninguna específica'}
- Requerimientos especiales: ${formData.specialRequirements || 'Ninguno'}
- Generar wireframes: ${formData.generateWireframes ? 'Sí' : 'No'}
${formData.wireframeDescriptions?.length ? `- Descripciones de wireframes: ${formData.wireframeDescriptions.filter((w: string) => w.trim()).join('; ')}` : ''}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- Incluye título en MAYÚSCULAS con color azul RGB(0,112,192) en la sección inicial
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING`;
  }

  static cleanAIResponse(content: string): string {
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
      model: "gemini-2.5-flash", // Modelo más rápido
      config: {
        systemInstruction: "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.",
        maxOutputTokens: 16000, // Aumentado para contenido completo
        temperature: 0.3
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
        ${formData.businessRules ? `<div style="margin-left: 20px; margin-bottom: 20px;">${formData.businessRules}</div>` : `
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Los datos obligatorios deben ser validados antes de guardar</li>
          <li style="margin-bottom: 4px;">Se debe mantener un log de auditoría de todas las operaciones</li>
        </ul>`}
        
        <h2 style="color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;">Requerimientos Especiales</h2>
        ${formData.specialRequirements ? `<div style="margin-left: 20px; margin-bottom: 20px;">${formData.specialRequirements}</div>` : `
        <ul style="margin-left: 20px; margin-bottom: 20px; padding-left: 0;">
          <li style="margin-bottom: 4px;">El sistema debe responder en menos de 3 segundos</li>
          <li style="margin-bottom: 4px;">Se debe implementar paginación para resultados mayores a 50 registros</li>
        </ul>`}
        
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
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
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

    // Include demo wireframe paths if wireframes are enabled
    const generatedWireframes = formData.generateWireframes ? {
      searchWireframe: '/attached_assets/generated_images/Search_interface_wireframe_59d3b735.png',
      formWireframe: '/attached_assets/generated_images/Form_interface_wireframe_bf6aaf30.png'
    } : undefined;

    return {
      content,
      success: true,
      ...(generatedWireframes && { generatedWireframes })
    };
  }

  static async editUseCase(content: string, instructions: string, aiModel: string): Promise<GenerateUseCaseResponse> {
    // If demo mode is selected, return content with demo indication
    if (aiModel === 'demo') {
      return {
        content: content + `\n\n<div style="background-color: #e6ffe6; padding: 10px; margin-top: 20px; border-left: 4px solid #28a745;"><strong>Modo Demo:</strong> Se aplicarían los cambios: "${instructions}"</div>`,
        success: true
      };
    }

    try {
      const prompt = `Eres un experto en documentación de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: "${instructions}"

Documento actual:
${content}

INSTRUCCIONES:
- Mantén la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la información no afectada por los cambios
- Asegúrate de que el documento siga siendo coherente y profesional
- Asegura indentación 0.2 en listas editadas si se modifican flujos
- Mantén el estilo y formato corporativo ING`;

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
        case 'copilot':
          modifiedContent = await this.generateWithCopilot(prompt);
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

  // Test case generation method  
  async generateTestCases(prompt: string, context: any, aiModel: string): Promise<string> {
    if (aiModel === 'demo') {
      return JSON.stringify({
        objective: `Verificar el funcionamiento completo del caso de uso: ${context.basicInfo?.useCaseName || 'Gestión de entidades'}`,
        preconditions: `• Usuarios de prueba:
  - Usuario QA_OPERADOR con perfil autorizado para realizar operaciones
  - Usuario QA_SUPERVISOR para validar auditoría

• Datos de prueba:
  - Cliente con DNI 25123456, CUIT 20251234561 en estado activo
  - Datos de prueba válidos según reglas de negocio del caso de uso

• Infraestructura:
  - Sistema de ${context.basicInfo?.projectName || 'Gestión'} desplegado y accesible
  - Base de datos con datos de prueba disponible
  - Servicios externos simulados o disponibles`,
        testSteps: [
          {
            number: 1,
            action: "Acceder al módulo del caso de uso",
            inputData: "Credenciales válidas de usuario",
            expectedResult: "Sistema muestra la interfaz principal",
            observations: "Verificar carga correcta de la interfaz"
          },
          {
            number: 2,
            action: "Ejecutar función principal",
            inputData: "Datos de prueba válidos", 
            expectedResult: "Operación completada exitosamente",
            observations: "Validar procesamiento correcto"
          }
        ],
        analysisNotes: "Casos de prueba generados automáticamente basados en el análisis completo del caso de uso"
      });
    }

    // Use cascading fallback mechanism: try selected model first, then all others
    const aiModels = ['copilot', 'gemini', 'openai', 'claude', 'grok'];
    const modelOrder = [aiModel, ...aiModels.filter(m => m !== aiModel)];
    const errors: Array<{model: string, error: string}> = [];
    
    for (const model of modelOrder) {
      try {
        console.log(`Attempting to generate test cases with AI model: ${model}`);
        let result: string;
        
        switch (model) {
          case 'openai':
            result = await AIService.processWithOpenAI(prompt, JSON.stringify(context));
            break;
          case 'claude':
            result = await AIService.processWithClaude(prompt, JSON.stringify(context));
            break;
          case 'grok':
            result = await AIService.processWithGrok(prompt, JSON.stringify(context));
            break;
          case 'gemini':
            result = await AIService.processWithGemini(prompt, JSON.stringify(context));
            break;
          case 'copilot':
            result = await AIService.processWithCopilot(prompt, JSON.stringify(context));
            break;
          default:
            continue; // Skip unsupported models
        }
        
        console.log(`Successfully generated test cases with ${model}`);
        return result;
      } catch (error: any) {
        console.error(`Failed to generate test cases with ${model}:`, error.message || error);
        errors.push({
          model,
          error: error.message || 'Unknown error'
        });
        // Continue to next model
      }
    }
    
    // All models failed
    const errorDetails = errors.map(e => `${e.model}: ${e.error}`).join('\n');
    throw new Error(`No se pudo generar casos de prueba con ningún modelo de IA disponible. Errores:\n${errorDetails}`);
  }

  static async processFieldWithAI(systemPrompt: string, fieldValue: string, aiModel: string): Promise<string> {
    // Use cascading fallback: try requested model first, then all others
    const aiModels = ['copilot', 'gemini', 'openai', 'claude', 'grok'];
    const modelOrder = [aiModel, ...aiModels.filter(m => m !== aiModel)];
    
    const errors: Array<{model: string, error: string}> = [];
    
    for (const model of modelOrder) {
      try {
        console.log(`Attempting to process with AI model: ${model}`);
        let result: string;
        
        switch (model) {
          case 'openai':
            result = await this.processWithOpenAI(systemPrompt, fieldValue);
            break;
          case 'claude':
            result = await this.processWithClaude(systemPrompt, fieldValue);
            break;
          case 'grok':
            result = await this.processWithGrok(systemPrompt, fieldValue);
            break;
          case 'gemini':
            result = await this.processWithGemini(systemPrompt, fieldValue);
            break;
          case 'copilot':
            result = await this.processWithCopilot(systemPrompt, fieldValue);
            break;

          default:
            continue; // Skip unsupported models
        }
        
        console.log(`Successfully processed with ${model}`);
        return result;
      } catch (error: any) {
        console.error(`Failed to process with ${model}:`, error.message || error);
        errors.push({
          model,
          error: error.message || 'Unknown error'
        });
        // Continue to next model
      }
    }
    
    // All models failed
    const errorDetails = errors.map(e => `${e.model}: ${e.error}`).join('\n');
    throw new Error(`No se pudo procesar con ningún modelo de IA disponible. Errores:\n${errorDetails}`);
  }

  private static async processWithOpenAI(systemPrompt: string, fieldValue: string): Promise<string> {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content || '';
  }

  private static async processWithClaude(systemPrompt: string, fieldValue: string): Promise<string> {
    const client = await getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: "user", content: fieldValue }
      ]
    });
    return response.content[0].text || '';
  }

  private static async processWithGrok(systemPrompt: string, fieldValue: string): Promise<string> {
    const client = getGrokClient();
    const response = await client.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3
    });
    return response.choices[0].message.content || '';
  }

  private static async processWithGemini(systemPrompt: string, fieldValue: string): Promise<string> {
    const client = getGeminiClient();
    
    // Use higher token limit for test case generation and minute analysis
    const isTestCaseGeneration = systemPrompt.includes('casos de prueba') || systemPrompt.includes('test cases');
    const isMinuteAnalysis = systemPrompt.includes('minuta') || systemPrompt.includes('análisis de documento');
    const maxTokens = isTestCaseGeneration ? 12000 : (isMinuteAnalysis ? 10000 : 4000);
    
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash", // Modelo más rápido
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "text/plain",
        maxOutputTokens: maxTokens,
        temperature: 0.3
      },
      contents: fieldValue
    });
    return response.text || '';
  }

  private async improveFieldInstance(fieldName: string, fieldValue: string, fieldType: string, context?: any, aiModel?: string): Promise<string> {
    try {
      // Handle specialized field types FIRST (works for both AI and demo modes)
      if (fieldType === 'wireframeDescription') {
        return this.generateIntelligentWireframeDescription(fieldValue, context);
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
      if (fieldType === 'wireframesDescription') {
        return this.generateIntelligentWireframesDescription(fieldValue, context);
      }
      if (fieldType === 'alternativeFlowsDescription') {
        return this.generateIntelligentAlternativeFlowsDescription(fieldValue);
      }
      
      // If no AI model specified or it's demo, use demo mode for other fields
      if (!aiModel || aiModel === 'demo') {
        return this.getDemoFieldImprovement(fieldName, fieldValue, fieldType);
      }
      
      // For special field types, use AI with specialized processing
      if (fieldType === 'filtersFromText') {
        return await this.processFiltersWithAI(fieldValue, aiModel);
      }
      
      if (fieldType === 'columnsFromText') {
        return await this.processColumnsWithAI(fieldValue, aiModel);
      }
      
      // For fieldsFromText, try AI first but fallback to enhanced demo if it fails
      if (fieldType === 'fieldsFromText') {
        try {
          return await this.processEntityFieldsWithAI(fieldValue, aiModel);
        } catch (error) {
          return this.generateEnhancedEntityFields(fieldValue);
        }
      }
      
      // Use real AI for regular field improvements with provider-specific optimization
      const rules = this.getFieldRules(fieldName, fieldType, context);
      const contextPrompt = this.buildContextualPrompt(context);
      
      // Get optimized prompt for the specific AI provider
      const prompt = this.buildProviderSpecificPrompt(aiModel, contextPrompt, fieldName, fieldValue, rules);

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
      return `${ingCompliance}\n- Expandir a 1-2 párrafos completos (mínimo 150 palabras)\n- Primer párrafo: explica QUÉ hace el caso de uso y su propósito\n- Segundo párrafo: describe los BENEFICIOS y valor de negocio\n- Incluye explicación de alcance/objetivo como en minuta ING\n- Si aplica, menciona flujos principales con lista indentada (1-a-i):\n  1. Flujo principal (ej. Buscar [entidad])\n    a. Detallar filtros y columnas\n    i. Criterios de búsqueda\n- Usa un tono profesional pero claro\n- Incluye contexto relevante del negocio\n${this.getUseCaseTypeSpecificRules(useCaseType)}`;
    }
    
    if (fieldName_lower.includes('reglas') && fieldName_lower.includes('negocio')) {
      return `${ingCompliance}\n- Cada regla debe ser clara, específica y verificable\n- Usa formato de lista numerada multi-nivel (1-a-i) si hay sub-reglas:\n  1. Regla principal\n    a. Sub-regla o detalle\n    i. Especificación adicional\n- Incluye validaciones, restricciones y políticas\n- Considera aspectos regulatorios si aplica\n- Para modificar/eliminar: incluir verificaciones\n- Ejemplo: "1. El monto máximo por transferencia es de $50,000"`;
    }
    
    if (fieldName_lower.includes('requerimientos')) {
      return `${ingCompliance}\n- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)\n- Especifica métricas cuando sea posible\n- Formatea como lista multi-nivel (1-a-i) si hay sub-requerimientos\n- Considera integraciones con otros sistemas\n- Ejemplo: "El sistema debe procesar 1000 transacciones por minuto"`;
    }
    
    if (fieldType === 'searchFilter') {
      return `${ingCompliance}\n- Nombre del campo de búsqueda\n- Debe ser un campo lógico de la entidad\n- Formato lista multi-nivel: 1. Filtro por [campo], a. Lógica [igual/mayor]`;
    }
    
    if (fieldType === 'resultColumn') {
      return `${ingCompliance}\n- Columnas para tabla de resultados\n- Información relevante para identificar registros\n- Formato multi-nivel con indent 0.2`;
    }
    
    if (fieldType === 'entityField') {
      return `${ingCompliance}\n- Campo de entidad con tipo/longitud/obligatorio\n- Auto-incluir campos de auditoría:\n  • fechaAlta (date, mandatory)\n  • usuarioAlta (text, mandatory)\n  • fechaModificacion (date, optional)\n  • usuarioModificacion (text, optional)\n- Tipos válidos: text/email/number/date/boolean/decimal\n- Para montos usar tipo "decimal"\n- Para IDs usar tipo "number"\n- Incluir SIEMPRE description y validationRules`;
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

  private async processFiltersWithAI(fieldValue: string, aiModel: string): Promise<string> {
    if (!fieldValue || fieldValue.trim() === '') {
      return this.getDemoFieldImprovement('', fieldValue, 'filtersFromText');
    }

    const prompt = `CUMPLE MINUTA ING vr19: Convierte esta descripción en filtros de búsqueda profesionales para un sistema bancario.

Descripción: "${fieldValue}"

Reglas:
- Responde SOLO con los nombres de filtros, uno por línea
- Usa nombres descriptivos en español para sistemas bancarios
- NO agregues explicaciones ni comentarios
- Formato: un filtro por línea
- Incluye filtros estándar ING: fechas, usuarios, estados

Ejemplo de respuesta:
Número de cliente
Nombre completo
Estado del cliente
Fecha de registro desde
Fecha de registro hasta`;

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
          return this.getDemoFieldImprovement('', fieldValue, 'filtersFromText');
      }
      
      // Clean and format the response
      const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.toLowerCase().includes('filtros') && !line.includes(':'))
        .slice(0, 8); // Limit to 8 filters max
      
      return lines.join('\n');
      
    } catch (error) {
      console.error('Error processing filters with AI:', error);
      return this.getDemoFieldImprovement('', fieldValue, 'filtersFromText');
    }
  }

  private async processColumnsWithAI(fieldValue: string, aiModel: string): Promise<string> {
    if (!fieldValue || fieldValue.trim() === '') {
      return this.getDemoFieldImprovement('', fieldValue, 'columnsFromText');
    }

    const prompt = `CUMPLE MINUTA ING vr19: Convierte esta descripción en columnas de resultado para una grilla de sistema bancario.

Descripción: "${fieldValue}"

Reglas:
- Responde SOLO con los nombres de columnas, uno por línea
- Usa nombres descriptivos en español para sistemas bancarios
- NO agregues explicaciones ni comentarios
- Formato: una columna por línea
- Incluye columnas estándar ING: ID, fechas, usuarios, estados

Ejemplo de respuesta:
ID Cliente
Nombre Completo
Email
Teléfono
Estado
Fecha Registro`;

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
          return this.getDemoFieldImprovement('', fieldValue, 'columnsFromText');
      }
      
      // Clean and format the response
      const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.toLowerCase().includes('columnas') && !line.includes(':'))
        .slice(0, 10); // Limit to 10 columns max
      
      return lines.join('\n');
      
    } catch (error) {
      console.error('Error processing columns with AI:', error);
      return this.getDemoFieldImprovement('', fieldValue, 'columnsFromText');
    }
  }

  private async processEntityFieldsWithAI(fieldValue: string, aiModel: string): Promise<string> {
    if (!fieldValue || fieldValue.trim() === '') {
      // Return demo content for empty fields with ING compliance
      return this.generateDefaultEntityFieldsWithINGCompliance();
    }

    const prompt = `CUMPLE MINUTA ING vr19: Auto-incluir campos obligatorios para entidades, tipos estándar ING.

Convierte esta descripción de campos en JSON:

"${fieldValue}"

Formato requerido COMPLETO (TODOS los campos son obligatorios):
[
  {
    "name": "nombreCampo",
    "type": "text",
    "mandatory": true,
    "length": 100,
    "description": "Descripción clara del propósito del campo",
    "validationRules": "Reglas de validación específicas (ej: solo letras, formato específico, etc.)"
  }
]

Reglas ING:
- Auto-incluir SIEMPRE estos campos de auditoría: 
  * {"name": "fechaAlta", "type": "date", "mandatory": true, "description": "Fecha de creación del registro", "validationRules": "Fecha válida, no futura"}
  * {"name": "usuarioAlta", "type": "text", "mandatory": true, "length": 50, "description": "Usuario que creó el registro", "validationRules": "Usuario válido del sistema"}
  * {"name": "fechaModificacion", "type": "date", "mandatory": false, "description": "Fecha de última modificación", "validationRules": "Fecha válida, no futura"}  
  * {"name": "usuarioModificacion", "type": "text", "mandatory": false, "length": 50, "description": "Usuario que modificó el registro", "validationRules": "Usuario válido del sistema"}
- Nombres en camelCase español
- Tipos válidos: "text", "email", "number", "decimal", "date", "datetime", "boolean"
- mandatory: true si es obligatorio/requerido, false si es opcional
- length: especificar para campos text (max caracteres) o number/decimal (dígitos totales)
- description: SIEMPRE incluir una descripción clara del propósito del campo
- validationRules: SIEMPRE incluir reglas de validación específicas (ej: "Solo números", "Formato CBU: 22 dígitos", "Monto mayor a 0", etc.)
- Para montos usar tipo "decimal"
- Para IDs usar tipo "number" con mandatory: true
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
      { name: 'fechaAlta', type: 'date', mandatory: true, description: 'Fecha de creación del registro', validationRules: 'Formato ISO 8601' },
      { name: 'usuarioAlta', type: 'text', mandatory: true, length: 50, description: 'Usuario que creó el registro', validationRules: 'Debe existir en el sistema de usuarios' },
      { name: 'fechaModificacion', type: 'date', mandatory: false, description: 'Fecha de última modificación', validationRules: 'Fecha posterior a fechaAlta' },
      { name: 'usuarioModificacion', type: 'text', mandatory: false, length: 50, description: 'Usuario que modificó el registro', validationRules: 'Debe existir en el sistema de usuarios' }
    ];

    fields.push(...ingFields);

    return JSON.stringify(fields, null, 2);
  }

  private generateDefaultEntityFieldsWithINGCompliance(): string {
    const defaultFields = [
      { name: 'numeroCliente', type: 'text', mandatory: true, length: 20, description: 'Número único del cliente', validationRules: 'Formato alfanumérico' },
      { name: 'nombreCompleto', type: 'text', mandatory: true, length: 100, description: 'Nombre completo del cliente', validationRules: 'Solo letras y espacios' },
      { name: 'email', type: 'email', mandatory: true, description: 'Correo electrónico', validationRules: 'Formato email válido' },
      { name: 'telefono', type: 'text', mandatory: false, length: 15, description: 'Número de teléfono', validationRules: 'Solo números y símbolos telefónicos' },
      { name: 'fechaAlta', type: 'date', mandatory: true, description: 'Fecha de creación', validationRules: 'Formato ISO 8601' },
      { name: 'usuarioAlta', type: 'text', mandatory: true, length: 50, description: 'Usuario creador', validationRules: 'Debe existir en el sistema' },
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

  private generateIntelligentWireframeDescription(fieldValue: string, context?: any): string {
    const formData = context?.fullFormData;
    
    // Generate dynamic wireframe based on actual form data
    if (formData && formData.useCaseType === 'entidad') {
      return this.generateEntitySearchWireframe(fieldValue, formData);
    } else if (formData && (formData.useCaseType === 'api' || formData.useCaseType === 'proceso')) {
      return this.generateServiceWireframe(fieldValue, formData);
    }
    
    // Fallback for missing context or basic description enhancement
    if (!fieldValue || fieldValue.trim() === '') {
      return 'Wireframe ING con panel de búsqueda (filtros: Número de cliente, Apellido, DNI), botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING mostrando columnas relevantes y botones Editar/Eliminar por fila. UI textual según minuta ING.';
    }

    let description = this.cleanInputText(fieldValue);
    const text = description.toLowerCase();

    // Enhance basic descriptions with ING-specific details
    if (text.length < 50) {
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
      if (!text.includes('ing') && !text.includes('boton') && !text.includes('paginado')) {
        description += '. Incluye botones estándar ING (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado según minuta ING';
      }
    }

    return this.formatProfessionalText(description);
  }

  private generateEntitySearchWireframe(userDescription: string, formData: any): string {
    const filters = formData.searchFilters || [];
    const columns = formData.resultColumns || [];
    
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : '';
    
    const wireframe = `Wireframe textual ING para buscador de entidades ${formData.useCaseName || 'entidad'}.

Panel de búsqueda superior con los siguientes filtros${filters.length > 0 ? ':' : ' (a definir por el usuario):'}
${filters.length > 0 ? filters.map((filter: string) => `- ${filter}`).join('\n') : '- (Filtros especificados en el formulario)'}

Botones: Buscar, Limpiar y Agregar (estilo ING estándar).

Tabla de resultados con paginado ING activado, mostrando las siguientes columnas${columns.length > 0 ? ':' : ' (a definir por el usuario):'}
${columns.length > 0 ? columns.map((column: string) => `- ${column}`).join('\n') : '- (Columnas especificadas en el formulario)'}

Cada fila incluye botones Editar y Eliminar al final.

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ''}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).`;

    return this.formatProfessionalText(wireframe);
  }

  private generateServiceWireframe(userDescription: string, formData: any): string {
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : '';
    
    const wireframe = `Wireframe textual ING para ${formData.useCaseType === 'api' ? 'interfaz de API' : 'proceso automático'} ${formData.useCaseName || 'servicio'}.

Panel de configuración con:
- Parámetros de ejecución ${formData.apiEndpoint ? `(Endpoint: ${formData.apiEndpoint})` : ''}
- Configuración de frecuencia ${formData.serviceFrequency ? `(${formData.serviceFrequency})` : ''}
- Botones: Ejecutar, Configurar, Ver Logs

Panel de monitoreo con:
- Estado de ejecución en tiempo real
- Log de actividades
- Métricas de rendimiento

Panel de resultados con:
- Datos de salida formateados
- Códigos de respuesta
- Mensajes de error/éxito

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ''}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).`;

    return this.formatProfessionalText(wireframe);
  }

  private generateCompleteEntityWireframes(userDescription: string, formData: any): string {
    const filters = formData.searchFilters || [];
    const columns = formData.resultColumns || [];
    const fields = formData.entityFields || [];
    
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : '';
    
    const wireframes = `Sistema completo de wireframes ING para gestión de ${formData.useCaseName || 'entidad'}.

PANTALLA PRINCIPAL - BÚSQUEDA:
Panel superior con filtros${filters.length > 0 ? ':' : ' (definidos por el usuario):'}
${filters.length > 0 ? filters.map((filter: string) => `- ${filter}`).join('\n') : '- (Filtros especificados en el caso de uso)'}
Botones: Buscar, Limpiar, Agregar.

Tabla de resultados con paginado ING, columnas${columns.length > 0 ? ':' : ' (definidas por el usuario):'}
${columns.length > 0 ? columns.map((column: string) => `- ${column}`).join('\n') : '- (Columnas especificadas en el caso de uso)'}
Botones Editar/Eliminar por fila.

FORMULARIO MODAL - ALTA/MODIFICACIÓN:
Campos organizados según estándares ING${fields.length > 0 ? ':' : ' (definidos por el usuario):'}
${fields.length > 0 ? fields.map((field: any) => `- ${field.name || field} (${field.type || 'text'})${field.mandatory ? ' - Obligatorio' : ''}`).join('\n') : '- (Campos especificados en la entidad)'}

Campos de auditoría obligatorios:
- Fecha de alta (automático)
- Usuario de alta (automático) 
- Fecha de modificación (automático)
- Usuario de modificación (automático)

Botones: Aceptar, Cancelar.

MENSAJES DE CONFIRMACIÓN:
- Operaciones exitosas
- Errores de validación
- Confirmaciones de eliminación

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ''}

Formato estilo Microsoft (fuente Segoe UI, layout según minuta ING vr19).`;

    return this.formatProfessionalText(wireframes);
  }

  private generateCompleteServiceWireframes(userDescription: string, formData: any): string {
    const baseDescription = userDescription && userDescription.trim() ? this.cleanInputText(userDescription) : '';
    
    const wireframes = `Sistema completo de wireframes ING para ${formData.useCaseType === 'api' ? 'API/Web Service' : 'Proceso Automático'} ${formData.useCaseName || 'servicio'}.

PANTALLA DE CONFIGURACIÓN:
Panel de parámetros${formData.apiEndpoint ? ` (Endpoint: ${formData.apiEndpoint})` : ''}:
- URL/Endpoint de destino
- Credenciales de autenticación
- Headers requeridos
- Timeout y reintentos

Configuración de ejecución${formData.serviceFrequency ? ` (${formData.serviceFrequency})` : ''}:
- Frecuencia programada
- Condiciones de activación
- Parámetros variables

Botones: Guardar Configuración, Probar Conexión, Ejecutar Ahora.

PANTALLA DE MONITOREO:
Dashboard en tiempo real con:
- Estado actual del servicio
- Última ejecución exitosa
- Próxima ejecución programada
- Métricas de rendimiento

Log de actividades:
- Historial de ejecuciones
- Mensajes de error/éxito
- Tiempos de respuesta

PANTALLA DE RESULTADOS:
${formData.useCaseType === 'api' ? 'Request/Response detallado:' : 'Salida del proceso:'}
- Datos de entrada formateados
- Respuesta/resultado obtenido  
- Códigos de estado
- Datos procesados

Botones: Exportar Resultados, Ver Detalles, Reejecutar.

${baseDescription ? `Consideraciones adicionales: ${baseDescription}` : ''}

Formato estilo Microsoft (fuente Segoe UI, layout según minuta ING vr19).`;

    return this.formatProfessionalText(wireframes);
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

  private generateIntelligentWireframesDescription(fieldValue: string, context?: any): string {
    const formData = context?.fullFormData;
    
    // Generate complete wireframe system based on actual form data
    if (formData && formData.useCaseType === 'entidad') {
      return this.generateCompleteEntityWireframes(fieldValue, formData);
    } else if (formData && (formData.useCaseType === 'api' || formData.useCaseType === 'proceso')) {
      return this.generateCompleteServiceWireframes(fieldValue, formData);
    }
    
    // Fallback for missing context
    if (!fieldValue || fieldValue.trim() === '') {
      return `Pantalla principal con panel de búsqueda (filtros definidos por el usuario), botones Buscar/Limpiar/Agregar.
Tabla de resultados con paginado ING mostrando columnas especificadas en el caso de uso y botones Editar/Eliminar.
Formulario modal para alta/modificación con campos definidos en la entidad y validaciones ING.
Mensaje de confirmación para operaciones exitosas o de error según corresponda.`;
    }

    let description = this.cleanInputText(fieldValue);
    const text = description.toLowerCase();

    if (text.length < 100) {
      if (text.includes('buscar') || text.includes('filtro')) {
        description = `${description}. Incluye panel superior con filtros ING estándar, botones Buscar/Limpiar/Agregar, tabla de resultados con paginado ING y botones de acción por fila.`;
      } else if (text.includes('formulario') || text.includes('form')) {
        description = `${description}. Modal o página con campos organizados según estándares ING, validaciones en tiempo real, botones Guardar/Cancelar y mensajes de confirmación.`;
      } else if (text.includes('tabla') || text.includes('list')) {
        description = `${description}. Con paginado ING, ordenamiento por columnas, filtros superiores y botones de acción (Editar/Eliminar/Ver) por cada fila.`;
      } else {
        description = `${description}. Sistema completo con wireframes ING: pantalla de búsqueda con filtros, tabla de resultados paginada, formularios modales para CRUD y mensajes de confirmación/error.`;
      }
    }

    return this.formatProfessionalText(description);
  }

  private generateIntelligentAlternativeFlowsDescription(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return `Error de sistema: Cuando ocurre un error técnico, mostrar mensaje "Error temporal del sistema. Intente nuevamente" con opciones Reintentar/Cancelar.
Registro inexistente: Al buscar un elemento que no existe, mostrar "No se encontraron resultados" con opciones para "Crear nuevo" o "Modificar búsqueda".
Sin permisos: Cuando el usuario no tiene permisos, mostrar "No tiene autorización para esta operación" y redirigir a pantalla principal.
Validación fallida: Si fallan las validaciones de negocio, resaltar campos incorrectos con mensajes específicos y mantener datos ingresados.`;
    }

    let description = this.cleanInputText(fieldValue);
    const text = description.toLowerCase();

    // Enhance basic descriptions with comprehensive error scenario context
    if (text.length < 100) {
      // Add comprehensive error handling context if description is too short
      if (text.includes('error') || text.includes('falla')) {
        description = `${description}. Incluir manejo de errores técnicos, mensajes claros al usuario, opciones de reintentar/cancelar y log automático del incidente.`;
      } else if (text.includes('no encontr') || text.includes('inexistent')) {
        description = `${description}. Mostrar mensaje informativo, opciones para crear nuevo registro o refinar criterios de búsqueda, mantener contexto de la operación.`;
      } else if (text.includes('permiso') || text.includes('acceso')) {
        description = `${description}. Mensaje de autorización insuficiente, redirección segura a pantalla permitida, log de intento de acceso no autorizado.`;
      } else if (text.includes('validaci') || text.includes('campo')) {
        description = `${description}. Resaltar campos con errores, mensajes específicos por validación, mantener datos válidos ingresados, permitir corrección selectiva.`;
      } else {
        description = `${description}. Conjunto completo de flujos alternativos: errores de sistema, registros inexistentes, permisos insuficientes, validaciones fallidas y timeouts de conexión.`;
      }
    }

    // Ensure proper formatting and professional structure
    return this.formatProfessionalText(description);
  }

  private generateIntelligentBusinessRules(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return '1. El DNI debe ser único en el sistema\n   a. Validar formato correcto\n   b. Verificar no duplicación\n2. No se puede eliminar un cliente con productos activos\n   a. Validar productos asociados\n   b. Mostrar mensaje informativo\n3. El email debe tener formato válido\n4. Solo usuarios con rol "Supervisor" pueden eliminar clientes\n5. Registro automático en bitácora de alta/modificación/eliminación';
    }

    // Clean and split input into meaningful business rules
    let text = this.cleanInputText(fieldValue);
    
    // Split by numbered items with bullet points - this preserves the existing structure
    let lines = text.split(/(?:\n\d+\.\s*•\s*|\n\d+\.\s*)/m).filter(line => line.trim() !== '');
    
    // If no numbered structure is found, try splitting by plain bullet points or line breaks
    if (lines.length <= 1) {
      lines = text.split(/(?:•\s*|^\s*-\s*|\n)/m).filter(line => line.trim() !== '');
    }
    
    if (lines.length === 0) {
      lines = [text]; // Fallback to treat as single rule
    }
    
    let items: string[] = [];

    lines.forEach((line) => {
      let item = line.trim();
      if (item.length === 0) return;
      
      // Remove existing numbering and clean bullet points
      item = item.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '');
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      
      // Clean the rule text
      item = this.cleanInputText(item);
      
      // Format as numbered item
      let mainItem = `${items.length + 1}. ${item}`;
      
      // Add to items list - simplified to avoid complex formatting issues
      items.push(this.formatProfessionalText(mainItem));
    });

    // If no items were processed, return a basic formatted version
    if (items.length === 0) {
      return `1. ${this.formatProfessionalText(text)}`;
    }

    return items.join('\n');
  }

  private generateIntelligentSpecialRequirements(fieldValue: string): string {
    if (!fieldValue || fieldValue.trim() === '') {
      return '1. Integración con servicio externo de scoring crediticio al momento del alta\n   a. Definir formato de intercambio de datos\n   b. Configurar timeout de respuesta\n2. Combo "Segmento" cargado dinámicamente desde tabla paramétrica\n   a. Cache local para mejorar performance\n   b. Actualización automática cada 24 horas\n3. Tiempo de respuesta máximo: 3 segundos para búsquedas\n4. Validación HTTPS obligatoria para todas las transacciones\n5. Auditoria completa de cambios con timestamp y usuario';
    }

    // Clean and split input into meaningful bullet points
    let text = this.cleanInputText(fieldValue);
    
    // Split by bullet points (• or -) or line breaks, preserving existing structure
    let lines = text.split(/(?:•\s*|^\s*-\s*|\n)/m).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      lines = [text]; // Fallback to treat as single requirement
    }
    
    let items: string[] = [];

    lines.forEach((line) => {
      let item = line.trim();
      if (item.length === 0) return;
      
      // Remove existing numbering and clean bullet points
      item = item.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '');
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      
      // Clean the requirement text
      item = this.cleanInputText(item);
      
      // Format as numbered item
      let mainItem = `${items.length + 1}. ${item}`;
      
      // Add to items list - no sub-items to avoid complex nesting issues
      items.push(this.formatProfessionalText(mainItem));
    });

    // If no items were processed, return a basic formatted version
    if (items.length === 0) {
      return `1. ${this.formatProfessionalText(text)}`;
    }

    return items.join('\n');
  }

  // Provider-specific prompt optimization for different AI models
  private buildProviderSpecificPrompt(aiModel: string, contextPrompt: string, fieldName: string, fieldValue: string, rules: string): string {
    const baseTask = `TAREA: Mejora el siguiente campo según las reglas especificadas.

CAMPO: ${fieldName}
VALOR ACTUAL: "${fieldValue}"
REGLAS: ${rules}`;

    switch (aiModel) {
      case 'openai':
        // OpenAI works best with structured, step-by-step instructions
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES PASO A PASO:
1. Analiza el valor actual del campo
2. Aplica las reglas especificadas de ING
3. Mejora el contenido manteniendo el contexto profesional
4. Responde ÚNICAMENTE con el contenido mejorado
5. NO agregues explicaciones ni comentarios adicionales
6. NO uses formato markdown ni bloques de código

RESPUESTA:`;

      case 'claude':
        // Claude excels with clear context and reasoning
        return `${contextPrompt}

${baseTask}

CONTEXTO: Estás mejorando documentación técnica para un sistema bancario siguiendo estándares ING.

OBJETIVO: Transformar el valor actual en una versión profesional que cumpla con las reglas especificadas.

FORMATO DE RESPUESTA: Proporciona únicamente el contenido mejorado, sin explicaciones adicionales.

CONTENIDO MEJORADO:`;

      case 'grok':
        // Grok performs well with direct, no-nonsense instructions
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES DIRECTAS:
- Mejora el contenido siguiendo las reglas ING
- Mantén el estilo profesional bancario
- Responde solo con el contenido mejorado
- Sin explicaciones ni formateo extra

RESULTADO:`;

      case 'gemini':
        // Gemini works well with structured JSON-like instructions
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
        // Fallback generic prompt
        return `${contextPrompt}

${baseTask}

INSTRUCCIONES:
1. Mejora el contenido siguiendo las reglas especificadas
2. Mantén el contexto profesional ING
3. Responde ÚNICAMENTE con el contenido mejorado
4. NO agregues explicaciones ni comentarios adicionales

CONTENIDO MEJORADO:`;
    }
  }

  // Enhanced multi-level list generator for ING compliance
  private generateMultiLevelList(fieldValue: string, listType: 'businessRules' | 'specialRequirements'): string {
    let text = fieldValue.trim();
    
    // Split by sentences, commas, or line breaks
    const parts = text.split(/[.,;\n]/).filter(part => part.trim() !== '');
    let items: string[] = [];

    parts.forEach((part) => {
      let item = part.trim();
      if (item.length === 0) return;
      
      // Remove existing numbering to avoid duplication
      item = item.replace(/^\d+\.\s*/, '');
      
      // Skip if it's just a number or empty after cleaning
      if (item.match(/^\d+\.?\s*$/) || item.length === 0) return;
      
      // Clean the item text
      item = listType === 'businessRules' ? this.formatBusinessRuleText(item) : this.cleanInputText(item);
      
      // Detect if this item needs sub-items based on content analysis
      const lowerItem = item.toLowerCase();
      let mainItem = `${items.length + 1}. ${item}`;
      let subItems: string[] = [];
      
      // Add intelligent sub-items based on content analysis
      if (listType === 'businessRules') {
        if (lowerItem.includes('dni') || lowerItem.includes('unico')) {
          subItems.push('a. Validar formato correcto');
          subItems.push('b. Verificar no duplicación en sistema');
        }
        if (lowerItem.includes('validac') && (lowerItem.includes('format') || lowerItem.includes('email'))) {
          subItems.push('a. Verificar estructura de email');
          subItems.push('b. Confirmar dominio válido');
        }
        if (lowerItem.includes('eliminar') || lowerItem.includes('activ')) {
          subItems.push('a. Validar productos asociados');
          subItems.push('b. Mostrar mensaje informativo');
        }
      }
      
      if (listType === 'specialRequirements') {
        if (lowerItem.includes('integra') || lowerItem.includes('servicio')) {
          subItems.push('a. Definir formato de intercambio de datos');
          subItems.push('b. Configurar timeout de respuesta');
        }
        if (lowerItem.includes('combo') || lowerItem.includes('dinamico')) {
          subItems.push('a. Cache local para mejorar performance');
          subItems.push('b. Actualización automática periódica');
        }
        if (lowerItem.includes('tiempo') && !lowerItem.includes('máximo')) {
          mainItem += ' (especificar límite máximo aceptable)';
        }
        if (lowerItem.includes('validac') && !lowerItem.includes('obligator')) {
          mainItem += ' con validación obligatoria';
        }
      }
      
      // Build the complete item with sub-items
      if (subItems.length > 0) {
        items.push(mainItem + '\n   ' + subItems.join('\n   '));
      } else {
        items.push(mainItem);
      }
    });

    return items.join('\n');
  }

  private getDemoFieldImprovement(fieldName: string, fieldValue: string, fieldType: string): string {
    const fieldName_lower = fieldName.toLowerCase();
    
    // Convert fieldValue to string if it's not already
    const valueStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
    
    if (!valueStr || valueStr.trim() === '') {
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
      if (fieldType === 'testCasePreconditions') {
        return `• Usuarios de prueba:
  - Usuario QA_OPERADOR con perfil de operador autorizado
  - Usuario QA_SUPERVISOR con perfil de supervisor para validaciones
  - Usuario QA_ADMIN con permisos administrativos

• Datos de prueba:
  - Base de datos con datos de prueba precargados
  - Cliente de prueba con DNI 25123456 en estado activo
  - Registros históricos para validar consultas y reportes

• Infraestructura:
  - Sistema desplegado en ambiente de pruebas
  - Servicios externos configurados (validación DNI, servicios bancarios)
  - Conexión estable a base de datos y servicios`;
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

    // Process test case preconditions
    if (fieldType === 'testCasePreconditions' && valueStr.trim()) {
      // Format existing preconditions into structured format
      const lines = valueStr.split('\n').filter(line => line.trim());
      let formatted = '';
      
      // Add structured categories if not present
      const hasUsersSection = lines.some(line => line.toLowerCase().includes('usuario'));
      const hasDataSection = lines.some(line => line.toLowerCase().includes('dato'));
      const hasInfraSection = lines.some(line => line.toLowerCase().includes('infraestructura') || line.toLowerCase().includes('sistema'));
      
      if (!hasUsersSection) {
        formatted += '• Usuarios de prueba:\n';
        formatted += '  - Usuario con permisos necesarios para ejecutar las pruebas\n\n';
      }
      
      if (!hasDataSection) {
        formatted += '• Datos de prueba:\n';
        formatted += '  - Datos necesarios precargados en el sistema\n\n';
      }
      
      if (!hasInfraSection) {
        formatted += '• Infraestructura:\n';
        formatted += '  - Sistema disponible y accesible\n';
      }
      
      // If already has some structure, improve formatting
      if (hasUsersSection || hasDataSection || hasInfraSection) {
        formatted = lines.map(line => {
          const trimmed = line.trim();
          // If it's a category header, ensure it starts with •
          if (trimmed.toLowerCase().includes('usuario') && trimmed.endsWith(':')) {
            return `• ${trimmed}`;
          }
          if (trimmed.toLowerCase().includes('dato') && trimmed.endsWith(':')) {
            return `• ${trimmed}`;
          }
          if ((trimmed.toLowerCase().includes('infraestructura') || trimmed.toLowerCase().includes('sistema')) && trimmed.endsWith(':')) {
            return `• ${trimmed}`;
          }
          // If it's a bullet point, ensure proper formatting
          if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            return `  ${trimmed.replace(/^[-•]\s*/, '- ')}`;
          }
          // Regular line - make it a sub-bullet
          return `  - ${trimmed}`;
        }).join('\n');
      }
      
      return formatted || valueStr;
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

  private static async generateWithCopilot(prompt: string): Promise<string> {
    const copilot = getCopilotClient();
    const response = await copilot.chat.completions.create({
      model: "gpt-4", // Microsoft Copilot usa modelos GPT
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || "No response from Microsoft Copilot";
  }

  private static async processWithCopilot(systemPrompt: string, fieldValue: string): Promise<string> {
    const copilot = getCopilotClient();
    const response = await copilot.chat.completions.create({
      model: "gpt-4", // Microsoft Copilot usa modelos GPT
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fieldValue }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || "No response from Microsoft Copilot";
  }
}
