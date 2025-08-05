# Generador Avanzado de Casos de Uso - Manual Técnico Completo
**Actualizado: 6 de Enero 2025**

## 🎯 Visión General del Sistema

Sistema empresarial de **generación inteligente de documentación técnica** que automatiza la creación de casos de uso siguiendo estrictamente las especificaciones corporativas de ING (Ingematica). El proyecto mantiene **paridad funcional React/TypeScript** con objetivo de migración a Blazor WebAssembly.

### Características Principales

- **Multi-Modelo AI con Cascading Fallback**: Copilot → Gemini → OpenAI → Claude → Grok
- **Análisis Inteligente de Minutas**: Procesamiento de DOCX/XLSX/PPTX con extracción automática
- **Generación Dinámica de Wireframes**: HTML → Screenshot → DOCX embedding
- **Casos de Prueba con AI**: Tablas profesionales con precondiciones estructuradas
- **Validación Inteligente de Verbos**: Regex pattern `/^[a-záéíóúñ]+(ar|er|ir)$/`
- **Modo Demo Completo**: Funcionalidad total sin API keys
- **Exportación DOCX Nativa**: Formato corporativo ING con secciones específicas por tipo
- **UI Responsive Avanzada**: Shadcn/ui + Tailwind con animaciones profesionales

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico Actual (React/TypeScript)

**Frontend**
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query v5 + React Hook Form
- **Routing**: Wouter (lightweight)

**Backend**
- **Runtime**: Node.js + Express + TypeScript
- **AI Integration**: 
  - OpenAI GPT-4o (última versión Mayo 2024)
  - Claude Sonnet 4-20250514
  - Gemini 2.5-flash
  - Grok 2-1212
  - Microsoft Copilot
- **Document Processing**: 
  - docx.js - Generación DOCX
  - Puppeteer - Screenshots de wireframes
  - Sharp - Compresión de imágenes
  - Mammoth - Extracción de contenido DOCX
- **Storage**: In-memory (MemStorage) con arquitectura lista para PostgreSQL

### Arquitectura de Servicios

```
client/
├── components/         # Componentes React reutilizables
├── hooks/             # Custom hooks (useUseCaseForm, etc.)
├── lib/               # Utilidades y configuración
└── pages/             # Páginas de la aplicación

server/
├── services/          # Lógica de negocio
│   ├── ai-service.ts          # Orquestación multi-modelo AI
│   ├── minute-analysis-service.ts  # Análisis de minutas
│   ├── document-service.ts    # Generación DOCX
│   └── test-service.ts        # Casos de prueba inteligentes
├── routes.ts          # Endpoints API REST
└── storage.ts         # Capa de persistencia

shared/
└── schema.ts          # Tipos TypeScript y validaciones Zod
```

---

## 📋 Funcionalidades del Sistema

### 1. Análisis Inteligente de Minutas

**Extracción Automática por Tipo de Caso**:
- **Entity**: Detecta filtros, columnas y campos de entidad
- **API**: Extrae endpoints, métodos HTTP, formatos request/response
- **Service**: Identifica frecuencia, horarios, rutas y credenciales

**Formatos Soportados**:
- Microsoft Word (.docx) - Extracción con mammoth
- Microsoft Excel (.xlsx) - Procesamiento multi-hoja
- Microsoft PowerPoint (.pptx) - Slides y notas del orador
- Tamaño máximo: 10MB

**Características Técnicas**:
- Prevención de extensiones en fileName (.json, .docx, .xml)
- Validación "Actor no identificado" si no existe
- Prompts específicos por tipo de caso de uso

### 2. Flujo de Formulario Multi-Paso

**Paso 1: Configuración AI**
- 5 modelos disponibles + modo Demo
- Cascading fallback automático
- Información de cada proveedor

**Paso 2: Análisis de Minuta (Opcional)**
- Upload de documentos Office
- Extracción inteligente con AI
- Pre-llenado automático de campos

**Paso 3: Tipo de Caso de Uso**
- **Entidad**: CRUD con búsqueda, alta, modificación, eliminación
- **API**: Web services con request/response JSON
- **Servicio/Proceso**: Automatización con schedulers

**Pasos 4-5: Información Básica**
- Cliente y Proyecto con sugerencias contextuales
- Código con formato XX###
- Nombre con validación de verbo infinitivo (regex)
- Descripción expandible automáticamente (< 50 palabras)

**Pasos 6-10: Configuración Específica por Tipo**

*Para Entidad:*
- Filtros de búsqueda (array)
- Columnas de resultado (array)
- Campos con tipo, obligatorio, longitud, validación

*Para API:*
- Endpoint URL
- Método HTTP
- Formato request/response con ejemplos JSON
- Códigos de error (400, 401/403, 500)

