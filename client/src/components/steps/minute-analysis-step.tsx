import { useState } from 'react';
import { Upload, FileText, Loader2, Brain, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UseCaseFormData } from '@/types/use-case';
import { HelpButton } from '@/components/help-button';

interface MinuteAnalysisStepProps {
  formData: UseCaseFormData;
  onFormChange: (updates: Partial<UseCaseFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MinuteAnalysisStep({ formData, onFormChange, onNext, onPrevious }: MinuteAnalysisStepProps) {
  const [minuteText, setMinuteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const analyzeMinuteMutation = useMutation({
    mutationFn: async (data: { text: string; useCaseType: string; aiModel: string }) => {
      const response = await apiRequest('POST', '/api/analyze-minute', {
        minuteContent: data.text,
        useCaseType: data.useCaseType,
        aiModel: data.aiModel
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Apply the analyzed data to the form
      onFormChange(data.formData);
      toast({
        title: "Análisis completado",
        description: "La minuta ha sido analizada y el formulario se ha completado automáticamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error en el análisis",
        description: error instanceof Error ? error.message : "Error analizando la minuta",
        variant: "destructive"
      });
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setMinuteText(text);
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Tipo de archivo no soportado",
          description: "Solo se admiten archivos de texto (.txt)",
          variant: "destructive"
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setMinuteText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (!minuteText.trim()) {
      toast({
        title: "Texto requerido",
        description: "Por favor ingresa o sube el texto de la minuta para analizar",
        variant: "destructive"
      });
      return;
    }

    analyzeMinuteMutation.mutate({
      text: minuteText,
      useCaseType: formData.useCaseType,
      aiModel: formData.aiModel
    });
  };

  const loadDemoMinute = () => {
    const demoText = `
MINUTA DE REUNIÓN - GESTIONAR CLIENTES PREMIUM

Cliente: Banco Provincia
Proyecto: Sistema de Gestión Integral de Clientes Premium
Fecha: 15 de enero de 2025

OBJETIVO:
Desarrollar un caso de uso para la gestión integral de clientes premium del banco, incluyendo:
- Consulta de información de clientes VIP
- Actualización de datos personales y financieros
- Gestión de productos especiales
- Seguimiento de relación comercial

REQUISITOS FUNCIONALES:
1. El sistema debe permitir buscar clientes premium por DNI, CUIT, email o número de cliente
2. Mostrar información completa: datos personales, contacto, situación financiera, productos contratados
3. Permitir modificar datos de contacto y información comercial
4. Registrar interacciones y notas de seguimiento
5. Generar reportes de gestión mensual

PANTALLAS REQUERIDAS:
- Pantalla de búsqueda con filtros avanzados
- Grilla de resultados con paginado (25 registros por página)
- Detalle completo del cliente con pestañas
- Formulario de edición de datos
- Histórico de interacciones

CAMPOS DE ENTIDAD:
- clienteId (obligatorio, numérico)
- tipoDocumento (DNI/CUIT/Pasaporte)
- numeroDocumento (obligatorio)
- apellido, nombres (obligatorios)
- email, telefono (opcionales)
- segmento (Premium/VIP/Corporativo)
- sucursalOrigen
- ejecutivoAsignado
- fechaAlta, usuarioAlta (auditoría)

REGLAS DE NEGOCIO:
1. Solo usuarios con perfil "Ejecutivo Premium" pueden acceder
2. Validar DNI/CUIT con AFIP antes de guardar
3. Email debe ser único por cliente
4. Los cambios requieren autorización del supervisor para clientes VIP
5. Registrar todas las modificaciones en auditoría

FLUJOS ALTERNATIVOS:
- Si el cliente no existe, ofrecer creación
- Si hay errores de validación, mostrar detalle específico
- Timeout de sesión por inactividad (30 minutos)
`;
    setMinuteText(demoText);
  };

  return (
    <Card className="shadow-sm border border-ms-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="mr-2 text-ms-blue" size={20} />
            Análisis Inteligente de Minutas
          </CardTitle>
          <HelpButton step={2} useCaseType={formData.useCaseType} />
        </div>
        <p className="text-sm text-gray-600">
          Sube o pega el texto de la minuta de reunión para que la IA complete automáticamente el formulario
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de carga de archivo */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-ms-blue bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-ms-blue'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Arrastra y suelta un archivo de texto aquí
            </p>
            <p className="text-xs text-gray-500">
              o haz clic para seleccionar un archivo (.txt)
            </p>
          </div>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto de la Minuta
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadDemoMinute}
              className="text-xs"
            >
              <FileText className="mr-1 h-3 w-3" />
              Cargar Ejemplo
            </Button>
          </div>
          <Textarea
            value={minuteText}
            onChange={(e) => setMinuteText(e.target.value)}
            placeholder="Pega aquí el contenido de la minuta de reunión, documento de requisitos, o descripción del caso de uso..."
            className="min-h-[200px] resize-y"
          />
        </div>

        {/* Botón de análisis */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMinuteMutation.isPending || !minuteText.trim()}
            className="bg-ms-blue hover:bg-ms-blue/90 text-white px-6"
          >
            {analyzeMinuteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analizar y Completar Formulario
              </>
            )}
          </Button>
        </div>

        {/* Indicador de éxito */}
        {analyzeMinuteMutation.isSuccess && (
          <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">
              Formulario completado automáticamente. Continúa al siguiente paso para revisar.
            </span>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Brain className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                ¿Cómo funciona el análisis inteligente?
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                La IA analizará el texto y extraerá automáticamente información como nombres de cliente, 
                requisitos funcionales, campos de entidad, reglas de negocio y flujos alternativos según 
                el tipo de caso de uso seleccionado.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}