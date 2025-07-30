import { AIService } from './ai-service.js';
import { UseCaseFormData } from '../../shared/schema.js';

type UseCaseType = 'entity' | 'api' | 'service';

export class MinuteAnalysisService {
  constructor(private aiService: AIService) {}

  async analyzeMinute(text: string, useCaseType: UseCaseType, aiModel: string): Promise<Partial<UseCaseFormData>> {
    const prompts = this.buildAnalysisPrompts(useCaseType);
    
    try {
      // Use AI to analyze the minute text
      const analysisResult = await AIService.processFieldWithAI(
        prompts.systemPrompt,
        text,
        aiModel
      );

      // Parse the AI response into form data
      return this.parseAnalysisResult(analysisResult, useCaseType);
    } catch (error) {
      console.error('Error analyzing minute:', error);
      
      // Fallback to demo analysis if AI fails
      return this.generateDemoAnalysis(useCaseType);
    }
  }

  private buildAnalysisPrompts(useCaseType: UseCaseType) {
    const baseSystemPrompt = `
Eres un analista de sistemas experto en casos de uso según estándares ING.
Analiza el texto de la minuta proporcionada y extrae la información relevante para completar automáticamente un formulario de caso de uso.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido sin explicaciones adicionales.
`;

    const context = {
      step: 'minute-analysis',
      useCaseType,
      action: 'parse-minute'
    };

    switch (useCaseType) {
      case 'entity':
        return {
          systemPrompt: baseSystemPrompt + this.getEntityAnalysisRules(),
          context
        };
      case 'api':
        return {
          systemPrompt: baseSystemPrompt + this.getApiAnalysisRules(),
          context
        };
      case 'service':
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

  private getEntityAnalysisRules(): string {
    return `
Para casos de uso tipo ENTIDAD, extrae y estructura la siguiente información:

{
  "clientName": "Nombre del cliente/banco (ej: Banco Provincia)",
  "projectName": "Nombre del proyecto (ej: Sistema de Gestión Integral)",
  "useCaseCode": "Código del caso de uso (ej: UC001, BP005, etc.)",
  "useCaseName": "Nombre descriptivo del caso de uso empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción detallada del objetivo del caso de uso",
  "searchFilters": ["filtro1", "filtro2", "filtro3"],
  "filtersDescription": "Descripción de los filtros de búsqueda necesarios",
  "resultColumns": ["columna1", "columna2", "columna3"],
  "columnsDescription": "Descripción de las columnas que se mostrarán en resultados",
  "entityFields": [
    {"name": "campo1", "type": "text", "required": true, "length": 50},
    {"name": "campo2", "type": "number", "required": false, "length": 10}
  ],
  "fieldsDescription": "Descripción de los campos de la entidad",
  "wireframeDescriptions": ["Pantalla de búsqueda", "Grilla de resultados", "Detalle"],
  "wireframesDescription": "Descripción de las pantallas necesarias",
  "alternativeFlows": ["Flujo alternativo 1", "Flujo alternativo 2"],
  "alternativeFlowsDescription": "Descripción de flujos alternativos y errores",
  "businessRules": ["1. Regla de negocio 1", "2. Regla de negocio 2"],
  "specialRequirements": ["1. Requerimiento especial 1", "2. Requerimiento especial 2"],
  "isAIGenerated": true
}

REGLAS ESPECÍFICAS:
- useCaseName debe empezar con verbo infinitivo (Gestionar, Consultar, Procesar, etc.)
- fileName sigue patrón: 2 letras + 3 números + descripción (ej: BP005GestionarClientes)
- entityFields incluir SIEMPRE campos de auditoría: fechaAlta, usuarioAlta, fechaModificacion, usuarioModificacion
- Extraer información específica del texto, no inventar datos genéricos
`;
  }

  private getApiAnalysisRules(): string {
    return `
Para casos de uso tipo API/WEB SERVICE, extrae y estructura la siguiente información:

{
  "clientName": "Nombre del cliente/organización",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código del caso de uso (ej: API001, WS002)",
  "useCaseName": "Nombre del servicio empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción del propósito del API/servicio",
  "apiEndpoint": "URL del endpoint (ej: /api/v1/consulta-saldo)",
  "httpMethod": "Método HTTP (GET, POST, PUT, DELETE)",
  "requestFormat": "Formato de request con ejemplos",
  "responseFormat": "Formato de response con ejemplos",
  "alternativeFlows": ["Error de autenticación", "Timeout", "Datos no encontrados"],
  "businessRules": ["1. Regla de autenticación", "2. Regla de validación"],
  "specialRequirements": ["1. Seguridad SSL", "2. Rate limiting"],
  "isAIGenerated": true
}
`;
  }

  private getServiceAnalysisRules(): string {
    return `
Para casos de uso tipo SERVICIO/PROCESO, extrae y estructura la siguiente información:

{
  "clientName": "Nombre del cliente/organización",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código del caso de uso (ej: SRV001, PROC002)",
  "useCaseName": "Nombre del proceso empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción del proceso automático",
  "serviceConfig": "Configuración del servicio (horarios, frecuencia, etc.)",
  "cronExpression": "Expresión cron si es proceso programado",
  "alternativeFlows": ["Fallo en el proceso", "Reintentos", "Notificaciones"],
  "businessRules": ["1. Regla de ejecución", "2. Regla de monitoreo"],
  "specialRequirements": ["1. Logging", "2. Alertas", "3. Recuperación"],
  "isAIGenerated": true
}
`;
  }

  private parseAnalysisResult(result: string, useCaseType: UseCaseType): Partial<UseCaseFormData> {
    try {
      console.log('Raw AI analysis result:', result.substring(0, 200) + '...');
      
      // Check if the result is demo content
      if (result.includes('Demo Analysis') || result.includes('generateDemoAnalysis')) {
        console.log('Detected demo content in AI response, using fallback');
        return this.generateDemoAnalysis(useCaseType);
      }

      // Clean the result to ensure it's valid JSON
      const cleanedResult = result
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/^\s*\{/, '{')
        .replace(/\}\s*$/, '}')
        .trim();

      console.log('Cleaned result for JSON parsing:', cleanedResult.substring(0, 200) + '...');

      const parsed = JSON.parse(cleanedResult);
      
      // Ensure the result includes the use case type and AI generated flag
      return {
        ...parsed,
        useCaseType,
        isAIGenerated: true
      };
    } catch (error) {
      console.error('Error parsing AI analysis result:', error);
      console.error('Raw result was:', result.substring(0, 500));
      return this.generateDemoAnalysis(useCaseType);
    }
  }

  private generateDemoAnalysis(useCaseType: UseCaseType): Partial<UseCaseFormData> {
    const baseData = {
      clientName: "Banco Provincia",
      projectName: "Sistema de Gestión Integral",
      useCaseCode: "BP001",
      useCaseName: "Gestionar información del cliente",
      fileName: "BP001GestionarInformacionCliente",
      description: "Permite gestionar la información completa de los clientes del banco incluyendo consulta, actualización y seguimiento de la relación comercial.",
      isAIGenerated: true,
      useCaseType
    };

    switch (useCaseType) {
      case 'entity':
        return {
          ...baseData,
          searchFilters: ["DNI/CUIT", "Apellido", "Email", "Número de Cliente"],
          filtersDescription: "Filtros de búsqueda para localizar clientes por diferentes criterios",
          resultColumns: ["ID Cliente", "Apellido y Nombres", "Documento", "Email", "Estado"],
          columnsDescription: "Columnas principales para mostrar en la grilla de resultados",
          entityFields: [
            { name: "clienteId", type: "number", mandatory: true, length: 10 },
            { name: "tipoDocumento", type: "text", mandatory: true, length: 10 },
            { name: "numeroDocumento", type: "text", mandatory: true, length: 20 },
            { name: "apellido", type: "text", mandatory: true, length: 100 },
            { name: "nombres", type: "text", mandatory: true, length: 100 },
            { name: "email", type: "text", mandatory: false, length: 150 },
            { name: "fechaAlta", type: "date", mandatory: true },
            { name: "usuarioAlta", type: "text", mandatory: true, length: 50 }
          ],
          fieldsDescription: "Campos principales de la entidad cliente con información personal y de auditoría",
          wireframeDescriptions: ["Pantalla de búsqueda con filtros", "Grilla de resultados paginada", "Detalle del cliente"],
          wireframesDescription: "Pantallas necesarias para la gestión completa de clientes",
          alternativeFlows: ["Cliente no encontrado", "Error de validación", "Timeout de sesión"],
          alternativeFlowsDescription: "Flujos alternativos para manejar errores y excepciones",
          businessRules: "1. Solo usuarios autorizados pueden acceder\n2. Validar documento con organismos oficiales",
          specialRequirements: "1. Auditoría completa de cambios\n2. Integración con servicios externos"
        };

      case 'api':
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
          alternativeFlows: ["Token inválido", "Cuenta inexistente", "Servicio no disponible"],
          businessRules: "1. Autenticación obligatoria\n2. Rate limiting por cliente",
          specialRequirements: "1. Encriptación SSL\n2. Logs de auditoría"
        };

      case 'service':
        return {
          ...baseData,
          useCaseName: "Procesar cierre diario",
          fileName: "BP001ProcesarCierreDiario",
          serviceFrequency: "Ejecución diaria a las 23:00 hrs",
          executionTime: "23:00 hrs",
          configurationPaths: "0 0 23 * * *",
          alternativeFlows: ["Fallo en comunicación", "Reintento automático", "Notificación de error"],
          businessRules: "1. Ejecutar solo en días hábiles\n2. Generar backup antes del proceso",
          specialRequirements: "1. Logging detallado\n2. Alertas por email\n3. Mecanismo de rollback"
        };

      default:
        return baseData;
    }
  }
}