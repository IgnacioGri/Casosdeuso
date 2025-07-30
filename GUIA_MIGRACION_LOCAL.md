# Guía Completa de Migración del Sistema C# Blazor a Local

## Resumen del Sistema

Este proyecto contiene un sistema completo de generación de casos de uso con dos implementaciones:

1. **Sistema TypeScript/React** (actualmente funcionando en Replit)
2. **Sistema C# Blazor WebAssembly** (listo para migración local)

Ambos sistemas son funcionalmente idénticos y generan documentos DOCX con casos de prueba integrados.

## Archivos del Sistema C# para Migrar

### Estructura del Proyecto C#

```
UseCaseGenerator/
├── UseCaseGenerator.sln                    # Solución principal
├── UseCaseGenerator.Client/                # Frontend Blazor WebAssembly
│   ├── UseCaseGenerator.Client.csproj
│   ├── Program.cs
│   ├── App.razor
│   ├── MainLayout.razor
│   ├── NavMenu.razor
│   ├── wwwroot/
│   │   ├── index.html
│   │   ├── css/app.css
│   │   └── js/app.js
│   ├── Components/
│   │   ├── FormSteps/
│   │   │   ├── BasicInformationStep.razor
│   │   │   ├── ProjectInformationStep.razor
│   │   │   ├── UseCaseDescriptionStep.razor
│   │   │   ├── BusinessRulesStep.razor
│   │   │   ├── SearchFiltersStep.razor
│   │   │   ├── ResultColumnsStep.razor
│   │   │   ├── EntityFieldsStep.razor
│   │   │   ├── TestCaseStep.razor
│   │   │   └── AIConfigurationStep.razor
│   │   ├── Shared/
│   │   │   ├── NavigationButtons.razor
│   │   │   ├── FormProgress.razor
│   │   │   └── DocumentPreview.razor
│   │   └── UseCaseGenerator.razor          # Componente principal
│   └── Services/
│       ├── UseCaseService.cs
│       ├── DocumentService.cs
│       └── LocalStorageService.cs
├── UseCaseGenerator.Server/                # Backend ASP.NET Core
│   ├── UseCaseGenerator.Server.csproj
│   ├── Program.cs
│   ├── Controllers/
│   │   ├── UseCaseController.cs
│   │   ├── DocumentController.cs
│   │   ├── AIController.cs
│   │   └── MinuteAnalysisController.cs
│   ├── Services/
│   │   ├── AIService.cs
│   │   ├── DocumentService.cs
│   │   ├── MinuteAnalysisService.cs
│   │   └── IntelligentTestCaseService.cs
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Repositories/
│   │       └── UseCaseRepository.cs
│   └── Models/
│       └── UseCase.cs
└── UseCaseGenerator.Shared/                # Modelos compartidos
    ├── UseCaseGenerator.Shared.csproj
    ├── Models/
    │   ├── UseCase.cs
    │   ├── FormData.cs
    │   ├── TestCase.cs
    │   └── EntityField.cs
    └── DTOs/
        ├── UseCaseFormData.cs
        ├── AIAssistRequest.cs
        └── MinuteAnalysisRequest.cs
```

## Pasos de Migración

### 1. Preparación del Entorno Local

```bash
# Instalar .NET 8 SDK
# Descargar desde: https://dotnet.microsoft.com/download/dotnet/8.0

# Verificar instalación
dotnet --version

# Crear directorio del proyecto
mkdir UseCaseGenerator
cd UseCaseGenerator
```

### 2. Copiar Archivos del Proyecto

Copiar todos los archivos de los siguientes directorios de Replit:

- `UseCaseGenerator.Client/` → Tu directorio local
- `UseCaseGenerator.Server/` → Tu directorio local  
- `UseCaseGenerator.Shared/` → Tu directorio local
- `UseCaseGenerator.sln` → Tu directorio local

### 3. Restaurar Dependencias

```bash
cd UseCaseGenerator

# Restaurar dependencias de toda la solución
dotnet restore

# Verificar que todo compile
dotnet build
```

### 4. Configuración de Variables de Entorno

Crear archivo `appsettings.json` en `UseCaseGenerator.Server/`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=UseCaseGeneratorDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "AIServices": {
    "OpenAI": {
      "ApiKey": "TU_OPENAI_API_KEY_AQUI"
    },
    "Anthropic": {
      "ApiKey": "TU_ANTHROPIC_API_KEY_AQUI"
    },
    "Gemini": {
      "ApiKey": "TU_GEMINI_API_KEY_AQUI"
    },
    "XAI": {
      "ApiKey": "TU_XAI_API_KEY_AQUI"
    }
  }
}
```

### 5. Configuración de Base de Datos (Opcional)

Si quieres usar base de datos SQL Server local:

```bash
# Instalar Entity Framework tools
dotnet tool install --global dotnet-ef

