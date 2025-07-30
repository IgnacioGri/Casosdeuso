using OpenAI;
using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace UseCaseGenerator.Server.Services;

public class AIService : IAIService
{
    private readonly ILogger<AIService> _logger;
    private readonly IConfiguration _configuration;
    private OpenAIClient? _openAIClient;
    private HttpClient? _anthropicClient;
    private HttpClient? _grokClient;
    private HttpClient? _geminiClient;
    private HttpClient? _copilotClient;

    public AIService(ILogger<AIService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        InitializeClients();
    }

    private void InitializeClients()
    {
        var openAIKey = _configuration["OpenAI:ApiKey"];
        if (!string.IsNullOrEmpty(openAIKey))
        {
            _openAIClient = new OpenAIClient(openAIKey);
        }

        var anthropicKey = _configuration["Anthropic:ApiKey"];
        if (!string.IsNullOrEmpty(anthropicKey))
        {
            _anthropicClient = new HttpClient();
            _anthropicClient.DefaultRequestHeaders.Add("x-api-key", anthropicKey);
            _anthropicClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        }

        var grokKey = _configuration["Grok:ApiKey"];
        if (!string.IsNullOrEmpty(grokKey))
        {
            _grokClient = new HttpClient();
            _grokClient.BaseAddress = new Uri("https://api.x.ai/v1/");
            _grokClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {grokKey}");
        }

        var geminiKey = _configuration["Gemini:ApiKey"];
        if (!string.IsNullOrEmpty(geminiKey))
        {
            _geminiClient = new HttpClient();
            _geminiClient.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
        }

        var copilotKey = _configuration["Copilot:ApiKey"];
        if (!string.IsNullOrEmpty(copilotKey))
        {
            _copilotClient = new HttpClient();
            _copilotClient.BaseAddress = new Uri("https://api.copilot.microsoft.com/v1/");
            _copilotClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {copilotKey}");
            _copilotClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _copilotClient.DefaultRequestHeaders.Add("User-Agent", "UseCaseGenerator");
        }
    }

