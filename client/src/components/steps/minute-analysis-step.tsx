import { useState } from 'react';
import { Upload, FileText, Loader2, Brain, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UseCaseFormData } from '@/types/use-case';
import { ProgressIndicator } from '@/components/progress-indicator';
import { AdaptiveLoading, AdaptiveProgressSteps } from '@/components/adaptive-loading';

interface MinuteAnalysisStepProps {
  formData: UseCaseFormData;
  onFormChange: (updates: Partial<UseCaseFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MinuteAnalysisStep({ formData, onFormChange, onNext, onPrevious }: MinuteAnalysisStepProps) {
  const [minuteText, setMinuteText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const { toast } = useToast();

  const analyzeMinuteMutation = useMutation({
    mutationFn: async (data: { text: string; useCaseType: string; aiModel: string }) => {
      setProgress(10);
      setProgressMessage('Preparando análisis de minuta...');
      
      const response = await apiRequest('POST', '/api/analyze-minute', {
        minuteContent: data.text,
        useCaseType: data.useCaseType,
        aiModel: data.aiModel
      });
      
      setProgress(50);
      setProgressMessage('Procesando contenido con IA...');
      
      // Simular progreso gradual mientras esperamos
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 1000);
      
      const result = await response.json();
      clearInterval(progressInterval);
      
      setProgress(100);
      setProgressMessage('¡Análisis completado!');
      
      return result;
    },
    onSuccess: (data) => {
      // Apply the analyzed data to the form
      onFormChange(data.formData);
      
      // Reset progress after a brief delay
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1500);
      
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

  const loadDemoMinute = () => {
    const demoText = `MINUTA DE REUNIÓN - GESTIONAR TRANSFERENCIAS BANCARIAS

Cliente: Banco Santander Argentina
Proyecto: Sistema de Gestión de Transferencias Electrónicas
Código: ST003
Fecha: 28 de enero de 2025
Participantes: Equipo de desarrollo, Analistas funcionales, Product Owner

OBJETIVO DEL CASO DE USO:
Desarrollar un caso de uso para gestionar transferencias bancarias electrónicas entre cuentas propias y de terceros, incluyendo validaciones de seguridad, límites operativos y trazabilidad completa de todas las operaciones.

ALCANCE Y DESCRIPCIÓN:
El sistema debe permitir a los clientes realizar transferencias de dinero de forma segura y eficiente, con validaciones automáticas de fondos, límites diarios, y cumplimiento de normativas del Banco Central. Debe incluir funcionalidades para programar transferencias futuras y generar comprobantes.

REQUISITOS FUNCIONALES IDENTIFICADOS:
1. Buscar cuenta origen por CBU, alias o número de cuenta
2. Validar saldo disponible y límites operativos del cliente
3. Ingresar datos de cuenta destino (CBU, alias, titular)
4. Validar cuenta destino contra base de datos bancaria
5. Aplicar comisiones según tipo de transferencia y banco destino
6. Generar token de seguridad para autorización
7. Procesar transferencia y actualizar saldos
8. Generar comprobante con número de operación único
9. Registrar operación en auditoría para cumplimiento normativo

FILTROS DE BÚSQUEDA NECESARIOS:
- CBU de cuenta origen (22 dígitos)
- Alias de cuenta (máximo 20 caracteres alfanuméricos)
- Número de cuenta tradicional
- DNI/CUIT del titular
- Fecha de operación (rango)
- Estado de transferencia (Pendiente/Procesada/Rechazada/Cancelada)
- Monto (rango mínimo y máximo)
- Banco destino

COLUMNAS PARA MOSTRAR EN RESULTADOS:
- Número de Operación
- Fecha y Hora
- Cuenta Origen (últimos 4 dígitos)
- Cuenta Destino (últimos 4 dígitos)
- Titular Destino
- Monto Transferido
- Comisión Aplicada
- Estado Actual
- Banco Destino

CAMPOS DE LA ENTIDAD TRANSFERENCIA:
- numeroOperacion: numérico, obligatorio, único, 15 dígitos
- cbuOrigen: texto, obligatorio, 22 caracteres, formato CBU válido
- cbuDestino: texto, obligatorio, 22 caracteres, formato CBU válido
- titularDestino: texto, obligatorio, máximo 100 caracteres
- montoTransferencia: decimal, obligatorio, 2 decimales, mayor a 0
- comisionAplicada: decimal, obligatorio, 2 decimales
- conceptoTransferencia: texto, opcional, máximo 200 caracteres
- estadoOperacion: texto, obligatorio, valores: PENDIENTE/PROCESADA/RECHAZADA/CANCELADA
- codigoAutorizacion: texto, obligatorio, 8 caracteres alfanuméricos
- bancoDestino: texto, obligatorio, máximo 50 caracteres
- fechaOperacion: fecha y hora, obligatorio
- fechaProcesamiento: fecha y hora, opcional
- motivoRechazo: texto, opcional, máximo 500 caracteres
- ipCliente: texto, obligatorio, formato IP válido
- dispositivoOrigen: texto, obligatorio, máximo 100 caracteres
- fechaAlta: fecha y hora, obligatorio, automático
- usuarioAlta: texto, obligatorio, máximo 50 caracteres
- fechaModificacion: fecha y hora, opcional, automático
- usuarioModificacion: texto, opcional, máximo 50 caracteres

PANTALLAS Y WIREFRAMES IDENTIFICADOS:
- Pantalla de búsqueda de cuenta origen con validación CBU/Alias
- Formulario de datos de transferencia con calculadora de comisiones
- Pantalla de confirmación con resumen de operación
- Grilla de resultados de transferencias con filtros avanzados
- Detalle de transferencia individual con timeline de estados
- Pantalla de programación de transferencias futuras
- Formulario de autorización con token de seguridad

REGLAS DE NEGOCIO ESTABLECIDAS:
1. Solo clientes con cuentas activas pueden realizar transferencias
2. Validar saldo suficiente incluyendo comisiones antes de procesar
3. Aplicar límites diarios según perfil del cliente (Estándar: $500.000, Premium: $2.000.000)
4. Transferencias superiores a $100.000 requieren doble autenticación
5. Comisión del 0.5% para bancos externos, gratis para cuentas propias
6. Todas las operaciones deben registrarse para cumplimiento BCRA
7. Transferencias programadas se procesan a las 9:00 AM del día seleccionado
8. Timeout de sesión de 10 minutos por seguridad durante el proceso

FLUJOS ALTERNATIVOS Y MANEJO DE ERRORES:
- Saldo insuficiente: mostrar saldo disponible y sugerir monto máximo
- CBU destino inválido: validar formato y existencia en sistema bancario
- Límite diario excedido: mostrar límite actual y monto disponible
- Error de conectividad: guardar borrador y permitir reintento
- Rechazo del banco receptor: notificar motivo y reversar operación
- Token de seguridad expirado: generar nuevo token automáticamente
- Cuenta origen bloqueada: derivar a atención al cliente

REQUERIMIENTOS ESPECIALES Y TÉCNICOS:
1. Integración con API del Banco Central para validación de CBU
2. Encriptación de datos sensibles con algoritmo AES-256
3. Registro completo de auditoría para cumplimiento normativo
4. Notificaciones SMS/email para transferencias superiores a $50.000
5. Backup automático de operaciones cada 5 minutos
6. Monitoreo en tiempo real de operaciones sospechosas
7. Interfaz accesible compatible con lectores de pantalla

CRITERIOS DE ACEPTACIÓN:
- Tiempo de respuesta menor a 3 segundos para validaciones
- Disponibilidad del sistema 99.9% durante horario bancario
- Cumplimiento de normativas PCI-DSS para seguridad de datos
- Integración exitosa con 15 bancos principales del país
- Capacidad de procesar 10.000 transferencias simultáneas`;
    setMinuteText(demoText);
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
              Arrastra y suelta un archivo aquí
            </p>
            <p className="text-xs text-gray-500">
              o haz clic para seleccionar un archivo (.txt, .docx, .pptx, .xlsx)
            </p>
          </div>
          <input
            type="file"
            accept=".txt,.docx,.pptx,.xlsx,.xls,.ppt"
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
    
    {/* Progress Indicator */}
    {/* Adaptive Loading for Minute Analysis */}
    {analyzeMinuteMutation.isPending && (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:border-gray-700 z-50">
        <AdaptiveProgressSteps
          stages={[
            { stage: "Preparando análisis", message: "Iniciando procesamiento de minuta" },
            { stage: "Extrayendo datos", message: "Identificando información relevante" },
            { stage: "Aplicando IA", message: "Procesando con inteligencia artificial" },
            { stage: "Completando formulario", message: "Aplicando datos extraídos" }
          ]}
          currentStage={
            progress < 25 ? 0 :
            progress < 50 ? 1 :
            progress < 75 ? 2 : 3
          }
        />
        <div className="mt-4">
          <AdaptiveLoading
            context="minute-analysis"
            isLoading={true}
            progress={progress}
            message={progressMessage}
            submessage="Analizando minuta con IA"
            variant="inline"
          />
        </div>
      </div>
    )}
    </>
  );
}