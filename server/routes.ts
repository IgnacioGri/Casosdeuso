import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUseCaseSchema, useCaseFormSchema } from "@shared/schema";
import { AIService } from "./services/ai-service";
import { DocumentService } from "./services/document-service";
import { MinuteAnalysisService } from "./services/minute-analysis-service";
import { IntelligentTestCaseService } from "./services/intelligent-test-case-service";

const USE_CASE_RULES = `
REGLAS PARA CASOS DE USO CON IA - SEGUIR ESTRICTAMENTE:

ESTRUCTURA COMÚN PARA TODOS LOS TIPOS:
- Título: igual al nombre del caso de uso EN MAYÚSCULAS, color azul oscuro (red=0, green=112, blue=192)
- Nombre del Cliente
- Nombre del Proyecto  
- Código del Caso de Uso
- Nombre del Caso de Uso
- Nombre del Archivo
- Descripción: explicación detallada del alcance y objetivo
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
   a. Detallar los filtros de búsqueda de la entidad
   b. Detallar las columnas del resultado de búsqueda
2. Agregar una nueva entidad
   a. Detallar cada uno de los datos de la entidad
   b. Cuando se agrega se registra fecha y usuario de alta

Flujos Alternativos (lista numerada multinivel):
1. Modificar o actualizar una entidad
   a. Detallar cada uno de los datos de la entidad
   b. Mostrar el identificador
   c. Mostrar fecha y usuario de alta
   d. Al modificar se registra fecha y usuario de modificación
2. Eliminar una entidad
   a. Verificar que no tenga relaciones con otras entidades

AGREGAR SECCIONES DE WIREFRAMES (solo para entidades):
- Boceto gráfico del buscador de entidades: incluir paginado, botones Buscar/Limpiar/Agregar, botones Editar/Eliminar por fila
- Boceto gráfico para agregar entidad: botones Aceptar/Cancelar, fechas de alta/modificación
- Detallar funcionalidades de cada interfaz con listas específicas

CASOS DE USO DE API/WEB SERVICE:
Flujo Principal: incluir identificación, request y response
Flujos Alternativos: incluir respuestas de error
Incluir detalle completo del request y response

CASOS DE USO DE SERVICIO/PROCESO AUTOMÁTICO:
Flujo Principal: incluir frecuencia y/o hora de ejecución
Flujos Alternativos: incluir respuestas de error
Si captura archivo: indicar que el path debe ser configurable
Si llama web service: indicar que usuario, clave y URL deben ser configurables

FORMATO Y ESTILO OBLIGATORIO:
- Font: Segoe UI Semilight para todo el documento
- Interlineado: simple
- Espaciado: simple
- Títulos: color azul oscuro (red=0, green=112, blue=192)
- Listas multinivel: 1º nivel números (1,2,3), 2º nivel letras (a,b,c) con sangría 0.2", 3º nivel romanos (i,ii,iii) con sangría 0.2"
- Nombre del caso de uso: debe comenzar con verbo en infinitivo

TABLA FINAL OBLIGATORIA - HISTORIA DE REVISIONES:
- Título: "HISTORIA DE REVISIONES Y APROBACIONES" (Heading 1, azul)
- Tabla: 2 filas, 4 columnas
- Columnas: Fecha, Acción, Responsable, Comentario
- Ancho: 2.17 pulgadas
- Títulos en negrita y centrados
- Datos alineados a la izquierda
- Bordes grises uniformes
- Una fila de datos con fecha actual, "Versión original", "Sistema", "Documento generado automáticamente"
`;

