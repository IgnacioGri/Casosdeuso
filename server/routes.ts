import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUseCaseSchema, useCaseFormSchema } from "@shared/schema";
import { AIService } from "./services/ai-service";
import { DocumentService } from "./services/document-service";

const USE_CASE_RULES = `
Al elaborar un caso de uso de una entidad considerar:

Deben tener el estilo y formato Microsoft e interlineado simple

Los casos de uso deben contener las siguientes secciones:
- Titulo: debe ser igual al nombre del caso de uso en mayúscula
- Nombre del cliente
- Nombre del proyecto
- Nombre del caso de uso
- Descripción: explicación detallada del alcance del objetivo del caso de uso

Flujo principal de eventos que debe mostrarse como una lista indentada con sangrías e incluir solo las siguientes funcionalidades:
- Buscar datos de la entidad
- Detallar los filtros de la búsqueda de la entidad
- Detallar las columnas del resultado de la búsqueda de la entidad
- Agregar una nueva entidad
- Detallar cada uno de los datos de la entidad
- Cuando se agrega una entidad se debe registrar la fecha y el usuario de alta

Flujos alternativos que mostrarse como una lista indentada con sangrías e debe incluir las siguientes funcionalidades:
- Modificar o actualizar una entidad
- Detallar cada uno de los datos de la entidad
- Mostrar el identificador
- Mostrar la fecha y el usuario de alta
- Cuando se modifica una entidad se debe registrar la fecha y el usuario de modificación
- Eliminar una entidad
- Para eliminar una entidad se debe verificar que no tenga relaciones con otras entidades

Reglas de negocio: Detallar cada una de las reglas de negocio
Requerimientos especiales: Detallar los requerimientos especiales
Precondiciones
Postcondiciones

El flujo principal y los alternativos deben estar numerados con una lista de múltiples niveles de formato, el primer nivel ordena con número empezando de 1, el segundo nivel ordena con letras empezando con a indentando 0.2 a la derecha y el tercer nivel ordena con números romanos empezando con i indentando 0.2 a la derecha

El nombre del caso de uso debe comenzar con un verbo en infinitivo

Para todo el documento considerar Font Segoe UI Semilight
El interlineado es simple
El espaciado es simple
El título debe ser azul oscuros con código red=0, green=112 y blue=192
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