# Crear migración inicial
cd UseCaseGenerator.Server
dotnet ef migrations add InitialCreate

# Aplicar migración
dotnet ef database update
```

**Nota:** El sistema funciona perfectamente con almacenamiento en memoria sin base de datos.

### 6. Ejecución del Sistema

#### Opción A: Ejecutar ambos proyectos por separado

```bash
# Terminal 1 - Backend (Puerto 5000)
cd UseCaseGenerator.Server
dotnet run

# Terminal 2 - Frontend (Puerto 5001)  
cd UseCaseGenerator.Client
dotnet run
```

#### Opción B: Ejecutar con Visual Studio

1. Abrir `UseCaseGenerator.sln` en Visual Studio
2. Configurar múltiples proyectos de inicio:
   - Click derecho en la solución → "Set StartUp Projects"
   - Seleccionar "Multiple startup projects"
   - Configurar ambos proyectos como "Start"
3. Presionar F5 para ejecutar

#### Opción C: Script de inicio automático

Crear `start.bat` (Windows) o `start.sh` (Linux/Mac):

**Windows (start.bat):**
```batch
@echo off
echo Iniciando sistema Use Case Generator...
start cmd /k "cd UseCaseGenerator.Server && dotnet run"
timeout /t 5
start cmd /k "cd UseCaseGenerator.Client && dotnet run"
echo Sistema iniciado. Presiona cualquier tecla para salir...
pause
```

**Linux/Mac (start.sh):**
```bash
#!/bin/bash
echo "Iniciando sistema Use Case Generator..."
cd UseCaseGenerator.Server
dotnet run &
SERVER_PID=$!

sleep 5

cd ../UseCaseGenerator.Client  
dotnet run &
CLIENT_PID=$!

echo "Sistema iniciado. Presiona Ctrl+C para salir..."
wait $SERVER_PID $CLIENT_PID
```

### 7. Verificación del Sistema

1. **Backend disponible en:** `http://localhost:5000`
   - Swagger UI: `http://localhost:5000/swagger`

2. **Frontend disponible en:** `http://localhost:5001`
   - Interfaz principal de la aplicación

3. **Funcionalidades a probar:**
   - Creación de casos de uso paso a paso
   - Generación de casos de prueba inteligentes  
   - Exportación a DOCX con formato ING
   - Análisis de minutas
   - Asistencia de IA en campos individuales

### 8. Configuración de APIs de IA

Para habilitar las funciones de IA, necesitas obtener claves API:

1. **OpenAI:** https://platform.openai.com/api-keys
2. **Anthropic (Claude):** https://console.anthropic.com/
3. **Google Gemini:** https://makersuite.google.com/app/apikey
4. **X.AI (Grok):** https://console.x.ai/

Agregar las claves en `appsettings.json` como se mostró en el paso 4.

### 9. Personalización y Extensión

El sistema está diseñado para ser fácilmente personalizable:

- **Estilos corporativos:** Modificar `wwwroot/css/app.css`
- **Plantillas de documentos:** Editar `Services/DocumentService.cs`
- **Reglas de negocio:** Actualizar validaciones en los componentes
- **Nuevos proveedores de IA:** Extender `Services/AIService.cs`

### 10. Distribución y Deployment

#### Para desarrollo local:
```bash
dotnet publish -c Release -o ./publish
```

#### Para producción (IIS/Azure):
```bash
dotnet publish -c Release -r win-x64 --self-contained true
```

## Ventajas del Sistema C#

1. **Rendimiento superior:** Blazor WebAssembly ejecuta en el cliente
2. **Tipado fuerte:** Detección de errores en tiempo de compilación
3. **Ecosistema .NET:** Acceso a todas las librerías de .NET
4. **Escalabilidad:** Fácil deployment en Azure/AWS
5. **Mantenimiento:** Código más limpio y estructurado
6. **Seguridad:** Validación robusta en servidor y cliente

## Soporte y Resolución de Problemas

### Problemas Comunes:

1. **Error de CORS:** Verificar configuración en `Program.cs`
2. **Puerto ocupado:** Cambiar puertos en `launchSettings.json`
3. **Falta de dependencias:** Ejecutar `dotnet restore`
4. **Error de API keys:** Verificar configuración en `appsettings.json`

### Logs del Sistema:

Los logs se encuentran en:
- Consola durante desarrollo
- `logs/` directory en producción (si está configurado)

## Conclusión

Este sistema C# Blazor es una versión moderna y robusta del generador de casos de uso, con todas las funcionalidades del sistema TypeScript pero con mejor performance y mantenibilidad. 

El sistema está listo para producción y puede ser fácilmente desplegado en cualquier servidor que soporte .NET 8.