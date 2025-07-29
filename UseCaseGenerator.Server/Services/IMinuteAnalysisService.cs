using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Server.Services;

public interface IMinuteAnalysisService
{
    Task<MinuteAnalysisResponse> AnalyzeMinuteAsync(MinuteAnalysisRequest request);
}