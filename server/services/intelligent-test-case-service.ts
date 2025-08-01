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

  async generateIntelligentTestCases(formData: UseCaseFormData, aiModel: string): Promise<IntelligentTestCaseResult> {
    try {
      // Build comprehensive context from the entire use case
      const context = this.buildUseCaseContext(formData);
      
      // Generate intelligent test cases using AI
      const prompt = this.buildIntelligentTestPrompt(context, formData.useCaseType);
      
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
      alternativeFlows: formData.alternativeFlows || [],
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

  private buildIntelligentTestPrompt(context: any, useCaseType: string): string {
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
  "preconditions": "Usuarios de prueba:\\n• [Lista de usuarios de prueba necesarios]\\n\\nDatos de prueba:\\n• [Lista de datos de prueba requeridos]\\n\\nInfraestructura:\\n• [Lista de requisitos de infraestructura]",
  "testSteps": [
    {
      "number": 1,
      "action": "Acción específica a realizar",
      "inputData": "Datos de entrada exactos",
      "expectedResult": "Resultado esperado específico",
      "observations": "Observaciones técnicas importantes",
      "status": "pending"
    },
    {
      "number": 2,
      "action": "Segunda acción a realizar",
      "inputData": "Datos de entrada para el segundo paso",
      "expectedResult": "Resultado esperado del segundo paso",
      "observations": "Observaciones del segundo paso",
      "status": "pending"
    }
  ],
  "analysisNotes": "Análisis del contexto y cobertura de pruebas"
}

TIPOS DE PRUEBAS A INCLUIR:
`;

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
`;

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
`;

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
`;

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

      const parsed = JSON.parse(cleanedResult);
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

      return {
        objective: parsed.objective || `Verificar el funcionamiento completo del caso de uso: ${formData.useCaseName}`,
        preconditions: parsed.preconditions || this.getDefaultPreconditions(formData),
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

  private getDefaultPreconditions(formData: UseCaseFormData): string {
    const basePreconditions = [
      'Usuario autenticado en el sistema',
      'Permisos de acceso configurados correctamente',
      'Sistema operativo y base de datos disponibles',
      'Conexión de red estable'
    ];

    switch (formData.useCaseType) {
      case 'entity':
        basePreconditions.push(
          'Datos de prueba disponibles en la base de datos',
          'Validaciones de negocio configuradas'
        );
        break;
      case 'api':
        basePreconditions.push(
          'API endpoint configurado y disponible',
          'Tokens de autenticación válidos',
          'Servicios externos operativos'
        );
        break;
      case 'service':
        basePreconditions.push(
          'Servicios programados configurados',
          'Recursos del sistema disponibles',
          'Configuración de logging activa'
        );
        break;
    }

    return basePreconditions.join('\n');
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