    public async Task<GenerateUseCaseResponse> GenerateUseCaseAsync(GenerateUseCaseRequest request)
    {
        try
        {
            if (request.FormData.AiModel == AIModel.Demo)
            {
                return GenerateDemoContent(request.FormData);
            }

            var prompt = BuildPrompt(request.FormData, request.Rules);
            var content = await GenerateWithAI(prompt, request.FormData.AiModel);
            var cleanedContent = CleanAIResponse(content);

            // ✨ CRITICAL FIX: Build complete document with test cases BEFORE applying cleaning/styling
            var completeRawContent = content;
            
            if (request.FormData.GenerateTestCase && 
                (request.FormData.TestSteps?.Count > 0 || 
                 !string.IsNullOrEmpty(request.FormData.TestCaseObjective) || 
                 !string.IsNullOrEmpty(request.FormData.TestCasePreconditions)))
            {
                _logger.LogInformation("Adding test cases to generated document...");
                
                // Build test cases section HTML
                var testCaseSection = @"
          <h2 style=""color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 32px 0 12px 0; font-family: 'Segoe UI Semilight', sans-serif;"">CASOS DE PRUEBA</h2>
        ";

                if (!string.IsNullOrEmpty(request.FormData.TestCaseObjective))
                {
                    testCaseSection += $@"
            <h3 style=""color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;"">Objetivo:</h3>
            <p style=""margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;"">{request.FormData.TestCaseObjective}</p>
          ";
                }

                if (!string.IsNullOrEmpty(request.FormData.TestCasePreconditions))
                {
                    testCaseSection += $@"
            <h3 style=""color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;"">Precondiciones:</h3>
            <p style=""margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;"">{request.FormData.TestCasePreconditions}</p>
          ";
                }

                if (request.FormData.TestSteps?.Count > 0)
                {
                    testCaseSection += @"
            <h3 style=""color: rgb(0, 112, 192); font-size: 14px; font-weight: 600; margin: 20px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;"">Pasos de Prueba:</h3>
            <table style=""width: 100%; border-collapse: collapse; margin: 16px 0; font-family: 'Segoe UI Semilight', sans-serif;"">
              <thead>
                <tr style=""background-color: #f8f9fa;"">
                  <th style=""border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold; width: 50px;"">#</th>
                  <th style=""border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;"">Acción</th>
                  <th style=""border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;"">Datos de Entrada</th>
                  <th style=""border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;"">Resultado Esperado</th>
                  <th style=""border: 1px solid #666; padding: 8px; text-align: center; font-weight: bold;"">Observaciones</th>
                </tr>
              </thead>
              <tbody>
          ";

                    foreach (var step in request.FormData.TestSteps)
                    {
                        testCaseSection += $@"
              <tr>
                <td style=""border: 1px solid #666; padding: 8px; text-align: center;"">{step.Number}</td>
                <td style=""border: 1px solid #666; padding: 8px;"">{step.Action ?? ""}</td>
                <td style=""border: 1px solid #666; padding: 8px;"">{step.InputData ?? ""}</td>
                <td style=""border: 1px solid #666; padding: 8px;"">{step.ExpectedResult ?? ""}</td>
                <td style=""border: 1px solid #666; padding: 8px;"">{step.Observations ?? ""}</td>
              </tr>
            ";
                    }

                    testCaseSection += @"
              </tbody>
            </table>
          ";
                }

                // Combine BEFORE any cleaning/styling
                completeRawContent = content + testCaseSection;
                _logger.LogInformation("Test cases successfully added to raw content");
            }

            // ✨ NOW apply cleaning and styling to the UNIFIED document (including test cases)
            var finalContent = CleanAIResponse(completeRawContent);

            return new GenerateUseCaseResponse
            {
                Content = finalContent,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating use case with AI model {Model}", request.FormData.AiModel);
            return new GenerateUseCaseResponse
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<string> EditUseCaseAsync(string content, string instructions, AIModel aiModel)
    {
        if (aiModel == AIModel.Demo)
        {
            return content + $"\n\n<div style=\"background-color: #e6ffe6; padding: 10px; margin-top: 20px; border-left: 4px solid #28a745;\"><strong>Modo Demo:</strong> Se aplicarían los cambios: \"{instructions}\"</div>";
        }

        try
        {
            var prompt = $@"INSTRUCCIÓN CRÍTICA: Tu respuesta DEBE comenzar inmediatamente con una etiqueta HTML (<div>, <h1>, <table>, etc.) y terminar con su etiqueta de cierre correspondiente. NO escribas NADA antes del HTML. NO escribas NADA después del HTML.

Modifica el siguiente documento de caso de uso aplicando estos cambios: ""{instructions}""

Documento actual:
{content}

Devuelve el documento completo modificado manteniendo exactamente el formato HTML y el estilo Microsoft. NO agregues texto explicativo.";

            var modifiedContent = await GenerateWithAI(prompt, aiModel);
            return CleanAIResponse(modifiedContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing use case with AI model {Model}", aiModel);
            return content;
        }
    }

    public async Task<AIAssistResponse> ImproveFieldAsync(AIAssistRequest request)
    {
        try
        {
            if (request.AiModel == AIModel.Demo)
            {
                return new AIAssistResponse
                {
                    ImprovedValue = GetDemoFieldImprovement(request.FieldName, request.CurrentValue, "text"),
                    Success = true
                };
            }

            var rules = GetFieldRules(request.FieldName, "text", request.Context);
            var contextPrompt = BuildContextualPrompt(request.Context);
            var prompt = BuildProviderSpecificPrompt(request.AiModel, contextPrompt, request.FieldName, request.CurrentValue, rules);

            var improvedValue = await GenerateWithAI(prompt, request.AiModel);
            
            return new AIAssistResponse
            {
                ImprovedValue = improvedValue?.Trim() ?? request.CurrentValue,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error improving field {FieldName} with AI model {Model}", request.FieldName, request.AiModel);
            return new AIAssistResponse
            {
                ImprovedValue = request.CurrentValue,
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<string> ProcessFieldWithAIAsync(string systemPrompt, string fieldValue, AIModel aiModel)
    {
        if (aiModel == AIModel.Demo)
        {
            if (systemPrompt.Contains("minute-analysis") || systemPrompt.Contains("minuta"))
            {
                return JsonSerializer.Serialize(new
                {
                    clientName = "Banco Provincia",
                    projectName = "Sistema de Gestión Integral",
                    useCaseCode = "BP001",
                    useCaseName = "Gestionar información del cliente",
                    fileName = "BP001GestionarInformacionCliente",
                    description = "Permite gestionar la información completa de los clientes del banco incluyendo consulta, actualización y seguimiento de la relación comercial.",
                    searchFilters = new[] { "DNI/CUIT", "Apellido", "Email", "Número de Cliente" },
                    resultColumns = new[] { "ID Cliente", "Apellido y Nombres", "Documento", "Email", "Estado" },
                    entityFields = new[] 
                    {
                        new { name = "clienteId", type = "number", mandatory = true, length = 10 },
                        new { name = "tipoDocumento", type = "text", mandatory = true, length = 10 },
                        new { name = "numeroDocumento", type = "text", mandatory = true, length = 20 }
                    },
                    businessRules = new[] { "1. Solo usuarios autorizados pueden acceder", "2. Se debe validar formato de documentos" },
                    specialRequirements = new[] { "1. Integración con sistema legado", "2. Logging de operaciones críticas" },
                    isAIGenerated = true
                });
            }
            return $"Demo Analysis Result: Processed text with {fieldValue.Length} characters using system prompt.";
        }

        try
        {
            return await ProcessWithAI(systemPrompt, fieldValue, aiModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing field with AI model {Model}", aiModel);
            throw;
        }
    }

    private async Task<string> GenerateWithAI(string prompt, AIModel aiModel)
    {
        return aiModel switch
        {
            AIModel.OpenAI => await GenerateWithOpenAI(prompt),
            AIModel.Claude => await GenerateWithClaude(prompt),
            AIModel.Grok => await GenerateWithGrok(prompt),
            AIModel.Gemini => await GenerateWithGemini(prompt),
            AIModel.Copilot => await GenerateWithCopilot(prompt),
            _ => throw new ArgumentException($"Unsupported AI model: {aiModel}")
        };
    }

    private async Task<string> ProcessWithAI(string systemPrompt, string fieldValue, AIModel aiModel)
    {
        return aiModel switch
        {
            AIModel.OpenAI => await ProcessWithOpenAI(systemPrompt, fieldValue),
            AIModel.Claude => await ProcessWithClaude(systemPrompt, fieldValue),
            AIModel.Grok => await ProcessWithGrok(systemPrompt, fieldValue),
            AIModel.Gemini => await ProcessWithGemini(systemPrompt, fieldValue),
            AIModel.Copilot => await ProcessWithCopilot(systemPrompt, fieldValue),
            _ => throw new ArgumentException($"Unsupported AI model: {aiModel}")
        };
    }

    private async Task<string> GenerateWithOpenAI(string prompt)
    {
        if (_openAIClient == null)
            throw new InvalidOperationException("OpenAI client not configured");

        // TODO: Implement modern OpenAI API integration
        await Task.Delay(100); // Simulate API call
        return "OpenAI integration pending - use Demo mode for now";
    }

    private async Task<string> ProcessWithOpenAI(string systemPrompt, string fieldValue)
    {
        if (_openAIClient == null)
            throw new InvalidOperationException("OpenAI client not configured");

        // TODO: Implement modern OpenAI API integration
        await Task.Delay(100); // Simulate API call
        return fieldValue; // Return original value for now
    }

    private GenerateUseCaseResponse GenerateDemoContent(UseCaseFormData formData)
    {
        var content = BuildDemoHTML(formData);
        return new GenerateUseCaseResponse
        {
            Content = content,
            Success = true
        };
    }

    private string BuildDemoHTML(UseCaseFormData formData)
    {
        // This is a simplified version - in the full implementation, 
        // this would match the complex HTML generation from the original TypeScript
        return $@"
        <div style='font-family: ""Segoe UI Semilight"", ""Segoe UI"", sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;'>
            <h1 style='color: rgb(0, 112, 192); text-align: center; margin-bottom: 30px;'>{formData.UseCaseName}</h1>
            
            <h2 style='color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;'>Información General</h2>
            <p><strong>Cliente:</strong> {formData.ClientName}</p>
            <p><strong>Proyecto:</strong> {formData.ProjectName}</p>
            <p><strong>Código:</strong> {formData.UseCaseCode}</p>
            <p><strong>Descripción:</strong> {formData.Description}</p>
            
            <h2 style='color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;'>Reglas de Negocio</h2>
            <p>{formData.BusinessRules ?? "Los datos obligatorios deben ser validados antes de guardar."}</p>
            
            <h2 style='color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;'>Requerimientos Especiales</h2>
            <p>{formData.SpecialRequirements ?? "El sistema debe responder en menos de 3 segundos."}</p>
        </div>";
    }

    private string CleanAIResponse(string content)
    {
        // Remove explanatory text and clean the response
        var patterns = new[]
        {
            @"^[^<]*(<.*>.*<\/[^>]+>)[^>]*$",
            @"```html\s*(.*?)\s*```",
            @"```\s*(.*?)\s*```"
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(content, pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (match.Success)
            {
                content = match.Groups[1].Value;
                break;
            }
        }

        // Remove common AI explanatory phrases
        var cleaningPatterns = new[]
        {
            @"^(Claro,|Por supuesto,|Aquí tienes|He aquí|A continuación|Seguidamente).*?:",
            @"^.*?(Se han incorporado|actualizado|estructurado|mejorado).*?\n",
            @"^.*?HTML.*?:\s*"
        };

        foreach (var pattern in cleaningPatterns)
        {
            content = Regex.Replace(content, pattern, "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        }

        return content.Trim();
    }

    // Additional methods for Claude, Grok, Gemini would be implemented here...
    // For brevity, I'm including just the structure

    private async Task<string> GenerateWithClaude(string prompt)
    {
        // Implementation for Claude API
        throw new NotImplementedException("Claude integration pending");
    }

    private async Task<string> GenerateWithGrok(string prompt)
    {
        // Implementation for Grok API
        throw new NotImplementedException("Grok integration pending");
    }

    private async Task<string> GenerateWithGemini(string prompt)
    {
        // Implementation for Gemini API
        throw new NotImplementedException("Gemini integration pending");
    }

    private async Task<string> GenerateWithCopilot(string prompt)
    {
        if (_copilotClient == null)
        {
            throw new InvalidOperationException("Microsoft Copilot API key not configured");
        }

        try
        {
            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "system", content = "Eres un experto en análisis de negocio que genera casos de uso siguiendo los estándares corporativos de ING." },
                    new { role = "user", content = prompt }
                },
                model = "gpt-4", // Copilot uses GPT models
                max_tokens = 4000,
                temperature = 0.3
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var response = await _copilotClient.PostAsync("chat/completions", httpContent);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Copilot API error: {response.StatusCode}");
                return GenerateDemoContent(new UseCaseFormData()).Content;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            return responseObj.GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Microsoft Copilot API");
            return GenerateDemoContent(new UseCaseFormData()).Content;
        }
    }

    private async Task<string> ProcessWithClaude(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Claude integration pending");
    }

    private async Task<string> ProcessWithGrok(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Grok integration pending");
    }

    private async Task<string> ProcessWithGemini(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Gemini integration pending");
    }

    private async Task<string> ProcessWithCopilot(string systemPrompt, string fieldValue)
    {
        if (_copilotClient == null)
        {
            throw new InvalidOperationException("Microsoft Copilot API key not configured");
        }

        try
        {
            var prompt = $"{systemPrompt}\n\nCampo actual: {fieldValue}\n\nMejora el campo siguiendo las mejores prácticas.";
            
            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Mejora este campo: {fieldValue}" }
                },
                model = "gpt-4",
                max_tokens = 500,
                temperature = 0.2
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var httpContent = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var response = await _copilotClient.PostAsync("chat/completions", httpContent);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Copilot API error: {response.StatusCode}");
                return fieldValue; // Return original if API fails
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            return responseObj.GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? fieldValue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Microsoft Copilot API for field processing");
            return fieldValue; // Return original if error
        }
    }

    private string BuildPrompt(UseCaseFormData formData, string rules)
    {
        // Build the comprehensive prompt for use case generation
        return $@"
REGLAS CRÍTICAS:
{rules}

DATOS DEL CASO DE USO:
- Cliente: {formData.ClientName}
- Proyecto: {formData.ProjectName}
- Código: {formData.UseCaseCode}
- Nombre: {formData.UseCaseName}
- Tipo: {formData.UseCaseType}
- Descripción: {formData.Description}

INSTRUCCIONES:
Genera un documento de caso de uso completo en formato HTML siguiendo las reglas ING especificadas.
Responde ÚNICAMENTE con HTML limpio, sin explicaciones adicionales.
";
    }

    private string GetDemoFieldImprovement(string fieldName, string fieldValue, string fieldType)
    {
        // Demo improvements based on field type
        if (string.IsNullOrWhiteSpace(fieldValue))
            return fieldValue;

        return fieldType switch
        {
            "clientName" => "Banco Provincia",
            "projectName" => "Sistema de Gestión Integral",
            "description" => "Permite gestionar la información completa de los clientes del banco incluyendo consulta, actualización y seguimiento de la relación comercial.",
            _ => fieldValue
        };
    }

    private string GetFieldRules(string fieldName, string fieldType, object? context)
    {
        // Return specific validation rules for each field type
        return $"Reglas para el campo {fieldName}: Debe ser profesional y seguir estándares ING.";
    }

    private string BuildContextualPrompt(object? context)
    {
        return "Contexto: Sistema bancario ING con estándares corporativos.";
    }

    private string BuildProviderSpecificPrompt(AIModel aiModel, string contextPrompt, string fieldName, string fieldValue, string rules)
    {
        var baseTask = $@"TAREA: Mejora el siguiente campo según las reglas especificadas.

CAMPO: {fieldName}
VALOR ACTUAL: ""{fieldValue}""
REGLAS: {rules}";

        return aiModel switch
        {
            AIModel.OpenAI => $"{contextPrompt}\n\n{baseTask}\n\nINSTRUCCIONES PASO A PASO:\n1. Analiza el valor actual\n2. Aplica las reglas ING\n3. Responde ÚNICAMENTE con el contenido mejorado\n\nRESPUESTA:",
            AIModel.Claude => $"{contextPrompt}\n\n{baseTask}\n\nCONTEXTO: Estás mejorando documentación técnica bancaria.\nFORMATO: Proporciona únicamente el contenido mejorado.\n\nCONTENIDO MEJORADO:",
            AIModel.Grok => $"{contextPrompt}\n\n{baseTask}\n\nINSTRUCCIONES:\n- Mejora siguiendo reglas ING\n- Solo contenido mejorado\n\nRESULTADO:",
            AIModel.Gemini => $"{contextPrompt}\n\n{baseTask}\n\nINSTRUCCIONES JSON:\n{{\n  \"accion\": \"mejorar_campo\",\n  \"formato\": \"solo_contenido\"\n}}\n\nCONTENIDO:",
            _ => $"{contextPrompt}\n\n{baseTask}\n\nMejora el contenido siguiendo las reglas. Responde solo con el contenido mejorado."
        };
    }
}