// Function to generate specific rules based on use case type
function getSpecificRules(useCaseType: string, formData: any): string {
  const today = new Date().toLocaleDateString('es-ES');
  
  if (useCaseType === 'entity') {
    return `
INSTRUCCIONES CRÍTICAS PARA CASOS DE USO DE ENTIDAD - SIGUE EXACTAMENTE LA MINUTA ING:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'No especificado'}
- Columnas de resultado: ${formData.resultColumns?.join(', ') || 'No especificado'}
- Campos de entidad: ${formData.entityFields?.map((f: any) => `${f.name} (${f.type}${f.length ? `, ${f.length}` : ''}${f.mandatory ? ', obligatorio' : ', opcional'})`).join(', ') || 'No especificado'}
- Reglas de negocio: ${formData.businessRules || 'No especificado'}
- Requerimientos especiales: ${formData.specialRequirements || 'No especificado'}
- Generar wireframes: ${formData.generateWireframes ? 'Sí' : 'No'}

ESTRUCTURA OBLIGATORIA SEGÚN MINUTA ING:

1. TÍTULO: "${formData.useCaseName}" en MAYÚSCULAS, color azul oscuro RGB(0,112,192), font Segoe UI Semilight

2. INFORMACIÓN BÁSICA (presentar como tabla HTML):
   - Nombre del cliente: ${formData.clientName}
   - Nombre del proyecto: ${formData.projectName}
   - Código del caso de uso: ${formData.useCaseCode}
   - Nombre del caso de uso: ${formData.useCaseName}
   - Nombre del archivo: ${formData.fileName}

3. DESCRIPCIÓN: Explicación detallada del alcance y objetivo del caso de uso

4. FLUJO PRINCIPAL DE EVENTOS (lista numerada con múltiples niveles - formato 1, a, i):
   DEBE incluir OBLIGATORIAMENTE estas funcionalidades:
   1. Buscar datos de la entidad
      a. Detallar los filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'No especificado'}
      b. Detallar las columnas del resultado: ${formData.resultColumns?.join(', ') || 'No especificado'}
   2. Agregar una nueva entidad
      a. Detallar cada uno de los datos de la entidad: ${formData.entityFields?.map((f: any) => `${f.name} (${f.type}${f.length ? `, ${f.length}` : ''}${f.mandatory ? ', obligatorio' : ', opcional'})`).join(', ') || 'No especificado'}
      b. Cuando se agrega una entidad se debe registrar la fecha y el usuario de alta

5. FLUJOS ALTERNATIVOS (lista numerada con múltiples niveles):
   DEBE incluir OBLIGATORIAMENTE:
   1. Modificar o actualizar una entidad
      a. Detallar cada uno de los datos de la entidad
      b. Mostrar el identificador
      c. Mostrar la fecha y el usuario de alta
      d. Cuando se modifica una entidad se debe registrar la fecha y el usuario de modificación
   2. Eliminar una entidad
      a. Para eliminar una entidad se debe verificar que no tenga relaciones con otras entidades

6. REGLAS DE NEGOCIO: ${formData.businessRules || 'Detallar cada una de las reglas de negocio'}

7. REQUERIMIENTOS ESPECIALES: ${formData.specialRequirements || 'Detallar los requerimientos especiales'}

8. PRECONDICIONES: Usuario autenticado con permisos correspondientes

9. POSTCONDICIONES: Datos actualizados en base de datos con registro de auditoría

${formData.generateWireframes ? `
10. BOCETOS GRÁFICOS SIMPLIFICADOS DE INTERFAZ DE USUARIO:

WIREFRAME 1: Buscador de Entidades
- Debe incluir: Paginado, Botón de Buscar, Limpiar y Agregar
- Botón de editar y Eliminar en cada fila del resultado
- Funcionalidades:
  - Listar cada uno de los filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'filtros apropiados'}
  - Listar cada una de las columnas del resultado: ${formData.resultColumns?.join(', ') || 'columnas apropiadas'}
  - Indicar que debe paginar

WIREFRAME 2: Formulario para Agregar/Editar Entidad
- Debe incluir: Botón para Aceptar y Cancelar
- Campos de fecha y usuario de alta, fecha y usuario de modificación
- Funcionalidades:
  - Listar cada uno de los datos de la entidad indicando tipo de dato, si es obligatorio, longitud

FUNCIONALIDADES DETALLADAS:
- Validación en tiempo real de campos obligatorios
- Formato específico para cada tipo de dato
- Mensajes de error contextuales
- Navegación entre campos con Tab
` : ''}

11. HISTORIA DE REVISIONES Y APROBACIONES (OBLIGATORIA):
- Título "HISTORIA DE REVISIONES Y APROBACIONES" como Heading 1, color azul RGB(0,112,192)
- Tabla con 2 filas y 4 columnas: Fecha, Acción, Responsable, Comentario
- Títulos en negrita y centrados, datos alineados a la izquierda
- Bordes grises uniformes
- Una fila de datos: fecha actual (${today}), "Versión original", "Sistema", "Documento generado automáticamente"

FORMATO HTML CRÍTICO:
- Font Segoe UI Semilight para todo el documento
- Interlineado simple
- Títulos principales en azul oscuro RGB(0,112,192)
- Listas numeradas multinivel: 1º nivel números (1,2,3), 2º nivel letras (a,b,c), 3º nivel romanos (i,ii,iii)
- Usar estilos inline para mantener formato Microsoft
- El nombre del caso de uso debe comenzar con verbo en infinitivo`;
  }
  
  if (useCaseType === 'api') {
    return `
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE API/WEB SERVICE:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Endpoint: ${formData.apiEndpoint || 'No especificado'}
- Formato Request: ${formData.requestFormat || 'No especificado'}
- Formato Response: ${formData.responseFormat || 'No especificado'}
- Reglas de negocio: ${formData.businessRules || 'No especificado'}
- Requerimientos especiales: ${formData.specialRequirements || 'No especificado'}

ESTRUCTURA OBLIGATORIA:

1. FLUJO PRINCIPAL DE EVENTOS
   1. Identificación del servicio
      a. Endpoint: ${formData.apiEndpoint || 'Definir endpoint apropiado'}
      b. Método HTTP: GET/POST/PUT/DELETE
      c. Headers requeridos
   2. Request
      a. Formato: ${formData.requestFormat || 'Definir formato JSON apropiado'}
      b. Parámetros obligatorios
      c. Parámetros opcionales
   3. Response
      a. Formato: ${formData.responseFormat || 'Definir formato JSON apropiado'}
      b. Códigos de estado exitosos
      c. Estructura de datos de respuesta

2. FLUJOS ALTERNATIVOS
   1. Errores de validación (400)
      a. Request malformado
      b. Parámetros faltantes
      c. Tipos de datos incorrectos
   2. Errores de autorización (401/403)
      a. Token inválido
      b. Permisos insuficientes
   3. Errores del servidor (500)
      a. Error interno del sistema
      b. Timeout de conexión
      c. Servicio no disponible`;
  }
  
  if (useCaseType === 'service') {
    return `
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE SERVICIO/PROCESO AUTOMÁTICO:

DATOS DEL FORMULARIO:
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Frecuencia: ${formData.serviceFrequency || 'No especificado'}
- Hora de ejecución: ${formData.executionTime || 'No especificado'}
- Rutas configurables: ${formData.configurationPaths || 'No especificado'}
- Credenciales de servicios: ${formData.webServiceCredentials || 'No especificado'}
- Reglas de negocio: ${formData.businessRules || 'No especificado'}
- Requerimientos especiales: ${formData.specialRequirements || 'No especificado'}

ESTRUCTURA OBLIGATORIA:

1. FLUJO PRINCIPAL DE EVENTOS
   1. Programación de ejecución
      a. Frecuencia: ${formData.serviceFrequency || 'Definir frecuencia apropiada'}
      b. Hora específica: ${formData.executionTime || 'Definir horario apropiado'}
      c. Configuración de horarios múltiples si aplica
   2. Proceso de ejecución
      a. Inicialización del servicio
      b. Validación de configuraciones
      c. Ejecución de la lógica principal
   3. Finalización y logging
      a. Registro de resultados
      b. Notificación de completitud
      c. Limpieza de recursos temporales

2. FLUJOS ALTERNATIVOS
   1. Errores de configuración
      a. Archivos no encontrados
      b. Permisos insuficientes
      c. Configuraciones inválidas
   2. Errores de conectividad
      a. Servicios externos no disponibles
      b. Timeout de conexiones
      c. Fallos de autenticación

${formData.configurationPaths ? `
3. CONFIGURACIONES REQUERIDAS
- Rutas de archivos: ${formData.configurationPaths}
- Las rutas deben ser configurables vía archivo de configuración
- Validación de existencia y permisos al inicio
` : ''}

${formData.webServiceCredentials ? `
3. CREDENCIALES DE SERVICIOS
- Configuración: ${formData.webServiceCredentials}
- Usuario, clave y URL deben ser configurables
- Almacenamiento seguro de credenciales
` : ''}`;
  }
  
  return '';
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate use case
  app.post("/api/use-cases/generate", async (req, res) => {
    try {
      // Transform arrays to strings if needed for businessRules and specialRequirements
      const requestData = {
        ...req.body,
        businessRules: Array.isArray(req.body.businessRules) 
          ? req.body.businessRules.join('\n') 
          : req.body.businessRules,
        specialRequirements: Array.isArray(req.body.specialRequirements) 
          ? req.body.specialRequirements.join('\n') 
          : req.body.specialRequirements
      };
      
      const validatedData = useCaseFormSchema.parse(requestData);
      
      // Create specific rules based on use case type
      const specificRules = getSpecificRules(validatedData.useCaseType, validatedData);
      
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

      // ✨ CRITICAL FIX: Build complete document with test cases BEFORE applying cleaning/styling
      let completeRawContent = response.content;
      
      if (validatedData.generateTestCase && (validatedData.testSteps?.length > 0 || validatedData.testCaseObjective || validatedData.testCasePreconditions)) {
        console.log('Adding test cases to generated document...');
        
        // Build test cases section HTML
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
                  <th style="border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;">Acción</th>
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
                <td style="border: 1px solid #666; padding: 8px;">${step.action || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.inputData || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.expectedResult || ''}</td>
                <td style="border: 1px solid #666; padding: 8px;">${step.observations || ''}</td>
              </tr>
            `;
          });

          testCaseSection += `
              </tbody>
            </table>
          `;
        }

        // Combine BEFORE any cleaning/styling
        completeRawContent = response.content + testCaseSection;
        console.log('Test cases successfully added to raw content');
      }

      // ✨ NOW apply cleaning and styling to the UNIFIED document (including test cases)
      const finalContent = AIService.cleanAIResponse(completeRawContent);

      // Save to storage
      const insertData = insertUseCaseSchema.parse({
        ...validatedData,
        generatedContent: finalContent,
        searchFilters: validatedData.searchFilters,
        resultColumns: validatedData.resultColumns,
        entityFields: validatedData.entityFields,
      });

      const useCase = await storage.createUseCase(insertData);

      res.json({
        useCase,
        content: finalContent
      });
    } catch (error) {
      console.error("Error generating use case:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Error de validación"
      });
    }
  });

  // Edit use case
  app.post("/api/use-cases/:id/edit", async (req, res) => {
    try {
      const { id } = req.params;
      const { instructions, aiModel } = req.body;

      const useCase = await storage.getUseCase(id);
      if (!useCase) {
        return res.status(404).json({ message: "Caso de uso no encontrado" });
      }

      const response = await AIService.editUseCase(
        useCase.generatedContent || '',
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

  // AI Assist for individual fields
  app.post("/api/ai-assist", async (req, res) => {
    try {
      const { fieldName, fieldValue, fieldType, context, aiModel } = req.body;
      
      if (!fieldName || !fieldType) {
        return res.status(400).json({ error: 'Field name and type are required' });
      }

      const improvedValue = await AIService.improveField(fieldName, fieldValue, fieldType, context, aiModel);
      
      res.json({ improvedValue });
    } catch (error) {
      console.error('Error with AI assist:', error);
      res.status(500).json({ error: 'Error processing field with AI' });
    }
  });

  // Minute Analysis endpoint
  app.post("/api/analyze-minute", async (req, res) => {
    try {
      const { minuteContent, useCaseType, aiModel = 'demo', fileName } = req.body;
      
      if (!minuteContent && !fileName) {
        return res.status(400).json({ 
          error: 'Se requiere contenido de minuta o archivo',
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
      
      res.json({
        success: true,
        formData: analysisResult
      });
    } catch (error) {
      console.error('Error analyzing minute:', error);
      res.status(500).json({ 
        error: 'Failed to analyze minute',
        success: false,
        formData: {},
        aiGeneratedFields: {}
      });
    }
  });

  // NEW: Direct DOCX export endpoint for locally generated content
  app.post("/api/export-docx", async (req, res) => {
    try {
      const { content, fileName, useCaseName, formData } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required for DOCX export" });
      }

      const docxBuffer = await DocumentService.generateDocx(
        content,
        fileName || 'caso-de-uso',
        useCaseName || 'Caso de Uso',
        formData || null
      );

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName || 'caso-de-uso'}.docx"`
      });

      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error generando documento DOCX"
      });
    }
  });

  // Legacy: Export use case to docx (kept for backward compatibility)
  app.get("/api/use-cases/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      
      const useCase = await storage.getUseCase(id);
      if (!useCase) {
        return res.status(404).json({ message: "Caso de uso no encontrado" });
      }

      const docxBuffer = await DocumentService.generateDocx(
        useCase.generatedContent || '',
        useCase.fileName || 'caso-de-uso',
        useCase.useCaseName || '',
        useCase.formData || null
      );

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${useCase.fileName}.docx"`,
        'Content-Length': docxBuffer.length
      });

      res.send(docxBuffer);
    } catch (error) {
      console.error("Error exporting use case:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error exportando el documento"
      });
    }
  });

  // Get all use cases
  app.get("/api/use-cases", async (req, res) => {
    try {
      const useCases = await storage.getUserUseCases();
      res.json(useCases);
    } catch (error) {
      console.error("Error fetching use cases:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error obteniendo casos de uso"
      });
    }
  });

  // Get specific use case
  app.get("/api/use-cases/:id", async (req, res) => {
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

  // Intelligent Test Case Generation endpoint
  app.post("/api/generate-intelligent-tests", async (req, res) => {
    try {
      const { formData, aiModel = 'demo' } = req.body;
      
      if (!formData) {
        return res.status(400).json({ 
          error: 'Form data is required',
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
      console.error('Error generating intelligent test cases:', error);
      res.status(500).json({ 
        error: 'Failed to generate intelligent test cases',
        success: false
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
