import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  FileText, 
  CheckCircle,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast, useToast } from '@/hooks/use-toast';
import type { UseCaseFormData } from '@shared/schema';

interface MinuteAnalysisStepProps {
  formData: UseCaseFormData;
  onDataExtracted: (extractedData: Partial<UseCaseFormData>) => void;
  readOnly?: boolean;
}

export function MinuteAnalysisStep({ 
  formData, 
  onDataExtracted,
  readOnly = false 
}: MinuteAnalysisStepProps) {
  const [minuteText, setMinuteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [dots, setDots] = useState('...');
  const { toast } = useToast();

  const analyzeMinuteMutation = useMutation({
    mutationFn: async (data: { text: string; useCaseType: string; aiModel: string }) => {
      try {
        const response = await apiRequest('POST', '/api/analyze-minute', {
          minuteContent: data.text,
          useCaseType: data.useCaseType,
          aiModel: data.aiModel || 'demo'
        });
        const jsonData = await response.json();
        console.log('Analysis response:', jsonData);
        return jsonData;
      } catch (error) {
        console.error('Error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('onSuccess response:', response);
      if (response && response.success && response.formData) {
        onDataExtracted(response.formData);
        toast({
          title: "✨ Análisis completado",
          description: "El formulario ha sido actualizado con la información extraída",
        });
      } else {
        toast({
          title: "Error en el análisis",
          description: response?.message || "No se pudo extraer información de la minuta",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('Error analyzing minute:', error);
      toast({
        title: "Error al analizar",
        description: error?.message || "Ocurrió un error al procesar la minuta. Por favor, intenta nuevamente.",
        variant: "destructive"
      });
    }
  });

  // Animate dots while processing
  useEffect(() => {
    if (analyzeMinuteMutation.isPending) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '....';
          if (prev === '....') return '.....';
          if (prev === '.....') return '......';
          return '...';
        });
      }, 400);
      
      return () => clearInterval(interval);
    }
  }, [analyzeMinuteMutation.isPending]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
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
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint' // .ppt
    ];
    
    const validExtensions = ['.txt', '.docx', '.pptx', '.xlsx', '.xls', '.ppt'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
      if (file.type === 'text/plain' || fileExtension === '.txt') {
        // Handle text files directly
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setMinuteText(text);
        };
        reader.readAsText(file);
      } else {
        // For Office files, we need to send to backend
        toast({
          title: "Procesando archivo",
          description: "Extrayendo texto del documento..."
        });
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error('Error procesando el archivo');
          }
          
          const data = await response.json();
          setMinuteText(data.text || '');
          
          toast({
            title: "Archivo procesado",
            description: "El texto ha sido extraído exitosamente"
          });
        } catch (error) {
          toast({
            title: "Error al procesar archivo",
            description: "No se pudo extraer el texto del documento",
            variant: "destructive"
          });
        }
      }
    } else {
      toast({
        title: "Tipo de archivo no soportado",
        description: "Solo se admiten archivos .txt, .docx, .pptx, .xlsx",
        variant: "destructive"
      });
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

  return (
    <>
      <Card className="shadow-sm border border-ms-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="tracking-tight text-lg font-semibold flex items-center text-[#006bc2]">
            <Brain className="mr-2 text-ms-blue" size={20} />
            Análisis Inteligente de Minutas
          </CardTitle>
          <div className="text-sm text-gray-500">
            Tipo de CU: <span className="font-medium">
              {formData.useCaseType === 'entity' && 'Gestión de Entidad'}
              {formData.useCaseType === 'api' && 'API'}
              {formData.useCaseType === 'service' && 'Servicio/Proceso Automático'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona de carga de archivos */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Soporta: .txt, .docx, .pptx, .xlsx
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.docx,.pptx,.xlsx,.xls,.ppt"
            disabled={readOnly}
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <span>
                <FileText className="mr-2 h-4 w-4" />
                Seleccionar Archivo
              </span>
            </Button>
          </label>
        </div>

        {/* Área de texto de minuta */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto de la Minuta
            </label>
            <Button
              onClick={handleAnalyze}
              disabled={analyzeMinuteMutation.isPending || !minuteText.trim()}
              className={`${analyzeMinuteMutation.isPending ? 'thinking-button' : 'bg-violet-600 hover:bg-violet-700'} text-white px-4`}
              size="sm"
            >
              {analyzeMinuteMutation.isPending ? (
                <div className="thinking-button-content">
                  <div className="thinking-pulse"></div>
                  <span className="thinking-text">Pensando<span className="thinking-dots">{dots}</span></span>
                </div>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analizar y Completar Formulario
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={minuteText}
            onChange={(e) => setMinuteText(e.target.value)}
            placeholder="Pega aquí el contenido de la minuta de reunión, documento de requisitos, o descripción del caso de uso..."
            className="min-h-[200px] resize-y"
          />
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
    

    </>
  );
}