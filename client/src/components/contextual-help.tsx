import { useState } from "react";
import { HelpCircle, X, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContextualHelpProps {
  step: number;
  useCaseType: string;
}

const getHelpContent = (step: number, useCaseType: string) => {
  const helpData: Record<string, any> = {
    1: {
      title: "Información Básica del Proyecto",
      description: "Define los datos fundamentales de tu caso de uso",
      examples: [
        { label: "Cliente", value: "Banco Nacional de Crédito", type: "success" },
        { label: "Proyecto", value: "Sistema de Gestión Bancaria", type: "success" },
        { label: "Código", value: "SGBV2", type: "success" }
      ],
      tips: [
        "El código del proyecto debe ser corto pero descriptivo",
        "Usar nomenclatura consistente con otros proyectos del cliente"
      ],
      rules: []
    },
    2: {
      title: "Detalles del Caso de Uso",
      description: "Especifica el nombre y descripción del caso de uso",
      examples: [
        { label: "Nombre del caso", value: "Gestionar Usuarios del Sistema", type: "success" },
        { label: "Archivo", value: "AB123GestionarUsuarios", type: "success" },
        { label: "Mal nombre", value: "usuarios", type: "error" },
        { label: "Mal archivo", value: "gestionar-usuarios-123", type: "error" }
      ],
      tips: [
        "El nombre debe comenzar con un verbo en infinitivo",
        "Usar lenguaje claro y profesional"
      ],
      rules: [
        "Nombre del archivo: 2 letras + 3 números + nombre descriptivo",
        "Sin espacios, guiones ni caracteres especiales en el archivo",
        "El nombre debe empezar con verbo: Gestionar, Crear, Modificar, etc."
      ]
    },
    3: {
      title: "Reglas de Negocio",
      description: "Define las reglas y restricciones del sistema",
      examples: [
        { label: "Regla de validación", value: "El email debe ser único en el sistema", type: "success" },
        { label: "Regla de autorización", value: "Solo administradores pueden eliminar usuarios", type: "success" },
        { label: "Regla de proceso", value: "Toda modificación debe generar log de auditoría", type: "success" }
      ],
      tips: [
        "Ser específico sobre las validaciones",
        "Incluir casos excepcionales",
        "Definir permisos y restricciones"
      ],
      rules: [
        "Una regla por línea",
        "Usar lenguaje claro y sin ambigüedades",
        "Incluir validaciones de campos obligatorios"
      ]
    }
  };

  // Agregar contenido específico por tipo de caso de uso
  if (useCaseType === 'entity') {
    helpData[4] = {
      title: "Filtros de Búsqueda",
      description: "Define cómo los usuarios podrán filtrar la información",
      examples: [
        { label: "Filtro texto", value: "Nombre del usuario", type: "success" },
        { label: "Filtro fecha", value: "Fecha de registro", type: "success" },
        { label: "Filtro estado", value: "Estado (Activo/Inactivo)", type: "success" }
      ],
      tips: [
        "Incluir filtros más comunes para los usuarios",
        "Considerar rangos de fechas y listas desplegables"
      ]
    };

    helpData[5] = {
      title: "Columnas de Resultado",
      description: "Especifica qué información se mostrará en la tabla de resultados",
      examples: [
        { label: "Columna básica", value: "Nombre completo", type: "success" },
        { label: "Columna con acción", value: "Email (enlace mailto)", type: "success" },
        { label: "Columna estado", value: "Estado con indicador visual", type: "success" }
      ],
      tips: [
        "Incluir solo información relevante",
        "Considerar acciones como botones de editar/eliminar"
      ]
    };

    helpData[6] = {
      title: "Campos de la Entidad",
      description: "Define todos los campos que tendrá la entidad en el formulario",
      examples: [
        { label: "Campo texto", value: "nombre: text(50) - obligatorio", type: "success" },
        { label: "Campo email", value: "email: email(100) - obligatorio", type: "success" },
        { label: "Campo fecha", value: "fechaNacimiento: date - opcional", type: "success" }
      ],
      tips: [
        "Especificar longitud máxima para campos de texto",
        "Indicar claramente campos obligatorios",
        "Usar tipos de datos apropiados"
      ]
    };
  }

  return helpData[step] || {
    title: `Paso ${step}`,
    description: "Información del paso",
    examples: [],
    tips: [],
    rules: []
  };
};

export default function ContextualHelp({ step, useCaseType }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const helpContent = getHelpContent(step, useCaseType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <HelpCircle className="w-4 h-4" />
          ¿Cómo completar este paso?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            {helpContent.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            {helpContent.description}
          </p>

          {helpContent.rules && helpContent.rules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Reglas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {helpContent.rules.map((rule: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {helpContent.examples && helpContent.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ejemplos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {helpContent.examples.map((example: any, index: number) => (
                    <div key={index} className="flex items-start justify-between gap-4 p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{example.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {example.value}
                        </div>
                      </div>
                      <Badge variant={example.type === 'success' ? 'default' : 'destructive'}>
                        {example.type === 'success' ? '✓ Correcto' : '✗ Incorrecto'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {helpContent.tips && helpContent.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Consejos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {helpContent.tips.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}