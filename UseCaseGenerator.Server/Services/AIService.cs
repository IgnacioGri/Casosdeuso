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
    private readonly string? _geminiApiKey;
    private readonly string? _claudeApiKey;
    private readonly string? _grokApiKey;
    private bool _disposed;

    public AIService(ILogger<AIService> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _geminiApiKey = _configuration["Gemini:ApiKey"];
        _claudeApiKey = _configuration["Anthropic:ApiKey"];
        _grokApiKey = _configuration["Grok:ApiKey"];
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

            // Check if description needs expansion (less than 50 words)
            var wordCount = request.FormData.Description?.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length ?? 0;
            string? expandedDescription = null;
            
            if (wordCount < 50)
            {
                _logger.LogInformation($"Description is short ({wordCount} words), expanding it first...");
                _logger.LogInformation($"Original description: \"{request.FormData.Description}\"");
                expandedDescription = await ExpandDescriptionAsync(request.FormData, request.FormData.AiModel);
                if (!string.IsNullOrEmpty(expandedDescription))
                {
                    request.FormData.Description = expandedDescription;
                    _logger.LogInformation("Description expanded successfully");
                    _logger.LogInformation($"Expanded description (first 200 chars): \"{request.FormData.Description.Substring(0, Math.Min(200, request.FormData.Description.Length))}...\"");
                }
                else
                {
                    _logger.LogInformation("Failed to expand description, keeping original");
                }
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
          ";
                    
                    // Parse structured preconditions
                    var preconditionsText = request.FormData.TestCasePreconditions.ToString();
                    var lines = preconditionsText.Split('\n').Where(line => !string.IsNullOrWhiteSpace(line)).ToArray();
                    
                    if (lines.Length > 0)
                    {
                        string currentCategory = "";
                        
                        foreach (var line in lines)
                        {
                            var trimmedLine = line.Trim();
                            
                            // Check if it's a category header (ends with ':')
                            if (trimmedLine.EndsWith(":") && !trimmedLine.StartsWith("•") && !trimmedLine.StartsWith("-"))
                            {
                                currentCategory = trimmedLine;
                                testCaseSection += $@"
                <h4 style=""color: rgb(0, 112, 192); font-size: 13px; font-weight: 600; margin: 15px 0 8px 0; font-family: 'Segoe UI Semilight', sans-serif;"">{currentCategory}</h4>
              ";
                            }
                            else if (trimmedLine.StartsWith("•") || trimmedLine.StartsWith("-"))
                            {
                                // It's a bullet point
                                var bulletContent = Regex.Replace(trimmedLine, @"^[•\-]\s*", "").Trim();
                                if (!string.IsNullOrEmpty(bulletContent))
                                {
                                    testCaseSection += $@"
                  <p style=""margin: 4px 0 4px 20px; font-family: 'Segoe UI Semilight', sans-serif;"">• {bulletContent}</p>
                ";
                                }
                            }
                            else if (!string.IsNullOrEmpty(trimmedLine))
                            {
                                // Regular line without bullet - add as a bullet point
                                var marginLeft = !string.IsNullOrEmpty(currentCategory) ? "20px" : "0";
                                var bullet = !string.IsNullOrEmpty(currentCategory) ? "• " : "";
                                testCaseSection += $@"
                  <p style=""margin: 4px 0 4px {marginLeft}; font-family: 'Segoe UI Semilight', sans-serif;"">{bullet}{trimmedLine}</p>
                ";
                            }
                        }
                    }
                    else
                    {
                        // Fallback for single line preconditions
                        testCaseSection += $@"
            <p style=""margin-bottom: 16px; font-family: 'Segoe UI Semilight', sans-serif;"">{preconditionsText}</p>
          ";
                    }
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
                Success = true,
                GeneratedWireframes = request.FormData.GenerateWireframes && request.FormData.AiModel == AIModel.Demo
                    ? new GeneratedWireframes
                    {
                        SearchWireframe = "/attached_assets/generated_images/Search_interface_wireframe_59d3b735.png",
                        FormWireframe = "/attached_assets/generated_images/Form_interface_wireframe_bf6aaf30.png"
                    }
                    : null,
                ExpandedDescription = expandedDescription ?? request.FormData.Description
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
            var prompt = $@"Eres un experto en documentación de casos de uso. Tu tarea es modificar el documento existente aplicando los cambios solicitados mientras mantienes la estructura y formato profesional.

Modifica el siguiente documento de caso de uso aplicando estos cambios: ""{instructions}""

Documento actual:
{content}

INSTRUCCIONES:
- Mantén la estructura y formato existente del documento
- Aplica SOLO los cambios solicitados
- Preserva toda la información no afectada por los cambios
- Asegúrate de que el documento siga siendo coherente y profesional
- Asegura indentación 0.2 en listas editadas si se modifican flujos
- Mantén el estilo y formato corporativo ING";

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
            // Handle specialized field types FIRST (works for both AI and demo modes)
            if (request.FieldName?.ToLowerInvariant().Contains("wireframe") == true || 
                request.Context?.ToString()?.Contains("wireframeDescription") == true)
            {
                return new AIAssistResponse
                {
                    ImprovedValue = GenerateIntelligentWireframeDescription(request.CurrentValue, request.Context),
                    Success = true
                };
            }
            
            if (request.FieldName?.ToLowerInvariant().Contains("wireframes") == true || 
                request.Context?.ToString()?.Contains("wireframesDescription") == true)
            {
                return new AIAssistResponse
                {
                    ImprovedValue = GenerateIntelligentWireframesDescription(request.CurrentValue, request.Context),
                    Success = true
                };
            }

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

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_configuration["OpenAI:ApiKey"]}");

        var requestBody = new
        {
            model = "gpt-4o",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            temperature = 0.3,
            max_tokens = 16000,
            top_p = 0.95
        };

        var response = await httpClient.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", requestBody);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI API error: {responseContent}");
        }

        var jsonDoc = JsonDocument.Parse(responseContent);
        var content = jsonDoc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        return content ?? "";
    }

    private async Task<string> ProcessWithOpenAI(string systemPrompt, string fieldValue)
    {
        if (_openAIClient == null)
            throw new InvalidOperationException("OpenAI client not configured");

        // Determine token limit based on context
        bool isTestCaseGeneration = systemPrompt.Contains("casos de prueba") || systemPrompt.Contains("test cases");
        bool isMinuteAnalysis = systemPrompt.Contains("minuta") || systemPrompt.Contains("análisis de documento");
        int maxTokens = isTestCaseGeneration ? 12000 : (isMinuteAnalysis ? 10000 : 4000);

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_configuration["OpenAI:ApiKey"]}");

        var requestBody = new
        {
            model = "gpt-4o",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = fieldValue }
            },
            temperature = 0.3,
            max_tokens = maxTokens,
            top_p = 0.95
        };

        var response = await httpClient.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", requestBody);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI API error: {responseContent}");
        }

        var jsonDoc = JsonDocument.Parse(responseContent);
        var content = jsonDoc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        return content ?? "";
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
            <p>{formData.BusinessRules ?? "• Los datos obligatorios deben ser validados antes de guardar<br>• El DNI debe ser único en el sistema<br>• Registro automático en bitácora de operaciones"}</p>
            
            <h2 style='color: rgb(0, 112, 192); font-size: 16px; font-weight: 600; margin: 20px 0 12px 0;'>Requerimientos Especiales</h2>
            <p>{formData.SpecialRequirements ?? "• El sistema debe responder en menos de 3 segundos<br>• Validación HTTPS obligatoria<br>• Auditoria completa de operaciones"}</p>
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
            model = "claude-sonnet-4-20250514",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 16000
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
            model = "grok-2-1212",
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = 16000
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private async Task<string> GenerateWithGemini(string prompt)
    {
        if (string.IsNullOrEmpty(_geminiApiKey))
        {
            throw new InvalidOperationException("Gemini API key no está configurada");
        }

        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-goog-api-key", _geminiApiKey);
        
        // For document generation, always use 16000 tokens
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.3,
                maxOutputTokens = 16000, // For document generation
                topP = 0.95,
                topK = 40
            }
        };

        var response = await client.PostAsJsonAsync(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash:generateContent",
            requestBody
        );

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Gemini API error: {error}");
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var content = result.GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return content ?? string.Empty;
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
            max_tokens = 16000
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private async Task<string> ProcessWithClaude(string systemPrompt, string fieldValue)
    {
        if (string.IsNullOrEmpty(_claudeApiKey))
        {
            throw new InvalidOperationException("Claude API key no está configurada");
        }

        // Determine token limit based on context
        bool isTestCaseGeneration = systemPrompt.Contains("casos de prueba") || systemPrompt.Contains("test cases");
        bool isMinuteAnalysis = systemPrompt.Contains("minuta") || systemPrompt.Contains("análisis de documento");
        int maxTokens = isTestCaseGeneration ? 12000 : (isMinuteAnalysis ? 10000 : 4000);

        var client = GetHttpClient("Anthropic");
        
        var requestBody = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = maxTokens,
            temperature = 0.3,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = fieldValue }
            }
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("v1/messages", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }

    private async Task<string> ProcessWithGrok(string systemPrompt, string fieldValue)
    {
        if (string.IsNullOrEmpty(_grokApiKey))
        {
            throw new InvalidOperationException("Grok API key no está configurada");
        }

        // Token limit for Grok (doesn't support as high as others)
        int maxTokens = 4000;

        var client = GetHttpClient("Grok");
        
        var requestBody = new
        {
            model = "grok-2-1212",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = fieldValue }
            },
            temperature = 0.3,
            max_tokens = maxTokens
        };
        
        using var httpContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", httpContent);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private async Task<string> ProcessWithGemini(string systemPrompt, string fieldValue)
    {
        if (string.IsNullOrEmpty(_geminiApiKey))
        {
            throw new InvalidOperationException("Gemini API key no está configurada");
        }

        // Determine token limit based on context
        bool isTestCaseGeneration = systemPrompt.Contains("casos de prueba") || systemPrompt.Contains("test cases");
        bool isMinuteAnalysis = systemPrompt.Contains("minuta") || systemPrompt.Contains("análisis de documento");
        int maxTokens = isTestCaseGeneration ? 12000 : (isMinuteAnalysis ? 10000 : 4000);

        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-goog-api-key", _geminiApiKey);
        
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = $"{systemPrompt}\n\n{fieldValue}" }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.3,
                maxOutputTokens = maxTokens,
                topP = 0.95,
                topK = 40
            }
        };

        var response = await client.PostAsJsonAsync(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash:generateContent",
            requestBody
        );

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Gemini API error: {error}");
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var content = result.GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return content ?? string.Empty;
    }

    private async Task<string> ProcessWithCopilot(string systemPrompt, string fieldValue)
    {
        var client = GetHttpClient("Copilot");
        
        try
        {
            // Determine token limit based on context
            bool isTestCaseGeneration = systemPrompt.Contains("casos de prueba") || systemPrompt.Contains("test cases");
            bool isMinuteAnalysis = systemPrompt.Contains("minuta") || systemPrompt.Contains("análisis de documento");
            int maxTokens = isTestCaseGeneration ? 12000 : (isMinuteAnalysis ? 10000 : 4000);

            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = $"Mejora este campo: {fieldValue}" }
                },
                model = "copilot-latest",
                max_tokens = maxTokens,
                temperature = 0.3
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

    private async Task<string> ExpandDescriptionAsync(UseCaseFormData formData, AIModel aiModel)
    {
        var expandPrompt = $@"Como experto en documentación bancaria/empresarial, expande la siguiente descripción de caso de uso a exactamente 2 párrafos profesionales:

Descripción original: ""{formData.Description}""
Caso de uso: {formData.UseCaseName}
Cliente: {formData.ClientName}
Proyecto: {formData.ProjectName}

INSTRUCCIONES OBLIGATORIAS:
1. Primer párrafo (75+ palabras): Explicar QUÉ hace el caso de uso, su propósito principal, qué procesos abarca, qué área del negocio atiende, cómo se integra en el sistema.
2. Segundo párrafo (75+ palabras): Detallar los BENEFICIOS clave para el negocio, valor agregado, mejoras operativas, problemas que resuelve, impacto en eficiencia.

IMPORTANTE: Genera SOLO los 2 párrafos de texto sin títulos, HTML o formato adicional. Usa contexto profesional relevante del sector {(formData.ClientName?.Contains("Banco") == true ? "bancario" : "empresarial")}.";

        try
        {
            var expandedText = await GenerateWithAI(expandPrompt, aiModel);
            if (!string.IsNullOrEmpty(expandedText))
            {
                // Clean any HTML or formatting
                return Regex.Replace(expandedText, @"<[^>]*>", "").Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error expanding description");
        }
        
        return null;
    }

    private string BuildPrompt(UseCaseFormData formData, string rules)
    {
        _logger.LogInformation($"Building prompt with description: \"{formData.Description?.Substring(0, Math.Min(100, formData.Description?.Length ?? 0))}...\"");
        _logger.LogInformation($"Description length: {formData.Description?.Length ?? 0} characters");
        
        // Build the comprehensive prompt for use case generation - synchronized with TypeScript version
        var entityFieldsDescription = formData.EntityFields?.Any() == true
            ? string.Join("; ", formData.EntityFields.Select(f => 
                $"{f.Name} ({f.Type}{(f.Mandatory ? ", obligatorio" : "")}, largo: {f.Length ?? 0}, {f.Description ?? "sin descripción"}, validaciones: {f.ValidationRules ?? "ninguna"})"))
            : "Ninguno";

        return $@"
Eres un experto en documentación de casos de uso bancarios/empresariales. Tu tarea es generar un documento profesional estructurado que será convertido a DOCX.

IMPORTANTE: Este es un DOCUMENTO FORMAL DE CASO DE USO con secciones profesionales como: Metadatos, Descripción, Actores, Precondiciones, Flujo Básico, Flujos Alternativos, Postcondiciones, etc.

INSTRUCCIONES CRÍTICAS SOBRE EL USO DE EJEMPLOS Y DATOS:
1. NUNCA uses valores por defecto o genéricos como ""Apellido"", ""DNI"", ""Segmento"" salvo que sean EXACTAMENTE los especificados en los datos del formulario.
2. Cualquier ejemplo en este prompt está marcado como: ""Ejemplo ilustrativo, no debe reproducirse salvo que aplique al caso específico"".
3. SIEMPRE usa los valores EXACTOS proporcionados en formData (filtros, columnas, campos).
4. Si formData no especifica un valor, NO lo inventes. Indica ""no especificado por el usuario"".

⚠️ INSTRUCCIÓN CRÍTICA Y OBLIGATORIA PARA DESCRIPCIÓN ⚠️
La sección de DESCRIPCIÓN debe contener EXACTAMENTE el texto proporcionado en formData.Description.
NO modifiques, resumas o cambies la descripción proporcionada.
USA LITERALMENTE el contenido de formData.Description tal como viene.

IMPORTANTE: La descripción ya viene procesada y expandida cuando es necesario.
- Si es larga (2 párrafos), úsala completa tal cual
- Si es corta, úsala tal cual (el sistema ya la procesó)
- NUNCA la modifiques o reescribas

FORMATO ESTRUCTURADO REQUERIDO:
1. Organiza la información en secciones claras con títulos y subtítulos
2. Para flujos, usa numeración jerárquica profesional con indentación:
   1. Flujo Básico
     a. Menú principal
       i. Ingreso de filtros
       ii. Ejecución de búsqueda
     b. Subflujo: Alta
       i. Validación de datos
       ii. Confirmación
   Indenta 0.2 pulgadas por nivel a la derecha.

3. Incluye una historia de revisiones con: Versión (1.0), Fecha actual, Autor (Sistema), Descripción (Creación inicial del documento)

INSTRUCCIONES PARA ACTORES:
- Si no hay actor explícito en los datos, usar: ""Actor no identificado""
- NUNCA inventes actores como ""Empleado Bancario"" si no están especificados

{rules}

DATOS DEL FORMULARIO COMPLETOS (usar EXACTAMENTE estos valores):
- Tipo de caso de uso: {formData.UseCaseType}
- Cliente: {formData.ClientName}
- Proyecto: {formData.ProjectName}
- Código: {formData.UseCaseCode}
- Nombre: {formData.UseCaseName}
- Archivo: {formData.FileName}
- Descripción: {formData.Description}
- Filtros de búsqueda: {(formData.SearchFilters?.Any() == true ? string.Join(", ", formData.SearchFilters) : "Ninguno especificado")}
- Columnas de resultado: {(formData.ResultColumns?.Any() == true ? string.Join(", ", formData.ResultColumns) : "Ninguna especificada")}
- Campos de entidad: {entityFieldsDescription}
- Reglas de negocio: {formData.BusinessRules ?? "Ninguna específica"}
- Requerimientos especiales: {formData.SpecialRequirements ?? "Ninguno"}
- Generar wireframes: {(formData.GenerateWireframes ? "Sí" : "No")}
{(formData.WireframeDescriptions?.Any(w => !string.IsNullOrWhiteSpace(w)) == true ? $"- Descripciones de wireframes: {string.Join("; ", formData.WireframeDescriptions.Where(w => !string.IsNullOrWhiteSpace(w)))}" : "")}

INSTRUCCIONES FINALES:
- Genera un documento completo y profesional
- Mantén consistencia en la numeración y formato
- Incluye TODAS las secciones requeridas
- Asegúrate de que la descripción sea detallada y profesional
- Incluye título en MAYÚSCULAS con color azul RGB(0,112,192) en la sección inicial
- El documento debe estar listo para convertirse a DOCX con formato corporativo ING
- CRÍTICO: Usa SOLO los datos exactos proporcionados en formData
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
        var fieldNameLower = fieldName.ToLower();
        var useCaseType = (context as dynamic)?.fullFormData?.useCaseType ?? "entidad";
        
        // Base ING compliance rules
        var ingCompliance = GetINGComplianceRules(useCaseType);
        
        if (fieldNameLower.Contains("nombre") && fieldNameLower.Contains("cliente"))
        {
            return $"{ingCompliance}\n- Debe ser un nombre de empresa real o banco\n- Primera letra mayúscula\n- Sin abreviaciones innecesarias";
        }
        
        if (fieldNameLower.Contains("proyecto"))
        {
            return $"{ingCompliance}\n- Debe describir un sistema o proyecto tecnológico\n- Formato profesional\n- Relacionado con el cliente";
        }
        
        if (fieldNameLower.Contains("codigo"))
        {
            return $"{ingCompliance}\n- Formato: 2 letras mayúsculas + 3 números (ej: CL005, AB123)\n- Las letras deben relacionarse con el módulo o área";
        }
        
        if (fieldNameLower.Contains("nombre") && fieldNameLower.Contains("caso"))
        {
            return $"{ingCompliance}\n- OBLIGATORIO: Debe comenzar con verbo en infinitivo (Gestionar, Crear, Consultar, etc.)\n- Prepara para título en mayúsculas RGB(0,112,192)\n- Describe claramente la funcionalidad\n- Sin artículos innecesarios\n{GetUseCaseTypeSpecificRules(useCaseType)}";
        }
        
        if (fieldNameLower.Contains("archivo"))
        {
            return $"{ingCompliance}\n- Formato exacto: 2 letras + 3 números + nombre descriptivo sin espacios\n- Ejemplo: BP005GestionarClientesPremium\n- Sin caracteres especiales";
        }
        
        if (fieldNameLower.Contains("descripcion"))
        {
            return $"{ingCompliance}\n⚠️ EXPANSIÓN OBLIGATORIA ⚠️\n- SIEMPRE expandir a 2 párrafos completos (MÍNIMO 150 palabras total)\n- Primer párrafo (75+ palabras): QUÉ hace el caso de uso, propósito principal, procesos que abarca, área de negocio que atiende\n- Segundo párrafo (75+ palabras): BENEFICIOS clave, valor agregado, mejoras operativas, problemas que resuelve\n- Si la descripción es corta (ej: \"Mostrar proveedores\"), EXPANDIRLA COMPLETAMENTE con contexto profesional\n- Incluir alcance/objetivo como en minuta ING\n- Si aplica, menciona flujos principales con lista indentada (1-a-i):\n  1. Flujo principal (ej. Buscar [entidad])\n    a. Detallar filtros y columnas\n    i. Criterios de búsqueda\n- Tono profesional y claro\n- Contexto relevante del negocio bancario/empresarial\n{GetUseCaseTypeSpecificRules(useCaseType)}";
        }
        
        if (fieldNameLower.Contains("reglas") && fieldNameLower.Contains("negocio"))
        {
            return $"{ingCompliance}\n⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas\n- Cada regla como bullet point separado: • Texto de la regla\n- Cada regla debe ser clara, específica y verificable\n- Incluye validaciones, restricciones y políticas\n- Considera aspectos regulatorios si aplica\n- Para modificar/eliminar: incluir verificaciones\nEjemplo correcto:\n• El DNI debe ser único en el sistema y validar formato correcto\n• No se puede eliminar un cliente con productos activos\n• Solo usuarios con rol Supervisor pueden eliminar clientes\n• Registro automático en bitácora de todas las operaciones";
        }
        
        if (fieldNameLower.Contains("requerimientos"))
        {
            return $"{ingCompliance}\n⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas\n- Requerimientos no funcionales (rendimiento, seguridad, usabilidad)\n- Especifica métricas cuando sea posible\n- Cada requerimiento como bullet point separado: • Texto del requerimiento\n- Considera integraciones con otros sistemas\nEjemplo correcto:\n• El sistema debe procesar 1000 transacciones por minuto\n• Tiempo de respuesta máximo de 3 segundos para búsquedas\n• Validación HTTPS obligatoria para todas las transacciones\n• Auditoria completa de cambios con timestamp y usuario";
        }

        if (fieldNameLower.Contains("objetivo") && fieldNameLower.Contains("caso"))
        {
            return $"{ingCompliance}\n⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas\n- Define claramente qué se va a probar en el caso de uso\n- Especifica los objetivos de las pruebas de forma concisa\n- Cada objetivo como bullet point separado: • Texto del objetivo\nEjemplo correcto:\n• Verificar que el sistema permita buscar clientes por DNI\n• Validar que se muestren los resultados correctos en la grilla\n• Comprobar que los botones de edición y eliminación funcionen correctamente\n• Asegurar que las validaciones se ejecuten según las reglas de negocio";
        }

        if (fieldNameLower.Contains("precondiciones") || (fieldNameLower.Contains("precondicion") && fieldNameLower.Contains("caso")))
        {
            return $"{ingCompliance}\n⚠️ FORMATO OBLIGATORIO: Usar BULLETS (•) exclusivamente, NO listas numeradas\n- Define el estado necesario del sistema antes de ejecutar las pruebas\n- Especifica datos, permisos y configuraciones necesarias\n- Cada precondición como bullet point separado: • Texto de la precondición\nEjemplo correcto:\n• Usuario con permisos de consulta debe estar logueado en el sistema\n• Base de datos debe contener al menos 10 registros de prueba\n• Sistema debe estar conectado a los servicios externos\n• Cache del sistema debe estar limpio para evitar resultados previos";
        }
        
        if (fieldType == "searchFilter")
        {
            return $"{ingCompliance}\n- Nombre del campo de búsqueda\n- Debe ser un campo lógico de la entidad\n- Formato lista multi-nivel: 1. Filtro por [campo], a. Lógica [igual/mayor]";
        }
        
        if (fieldType == "resultColumn")
        {
            return $"{ingCompliance}\n- Columnas para tabla de resultados\n- Información relevante para identificar registros\n- Formato multi-nivel con indent 0.2";
        }
        
        if (fieldType == "entityField")
        {
            return $"{ingCompliance}\n- Campo de entidad con tipo/longitud/obligatorio\n- Auto-incluir campos de auditoría:\n  • fechaAlta (date, mandatory)\n  • usuarioAlta (text, mandatory)\n  • fechaModificacion (date, optional)\n  • usuarioModificacion (text, optional)\n- Tipos válidos: text/email/number/date/boolean/decimal\n- Para montos usar tipo \"decimal\"\n- Para IDs usar tipo \"number\"\n- Incluir SIEMPRE description y validationRules";
        }
        
        return $"{ingCompliance}\n- Seguir buenas prácticas de documentación técnica\n- Usar lenguaje claro y profesional\n- Mantener coherencia con el resto del formulario";
    }
    
    private string GetINGComplianceRules(string useCaseType)
    {
        return "CUMPLE MINUTA ING vr19: Segoe UI Semilight, interlineado simple, títulos azul RGB(0,112,192), listas multi-nivel (1-a-i), formato profesional";
    }
    
    private string GetUseCaseTypeSpecificRules(string useCaseType)
    {
        return useCaseType switch
        {
            "entidad" => "\n- Para entidades: incluye filtros/columnas de búsqueda\n- Flujos CRUD (buscar, agregar, modificar, eliminar)\n- Wireframes con paginado y botones estándar",
            "api" => "\n- Para APIs: incluye request/response detallados\n- Códigos de error y manejo de excepciones\n- Documentación de endpoints",
            "proceso" => "\n- Para procesos: describe secuencia de pasos\n- Validaciones en cada etapa\n- Puntos de control y rollback",
            _ => "\n- Adapta según tipo de caso de uso especificado"
        };
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
    
    private string GenerateIntelligentWireframeDescription(string fieldValue, object? context)
    {
        var formData = ExtractFormDataFromContext(context);
        
        // Generate dynamic wireframe based on actual form data
        if (formData != null && formData.UseCaseType == UseCaseType.Entity)
        {
            return GenerateEntitySearchWireframe(fieldValue, formData);
        }
        else if (formData != null && (formData.UseCaseType == UseCaseType.API || formData.UseCaseType == UseCaseType.Service))
        {
            return GenerateServiceWireframe(fieldValue, formData);
        }
        
        // Fallback for missing context or basic description enhancement
        if (string.IsNullOrWhiteSpace(fieldValue))
        {
            return "Wireframe ING con panel de búsqueda (filtros: Número de cliente, Apellido, DNI), botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING mostrando columnas relevantes y botones Editar/Eliminar por fila. UI textual según minuta ING.";
        }

        var description = CleanInputText(fieldValue);
        var text = description.ToLowerInvariant();

        // Enhance basic descriptions with ING-specific details
        if (text.Length < 50)
        {
            if (text.Contains("buscar") || text.Contains("filtro"))
            {
                description = $"Panel de búsqueda ING con {description}, botones Buscar/Limpiar/Agregar. Tabla de resultados con paginado ING y opciones de editar/eliminar por fila.";
            }
            else if (text.Contains("formulario") || text.Contains("form"))
            {
                description = $"Formulario ING estructurado con {description}. Incluye validaciones ING estándar y botones Guardar/Cancelar. Layout según minuta ING.";
            }
            else if (text.Contains("tabla") || text.Contains("list"))
            {
                description = $"{description} con paginado ING, ordenamiento y botones de acción (Editar/Eliminar/Ver Detalle) por fila según estándares ING.";
            }
            else
            {
                description = $"Wireframe ING con {description}. Incluye botones estándar (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado ING. UI textual describiendo layout según minuta ING.";
            }
        }
        else
        {
            if (!text.Contains("ing") && !text.Contains("boton") && !text.Contains("paginado"))
            {
                description += ". Incluye botones estándar ING (Buscar/Limpiar/Agregar/Editar/Eliminar) y paginado según minuta ING";
            }
        }

        return FormatProfessionalText(description);
    }

    private string GenerateIntelligentWireframesDescription(string fieldValue, object? context)
    {
        var formData = ExtractFormDataFromContext(context);
        
        // Generate complete wireframe system based on actual form data
        if (formData != null && formData.UseCaseType == UseCaseType.Entity)
        {
            return GenerateCompleteEntityWireframes(fieldValue, formData);
        }
        else if (formData != null && (formData.UseCaseType == UseCaseType.API || formData.UseCaseType == UseCaseType.Service))
        {
            return GenerateCompleteServiceWireframes(fieldValue, formData);
        }
        
        // Fallback for missing context
        if (string.IsNullOrWhiteSpace(fieldValue))
        {
            return @"Pantalla principal con panel de búsqueda (filtros definidos por el usuario), botones Buscar/Limpiar/Agregar.
Tabla de resultados con paginado ING mostrando columnas especificadas en el caso de uso y botones Editar/Eliminar.
Formulario modal para alta/modificación con campos definidos en la entidad y validaciones ING.
Mensaje de confirmación para operaciones exitosas o de error según corresponda.";
        }

        var description = CleanInputText(fieldValue);
        var text = description.ToLowerInvariant();

        if (text.Length < 100)
        {
            if (text.Contains("buscar") || text.Contains("filtro"))
            {
                description = $"{description}. Incluye panel superior con filtros ING estándar, botones Buscar/Limpiar/Agregar, tabla de resultados con paginado ING y botones de acción por fila.";
            }
            else if (text.Contains("formulario") || text.Contains("form"))
            {
                description = $"{description}. Modal o página con campos organizados según estándares ING, validaciones en tiempo real, botones Guardar/Cancelar y mensajes de confirmación.";
            }
            else if (text.Contains("tabla") || text.Contains("list"))
            {
                description = $"{description}. Con paginado ING, ordenamiento por columnas, filtros superiores y botones de acción (Editar/Eliminar/Ver) por cada fila.";
            }
            else
            {
                description = $"{description}. Sistema completo con wireframes ING: pantalla de búsqueda con filtros, tabla de resultados paginada, formularios modales para CRUD y mensajes de confirmación/error.";
            }
        }

        return FormatProfessionalText(description);
    }

    private UseCaseFormData? ExtractFormDataFromContext(object? context)
    {
        // Try to extract form data from context object
        if (context == null)
            return null;
            
        // Check if context is a UseCaseFormData directly
        if (context is UseCaseFormData formData)
            return formData;
            
        // Check if context is a JSON string
        if (context is string jsonString)
        {
            try
            {
                return JsonSerializer.Deserialize<UseCaseFormData>(jsonString);
            }
            catch
            {
                // If deserialization fails, return null
            }
        }
        
        // Check if context has a FullFormData property (similar to TypeScript)
        var contextType = context.GetType();
        var fullFormDataProp = contextType.GetProperty("FullFormData");
        if (fullFormDataProp != null)
        {
            var fullFormData = fullFormDataProp.GetValue(context);
            if (fullFormData is UseCaseFormData data)
                return data;
        }
        
        return null;
    }

    private string GenerateEntitySearchWireframe(string userDescription, UseCaseFormData formData)
    {
        var filters = formData.SearchFilters ?? new List<string>();
        var columns = formData.ResultColumns ?? new List<string>();
        
        var baseDescription = !string.IsNullOrWhiteSpace(userDescription) ? CleanInputText(userDescription) : "";
        
        var wireframe = $@"Wireframe textual ING para buscador de entidades {formData.UseCaseName ?? "entidad"}.

IMPORTANTE: Este wireframe usa EXACTAMENTE los datos provistos en el formulario. NO sustituir con valores genéricos.

Panel de búsqueda superior con los siguientes filtros{(filters.Any() ? ":" : " (no especificados por el usuario):")}
{(filters.Any() ? string.Join("\n", filters.Select(f => $"- {f}")) : "- (El usuario no especificó filtros)")}

Botones: Buscar, Limpiar y Agregar (estilo ING estándar).

Tabla de resultados con paginado ING activado, mostrando las siguientes columnas{(columns.Any() ? ":" : " (no especificadas por el usuario):")}
{(columns.Any() ? string.Join("\n", columns.Select(c => $"- {c}")) : "- (El usuario no especificó columnas)")}

Cada fila incluye botones Editar y Eliminar al final.

{(!string.IsNullOrWhiteSpace(baseDescription) ? $"Consideraciones adicionales: {baseDescription}" : "")}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).";

        return FormatProfessionalText(wireframe);
    }

    private string GenerateServiceWireframe(string userDescription, UseCaseFormData formData)
    {
        var baseDescription = !string.IsNullOrWhiteSpace(userDescription) ? CleanInputText(userDescription) : "";
        
        var wireframe = $@"Wireframe textual ING para {(formData.UseCaseType == UseCaseType.API ? "interfaz de API" : "proceso automático")} {formData.UseCaseName ?? "servicio"}.

Panel de configuración con:
- Parámetros de ejecución {(!string.IsNullOrWhiteSpace(formData.ApiEndpoint) ? $"(Endpoint: {formData.ApiEndpoint})" : "")}
- Configuración de frecuencia {(!string.IsNullOrWhiteSpace(formData.ServiceFrequency) ? $"({formData.ServiceFrequency})" : "")}
- Botones: Ejecutar, Configurar, Ver Logs

Panel de monitoreo con:
- Estado de ejecución en tiempo real
- Log de actividades
- Métricas de rendimiento

Panel de resultados con:
- Datos de salida formateados
- Códigos de respuesta
- Mensajes de error/éxito

{(!string.IsNullOrWhiteSpace(baseDescription) ? $"Consideraciones adicionales: {baseDescription}" : "")}

Formato estilo Microsoft (fuente Segoe UI, layout ING vr19).";

        return FormatProfessionalText(wireframe);
    }

    private string GenerateCompleteEntityWireframes(string userDescription, UseCaseFormData formData)
    {
        var filters = formData.SearchFilters ?? new List<string>();
        var columns = formData.ResultColumns ?? new List<string>();
        var fields = formData.EntityFields ?? new List<EntityField>();
        
        var baseDescription = !string.IsNullOrWhiteSpace(userDescription) ? CleanInputText(userDescription) : "";
        
        var wireframes = $@"Sistema completo de wireframes ING para gestión de {formData.UseCaseName ?? "entidad"}.

PANTALLA PRINCIPAL - BÚSQUEDA:
Panel superior con filtros{(filters.Any() ? ":" : " (definidos por el usuario):")}
{(filters.Any() ? string.Join("\n", filters.Select(f => $"- {f}")) : "- (Filtros especificados en el caso de uso)")}
Botones: Buscar, Limpiar, Agregar.

Tabla de resultados con paginado ING, columnas{(columns.Any() ? ":" : " (definidas por el usuario):")}
{(columns.Any() ? string.Join("\n", columns.Select(c => $"- {c}")) : "- (Columnas especificadas en el caso de uso)")}
Botones Editar/Eliminar por fila.

FORMULARIO MODAL - ALTA/MODIFICACIÓN:
Campos organizados según estándares ING{(fields.Any() ? ":" : " (definidos por el usuario):")}
{(fields.Any() ? string.Join("\n", fields.Select(f => $"- {f.Name ?? f.ToString()} ({f.Type ?? "text"}){(f.Mandatory ? " - Obligatorio" : "")}")) : "- (Campos especificados en la entidad)")}

Campos de auditoría obligatorios:
- Fecha de alta (automático)
- Usuario de alta (automático) 
- Fecha de modificación (automático)
- Usuario de modificación (automático)

Botones: Aceptar, Cancelar.

MENSAJES DE CONFIRMACIÓN:
- Operaciones exitosas
- Errores de validación
- Confirmaciones de eliminación

{(!string.IsNullOrWhiteSpace(baseDescription) ? $"Consideraciones adicionales: {baseDescription}" : "")}

Formato estilo Microsoft (fuente Segoe UI, layout según minuta ING vr19).";

        return FormatProfessionalText(wireframes);
    }

    private string GenerateCompleteServiceWireframes(string userDescription, UseCaseFormData formData)
    {
        var baseDescription = !string.IsNullOrWhiteSpace(userDescription) ? CleanInputText(userDescription) : "";
        
        var wireframes = $@"Sistema completo de wireframes ING para {(formData.UseCaseType == UseCaseType.API ? "API/Web Service" : "Proceso Automático")} {formData.UseCaseName ?? "servicio"}.

PANTALLA DE CONFIGURACIÓN:
Panel de parámetros{(!string.IsNullOrWhiteSpace(formData.ApiEndpoint) ? $" (Endpoint: {formData.ApiEndpoint})" : "")}:
- URL/Endpoint de destino
- Credenciales de autenticación
- Headers requeridos
- Timeout y reintentos

Configuración de ejecución{(!string.IsNullOrWhiteSpace(formData.ServiceFrequency) ? $" ({formData.ServiceFrequency})" : "")}:
- Frecuencia programada
- Condiciones de activación
- Parámetros variables

Botones: Guardar Configuración, Probar Conexión, Ejecutar Ahora.

PANTALLA DE MONITOREO:
Dashboard en tiempo real con:
- Estado actual del servicio
- Última ejecución exitosa
- Próxima ejecución programada
- Métricas de rendimiento

Log de actividades:
- Historial de ejecuciones
- Mensajes de error/éxito
- Tiempos de respuesta

PANTALLA DE RESULTADOS:
{(formData.UseCaseType == UseCaseType.API ? "Request/Response detallado:" : "Salida del proceso:")}
- Datos de entrada formateados
- Respuesta/resultado obtenido  
- Códigos de estado
- Datos procesados

Botones: Exportar Resultados, Ver Detalles, Reejecutar.

{(!string.IsNullOrWhiteSpace(baseDescription) ? $"Consideraciones adicionales: {baseDescription}" : "")}

Formato estilo Microsoft (fuente Segoe UI, layout según minuta ING vr19).";

        return FormatProfessionalText(wireframes);
    }

    private string CleanInputText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        
        // Remove quotes at the beginning and end
        text = text.Trim().Trim('"', '\'', '"', '"');
        
        // Remove excessive whitespace
        text = Regex.Replace(text, @"\s+", " ");
        
        return text.Trim();
    }

    private string FormatProfessionalText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        
        // Ensure proper capitalization and formatting
        var sentences = text.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var formattedSentences = sentences.Select(sentence =>
        {
            var trimmed = sentence.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) return trimmed;
            
            // Capitalize first letter
            return char.ToUpper(trimmed[0]) + trimmed.Substring(1).ToLowerInvariant();
        });
        
        return string.Join(". ", formattedSentences.Where(s => !string.IsNullOrWhiteSpace(s)));
    }

    public async Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request)
    {
        try
        {
            var geminiApiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(geminiApiKey))
            {
                return new ImageGenerationResponse
                {
                    Success = false,
                    Error = "Gemini API key no está configurada"
                };
            }

            var fileName = request.FileName ?? $"generated_image_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.png";
            var imagePath = Path.Combine("attached_assets", "generated_images", fileName);
            
            // Ensure directory exists
            var imageDir = Path.GetDirectoryName(imagePath);
            if (!string.IsNullOrEmpty(imageDir) && !Directory.Exists(imageDir))
            {
                Directory.CreateDirectory(imageDir);
            }

            // IMPORTANT: only this gemini model supports image generation
            var client = GetHttpClient("Gemini");
            var requestData = new
            {
                model = "gemini-2.0-flash-preview-image-generation",
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = request.Prompt } } }
                },
                config = new
                {
                    responseModalities = new[] { "TEXT", "IMAGE" }
                }
            };

            var jsonContent = JsonSerializer.Serialize(requestData);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var url = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-preview-image-generation:generateContent?key={geminiApiKey}";
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Gemini API error: {response.StatusCode} - {errorContent}");
                return new ImageGenerationResponse
                {
                    Success = false,
                    Error = $"Error en API de Gemini: {response.StatusCode}"
                };
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                return new ImageGenerationResponse
                {
                    Success = false,
                    Error = "No se generó ninguna imagen"
                };
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content_element) ||
                !content_element.TryGetProperty("parts", out var parts))
            {
                return new ImageGenerationResponse
                {
                    Success = false,
                    Error = "Respuesta inválida del modelo"
                };
            }

            bool imageGenerated = false;
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textElement))
                {
                    _logger.LogInformation($"Gemini response: {textElement.GetString()}");
                }
                else if (part.TryGetProperty("inlineData", out var inlineDataElement) &&
                         inlineDataElement.TryGetProperty("data", out var dataElement))
                {
                    var base64Data = dataElement.GetString();
                    if (!string.IsNullOrEmpty(base64Data))
                    {
                        var imageData = Convert.FromBase64String(base64Data);
                        await File.WriteAllBytesAsync(imagePath, imageData);
                        _logger.LogInformation($"Image saved as {imagePath}");
                        imageGenerated = true;
                    }
                }
            }

            if (imageGenerated)
            {
                // Return relative path for frontend access
                var imageUrl = $"/attached_assets/generated_images/{fileName}";
                return new ImageGenerationResponse
                {
                    Success = true,
                    ImageUrl = imageUrl,
                    ImagePath = imagePath
                };
            }
            else
            {
                return new ImageGenerationResponse
                {
                    Success = false,
                    Error = "No se pudo generar la imagen"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating image");
            return new ImageGenerationResponse
            {
                Success = false,
                Error = $"Error al generar imagen: {ex.Message}"
            };
        }
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