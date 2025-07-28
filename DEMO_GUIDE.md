# 🎯 GUÍA DE DEMOSTRACIÓN - MEJORAS AI ASSIST

## 🚀 CÓMO PROBAR CADA MEJORA

### 1. **NUMERACIÓN MULTI-NIVEL (1-a-i)**

#### Paso 8 - Reglas de Negocio:
```
Escribe: "dni unico, validacion email, no eliminar activos"
Presiona AI Assist → Resultado:
1. Dni unico.
   a. Validar formato correcto
   b. Verificar no duplicación en sistema
2. Validacion email.
   a. Verificar estructura de email
   b. Confirmar dominio válido
3. No eliminar activos.
   a. Validar productos asociados
   b. Mostrar mensaje informativo
```

#### Paso 8 - Requerimientos Especiales:
```
Escribe: "integracion servicio externo, combo dinamico"
Presiona AI Assist → Resultado:
1. Integracion servicio externo con validación obligatoria.
   a. Definir formato de intercambio de datos
   b. Configurar timeout de respuesta
2. Combo dinamico.
   a. Cache local para mejorar performance
   b. Actualización automática periódica
```

### 2. **AUTO-CAMPOS ING OBLIGATORIOS**

#### Paso 6 - Campos de Entidad (solo tipo "entidad"):
```
Escribe: "nombre completo texto obligatorio, edad numero opcional"
Presiona AI Assist → Resultado automático incluye:
[
  {"name": "nombreCompleto", "type": "text", "mandatory": true},
  {"name": "edad", "type": "number", "mandatory": true},
  {"name": "fechaAlta", "type": "date", "mandatory": true},      ← AUTO
  {"name": "usuarioAlta", "type": "text", "mandatory": true},    ← AUTO
  {"name": "fechaModificacion", "type": "date", "mandatory": false}, ← AUTO
  {"name": "usuarioModificacion", "type": "text", "mandatory": false} ← AUTO
]
```

### 3. **PROMPTS DINÁMICOS POR TIPO**

#### Tipo "entidad" → Enfoque en CRUD/filtros:
- Descripciones incluyen "búsqueda, alta, modificación, eliminación"
- Campos automáticos de auditoría ING
- Wireframes con tablas y filtros

#### Tipo "api" → Enfoque en request/response:
- Descripciones incluyen "endpoints, validaciones, formatos"
- Campos de configuración técnica
- Wireframes con request/response

#### Tipo "proceso" → Enfoque en pasos de validación:
- Descripciones incluyen "flujo de pasos, validaciones"
- Reglas de negocio de proceso
- Wireframes con flujo secuencial

### 4. **ESPECIALIZACIÓN POR PROVEEDOR AI**

#### OpenAI → Instrucciones paso a paso:
```
INSTRUCCIONES PASO A PASO:
1. Analiza el valor actual del campo
2. Aplica las reglas especificadas de ING
3. Mejora el contenido manteniendo el contexto profesional...
```

#### Claude → Contexto y razonamiento:
```
CONTEXTO: Estás mejorando documentación técnica para un sistema bancario...
OBJETIVO: Transformar el valor actual en una versión profesional...
```

#### Gemini → Formato JSON estructurado:
```
INSTRUCCIONES:
{
  "accion": "mejorar_campo",
  "estilo": "profesional_bancario_ING",
  "formato_respuesta": "solo_contenido_mejorado"
}
```

#### Grok → Instrucciones directas:
```
INSTRUCCIONES DIRECTAS:
- Mejora el contenido siguiendo las reglas ING
- Mantén el estilo profesional bancario
- Sin explicaciones ni formateo extra
```

### 5. **LOGGING DE DESARROLLO**

Abre la consola del navegador (F12) y en las herramientas de desarrollador verás logs detallados:
```
🤖 AI ASSIST PROMPT LOG:
Field: businessRules
Type: businessRules
AI Model: demo
Use Case Type: entidad
Full Prompt:
---
[Prompt completo con contexto ING]
---

🤖 AI RESPONSE: [Respuesta mejorada]
```

## 🎮 DEMO RÁPIDA PASO A PASO

### 1. Abre la aplicación y selecciona "Demo Mode"
### 2. Paso 2: Selecciona tipo "entidad"
### 3. Paso 3: Escribe "banco test" → AI Assist → "Banco Provincia"
### 4. Paso 4: Escribe "crear usuarios" → AI Assist → "Gestionar Usuarios"
### 5. Paso 6: Escribe "nombre, email" → AI Assist → JSON con campos ING
### 6. Paso 8: Reglas: "dni unico" → AI Assist → Lista numerada multi-nivel
### 7. Genera documento final → Ve numeración profesional en el preview

## ✨ TODAS LAS MEJORAS FUNCIONAN EN DEMO MODE

No necesitas API keys para probar todas las funciones. El sistema es completamente funcional en modo demo con ejemplos inteligentes y profesionales.