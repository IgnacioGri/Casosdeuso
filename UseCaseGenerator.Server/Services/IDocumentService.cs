using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Services;

public interface IDocumentService
{
    byte[] GenerateDocx(string htmlContent, UseCase useCase);
    string ConvertToHtml(string content);
}