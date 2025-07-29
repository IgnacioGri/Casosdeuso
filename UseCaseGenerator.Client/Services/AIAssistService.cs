using System.Net.Http.Json;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Client.Services;

public class AIAssistService : IAIAssistService
{
    private readonly HttpClient _httpClient;

    public AIAssistService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<AIAssistResponse> ImproveFieldAsync(AIAssistRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/ai-assist", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AIAssistResponse>() 
            ?? new AIAssistResponse { Success = false, Error = "Error de respuesta" };
    }

    public async Task<MinuteAnalysisResponse> AnalyzeMinuteAsync(MinuteAnalysisRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/minute-analysis", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<MinuteAnalysisResponse>() 
            ?? new MinuteAnalysisResponse { Success = false, Error = "Error de respuesta" };
    }

    public async Task<IntelligentTestCaseResponse> GenerateTestCasesAsync(IntelligentTestCaseRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/intelligent-test-cases", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<IntelligentTestCaseResponse>() 
            ?? new IntelligentTestCaseResponse { Success = false, Error = "Error de respuesta" };
    }
}