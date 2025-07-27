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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate use case
  app.post("/api/use-cases/generate", async (req, res) => {
    try {
      const validatedData = useCaseFormSchema.parse(req.body);
      
      const response = await AIService.generateUseCase({
        aiModel: validatedData.aiModel,
        formData: validatedData,
        rules: USE_CASE_RULES
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
        useCase.fileName
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
