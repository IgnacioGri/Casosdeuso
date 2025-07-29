using System.Net.Http.Json;
using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Client.Services;

public class UseCaseService : IUseCaseService
{
    private readonly HttpClient _httpClient;

    public UseCaseService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<GenerateUseCaseResponse> GenerateUseCaseAsync(GenerateUseCaseRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/usecase/generate", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<GenerateUseCaseResponse>() 
            ?? new GenerateUseCaseResponse { Success = false, Error = "Error de respuesta" };
    }

    public async Task<string> EditUseCaseAsync(string content, string instructions, AIModel aiModel)
    {
        var request = new { Content = content, Instructions = instructions, AiModel = aiModel };
        var response = await _httpClient.PostAsJsonAsync("api/usecase/edit", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }

    public async Task<List<UseCase>> GetAllUseCasesAsync()
    {
        return await _httpClient.GetFromJsonAsync<List<UseCase>>("api/usecase") ?? new List<UseCase>();
    }

    public async Task<UseCase?> GetUseCaseAsync(string id)
    {
        return await _httpClient.GetFromJsonAsync<UseCase>($"api/usecase/{id}");
    }

    public async Task DeleteUseCaseAsync(string id)
    {
        await _httpClient.DeleteAsync($"api/usecase/{id}");
    }
}