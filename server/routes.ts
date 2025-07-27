import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUseCaseSchema, useCaseFormSchema } from "@shared/schema";
import { AIService } from "./services/ai-service";
import { DocumentService } from "./services/document-service";

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
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE ENTIDAD:

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

ESTRUCTURA OBLIGATORIA CON LISTAS MULTINIVEL:

1. FLUJO PRINCIPAL DE EVENTOS
   1. Buscar datos de la entidad
      a. Filtros disponibles: ${formData.searchFilters?.join(', ') || 'Definir filtros apropiados'}
      b. Columnas del resultado: ${formData.resultColumns?.join(', ') || 'Definir columnas apropiadas'}
      c. Implementar paginación de resultados
   2. Agregar una nueva entidad
      a. Campos de entrada: ${formData.entityFields?.map((f: any) => f.name).join(', ') || 'Definir campos apropiados'}
      b. Validación de campos obligatorios
      c. Registro automático de fecha y usuario de alta

2. FLUJOS ALTERNATIVOS
   1. Modificar o actualizar una entidad
      a. Mostrar todos los campos editables
      b. Mostrar identificador único de la entidad
      c. Mostrar fecha y usuario de alta (solo lectura)
      d. Registro automático de fecha y usuario de modificación
   2. Eliminar una entidad
      a. Verificar integridad referencial
      b. Confirmar eliminación con el usuario
      c. Eliminación lógica o física según reglas del negocio

${formData.generateWireframes ? `
3. BOCETOS GRÁFICOS DE INTERFACES

WIREFRAME 1: Buscador de Entidades
- Sección de filtros: ${formData.searchFilters?.join(', ') || 'campos de filtrado'}
- Botones: Buscar, Limpiar, Agregar
- Tabla de resultados con columnas: ${formData.resultColumns?.join(', ') || 'columnas apropiadas'}
- Paginación inferior
- Botones por fila: Editar, Eliminar

WIREFRAME 2: Formulario de Entidad
- Campos de entrada: ${formData.entityFields?.map((f: any) => `${f.name} (${f.mandatory ? 'obligatorio' : 'opcional'})`).join(', ') || 'campos apropiados'}
- Campos automáticos: Fecha y usuario de alta, Fecha y usuario de modificación
- Botones: Aceptar, Cancelar

FUNCIONALIDADES DETALLADAS:
- Validación en tiempo real de campos obligatorios
- Formato específico para cada tipo de dato
- Mensajes de error contextuales
- Navegación entre campos con Tab
` : ''}`;
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
      const validatedData = useCaseFormSchema.parse(req.body);
      
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

      // Save to storage
      const insertData = insertUseCaseSchema.parse({
        ...validatedData,
        generatedContent: response.content,
        searchFilters: validatedData.searchFilters,
        resultColumns: validatedData.resultColumns,
        entityFields: validatedData.entityFields,
      });

      const useCase = await storage.createUseCase(insertData);

      res.json({
        useCase,
        content: response.content
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

  // Export use case to docx
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
        useCase.useCaseName || ''
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

  const httpServer = createServer(app);
  return httpServer;
}
