using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Client.Services;

public interface IAIAssistService
{
    Task<AIAssistResponse> ImproveFieldAsync(AIAssistRequest request);
    Task<MinuteAnalysisResponse> AnalyzeMinuteAsync(MinuteAnalysisRequest request);
    Task<IntelligentTestCaseResponse> GenerateTestCasesAsync(IntelligentTestCaseRequest request);
}