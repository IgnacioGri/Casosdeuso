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
            
            // Re-throw with detailed information
            if (ex is InvalidOperationException)
            {
                return new IntelligentTestCaseResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
            else
            {
                return new IntelligentTestCaseResponse
                {
                    Success = false,
                    Error = $"Error al generar casos de prueba inteligentes: {ex.Message}"
                };
            }
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
            UseCaseType.API => "Incluir pruebas de endpoints, formatos de request/response, códigos de estado HTTP, y manejo de errores.",
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
      ""observations"": ""observaciones técnicas importantes, consideraciones o puntos de atención específicos para esta prueba""
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
- ⚠️ FORMATO OBLIGATORIO para preconditions: Usar BULLETS (•) exclusivamente, NO listas numeradas
- Ejemplo preconditions: "• Usuario con permisos logueado • Base de datos con datos de prueba • Sistema en ambiente UAT"

Responde ÚNICAMENTE con el JSON válido.
";
    }

    private IntelligentTestCaseResponse ParseTestCaseResult(string jsonResult)
    {
        try
        {
            _logger.LogInformation($"Raw intelligent test result: {jsonResult.Substring(0, Math.Min(500, jsonResult.Length))}...");
            
            // Clean the AI response more aggressively
            var cleanedResult = jsonResult;
            
            // Remove markdown code blocks
            cleanedResult = Regex.Replace(cleanedResult, @"```json\s*", "", RegexOptions.IgnoreCase);
            cleanedResult = Regex.Replace(cleanedResult, @"```\s*", "", RegexOptions.IgnoreCase);
            
            // Extract JSON object - find first { and last }
            var firstBrace = cleanedResult.IndexOf('{');
            var lastBrace = cleanedResult.LastIndexOf('}');
            
            if (firstBrace != -1 && lastBrace != -1)
            {
                cleanedResult = cleanedResult.Substring(firstBrace, lastBrace - firstBrace + 1);
            }
            
            cleanedResult = cleanedResult.Trim();
            _logger.LogInformation($"Cleaned intelligent test result for JSON parsing: {cleanedResult}");

            using var document = JsonDocument.Parse(cleanedResult);
            var root = document.RootElement;
            _logger.LogInformation("Parsed intelligent test result successfully");

            // Parse test steps
            var testSteps = new List<TestStep>();
            if (root.TryGetProperty("testSteps", out var stepsElement) && stepsElement.ValueKind == JsonValueKind.Array)
            {
                testSteps = stepsElement.EnumerateArray()
                    .Select(ParseTestStep)
                    .ToList();
            }
            
            // Validate the parsed result has required fields
            if (testSteps.Count == 0)
            {
                _logger.LogWarning("AI response missing testSteps array or empty, generating fallback test steps");
                testSteps = GenerateFallbackTestSteps(formData.UseCaseName);
            }

            var response = new IntelligentTestCaseResponse
            {
                Success = true,
                Objective = GetStringProperty(root, "objective", ""),
                Preconditions = GetStringProperty(root, "preconditions", ""),
                TestSteps = testSteps,
                AnalysisNotes = GetStringProperty(root, "analysisNotes", "")
            };

            return response;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, $"Error parsing test case result JSON: {jsonResult}");
            
            // Try to provide a helpful error message
            if (ex.Message.Contains("Unexpected character"))
            {
                throw new InvalidOperationException("La respuesta de IA no tiene el formato JSON esperado. Por favor, intente nuevamente.");
            }
            else
            {
                throw new InvalidOperationException($"Error al procesar la respuesta de IA: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error parsing test case result");
            throw new InvalidOperationException($"Error al procesar la respuesta de IA: {ex.Message}");
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
    
    private List<TestStep> GenerateFallbackTestSteps(string useCaseName)
    {
        var baseSteps = new List<TestStep>
        {
            new TestStep
            {
                Number = 1,
                Action = "Acceder al sistema con credenciales válidas",
                InputData = "Usuario y contraseña correctos",
                ExpectedResult = "Acceso exitoso al sistema",
                Observations = "Verificar logs de auditoría",
                Status = TestStepStatus.Pending
            },
            new TestStep
            {
                Number = 2,
                Action = $"Navegar a la funcionalidad {useCaseName}",
                InputData = "Menú principal o acceso directo",
                ExpectedResult = "Pantalla de la funcionalidad desplegada correctamente",
                Observations = "Verificar tiempo de carga",
                Status = TestStepStatus.Pending
            }
        };

        // Add type-specific steps based on use case name
        if (useCaseName.Contains("Gestionar") || useCaseName.Contains("gestionar"))
        {
            baseSteps.AddRange(new[]
            {
                new TestStep
                {
                    Number = 3,
                    Action = "Realizar búsqueda con filtros válidos",
                    InputData = "Filtros de búsqueda configurados",
                    ExpectedResult = "Resultados mostrados correctamente",
                    Observations = "Verificar paginación",
                    Status = TestStepStatus.Pending
                },
                new TestStep
                {
                    Number = 4,
                    Action = "Validar campos obligatorios",
                    InputData = "Dejar campos obligatorios vacíos",
                    ExpectedResult = "Mensaje de error correspondiente",
                    Observations = "Verificar mensajes de validación",
                    Status = TestStepStatus.Pending
                },
                new TestStep
                {
                    Number = 5,
                    Action = "Crear nuevo registro",
                    InputData = "Datos válidos en todos los campos",
                    ExpectedResult = "Registro creado exitosamente",
                    Observations = "Verificar auditoría",
                    Status = TestStepStatus.Pending
                }
            });
        }
        else
        {
            baseSteps.Add(new TestStep
            {
                Number = 3,
                Action = "Ejecutar funcionalidad principal",
                InputData = "Datos de prueba válidos",
                ExpectedResult = "Operación completada exitosamente",
                Observations = "Verificar resultado esperado",
                Status = TestStepStatus.Pending
            });
        }

        return baseSteps;
    }
}