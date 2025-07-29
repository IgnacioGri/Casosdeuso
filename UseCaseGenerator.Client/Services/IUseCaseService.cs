using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Client.Services;

public interface IUseCaseService
{
    Task<GenerateUseCaseResponse> GenerateUseCaseAsync(GenerateUseCaseRequest request);
    Task<string> EditUseCaseAsync(string content, string instructions, AIModel aiModel);
    Task<List<UseCase>> GetAllUseCasesAsync();
    Task<UseCase?> GetUseCaseAsync(string id);
    Task DeleteUseCaseAsync(string id);
}