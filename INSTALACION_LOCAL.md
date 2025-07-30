# Guía Completa: Instalación del Sistema C# Blazor WebAssembly en Local

## Prerrequisitos

### Software Necesario:
1. **.NET 8 SDK** (versión 8.0 o superior)
   - Descargar desde: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verificar instalación: `dotnet --version`

2. **Visual Studio 2022** o **Visual Studio Code**
   - Visual Studio 2022 (recomendado): Community, Professional o Enterprise
   - VS Code: Instalar extensión C# Dev Kit

3. **Git** (opcional, para clonar el repositorio)

## Archivos a Copiar

### Estructura Completa del Proyecto:
```
UseCaseGenerator/
├── UseCaseGenerator.sln                    # Archivo de solución principal
├── INSTALACION_LOCAL.md                    # Esta guía
├── README.md                               # Documentación del proyecto
├── UseCaseGenerator.Server/                # Proyecto del backend (ASP.NET Core)
│   ├── Controllers/                        # Controladores de API
│   ├── Services/                          # Lógica de negocio
│   ├── Data/                              # Configuración de base de datos
│   ├── Program.cs                         # Punto de entrada del servidor
│   ├── UseCaseGenerator.Server.csproj     # Configuración del proyecto
│   ├── appsettings.json                   # Configuración de producción
│   └── appsettings.Development.json       # Configuración de desarrollo
├── UseCaseGenerator.Client/               # Proyecto del frontend (Blazor WASM)
│   ├── Components/                        # Componentes Blazor
│   ├── Pages/                             # Páginas de la aplicación
│   ├── Services/                          # Servicios del cliente
│   ├── Shared/                            # Componentes compartidos
│   ├── wwwroot/                           # Archivos estáticos
│   ├── App.razor                          # Componente raíz
│   ├── Program.cs                         # Bootstrap del cliente
│   └── UseCaseGenerator.Client.csproj     # Configuración del proyecto
└── UseCaseGenerator.Shared/               # Proyecto compartido
    ├── DTOs/                              # Objetos de transferencia de datos
    ├── Models/                            # Modelos de dominio
    ├── Validators/                        # Validadores
    └── UseCaseGenerator.Shared.csproj     # Configuración del proyecto
```

## Pasos de Instalación

### 1. Copiar Archivos
Copia **TODAS** las siguientes carpetas y archivos desde Replit a tu máquina local:

```
- UseCaseGenerator.sln
- INSTALACION_LOCAL.md
- UseCaseGenerator.Server/ (completa)
- UseCaseGenerator.Client/ (completa)
- UseCaseGenerator.Shared/ (completa)
```

### 2. Abrir el Proyecto
```bash
# Opción A: Visual Studio 2022
# Doble clic en UseCaseGenerator.sln

# Opción B: Visual Studio Code
code UseCaseGenerator/

# Opción C: Línea de comandos
cd UseCaseGenerator
dotnet restore
```

### 3. Restaurar Dependencias
```bash
cd UseCaseGenerator
dotnet restore
```

### 4. Compilar el Proyecto
```bash
dotnet build
```

### 5. Configurar API Keys (Opcional)
Edita `UseCaseGenerator.Server/appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "OpenAI": {
    "ApiKey": "tu_openai_api_key_aqui"
  },
  "Anthropic": {
    "ApiKey": "tu_anthropic_api_key_aqui"
  },
  "Gemini": {
    "ApiKey": "tu_gemini_api_key_aqui"
  },
  "Grok": {
    "ApiKey": "tu_grok_api_key_aqui"
  },
  "Copilot": {
    "ApiKey": "tu_copilot_api_key_aqui"
  }
}
```

**Nota:** El sistema funciona completamente en modo Demo sin API keys.

## Ejecutar la Aplicación

### Opción A: Visual Studio 2022
1. Establecer `UseCaseGenerator.Server` como proyecto de inicio
2. Presionar F5 o hacer clic en "Ejecutar"

### Opción B: Línea de Comandos
```bash
# Terminal 1: Ejecutar el servidor (backend)
cd UseCaseGenerator.Server
dotnet run

# Terminal 2: Ejecutar el cliente (frontend) - Solo si es necesario
cd UseCaseGenerator.Client
dotnet run
```

### Opción C: Ejecución Automática (Recomendada)
```bash
cd UseCaseGenerator.Server
dotnet run
```
El servidor automáticamente sirve tanto el backend como el frontend.

## URLs de Acceso

Una vez ejecutándose:

- **Aplicación principal:** https://localhost:7001
- **API Backend:** https://localhost:7001/api/
- **Swagger/OpenAPI:** https://localhost:7001/swagger

## Verificación de Instalación

### 1. Compilación Exitosa
```bash
dotnet build
# Debe mostrar: Build succeeded. 0 Warning(s). 0 Error(s)
```

### 2. Ejecución del Servidor
```bash
cd UseCaseGenerator.Server
dotnet run
# Debe mostrar: Now listening on: https://localhost:7001
```

### 3. Acceso a la Aplicación
- Abrir navegador en https://localhost:7001
- Verificar que aparece la interfaz del generador de casos de uso
- Confirmar que el dropdown de Microsoft Copilot está presente

## Funcionalidades Disponibles

✅ **Generación completa de casos de uso** con 9 pasos  
✅ **Microsoft Copilot integrado** en todos los dropdowns  
✅ **5 modelos de IA** (Demo, OpenAI, Claude, Grok, Gemini, Copilot)  
✅ **Exportación a DOCX** con formato Microsoft  
✅ **Análisis de minutas** automático  
✅ **Generación de casos de prueba** inteligente  
✅ **AI Assist** para mejora individual de campos  
✅ **Estándares ING** aplicados automáticamente  

## Solución de Problemas

### Error: "No se puede encontrar el SDK de .NET"
```bash
dotnet --version
# Si no funciona, reinstalar .NET 8 SDK
```

### Error: "No se pueden restaurar los paquetes"
```bash
dotnet nuget locals all --clear
dotnet restore --force
```

### Error: "Puerto en uso"
```bash
# Cambiar el puerto en launchSettings.json
# O matar procesos: taskkill /f /im dotnet.exe
```

### Problemas de CORS
El proyecto está configurado para aceptar todas las conexiones locales.

## Estructura del Código

- **Controllers/**: APIs REST para cada funcionalidad
- **Services/**: Lógica de negocio e integración con IA
- **Components/**: Componentes Blazor reutilizables
- **Models/**: Definiciones de datos tipados
- **DTOs/**: Objetos de transferencia entre capas

## Próximos Pasos

1. **Personalizar configuración** en appsettings.json
2. **Agregar API keys** para proveedores de IA
3. **Configurar base de datos** (opcional, usa in-memory por defecto)
4. **Personalizar estilos** en wwwroot/css/
5. **Agregar funcionalidades** adicionales según necesidades

## Soporte

El sistema está completamente funcional y listo para producción. Todos los componentes están integrados y probados.