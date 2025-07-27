import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Code, Cog, Search, Table, FileText, Zap } from "lucide-react";

interface UseCaseTemplatePreviewProps {
  selectedType: string;
  onTypeSelect?: (type: string) => void;
}

const templates = {
  entity: {
    title: "Gestión de Entidades",
    description: "Para operaciones CRUD (Crear, Leer, Actualizar, Eliminar) con entidades del sistema",
    icon: Database,
    color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
    sections: [
      { name: "Búsqueda con filtros", icon: Search },
      { name: "Tabla de resultados", icon: Table },
      { name: "Formulario de entidad", icon: FileText },
      { name: "Validaciones de campo", icon: Cog }
    ],
    examples: [
      "Gestionar Usuarios del Sistema",
      "Administrar Productos del Catálogo", 
      "Mantener Clientes Corporativos"
    ]
  },
  api: {
    title: "Integración con API",
    description: "Para casos que requieren comunicación con servicios web externos",
    icon: Code,
    color: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
    sections: [
      { name: "Configuración endpoint", icon: Code },
      { name: "Formato de petición", icon: FileText },
      { name: "Procesamiento respuesta", icon: Cog },
      { name: "Manejo de errores", icon: Zap }
    ],
    examples: [
      "Consultar Datos Bancarios Externos",
      "Validar Identidad con RENIEC",
      "Sincronizar con Sistema ERP"
    ]
  },
  automated: {
    title: "Proceso Automático",
    description: "Para servicios que se ejecutan de forma programada o por eventos",
    icon: Zap,
    color: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400",
    sections: [
      { name: "Configuración servicio", icon: Cog },
      { name: "Parámetros ejecución", icon: FileText },
      { name: "Logs y monitoreo", icon: Table },
      { name: "Notificaciones", icon: Zap }
    ],
    examples: [
      "Generar Reportes Diarios Automáticos",
      "Procesar Transacciones Nocturnas",
      "Enviar Notificaciones Programadas"
    ]
  }
};

export default function UseCaseTemplatePreview({ selectedType, onTypeSelect }: UseCaseTemplatePreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Object.entries(templates).map(([type, template]) => {
        const Icon = template.icon;
        const isSelected = selectedType === type;
        
        return (
          <Card
            key={type}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                : 'hover:shadow-md hover:scale-102'
            }`}
            onClick={() => onTypeSelect?.(type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${template.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected && <Badge>Seleccionado</Badge>}
              </div>
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Componentes incluidos:
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {template.sections.map((section, index) => {
                      const SectionIcon = section.icon;
                      return (
                        <div key={index} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <SectionIcon className="w-3 h-3" />
                          <span>{section.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ejemplos típicos:
                  </h4>
                  <ul className="space-y-1">
                    {template.examples.slice(0, 2).map((example, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}