*Para Servicio:*
- Frecuencia de ejecución
- Horarios específicos
- Rutas configurables
- Credenciales de servicios externos

### 3. Generación de Documentos DOCX

**Estructura por Tipo de Caso**:

**Entity - Secciones**:
```
1. Buscar datos de la entidad
   a. Filtros (numerales romanos)
   b. Columnas (numerales romanos)
2. Agregar nueva entidad
   a. Campos con propiedades
3. Modificar entidad
4. Eliminar entidad
```

**API - Secciones**:
```
FLUJO PRINCIPAL DE EVENTOS
1. Petición HTTP [METHOD] al endpoint
2. Validación de datos
3. Procesamiento
4. Respuesta
FLUJOS ALTERNATIVOS
- Error 400: Bad Request
- Error 401/403: Unauthorized
- Error 500: Internal Server
```

**Service - Secciones**:
```
FLUJO PRINCIPAL
1. Ejecución [frequency] a las [time]
2. Inicialización automática
3. Captura de archivos
4. Conexión con servicios
5. Procesamiento
6. Generación de reportes
```

### 4. Casos de Prueba Inteligentes

**Generación Automática con AI**:
- Objetivo del caso de prueba
- Precondiciones estructuradas
- Tabla profesional de pasos:
  - Nº secuencial
  - Acción a realizar
  - Datos de entrada
  - Resultado esperado
  - Observaciones
  - Estado (checkbox)

### 5. Wireframes Dinámicos

**Pipeline de Generación**:
1. Generación HTML con datos del formulario
2. Screenshot con Puppeteer (headless Chrome)
3. Compresión con Sharp
4. Embedding en DOCX como imagen

**Características**:
- Diseño responsive Microsoft-style
- Tablas con datos reales del formulario
- Filtros y columnas dinámicas
- Dimensiones correctas para DOCX

### 6. Sistema de Validaciones

**Validaciones Críticas**:
- **Verbos Infinitivos**: Regex `/^[a-záéíóúñ]+(ar|er|ir)$/` + irregulares (ver, ser, ir)
- **Formato Código**: XX### (2 letras + 3 números)
- **Formato fileName**: Sin espacios ni extensiones
- **Descripción**: Mínimo requerido con expansión automática

**Validaciones por Tipo**:
- Entity: Requiere filtros, columnas y campos
- API: Requiere endpoint, request y response
- Service: Requiere frecuencia y horarios

**Reglas Específicas por Campo**:
- **Cliente**: Nombres de empresas reales, formato profesional
- **Proyecto**: Sistemas tecnológicos relacionados al cliente
- **Código**: Formato XX000 con letras relacionadas al módulo
- **Caso de Uso**: OBLIGATORIO verbo infinitivo inicial
- **Archivo**: Sin espacios, formato específico de naming
- **Descripción**: 50-200 palabras técnicas pero comprensibles
- **Filtros**: Campos lógicos de entidad sin tipos de dato
- **Campos de Entidad**: JSON estructurado con tipos, longitudes y validaciones

**Funcionalidad AI Assist**:
- Corrección automática de formatos
- Sugerencias contextuales por tipo de caso de uso
- Ejemplos apropiados para campos vacíos
- Aplicación de reglas ING específicas
- Toast notifications de éxito/error
- Loading states durante procesamiento
- Manejo robusto de valores null

### 4. Generación de Wireframes Dinámicos

**Características**:
- Generación basada en datos reales del formulario
- Wireframes específicos por tipo de caso de uso
- Diseño responsivo y profesional
- Integración directa en documentos DOCX

**Funciones Implementadas**:
- `generateEntitySearchWireframe()`: Interfaz de búsqueda con filtros reales
- `generateCompleteEntityWireframes()`: CRUD completo para entidades
- `generateServiceWireframe()`: Interfaz de servicio/proceso
- `generateCompleteServiceWireframes()`: Flujo completo de servicio

### 5. Sistema de Casos de Prueba Inteligentes

**Generación Contextual**:
- Análisis del tipo de caso de uso
- Generación de objetivos específicos
- Precondiciones detalladas
- Pasos de prueba con datos reales

**Estructura de Casos de Prueba**:
- Número secuencial
- Acción detallada
- Datos de entrada específicos
- Resultado esperado
- Observaciones y validaciones

### 6. Motor de Generación de Documentos

**Procesamiento de Contenido**:
- Prompts engineering avanzado por tipo de caso de uso
- Limpieza inteligente de respuestas IA (elimina texto explicativo)
- Aplicación estricta de reglas de formato ING
- Generación de contenido estructurado

