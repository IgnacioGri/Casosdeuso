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

      return {
        content,
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
    return `Genera un documento de caso de uso siguiendo estrictamente estas reglas:

${rules}

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

Genera el documento completo en formato HTML con el estilo Microsoft especificado en las reglas. Incluye todas las secciones requeridas según el tipo de caso de uso.`;
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
      const prompt = `Modifica el siguiente documento de caso de uso aplicando estos cambios: "${instructions}"

Documento actual:
${content}

Devuelve el documento completo modificado manteniendo el formato HTML y el estilo Microsoft.`;

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

      return {
        content: modifiedContent,
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
}
