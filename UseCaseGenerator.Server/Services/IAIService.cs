using UseCaseGenerator.Shared.DTOs;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Services;

public interface IAIService
{
    Task<GenerateUseCaseResponse> GenerateUseCaseAsync(GenerateUseCaseRequest request);
    Task<string> EditUseCaseAsync(string content, string instructions, AIModel aiModel);
    Task<AIAssistResponse> ImproveFieldAsync(AIAssistRequest request);
    Task<string> ProcessFieldWithAIAsync(string systemPrompt, string fieldValue, AIModel aiModel);
}