**Reglas ING Implementadas**:
- Font: Segoe UI Semilight para todo el documento
- Colores: RGB(0,112,192) para títulos principales
- Listas multinivel: 1, a, i con sangría específica (0.2 pulgadas)
- Tabla obligatoria "Historia de Revisiones y Aprobaciones"
- Formato Microsoft Word profesional
- Interlineado y espaciado específico
- Footer: "página X de Y"
- Header: Logo Ingematica (600x79 pixels)

### 7. Sistema de Exportación DOCX

**Características Técnicas**:
- Generación directa desde formData (sin conversión HTML)
- Preservación perfecta de estructura
- Incrustación de wireframes como imágenes
- Tablas con formato ING (header azul #DEEAF6)
- Manejo de casos de prueba con formato profesional

**Límites de Tokens por Sección**:
- Documentos: 16000 tokens
- Casos de prueba: 12000 tokens
- Análisis de minuta: 10000 tokens
- Campos de entidad: 4000 tokens

---

## 🔧 Características Técnicas Avanzadas

### Manejo de Estado
- **React Query**: Cache inteligente de peticiones IA
- **React Hook Form**: Validación en tiempo real
- **Zod Schemas**: Tipo-seguridad completa
- **Estado persistente**: Formulario mantiene datos durante navegación

### Validación Completa
- **Validación en vivo**: Feedback inmediato por campo
- **Reglas específicas**: Verbo infinitivo, formato de códigos, etc.
- **Validación servidor**: Double-check en backend
- **Mensajes contextuales**: Ayuda específica por tipo de error

### Experiencia de Usuario
- **Diseño Microsoft**: Colores y tipografía corporativa
- **Responsive**: Funciona en móviles y desktop
- **Dark mode**: Soporte completo para tema oscuro
- **Loading states**: Feedback visual en todas las operaciones
- **Toast notifications**: Confirmaciones y errores elegantes

### Sistema de IA Multi-Proveedor
- **Abstracción inteligente**: Misma interfaz para todos los proveedores
- **Fallback robusto**: Modo demo si fallan APIs
- **Rate limiting ready**: Preparado para límites de API
- **Error handling**: Manejo elegante de fallos de red

---

## 📊 Flujo de Trabajo del Usuario

### Flujo Típico Completo:
1. **Configuración**: Usuario selecciona modelo de IA
2. **Tipo**: Elige tipo de caso de uso con preview
3. **Datos Básicos**: Completa información, usa AI Assist en campos clave
4. **Detalles**: Describe caso de uso, mejora descripción con IA
5. **Configuración Avanzada**: Define filtros, columnas, campos (con AI Assist)
6. **Generación**: Sistema crea documento HTML profesional
7. **Revisión**: Usuario ve preview con formato Microsoft
8. **Exportación**: Descarga DOCX perfectamente formateado

### Flujo Revolucionario con AI Assist:
1. Usuario llena campo básico
2. Presiona botón "AI Assist" junto al campo
3. IA analiza contenido y aplica reglas ING específicas
4. Campo se mejora automáticamente con formato correcto
5. Usuario continúa con alta confianza en calidad de datos
6. Documento final tiene calidad profesional garantizada

---

## 🎨 Especificaciones de Diseño

### Paleta de Colores Microsoft
- **Azul Principal**: RGB(0,112,192) - Títulos y elementos clave
- **Grises**: Diferentes tonos para texto y bordes
- **Estados**: Verde éxito, rojo error, azul información
- **Dark Mode**: Inversión inteligente manteniendo legibilidad

### Tipografía
- **Primary**: Segoe UI Semilight (documentos)
- **Interface**: System fonts con fallbacks
- **Jerarquía**: Tamaños específicos por nivel de título

### Componentes UI
- **Botones**: Variants coherentes (primary, outline, ghost)
- **Inputs**: Focus states con color Microsoft
- **Cards**: Sombras sutiles, bordes consistentes
- **Icons**: Lucide React para consistencia

---

## 🔒 Aspectos de Seguridad y Calidad

### Seguridad
- **API Keys**: Almacenadas en variables de entorno
- **Validación**: Doble validación cliente/servidor
- **Sanitización**: Limpieza de contenido IA
- **Rate Limiting**: Preparado para implementar

### Calidad de Código
- **TypeScript**: 100% tipo-seguro
- **ESLint**: Reglas estrictas de calidad
- **Error Boundaries**: Manejo elegante de crashes
- **Testing Ready**: Estructura preparada para tests

### Performance
- **Code Splitting**: Carga bajo demanda
- **React Query**: Cache inteligente
- **Optimistic Updates**: UI responsive
- **Lazy Loading**: Componentes pesados diferidos

---

## 📈 Métricas y Capacidades Actuales

### Casos de Uso Soportados
- **Entidades**: CRUD completo con wireframes dinámicos basados en datos
- **Servicios**: Procesos automatizados con configuración avanzada
- **APIs**: Endpoints con formatos de request/response

### Proveedores IA Integrados
- **OpenAI**: GPT-4o (última versión)
- **Anthropic**: Claude Sonnet 4 (20250514)
- **Google**: Gemini 2.5 Flash/Pro
- **X.AI**: Grok 2 Vision/Text
- **Microsoft**: Copilot
- **Demo**: Funcional sin APIs

### Formatos de Salida
- **DOCX**: Microsoft Word nativo con formato ING perfecto
- **Wireframes**: Imágenes PNG incrustadas en documentos
- **Casos de Prueba**: Tablas profesionales integradas

---

## 🚀 Estado de Desarrollo Actual

### Completamente Implementado
- Sistema dual React/Blazor WebAssembly mantenido en paralelo
- Análisis de minutas con extracción inteligente
- Generación de wireframes dinámicos basados en datos
- Casos de prueba inteligentes con objetivos y precondiciones
- Sistema de fallback en cascada para proveedores IA
- UI avanzada con componentes profesionales
- Smart Autocomplete con sugerencias contextuales
- Tooltips informativos con estilo ING
- Animaciones profesionales (pulse, spin)
- Manejo robusto de valores null
- Exportación DOCX directa sin conversión HTML
- Validación completa con doble verificación

### Cambios Recientes Críticos
- **Migración Completa a Blazor**: Sistema dual funcionando
- **Corrección de Null References**: SmartAutocomplete protegido
- **Animación "Pensando..."**: Efecto violeta pulsante (#6b5b95)
- **Wireframes Dinámicos**: Uso de datos reales del formulario
- **Sincronización de Prompts**: Idénticos en ambos sistemas
- **Limpieza de Datos**: Conversión null a string vacío antes de validación

### Arquitectura de Fallback IA
1. **Copilot** (primera opción)
2. **Gemini** (fallback primario)
3. **OpenAI** (fallback secundario)
4. **Claude** (fallback terciario)
5. **Grok** (última opción)
6. **Demo** (siempre disponible)

---

---

## 🔧 Características Técnicas del Sistema Dual

### Sincronización React-Blazor
- **Componentes Espejo**: Cada componente React tiene su equivalente en Blazor
- **API Unificada**: Backend único sirve a ambos frontends
- **Prompts Idénticos**: Mismos prompts IA en ambos sistemas
- **UI Consistente**: Experiencia de usuario idéntica

### Componentes Clave Sincronizados
1. **SmartAutocomplete** (React/Blazor)
2. **ContextualTooltip** (React/Blazor)
3. **MicroInteractions** (React/Blazor)
4. **AdaptiveLoading** (React/Blazor)
5. **ThinkingLoader** (React/Blazor)

### Manejo de Errores Robusto
- Protección contra valores null en todos los componentes
- Validación previa a esquemas Zod
- Fallback automático en proveedores IA
- Mensajes de error descriptivos

---

## 💡 Flujos de Trabajo Principales

### Flujo 1: Generación desde Cero
1. Selección de modelo IA
2. Elección de tipo de caso de uso
3. Llenado de formulario con AI Assist
4. Generación de documento
5. Descarga de DOCX

### Flujo 2: Análisis de Minuta
1. Carga de documento Office
2. Extracción automática con IA
3. Revisión y ajuste de datos
4. Completar campos faltantes
5. Generación y descarga

### Flujo 3: Ejemplo Bancario Rápido
1. Click en "Cargar Ejemplo Bancario"
2. Revisión de datos pre-llenados
3. Ajustes personalizados
4. Generación inmediata

---

## 📦 Estructura del Proyecto

### Frontend React
- `/client/src/components` - Componentes UI
- `/client/src/pages` - Páginas de la aplicación
- `/shared/schema.ts` - Esquemas compartidos

### Frontend Blazor
- `/UseCaseGenerator.Client` - Proyecto Blazor WebAssembly
- `/UseCaseGenerator.Server` - Servidor ASP.NET Core
- `/UseCaseGenerator.Shared` - Modelos compartidos

### Backend Unificado
- `/server` - API Node.js/Express
- `/server/services` - Servicios de IA y documentos
- `/server/routes.ts` - Endpoints API

---

## 🎯 Conclusión

El sistema representa una solución empresarial completa para la generación de documentación técnica, manteniendo dos implementaciones paralelas (React y Blazor) que garantizan flexibilidad y robustez. La integración de múltiples proveedores de IA con fallback automático, junto con características avanzadas como análisis de minutas y generación de wireframes dinámicos, lo convierten en una herramienta única en su categoría.

La arquitectura dual permite evolución gradual mientras se mantiene estabilidad, y el enfoque en la experiencia del usuario con componentes UI avanzados asegura productividad máxima.