# Catálogo de Prompts del Sistema de Generación de Casos de Uso

Este documento contiene todos los prompts utilizados en el sistema, organizados por categoría y con indicación de dónde se usan (TypeScript/C#).

## Índice
1. [Generación Principal de Casos de Uso](#1-generación-principal-de-casos-de-uso)
2. [Edición de Casos de Uso](#2-edición-de-casos-de-uso)
3. [Asistencia AI para Campos Individuales](#3-asistencia-ai-para-campos-individuales)
4. [Análisis de Minutas](#4-análisis-de-minutas)
5. [Generación Inteligente de Casos de Prueba](#5-generación-inteligente-de-casos-de-prueba)
6. [Prompts Específicos por Tipo de Caso de Uso](#6-prompts-específicos-por-tipo-de-caso-de-uso)

---

## 1. Generación Principal de Casos de Uso

### Prompt Base (TypeScript y C#)
**Ubicación**: 
- TypeScript: `server/services/ai-service.ts` - método `buildPrompt()`
- C#: `UseCaseGenerator.Server/Services/AIService.cs` - método `BuildPrompt()`

```
Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

INSTRUCCIÓN CRÍTICA PARA DESCRIPCIÓN: La sección de DESCRIPCIÓN debe contener OBLIGATORIAMENTE 1-2 párrafos completos y detallados (mínimo 150 palabras). Debe explicar:
- Primer párrafo: Qué hace el caso de uso, su propósito principal, qué procesos abarca, qué área de negocio atiende.
- Segundo párrafo: Beneficios clave, valor para el negocio, mejoras que aporta, problemas que resuelve.
NO generar descripciones de una sola línea. Expandir SIEMPRE la descripción proporcionada con contexto relevante del negocio bancario/empresarial.

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional:
   4. Flujo Básico
     4.1 Menú principal
     4.2 Subflujo: Búsqueda
       4.2.1 Ingreso de filtros
       4.2.2 Ejecución de búsqueda
     4.3 Subflujo: Alta
       4.3.1 Validación de datos
       4.3.2 Confirmación

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

{rules}

DATOS DEL FORMULARIO COMPLETOS:
- Tipo de caso de uso: {formData.useCaseType}
- Cliente: {formData.clientName}
- Proyecto: {formData.projectName}
- Código: {formData.useCaseCode}
- Nombre: {formData.useCaseName}
- Archivo: {formData.fileName}
- Descripción: {formData.description}
- Filtros de búsqueda: {formData.searchFilters}
- Columnas de resultado: {formData.resultColumns}
- Campos de entidad: {formData.entityFields con name, type, mandatory, length, description, validationRules}
- Reglas de negocio: {formData.businessRules}
- Requerimientos especiales: {formData.specialRequirements}
- Generar wireframes: {formData.generateWireframes}
- Descripciones de wireframes: {formData.wireframeDescriptions}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
```

### Mensaje de Sistema para cada Proveedor AI
**Todos los proveedores (OpenAI, Claude, Grok, Gemini, Copilot)**:
```
Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.
```

---

## 2. Edición de Casos de Uso

### Prompt de Edición (TypeScript y C#)
**Ubicación**: 
- TypeScript: `server/services/ai-service.ts` - método `editUseCase()`
- C#: `UseCaseGenerator.Server/Services/AIService.cs` - método `EditUseCaseAsync()`

```
Eres un experto en documentación de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: "{instructions}"

Documento actual:
{content}

INSTRUCCIONES:
- Mantén la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la información no afectada por los cambios
- Asegúrate de que el documento siga siendo coherente y profesional
- Mantén el estilo y formato corporativo ING
```

---

## 3. Asistencia AI para Campos Individuales

### Prompt Base para Mejora de Campos
**Ubicación**: 
- TypeScript: `server/services/ai-service.ts` - método `improveField()`
- C#: `UseCaseGenerator.Server/Services/AIService.cs` - método `ImproveFieldAsync()`

#### Contexto Bancario
```
Contexto: Estás trabajando en un proyecto bancario/financiero.
- El lenguaje debe ser formal y profesional
- Usa terminología bancaria apropiada
- Considera regulaciones y compliance
- Incluye aspectos de seguridad cuando sea relevante
```

#### Contexto Empresarial
```
Contexto: Estás trabajando en un proyecto empresarial/corporativo.
- Mantén un tono profesional pero accesible
- Usa terminología de negocio estándar
- Enfócate en eficiencia y productividad
- Considera múltiples departamentos y stakeholders
```

### Prompts Específicos por Campo

#### Campo: Nombre del Caso de Uso
```
Mejora el nombre del caso de uso siguiendo estas reglas:
- DEBE comenzar con un verbo en infinitivo (ej: Gestionar, Consultar, Registrar, Actualizar)
- Debe ser claro y específico sobre la acción principal
- Máximo 5-6 palabras
- Evita términos técnicos o de implementación
- Ejemplo correcto: "Gestionar Información del Cliente"
- Ejemplo incorrecto: "CRUD de Clientes" o "Pantalla de Clientes"
```

#### Campo: Descripción
```
Expande y mejora esta descripción de caso de uso:
- Genera 1-2 párrafos completos (mínimo 150 palabras)
- Primer párrafo: explica QUÉ hace el caso de uso y su propósito
- Segundo párrafo: describe los BENEFICIOS y valor de negocio
- Usa un tono profesional pero claro
- Incluye contexto relevante del negocio
```

#### Campo: Reglas de Negocio
```
Mejora las reglas de negocio considerando:
- Cada regla debe ser clara, específica y verificable
- Usa formato de lista numerada
- Incluye validaciones, restricciones y políticas
- Considera aspectos regulatorios si aplica
- Ejemplo: "1. El monto máximo por transferencia es de $50,000"
```

#### Campo: Requerimientos Especiales
```
Mejora los requerimientos especiales enfocándote en:
- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)
- Especifica métricas cuando sea posible
- Considera integraciones con otros sistemas
- Ejemplo: "El sistema debe procesar 1000 transacciones por minuto"
```

---

## 4. Análisis de Minutas

### Prompt Principal de Análisis
**Ubicación**: 
- TypeScript: `server/services/minute-analysis-service.ts`
- C#: `UseCaseGenerator.Server/Services/MinuteAnalysisService.cs`

```
Analiza el siguiente contenido de minuta y extrae la información relevante para un caso de uso de tipo {useCaseType}.

INSTRUCCIONES CRÍTICAS:
1. Extrae SOLO información explícitamente mencionada en la minuta
2. NO inventes ni supongas información que no esté presente
3. Si un campo no tiene información en la minuta, déjalo vacío o con valor por defecto
4. Mantén la fidelidad al documento original

CONTENIDO DE LA MINUTA:
{minuteContent}

FORMATO DE RESPUESTA REQUERIDO:
Debes responder ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:

{
  "clientName": "nombre del cliente mencionado en la minuta",
  "projectName": "nombre del proyecto mencionado",
  "useCaseCode": "código si se menciona, sino usar el fileName",
  "useCaseName": "nombre del caso de uso (debe empezar con verbo en infinitivo)",
  "fileName": "{fileName}",
  "description": "descripción detallada extraída de la minuta (1-2 párrafos)",
  "businessRules": "reglas de negocio mencionadas",
  "specialRequirements": "requerimientos especiales o no funcionales",
  "actorName": "actor principal del caso de uso",
  "searchFilters": ["filtro1", "filtro2"],
  "resultColumns": ["columna1", "columna2"],
  "entityFields": [
    {
      "name": "nombreCampo",
      "type": "text|number|date|boolean|decimal|datetime",
      "mandatory": true/false,
      "length": 50,
      "description": "descripción del campo",
      "validationRules": "reglas de validación"
    }
  ],
  "wireframeDescriptions": ["descripción de pantalla 1", "descripción de pantalla 2"],
  "extractedInfo": {
    "additionalNotes": "cualquier información adicional relevante",
    "assumptions": "suposiciones o supuestos mencionados",
    "constraints": "restricciones identificadas"
  }
}

REGLAS PARA CAMPOS DE ENTIDAD:
- Para montos monetarios usar tipo "decimal"
- Para IDs usar tipo "number"
- Incluir SIEMPRE description y validationRules para cada campo
- El length es obligatorio para campos de texto
```

---

## 5. Generación Inteligente de Casos de Prueba

### Prompt Principal
**Ubicación**: 
- TypeScript: `server/services/intelligent-test-case-service.ts`
- C#: `UseCaseGenerator.Server/Services/IntelligentTestCaseService.cs`

```
Como experto en QA y testing de software, genera casos de prueba profesionales para el siguiente caso de uso.

CONTEXTO DEL CASO DE USO:
{JSON.stringify(context)}

INSTRUCCIONES CRÍTICAS:
1. Genera entre 5 y 10 pasos de prueba detallados y específicos
2. Cada paso debe ser ejecutable y verificable
3. Incluye tanto flujos principales como alternativos
4. Considera casos límite y validaciones
5. Genera precondiciones realistas y específicas

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "objective": "Objetivo detallado de las pruebas (1-2 párrafos)",
  "preconditions": "• Usuario con permisos...\n• Sistema configurado...\n• Datos de prueba...",
  "testSteps": [
    {
      "number": 1,
      "action": "Acción específica y clara",
      "inputData": "Datos de entrada detallados",
      "expectedResult": "Resultado esperado verificable",
      "observations": "Consideraciones o puntos de atención"
    }
  ],
  "analysisNotes": "Notas sobre cobertura, riesgos o consideraciones especiales"
}

REQUISITOS:
- El objetivo debe explicar QUÉ se prueba y POR QUÉ es importante
- Las precondiciones deben estar categorizadas (Usuario, Sistema, Datos, Infraestructura)
- Cada paso debe ser independiente y atómico
- Los datos de entrada deben ser específicos (no genéricos)
- Los resultados esperados deben ser medibles
```

---

## 6. Prompts Específicos por Tipo de Caso de Uso

### Casos de Uso de Entidad
**Ubicación**: `server/routes.ts` - función `getUseCaseSpecificRules()`

```
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE GESTIÓN DE ENTIDADES:

FLUJO PRINCIPAL OBLIGATORIO:
1. Buscar datos de la entidad existente
   - Incluir filtros de búsqueda disponibles
   - Detallar columnas del resultado
   - Especificar ordenamiento y paginación

2. Agregar un nuevo registro
   - Listar todos los campos con sus validaciones
   - Incluir campos automáticos (fecha alta, usuario)
   - Describir el proceso de guardado

3. Modificar registro existente
   - Mostrar datos actuales
   - Validar cambios permitidos
   - Registrar auditoría de cambios

4. Eliminar registro (solo si aplica)
   - Validar dependencias
   - Confirmar acción
   - Registrar baja lógica/física

PRECONDICIONES Y POSTCONDICIONES para entidades:
- Precondiciones: Usuario autenticado, permisos específicos, sistema disponible
- Postcondiciones: Datos actualizados, logs generados, notificaciones enviadas
```

### Casos de Uso API/Web Service
```
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE API/WEB SERVICE:

ESTRUCTURA OBLIGATORIA:
1. FLUJO PRINCIPAL DE EVENTOS
   1. Identificación del servicio
      a. Endpoint: {definir URL completa}
      b. Método HTTP: GET/POST/PUT/DELETE
      c. Headers requeridos (Authorization, Content-Type, etc.)
   
   2. Request
      a. Formato: JSON/XML con estructura detallada
      b. Parámetros obligatorios con tipos y validaciones
      c. Parámetros opcionales y valores por defecto
   
   3. Response
      a. Formato: JSON/XML con estructura de respuesta
      b. Códigos de estado exitosos (200, 201, 204)
      c. Estructura de datos de respuesta

2. FLUJOS ALTERNATIVOS
   1. Errores de validación (400)
   2. Errores de autorización (401/403)
   3. Errores del servidor (500)
   4. Timeouts y reintentos
```

### Casos de Uso de Servicio/Proceso Automático
```
INSTRUCCIONES ESPECÍFICAS PARA CASOS DE USO DE SERVICIO/PROCESO AUTOMÁTICO:

ESTRUCTURA OBLIGATORIA:
1. FLUJO PRINCIPAL DE EVENTOS
   1. Programación de ejecución
      a. Frecuencia: diaria/semanal/mensual/por evento
      b. Hora específica con zona horaria
      c. Condiciones de activación
   
   2. Proceso de ejecución
      a. Inicialización y validación de prerequisites
      b. Lógica principal paso a paso
      c. Manejo de transacciones y rollback
   
   3. Finalización y logging
      a. Registro de resultados y métricas
      b. Notificaciones de completitud/errores
      c. Limpieza de recursos

2. FLUJOS ALTERNATIVOS
   1. Errores de configuración
   2. Fallos en dependencias externas
   3. Recuperación ante fallos
```

---

## Notas de Implementación

1. **Consistencia**: Todos los prompts siguen la misma estructura y tono profesional
2. **Contexto**: Los prompts incluyen contexto específico del dominio bancario/empresarial
3. **Formato**: Se evita pedir HTML, enfocándose en contenido estructurado
4. **Validación**: Se incluyen reglas de validación específicas para cada tipo de dato
5. **Sincronización**: Los prompts están sincronizados entre TypeScript y C#

## Configuración de Modelos AI

### Modelos y Tokens Máximos
- **OpenAI (GPT-4o)**: 4,000 tokens para generación base, 16,000 para documentos
- **Claude (claude-sonnet-4-20250514)**: 4,000 tokens base, 16,000 documentos
- **Gemini (gemini-2.5-flash)**: 16,000 tokens, temperatura 0.3
- **Grok (grok-2-1212)**: 4,000 tokens base, 16,000 documentos
- **Copilot**: 16,000 tokens para documentos, 500 para campos

### Orden de Cascada (Fallback)
1. Copilot (si está configurado)
2. Gemini
3. OpenAI
4. Claude
5. Grok