# Lista Completa: Archivos a Copiar del Sistema C#

## ✅ Carpetas COMPLETAS a Copiar (Incluyen Estilos)

### 1. **UseCaseGenerator.sln**
```
📄 UseCaseGenerator.sln   # Archivo principal de solución - OBLIGATORIO
```

### 2. **UseCaseGenerator.Server/** (Backend completo)
```
📁 UseCaseGenerator.Server/
├── 📁 Controllers/                    # 5 controladores de API
│   ├── AIAssistController.cs
│   ├── DocumentController.cs
│   ├── IntelligentTestCaseController.cs
│   ├── MinuteAnalysisController.cs
│   └── UseCaseController.cs
├── 📁 Services/                       # 9 servicios de negocio
│   ├── AIService.cs                   # ⭐ CON MICROSOFT COPILOT
│   ├── DocumentService.cs
│   ├── IAIService.cs
│   ├── IDocumentService.cs
│   ├── IIntelligentTestCaseService.cs
│   ├── IMinuteAnalysisService.cs
│   ├── IUseCaseRepository.cs
│   ├── IntelligentTestCaseService.cs
│   ├── MinuteAnalysisService.cs
│   └── UseCaseRepository.cs
├── 📁 Data/
│   └── AppDbContext.cs                # Configuración base de datos
├── 📁 Properties/
│   └── launchSettings.json            # Configuración puertos
├── 📄 Program.cs                      # Punto de entrada servidor
├── 📄 UseCaseGenerator.Server.csproj  # Dependencias del proyecto
├── 📄 appsettings.json                # Configuración producción
└── 📄 appsettings.Development.json    # Configuración desarrollo
```

### 3. **UseCaseGenerator.Client/** (Frontend completo CON ESTILOS)
```
📁 UseCaseGenerator.Client/
├── 📁 Components/                     # 10 componentes Blazor
│   ├── AIConfigurationStep.razor     # ⭐ CON MICROSOFT COPILOT
│   ├── BasicInfoStep.razor
│   ├── BusinessRulesStep.razor
│   ├── DescriptionStep.razor
│   ├── EntityFieldsStep.razor
│   ├── FiltersColumnsStep.razor
│   ├── ReviewGenerateStep.razor
│   ├── TestCasesStep.razor
│   ├── UseCaseTypeStep.razor
│   └── WireframesFlowsStep.razor
├── 📁 Pages/                          # 5 páginas principales
│   ├── Generator.razor                # Página principal
│   ├── History.razor
│   ├── Index.razor
│   ├── MinuteAnalysis.razor
│   └── TestCases.razor
├── 📁 Services/                       # 8 servicios cliente
│   ├── AIAssistService.cs
│   ├── DocumentService.cs
│   ├── FormStateService.cs
│   ├── IAIAssistService.cs
│   ├── IDocumentService.cs
│   ├── IFormStateService.cs
│   ├── IUseCaseService.cs
│   └── UseCaseService.cs
├── 📁 Shared/                         # Componentes compartidos
│   ├── MainLayout.razor               # Layout principal
│   └── NavMenu.razor                  # Menú navegación
├── 📁 wwwroot/                        # ⭐ ARCHIVOS ESTÁTICOS Y ESTILOS
│   ├── 📁 css/
│   │   └── app.css                    # ⭐ ESTILOS PERSONALIZADOS ING
│   ├── index.html                     # HTML principal
│   └── service-worker.js              # Service worker
├── 📄 App.razor                       # Componente raíz
├── 📄 Program.cs                      # Bootstrap cliente
└── 📄 UseCaseGenerator.Client.csproj  # Dependencias MudBlazor
```

### 4. **UseCaseGenerator.Shared/** (Modelos compartidos)
```
📁 UseCaseGenerator.Shared/
├── 📁 DTOs/
│   └── UseCaseFormData.cs             # Objetos transferencia datos
├── 📁 Models/
│   └── UseCase.cs                     # ⭐ ENUM AIMODEL CON COPILOT
├── 📁 Validators/
│   └── UseCaseFormValidator.cs        # Validadores formularios
└── 📄 UseCaseGenerator.Shared.csproj  # Configuración proyecto
```

## ✅ Los ESTILOS Están Incluidos

### Estilos Principales:
1. **app.css** - Estilos personalizados ING corporativos
2. **MudBlazor.min.css** - Se descarga automáticamente via NuGet
3. **Segoe UI fonts** - Cargadas desde Google Fonts
4. **Material Icons** - Para iconos de la interfaz

### Archivo de Estilos Personalizado:
```css
/* UseCaseGenerator.Client/wwwroot/css/app.css */
/* Contiene todos los estilos ING corporativos */
```

## ⚠️ Archivos que NO Debes Copiar

```
❌ bin/           # Archivos compilados (se generan automáticamente)
❌ obj/           # Archivos temporales (se generan automáticamente)
❌ .vs/           # Configuración Visual Studio
❌ *.user         # Configuraciones personales
```

## 📋 Checklist de Copia

### ✅ Verificar que tienes:
- [ ] UseCaseGenerator.sln (archivo raíz)
- [ ] UseCaseGenerator.Server/ (carpeta completa)
- [ ] UseCaseGenerator.Client/ (carpeta completa CON wwwroot/css/)
- [ ] UseCaseGenerator.Shared/ (carpeta completa)
- [ ] INSTALACION_LOCAL.md (esta guía)

### ✅ Total de archivos principales:
- **30+ archivos .cs** (código C#)
- **10+ archivos .razor** (componentes Blazor)
- **3 archivos .csproj** (configuración proyectos)
- **1 archivo .sln** (solución)
- **app.css** (estilos ING personalizados)
- **index.html** (HTML principal)

## 🎯 Resultado Final

Tendrás un **sistema completo C# Blazor WebAssembly** con:

✅ **Microsoft Copilot integrado** en todos los dropdowns  
✅ **Estilos ING corporativos** aplicados  
✅ **MudBlazor UI** profesional  
✅ **5 modelos de IA** funcionales  
✅ **Exportación DOCX** con formato Microsoft  
✅ **Compilación limpia** sin errores  

**Los estilos están 100% incluidos** en la carpeta wwwroot/css/ del proyecto Cliente.