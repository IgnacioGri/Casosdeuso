using Microsoft.JSInterop;

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

    public async Task<byte[]> DownloadDocxAsync(string content, string fileName)
    {
        var response = await _httpClient.PostAsJsonAsync("api/document/docx", new { Content = content, FileName = fileName });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync();
    }

    public void DownloadHtml(string content, string fileName)
    {
        var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{fileName}</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }}
        h1, h2, h3 {{ color: #0070C0; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
{content}
</body>
</html>";

        var blob = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(htmlContent));
        _jsRuntime.InvokeVoidAsync("downloadFile", fileName + ".html", "data:text/html;base64," + blob);
    }
}