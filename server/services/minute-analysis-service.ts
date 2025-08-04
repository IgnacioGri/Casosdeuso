import { AIService } from './ai-service.js';
import { UseCaseFormData } from '../../shared/schema.js';

type UseCaseType = 'entity' | 'api' | 'service';

export class MinuteAnalysisService {
  constructor(private aiService: AIService) {}

  async analyzeMinute(text: string, useCaseType: UseCaseType, aiModel: string): Promise<Partial<UseCaseFormData>> {
    // If demo mode is selected, return demo data immediately
    if (aiModel === 'demo') {
      return this.generateDemoAnalysis(useCaseType);
    }
    
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

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:
1. clientName: Es el nombre de la EMPRESA/BANCO/ORGANIZACIÓN cliente (NO el nombre del caso de uso)
   - Buscar palabras como "Banco", "Cohen", "Macro", "Provincia", nombres de empresas
   - Ejemplo correcto: "Cohen Aliados Financieros", "Banco Macro", "Banco Provincia"
   
2. projectName: Es el nombre del PROYECTO o SISTEMA (NO el caso de uso)
   - Buscar frases como "Sistema de", "Módulo de", "Plataforma de"
   - Si no está explícito, inferir del contexto (ej: si habla de proveedores, podría ser "Sistema de Gestión de Proveedores")
   - NO dejar vacío si se puede inferir del contexto
   
3. useCaseCode: Es el CÓDIGO alfanumérico del caso de uso
   - Formato: letras+números (ej: PV003, BP005, UC001)
   - NO confundir con nombres o descripciones
   
4. useCaseName: Es el NOMBRE del caso de uso (acción + entidad)
   - DEBE empezar con verbo infinitivo
   - Ejemplo: "Gestionar Clientes", "Mostrar proveedores", "Consultar Saldos"
   - NO poner aquí el nombre del cliente ni proyecto

5. description: Descripción del QUÉ HACE el caso de uso
   - Si viene muy corta (menos de 10 palabras), devolver tal cual viene
   - NO expandir aquí, solo extraer lo que dice la minuta

NUNCA MEZCLAR:
- NO poner el nombre del cliente en useCaseName
- NO poner el nombre del caso de uso en clientName
- NO dejar projectName vacío si se puede inferir

{
  "clientName": "Nombre de la empresa/banco cliente",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código alfanumérico del caso de uso", 
  "useCaseName": "Nombre del caso de uso con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: código+descripción",
  "description": "Descripción del objetivo del caso de uso tal como viene en la minuta",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no está explícito",
  "searchFilters": ["usar SOLO filtros mencionados en la minuta"],
  "filtersDescription": "Descripción de los filtros de búsqueda necesarios",
  "resultColumns": ["usar SOLO columnas mencionadas en la minuta"],
  "columnsDescription": "Descripción de las columnas que se mostrarán en resultados",
  "entityFields": [
    {
      "name": "usar SOLO campos mencionados en la minuta",
      "type": "tipo según el campo",
      "mandatory": true,
      "length": 50,
      "description": "Descripción clara del propósito del campo",
      "validationRules": "Reglas de validación específicas"
    }
  ],
  "fieldsDescription": "Descripción de los campos de la entidad",
  "wireframeDescriptions": ["usar SOLO pantallas mencionadas en la minuta"],
  "wireframesDescription": "Descripción de las pantallas necesarias",
  "alternativeFlows": ["usar SOLO flujos alternativos mencionados en la minuta"],
  "alternativeFlowsDescription": "Descripción de flujos alternativos y errores",
  "businessRules": ["usar SOLO reglas mencionadas en la minuta"],
  "specialRequirements": ["usar SOLO requerimientos mencionados en la minuta"],
  "isAIGenerated": true
}

REGLAS ESPECÍFICAS:
- useCaseName debe empezar con verbo infinitivo (Gestionar, Consultar, Procesar, etc.)
- fileName sigue patrón: 2 letras + 3 números + descripción (Ejemplo ilustrativo: BP005GestionarClientes)
- entityFields debe incluir TODOS los campos obligatorios del schema: name, type, mandatory, length, description, validationRules
- Tipos válidos: "text", "number", "decimal", "date", "datetime", "boolean", "email"
- Para montos usar tipo "decimal", para IDs usar "number"
- entityFields incluir SIEMPRE campos de auditoría con descripciones completas:
  * fechaAlta (date, mandatory: true, description: "Fecha de creación del registro", validationRules: "Fecha válida")
  * usuarioAlta (text, mandatory: true, length: 50, description: "Usuario que creó el registro", validationRules: "Usuario del sistema")
  * fechaModificacion (date, mandatory: false, description: "Fecha de última modificación", validationRules: "Fecha válida")
  * usuarioModificacion (text, mandatory: false, length: 50, description: "Usuario que modificó", validationRules: "Usuario del sistema")
- Extraer información específica del texto, NUNCA inventar datos genéricos
`;
  }

  private getApiAnalysisRules(): string {
    return `
Para casos de uso tipo API/WEB SERVICE, extrae y estructura la siguiente información:

INSTRUCCIONES CRÍTICAS:
- NUNCA uses valores genéricos o por defecto
- TODO ejemplo mostrado abajo es "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- SIEMPRE extrae datos EXACTOS del texto de la minuta
- Si algún dato no está en la minuta, devuelve null o array vacío según corresponda
- Para el actor principal: Si no hay actor explícito, usar "Actor no identificado"

{
  "clientName": "Nombre del cliente/organización",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código del caso de uso (Ejemplo ilustrativo: API001, WS002)",
  "useCaseName": "Nombre del servicio empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción del propósito del API/servicio",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no está explícito",
  "apiEndpoint": "URL del endpoint (Ejemplo ilustrativo: /api/v1/consulta-saldo)",
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
      
      // Validation and correction of common AI parsing errors
      let correctedData = { ...parsed };
      
      // Check if clientName contains a verb (likely mixed with useCaseName)
      const infinitiveVerbs = ['gestionar', 'crear', 'mostrar', 'consultar', 'ver', 'actualizar', 'eliminar', 'procesar'];
      if (correctedData.clientName && infinitiveVerbs.some(verb => correctedData.clientName.toLowerCase().includes(verb))) {
        console.warn('⚠️ clientName contains a verb, likely mixed with useCaseName');
        // Swap if needed
        if (correctedData.useCaseName && !infinitiveVerbs.some(verb => correctedData.useCaseName.toLowerCase().startsWith(verb))) {
          const temp = correctedData.clientName;
          correctedData.clientName = correctedData.useCaseName;
          correctedData.useCaseName = temp;
          console.log('✓ Swapped clientName and useCaseName');
        }
      }
      
      // Validate useCaseName starts with infinitive verb
      if (correctedData.useCaseName && !infinitiveVerbs.some(verb => correctedData.useCaseName.toLowerCase().startsWith(verb))) {
        console.error('⚠️ useCaseName does not start with infinitive verb:', correctedData.useCaseName);
        // Try to fix common patterns
        if (correctedData.description && correctedData.description.toLowerCase().startsWith('mostrar')) {
          correctedData.useCaseName = correctedData.description;
          console.log('✓ Fixed useCaseName from description');
        }
      }
      
      // Check if projectName is empty but can be inferred
      if (!correctedData.projectName || correctedData.projectName === null) {
        console.warn('⚠️ projectName is empty, trying to infer...');
        // Try to infer from context
        if (correctedData.useCaseName && correctedData.useCaseName.toLowerCase().includes('proveedores')) {
          correctedData.projectName = 'Sistema de Gestión de Proveedores';
        } else if (correctedData.useCaseName && correctedData.useCaseName.toLowerCase().includes('clientes')) {
          correctedData.projectName = 'Sistema de Gestión de Clientes';
        } else {
          correctedData.projectName = 'Sistema de Gestión';
        }
        console.log('✓ Inferred projectName:', correctedData.projectName);
      }
      
      // Ensure the result includes the use case type and AI generated flag
      return {
        ...correctedData,
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
            { name: "clienteId", type: "number", mandatory: true, length: 10, description: "Identificador único del cliente", validationRules: "Número entero positivo" },
            { name: "tipoDocumento", type: "text", mandatory: true, length: 10, description: "Tipo de documento de identidad", validationRules: "DNI, CUIT, CUIL" },
            { name: "numeroDocumento", type: "text", mandatory: true, length: 20, description: "Número del documento de identidad", validationRules: "Solo números, sin puntos ni guiones" },
            { name: "apellido", type: "text", mandatory: true, length: 100, description: "Apellido del cliente", validationRules: "Solo letras y espacios" },
            { name: "nombres", type: "text", mandatory: true, length: 100, description: "Nombres del cliente", validationRules: "Solo letras y espacios" },
            { name: "email", type: "text", mandatory: false, length: 150, description: "Correo electrónico del cliente", validationRules: "Formato email válido" },
            { name: "fechaAlta", type: "date", mandatory: true, description: "Fecha de creación del registro", validationRules: "Formato ISO 8601" },
            { name: "usuarioAlta", type: "text", mandatory: true, length: 50, description: "Usuario que creó el registro", validationRules: "Debe existir en el sistema" }
          ],
          fieldsDescription: "Campos principales de la entidad cliente con información personal y de auditoría",
          wireframeDescriptions: ["Pantalla de búsqueda con filtros", "Grilla de resultados paginada", "Detalle del cliente"],
          wireframesDescription: "Pantallas necesarias para la gestión completa de clientes",
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
          businessRules: "1. Ejecutar solo en días hábiles\n2. Generar backup antes del proceso",
          specialRequirements: "1. Logging detallado\n2. Alertas por email\n3. Mecanismo de rollback"
        };

      default:
        return baseData;
    }
  }
}