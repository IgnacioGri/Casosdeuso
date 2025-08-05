# Catálogo de Prompts del Sistema
**Actualizado: 6 de Enero 2025**

## 📚 Índice de Prompts

1. [Análisis de Minutas](#análisis-de-minutas)
2. [Generación de Casos de Uso](#generación-de-casos-de-uso)
3. [Expansión de Descripciones](#expansión-de-descripciones)
4. [Casos de Prueba Inteligentes](#casos-de-prueba-inteligentes)
5. [AI Assist por Campo](#ai-assist-por-campo)

---

## 1. Análisis de Minutas

### Prompt Base
```
Eres un analista de sistemas experto en casos de uso según estándares ING.
Analiza el texto de la minuta proporcionada y extrae la información relevante para completar automáticamente un formulario de caso de uso.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido sin explicaciones adicionales.
```

### Análisis Entity
```
Para casos de uso tipo ENTIDAD, extrae y estructura la siguiente información:

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:
1. clientName: Es el nombre de la EMPRESA/BANCO/ORGANIZACIÓN cliente (NO el nombre del caso de uso)
   - Buscar palabras como "Banco", "Cohen", "Macro", "Provincia", nombres de empresas
   - Ejemplo correcto: "Cohen Aliados Financieros", "Banco Macro", "Banco Provincia"
   
2. projectName: Es el nombre del PROYECTO o SISTEMA (NO el caso de uso)
   - Buscar frases como "Sistema de", "Módulo de", "Plataforma de"
   - Si no está explícito, inferir del contexto
   - NO dejar vacío si se puede inferir del contexto
   
3. useCaseCode: Es el CÓDIGO alfanumérico del caso de uso
   - Formato: letras+números (ej: PV003, BP005, UC001)
   - NO confundir con nombres o descripciones
   
4. useCaseName: Es el NOMBRE del caso de uso (acción + entidad)
   - DEBE empezar con verbo infinitivo
   - Ejemplo: "Gestionar Clientes", "Mostrar proveedores", "Consultar Saldos"
   - NO poner aquí el nombre del cliente ni proyecto

5. description: Descripción del QUÉ HACE el caso de uso
   - Si viene muy corta (menos de 10 palabras), devolver tal cual viene
   - NO expandir aquí, solo extraer lo que dice la minuta

NUNCA MEZCLAR:
- NO poner el nombre del cliente en useCaseName
- NO poner el nombre del caso de uso en clientName
- NO dejar projectName vacío si se puede inferir

🚨 REGLA CRÍTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo código + descripción sin extensiones
- Ejemplo correcto: "ST003GestionarTransferencias" (NO "ST003GestionarTransferencias.json")
- Si encuentras extensiones, elimínalas completamente

{
  "clientName": "Nombre de la empresa/banco cliente",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código alfanumérico del caso de uso", 
  "useCaseName": "Nombre del caso de uso con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: código+descripción",
  "description": "Descripción del objetivo del caso de uso tal como viene en la minuta",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no está explícito",
  "searchFilters": ["usar SOLO filtros mencionados en la minuta"],
  "filtersDescription": "Descripción de los filtros de búsqueda necesarios",
  "resultColumns": ["usar SOLO columnas mencionadas en la minuta"],
  "columnsDescription": "Descripción de las columnas que se mostrarán en resultados",
  "entityFields": [
    {
      "name": "usar SOLO campos mencionados en la minuta",
      "type": "tipo según el campo",
      "mandatory": true,
      "length": 50,
      "description": "Descripción clara del propósito del campo",
      "validationRules": "Reglas de validación específicas"
    }
  ],
  "fieldsDescription": "Descripción de los campos de la entidad",
  "businessRules": "• Reglas de negocio mencionadas en la minuta",
  "specialRequirements": "• Requerimientos específicos extraídos",
  "generateTestCase": true,
  "testCaseObjective": "Verificar el funcionamiento completo del caso de uso",
  "testCasePreconditions": "Usuario autenticado. Permisos necesarios. Datos de prueba disponibles",
  "isAIGenerated": true
}
```

### Análisis API
```
Para casos de uso tipo API/WEB SERVICE, extrae y estructura la siguiente información:

INSTRUCCIONES CRÍTICAS:
- NUNCA uses valores genéricos o por defecto
- TODO ejemplo mostrado abajo es "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- SIEMPRE extrae datos EXACTOS del texto de la minuta
- Si algún dato no está en la minuta, devuelve null o array vacío según corresponda
- Para el actor principal: Si no hay actor explícito, usar "Actor no identificado"

🚨 REGLA CRÍTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo código + descripción sin extensiones
- Ejemplo correcto: "API001ConsultarSaldo" (NO "API001ConsultarSaldo.json")
- Si encuentras extensiones, elimínalas completamente

{
  "clientName": "Nombre del cliente/organización",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código del caso de uso (Ejemplo ilustrativo: API001, WS002)",
  "useCaseName": "Nombre del servicio empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción del propósito del API/servicio",
  "actorName": "actor principal del caso de uso o 'Actor no identificado' si no está explícito",
  "apiEndpoint": "URL del endpoint (Ejemplo ilustrativo: /api/v1/consulta-saldo)",
  "httpMethod": "Método HTTP (GET, POST, PUT, DELETE)",
  "requestFormat": "Formato de request con ejemplos",
  "responseFormat": "Formato de response con ejemplos",
  "alternativeFlows": ["Error de autenticación", "Timeout", "Datos no encontrados"],
  "businessRules": "• Regla de autenticación extraída de la minuta • Regla de validación específica mencionada",
  "specialRequirements": "• Seguridad SSL obligatoria • Rate limiting según requerimientos",
  "isAIGenerated": true
}
```

### Análisis Service
```
Para casos de uso tipo SERVICIO/PROCESO, extrae y estructura la siguiente información:

🚨 REGLA CRÍTICA DE fileName:
- El fileName NUNCA debe incluir extensiones como .json, .docx, .xml, .txt, etc.
- Formato correcto: solo código + descripción sin extensiones
- Ejemplo correcto: "SRV001ProcesarPagos" (NO "SRV001ProcesarPagos.json")
- Si encuentras extensiones, elimínalas completamente

📋 INSTRUCCIONES ESPECÍFICAS PARA SERVICIOS/PROCESOS AUTOMÁTICOS:
- Busca información sobre frecuencia de ejecución (diario, semanal, mensual, cada hora, etc.)
- Identifica horarios específicos de ejecución (02:00 AM, 18:30, etc.)
- Detecta rutas de archivos o directorios que deben ser configurables
- Identifica credenciales de web services, APIs o integraciones externas
- Extrae flujos alternativos relacionados con fallos del proceso

{
  "clientName": "Nombre del cliente/organización",
  "projectName": "Nombre del proyecto o sistema",
  "useCaseCode": "Código del caso de uso (ej: SRV001, PROC002)",
  "useCaseName": "Nombre del proceso empezando con verbo infinitivo",
  "fileName": "Nombre de archivo siguiendo patrón: 2letras+3números+descripción",
  "description": "Descripción completa del proceso automático y sus etapas",
  "serviceFrequency": "Frecuencia de ejecución: Diariamente, Cada hora, Semanalmente, Mensualmente, etc. Si hay múltiples frecuencias, sepáralas con comas",
  "executionTime": "Hora(s) de ejecución: 02:00 AM, 14:30, 23:59, etc. Si hay múltiples horarios, sepáralos con comas",
  "configurationPaths": "Si el proceso captura o genera archivos, lista las rutas que deben ser configurables. Ejemplo: /sftp/incoming/, /sftp/processed/, /logs/. Si no hay rutas, devuelve cadena vacía",
  "webServiceCredentials": "Si llama a web services o APIs externas, indica qué credenciales deben ser configurables. Ejemplo: Usuario: srv_proceso, URL: https://api.ejemplo.com, Método: OAuth 2.0. Si no hay servicios externos, devuelve cadena vacía",
  "alternativeFlows": [
    "No se encuentran archivos en la ruta configurada",
    "Falla conexión con servicio externo",
    "Error en procesamiento de datos",
    "Timeout en operación",
    "Proceso anterior no finalizó"
  ],
  "businessRules": "• Reglas de validación de datos • Límites de procesamiento • Horarios permitidos • Validaciones específicas del negocio",
  "specialRequirements": "• Integración con sistemas externos • Monitoreo en tiempo real • Notificaciones por email • Backup automático • Encriptación de datos",
  "generateTestCase": true,
  "testCaseObjective": "Verificar que el proceso automático ejecute correctamente todas sus etapas",
  "testCasePreconditions": "Archivos de prueba disponibles. Servicios externos accesibles. Base de datos en estado consistente",
  "isAIGenerated": true
}

EJEMPLOS DE EXTRACCIÓN:
- Si el documento menciona "El proceso se ejecuta todos los días a las 2 AM", extrae:
  serviceFrequency: "Diariamente"
  executionTime: "02:00 AM"
  
- Si dice "captura archivos desde servidor SFTP", extrae:
  configurationPaths: "/sftp/incoming/, /sftp/processed/"
  
- Si menciona "llama al servicio de validación del BCRA con OAuth", extrae:
  webServiceCredentials: "Servicio BCRA: Método OAuth 2.0, URL configurable"
```

---

## 2. Generación de Casos de Uso

### Prompt Principal
```
Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

⚠️ INSTRUCCIÓN CRÍTICA Y OBLIGATORIA PARA DESCRIPCIÓN ⚠️
La sección de DESCRIPCIÓN debe contener EXACTAMENTE el texto proporcionado en formData.description.
NO modifiques, resumas o cambies la descripción proporcionada.
USA LITERALMENTE el contenido de formData.description tal como viene.

IMPORTANTE: La descripción ya viene procesada y expandida cuando es necesario.
- Si es larga (2 párrafos), úsala completa tal cual
- Si es corta, úsala tal cual (el sistema ya la procesó)
- NUNCA la modifiques o reescribas

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional con indentación:
   1. Flujo Básico
     a. Menú principal
       i. Ingreso de filtros
       ii. Ejecución de búsqueda
     b. Subflujo: Alta
       i. Validación de datos
       ii. Confirmación
   Indenta 0.2 pulgadas por nivel a la derecha.

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

INSTRUCCIONES CRÍTICAS PARA PREVENIR ERRORES:
- NUNCA uses valores por defecto o genéricos como "Apellido", "DNI", "Segmento" - estos son SOLO ejemplos ilustrativos
- SIEMPRE usa EXACTAMENTE los datos provistos en el formulario
- Para filtros de búsqueda: usa SOLO los valores exactos provistos en formData.searchFilters
- Para columnas de resultado: usa SOLO los valores exactos en formData.resultColumns  
- Para campos de entidad: usa SOLO los campos exactos en formData.entityFields con sus propiedades (tipo, requerido, longitud)
- Si no hay datos provistos, indica "No especificado" pero NO inventes valores
- TODO ejemplo en el documento debe ser marcado como "Ejemplo ilustrativo, no debe reproducirse salvo que aplique"
- Para el actor principal: Si no hay actor explícito, usar "Actor no identificado"
- Para procesos automáticos: incluir configurables (path archivos, usuario/clave/URL web services)

⚠️ REGLA CRÍTICA DE NOMBRES DE ARCHIVO ⚠️
- NUNCA agregues extensiones de archivo (.json, .docx, .xml, .txt, etc.) al campo fileName
- El fileName debe usarse EXACTAMENTE como viene sin modificaciones ni extensiones
- El archivo ya tiene su formato definido (será DOCX automáticamente)
- Ejemplo CORRECTO: "BP005GestionarClientes" 
- Ejemplo INCORRECTO: "BP005GestionarClientes.docx"

Datos del formulario:
- Tipo de caso de uso: ${formData.useCaseType}
- Cliente: ${formData.clientName}
- Proyecto: ${formData.projectName}
- Código: ${formData.useCaseCode}
- Nombre del caso de uso: ${formData.useCaseName}
- Nombre del archivo: ${formData.fileName}
- Descripción: ${formData.description}
- Filtros de búsqueda: ${formData.searchFilters?.join(', ') || 'Ninguno'}
- Columnas de resultado: ${formData.resultColumns?.join(', ') || 'Ninguna'}
```

---

## 3. Expansión de Descripciones

### Prompt de Expansión
```
Como experto en documentación bancaria/empresarial, expande la siguiente descripción de caso de uso a exactamente 2 párrafos profesionales:

Descripción original: "${formData.description}"
Caso de uso: ${formData.useCaseName}
Cliente: ${formData.clientName}
Proyecto: ${formData.projectName}

INSTRUCCIONES OBLIGATORIAS:
1. Primer párrafo (75+ palabras): Explicar QUÉ hace el caso de uso, su propósito principal, qué procesos abarca, qué área del negocio atiende, cómo se integra en el sistema.
2. Segundo párrafo (75+ palabras): Detallar los BENEFICIOS clave para el negocio, valor agregado, mejoras operativas, problemas que resuelve, impacto en eficiencia.

IMPORTANTE: Genera SOLO los 2 párrafos de texto sin títulos, HTML o formato adicional. Usa contexto profesional relevante del sector ${formData.clientName?.includes('Banco') ? 'bancario' : 'empresarial'}.
```

---

## 4. Casos de Prueba Inteligentes

### Prompt de Casos de Prueba
```
Genera casos de prueba profesionales para el caso de uso "${formData.useCaseName}".

Tipo de caso: ${formData.useCaseType}
Descripción: ${formData.description}

INSTRUCCIONES:
1. Define un objetivo claro y específico
2. Lista precondiciones necesarias
3. Genera pasos de prueba detallados con:
   - Número secuencial
   - Acción específica
   - Datos de entrada
   - Resultado esperado
   - Observaciones

Para tipo ENTITY, incluye pruebas de:
- Búsqueda con filtros: ${formData.searchFilters}
- Alta con campos: ${formData.entityFields}
- Modificación
- Eliminación

Para tipo API, incluye pruebas de:
- Request válido al endpoint: ${formData.apiEndpoint}
- Respuestas exitosas
- Manejo de errores 400, 401, 500

Para tipo SERVICE, incluye pruebas de:
- Ejecución en horario: ${formData.executionTime}
- Procesamiento de archivos
- Conexión con servicios externos

Genera SOLO contenido JSON estructurado sin explicaciones adicionales.
```

---

## 5. AI Assist por Campo

### Cliente
```
Basándote en el contexto del proyecto, sugiere un nombre de cliente apropiado.
Si el contexto sugiere banca, usa nombres como "Banco Santander", "Banco Macro", "Cohen Aliados Financieros".
Si es empresarial, usa nombres corporativos reales y profesionales.
Devuelve SOLO el nombre sin explicaciones.
```

### Proyecto
```
Genera un nombre de proyecto tecnológico relacionado con ${clientName}.
Usa formato: "Sistema de [funcionalidad]" o "Plataforma de [proceso]".
Debe ser específico y profesional.
Devuelve SOLO el nombre del proyecto.
```

### Código de Caso de Uso
```
Genera un código de caso de uso siguiendo el formato XX###.
- XX: 2 letras relacionadas con el módulo
- ###: 3 números secuenciales
Ejemplos: BP001, ST003, API005
Devuelve SOLO el código.
```

### Nombre de Caso de Uso
```
Genera un nombre de caso de uso que:
1. DEBE comenzar con verbo en infinitivo
2. Debe ser específico al tipo ${useCaseType}
3. Debe ser profesional y claro

Para entity: "Gestionar [Entidad]", "Administrar [Entidad]"
Para api: "Consultar [Recurso]", "Procesar [Operación]"
Para service: "Ejecutar [Proceso]", "Sincronizar [Datos]"

Devuelve SOLO el nombre.
```

### Filtros de Búsqueda
```
Para el caso de uso "${useCaseName}", genera filtros de búsqueda apropiados.
Los filtros deben ser campos lógicos de la entidad.
NO incluyas tipos de dato, solo nombres de campos.
Genera entre 3-5 filtros relevantes.
Devuelve un array JSON de strings.
```

### Columnas de Resultado
```
Para la entidad "${useCaseName}", genera columnas apropiadas para mostrar en resultados.
Las columnas deben representar la información clave de la entidad.
Genera entre 5-8 columnas relevantes.
Devuelve un array JSON de strings.
```

### Campos de Entidad
```
Para la entidad "${useCaseName}", genera campos completos con estructura:
{
  "name": "nombre del campo",
  "type": "string|number|date|boolean|select",
  "mandatory": true/false,
  "length": número (solo para strings),
  "description": "descripción clara del campo",
  "validationRules": "reglas específicas de validación"
}

Genera 5-10 campos relevantes y realistas.
Incluye tipos variados y validaciones apropiadas.
Devuelve un array JSON de objetos.
```

---

## 🔧 Reglas de Limpieza de Respuestas AI

### Limpieza de Contenido
```javascript
// Eliminar marcadores de código
content = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');

// Eliminar texto explicativo
content = content.replace(/^(aquí está|here is|este es|a continuación).*:\s*/i, '');

// Eliminar extensiones de archivo
content = content.replace(/\.(json|docx|xml|txt|pdf|doc|html|md)"/gi, '"');

// Limpiar saltos de línea excesivos
content = content.replace(/\n{3,}/g, '\n\n');
```

### Validación de Verbos Infinitivos
```javascript
const infinitivePattern = /^[a-záéíóúñ]+(ar|er|ir)$/;
const irregularVerbs = ['ver', 'ser', 'ir'];

function isInfinitive(word) {
  const lower = word.toLowerCase();
  return infinitivePattern.test(lower) || irregularVerbs.includes(lower);
}
```

---

## 📊 Configuración de Modelos AI

### OpenAI
```javascript
model: "gpt-4o"  // Versión mayo 2024
max_tokens: 4000
temperature: 0.7
```

### Claude
```javascript
model: "claude-sonnet-4-20250514"
max_tokens: 4000
temperature: 0.7
```

### Gemini
```javascript
model: "gemini-2.5-flash"
max_tokens: 4000
temperature: 0.7
```

### Grok
```javascript
model: "grok-2-1212"
max_tokens: 4000
temperature: 0.7
```

---

## 🎯 Mejores Prácticas

1. **Siempre validar respuestas**: Verificar estructura JSON antes de procesar
2. **Limpiar contenido**: Eliminar markup y texto no deseado
3. **Preservar datos originales**: No modificar información del usuario
4. **Manejar nulls**: Validar valores null/undefined antes de usar
5. **Fallback cascade**: Intentar múltiples modelos si uno falla
6. **Logs detallados**: Registrar cada paso para debugging
7. **Expansión condicional**: Solo expandir descripciones < 50 palabras
8. **Prevenir extensiones**: Nunca agregar .json, .docx, etc. a nombres

---

## 📈 Métricas y Límites

- **Análisis de minuta**: 10,000 tokens máximo
- **Generación de documento**: 16,000 tokens máximo
- **Casos de prueba**: 12,000 tokens máximo
- **Campos de entidad**: 4,000 tokens máximo
- **AI Assist por campo**: 500 tokens máximo

---

## 🔄 Actualizaciones Recientes

**Enero 2025**:
- Actualización a modelos AI más recientes (GPT-4o, Claude 4, Gemini 2.5)
- Implementación de regex para validación de verbos infinitivos
- Prevención de extensiones en fileName
- Mejora en extracción de campos service
- Expansión automática de descripciones cortas