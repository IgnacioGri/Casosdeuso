# Catálogo de Prompts del Sistema de Generación de Casos de Uso

Este documento contiene todos los prompts utilizados en el sistema, diferenciados por plataforma (React/TypeScript vs C#/Blazor).

## Índice
1. [Generación Principal de Casos de Uso](#1-generación-principal-de-casos-de-uso)
   - [TypeScript/React](#11-typescriptreact)
   - [C#/Blazor](#12-csharp-blazor)
2. [Edición de Casos de Uso](#2-edición-de-casos-de-uso)
   - [TypeScript/React](#21-typescriptreact-1)
   - [C#/Blazor](#22-csharp-blazor-1)
3. [Asistencia AI para Campos Individuales](#3-asistencia-ai-para-campos-individuales)
   - [TypeScript/React](#31-typescriptreact-2)
   - [C#/Blazor](#32-csharp-blazor-2)
4. [Análisis de Minutas](#4-análisis-de-minutas)
   - [TypeScript/React](#41-typescriptreact-3)
   - [C#/Blazor](#42-csharp-blazor-3)
5. [Generación Inteligente de Casos de Prueba](#5-generación-inteligente-de-casos-de-prueba)
   - [TypeScript/React](#51-typescriptreact-4)
   - [C#/Blazor](#52-csharp-blazor-4)
6. [Prompts Específicos por Tipo de Caso de Uso](#6-prompts-específicos-por-tipo-de-caso-de-uso)
7. [Configuración de Modelos AI](#7-configuración-de-modelos-ai)

---

## 1. Generación Principal de Casos de Uso

### 1.1. TypeScript/React

**Ubicación**: `server/services/ai-service.ts` - método `buildPrompt()`

```typescript
// Prompt base en TypeScript
const basePrompt = `
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

${rules}

DATOS DEL FORMULARIO COMPLETOS:
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${JSON.stringify(formData.searchFilters)}
- Columnas de resultado: ${JSON.stringify(formData.resultColumns)}
- Campos de entidad: ${JSON.stringify(formData.entityFields)}
- Reglas de negocio: ${formData.businessRules}
- Requerimientos especiales: ${formData.specialRequirements}
- Generar wireframes: ${formData.generateWireframes}
- Descripciones de wireframes: ${JSON.stringify(formData.wireframeDescriptions)}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
`;
```

**Mensaje de Sistema TypeScript**:
```typescript
const systemMessage = "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.";
```

### 1.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs` - método `BuildPrompt()`

```csharp
// Prompt base en C#
var basePrompt = $@"
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
- Tipo de caso de uso: {formData.UseCaseType}
- Cliente: {formData.ClientName}
- Proyecto: {formData.ProjectName}
- Código: {formData.UseCaseCode}
- Nombre: {formData.UseCaseName}
- Archivo: {formData.FileName}
- Descripción: {formData.Description}
- Filtros de búsqueda: {JsonSerializer.Serialize(formData.SearchFilters)}
- Columnas de resultado: {JsonSerializer.Serialize(formData.ResultColumns)}
- Campos de entidad: {JsonSerializer.Serialize(formData.EntityFields)}
- Reglas de negocio: {formData.BusinessRules}
- Requerimientos especiales: {formData.SpecialRequirements}
- Generar wireframes: {formData.GenerateWireframes}
- Descripciones de wireframes: {JsonSerializer.Serialize(formData.WireframeDescriptions)}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
";
```

**Mensaje de Sistema C#**:
```csharp
var systemMessage = "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.";
```

---

## 2. Edición de Casos de Uso

### 2.1. TypeScript/React

**Ubicación**: `server/services/ai-service.ts` - método `editUseCase()`

```typescript
// Prompt de edición en TypeScript
const editPrompt = `
Eres un experto en documentación de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: "${instructions}"

Documento actual:
${content}

INSTRUCCIONES:
- Mantén la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la información no afectada por los cambios
- Asegúrate de que el documento siga siendo coherente y profesional
- Mantén el estilo y formato corporativo ING
`;

// Token configuration para edición
const editTokens = 16000; // Para documentos completos
const temperature = 0.3;
```

### 2.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs` - método `EditUseCaseAsync()`

```csharp
// Prompt de edición en C#
var editPrompt = $@"
Eres un experto en documentación de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: ""{instructions}""

Documento actual:
{content}

INSTRUCCIONES:
- Mantén la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la información no afectada por los cambios
- Asegúrate de que el documento siga siendo coherente y profesional
- Mantén el estilo y formato corporativo ING
";

// Token configuration para edición
int editTokens = 16000; // Para documentos completos
float temperature = 0.3f;
```

---

## 3. Asistencia AI para Campos Individuales

### 3.1. TypeScript/React

**Ubicación**: `server/services/ai-service.ts` - método `improveField()`

```typescript
// Contextos disponibles en TypeScript
const getContext = (isFinancialProject: boolean): string => {
  if (isFinancialProject) {
    return `Contexto: Estás trabajando en un proyecto bancario/financiero.
- El lenguaje debe ser formal y profesional
- Usa terminología bancaria apropiada
- Considera regulaciones y compliance
- Incluye aspectos de seguridad cuando sea relevante`;
  } else {
    return `Contexto: Estás trabajando en un proyecto empresarial/corporativo.
- Mantén un tono profesional pero accesible
- Usa terminología de negocio estándar
- Enfócate en eficiencia y productividad
- Considera múltiples departamentos y stakeholders`;
  }
};

// Prompts específicos por campo en TypeScript
const fieldPrompts = {
  useCaseName: `Mejora el nombre del caso de uso siguiendo estas reglas:
- DEBE comenzar con un verbo en infinitivo (ej: Gestionar, Consultar, Registrar, Actualizar)
- Debe ser claro y específico sobre la acción principal
- Máximo 5-6 palabras
- Evita términos técnicos o de implementación
- Ejemplo correcto: "Gestionar Información del Cliente"
- Ejemplo incorrecto: "CRUD de Clientes" o "Pantalla de Clientes"`,

  description: `Expande y mejora esta descripción de caso de uso:
- Genera 1-2 párrafos completos (mínimo 150 palabras)
- Primer párrafo: explica QUÉ hace el caso de uso y su propósito
- Segundo párrafo: describe los BENEFICIOS y valor de negocio
- Incluye explicación de alcance/objetivo como en minuta ING
- Si aplica, menciona flujos principales con lista indentada (1-a-i):
  1. Flujo principal (ej. Buscar [entidad])
    a. Detallar filtros y columnas
    i. Criterios de búsqueda
- Usa un tono profesional pero claro
- Incluye contexto relevante del negocio`,

  businessRules: `Mejora las reglas de negocio considerando:
- Cada regla debe ser clara, específica y verificable
- Usa formato de lista numerada multi-nivel (1-a-i) si hay sub-reglas:
  1. Regla principal
    a. Sub-regla o detalle
    i. Especificación adicional
- Incluye validaciones, restricciones y políticas
- Considera aspectos regulatorios si aplica
- Para modificar/eliminar: incluir verificaciones
- Ejemplo: "1. El monto máximo por transferencia es de $50,000"`,

  specialRequirements: `Mejora los requerimientos especiales enfocándote en:
- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)
- Especifica métricas cuando sea posible
- Formatea como lista multi-nivel (1-a-i) si hay sub-requerimientos
- Considera integraciones con otros sistemas
- Ejemplo: "El sistema debe procesar 1000 transacciones por minuto"`
};

// Token configuration para campos
const fieldTokens = 4000; // Para campos individuales
const temperature = 0.3;
```

### 3.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs` - método `ImproveFieldAsync()`

```csharp
// Contextos disponibles en C#
private string GetContext(bool isFinancialProject)
{
    if (isFinancialProject)
    {
        return @"Contexto: Estás trabajando en un proyecto bancario/financiero.
- El lenguaje debe ser formal y profesional
- Usa terminología bancaria apropiada
- Considera regulaciones y compliance
- Incluye aspectos de seguridad cuando sea relevante";
    }
    else
    {
        return @"Contexto: Estás trabajando en un proyecto empresarial/corporativo.
- Mantén un tono profesional pero accesible
- Usa terminología de negocio estándar
- Enfócate en eficiencia y productividad
- Considera múltiples departamentos y stakeholders";
    }
}

// Prompts específicos por campo en C#
private Dictionary<string, string> FieldPrompts = new()
{
    ["useCaseName"] = @"Mejora el nombre del caso de uso siguiendo estas reglas:
- DEBE comenzar con un verbo en infinitivo (ej: Gestionar, Consultar, Registrar, Actualizar)
- Debe ser claro y específico sobre la acción principal
- Máximo 5-6 palabras
- Evita términos técnicos o de implementación
- Ejemplo correcto: ""Gestionar Información del Cliente""
- Ejemplo incorrecto: ""CRUD de Clientes"" o ""Pantalla de Clientes""",

    ["description"] = @"Expande y mejora esta descripción de caso de uso:
- Genera 1-2 párrafos completos (mínimo 150 palabras)
- Primer párrafo: explica QUÉ hace el caso de uso y su propósito
- Segundo párrafo: describe los BENEFICIOS y valor de negocio
- Incluye explicación de alcance/objetivo como en minuta ING
- Si aplica, menciona flujos principales con lista indentada (1-a-i):
  1. Flujo principal (ej. Buscar [entidad])
    a. Detallar filtros y columnas
    i. Criterios de búsqueda
- Usa un tono profesional pero claro
- Incluye contexto relevante del negocio",

    ["businessRules"] = @"Mejora las reglas de negocio considerando:
- Cada regla debe ser clara, específica y verificable
- Usa formato de lista numerada multi-nivel (1-a-i) si hay sub-reglas:
  1. Regla principal
    a. Sub-regla o detalle
    i. Especificación adicional
- Incluye validaciones, restricciones y políticas
- Considera aspectos regulatorios si aplica
- Para modificar/eliminar: incluir verificaciones
- Ejemplo: ""1. El monto máximo por transferencia es de $50,000""",

    ["specialRequirements"] = @"Mejora los requerimientos especiales enfocándote en:
- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)
- Especifica métricas cuando sea posible
- Formatea como lista multi-nivel (1-a-i) si hay sub-requerimientos
- Considera integraciones con otros sistemas
- Ejemplo: ""El sistema debe procesar 1000 transacciones por minuto"""
};

// Token configuration para campos
int fieldTokens = 4000; // Para campos individuales
float temperature = 0.3f;
```

---

## 4. Análisis de Minutas

### 4.1. TypeScript/React

**Ubicación**: `server/services/minute-analysis-service.ts`

```typescript
// Prompt principal de análisis en TypeScript
const analyzeMinutePrompt = `
Analiza el siguiente contenido de minuta y extrae la información relevante para un caso de uso de tipo ${useCaseType}.

INSTRUCCIONES CRÍTICAS:
1. Extrae SOLO información explícitamente mencionada en la minuta
2. NO inventes ni supongas información que no esté presente
3. Si un campo no tiene información en la minuta, déjalo vacío o con valor por defecto
4. Mantén la fidelidad al documento original

CONTENIDO DE LA MINUTA:
${minuteContent}

FORMATO DE RESPUESTA REQUERIDO:
Debes responder ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:

{
  "clientName": "nombre del cliente mencionado en la minuta",
  "projectName": "nombre del proyecto mencionado",
  "useCaseCode": "código si se menciona, sino usar el fileName",
  "useCaseName": "nombre del caso de uso (debe empezar con verbo en infinitivo)",
  "fileName": "${fileName}",
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
- Auto-incluir campos de auditoría:
  • fechaAlta (date, mandatory)
  • usuarioAlta (text, mandatory)
  • fechaModificacion (date, optional)
  • usuarioModificacion (text, optional)
`;

// Configuración para análisis de minutas
const minuteAnalysisTokens = 10000; // Token limit específico para minutas
const temperature = 0.3;
```

### 4.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/MinuteAnalysisService.cs`

```csharp
// Prompt principal de análisis en C#
var analyzeMinutePrompt = $@"
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

{{
  ""clientName"": ""nombre del cliente mencionado en la minuta"",
  ""projectName"": ""nombre del proyecto mencionado"",
  ""useCaseCode"": ""código si se menciona, sino usar el fileName"",
  ""useCaseName"": ""nombre del caso de uso (debe empezar con verbo en infinitivo)"",
  ""fileName"": ""{fileName}"",
  ""description"": ""descripción detallada extraída de la minuta (1-2 párrafos)"",
  ""businessRules"": ""reglas de negocio mencionadas"",
  ""specialRequirements"": ""requerimientos especiales o no funcionales"",
  ""actorName"": ""actor principal del caso de uso"",
  ""searchFilters"": [""filtro1"", ""filtro2""],
  ""resultColumns"": [""columna1"", ""columna2""],
  ""entityFields"": [
    {{
      ""name"": ""nombreCampo"",
      ""type"": ""text|number|date|boolean|decimal|datetime"",
      ""mandatory"": true/false,
      ""length"": 50,
      ""description"": ""descripción del campo"",
      ""validationRules"": ""reglas de validación""
    }}
  ],
  ""wireframeDescriptions"": [""descripción de pantalla 1"", ""descripción de pantalla 2""],
  ""extractedInfo"": {{
    ""additionalNotes"": ""cualquier información adicional relevante"",
    ""assumptions"": ""suposiciones o supuestos mencionados"",
    ""constraints"": ""restricciones identificadas""
  }}
}}

REGLAS PARA CAMPOS DE ENTIDAD:
- Para montos monetarios usar tipo ""decimal""
- Para IDs usar tipo ""number""
- Incluir SIEMPRE description y validationRules para cada campo
- El length es obligatorio para campos de texto
- Auto-incluir campos de auditoría:
  • fechaAlta (date, mandatory)
  • usuarioAlta (text, mandatory)
  • fechaModificacion (date, optional)
  • usuarioModificacion (text, optional)
";

// Configuración para análisis de minutas
int minuteAnalysisTokens = 10000; // Token limit específico para minutas
float temperature = 0.3f;
```

---

## 5. Generación Inteligente de Casos de Prueba

### 5.1. TypeScript/React

**Ubicación**: `server/services/intelligent-test-case-service.ts`

```typescript
// Prompt principal para casos de prueba en TypeScript
const testCasePrompt = `
Como experto en QA y testing de software, genera casos de prueba profesionales para el siguiente caso de uso.

CONTEXTO DEL CASO DE USO:
${JSON.stringify(context)}

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
      "observations": "Observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba"
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
`;

// Configuración para casos de prueba
const testCaseTokens = 12000; // Token limit para casos de prueba
const temperature = 0.3;
```

### 5.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/IntelligentTestCaseService.cs`

```csharp
// Prompt principal para casos de prueba en C#
var testCasePrompt = $@"
Como experto en QA y testing de software, genera casos de prueba profesionales para el siguiente caso de uso.

CONTEXTO DEL CASO DE USO:
{JsonSerializer.Serialize(context)}

INSTRUCCIONES CRÍTICAS:
1. Genera entre 5 y 10 pasos de prueba detallados y específicos
2. Cada paso debe ser ejecutable y verificable
3. Incluye tanto flujos principales como alternativos
4. Considera casos límite y validaciones
5. Genera precondiciones realistas y específicas

FORMATO DE RESPUESTA OBLIGATORIO:
{{
  ""objective"": ""Objetivo detallado de las pruebas (1-2 párrafos)"",
  ""preconditions"": ""• Usuario con permisos...\n• Sistema configurado...\n• Datos de prueba..."",
  ""testSteps"": [
    {{
      ""number"": 1,
      ""action"": ""Acción específica y clara"",
      ""inputData"": ""Datos de entrada detallados"",
      ""expectedResult"": ""Resultado esperado verificable"",
      ""observations"": ""Observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba""
    }}
  ],
  ""analysisNotes"": ""Notas sobre cobertura, riesgos o consideraciones especiales""
}}

REQUISITOS:
- El objetivo debe explicar QUÉ se prueba y POR QUÉ es importante
- Las precondiciones deben estar categorizadas (Usuario, Sistema, Datos, Infraestructura)
- Cada paso debe ser independiente y atómico
- Los datos de entrada deben ser específicos (no genéricos)
- Los resultados esperados deben ser medibles
";

// Configuración para casos de prueba
int testCaseTokens = 12000; // Token limit para casos de prueba
float temperature = 0.3f;
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
      d. Incluir ejemplo detallado de request completo
   
   3. Response
      a. Formato: JSON/XML con estructura de respuesta
      b. Códigos de estado exitosos (200, 201, 204)
      c. Estructura de datos de respuesta con tipos
      d. Incluir ejemplo detallado de response completo

2. FLUJOS ALTERNATIVOS
   1. Errores de validación (400)
   2. Errores de autorización (401/403)
   3. Errores del servidor (500)
   4. Timeouts y reintentos

IMPORTANTE: Incluye detalle de request/response en flujos, con ejemplos JSON completos
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

3. REQUERIMIENTOS ESPECIALES
- Indicar configurables específicos del proceso:
  a. Path para archivos de configuración y datos
  b. Usuario/clave/URL para web services externos
  c. Parámetros de ejecución modificables sin recompilación
  d. Variables de entorno requeridas
```

---

## Notas de Implementación

1. **Consistencia**: Todos los prompts siguen la misma estructura y tono profesional
2. **Contexto**: Los prompts incluyen contexto específico del dominio bancario/empresarial
3. **Formato**: Se evita pedir HTML, enfocándose en contenido estructurado
4. **Validación**: Se incluyen reglas de validación específicas para cada tipo de dato
5. **Sincronización**: Los prompts están sincronizados entre TypeScript y C#

## 7. Configuración de Modelos AI

### 7.1. TypeScript/React

**Ubicación**: `server/services/ai-service.ts`

```typescript
// Configuración de tokens por servicio
const tokenLimits = {
  documentGeneration: 16000,  // Para generación de documentos completos
  testCaseGeneration: 12000,  // Para casos de prueba
  minuteAnalysis: 10000,      // Para análisis de minutas
  fieldImprovement: 4000      // Para campos individuales
};

// Temperatura estándar
const temperature = 0.3;

// Orden de cascada (fallback)
const fallbackOrder = [
  'copilot',  // Si está configurado
  'gemini',   // gemini-2.5-flash
  'openai',   // gpt-4o
  'claude',   // claude-sonnet-4-20250514
  'grok'      // grok-2-1212
];
```

### 7.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs`

```csharp
// Configuración de tokens por servicio
private static class TokenLimits
{
    public const int DocumentGeneration = 16000;  // Para generación de documentos completos
    public const int TestCaseGeneration = 12000;  // Para casos de prueba
    public const int MinuteAnalysis = 10000;      // Para análisis de minutas
    public const int FieldImprovement = 4000;     // Para campos individuales
}

// Temperatura estándar
private const float Temperature = 0.3f;

// Orden de cascada (fallback)
private readonly List<string> FallbackOrder = new()
{
    "copilot",  // Si está configurado
    "gemini",   // gemini-2.5-flash
    "openai",   // gpt-4o
    "claude",   // claude-sonnet-4-20250514
    "grok"      // grok-2-1212
};
```

### Modelos Específicos por Proveedor

| Proveedor | Modelo | Notas |
|-----------|--------|-------|
| OpenAI | gpt-4o | Modelo más reciente |
| Claude | claude-sonnet-4-20250514 | Versión más actualizada |
| Gemini | gemini-2.5-flash | Optimizado para velocidad |
| Grok | grok-2-1212 | API compatible con OpenAI |
| Copilot | Varía | Según configuración corporativa |