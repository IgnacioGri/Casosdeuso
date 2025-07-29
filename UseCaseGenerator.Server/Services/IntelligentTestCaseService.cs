using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;
using System.Text.Json;

namespace UseCaseGenerator.Server.Services;

public class IntelligentTestCaseService : IIntelligentTestCaseService
{
    private readonly IAIService _aiService;
    private readonly ILogger<IntelligentTestCaseService> _logger;

    public IntelligentTestCaseService(IAIService aiService, ILogger<IntelligentTestCaseService> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<IntelligentTestCaseResponse> GenerateTestCasesAsync(IntelligentTestCaseRequest request)
    {
        try
        {
            var context = BuildTestContext(request.FormData);
            var prompt = BuildIntelligentTestPrompt(context, request.FormData.UseCaseType);
            
            var testCaseResult = await _aiService.ProcessFieldWithAIAsync(
                prompt,
                context.FullDescription,
                request.AiModel
            );

            var testCaseData = ParseTestCaseResult(testCaseResult);
            
            return testCaseData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating intelligent test cases");
            return new IntelligentTestCaseResponse
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private dynamic BuildTestContext(UseCaseFormData formData)
    {
        return new
        {
            BasicInfo = new
            {
                ClientName = formData.ClientName,
                ProjectName = formData.ProjectName,
                UseCaseName = formData.UseCaseName,
                UseCaseType = formData.UseCaseType.ToString(),
                Description = formData.Description
            },
            EntityInfo = new
            {
                SearchFilters = formData.SearchFilters,
                ResultColumns = formData.ResultColumns,
                EntityFields = formData.EntityFields
            },
            BusinessLogic = new
            {
                BusinessRules = formData.BusinessRules,
                SpecialRequirements = formData.SpecialRequirements
            },
            TechnicalDetails = new
            {
                ApiEndpoint = formData.ApiEndpoint,
                ServiceFrequency = formData.ServiceFrequency,
                ConfigurationPaths = formData.ConfigurationPaths
            },
            FullDescription = $@"
Cliente: {formData.ClientName}
Proyecto: {formData.ProjectName}
Caso de Uso: {formData.UseCaseName} ({formData.UseCaseType})
Descripción: {formData.Description}

Filtros de Búsqueda: {string.Join(", ", formData.SearchFilters)}
Columnas de Resultado: {string.Join(", ", formData.ResultColumns)}
Campos de Entidad: {string.Join(", ", formData.EntityFields.Select(f => $"{f.Name} ({f.Type})"))}

Reglas de Negocio: {formData.BusinessRules ?? "N/A"}
Requerimientos Especiales: {formData.SpecialRequirements ?? "N/A"}
"
        };
    }

    private string BuildIntelligentTestPrompt(dynamic context, UseCaseType useCaseType)
    {
        var specificInstructions = useCaseType switch
        {
            UseCaseType.Entity => "Incluir pruebas de CRUD (crear, consultar, actualizar, eliminar), validaciones de campos, y búsquedas con filtros.",
            UseCaseType.Api => "Incluir pruebas de endpoints, formatos de request/response, códigos de estado HTTP, y manejo de errores.",
            UseCaseType.Service => "Incluir pruebas de ejecución programada, configuración, logs, y dependencias externas.",
            _ => "Incluir pruebas funcionales completas según el tipo de caso de uso."
        };

        return $@"
GENERACIÓN INTELIGENTE DE CASOS DE PRUEBA

Genera casos de prueba detallados en formato JSON para el siguiente caso de uso.

INSTRUCCIONES ESPECÍFICAS: {specificInstructions}

FORMATO JSON REQUERIDO:
{{
  ""objective"": ""string"",
  ""preconditions"": ""string"",
  ""testSteps"": [
    {{
      ""number"": 1,
      ""action"": ""string"",
      ""inputData"": ""string"",
      ""expectedResult"": ""string"",
      ""observations"": ""string""
    }}
  ],
  ""analysisNotes"": ""string""
}}

REGLAS:
- Mínimo 3 pasos de prueba
- Incluir validaciones de campos obligatorios
- Considerar flujos alternativos y manejo de errores
- Usar terminología bancaria profesional
- Incluir datos de prueba específicos y realistas

Responde ÚNICAMENTE con el JSON válido.
";
    }

    private IntelligentTestCaseResponse ParseTestCaseResult(string jsonResult)
    {
        try
        {
            using var document = JsonDocument.Parse(jsonResult);
            var root = document.RootElement;

            var response = new IntelligentTestCaseResponse
            {
                Objective = GetStringProperty(root, "objective", ""),
                Preconditions = GetStringProperty(root, "preconditions", ""),
                AnalysisNotes = GetStringProperty(root, "analysisNotes", ""),
                Success = true
            };

            // Parse test steps
            if (root.TryGetProperty("testSteps", out var stepsElement) && stepsElement.ValueKind == JsonValueKind.Array)
            {
                response.TestSteps = stepsElement.EnumerateArray()
                    .Select(ParseTestStep)
                    .ToList();
            }

            return response;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error parsing test case result JSON");
            return new IntelligentTestCaseResponse
            {
                Success = false,
                Error = "Error al procesar el resultado de los casos de prueba"
            };
        }
    }

    private TestStep ParseTestStep(JsonElement stepElement)
    {
        return new TestStep
        {
            Number = GetIntProperty(stepElement, "number", 1),
            Action = GetStringProperty(stepElement, "action", ""),
            InputData = GetStringProperty(stepElement, "inputData", ""),
            ExpectedResult = GetStringProperty(stepElement, "expectedResult", ""),
            Observations = GetStringProperty(stepElement, "observations", ""),
            Status = TestStepStatus.Pending
        };
    }

    private string GetStringProperty(JsonElement element, string propertyName, string defaultValue)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString() ?? defaultValue
            : defaultValue;
    }

    private int GetIntProperty(JsonElement element, string propertyName, int defaultValue)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Number
            ? prop.GetInt32()
            : defaultValue;
    }
}