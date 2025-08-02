using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Services;

public interface IDocumentService
{
    byte[] GenerateDocx(string htmlContent, UseCase useCase, string? customHeaderImage = null);
    string ConvertToHtml(string content);
}