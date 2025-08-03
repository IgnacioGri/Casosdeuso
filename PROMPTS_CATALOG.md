# Catálogo de Prompts del Sistema de Generación de Casos de Uso

Este documento contiene todos los prompts utilizados en el sistema, diferenciados por plataforma (React/TypeScript vs C#/Blazor).

## ⚠️ CAMBIOS CRÍTICOS IMPLEMENTADOS (Agosto 2025)

### Mejoras de Robustez en Prompts
- **CRÍTICO**: Todos los ejemplos ahora están marcados como "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- **CRÍTICO**: Instrucciones explícitas para usar EXACTAMENTE los datos de formData y nunca valores genéricos como "Apellido", "DNI", "Segmento"
- **Fallback para actores**: "Si no hay actor explícito, usar 'Actor no identificado'"
- **Wireframes dinámicos**: Los wireframes ahora usan datos específicos del formulario en lugar de valores hardcoded

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
// Prompt base en TypeScript (ACTUALIZADO - Enero 2025)
const basePrompt = `
Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

⚠️ INSTRUCCIONES CRÍTICAS SOBRE EL USO DE EJEMPLOS Y DATOS:
1. NUNCA uses valores por defecto o genéricos como "Apellido", "DNI", "Segmento" salvo que sean EXACTAMENTE los especificados en los datos del formulario.
2. Cualquier ejemplo en este prompt está marcado como: "Ejemplo ilustrativo, no debe reproducirse salvo que aplique al caso específico".
3. SIEMPRE usa los valores EXACTOS proporcionados en formData (filtros, columnas, campos).
4. Si formData no especifica un valor, NO lo inventes. Indica "no especificado por el usuario".

INSTRUCCIÓN CRÍTICA PARA DESCRIPCIÓN: La sección de DESCRIPCIÓN debe contener OBLIGATORIAMENTE 1-2 párrafos completos y detallados (mínimo 150 palabras). Debe explicar:
- Primer párrafo: Qué hace el caso de uso, su propósito principal, qué procesos abarca, qué área de negocio atiende.
- Segundo párrafo: Beneficios clave, valor para el negocio, mejoras que aporta, problemas que resuelve.
NO generar descripciones de una sola línea. Expandir SIEMPRE la descripción proporcionada con contexto relevante del negocio bancario/empresarial.

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional:
   4. Flujo Básico (Ejemplo ilustrativo, no debe reproducirse salvo que aplique)
     4.1 Menú principal
     4.2 Subflujo: Búsqueda
       4.2.1 Ingreso de filtros
       4.2.2 Ejecución de búsqueda
     4.3 Subflujo: Alta
       4.3.1 Validación de datos
       4.3.2 Confirmación

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

INSTRUCCIONES PARA ACTORES:
- Si no hay actor explícito en los datos, usar: "Actor no identificado"
- NUNCA inventes actores como "Empleado Bancario" si no están especificados

${rules}

DATOS DEL FORMULARIO COMPLETOS (usar EXACTAMENTE estos valores):
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre: ${formData.useCaseName}
- Archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${formData.searchFilters?.length ? formData.searchFilters.join(", ") : "Ninguno especificado"}
- Columnas de resultado: ${formData.resultColumns?.length ? formData.resultColumns.join(", ") : "Ninguna especificada"}
- Campos de entidad: ${JSON.stringify(formData.entityFields)}
- Reglas de negocio: ${formData.businessRules || "Ninguna específica"}
- Requerimientos especiales: ${formData.specialRequirements || "Ninguno"}
- Generar wireframes: ${formData.generateWireframes ? "Sí" : "No"}
- Descripciones de wireframes: ${formData.wireframeDescriptions?.filter(w => w?.trim()).join("; ") || ""}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
- CRÍTICO: Usa SOLO los datos exactos proporcionados en formData
`;
```

**Mensaje de Sistema TypeScript**:
```typescript
const systemMessage = "Eres un experto en documentación de casos de uso. Genera documentos profesionales siguiendo exactamente las reglas proporcionadas.";
```

### 1.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs` - método `BuildPrompt()`

```csharp
// Prompt base en C# (ACTUALIZADO - Enero 2025)
var basePrompt = $@"
Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

⚠️ INSTRUCCIONES CRÍTICAS SOBRE EL USO DE EJEMPLOS Y DATOS:
1. NUNCA uses valores por defecto o genéricos como ""Apellido"", ""DNI"", ""Segmento"" salvo que sean EXACTAMENTE los especificados en los datos del formulario.
2. Cualquier ejemplo en este prompt está marcado como: ""Ejemplo ilustrativo, no debe reproducirse salvo que aplique al caso específico"".
3. SIEMPRE usa los valores EXACTOS proporcionados en formData (filtros, columnas, campos).
4. Si formData no especifica un valor, NO lo inventes. Indica ""no especificado por el usuario"".

INSTRUCCIÓN CRÍTICA PARA DESCRIPCIÓN: La sección de DESCRIPCIÓN debe contener OBLIGATORIAMENTE 1-2 párrafos completos y detallados (mínimo 150 palabras). Debe explicar:
- Primer párrafo: Qué hace el caso de uso, su propósito principal, qué procesos abarca, qué área de negocio atiende.
- Segundo párrafo: Beneficios clave, valor para el negocio, mejoras que aporta, problemas que resuelve.
NO generar descripciones de una sola línea. Expandir SIEMPRE la descripción proporcionada con contexto relevante del negocio bancario/empresarial.

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional:
   1. Flujo Básico (Ejemplo ilustrativo, no debe reproducirse salvo que aplique)
     a. Menú principal
       i. Ingreso de filtros
       ii. Ejecución de búsqueda
     b. Subflujo: Alta
       i. Validación de datos
       ii. Confirmación
   Indenta 0.2 pulgadas por nivel a la derecha.

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

INSTRUCCIONES PARA ACTORES:
- Si no hay actor explícito en los datos, usar: ""Actor no identificado""
- NUNCA inventes actores como ""Empleado Bancario"" si no están especificados

{rules}

DATOS DEL FORMULARIO COMPLETOS (usar EXACTAMENTE estos valores):
- Tipo de caso de uso: {formData.UseCaseType}
- Cliente: {formData.ClientName}
- Proyecto: {formData.ProjectName}
- Código: {formData.UseCaseCode}
- Nombre: {formData.UseCaseName}
- Archivo: {formData.FileName}
- Descripción: {formData.Description}
- Filtros de búsqueda: {(formData.SearchFilters?.Any() == true ? string.Join("", "", formData.SearchFilters) : ""Ninguno especificado"")}
- Columnas de resultado: {(formData.ResultColumns?.Any() == true ? string.Join("", "", formData.ResultColumns) : ""Ninguna especificada"")}
- Campos de entidad: {entityFieldsDescription}
- Reglas de negocio: {formData.BusinessRules ?? ""Ninguna específica""}
- Requerimientos especiales: {formData.SpecialRequirements ?? ""Ninguno""}
- Generar wireframes: {(formData.GenerateWireframes ? ""Sí"" : ""No"")}
{(formData.WireframeDescriptions?.Any(w => !string.IsNullOrWhiteSpace(w)) == true ? $""- Descripciones de wireframes: {string.Join(""; "", formData.WireframeDescriptions.Where(w => !string.IsNullOrWhiteSpace(w)))}"" : """")}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- Incluye título en MAYÚSCULAS con color azul RGB(0,112,192) en la sección inicial
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
- CRÍTICO: Usa SOLO los datos exactos proporcionados en formData
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
// Prompt principal para casos de prueba en TypeScript (ACTUALIZADO - Enero 2025)
const testCasePrompt = `
Como experto en QA y testing de software, genera casos de prueba profesionales para el siguiente caso de uso.

⚠️ INSTRUCCIONES CRÍTICAS SOBRE DATOS:
1. NUNCA uses datos genéricos como "Apellido", "DNI", "Segmento" en los casos de prueba
2. USA EXACTAMENTE los datos especificados en el contexto del caso de uso
3. Si el contexto no especifica datos, indica "datos a definir por el usuario"
4. Cualquier ejemplo genérico está marcado como: "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"

CONTEXTO DEL CASO DE USO:
${JSON.stringify(context)}

INSTRUCCIONES CRÍTICAS:
1. Genera entre 5 y 10 pasos de prueba detallados y específicos
2. Cada paso debe ser ejecutable y verificable
3. Incluye tanto flujos principales como alternativos
4. Considera casos límite y validaciones
5. Genera precondiciones realistas y específicas
6. USA SOLO los filtros, columnas y campos especificados en el contexto

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "objective": "Objetivo detallado de las pruebas (1-2 párrafos)",
  "preconditions": "• Usuario con permisos...\n• Sistema configurado...\n• Datos de prueba...",
  "testSteps": [
    {
      "number": 1,
      "action": "Acción específica y clara usando datos del contexto",
      "inputData": "Datos de entrada detallados del contexto específico",
      "expectedResult": "Resultado esperado verificable con datos del contexto",
      "observations": "Observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba"
    }
  ],
  "analysisNotes": "Notas sobre cobertura, riesgos o consideraciones especiales"
}

