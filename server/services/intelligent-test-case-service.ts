import { AIService } from './ai-service.js';
import { UseCaseFormData } from '../../shared/schema.js';

export interface TestCase {
  number: number;
  action: string;
  inputData: string;
  expectedResult: string;
  observations: string;
  status: string;
}

export interface IntelligentTestCaseResult {
  objective: string;
  preconditions: string;
  testSteps: TestCase[];
  analysisNotes: string;
}

export class IntelligentTestCaseService {
  constructor(private aiService: AIService) {}

  async generateIntelligentTestCases(
    formData: UseCaseFormData, 
    aiModel: string, 
    suggestions?: string, 
    isRegeneration?: boolean
  ): Promise<IntelligentTestCaseResult> {
    try {
      // Build comprehensive context from the entire use case
      const context = this.buildUseCaseContext(formData);
      
      // Generate intelligent test cases using AI
      const prompt = this.buildIntelligentTestPrompt(context, formData.useCaseType, suggestions, isRegeneration);
      
      console.log('🎯 Using prompt for test generation:', {
        hasBasicPrompt: !!prompt,
        hasSuggestions: !!suggestions,
        isRegeneration,
        promptLength: prompt.length
      });
      
      // Use processFieldWithAI method for test case generation
      const testCaseResult = await AIService.processFieldWithAI(
        prompt,
        context.fullDescription,
        aiModel
      );

      // Parse and structure the AI response
      return this.parseIntelligentTestResult(testCaseResult, formData);
    } catch (error) {
      console.error('Error generating intelligent test cases:', error);
      // Re-throw the error with detailed information
      if (error instanceof Error) {
        throw new Error(`Error al generar casos de prueba inteligentes: ${error.message}`);
      } else {
        throw new Error('Error desconocido al generar casos de prueba inteligentes');
      }
    }
  }

  private buildUseCaseContext(formData: UseCaseFormData) {
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
      businessRules: formData.businessRules || '',
      specialRequirements: formData.specialRequirements || '',
      alternativeFlows: [],
      wireframes: formData.wireframeDescriptions || [],
      fullDescription: ''
    };

    // Add type-specific technical details
    switch (formData.useCaseType) {
      case 'entity':
        context.technicalDetails = {
          searchFilters: formData.searchFilters || [],
          resultColumns: formData.resultColumns || [],
          entityFields: formData.entityFields || []
        };
        break;
      case 'api':
        context.technicalDetails = {
          apiEndpoint: (formData as any).apiEndpoint,
          httpMethod: (formData as any).httpMethod,
          requestFormat: (formData as any).requestFormat,
          responseFormat: (formData as any).responseFormat
        };
        break;
      case 'service':
        context.technicalDetails = {
          serviceFrequency: (formData as any).serviceFrequency,
          executionTime: (formData as any).executionTime,
          configurationPaths: (formData as any).configurationPaths
        };
        break;
    }

    // Build comprehensive description for AI analysis
    context.fullDescription = this.buildFullDescription(context);
    
