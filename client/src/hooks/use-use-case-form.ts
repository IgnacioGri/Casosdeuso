import { useState, useCallback } from 'react';
import { UseCaseFormData, EntityField } from '@/types/use-case';

export function useUseCaseForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UseCaseFormData>({
    useCaseType: 'entity',
    clientName: '',
    projectName: '',
    useCaseCode: '',
    useCaseName: '',
    fileName: '',
    description: '',
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
    alternativeFlows: [''],
    // Campos específicos para tipos de casos de uso
    apiEndpoint: '',
    requestFormat: '',
    responseFormat: '',
    serviceFrequency: '',
    executionTime: '',
    configurationPaths: '',
    webServiceCredentials: '',
    aiModel: 'demo'
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

  // Alternative flows management
  const addAlternativeFlow = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      alternativeFlows: [...(prev.alternativeFlows || []), '']
    }));
  }, []);

  const removeAlternativeFlow = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      alternativeFlows: (prev.alternativeFlows || []).filter((_, i) => i !== index)
    }));
  }, []);

  const updateAlternativeFlow = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      alternativeFlows: (prev.alternativeFlows || []).map((flow, i) => 
        i === index ? value : flow
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
        const infinitiveVerbs = ['gestionar', 'crear', 'actualizar', 'eliminar', 'consultar', 'registrar', 'modificar', 'validar', 'procesar', 'generar', 'obtener', 'establecer', 'configurar', 'sincronizar', 'enviar', 'recibir', 'ver', 'mostrar', 'listar', 'buscar', 'filtrar', 'exportar', 'importar', 'calcular', 'analizar', 'reportar'];
        const startsWithInfinitive = infinitiveVerbs.some(verb => 
          formData.useCaseName.toLowerCase().startsWith(verb)
        );
        return !!(formData.useCaseName && formData.fileName && formData.description && startsWithInfinitive); // Use Case Details
      case 5:
        return formData.useCaseType !== 'entity' || formData.searchFilters.some(f => f.trim()); // Search Filters (Entity only)
      case 6:
        return formData.useCaseType !== 'entity' || formData.resultColumns.some(c => c.trim()); // Result Columns (Entity only)
      case 7:
        return formData.useCaseType !== 'entity' || formData.entityFields.some(f => f.name.trim()); // Entity Fields (Entity only)
      case 8:
        return true; // Optional fields (Business Rules)
      case 9:
        return true; // Review step
      default:
        return true;
    }
  }, [formData]);

  const loadDemoData = useCallback(() => {
    setFormData(prev => ({
      useCaseType: 'entity',
      clientName: 'Banco Nacional de Argentina',
      projectName: 'Sistema de Gestión de Usuarios',
      useCaseCode: 'UC001',
      useCaseName: 'Gestionar Usuarios del Sistema',
      fileName: 'AB123GestionarUsuarios',
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
      aiModel: prev.aiModel // Mantiene el modelo seleccionado previamente
    }));
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
      alternativeFlows: [''],
      // Campos específicos para tipos de casos de uso
      apiEndpoint: '',
      requestFormat: '',
      responseFormat: '',
      serviceFrequency: '',
      executionTime: '',
      configurationPaths: '',
      webServiceCredentials: '',
      aiModel: 'demo'
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
    addAlternativeFlow,
    removeAlternativeFlow,
    updateAlternativeFlow,
    validateStep,
    loadDemoData,
    resetForm
  };
}