REQUISITOS:
- El objetivo debe explicar QUÉ se prueba y POR QUÉ es importante
- Las precondiciones deben estar categorizadas (Usuario, Sistema, Datos, Infraestructura)
- Cada paso debe ser independiente y atómico
- Los datos de entrada deben ser específicos del contexto (NO genéricos)
- Los resultados esperados deben ser medibles
- CRÍTICO: Usar SOLO datos del contexto proporcionado
`;

// Configuración para casos de prueba
const testCaseTokens = 12000; // Token limit para casos de prueba
const temperature = 0.2; // Reducida para mayor precisión
```

### 5.2. C#/Blazor

**Ubicación**: `UseCaseGenerator.Server/Services/IntelligentTestCaseService.cs`

```csharp
// Prompt principal para casos de prueba en C# (ACTUALIZADO - Enero 2025)
var testCasePrompt = $@"
Como experto en QA y testing de software, genera casos de prueba profesionales para el siguiente caso de uso.

⚠️ INSTRUCCIONES CRÍTICAS SOBRE DATOS:
1. NUNCA uses datos genéricos como ""Apellido"", ""DNI"", ""Segmento"" en los casos de prueba
2. USA EXACTAMENTE los datos especificados en el contexto del caso de uso
3. Si el contexto no especifica datos, indica ""datos a definir por el usuario""
4. Cualquier ejemplo genérico está marcado como: ""Ejemplo ilustrativo, no debe reproducirse salvo que aplique""

CONTEXTO DEL CASO DE USO:
{JsonSerializer.Serialize(context)}

INSTRUCCIONES CRÍTICAS:
1. Genera entre 5 y 10 pasos de prueba detallados y específicos
2. Cada paso debe ser ejecutable y verificable
3. Incluye tanto flujos principales como alternativos
4. Considera casos límite y validaciones
5. Genera precondiciones realistas y específicas
6. USA SOLO los filtros, columnas y campos especificados en el contexto

FORMATO DE RESPUESTA OBLIGATORIO:
{{
  ""objective"": ""Objetivo detallado de las pruebas (1-2 párrafos)"",
  ""preconditions"": ""• Usuario con permisos...\n• Sistema configurado...\n• Datos de prueba..."",
  ""testSteps"": [
    {{
      ""number"": 1,
      ""action"": ""Acción específica y clara usando datos del contexto"",
      ""inputData"": ""Datos de entrada detallados del contexto específico"",
      ""expectedResult"": ""Resultado esperado verificable con datos del contexto"",
      ""observations"": ""Observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba""
    }}
  ],
  ""analysisNotes"": ""Notas sobre cobertura, riesgos o consideraciones especiales""
}}

REQUISITOS:
- El objetivo debe explicar QUÉ se prueba y POR QUÉ es importante
- Las precondiciones deben estar categorizadas (Usuario, Sistema, Datos, Infraestructura)
- Cada paso debe ser independiente y atómico
- Los datos de entrada deben ser específicos del contexto (NO genéricos)
- Los resultados esperados deben ser medibles
- CRÍTICO: Usar SOLO datos del contexto proporcionado
";

// Configuración para casos de prueba
int testCaseTokens = 12000; // Token limit para casos de prueba
float temperature = 0.2f; // Reducida para mayor precisión
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

## 6. Prompts para Wireframes Dinámicos (NUEVOS - Enero 2025)

### 6.1. Wireframes para Entidades - TypeScript
**Ubicación**: `server/services/ai-service.ts` - método `generateEntitySearchWireframe()`

```typescript
function generateEntitySearchWireframe(userDescription, formData) {
  const filters = formData.searchFilters || [];
  const columns = formData.resultColumns || [];
  
  return `Wireframe textual ING para buscador de entidades ${formData.useCaseName || "entidad"}.

IMPORTANTE: Este wireframe usa EXACTAMENTE los datos provistos en el formulario. NO sustituir con valores genéricos.

Panel de búsqueda superior con los siguientes filtros${filters.length ? ":" : " (no especificados por el usuario):"}
${filters.length ? filters.map(f => `- ${f}`).join("\n") : "- (El usuario no especificó filtros)"}

Botones: Buscar, Limpiar y Agregar (estilo ING estándar).

Tabla de resultados con paginado ING activado, mostrando las siguientes columnas${columns.length ? ":" : " (no especificadas por el usuario):"}
${columns.length ? columns.map(c => `- ${c}`).join("\n") : "- (El usuario no especificó columnas)"}

Cada fila incluye botones Editar y Eliminar al final.

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).`;
}
```

### 6.2. Wireframes para Entidades - C#
**Ubicación**: `UseCaseGenerator.Server/Services/AIService.cs` - método `GenerateEntitySearchWireframe()`

```csharp
private string GenerateEntitySearchWireframe(string userDescription, UseCaseFormData formData)
{
    var filters = formData.SearchFilters ?? new List<string>();
    var columns = formData.ResultColumns ?? new List<string>();
    
    var wireframe = $@"Wireframe textual ING para buscador de entidades {formData.UseCaseName ?? "entidad"}.

IMPORTANTE: Este wireframe usa EXACTAMENTE los datos provistos en el formulario. NO sustituir con valores genéricos.

Panel de búsqueda superior con los siguientes filtros{(filters.Any() ? ":" : " (no especificados por el usuario):")}
{(filters.Any() ? string.Join("\n", filters.Select(f => $"- {f}")) : "- (El usuario no especificó filtros)")}

Botones: Buscar, Limpiar y Agregar (estilo ING estándar).

Tabla de resultados con paginado ING activado, mostrando las siguientes columnas{(columns.Any() ? ":" : " (no especificadas por el usuario):")}
{(columns.Any() ? string.Join("\n", columns.Select(c => $"- {c}")) : "- (El usuario no especificó columnas)")}

Cada fila incluye botones Editar y Eliminar al final.

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).";

    return FormatProfessionalText(wireframe);
}
```

---

## 7. Configuración de Modelos AI

## Resumen de Cambios de Robustez Implementados

Los siguientes cambios fueron implementados en **ambos sistemas** (TypeScript y C#) para prevenir el uso de datos genéricos:

### ✅ Cambios Completados:
1. **Instrucciones explícitas** para usar EXACTAMENTE los datos de formData
2. **Marcación de ejemplos** como "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
3. **Fallback para actores**: "Actor no identificado" cuando no se especifica
4. **Wireframes dinámicos** que indican claramente cuando no hay datos especificados
5. **Temperatura reducida** para casos de prueba (0.2) para mayor precisión
6. **Validaciones explícitas** para evitar valores hardcoded como "Apellido", "DNI", "Segmento"

### 🎯 Objetivo Logrado:
Ambos sistemas ahora generan documentos usando **únicamente** los datos específicos proporcionados por el usuario, eliminando completamente la generación de valores genéricos o por defecto.

---

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

---

## 8. Prompts para Generación de Wireframes

### 8.1 Wireframe Individual (TypeScript/React) - ✅ ACTUALIZADO CON DATOS DINÁMICOS
**Archivo:** `server/services/ai-service.ts`
**Función:** `generateIntelligentWireframeDescription` (ahora con contexto)

```typescript
private generateIntelligentWireframeDescription(fieldValue: string, context?: any): string {
  const formData = context?.fullFormData;
  
  // 🎯 NUEVA FUNCIONALIDAD: Wireframes dinámicos según datos del formulario
  if (formData && formData.useCaseType === 'entidad') {
    return this.generateEntitySearchWireframe(fieldValue, formData);
  } else if (formData && (formData.useCaseType === 'api' || formData.useCaseType === 'proceso')) {
    return this.generateServiceWireframe(fieldValue, formData);
  }
  
  // Fallback para casos sin contexto (mantiene funcionalidad anterior)
  // - Usa filtros, columnas y campos REALES del formulario
  // - NO inventa datos hardcodeados
  // - Respeta exactamente los valores cargados por el usuario
}

