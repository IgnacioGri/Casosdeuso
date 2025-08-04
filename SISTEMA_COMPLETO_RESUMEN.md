# Generador Avanzado de Casos de Uso - Resumen Técnico Completo

## 🎯 Visión General del Sistema

Este es un **generador avanzado de casos de uso impulsado por IA** que permite crear documentación técnica profesional siguiendo estrictamente las especificaciones de ING (Ingematica). El sistema mantiene **dos implementaciones paralelas idénticas**: React/TypeScript y Blazor WebAssembly, ambas con funcionalidad completa y sincronizadas.

### Características Distintivas

- **Sistema Dual Mantenido**: React y Blazor WebAssembly funcionando en paralelo
- **Análisis de Minutas con IA**: Extracción inteligente de información desde documentos
- **Generación de Wireframes Dinámicos**: Creación automática basada en datos del formulario
- **Casos de Prueba Inteligentes**: Generación contextual con objetivos y precondiciones
- **Soporte para 5 proveedores de IA**: OpenAI GPT-4o, Claude Sonnet 4, Google Gemini 2.5, Grok 2, y Copilot
- **Modo Demo funcional**: Opera completamente sin APIs para evaluación y pruebas
- **Exportación DOCX perfecta**: Documentos con formato Microsoft profesional
- **UI Mejorada**: Componentes avanzados con animaciones profesionales

---

## 🏗️ Arquitectura del Sistema

### Sistema Dual - Stack Tecnológico

**Sistema React (Mantenido)**
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS + Shadcn/ui
- **Estado**: React Query (TanStack Query) + React Hook Form

**Sistema Blazor (Principal)**
- **Frontend**: Blazor WebAssembly con .NET 8
- **UI**: MudBlazor + CSS personalizado con ING branding
- **Estado**: State management integrado de Blazor

**Compartido entre ambos sistemas**
- **Backend**: Node.js + Express + TypeScript (API unificada)
- **IA**: OpenAI, Anthropic, Google Gemini, X.AI, Copilot APIs
- **Documentos**: docx.js para generación de Word
- **Base de Datos**: Preparado para PostgreSQL con Drizzle ORM (actualmente in-memory)

### Principios de Sincronización
- **Paridad Funcional**: Toda característica debe implementarse en ambos sistemas
- **UI Idéntica**: Misma experiencia de usuario en React y Blazor
- **API Compartida**: Backend único sirve a ambos frontends
- **Validación Duplicada**: Reglas de negocio idénticas en ambos

---

## 📋 Funcionalidades del Sistema

### 1. Análisis de Minutas con IA 🆕

**Capacidades de Extracción**:
- Soporte para archivos DOCX, XLSX, PPTX
- Análisis inteligente de contenido con IA
- Extracción automática de campos del formulario
- Botón animado "Pensando..." con efecto violeta pulsante
- Manejo robusto de valores null en campos extraídos

**Formatos Soportados**:
- Microsoft Word (.docx) - Extracción con mammoth
- Microsoft Excel (.xlsx, .xls) - Todas las hojas
- Microsoft PowerPoint (.pptx) - Diapositivas y notas
- Tamaño máximo: 10MB por archivo

### 2. Sistema de Formulario Multi-Paso Inteligente

**Paso 1: Configuración de IA**
- Selector de modelo de IA (OpenAI, Claude, Grok, Gemini, Copilot, Demo)
- Sistema de fallback en cascada: Copilot → Gemini → OpenAI → Claude → Grok
- Información transparente sobre cada proveedor
- Modo Demo funcional sin necesidad de API keys

**Paso 2: Análisis de Minuta (Opcional)** 🆕
- Carga de documentos Office
- Extracción automática de información
- Pre-llenado inteligente del formulario
- Validación de datos extraídos

**Paso 3: Tipo de Caso de Uso**
- **Gestión de Entidades**: CRUD completo con wireframes dinámicos
- **Servicios/Procesos**: Automatización y integración de sistemas
- **APIs**: Endpoints y configuraciones técnicas
- Previsualizaciones interactivas de cada tipo
- Botón de autocompletado con ejemplo bancario complejo

**Paso 4: Información Básica** ⭐ *CON AI ASSIST Y SMART AUTOCOMPLETE*
- Nombre del Cliente (con sugerencias contextuales inteligentes)
- Nombre del Proyecto (autocomplete basado en contexto)
- Código del Caso de Uso (formato XX000 validado)

**Paso 5: Detalles del Caso de Uso** ⭐ *CON AI ASSIST*
- Nombre del Caso de Uso (debe comenzar con verbo infinitivo)
- Nombre del Archivo (formato específico sin espacios)
- Descripción detallada (50-200 palabras, técnica)
- Opción de wireframes dinámicos para entidades

**Pasos 6-10: Configuración Avanzada** ⭐ *CON AI ASSIST Y UI MEJORADA*
- Filtros de búsqueda con Smart Autocomplete
- Columnas de resultado con sugerencias contextuales
- Campos de entidad con validación y tooltips informativos
- Reglas de negocio específicas
- Requerimientos especiales técnicos
- Generación de casos de prueba inteligentes

### 3. Sistema Revolucionario "AI Assist" 🚀

**Concepto**: En lugar de solo generar documentos completos, cada campo tiene su propio botón de mejora IA.

**Campos con AI Assist Implementado**:
- ✅ Nombre del Cliente
- ✅ Nombre del Proyecto
- ✅ Código del Caso de Uso
- ✅ Nombre del Caso de Uso
- ✅ Nombre del Archivo
- ✅ Descripción
- ✅ Filtros de Búsqueda
- ✅ Columnas de Resultado
- ✅ Campos de Entidad (con mejora de JSON completo)

**Componentes UI Avanzados Implementados** 🆕:
- **SmartAutocomplete**: Sugerencias contextuales inteligentes
- **ContextualTooltip**: Tooltips con estilo ING corporativo
- **MicroInteractions**: Animaciones sutiles profesionales
- **AdaptiveLoading**: Estados de carga adaptativos (pulse, spin)
- **ThinkingLoader**: Animación "Pensando..." con puntos cíclicos

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