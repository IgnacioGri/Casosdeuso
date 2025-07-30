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

Analiza el siguiente documento y extrae la información del caso de uso en formato JSON.

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
      ""type"": ""text|number|date|boolean|email"",
      ""mandatory"": true|false,
      ""length"": number
    }
  ],
  ""businessRules"": [""string""],
  ""specialRequirements"": [""string""],
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
            IsMandatory = GetBoolProperty(fieldElement, "mandatory", false)
        };

        // Parse field type
        var typeString = GetStringProperty(fieldElement, "type", "text");
        field.Type = typeString;

        // Parse length
        if (fieldElement.TryGetProperty("length", out var lengthElement) && lengthElement.ValueKind == JsonValueKind.Number)
        {
            field.MaxLength = lengthElement.GetInt32();
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