// 🔧 FUNCIONES AUXILIARES DINÁMICAS:
private generateEntitySearchWireframe(userDescription: string, formData: any): string {
  const filters = formData.searchFilters || [];      // ✅ Datos reales del usuario
  const columns = formData.resultColumns || [];      // ✅ Datos reales del usuario
  
  // Estructura del wireframe:
  // - Panel de búsqueda con FILTROS ESPECÍFICOS del formulario
  // - Tabla con COLUMNAS ESPECÍFICAS del formulario  
  // - Botones y paginado obligatorios según minuta ING
  // - Consideraciones adicionales del usuario
}
```

### 8.2 Wireframes Múltiples (TypeScript/React) - ✅ ACTUALIZADO CON DATOS DINÁMICOS
**Archivo:** `server/services/ai-service.ts`
**Función:** `generateIntelligentWireframesDescription` (ahora con contexto)

```typescript
private generateIntelligentWireframesDescription(fieldValue: string, context?: any): string {
  const formData = context?.fullFormData;
  
  // 🎯 NUEVA FUNCIONALIDAD: Sistema completo con datos reales
  if (formData && formData.useCaseType === 'entidad') {
    return this.generateCompleteEntityWireframes(fieldValue, formData);
  } else if (formData && (formData.useCaseType === 'api' || formData.useCaseType === 'proceso')) {
    return this.generateCompleteServiceWireframes(fieldValue, formData);
  }
  
  // Sistema completo dinámico que incluye:
  // ✅ PANTALLA DE BÚSQUEDA: con filtros REALES del formulario
  // ✅ TABLA DE RESULTADOS: con columnas REALES del formulario  
  // ✅ FORMULARIO CRUD: con campos REALES de la entidad
  // ✅ MENSAJES: confirmación/error según estándares ING
}

