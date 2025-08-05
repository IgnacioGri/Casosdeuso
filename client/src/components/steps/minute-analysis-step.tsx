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
      const response = await apiRequest('/api/analyze-minute', {
        method: 'POST',
        body: JSON.stringify({
          minuteContent: data.text,
          useCaseType: data.useCaseType,
          aiModel: data.aiModel || 'demo'
        })
      });
      return response;
    },
    onSuccess: (response) => {
      if (response.success && response.formData) {
        onDataExtracted(response.formData);
        toast({
          title: "✨ Análisis completado",
          description: "El formulario ha sido actualizado con la información extraída",
        });
      } else {
        toast({
          title: "Error en el análisis",
          description: "No se pudo extraer información de la minuta",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Error analyzing minute:', error);
      toast({
        title: "Error al analizar",
        description: "Ocurrió un error al procesar la minuta. Por favor, intenta nuevamente.",
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

  const loadDemoMinute = () => {
    let demoText = '';
    
    // Cargar ejemplo diferente según el tipo de caso de uso
    if (formData.useCaseType === 'service') {
      demoText = `MINUTA DE REUNIÓN - PROCESO AUTOMÁTICO DE CONCILIACIÓN BANCARIA

Cliente: Banco Santander Argentina
Proyecto: Sistema de Procesamiento Automático de Archivos
Código: SP001
Fecha: 28 de enero de 2025
Participantes: Equipo de desarrollo, Arquitecto de sistemas, DevOps

OBJETIVO DEL PROCESO:
Desarrollar un proceso automático que se ejecute diariamente para conciliar las transacciones bancarias, procesando archivos desde múltiples fuentes, validando la integridad de los datos y generando reportes de discrepancias.

ALCANCE Y DESCRIPCIÓN:
El proceso debe ejecutarse automáticamente todos los días a las 2:00 AM y 14:00 PM. Capturará archivos desde servidores SFTP de diferentes sucursales, procesará las transacciones, aplicará reglas de conciliación y generará reportes consolidados. En caso de discrepancias críticas, debe enviar alertas inmediatas al equipo de operaciones.

FRECUENCIA Y HORARIOS DE EJECUCIÓN:
- Frecuencia principal: Diariamente a las 02:00 AM (proceso completo)
- Frecuencia secundaria: Cada 4 horas para procesamiento incremental (06:00, 10:00, 14:00, 18:00, 22:00)
- Proceso mensual: Último día del mes a las 23:30 para cierre contable

CONFIGURACIÓN DE RUTAS Y DIRECTORIOS:
Las siguientes rutas deben ser configurables mediante archivo de propiedades:
- Captura de archivos: /sftp/incoming/transactions/
- Archivos procesados: /sftp/processed/{YYYY}/{MM}/{DD}/
- Archivos con error: /sftp/errors/
- Logs del proceso: /logs/conciliation/
- Reportes generados: /reports/daily/

INTEGRACIÓN CON SERVICIOS EXTERNOS:
El proceso debe conectarse con los siguientes web services:
- Servicio de validación BCRA: https://api.bcra.gov.ar/v2/validate
  Usuario: srv_conciliacion_santander
  Clave: Debe ser configurable y encriptada
  Método de autenticación: OAuth 2.0
- API interna de saldos: https://internal.santander.com/api/balances
  Token: Renovación automática cada 24 horas

REQUISITOS FUNCIONALES IDENTIFICADOS:
1. Capturar archivos desde múltiples servidores SFTP según horario configurado
2. Validar formato y estructura de archivos antes de procesar
3. Aplicar reglas de conciliación bancaria automáticamente
4. Detectar discrepancias y generar alertas cuando corresponda
5. Generar reportes consolidados diarios, semanales y mensuales
6. Mantener log detallado de todas las operaciones procesadas
7. Archivar archivos procesados para auditoría
8. Enviar notificaciones al equipo de operaciones

REGLAS DE NEGOCIO ESTABLECIDAS:
1. Los archivos deben procesarse en el orden de llegada
2. Si un archivo falla, no debe detener el proceso de otros archivos
3. Las discrepancias mayores a $10.000 requieren revisión manual
4. Los reportes deben generarse aunque haya errores parciales
5. Mantener historial de 90 días de archivos procesados
6. Reintentar archivos fallidos hasta 3 veces antes de marcarlos como error

REQUERIMIENTOS ESPECIALES Y TÉCNICOS:
1. Capacidad de procesar archivos de hasta 500MB
2. Soporte para múltiples formatos (CSV, XML, JSON)
3. Encriptación de archivos sensibles durante transferencia
4. Monitoreo en tiempo real del estado del proceso
5. Capacidad de reprocesar archivos manualmente
6. Dashboard de control con métricas de procesamiento`;
    } else if (formData.useCaseType === 'api') {
      demoText = `MINUTA DE REUNIÓN - API DE CONSULTA DE SALDOS

Cliente: Banco Santander Argentina
Proyecto: API Gateway Bancario
Código: API003
Fecha: 28 de enero de 2025
Participantes: Equipo de APIs, Arquitecto de integración, Product Owner

OBJETIVO DEL API:
Desarrollar un endpoint REST para consultar saldos de cuentas bancarias en tiempo real, con autenticación OAuth 2.0, rate limiting y respuestas en formato JSON estandarizado.

DESCRIPCIÓN TÉCNICA:
Endpoint: GET /api/v2/accounts/{accountId}/balance
Método: GET
Autenticación: Bearer Token (OAuth 2.0)
Content-Type: application/json
Rate Limit: 100 requests por minuto por API key

HEADERS REQUERIDOS:
- Authorization: Bearer {token}
- X-API-Key: {apiKey}
- X-Request-ID: UUID único por request
- X-Client-Version: Versión del cliente

REQUEST PARAMETERS:
- accountId (path): Identificador único de la cuenta (CBU o número de cuenta)
- currency (query, opcional): Moneda para la consulta (ARS, USD, EUR)
- includeHolds (query, opcional): Incluir retenciones (true/false)

EJEMPLO DE REQUEST:
GET /api/v2/accounts/0170099220000001234567/balance?currency=ARS&includeHolds=true
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  X-API-Key: sk_live_4242424242424242
  X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

RESPONSE SUCCESS (200 OK):
{
  "status": "success",
  "data": {
    "accountId": "0170099220000001234567",
    "availableBalance": 150000.50,
    "currentBalance": 155000.00,
    "currency": "ARS",
    "holds": [
      {
        "amount": 4500.50,
        "description": "Compra en cuotas",
        "releaseDate": "2025-02-15"
      }
    ],
    "lastUpdate": "2025-01-28T10:30:45Z"
  },
  "metadata": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-01-28T10:30:45Z"
  }
}

CÓDIGOS DE ERROR:
- 400 Bad Request: Parámetros inválidos o faltantes
- 401 Unauthorized: Token inválido o expirado
- 403 Forbidden: Sin permisos para la cuenta
- 404 Not Found: Cuenta no encontrada
- 429 Too Many Requests: Rate limit excedido
- 500 Internal Server Error: Error del servidor
- 503 Service Unavailable: Servicio temporalmente no disponible`;
    } else {
      // Default para entity
      demoText = `MINUTA DE REUNIÓN - GESTIONAR TRANSFERENCIAS BANCARIAS

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
    }
    
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
            className={`${analyzeMinuteMutation.isPending ? 'thinking-button' : 'bg-ms-blue hover:bg-ms-blue/90'} text-white px-6`}
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