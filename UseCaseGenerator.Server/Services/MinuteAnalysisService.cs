using UseCaseGenerator.Server.Services;
using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;
using System.Text.Json;

namespace UseCaseGenerator.Server.Services;

public class MinuteAnalysisService : IMinuteAnalysisService
{
    private readonly IAIService _aiService;
    private readonly ILogger<MinuteAnalysisService> _logger;

    public MinuteAnalysisService(IAIService aiService, ILogger<MinuteAnalysisService> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<MinuteAnalysisResponse> AnalyzeMinuteAsync(MinuteAnalysisRequest request)
    {
        try
        {
            var prompt = BuildAnalysisPrompt();
            var analysisResult = await _aiService.ProcessFieldWithAIAsync(prompt, request.Content, request.AiModel);
            
            var formData = ParseAnalysisResult(analysisResult);
            
            return new MinuteAnalysisResponse
            {
                ExtractedData = formData,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing minute");
            return new MinuteAnalysisResponse
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private string BuildAnalysisPrompt()
    {
        return @"
ANÁLISIS DE MINUTA DE CASO DE USO

Analiza el siguiente documento y extrae la información del caso de uso.

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:
1. clientName: Es el nombre de la EMPRESA/BANCO/ORGANIZACIÓN cliente (NO el nombre del caso de uso)
   - Buscar palabras como ""Banco"", ""Cohen"", ""Macro"", ""Provincia"", nombres de empresas
   - Ejemplo correcto: ""Cohen Aliados Financieros"", ""Banco Macro"", ""Banco Provincia""
   
2. projectName: Es el nombre del PROYECTO o SISTEMA (NO el caso de uso)
   - Buscar frases como ""Sistema de"", ""Módulo de"", ""Plataforma de""
   - Si no está explícito, inferir del contexto (ej: si habla de proveedores, podría ser ""Sistema de Gestión de Proveedores"")
   - NO dejar vacío si se puede inferir del contexto
   
3. useCaseCode: Es el CÓDIGO alfanumérico del caso de uso
   - Formato: letras+números (ej: PV003, BP005, UC001)
   - NO confundir con nombres o descripciones
   
4. useCaseName: Es el NOMBRE del caso de uso (acción + entidad)
   - DEBE empezar con verbo infinitivo
   - Ejemplo: ""Gestionar Clientes"", ""Mostrar proveedores"", ""Consultar Saldos""
   - NO poner aquí el nombre del cliente ni proyecto

5. description: Descripción del QUÉ HACE el caso de uso
   - Si viene muy corta (menos de 10 palabras), devolver tal cual viene
   - NO expandir aquí, solo extraer lo que dice la minuta

NUNCA MEZCLAR:
- NO poner el nombre del cliente en useCaseName
- NO poner el nombre del caso de uso en clientName
- NO dejar projectName vacío si se puede inferir

Estructura JSON requerida:
{
  ""clientName"": ""string"",
  ""projectName"": ""string"", 
  ""useCaseCode"": ""string"",
  ""useCaseName"": ""string"",
  ""fileName"": ""string"",
  ""description"": ""string"",
  ""searchFilters"": [""string""],
  ""resultColumns"": [""string""],
  ""entityFields"": [
    {
      ""name"": ""string"",
      ""type"": ""text|number|decimal|date|datetime|boolean|email"",
      ""mandatory"": true|false,
      ""length"": number,
      ""description"": ""string"",
      ""validationRules"": ""string""
    }
  ],
  ""serviceFrequency"": ""string (para servicios: Diariamente, Semanalmente, Mensualmente, etc.)"",
  ""executionTime"": ""string (para servicios: 02:00 AM, 14:30, etc.)"",
  ""configurationPaths"": ""string (para servicios: rutas de archivos configurables)"",
  ""webServiceCredentials"": ""string (para servicios: credenciales de APIs externas)"",
  ""apiEndpoint"": ""string (para APIs: URL del endpoint)"",
  ""httpMethod"": ""string (para APIs: GET, POST, PUT, DELETE)"",
  ""requestFormat"": ""string (para APIs: formato de request)"",
  ""responseFormat"": ""string (para APIs: formato de response)"",
  ""businessRules"": ""⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas. Ejemplo: • Regla de validación • Regla de acceso"",
  ""specialRequirements"": ""⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas. Ejemplo: • Tiempo de respuesta < 3s • Validación HTTPS"",
  ""isAIGenerated"": true
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
";
    }

    private UseCaseFormData ParseAnalysisResult(string jsonResult)
    {
        try
        {
            using var document = JsonDocument.Parse(jsonResult);
            var root = document.RootElement;

            var formData = new UseCaseFormData
            {
                ClientName = GetStringProperty(root, "clientName", ""),
                ProjectName = GetStringProperty(root, "projectName", ""),
                UseCaseCode = GetStringProperty(root, "useCaseCode", ""),
                UseCaseName = GetStringProperty(root, "useCaseName", ""),
                FileName = GetStringProperty(root, "fileName", ""),
                Description = GetStringProperty(root, "description", ""),
                IsAIGenerated = GetBoolProperty(root, "isAIGenerated", true)
            };
            
            // Validation and correction of common AI parsing errors
            var infinitiveVerbs = new[] { "gestionar", "crear", "mostrar", "consultar", "ver", "actualizar", "eliminar", "procesar" };
            
            // Check if clientName contains a verb (likely mixed with useCaseName)
            if (!string.IsNullOrEmpty(formData.ClientName) && 
                infinitiveVerbs.Any(verb => formData.ClientName.ToLower().Contains(verb)))
            {
                _logger.LogWarning("⚠️ clientName contains a verb, likely mixed with useCaseName");
                // Swap if needed
                if (!string.IsNullOrEmpty(formData.UseCaseName) && 
                    !infinitiveVerbs.Any(verb => formData.UseCaseName.ToLower().StartsWith(verb)))
                {
                    var temp = formData.ClientName;
                    formData.ClientName = formData.UseCaseName;
                    formData.UseCaseName = temp;
                    _logger.LogInformation("✓ Swapped clientName and useCaseName");
                }
            }
            
            // Validate useCaseName starts with infinitive verb
            if (!string.IsNullOrEmpty(formData.UseCaseName) && 
                !infinitiveVerbs.Any(verb => formData.UseCaseName.ToLower().StartsWith(verb)))
            {
                _logger.LogError("⚠️ useCaseName does not start with infinitive verb: {UseCaseName}", formData.UseCaseName);
                // Try to fix common patterns
                if (!string.IsNullOrEmpty(formData.Description) && 
                    formData.Description.ToLower().StartsWith("mostrar"))
                {
                    formData.UseCaseName = formData.Description;
                    _logger.LogInformation("✓ Fixed useCaseName from description");
                }
            }
            
            // Check if projectName is empty but can be inferred
            if (string.IsNullOrEmpty(formData.ProjectName))
            {
                _logger.LogWarning("⚠️ projectName is empty, trying to infer...");
                // Try to infer from context
                if (!string.IsNullOrEmpty(formData.UseCaseName))
                {
                    if (formData.UseCaseName.ToLower().Contains("proveedores"))
                    {
                        formData.ProjectName = "Sistema de Gestión de Proveedores";
                    }
                    else if (formData.UseCaseName.ToLower().Contains("clientes"))
                    {
                        formData.ProjectName = "Sistema de Gestión de Clientes";
                    }
                    else
                    {
                        formData.ProjectName = "Sistema de Gestión";
                    }
                    _logger.LogInformation("✓ Inferred projectName: {ProjectName}", formData.ProjectName);
                }
            }

            // Parse search filters
            if (root.TryGetProperty("searchFilters", out var filtersElement) && filtersElement.ValueKind == JsonValueKind.Array)
            {
                formData.SearchFilters = filtersElement.EnumerateArray()
                    .Select(f => f.GetString() ?? "")
                    .Where(f => !string.IsNullOrEmpty(f))
                    .ToList();
            }

            // Parse result columns
            if (root.TryGetProperty("resultColumns", out var columnsElement) && columnsElement.ValueKind == JsonValueKind.Array)
            {
                formData.ResultColumns = columnsElement.EnumerateArray()
                    .Select(c => c.GetString() ?? "")
                    .Where(c => !string.IsNullOrEmpty(c))
                    .ToList();
            }

            // Parse entity fields
            if (root.TryGetProperty("entityFields", out var fieldsElement) && fieldsElement.ValueKind == JsonValueKind.Array)
            {
                formData.EntityFields = fieldsElement.EnumerateArray()
                    .Select(ParseEntityField)
                    .Where(f => !string.IsNullOrEmpty(f.Name))
                    .ToList();
            }

            // Parse business rules
            if (root.TryGetProperty("businessRules", out var rulesElement) && rulesElement.ValueKind == JsonValueKind.Array)
            {
                var rules = rulesElement.EnumerateArray()
                    .Select(r => r.GetString() ?? "")
                    .Where(r => !string.IsNullOrEmpty(r));
                formData.BusinessRules = string.Join("\n", rules);
            }

            // Parse special requirements
            if (root.TryGetProperty("specialRequirements", out var reqsElement) && reqsElement.ValueKind == JsonValueKind.Array)
            {
                var requirements = reqsElement.EnumerateArray()
                    .Select(r => r.GetString() ?? "")
                    .Where(r => !string.IsNullOrEmpty(r));
                formData.SpecialRequirements = string.Join("\n", requirements);
            }

            // Parse service-specific fields (for service/process use cases)
            formData.ServiceFrequency = GetStringProperty(root, "serviceFrequency", "");
            formData.ExecutionTime = GetStringProperty(root, "executionTime", "");
            formData.ConfigurationPaths = GetStringProperty(root, "configurationPaths", "");
            formData.WebServiceCredentials = GetStringProperty(root, "webServiceCredentials", "");
            
            // Parse API-specific fields (for API use cases)
            formData.ApiEndpoint = GetStringProperty(root, "apiEndpoint", "");
            formData.HttpMethod = GetStringProperty(root, "httpMethod", "");
            formData.RequestFormat = GetStringProperty(root, "requestFormat", "");
            formData.ResponseFormat = GetStringProperty(root, "responseFormat", "");

            return formData;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error parsing analysis result JSON");
            throw new InvalidOperationException("Error al procesar el resultado del análisis", ex);
        }
    }

    private EntityField ParseEntityField(JsonElement fieldElement)
    {
        var field = new EntityField
        {
            Name = GetStringProperty(fieldElement, "name", ""),
            Mandatory = GetBoolProperty(fieldElement, "mandatory", false),
            Description = GetStringProperty(fieldElement, "description", ""),
            ValidationRules = GetStringProperty(fieldElement, "validationRules", "")
        };

        // Parse field type
        var typeString = GetStringProperty(fieldElement, "type", "text");
        field.Type = typeString;

        // Parse length
        if (fieldElement.TryGetProperty("length", out var lengthElement) && lengthElement.ValueKind == JsonValueKind.Number)
        {
            field.Length = lengthElement.GetInt32();
        }

        return field;
    }

    private string GetStringProperty(JsonElement element, string propertyName, string defaultValue)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString() ?? defaultValue
            : defaultValue;
    }

    private bool GetBoolProperty(JsonElement element, string propertyName, bool defaultValue)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.True
            ? prop.GetBoolean()
            : defaultValue;
    }
}