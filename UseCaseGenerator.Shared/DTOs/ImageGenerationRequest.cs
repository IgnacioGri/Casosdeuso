namespace UseCaseGenerator.Shared.DTOs;

public class ImageGenerationRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string? FileName { get; set; }
}

public class ImageGenerationResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePath { get; set; }
}