// 🔧 FUNCIÓN PRINCIPAL PARA ENTIDADES:
private generateCompleteEntityWireframes(userDescription: string, formData: any): string {
  const filters = formData.searchFilters || [];      // ✅ Filtros del usuario
  const columns = formData.resultColumns || [];      // ✅ Columnas del usuario  
  const fields = formData.entityFields || [];        // ✅ Campos del usuario
  
  // Genera 3 wireframes completos:
  // 1. PANTALLA PRINCIPAL con filtros/columnas específicos
  // 2. FORMULARIO MODAL con campos específicos + auditoría obligatoria
  // 3. MENSAJES DE CONFIRMACIÓN según casos de uso
}
```

### 8.3 Wireframe Individual (C#/Blazor) - ✅ ACTUALIZADO CON DATOS DINÁMICOS
**Archivo:** `UseCaseGenerator.Server/Services/AIService.cs`
**Función:** `GenerateIntelligentWireframeDescription` (nueva implementación)

```csharp
public async Task<AIAssistResponse> ImproveFieldAsync(AIAssistRequest request)
{
    // 🎯 NUEVA DETECCIÓN: Wireframes con datos dinámicos
    if (request.FieldName?.ToLowerInvariant().Contains("wireframe") == true)
    {
        return new AIAssistResponse
        {
            ImprovedValue = GenerateIntelligentWireframeDescription(request.CurrentValue, request.Context),
            Success = true
        };
    }
}

