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
          title: "Tipo de Caso de Uso",
          description: "Selecciona el tipo de caso de uso que deseas generar según las normas ING.",
          instructions: [
            "ENTIDAD: Para casos que gestionan datos (ABM/CRUD)",
            "API: Para casos que exponen servicios web o integran sistemas externos",
            "SERVICIO/PROCESO: Para casos que implementan flujos de negocio automáticos",
            "Cada tipo genera campos específicos en los pasos siguientes",
            "La elección determina la estructura completa del documento"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "Este paso no tiene AI Assist porque la selección del tipo es una decisión arquitectónica.",
            usage: []
          }
        };

      case 2:
        return {
          title: "Análisis Inteligente de Minutas",
          description: "Carga una minuta de reunión o documento para que la IA extraiga automáticamente la información y complete el formulario.",
          instructions: [
            "Pega el texto de la minuta o documento en el área de texto",
            "La IA identificará cliente, proyecto, código y requisitos automáticamente",
            "Puedes cargar un ejemplo completo con el botón 'Cargar Minuta Demo'",
            "El análisis toma aproximadamente 10-30 segundos",
            "Todos los campos se completarán basándose en el contenido analizado"
          ],
          aiAssistInfo: {
            available: false,
            explanation: "Este paso usa IA para analizar el documento completo, no requiere AI Assist individual.",
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
        if (useCaseType === 'entity') {
          return {
            title: "Filtros de Búsqueda",
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
        } else {
          return {
            title: "Detalles Técnicos",
            description: "Define los aspectos técnicos específicos de tu API o servicio.",
            instructions: [
              "Para APIs: Especifica métodos HTTP, endpoints, formatos de datos",
              "Para Servicios: Define parámetros de entrada, salida y procesamiento",
              "Incluye detalles de autenticación y autorización",
              "Describe formatos de respuesta y códigos de error",
              "Especifica timeouts y límites de procesamiento"
            ],
            aiAssistInfo: {
              available: true,
              explanation: "AI Assist mejora las descripciones técnicas con terminología profesional.",
              usage: [
                "Describe tus requerimientos técnicos en lenguaje simple",
                "Presiona AI Assist para obtener formato técnico profesional",
                "El AI agregará especificaciones técnicas estándar",
                "Aplicará convenciones REST o SOAP según corresponda"
              ]
            }
          };
        }

      case 6:
        if (useCaseType === 'entity') {
          return {
            title: "Columnas de Resultado",
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
        } else {
          return {
            title: "Reglas de Negocio",
            description: "Define las validaciones y lógica de negocio para tu API o servicio.",
            instructions: [
              "Lista todas las validaciones que debe cumplir el servicio",
              "Incluye restricciones de negocio y límites operativos",
              "Define comportamientos ante errores o excepciones",
              "Especifica reglas de autorización y permisos",
              "Documenta dependencias con otros sistemas"
            ],
            aiAssistInfo: {
              available: true,
              explanation: "AI Assist estructura las reglas con formato profesional y numeración.",
              usage: [
                "Describe cada regla en lenguaje simple",
                "Presiona AI Assist para obtener formato técnico",
                "El AI agregará numeración jerárquica",
                "Aplicará terminología técnica apropiada"
              ]
            }
          };
        }

      case 7:
        if (useCaseType === 'entity') {
          return {
            title: "Campos de la Entidad",
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
        } else {
          return {
            title: "Casos de Prueba",
            description: "Define casos de prueba para validar tu API o servicio.",
            instructions: [
              "Objetivo: Describe qué se pretende validar",
              "Precondiciones: Requisitos previos para las pruebas",
              "Define casos de prueba positivos y negativos",
              "Incluye pruebas de límites y excepciones",
              "Especifica datos de entrada y salida esperada"
            ],
            aiAssistInfo: {
              available: true,
              explanation: "AI Assist genera casos de prueba profesionales y completos.",
              usage: [
                "Describe qué quieres probar en lenguaje simple",
                "Presiona 'Generar Casos de Prueba Inteligentes'",
                "El AI creará casos de prueba estructurados",
                "Incluirá escenarios positivos y negativos",
                "Agregará datos de prueba realistas"
              ]
            }
          };
        }

      case 8:
        if (useCaseType === 'entity') {
          return {
            title: "Reglas de Negocio y Detalles Adicionales",
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
        } else {
          return {
            title: "Revisión Final",
            description: "Revisa todos los datos antes de generar el documento.",
            instructions: [
              "Verifica que todos los campos obligatorios estén completos",
              "Revisa que la información sea coherente y profesional",
              "Confirma que el tipo de caso de uso sea el correcto",
              "Puedes volver a pasos anteriores si necesitas cambios",
              "El documento seguirá el formato ING automáticamente"
            ],
            aiAssistInfo: {
              available: false,
              explanation: "Este es el paso de revisión final antes de generar el documento.",
              usage: []
            }
          };
        }

      case 9:  
        if (useCaseType === 'entity') {
          return {
            title: "Decisión sobre Casos de Prueba",
            description: "Decide si deseas generar casos de prueba para validar el funcionamiento del caso de uso.",
            instructions: [
              "Selecciona 'Sí' para incluir casos de prueba en el documento",
              "Selecciona 'No' para ir directamente a la generación del documento",
              "Los casos de prueba agregan valor al documento final",
              "Recomendado incluirlos para casos de uso críticos",
              "Si eliges 'Sí', pasarás al paso de definición de casos de prueba"
            ],
            aiAssistInfo: {
              available: false,
              explanation: "Este paso es una decisión simple, no requiere asistencia de IA.",
              usage: []
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
          title: "Casos de Prueba",
          description: "Define casos de prueba según especificaciones de la minuta ING para validar el funcionamiento del caso de uso.",
          instructions: [
            "Objetivo: Describe qué se pretende validar con las pruebas",
            "Precondiciones: Lista los requisitos previos para ejecutar las pruebas",
            "Pasos de Prueba: Crea una tabla estructurada con cada acción",
            "Cada paso debe tener: Acción, Datos de entrada, Resultado esperado, Observaciones, Estado P/F",
            "Usa el botón 'Generar con IA' para crear casos completos automáticamente"
          ],
          aiAssistInfo: {
            available: true,
            explanation: "AI Assist genera casos de prueba completos y profesionales automáticamente.",
            usage: [
              "Completa objetivo y precondiciones con información básica",
              "Presiona 'Generar con IA'",
              "El AI creará múltiples casos de prueba realistas",
              "Incluirá flujos principales y alternativos",
              "Agregará datos de prueba específicos del contexto"
            ]
          }
        };

      case 11:
        return {
          title: "Revisión Final y Generación",
          description: "Revisa toda la información ingresada y genera el documento de caso de uso final.",
          instructions: [
            "Verifica que todos los campos estén completos y correctos",
            "Revisa que la información sea coherente y profesional",
            "El documento seguirá automáticamente el formato de la minuta ING vr19",
            "Se incluirá numeración multi-nivel, colores corporativos y tipografía Segoe UI",
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