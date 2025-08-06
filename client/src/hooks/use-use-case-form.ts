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


  const resetForm = useCallback(() => {
    setFormData({
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
    resetForm
  };
}
