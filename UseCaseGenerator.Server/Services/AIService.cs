using OpenAI;
using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace UseCaseGenerator.Server.Services;

public class AIService : IAIService, IDisposable
{
    private readonly ILogger<AIService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private OpenAIClient? _openAIClient;
    private bool _disposed;

    public AIService(ILogger<AIService> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        InitializeOpenAIClient();
    }

    private void InitializeOpenAIClient()
    {
        var openAIKey = _configuration["OpenAI:ApiKey"];
        if (!string.IsNullOrEmpty(openAIKey))
        {
            _openAIClient = new OpenAIClient(openAIKey);
        }
    }
    
    private HttpClient GetHttpClient(string clientName)
    {
        var client = _httpClientFactory.CreateClient(clientName);
        
        // Add API keys based on client type
        switch (clientName)
        {
            case "Anthropic":
                var anthropicKey = _configuration["Anthropic:ApiKey"];
                if (!string.IsNullOrEmpty(anthropicKey))
                {
                    client.DefaultRequestHeaders.Add("x-api-key", anthropicKey);
                }
                break;
                
            case "Grok":
                var grokKey = _configuration["Grok:ApiKey"];
                if (!string.IsNullOrEmpty(grokKey))
                {
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {grokKey}");
                }
                break;
                
            case "Gemini":
                // Gemini key is usually passed in URL params
                break;
                
            case "Copilot":
                var copilotKey = _configuration["Copilot:ApiKey"];
                if (!string.IsNullOrEmpty(copilotKey))
                {
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {copilotKey}");
                }
                break;
        }
        
        return client;
    }

    public async Task<GenerateUseCaseResponse> GenerateUseCaseAsync(GenerateUseCaseRequest request)
    {
        try
        {
            if (request.FormData.AiModel == AIModel.Demo)
            {
                throw new InvalidOperationException("El modo demo no está disponible. Por favor, configure una clave API válida para usar el generador.");
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
            throw new InvalidOperationException("El modo demo no está disponible. Por favor, configure una clave API válida para editar casos de uso.");
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
                throw new InvalidOperationException("El modo demo no está disponible. Por favor, configure una clave API válida para mejorar campos.");
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
        // Define fallback order - try other models if the primary fails
        var aiModels = new[] { AIModel.Copilot, AIModel.Gemini, AIModel.OpenAI, AIModel.Claude, AIModel.Grok };
        
        // Start with the requested model
        var modelOrder = new List<AIModel> { aiModel };
        modelOrder.AddRange(aiModels.Where(m => m != aiModel && m != AIModel.Demo));
        
        var errors = new List<(AIModel model, string error)>();
        
        foreach (var model in modelOrder)
        {
            try
            {
                _logger.LogInformation("Attempting to process with AI model: {Model}", model);
                var result = await ProcessWithAI(systemPrompt, fieldValue, model);
                _logger.LogInformation("Successfully processed with {Model}", model);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process with {Model}", model);
                errors.Add((model, ex.Message));
                // Continue to next model
            }
        }
        
        // All models failed
        var errorDetails = string.Join("\n", errors.Select(e => $"{e.model}: {e.error}"));
        throw new InvalidOperationException($"No se pudo procesar con ningún modelo de IA disponible. Errores:\n{errorDetails}");
    }

    private async Task<string> GenerateWithAI(string prompt, AIModel aiModel)
    {
        // Define fallback order - try other models if the primary fails
        var aiModels = new[] { AIModel.Copilot, AIModel.Gemini, AIModel.OpenAI, AIModel.Claude, AIModel.Grok };
        
        // Start with the requested model
        var modelOrder = new List<AIModel> { aiModel };
        modelOrder.AddRange(aiModels.Where(m => m != aiModel && m != AIModel.Demo));
        
        var errors = new List<(AIModel model, string error)>();
        
        foreach (var model in modelOrder)
        {
            try
            {
                _logger.LogInformation("Attempting to generate content with AI model: {Model}", model);
                var result = model switch
                {
                    AIModel.OpenAI => await GenerateWithOpenAI(prompt),
                    AIModel.Claude => await GenerateWithClaude(prompt),
                    AIModel.Grok => await GenerateWithGrok(prompt),
                    AIModel.Gemini => await GenerateWithGemini(prompt),
                    AIModel.Copilot => await GenerateWithCopilot(prompt),
                    _ => throw new ArgumentException($"Unsupported AI model: {model}")
                };
                
                _logger.LogInformation("Successfully generated content with {Model}", model);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate with {Model}", model);
                errors.Add((model, ex.Message));
                // Continue to next model
            }
        }
        
        // All models failed
        var errorDetails = string.Join("\n", errors.Select(e => $"{e.model}: {e.error}"));
        throw new InvalidOperationException($"No se pudo generar contenido con ningún modelo de IA disponible. Errores:\n{errorDetails}");
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
        var client = GetHttpClient("Anthropic");
        
        var requestBody = new
        {
            model = "claude-3-sonnet-20240229",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 4000
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("v1/messages", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }

    private async Task<string> GenerateWithGrok(string prompt)
    {
        var client = GetHttpClient("Grok");
        
        var requestBody = new
        {
            model = "grok-beta",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 4000
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private Task<string> GenerateWithGemini(string prompt)
    {
        // Implementation for Gemini API
        throw new NotImplementedException("Gemini integration pending");
    }

    private async Task<string> GenerateWithCopilot(string prompt)
    {
        var client = GetHttpClient("Copilot");
        
        var requestBody = new
        {
            model = "copilot-latest",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 4000
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private Task<string> ProcessWithClaude(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Claude integration pending");
    }

    private Task<string> ProcessWithGrok(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Grok integration pending");
    }

    private Task<string> ProcessWithGemini(string systemPrompt, string fieldValue)
    {
        throw new NotImplementedException("Gemini integration pending");
    }

    private async Task<string> ProcessWithCopilot(string systemPrompt, string fieldValue)
    {
        var client = GetHttpClient("Copilot");
        
        try
        {
            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Mejora este campo: {fieldValue}" }
                },
                model = "copilot-latest",
                max_tokens = 500,
                temperature = 0.2
            };

            using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
            var response = await client.PostAsync("chat/completions", httpContent);
            
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
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // OpenAIClient doesn't implement IDisposable, so nothing to dispose
                // HttpClient instances are managed by IHttpClientFactory
            }
            _disposed = true;
        }
    }
}