    return context;
  }

  private buildFullDescription(context: any): string {
    const sections = [
      `CASO DE USO: ${context.basicInfo.useCaseName}`,
      `CLIENTE: ${context.basicInfo.clientName}`,
      `PROYECTO: ${context.basicInfo.projectName}`,
      `TIPO: ${context.basicInfo.useCaseType.toUpperCase()}`,
      `CÓDIGO: ${context.basicInfo.useCaseCode}`,
      '',
      `DESCRIPCIÓN:`,
      context.basicInfo.description,
      ''
    ];

    // Add technical details based on type
    if (context.basicInfo.useCaseType === 'entity') {
      sections.push('FILTROS DE BÚSQUEDA:');
      context.technicalDetails.searchFilters?.forEach((filter: string) => {
        sections.push(`- ${filter}`);
      });
      sections.push('');

      sections.push('COLUMNAS DE RESULTADO:');
      context.technicalDetails.resultColumns?.forEach((column: string) => {
        sections.push(`- ${column}`);
      });
      sections.push('');

      sections.push('CAMPOS DE ENTIDAD:');
      context.technicalDetails.entityFields?.forEach((field: any) => {
        sections.push(`- ${field.name} (${field.type}${field.length ? `, longitud: ${field.length}` : ''}, ${field.mandatory ? 'obligatorio' : 'opcional'})`);
      });
      sections.push('');
    } else if (context.basicInfo.useCaseType === 'api') {
      sections.push('CONFIGURACIÓN API:');
      sections.push(`- Endpoint: ${context.technicalDetails.apiEndpoint}`);
      sections.push(`- Método HTTP: ${context.technicalDetails.httpMethod}`);
      if (context.technicalDetails.requestFormat) {
        sections.push('- Formato de Petición:');
        sections.push(context.technicalDetails.requestFormat);
      }
      if (context.technicalDetails.responseFormat) {
        sections.push('- Formato de Respuesta:');
        sections.push(context.technicalDetails.responseFormat);
      }
      sections.push('');
    } else if (context.basicInfo.useCaseType === 'service') {
      sections.push('CONFIGURACIÓN DEL SERVICIO:');
      if (context.technicalDetails.serviceFrequency) {
        sections.push(`- Frecuencia: ${context.technicalDetails.serviceFrequency}`);
      }
      if (context.technicalDetails.executionTime) {
        sections.push(`- Tiempo de Ejecución: ${context.technicalDetails.executionTime}`);
      }
      if (context.technicalDetails.configurationPaths) {
        sections.push(`- Rutas de Configuración: ${context.technicalDetails.configurationPaths}`);
      }
      sections.push('');
    }

    if (context.businessRules) {
      sections.push('REGLAS DE NEGOCIO:');
      sections.push(context.businessRules);
      sections.push('');
    }

    if (context.specialRequirements) {
      sections.push('REQUERIMIENTOS ESPECIALES:');
      sections.push(context.specialRequirements);
      sections.push('');
    }

    if (context.alternativeFlows?.length > 0) {
      sections.push('FLUJOS ALTERNATIVOS:');
      context.alternativeFlows.forEach((flow: string) => {
        sections.push(`- ${flow}`);
      });
      sections.push('');
    }

    if (context.wireframes?.length > 0) {
      sections.push('WIREFRAMES/PANTALLAS:');
      context.wireframes.forEach((wireframe: string) => {
        sections.push(`- ${wireframe}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  private buildIntelligentTestPrompt(context: any, useCaseType: string, suggestions?: string, isRegeneration?: boolean): string {
    const basePrompt = `
Eres un analista de QA experto especializado en generar casos de prueba completos y profesionales siguiendo estándares bancarios ING.

INSTRUCCIONES CRÍTICAS:
1. Analiza TODO el caso de uso proporcionado incluyendo reglas de negocio, flujos alternativos y requerimientos especiales
2. Genera casos de prueba COMPLETOS que cubran: flujo principal, validaciones, errores, seguridad y rendimiento
3. Responde ÚNICAMENTE con JSON válido sin explicaciones adicionales
4. Cada paso debe ser específico, actionable y verificable
5. DEBES incluir mínimo 5-10 pasos de prueba para cubrir todos los escenarios

ESTRUCTURA REQUERIDA:
{
  "objective": "Objetivo claro y específico del caso de prueba",
  "preconditions": "1. Usuarios de prueba\\n   a. Usuario con perfil autorizado: descripción completa del usuario y sus permisos\\n   b. Usuario sin permisos: descripción del usuario sin acceso\\n\\n2. Datos de prueba\\n   a. Datos válidos: descripción de datos de prueba correctos\\n   b. Datos inválidos: descripción de datos para pruebas negativas\\n\\n3. Infraestructura y configuración\\n   a. Sistema de pruebas configurado y accesible\\n   b. Base de datos con datos de prueba\\n   c. Servicios externos simulados o disponibles",
  "testSteps": [
    {
      "number": 1,
      "action": "Acción específica a realizar",
      "inputData": "Datos de entrada exactos",
      "expectedResult": "Resultado esperado específico",
      "observations": "Observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba"
    },
    {
      "number": 2,
      "action": "Segunda acción a realizar",
      "inputData": "Datos de entrada para el segundo paso",
      "expectedResult": "Resultado esperado del segundo paso",
      "observations": "Consideraciones específicas del segundo paso, advertencias o información relevante para la ejecución"
    }
  ],
  "analysisNotes": "Análisis del contexto y cobertura de pruebas"
}

FORMATO DE PRECONDICIONES:
Las precondiciones DEBEN seguir el formato jerárquico (1/a/b) similar a los flujos principales:
1. Categoría principal
   a. Subcategoría o elemento específico
   b. Otro elemento específico
2. Segunda categoría principal
   a. Elementos de esta categoría
   
NO uses bullets (•) ni guiones (-). Usa numeración jerárquica.

TIPOS DE PRUEBAS A INCLUIR:
`;

    // Add suggestions section if this is a regeneration
    let suggestionsSection = '';
    if (isRegeneration && suggestions) {
      console.log('🎯 Adding suggestions to prompt:', suggestions.substring(0, 200) + '...');
      suggestionsSection = `

🔥 IMPORTANTE: REGENERACIÓN CON SUGERENCIAS DEL USUARIO 🔥

EL USUARIO HA PROPORCIONADO LAS SIGUIENTES SUGERENCIAS ESPECÍFICAS QUE DEBES IMPLEMENTAR OBLIGATORIAMENTE:

${suggestions}

INSTRUCCIONES CRÍTICAS PARA LA REGENERACIÓN:
1. DEBES incorporar TODAS las sugerencias específicas del usuario en los casos de prueba
2. DEBES agregar los elementos exactos que el usuario solicita
3. DEBES mantener la estructura JSON pero MODIFICAR el contenido según las sugerencias
4. Si el usuario menciona nombres específicos, datos específicos, o casos específicos, DEBES incluirlos EXACTAMENTE
5. Esta es una REGENERACIÓN, no una primera generación, así que el usuario espera ver los cambios sugeridos aplicados

`;
    }

    switch (useCaseType) {
      case 'entity':
        return basePrompt + `
- Búsqueda con diferentes filtros (válidos e inválidos)
- Validación de campos obligatorios y opcionales
- Límites de longitud de campos
- Formatos de datos (emails, fechas, números)
- Paginación y ordenamiento de resultados
- Creación, modificación y eliminación de registros
- Auditoría de cambios (fechaAlta, usuarioAlta, etc.)
- Validaciones de seguridad y permisos
- Manejo de errores y excepciones
- Rendimiento con grandes volúmenes de datos

CONTEXTO BANCARIO ING:
- Validaciones estrictas de DNI/CUIT
- Cumplimiento de normativas bancarias
- Auditoría completa de operaciones
- Seguridad de datos sensibles
${suggestionsSection}`;

      case 'api':
        return basePrompt + `
- Llamadas con diferentes métodos HTTP
- Validación de formato de petición JSON
- Validación de parámetros obligatorios y opcionales
- Códigos de respuesta HTTP (200, 400, 401, 500, etc.)
- Formato de respuesta JSON
- Validación de tokens de autenticación
- Rate limiting y throttling
- Timeouts y reintentos
- Manejo de errores de red
- Validaciones de seguridad SSL/TLS

CONTEXTO BANCARIO ING:
- Encriptación de datos sensibles
- Logs de auditoría de transacciones
- Validación de permisos por cliente
- Cumplimiento PCI DSS
${suggestionsSection}`;

      case 'service':
        return basePrompt + `
- Ejecución programada según frecuencia configurada
- Validación de parámetros de configuración
- Procesamiento de diferentes volúmenes de datos
- Manejo de errores durante ejecución
- Reintentos automáticos en caso de fallo
- Generación de logs detallados
- Notificaciones de éxito y error
- Validación de recursos del sistema
- Backup y rollback de datos
- Monitoreo de rendimiento

CONTEXTO BANCARIO ING:
- Procesos de cierre contable
- Conciliación de cuentas
- Generación de reportes regulatorios
- Backup de datos críticos
${suggestionsSection}`;

      default:
        return basePrompt;
    }
  }

  private parseIntelligentTestResult(aiResult: string, formData: UseCaseFormData): IntelligentTestCaseResult {
    try {
      console.log('Raw intelligent test result:', aiResult.substring(0, 500) + '...');
      
      // Only check for demo content if it's explicitly demo mode response
      if (aiResult.startsWith('Demo Analysis Result:')) {
        console.log('Detected demo content in intelligent test response, using fallback');
        throw new Error('Demo content detected');
      }

      // Clean the AI response more aggressively
      let cleanedResult = aiResult;
      
      // Remove markdown code blocks
      cleanedResult = cleanedResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON object - find first { and last }
      const firstBrace = cleanedResult.indexOf('{');
      const lastBrace = cleanedResult.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedResult = cleanedResult.substring(firstBrace, lastBrace + 1);
      }
      
      cleanedResult = cleanedResult.trim();

      console.log('Cleaned intelligent test result for JSON parsing:', cleanedResult);

      let parsed;
      try {
        parsed = JSON.parse(cleanedResult);
      } catch (jsonError) {
        console.error('Initial JSON parse failed, attempting to fix incomplete JSON...');
        
        // Try to fix common JSON issues
        // Add missing closing brackets/braces
        const openBraces = (cleanedResult.match(/{/g) || []).length;
        const closeBraces = (cleanedResult.match(/}/g) || []).length;
        const openBrackets = (cleanedResult.match(/\[/g) || []).length;
        const closeBrackets = (cleanedResult.match(/]/g) || []).length;
        
        let fixedResult = cleanedResult;
        
        // Add missing closing brackets
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedResult += ']';
        }
        
        // Add missing closing braces
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedResult += '}';
        }
        
        // Try parsing the fixed result
        try {
          parsed = JSON.parse(fixedResult);
          console.log('Successfully parsed after fixing JSON structure');
        } catch (secondError) {
          // If still failing, throw original error
          throw jsonError;
        }
      }
      
      console.log('Parsed intelligent test result:', parsed);

      // Validate the parsed result has required fields
      if (!parsed.testSteps || !Array.isArray(parsed.testSteps) || parsed.testSteps.length === 0) {
        console.warn('AI response missing testSteps array or empty, generating fallback test steps');
        // Generate fallback test steps based on use case type
        parsed.testSteps = this.generateFallbackTestSteps(formData);
      }

      // Ensure test steps have proper numbering and required fields
      const testSteps = (parsed.testSteps || []).map((step: any, index: number) => ({
        number: index + 1,
        action: step.action || `Acción ${index + 1}`,
        inputData: step.inputData || 'Datos de entrada',
        expectedResult: step.expectedResult || 'Resultado esperado',
        observations: step.observations || '',
        status: 'pending' as const
      }));

      // Format preconditions properly
      const formattedPreconditions = this.formatPreconditions(parsed.preconditions, formData);

      return {
        objective: parsed.objective || `Verificar el funcionamiento completo del caso de uso: ${formData.useCaseName}`,
        preconditions: formattedPreconditions.trim(),
        testSteps,
        analysisNotes: parsed.analysisNotes || 'Análisis generado automáticamente basado en el caso de uso completo'
      };
    } catch (error) {
      console.error('Error parsing intelligent test result:', error);
      console.error('AI Result that failed to parse:', aiResult);
      
      // Try to provide a helpful error message
      if (error instanceof SyntaxError) {
        throw new Error('La respuesta de IA no tiene el formato JSON esperado. Por favor, intente nuevamente.');
      } else {
        throw new Error(`Error al procesar la respuesta de IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  }

  private formatPreconditions(preconditions: any, formData: UseCaseFormData): string {
    // If preconditions is already a well-formatted string with hierarchical numbering, return it
    if (typeof preconditions === 'string' && /^\d+\./.test(preconditions.trim())) {
      return preconditions;
    }

    let formatted = '';
    let sectionNumber = 1;

    // Helper to extract text from various object formats
    const extractText = (item: any): string => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        // Handle different object structures
        if (item.description) return item.description;
        if (item.usuario && item.descripcion) return `${item.usuario}: ${item.descripcion}`;
        if (item.requisito) return item.requisito;
        if (item.requirement) return item.requirement;
        if (item.user) return item.user;
        if (item.data) return item.data;
        
        // If it has datos property, format it nicely
        if (item.datos) {
          const dataParts = Object.entries(item.datos)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          return `${item.descripcion || 'Datos'}: ${dataParts}`;
        }
        
        // Fallback to stringifying the object if nothing else works
        return JSON.stringify(item);
      }
      return String(item);
    };

    // If preconditions is an object, convert it
    if (typeof preconditions === 'object' && preconditions !== null) {
      // Process each section
      const sections = [
        { key: ['usuarios', 'usuariosDePrueba', 'usuarios_de_prueba', 'users'], title: 'Usuarios de prueba' },
        { key: ['datos', 'datosDePrueba', 'datos_de_prueba', 'data'], title: 'Datos de prueba' },
        { key: ['infraestructura', 'infrastructure', 'sistema'], title: 'Infraestructura y configuración' }
      ];

      for (const section of sections) {
        // Find the matching key
        const matchingKey = section.key.find(k => preconditions[k]);
        if (matchingKey && preconditions[matchingKey]) {
          formatted += `${sectionNumber}. ${section.title}\n`;
          
          const items = preconditions[matchingKey];
          if (Array.isArray(items)) {
            items.forEach((item, index) => {
              const letter = String.fromCharCode(97 + index); // a, b, c...
              const text = extractText(item);
              // Clean up the text - remove any remaining JSON artifacts
              const cleanText = text.replace(/[{}]/g, '').replace(/"/g, '');
              formatted += `   ${letter}. ${cleanText}\n`;
            });
          } else {
            formatted += `   a. ${extractText(items)}\n`;
          }
          
          formatted += '\n';
          sectionNumber++;
        }
      }

      // Handle any other sections not covered above
      for (const [key, value] of Object.entries(preconditions)) {
        if (!sections.some(s => s.key.includes(key))) {
          formatted += `${sectionNumber}. ${key.charAt(0).toUpperCase() + key.slice(1)}\n`;
          if (Array.isArray(value)) {
            value.forEach((item: any, index: number) => {
              const letter = String.fromCharCode(97 + index);
              formatted += `   ${letter}. ${extractText(item)}\n`;
            });
          } else {
            formatted += `   a. ${extractText(value)}\n`;
          }
          formatted += '\n';
          sectionNumber++;
        }
      }
    } else if (typeof preconditions === 'string') {
      // If it's a string but poorly formatted, try to clean it up
      const lines = preconditions.split('\n').filter(line => line.trim());
      let currentSection = '';
      let itemLetter = 'a';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip double bullets
        if (trimmedLine.startsWith('• •')) {
          continue;
        }
        
        // Check if it's a section header
        if (trimmedLine.startsWith('•') && trimmedLine.endsWith(':')) {
          currentSection = trimmedLine.replace(/^•\s*/, '').replace(/:$/, '');
          formatted += `${sectionNumber}. ${currentSection}\n`;
          sectionNumber++;
          itemLetter = 'a';
        }
        // Handle sub-items
        else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          const text = trimmedLine.replace(/^[-•]\s*/, '');
          // Clean up any JSON objects
          const cleanText = text.replace(/\[object Object\]/g, '')
            .replace(/\{[^}]+\}/g, (match) => {
              try {
                const obj = JSON.parse(match);
                return extractText(obj);
              } catch {
                return match;
              }
            });
          formatted += `   ${itemLetter}. ${cleanText}\n`;
          itemLetter = String.fromCharCode(itemLetter.charCodeAt(0) + 1);
        }
      }
    }

    // If still empty, provide default preconditions
    if (!formatted.trim()) {
      return this.getDefaultPreconditions(formData);
    }

    return formatted.trim();
  }

  private getDefaultPreconditions(formData: UseCaseFormData): string {
    const projectName = formData.projectName || 'Sistema';
    const useCaseName = formData.useCaseName || 'Gestión';
    
    let preconditions = `• Usuario con perfil autorizado con permisos completos para ejecutar las operaciones del caso de uso
• Usuario sin permisos válido pero sin acceso a esta funcionalidad específica
• Datos válidos de prueba que cumplen con todas las validaciones y reglas de negocio
• Datos inválidos diseñados para probar validaciones y manejo de errores
• Sistema ${projectName} desplegado en ambiente de pruebas (UAT)
• Base de datos con datos de prueba precargados
• Servicios externos simulados o disponibles según requerimientos`;

    // Add specific preconditions based on use case type
    if (formData.useCaseType === 'api') {
      preconditions += `
• Endpoint API configurado y accesible: ${formData.apiEndpoint || '/api/endpoint'}
• Herramientas de prueba API (Postman, curl) disponibles`;
    } else if (formData.useCaseType === 'service') {
      preconditions += `
• Servicio programado configurado con frecuencia: ${formData.serviceFrequency || 'Diaria'}
• Logs y monitoreo habilitados para verificación`;
    }

    return preconditions;
  }

  private generateFallbackTestSteps(formData: UseCaseFormData): any[] {
    const baseSteps = [
      {
        action: 'Acceder al sistema con credenciales válidas',
        inputData: 'Usuario y contraseña correctos',
        expectedResult: 'Acceso exitoso al sistema',
        observations: 'Verificar logs de auditoría',
        status: 'pending'
      },
      {
        action: `Navegar a la funcionalidad ${formData.useCaseName}`,
        inputData: 'Menú principal o acceso directo',
        expectedResult: 'Pantalla de la funcionalidad desplegada correctamente',
        observations: 'Verificar tiempo de carga',
        status: 'pending'
      }
    ];

    switch (formData.useCaseType) {
      case 'entity':
        return [
          ...baseSteps,
          {
            action: 'Realizar búsqueda con filtros válidos',
            inputData: formData.searchFilters?.join(', ') || 'Filtros de búsqueda',
            expectedResult: 'Resultados mostrados correctamente',
            observations: 'Verificar paginación',
            status: 'pending'
          },
          {
            action: 'Validar campos obligatorios',
            inputData: 'Dejar campos obligatorios vacíos',
            expectedResult: 'Mensaje de error correspondiente',
            observations: 'Verificar mensajes de validación',
            status: 'pending'
          },
          {
            action: 'Crear nuevo registro',
            inputData: 'Datos válidos en todos los campos',
            expectedResult: 'Registro creado exitosamente',
            observations: 'Verificar auditoría',
            status: 'pending'
          }
        ];
      
      case 'api':
        return [
          ...baseSteps,
          {
            action: 'Enviar petición con datos válidos',
            inputData: 'JSON con estructura correcta',
            expectedResult: 'Respuesta HTTP 200/201',
            observations: 'Verificar headers y body',
            status: 'pending'
          },
          {
            action: 'Enviar petición con datos inválidos',
            inputData: 'JSON con campos faltantes',
            expectedResult: 'Respuesta HTTP 400 con mensaje de error',
            observations: 'Verificar estructura del error',
            status: 'pending'
          }
        ];
      
      case 'service':
        return [
          ...baseSteps,
          {
            action: 'Ejecutar servicio manualmente',
            inputData: 'Parámetros de configuración',
            expectedResult: 'Servicio ejecutado correctamente',
            observations: 'Verificar logs de ejecución',
            status: 'pending'
          },
          {
            action: 'Verificar procesamiento de datos',
            inputData: 'Volumen de datos de prueba',
            expectedResult: 'Datos procesados correctamente',
            observations: 'Verificar integridad de datos',
            status: 'pending'
          }
        ];
      
      default:
        return baseSteps;
    }
  }



  private generateDemoIntelligentTests(formData: UseCaseFormData): IntelligentTestCaseResult {
    const baseTestSteps = [
      {
        number: 1,
        action: 'Acceder al sistema con credenciales válidas',
        inputData: 'Usuario: admin, Contraseña: validPassword123',
        expectedResult: 'Login exitoso, redirección a página principal',
        observations: 'Verificar que el token de sesión se genere correctamente',
        status: 'pending'
      },
      {
        number: 2,
        action: 'Navegar a la funcionalidad del caso de uso',
        inputData: 'Clic en módulo correspondiente del menú principal',
        expectedResult: 'Pantalla del caso de uso se carga correctamente',
        observations: 'Verificar tiempos de carga < 3 segundos',
        status: 'pending'
      }
    ];

    switch (formData.useCaseType) {
      case 'entity':
        return {
          objective: `Verificar el funcionamiento completo de la gestión de entidades: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: 'Realizar búsqueda con filtros válidos',
              inputData: 'DNI: 12345678, Apellido: "González"',
              expectedResult: 'Lista de resultados filtrados correctamente',
              observations: 'Verificar paginación y ordenamiento',
              status: 'pending'
            },
            {
              number: 4,
              action: 'Intentar búsqueda con filtros inválidos',
              inputData: 'DNI: "abc123", Email: formato_inválido',
              expectedResult: 'Mensajes de validación específicos mostrados',
              observations: 'No permitir búsqueda con datos inválidos',
              status: 'pending'
            },
            {
              number: 5,
              action: 'Crear nuevo registro con datos completos',
              inputData: 'Todos los campos obligatorios con datos válidos',
              expectedResult: 'Registro creado exitosamente, ID asignado',
              observations: 'Verificar auditoría (fechaAlta, usuarioAlta)',
              status: 'pending'
            },
            {
              number: 6,
              action: 'Intentar crear registro con campos obligatorios vacíos',
              inputData: 'Dejar campos requeridos sin completar',
              expectedResult: 'Validaciones impiden el guardado',
              observations: 'Mensajes de error claros para cada campo',
              status: 'pending'
            }
          ],
          analysisNotes: 'Cobertura completa: CRUD, validaciones, auditoría, filtros, paginación'
        };

      case 'api':
        return {
          objective: `Verificar el funcionamiento completo de la API: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: 'Realizar petición con datos válidos',
              inputData: 'JSON con estructura y datos correctos',
              expectedResult: 'Respuesta HTTP 200 con datos esperados',
              observations: 'Verificar estructura del JSON de respuesta',
              status: 'pending'
            },
            {
              number: 4,
              action: 'Enviar petición con JSON malformado',
              inputData: 'JSON con sintaxis incorrecta',
              expectedResult: 'Error HTTP 400 - Bad Request',
              observations: 'Mensaje de error descriptivo',
              status: 'pending'
            },
            {
              number: 5,
              action: 'Probar autenticación inválida',
              inputData: 'Token expirado o inválido',
              expectedResult: 'Error HTTP 401 - Unauthorized',
              observations: 'No revelar información sensible',
              status: 'pending'
            },
            {
              number: 6,
              action: 'Verificar rate limiting',
              inputData: 'Múltiples peticiones rápidas consecutivas',
              expectedResult: 'Error HTTP 429 después del límite',
              observations: 'Implementación correcta de throttling',
              status: 'pending'
            }
          ],
          analysisNotes: 'Cobertura completa: endpoints, validaciones, autenticación, rate limiting, manejo de errores'
        };

      case 'service':
        return {
          objective: `Verificar el funcionamiento completo del servicio: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: [
            ...baseTestSteps,
            {
              number: 3,
              action: 'Ejecutar servicio manualmente',
              inputData: 'Trigger manual del proceso programado',
              expectedResult: 'Ejecución exitosa con logs generados',
              observations: 'Verificar todas las etapas del proceso',
              status: 'pending'
            },
            {
              number: 4,
              action: 'Simular error durante ejecución',
              inputData: 'Condición de error controlada',
              expectedResult: 'Manejo de error y rollback automático',
              observations: 'Verificar mecanismos de recuperación',
              status: 'pending'
            },
            {
              number: 5,
              action: 'Verificar ejecución programada',
              inputData: 'Configuración de schedule activa',
              expectedResult: 'Servicio se ejecuta según programación',
              observations: 'Monitorear logs de ejecución automática',
              status: 'pending'
            },
            {
              number: 6,
              action: 'Probar con volumen de datos alto',
              inputData: 'Dataset de gran tamaño',
              expectedResult: 'Procesamiento exitoso sin timeouts',
              observations: 'Verificar rendimiento y uso de recursos',
              status: 'pending'
            }
          ],
          analysisNotes: 'Cobertura completa: ejecución manual/automática, manejo de errores, rendimiento, logs'
        };

      default:
        return {
          objective: `Verificar funcionalidad básica: ${formData.useCaseName}`,
          preconditions: this.getDefaultPreconditions(formData),
          testSteps: baseTestSteps,
          analysisNotes: 'Casos de prueba básicos generados'
        };
    }
  }
}