private string GenerateIntelligentWireframeDescription(string fieldValue, object? context)
{
    var formData = ExtractFormDataFromContext(context);
    
    // 🔧 LÓGICA DINÁMICA: Usar datos reales del formulario
    if (formData != null && formData.UseCaseType == "entidad")
    {
        return GenerateEntitySearchWireframe(fieldValue, formData);
    }
    
    // ✅ Usa filtros/columnas REALES de formData.SearchFilters y formData.ResultColumns
    // ❌ Ya NO usa datos hardcodeados como "Apellido", "DNI", "Segmento"
    // ✅ Respeta exactamente los valores cargados por el usuario
}
```

### 8.4 Wireframes Múltiples (C#/Blazor) - ✅ ACTUALIZADO CON DATOS DINÁMICOS
**Archivo:** `UseCaseGenerator.Server/Services/AIService.cs`
**Función:** `GenerateIntelligentWireframesDescription` (nueva implementación)

```csharp
private string GenerateIntelligentWireframesDescription(string fieldValue, object? context)
{
    var formData = ExtractFormDataFromContext(context);
    
    // 🎯 SISTEMA COMPLETO con datos reales del formulario
    if (formData != null && formData.UseCaseType == "entidad")
    {
        return GenerateCompleteEntityWireframes(fieldValue, formData);
    }
}

