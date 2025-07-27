import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Filter, Grid, Layout } from "lucide-react";

interface WireframePreviewProps {
  useCaseType: string;
  entityName?: string;
  showWireframe: boolean;
}

export default function WireframePreview({ useCaseType, entityName = "Entidad", showWireframe }: WireframePreviewProps) {
  if (!showWireframe) return null;

  const renderEntityWireframe = () => (
    <div className="space-y-4">
      {/* Search Section */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Búsqueda de {entityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                <span className="text-xs text-gray-500">Campo de búsqueda</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                <Filter className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-xs text-gray-500">Filtro</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button size="sm" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Resultados de Búsqueda
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-3 pb-2 border-b border-gray-300 dark:border-gray-600">
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded w-16"></div>
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded w-20"></div>
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded w-14"></div>
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded w-12"></div>
            </div>
            
            {/* Table Rows */}
            {[1, 2, 3].map((row) => (
              <div key={row} className="grid grid-cols-4 gap-3 py-2 items-center">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="flex gap-1">
                  <div className="w-6 h-6 bg-blue-200 dark:bg-blue-800 rounded flex items-center justify-center">
                    <Edit className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-6 h-6 bg-red-200 dark:bg-red-800 rounded flex items-center justify-center">
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Section */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Formulario de {entityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((field) => (
              <div key={field} className="space-y-2">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded"></div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="flex-1">Guardar</Button>
            <Button variant="outline" className="flex-1">Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApiWireframe = () => (
    <div className="space-y-4">
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Configuración de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                  <span className="text-xs text-gray-500">Endpoint URL</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                  <span className="text-xs text-gray-500">Método HTTP</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-20 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">Payload JSON</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Respuesta de la API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">Respuesta JSON</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomatedWireframe = () => (
    <div className="space-y-4">
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cog className="w-4 h-4" />
            Configuración del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                <span className="text-xs text-gray-500">Frecuencia</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-8 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center px-3">
                <span className="text-xs text-gray-500">Hora ejecución</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Monitor de Ejecución</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((log) => (
              <div key={log} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded border">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Card className="mt-6 border-2 border-dashed border-blue-300 dark:border-blue-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Layout className="w-5 h-5" />
          Vista Previa del Wireframe - {useCaseType === 'entity' ? 'Gestión de Entidades' : useCaseType === 'api' ? 'Integración API' : 'Proceso Automático'}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Representación visual de bajo nivel de los componentes que incluirá el caso de uso
        </p>
      </CardHeader>
      <CardContent>
        {useCaseType === 'entity' && renderEntityWireframe()}
        {useCaseType === 'api' && renderApiWireframe()}
        {useCaseType === 'automated' && renderAutomatedWireframe()}
      </CardContent>
    </Card>
  );
}