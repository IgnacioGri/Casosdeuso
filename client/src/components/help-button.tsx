import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UseCaseType } from "@/types/use-case";

interface HelpButtonProps {
  step: number;
  useCaseType?: UseCaseType;
}

interface StepHelpContent {
  title: string;
  description: string;
  instructions: string[];
  aiAssistInfo?: {
    available: boolean;
    explanation: string;
    usage: string[];
  };
}

export function HelpButton({ step, useCaseType }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getHelpContent = (): StepHelpContent => {
    switch (step) {
      case 1:
        return {
          title: "Configuración del Motor de IA",
          description: "En este paso seleccionas qué modelo de inteligencia artificial te ayudará a mejorar los campos del formulario.",
          instructions: [
            "Elige el modelo que tengas disponible con API keys configuradas",
            "Si no tienes API keys, usa 'Modo Demo' - funciona perfectamente",
            "OpenAI GPT-4: Recomendado para mejores resultados profesionales",
            "Claude: Excelente para análisis detallado y contexto",
            "Gemini: Multimodal con buena capacidad de estructuración",
            "Grok: Rápido y eficiente para mejoras directas"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "Este paso no tiene AI Assist porque aquí configuras el modelo que se usará en los siguientes pasos.",
            usage: []
          }
        };

      case 2:
        return {
          title: "Selección del Tipo de Caso de Uso",
          description: "Según las normas ING, debes elegir el tipo correcto para que el documento siga la estructura apropiada.",
          instructions: [
            "ENTIDAD: Para casos que gestionan datos (alta, baja, modificación, consulta)",
            "API: Para casos que exponen servicios web o integran sistemas externos",
            "PROCESO: Para casos que implementan flujos de negocio o validaciones",
            "Cada tipo genera campos específicos en los pasos siguientes",
            "La elección determina la estructura del documento final"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "Este paso no tiene AI Assist porque la selección del tipo debe ser una decisión técnica del usuario.",
            usage: []
          }
        };

      case 3:
        return {
          title: "Información Básica del Proyecto",
          description: "Completa los datos identificatorios según las normas de documentación ING.",
          instructions: [
            "Nombre del Cliente: Usa el nombre oficial completo (ej: 'Banco Provincia')",
            "Nombre del Proyecto: Debe ser descriptivo y profesional",
            "Código del Caso de Uso: Formato recomendado: 2 letras + 3 números (ej: 'UC001', 'BP005')",
            "Todos los campos son obligatorios para cumplir con la minuta ING",
            "Los nombres deben ser profesionales y estar en español"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "Estos campos son datos específicos de tu proyecto que debes completar manualmente.",
            usage: []
          }
        };

      case 4:
        return {
          title: "Detalles del Caso de Uso",
          description: "Define el nombre específico y la descripción detallada del caso de uso.",
          instructions: [
            "Nombre del Caso de Uso: Debe empezar con verbo infinitivo (ej: 'Gestionar', 'Crear', 'Consultar')",
            "Nombre del Archivo: Formato ING obligatorio: 2 letras + 3 números + nombre descriptivo",
            "Descripción: Explica qué hace el caso de uso, su alcance y objetivo principal",
            "La descripción debe ser técnica pero comprensible",
            "Incluye el contexto de negocio y los beneficios esperados"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist está disponible solo para el campo de descripción.",
            usage: [
              "Escribe una descripción básica de tu caso de uso",
              "Presiona el botón AI Assist junto al campo descripción",
              "El AI mejorará tu texto haciéndolo más profesional y completo",
              "Seguirá las normas ING de redacción técnica",
              "Agregará contexto bancario y estructura profesional"
            ]
          }
        };

      case 5:
        return {
          title: "Filtros de Búsqueda (Solo Entidades)",
          description: "Define los criterios de búsqueda que tendrá tu sistema según las normas ING para interfaces de consulta.",
          instructions: [
            "Los filtros permiten a los usuarios buscar registros específicos",
            "Incluye filtros básicos: nombre, código, estado, fechas",
            "Para entidades de personas: DNI, email, teléfono son estándar",
            "Piensa en los criterios que más usa el negocio para buscar",
            "Puedes describir en texto libre y usar AI Assist para estructurar"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist convierte texto libre en filtros estructurados automáticamente.",
            usage: [
              "Describe en el área superior: 'Los usuarios buscarán por nombre, DNI y estado'",
              "Presiona el botón AI Assist para convertir automáticamente en filtros individuales",
              "El AI seguirá estándares bancarios para nombres de filtros",
              "Generará una lista completa de filtros profesionales y técnicamente correctos",
              "Luego puedes editar manualmente cada filtro si necesitas ajustes"
            ]
          }
        };

      case 6:
        return {
          title: "Columnas de Resultado (Solo Entidades)",
          description: "Define qué información se mostrará en las tablas de resultados según estándares ING de presentación de datos.",
          instructions: [
            "Las columnas muestran la información más relevante de cada registro",
            "Incluye siempre: código/ID, nombre principal, estado, fecha de alta",
            "Para personas: nombre completo, DNI, email, teléfono",
            "Ordena por importancia: datos identificatorios primero",
            "Máximo 8-10 columnas para no sobrecargar la pantalla"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist transforma descripciones en columnas estructuradas con formato profesional.",
            usage: [
              "Describe en texto: 'Mostrar nombre completo, DNI, email y estado del cliente'",
              "Presiona AI Assist para convertir en columnas automáticamente",
              "El AI creará nombres técnicos apropiados para cada columna",
              "Seguirá convenciones ING para etiquetas de interfaz",
              "Agregará columnas estándar si faltan (estado, fechas)"
            ]
          }
        };

      case 7:
        return {
          title: "Campos de la Entidad (Solo Entidades)",
          description: "Define todos los atributos que tendrá tu entidad de datos según normativas ING de modelado.",
          instructions: [
            "Lista todos los campos que almacenará la entidad en base de datos",
            "Especifica tipo de dato: texto, número, fecha, booleano",
            "Marca como obligatorios los campos críticos para el negocio",
            "ING requiere siempre: fechaAlta, usuarioAlta, fechaModificacion, usuarioModificacion",
            "Estos campos de auditoría se agregan automáticamente"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist convierte descripciones en campos JSON estructurados y agrega campos ING automáticamente.",
            usage: [
              "Describe campos en lenguaje natural: 'nombre completo texto obligatorio, edad número opcional'",
              "Presiona AI Assist para generar campos estructurados automáticamente",
              "El AI agregará automáticamente los 4 campos obligatorios ING de auditoría",
              "Interpretará tipos de datos y obligatoriedad de tu descripción",
              "Generará nombres técnicos apropiados para base de datos"
            ]
          }
        };

      case 8:
        return {
          title: "Información Adicional del Caso de Uso",
          description: "Completa los detalles técnicos y de negocio según la estructura completa de la minuta ING.",
          instructions: [
            "Descripciones de Wireframes: Explica cómo se verán las pantallas",
            "Flujos Alternativos: Describe qué pasa cuando algo sale mal",
            "Reglas de Negocio: Lista las validaciones y restricciones",
            "Requerimientos Especiales: Incluye integraciones, seguridad, performance",
            "Usa lenguaje técnico pero comprensible"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist está disponible para cada campo principal para mejorar contenido y crear listas numeradas profesionales.",
            usage: [
              "Describe en texto simple tu requerimiento o regla en cada campo",
              "Presiona AI Assist para obtener formato profesional ING",
              "El AI creará numeración multi-nivel (1, a, i) automáticamente",
              "Agregará sub-elementos técnicos relevantes",
              "Aplicará terminología bancaria y estándares profesionales",
              "Cada campo tiene reglas específicas de mejora según su tipo"
            ]
          }
        };

      case 9:  
        // Could be test cases step or final review depending on configuration
        if (useCaseType === 'entity') {
          return {
            title: "Casos de Prueba (Opcional)",
            description: "Define casos de prueba según especificaciones de la minuta ING para validar el funcionamiento del caso de uso.",
            instructions: [
              "Objetivo: Describe qué se pretende validar con las pruebas",
              "Precondiciones: Lista los requisitos previos para ejecutar las pruebas",
              "Pasos de Prueba: Crea una tabla estructurada con cada acción",
              "Cada paso debe tener: Acción, Datos de entrada, Resultado esperado, Observaciones, Estado P/F",
              "Sigue el formato exacto de la minuta ING líneas 271-300"
            ],
            aiAssistInfo: {
              available: true,
              explanation: "AI Assist mejora el contenido de objetivos y precondiciones con terminología técnica profesional.",
              usage: [
                "Describe en lenguaje simple qué quieres probar",
                "Presiona AI Assist para obtener formato técnico profesional",
                "El AI aplicará terminología de testing y estándares bancarios",
                "Convierte descripciones informales en especificaciones técnicas"
              ]
            }
          };
        } else {
          return {
            title: "Generación del Documento Final",
            description: "Crea el documento de caso de uso con formato profesional ING para entregar al cliente.",
            instructions: [
              "Revisa que todos los campos estén completos antes de generar",
              "El documento seguirá automáticamente el formato de la minuta ING vr19",
              "Incluirá numeración multi-nivel, colores corporativos y tipografía Segoe UI",
              "Se agregará automáticamente la tabla de 'Historia de Revisiones'",
              "Puedes exportar en formato HTML (para web) o DOCX (para Word)"
            ],
            aiAssistInfo: {
              available: false,
              explanation: "En este paso NO se usa AI. El documento se genera aplicando solo formato y estructura ING sin procesamiento de inteligencia artificial.",
              usage: []
            }
          };
        }

      case 10:
        return {
          title: "Generación del Documento Final",
          description: "Crea el documento de caso de uso con formato profesional ING para entregar al cliente.",
          instructions: [
            "Revisa que todos los campos estén completos antes de generar",
            "El documento seguirá automáticamente el formato de la minuta ING vr19",
            "Incluirá numeración multi-nivel, colores corporativos y tipografía Segoe UI",
            "Se agregará automáticamente la tabla de 'Historia de Revisiones'",
            "Puedes exportar en formato HTML (para web) o DOCX (para Word)"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "En este paso NO se usa AI. El documento se genera aplicando solo formato y estructura ING sin procesamiento de inteligencia artificial.",
            usage: []
          }
        };

      default:
        return {
          title: "Ayuda",
          description: "Información de ayuda no disponible para este paso.",
          instructions: [],
          aiAssistInfo: {
            available: false,
            explanation: "",
            usage: []
          }
        };
    }
  };

  const helpContent = getHelpContent();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200 text-blue-600 hover:bg-blue-50 px-2"
        >
          <HelpCircle size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-900">
            Paso {step}: {helpContent.title}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            {helpContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Instrucciones principales */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">📋 Cómo completar este paso:</h4>
            <ul className="space-y-2">
              {helpContent.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Información sobre AI Assist */}
          {helpContent.aiAssistInfo && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                🤖 AI Assist en este paso:
              </h4>
              
              {helpContent.aiAssistInfo.available ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-800 font-medium mb-2">✅ Disponible</div>
                    <div className="text-green-700 text-sm">
                      {helpContent.aiAssistInfo.explanation}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Cómo usar AI Assist:</div>
                    <ol className="space-y-1">
                      {helpContent.aiAssistInfo.usage.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2 font-medium">{index + 1}.</span>
                          <span className="text-gray-700 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-600 font-medium mb-2">❌ No disponible</div>
                  <div className="text-gray-600 text-sm">
                    {helpContent.aiAssistInfo.explanation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nota sobre normas ING */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-900 font-medium mb-2">📖 Normas ING:</div>
            <div className="text-blue-800 text-sm">
              Todos los pasos siguen la minuta ING vr19 para generar documentación profesional 
              con formato corporativo, numeración multi-nivel y estructura técnica apropiada.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}