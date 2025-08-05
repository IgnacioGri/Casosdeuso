import { useState, useCallback } from 'react';
import { UseCaseFormData, EntityField, UseCaseType, TestStep } from '@/types/use-case';

export function useUseCaseForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UseCaseFormData>({
    useCaseType: 'entity',
    // Minute analysis fields
    uploadedMinute: '',
    minuteFile: undefined,
    aiGeneratedFields: {},
    clientName: '',
    projectName: '',
    useCaseCode: '',
    useCaseName: '',
    fileName: '',
    description: '',
    filtersDescription: '',
    columnsDescription: '',
    fieldsDescription: '',
    searchFilters: [''],
    resultColumns: [''],
    entityFields: [{
      name: '',
      type: 'text',
      length: undefined,
      mandatory: false
    }],
    businessRules: '',
    specialRequirements: '',
    generateWireframes: false,
    wireframeDescriptions: [''],

    wireframesDescription: '',
    // Campos específicos para tipos de casos de uso
    apiEndpoint: '',
    requestFormat: '',
    responseFormat: '',
    serviceFrequency: '',
    executionTime: '',
    configurationPaths: '',
    webServiceCredentials: '',
    // Test case fields
    generateTestCase: false,
    testCaseObjective: '',
    testCasePreconditions: '',
    testSteps: [],
    aiModel: 'gemini'
  });

  const updateFormData = useCallback((updates: Partial<UseCaseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const addSearchFilter = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      searchFilters: [...prev.searchFilters, '']
    }));
  }, []);

  const removeSearchFilter = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      searchFilters: prev.searchFilters.filter((_, i) => i !== index)
    }));
  }, []);

  const updateSearchFilter = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      searchFilters: prev.searchFilters.map((filter, i) => i === index ? value : filter)
    }));
  }, []);

  const addResultColumn = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      resultColumns: [...prev.resultColumns, '']
    }));
  }, []);

  const removeResultColumn = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      resultColumns: prev.resultColumns.filter((_, i) => i !== index)
    }));
  }, []);

  const updateResultColumn = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      resultColumns: prev.resultColumns.map((column, i) => i === index ? value : column)
    }));
  }, []);

  const addEntityField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      entityFields: [...prev.entityFields, {
        name: '',
        type: 'text',
        length: undefined,
        mandatory: false
      }]
    }));
  }, []);

  const removeEntityField = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      entityFields: prev.entityFields.filter((_, i) => i !== index)
    }));
  }, []);

  const updateEntityField = useCallback((index: number, field: Partial<EntityField>) => {
    setFormData(prev => ({
      ...prev,
      entityFields: prev.entityFields.map((entityField, i) => 
        i === index ? { ...entityField, ...field } : entityField
      )
    }));
  }, []);

  // Wireframe descriptions management
  const addWireframeDescription = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      wireframeDescriptions: [...(prev.wireframeDescriptions || []), '']
    }));
  }, []);

  const removeWireframeDescription = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      wireframeDescriptions: (prev.wireframeDescriptions || []).filter((_, i) => i !== index)
    }));
  }, []);

  const updateWireframeDescription = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      wireframeDescriptions: (prev.wireframeDescriptions || []).map((desc, i) => 
        i === index ? value : desc
      )
    }));
  }, []);

  // Test step management functions
  const addTestStep = useCallback(() => {
    const nextNumber = (formData.testSteps || []).length + 1;
    setFormData(prev => ({
      ...prev,
      testSteps: [...(prev.testSteps || []), {
        number: nextNumber,
        action: '',
        inputData: '',
        expectedResult: '',
        observations: '',
        status: 'pending'
      }]
    }));
  }, [formData.testSteps]);

  const removeTestStep = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      testSteps: (prev.testSteps || []).filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        number: i + 1
      }))
    }));
  }, []);

  const updateTestStep = useCallback((index: number, field: keyof TestStep, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      testSteps: (prev.testSteps || []).map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.aiModel; // AI Model selection
      case 2:
        return !!formData.useCaseType; // Use Case Type selection
      case 3:
        return !!(formData.clientName && formData.projectName && formData.useCaseCode); // Basic Info
      case 4:
        const infinitiveVerbs = [
          // Verbos básicos de gestión
          'gestionar', 'crear', 'actualizar', 'eliminar', 'consultar', 'registrar', 'modificar', 'validar', 'procesar', 'generar', 'obtener', 'establecer', 'configurar', 'sincronizar', 'enviar', 'recibir', 'ver', 'mostrar', 'listar', 'buscar', 'filtrar', 'exportar', 'importar', 'calcular', 'analizar', 'reportar',
          // Verbos de inicio y control
          'iniciar', 'arrancar', 'comenzar', 'empezar', 'lanzar', 'ejecutar', 'correr', 'activar', 'desactivar', 'parar', 'detener', 'terminar', 'finalizar', 'cerrar', 'abrir', 'pausar', 'reanudar', 'reiniciar', 'resetear',
          // Verbos de autenticación y seguridad
          'autenticar', 'autorizar', 'autentificar', 'verificar', 'validar', 'confirmar', 'aprobar', 'rechazar', 'denegar', 'bloquear', 'desbloquear', 'encriptar', 'desencriptar', 'firmar', 'certificar',
          // Verbos de comunicación
          'notificar', 'avisar', 'alertar', 'informar', 'comunicar', 'publicar', 'compartir', 'difundir', 'transmitir', 'propagar',
          // Verbos de operaciones bancarias
          'transferir', 'depositar', 'retirar', 'acreditar', 'debitar', 'cargar', 'abonar', 'cobrar', 'pagar', 'facturar', 'liquidar', 'compensar', 'conciliar',
          // Verbos de mantenimiento
          'mantener', 'conservar', 'preservar', 'actualizar', 'refrescar', 'renovar', 'restaurar', 'recuperar', 'reparar', 'corregir', 'optimizar', 'mejorar',
          // Verbos de integración
          'integrar', 'conectar', 'vincular', 'enlazar', 'asociar', 'relacionar', 'mapear', 'transformar', 'convertir', 'adaptar', 'migrar', 'replicar',
          // Verbos de control y monitoreo
          'monitorear', 'supervisar', 'controlar', 'vigilar', 'observar', 'rastrear', 'seguir', 'auditar', 'inspeccionar', 'revisar', 'evaluar', 'medir',
          // Verbos de administración
          'administrar', 'dirigir', 'gobernar', 'regular', 'coordinar', 'organizar', 'planificar', 'programar', 'agendar', 'asignar', 'distribuir', 'delegar'
        ];
        const startsWithInfinitive = infinitiveVerbs.some(verb => 
          formData.useCaseName.toLowerCase().startsWith(verb)
        );
        return !!(formData.useCaseName && formData.fileName && formData.description && startsWithInfinitive); // Use Case Details
      case 5:
        return true; // Search Filters ahora opcional para flexibilidad en demos
      case 6:
        return true; // Result Columns ahora opcional para flexibilidad en demos
      case 7:
        return true; // Entity Fields ahora opcional para flexibilidad en demos
      case 8:
        return true; // Business Rules siempre opcional
      case 9:
        return true; // Test cases siempre opcional
      case 10:
        return true; // Final review step siempre opcional
      default:
        return true;
    }
  }, [formData]);

  const loadDemoData = useCallback(() => {
    setFormData(prev => {
      // Si el tipo es servicio, cargar ejemplo de proceso automático
      if (prev.useCaseType === 'service') {
        return {
          ...prev,
          clientName: 'Banco Santander Argentina',
          projectName: 'Sistema de Procesamiento Automático de Archivos',
          useCaseCode: 'SP001',
          useCaseName: 'Procesar Archivos de Transacciones Nocturnas',
          fileName: 'SP001ProcesarTransaccionesNocturnas',
          description: 'Proceso automático que se ejecuta diariamente para procesar archivos de transacciones bancarias, validar los datos, aplicar reglas de negocio, generar reportes consolidados y enviar notificaciones. El proceso captura archivos desde servidores SFTP, valida la integridad de los datos, aplica transformaciones necesarias, actualiza las bases de datos y genera archivos de salida para sistemas externos.',
          // Campos específicos para servicio/proceso
          serviceFrequency: 'Diariamente, Cada hora, Semanalmente los lunes',
          executionTime: '02:00 AM, 18:30, 23:59',
          configurationPaths: 'Si el proceso captura archivos, indicar que las rutas deben ser configurables:\n/sftp/incoming/transactions/\n/sftp/processed/\n/sftp/errors/',
          webServiceCredentials: 'Si llama a web services, indicar que usuario, clave y URL deben ser configurables:\nUsuario: srv_proceso_transacciones\nURL: https://api.banco.com/v1/validate\nMétodo de autenticación: OAuth 2.0',
          businessRules: `• Los archivos deben tener el formato: TRANS_YYYYMMDD_HHmmss.csv
• Solo se procesan transacciones con montos superiores a $1,000
• Las transacciones duplicadas se rechazan automáticamente
• Se debe validar el CBU/CVU contra el servicio del BCRA
• Los archivos procesados se mueven a carpeta histórica
• Los archivos con errores se mueven a carpeta de rechazados
• Se genera un log detallado de cada ejecución
• Máximo 3 reintentos en caso de fallo de conexión`,
          specialRequirements: `• Integración con servidor SFTP para captura de archivos
• Conexión con base de datos Oracle para actualización de saldos
• Integración con API del BCRA para validación de cuentas
• Sistema de notificaciones por email para alertas
• Generación de reportes en formato PDF y Excel
• Encriptación AES-256 para archivos sensibles
• Monitoreo en tiempo real del estado del proceso
• Backup automático antes de cada procesamiento`,
          alternativeFlows: [
            'No se encuentran archivos en la ruta configurada',
            'El archivo tiene formato incorrecto o está corrupto',
            'Falla la conexión con el servidor SFTP',
            'Error de conexión con la base de datos',
            'Timeout en la validación con servicio del BCRA',
            'El proceso anterior no finalizó correctamente',
            'Se supera el límite de registros permitidos',
            'Error al generar archivos de salida'
          ],
          generateWireframes: false,
          wireframeDescriptions: [],
          generateTestCase: true,
          testCaseObjective: 'Verificar que el proceso automático ejecute correctamente todas las etapas de procesamiento de archivos',
          testCasePreconditions: 'Archivos de prueba disponibles en ruta SFTP. Base de datos en estado consistente. Servicios externos disponibles.',
          testSteps: [
            { 
              number: 1, 
              action: 'Preparar archivo de prueba', 
              inputData: 'Archivo TRANS_20250108_020000.csv con 100 transacciones de prueba', 
              expectedResult: 'Archivo disponible en /sftp/incoming/', 
              observations: 'Validar formato CSV y estructura de columnas', 
              status: '' 
            },
            { 
              number: 2, 
              action: 'Ejecutar proceso automático', 
              inputData: 'Comando: ./run_process.sh SP001 o esperar hora programada (02:00 AM)', 
              expectedResult: 'Proceso inicia y muestra log de ejecución', 
              observations: 'Verificar logs en /logs/SP001_20250108.log', 
              status: '' 
            },
            { 
              number: 3, 
              action: 'Verificar captura de archivo', 
              inputData: 'Consultar log de captura', 
              expectedResult: 'Archivo TRANS_20250108_020000.csv detectado y leído correctamente', 
              observations: 'Registro muestra cantidad de líneas procesadas', 
              status: '' 
            },
            { 
              number: 4, 
              action: 'Validar procesamiento según reglas', 
              inputData: 'Revisar aplicación de reglas de negocio', 
              expectedResult: 'Transacciones > $1,000 procesadas, duplicadas rechazadas', 
              observations: 'Verificar rechazos en /sftp/errors/', 
              status: '' 
            },
            { 
              number: 5, 
              action: 'Confirmar actualización BD', 
              inputData: 'SELECT COUNT(*) FROM transacciones WHERE fecha_proceso = TODAY', 
              expectedResult: 'Registros insertados/actualizados en base de datos', 
              observations: 'Validar integridad referencial y saldos', 
              status: '' 
            },
            { 
              number: 6, 
              action: 'Verificar reportes generados', 
              inputData: 'Revisar carpeta /reports/daily/', 
              expectedResult: 'Archivos TRANS_REPORT_20250108.pdf y .xlsx generados', 
              observations: 'Abrir y validar contenido de reportes', 
              status: '' 
            },
            { 
              number: 7, 
              action: 'Confirmar notificaciones', 
              inputData: 'Revisar bandeja de correo de prueba', 
              expectedResult: 'Email con resumen del proceso enviado correctamente', 
              observations: 'Verificar destinatarios y adjuntos', 
              status: '' 
            },
            { 
              number: 8, 
              action: 'Validar movimiento de archivo', 
              inputData: 'Verificar directorio /sftp/processed/', 
              expectedResult: 'Archivo movido a /sftp/processed/TRANS_20250108_020000_PROCESSED.csv', 
              observations: 'Archivo original no debe existir en /sftp/incoming/', 
              status: '' 
            }
          ],
          // Campos no usados en servicio
          searchFilters: [],
          resultColumns: [],
          entityFields: [],
          apiEndpoint: '',
          requestFormat: '',
          responseFormat: '',
          httpMethod: '',
          errorCodes: [],
          wireframesDescription: '',
          alternativeFlowsDescription: '',
          aiModel: prev.aiModel
        };
      }
      
      // Si el tipo es API, cargar ejemplo de API
      if (prev.useCaseType === 'api') {
        return {
          ...prev,
          clientName: 'Banco Santander Argentina',
          projectName: 'API de Servicios Bancarios',
          useCaseCode: 'API003',
          useCaseName: 'Gestionar Transferencias Bancarias',
          fileName: 'API003GestionarTransferencias',
          description: 'API REST para gestionar transferencias bancarias entre cuentas propias y de terceros. Permite realizar transferencias inmediatas y programadas, consultar el estado de transferencias, cancelar transferencias programadas y obtener el historial de movimientos. Incluye validaciones de seguridad, límites operativos y trazabilidad completa.',
          apiEndpoint: '/api/v1/transfers',
          httpMethod: 'POST',
          requestFormat: `{
  "sourceAccount": "string",
  "destinationAccount": "string", 
  "amount": "number",
  "currency": "ARS|USD",
  "concept": "string",
  "scheduledDate": "datetime",
  "beneficiaryName": "string",
  "beneficiaryEmail": "string"
}`,
          responseFormat: `{
  "transactionId": "string",
  "status": "PENDING|COMPLETED|FAILED",
  "timestamp": "datetime",
  "sourceBalance": "number",
  "fee": "number",
  "exchangeRate": "number",
  "estimatedArrival": "datetime"
}`,
          errorCodes: ['400', '401', '403', '404', '422', '429', '500', '503'],
          businessRules: `• Validar fondos suficientes antes de procesar
• Límite diario: $500,000 para clientes estándar
• Transferencias > $100,000 requieren doble autenticación
• Comisión 0.5% para otros bancos
• Horario de procesamiento: 24/7 para mismo banco
• Cut-off time: 15:00 hs para otros bancos
• Máximo 10 transferencias por hora por cliente`,
          specialRequirements: `• Autenticación OAuth 2.0 con JWT
• Rate limiting: 100 requests por minuto
• Encriptación TLS 1.3 obligatoria
• Validación de CBU/CVU con servicio BCRA
• Webhook para notificaciones de estado
• Idempotencia con header X-Idempotency-Key
• Logs de auditoría para compliance`,
          alternativeFlows: [
            'Fondos insuficientes en cuenta origen',
            'CBU/CVU de destino inválido',
            'Supera límite diario de transferencias',
            'Token de autenticación expirado',
            'Servicio BCRA no disponible',
            'Rate limit excedido'
          ],
          // Campos no usados en API
          searchFilters: [],
          resultColumns: [],
          entityFields: [],
          serviceFrequency: '',
          executionTime: '',
          configurationPaths: '',
          webServiceCredentials: '',
          generateWireframes: false,
          wireframeDescriptions: [],
          generateTestCase: true,
          testCaseObjective: 'Validar el funcionamiento completo del endpoint de transferencias',
          testCasePreconditions: 'Usuario autenticado con token válido. Cuenta con fondos suficientes.',
          testSteps: [
            { 
              number: 1, 
              action: 'Autenticación OAuth', 
              inputData: 'POST /auth/token con client_id, client_secret y grant_type=client_credentials', 
              expectedResult: 'Token JWT válido con expiración de 3600 segundos', 
              observations: 'Guardar token para siguientes requests', 
              status: '' 
            },
            { 
              number: 2, 
              action: 'Enviar transferencia válida', 
              inputData: 'POST /api/v1/transfers con JSON: {"sourceAccount":"123456","destinationAccount":"789012","amount":1000,"currency":"ARS"}', 
              expectedResult: 'HTTP 201 Created con transactionId en respuesta', 
              observations: 'Headers: Authorization: Bearer {token}, Content-Type: application/json', 
              status: '' 
            },
            { 
              number: 3, 
              action: 'Validar estructura respuesta', 
              inputData: 'Analizar JSON de respuesta', 
              expectedResult: 'Contiene: transactionId, status=COMPLETED, timestamp, sourceBalance, fee', 
              observations: 'Todos los campos obligatorios presentes', 
              status: '' 
            },
            { 
              number: 4, 
              action: 'Verificar actualización saldos', 
              inputData: 'GET /api/v1/accounts/123456/balance', 
              expectedResult: 'Saldo disminuido en $1000 + comisión', 
              observations: 'Comparar con saldo inicial antes de transferencia', 
              status: '' 
            },
            { 
              number: 5, 
              action: 'Probar fondos insuficientes', 
              inputData: 'POST con amount=999999999', 
              expectedResult: 'HTTP 422 con mensaje "Fondos insuficientes"', 
              observations: 'No debe actualizar saldos', 
              status: '' 
            },
            { 
              number: 6, 
              action: 'Verificar log auditoría', 
              inputData: 'Consultar logs del sistema', 
              expectedResult: 'Registro completo de la transacción con IP, timestamp y usuario', 
              observations: 'Verificar cumplimiento regulatorio', 
              status: '' 
            }
          ],
          wireframesDescription: '',
          alternativeFlowsDescription: '',
          aiModel: prev.aiModel
        };
      }
      
      // Por defecto, cargar ejemplo de entidad
      return {
        ...prev,
        useCaseType: 'entity',
        clientName: 'Banco Nacional de Argentina',
        projectName: 'Sistema de Gestión de Usuarios',
        useCaseCode: 'UC001',
        useCaseName: 'Gestionar Usuarios del Sistema',
        fileName: 'UC001GestionarUsuarios',
        description: 'Este caso de uso permite la gestión completa de usuarios del sistema, incluyendo alta, baja, modificación y consulta de usuarios con diferentes roles y permisos.',
        searchFilters: ['Nombre de Usuario', 'Email', 'Estado', 'Rol'],
        resultColumns: ['ID', 'Nombre de Usuario', 'Email', 'Estado', 'Fecha de Alta', 'Último Acceso'],
        entityFields: [
          { name: 'Nombre de Usuario', type: 'text', length: 50, mandatory: true },
          { name: 'Email', type: 'email', length: 100, mandatory: true },
          { name: 'Contraseña', type: 'text', length: 255, mandatory: true },
          { name: 'Nombre Completo', type: 'text', length: 100, mandatory: true },
          { name: 'Teléfono', type: 'text', length: 20, mandatory: false },
          { name: 'Estado', type: 'boolean', mandatory: true },
        ],
        businessRules: 'Los usuarios deben tener un email único en el sistema. Las contraseñas deben cumplir con políticas de seguridad mínimas.',
        specialRequirements: 'El sistema debe soportar autenticación de dos factores y debe integrarse con Active Directory corporativo.',
        generateWireframes: true,
        wireframeDescriptions: [
          'Pantalla principal de gestión con tabla de usuarios y botones de acción',
          'Formulario de alta/edición de usuario con validaciones en tiempo real',
          'Modal de confirmación para eliminación de usuarios'
        ],
        alternativeFlows: [
          'Usuario intenta registrarse con email ya existente',
          'Error de conexión con Active Directory durante autenticación',
          'Sesión expira durante la edición de un usuario'
        ],
        // Campos específicos para tipos de casos de uso
        apiEndpoint: '',
        requestFormat: '',
        responseFormat: '',
        serviceFrequency: '',
        executionTime: '',
        configurationPaths: '',
        webServiceCredentials: '',
        generateTestCase: false,
        testCaseObjective: '',
        testCasePreconditions: '',
        testSteps: [],
        aiModel: prev.aiModel,
        wireframesDescription: '',
        alternativeFlowsDescription: ''
      };
    });
  }, []);

  const loadComplexExample = useCallback((type: UseCaseType) => {
    if (type === 'entity') {
      // Ejemplo complejo para entidades: Gestionar Clientes Premium
      setFormData(prev => ({
        useCaseType: 'entity',
        clientName: 'Banco Provincia',
        projectName: 'Gestión Integral de Clientes',
        useCaseCode: 'CL005',
        useCaseName: 'Gestionar Clientes Premium',
        fileName: 'BP005GestionarClientesPremium',
        description: 'Este caso de uso permite al operador del área de atención gestionar los datos de clientes del segmento Premium. Incluye funcionalidades de búsqueda, alta, modificación y eliminación de clientes, validando condiciones específicas según políticas del banco. También se contemplan reglas para relaciones con cuentas activas, restricciones por morosidad y auditoría de cambios.',
        filtersDescription: '',
        columnsDescription: '',
        fieldsDescription: '',
        searchFilters: [
          'Número de cliente',
          'Apellido', 
          'DNI',
          'Segmento',
          'Estado',
          'Fecha de alta desde',
          'Fecha de alta hasta',
          'Usuario de alta'
        ],
        resultColumns: [
          'Número de cliente',
          'Nombre completo',
          'DNI',
          'Segmento',
          'Estado',
          'Fecha de alta',
          'Usuario de alta'
        ],
        entityFields: [
          { name: 'Nombre', type: 'text', length: 50, mandatory: true },
          { name: 'Apellido', type: 'text', length: 50, mandatory: true },
          { name: 'DNI', type: 'number', length: 8, mandatory: true },
          { name: 'Fecha de nacimiento', type: 'date', mandatory: true },
          { name: 'Email', type: 'email', length: 100, mandatory: true },
          { name: 'Teléfono', type: 'number', length: 15, mandatory: false },
          { name: 'Segmento', type: 'text', length: 20, mandatory: true },
          { name: 'Ingresos anuales', type: 'number', length: 12, mandatory: false },
          { name: 'Es cliente activo', type: 'boolean', mandatory: true },
          { name: 'Tiene productos activos', type: 'boolean', mandatory: false },
          { name: 'Fecha de alta', type: 'date', mandatory: true },
          { name: 'Usuario de alta', type: 'text', length: 50, mandatory: true },
          { name: 'Fecha de modificación', type: 'date', mandatory: false },
          { name: 'Usuario de modificación', type: 'text', length: 50, mandatory: false }
        ],
        businessRules: `• El DNI debe ser único
• No se puede eliminar un cliente con productos activos
• El email debe tener formato válido
• Solo usuarios con rol Supervisor pueden modificar el campo "Segmento"
• Segmento "Black" requiere ingresos anuales > $5.000.000
• Al alta, el cliente queda automáticamente con estado "Activo"`,
        specialRequirements: `• Integración con servicio externo de scoring crediticio al momento del alta
• Combo "Segmento" cargado dinámicamente desde tabla paramétrica
• Registro automático en bitácora de alta/modificación/eliminación
• Usuario de alta/modificación se toma de la sesión activa
• Validación de DNI duplicado al guardar`,
        generateWireframes: true,
        wireframeDescriptions: [
          'Buscador de Clientes: Filtros (Número de cliente, Apellido, DNI, Segmento, Estado, Fecha de alta desde/hasta, Usuario de alta), Botones (Buscar, Limpiar, Agregar nuevo), Tabla paginada con columnas (Nro Cliente, Nombre completo, DNI, Segmento, Estado, Fecha Alta, Usuario Alta), Acciones por fila (Editar, Eliminar)',
          'Formulario de Alta/Edición: Campos (Nombre, Apellido, DNI, Fecha de nacimiento, Email, Teléfono, Segmento, Es cliente activo), Campos de solo lectura (Fecha de alta, Usuario de alta, Fecha y usuario de modificación), Validaciones (formato de email, DNI único), Botones (Aceptar, Cancelar)'
        ],
        alternativeFlows: [
          'Modificar o actualizar una entidad: Buscar un cliente existente, Seleccionar el registro y hacer clic en "Editar", Modificar campos permitidos (Email, Segmento, Estado), Registrar fecha y usuario de modificación',
          'Eliminar una entidad: Validar que el cliente no tenga productos activos, Confirmar eliminación, Registrar fecha y usuario de eliminación'
        ],
        // Campos específicos para tipos de casos de uso
        apiEndpoint: '',
        requestFormat: '',
        responseFormat: '',
        serviceFrequency: '',
        executionTime: '',
        configurationPaths: '',
        webServiceCredentials: '',
        aiModel: prev.aiModel
      }));
    } else if (type === 'api') {
      // Ejemplo complejo para APIs: Consulta de Saldos
      setFormData(prev => ({
        useCaseType: 'api',
        clientName: 'Banco Ciudad',
        projectName: 'Core Bancario Digital',
        useCaseCode: 'API007',
        useCaseName: 'Consultar Saldos y Movimientos via API',
        fileName: 'BC007ConsultaSaldos',
        description: 'Este servicio API permite consultar saldos de cuentas y últimos movimientos de un cliente específico. Requiere autenticación OAuth2, valida permisos del usuario consultante y retorna información consolidada de todas las cuentas del cliente. Incluye logging para auditoría y manejo de errores estándar.',
        filtersDescription: '',
        columnsDescription: '',
        fieldsDescription: '',
        apiEndpoint: '/api/v2/clientes/{clienteId}/saldos',
        requestFormat: `{
  "clienteId": "12345678",
  "incluirMovimientos": true,
  "cantidadMovimientos": 10,
  "tiposCuenta": ["CA", "CC", "AH"],
  "fechaDesde": "2024-01-01",
  "fechaHasta": "2024-01-31"
}

Headers:
- Authorization: Bearer {token}
- Content-Type: application/json
- X-Request-ID: {uuid}`,
        responseFormat: `{
  "status": "success",
  "data": {
    "clienteId": "12345678",
    "nombreCompleto": "Juan Pérez",
    "fechaConsulta": "2024-01-27T10:30:00Z",
    "cuentas": [
      {
        "numeroCuenta": "1234567890",
        "tipoCuenta": "CA",
        "moneda": "ARS",
        "saldoDisponible": 150000.50,
        "saldoContable": 155000.50,
        "ultimosMovimientos": [
          {
            "fecha": "2024-01-26",
            "descripcion": "Transferencia recibida",
            "importe": 5000.00,
            "tipo": "CR"
          }
        ]
      }
    ]
  },
  "requestId": "req-123456"
}

Códigos de Error:
- 400: Parámetros inválidos
- 401: No autorizado
- 404: Cliente no encontrado
- 500: Error interno`,
        businessRules: `• Solo usuarios autenticados pueden consultar saldos
• Un usuario solo puede consultar sus propias cuentas o las de clientes asignados
• Máximo 50 movimientos por consulta
• Cuentas cerradas no se incluyen en la respuesta
• Timeout de respuesta: 30 segundos máximo
• Rate limiting: 100 requests por minuto por usuario`,
        specialRequirements: `• Implementar OAuth2 con scope "account:read"
• Logging completo de requests/responses para auditoría
• Cache de respuestas por 5 minutos para optimizar performance
• Manejo de circuit breaker para servicios externos
• Encriptación de datos sensibles en logs
• Validación de HTTPS obligatorio`,
        generateWireframes: false,
        wireframeDescriptions: [''],
        alternativeFlows: [
          'Error de autenticación: Retornar 401 con mensaje descriptivo y redireccionar a login',
          'Cliente inexistente: Retornar 404 con código de error específico',
          'Timeout de base de datos: Retornar 503 con mensaje de servicio temporalmente no disponible'
        ],
        // Campos específicos para otros tipos
        searchFilters: [''],
        resultColumns: [''],
        entityFields: [{ name: '', type: 'text', length: undefined, mandatory: false }],
        serviceFrequency: '',
        executionTime: '',
        configurationPaths: '',
        webServiceCredentials: '',
        aiModel: prev.aiModel
      }));
    } else if (type === 'service') {
      // Ejemplo complejo para servicios: Proceso de Cierre Diario
      setFormData(prev => ({
        useCaseType: 'service',
        clientName: 'Banco Macro',
        projectName: 'Automatización de Procesos Batch',
        useCaseCode: 'PROC012',
        useCaseName: 'Ejecutar Cierre Diario Contable',
        fileName: 'BM012CierreDiario',
        description: 'Proceso automático que se ejecuta diariamente para realizar el cierre contable del día. Incluye cálculo de intereses, actualización de saldos, generación de reportes regulatorios, backup de transacciones y notificaciones a áreas involucradas. Maneja rollback automático en caso de errores críticos.',
        filtersDescription: '',
        columnsDescription: '',
        fieldsDescription: '',
        serviceFrequency: 'Diario a las 02:00 AM',
        executionTime: '02:00 AM - Tiempo estimado: 45-60 minutos',
        configurationPaths: `• Ruta de archivos de salida: /batch/cierre/[YYYYMMDD]/
• Configuración de conexiones DB: /config/database/cierre.properties
• Templates de reportes: /templates/regulatorios/
• Scripts SQL: /sql/cierre_diario/
• Logs del proceso: /logs/batch/cierre_[YYYYMMDD].log`,
        webServiceCredentials: `• Usuario/clave para base de datos contable (configurable)
• Credenciales FTP para envío de archivos al BCRA (configurables)
• Token de autenticación para API de notificaciones (configurable)
• Usuario LDAP para acceso a directorios compartidos (configurable)`,
        businessRules: `• Solo se puede ejecutar un proceso de cierre por día
• Si hay transacciones pendientes de autorización, el proceso se pausa hasta resolverlas
• Los intereses se calculan sobre saldos promedio del día
• Backup obligatorio antes de cualquier actualización masiva
• Notificación automática a Gerencia si el proceso tarda más de 90 minutos
• Rollback automático si cualquier validación crítica falla`,
        specialRequirements: `• Monitoreo en tiempo real del progreso del proceso
• Capacidad de pausar/reanudar el proceso manualmente
• Generación automática de checkpoints cada 15 minutos
• Integración con sistema de alertas para errores críticos
• Compatibilidad con modo de recuperación ante desastres
• Archivado automático de logs después de 90 días`,
        generateWireframes: true,
        wireframeDescriptions: [
          'Panel de Monitoreo: Estado del proceso en tiempo real, barra de progreso, tiempo transcurrido/estimado, últimas transacciones procesadas, botones para pausar/reanudar/cancelar',
          'Log de Ejecución: Vista de logs en tiempo real con filtros por nivel (Info, Warning, Error), búsqueda por texto, exportación de logs, refresh automático'
        ],
        alternativeFlows: [
          'Error en validación de saldos: Pausar proceso, notificar a supervisor, mostrar discrepancias encontradas, permitir corrección manual y reanudación',
          'Falla de conexión con BCRA: Intentar reenvío automático 3 veces, si falla generar archivo local y notificar para envío manual'
        ],
        // Campos específicos para otros tipos
        searchFilters: [''],
        resultColumns: [''],
        entityFields: [{ name: '', type: 'text', length: undefined, mandatory: false }],
        apiEndpoint: '',
        requestFormat: '',
        responseFormat: '',
        aiModel: prev.aiModel
      }));
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      useCaseType: 'entity',
      clientName: '',
      projectName: '',
      useCaseCode: '',
      useCaseName: '',
      fileName: '',
      description: '',
      filtersDescription: '',
      columnsDescription: '',
      fieldsDescription: '',
      searchFilters: [''],
      resultColumns: [''],
      entityFields: [{
        name: '',
        type: 'text',
        length: undefined,
        mandatory: false
      }],
      businessRules: '',
      specialRequirements: '',
      generateWireframes: false,
      wireframeDescriptions: [''],
      // Campos específicos para tipos de casos de uso
      apiEndpoint: '',
      requestFormat: '',
      responseFormat: '',
      serviceFrequency: '',
      executionTime: '',
      configurationPaths: '',
      webServiceCredentials: '',
      // Test case fields
      generateTestCase: false,
      testCaseObjective: '',
      testCasePreconditions: '',
      testSteps: [],
      aiModel: 'gemini'
    });
    setCurrentStep(1);
  }, []);



  return {
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    addSearchFilter,
    removeSearchFilter,
    updateSearchFilter,
    addResultColumn,
    removeResultColumn,
    updateResultColumn,
    addEntityField,
    removeEntityField,
    updateEntityField,
    addWireframeDescription,
    removeWireframeDescription,
    updateWireframeDescription,
    addTestStep,
    removeTestStep,
    updateTestStep,
    validateStep,
    loadDemoData,
    loadComplexExample,
    resetForm
  };
}