private string GenerateCompleteEntityWireframes(string userDescription, UseCaseFormData formData)
{
    var filters = formData.SearchFilters ?? new List<string>();    // ✅ Filtros reales
    var columns = formData.ResultColumns ?? new List<string>();    // ✅ Columnas reales
    var fields = formData.EntityFields ?? new List<EntityField>(); // ✅ Campos reales
    
    // 🔧 ESTRUCTURA GENERADA:
    // PANTALLA PRINCIPAL: Lista los filtros específicos del usuario
    // TABLA RESULTADOS: Lista las columnas específicas del usuario
    // FORMULARIO MODAL: Lista los campos específicos de la entidad
    // CAMPOS AUDITORÍA: Siempre incluye fechaAlta/usuarioAlta (obligatorio ING)
    
    // ✅ CUMPLE FEEDBACK: NO inventa datos, usa exactamente lo cargado
}
```

### Elementos Comunes de Wireframes ING

**Componentes Estándar:**
- Panel de búsqueda con filtros estándar
- Botones: Buscar/Limpiar/Agregar/Editar/Eliminar
- Paginado ING en tablas de resultados  
- Validaciones en tiempo real
- Mensajes de confirmación/error
- Layout según minuta ING vr19
- UI textual describiendo componentes

**Reglas de Mejora:**
1. **Descripciones vacías**: Usar plantilla por defecto con elementos ING completos
2. **Descripciones cortas**: Detectar tipo (búsqueda/formulario/tabla) y expandir con contexto ING
3. **Descripciones largas**: Verificar y añadir elementos ING faltantes
4. **Formato profesional**: Aplicar estándares de texto según minuta ING

## 🎯 MEJORAS IMPLEMENTADAS SEGÚN FEEDBACK

### ✅ Problema Resuelto: Datos Hardcodeados
**Antes:** Los wireframes usaban datos genéricos como "Apellido", "DNI", "Segmento"
**Ahora:** Los wireframes usan los datos EXACTOS que el usuario cargó en el formulario

### 🔧 Estructura del Prompt Dinámico (Conceptual)
```
OBJETIVO: Generar wireframe textual personalizado usando datos del formulario

DATOS DE ENTRADA OBLIGATORIOS:
- searchFilters: [array con filtros del usuario]
- resultColumns: [array con columnas del usuario]  
- entityFields: [array con campos de la entidad del usuario]

ELEMENTOS SIEMPRE PRESENTES (Minuta ING):
- Botones: Buscar, Limpiar, Agregar, Editar, Eliminar
- Paginado ING activado
- Campos de auditoría: fechaAlta, usuarioAlta, fechaModificacion, usuarioModificacion
- Formato: Segoe UI, layout ING vr19

REGLA CRÍTICA: NO inventar datos. Solo usar los proporcionados por el usuario.
```

### 📋 Casos de Uso Dinámicos
- **Entidad/CRUD**: Usa searchFilters + resultColumns + entityFields reales
- **API/Proceso**: Usa apiEndpoint + serviceFrequency + configuración real
- **Fallback**: Solo si faltan datos del contexto (mantiene compatibilidad)

### 🚀 Funciones Nuevas Implementadas
| Sistema | Función Individual | Función Múltiple |
|---------|-------------------|------------------|
| TypeScript | `generateEntitySearchWireframe()` | `generateCompleteEntityWireframes()` |
| TypeScript | `generateServiceWireframe()` | `generateCompleteServiceWireframes()` |  
| C# | `GenerateEntitySearchWireframe()` | `GenerateCompleteEntityWireframes()` |
| C# | `GenerateServiceWireframe()` | `GenerateCompleteServiceWireframes()` |

**Resultado:** Wireframes 100% personalizados, sin datos genéricos hardcodeados