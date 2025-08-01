namespace UseCaseGenerator.Client.Services;

public interface IDocumentService
{
    Task<byte[]> DownloadDocxAsync(string content, string fileName, object formData = null);
    void DownloadHtml(string content, string fileName);
}