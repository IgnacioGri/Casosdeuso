using Microsoft.JSInterop;
using System.Net.Http.Json;

namespace UseCaseGenerator.Client.Services;

public class DocumentService : IDocumentService
{
    private readonly HttpClient _httpClient;
    private readonly IJSRuntime _jsRuntime;

    public DocumentService(HttpClient httpClient, IJSRuntime jsRuntime)
    {
        _httpClient = httpClient;
        _jsRuntime = jsRuntime;
    }

    public async Task<byte[]> DownloadDocxAsync(string content, string fileName, object formData = null)
    {
        // IMPORTANT: Always send formData for DOCX generation (HTML conversion is deprecated)
        if (formData == null)
        {
            throw new ArgumentException("formData is required for DOCX export. The HTML conversion method is deprecated.");
        }
        

        var response = await _httpClient.PostAsJsonAsync("api/Document/docx", new 
        { 
            Content = content, 
            FileName = fileName,
            FormData = formData
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync();
    }

    // HTML download removed - DOCX generated and downloaded directly
    
    public void DownloadHtml(string html, string fileName)
    {
        // This method is deprecated - always use DOCX export instead
        throw new NotImplementedException("HTML export is deprecated. Use DOCX export instead.");
    }
}