using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Server.Services;

public interface IIntelligentTestCaseService
{
    Task<IntelligentTestCaseResponse> GenerateTestCasesAsync(IntelligentTestCaseRequest request);
}