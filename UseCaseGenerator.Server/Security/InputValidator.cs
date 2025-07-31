using System.Text.RegularExpressions;

namespace UseCaseGenerator.Server.Security;

public static class InputValidator
{
    // Safe character patterns
    private static readonly Regex SafeTextPattern = new(@"^[a-zA-Z0-9\s\-_\.,:;!?()ñÑáéíóúÁÉÍÓÚ]+$");
    private static readonly Regex SafeFileNamePattern = new(@"^[a-zA-Z0-9_\-\.]+$");
    private static readonly Regex HtmlTagPattern = new(@"<[^>]+>");
    private static readonly Regex ScriptPattern = new(@"<script[^>]*>.*?</script>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
    
    /// <summary>
    /// Sanitizes text input to prevent XSS and injection attacks
    /// </summary>
    public static string SanitizeText(string? input, int maxLength = 500)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove script tags first
        var sanitized = ScriptPattern.Replace(input, "");
        
        // Remove all HTML tags
        sanitized = HtmlTagPattern.Replace(sanitized, "");
        
        // Remove dangerous characters
        sanitized = Regex.Replace(sanitized, @"[<>""'&\\]", "");
        
        // Normalize whitespace
        sanitized = Regex.Replace(sanitized, @"\s+", " ").Trim();
        
        // Limit length
        if (sanitized.Length > maxLength)
            sanitized = sanitized.Substring(0, maxLength);
        
        return sanitized;
    }
    
    /// <summary>
    /// Validates and sanitizes file names to prevent path traversal
    /// </summary>
    public static string SanitizeFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name cannot be empty");
        
        // Remove path characters
        fileName = Path.GetFileName(fileName);
        
        // Remove directory traversal attempts
        fileName = fileName.Replace("..", "").Replace("/", "").Replace("\\", "");
        
        // Only allow safe characters
        if (!SafeFileNamePattern.IsMatch(fileName))
        {
            // Remove unsafe characters
            fileName = Regex.Replace(fileName, @"[^a-zA-Z0-9_\-\.]", "");
        }
        
        // Ensure reasonable length
        if (fileName.Length > 100)
            fileName = fileName.Substring(0, 100);
        
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("Invalid file name after sanitization");
        
        return fileName;
    }
    
    /// <summary>
    /// Validates content size to prevent DoS attacks
    /// </summary>
    public static void ValidateContentSize(string? content, int maxSizeInChars = 100000)
    {
        if (content != null && content.Length > maxSizeInChars)
        {
            throw new ArgumentException($"Content size exceeds maximum allowed size of {maxSizeInChars} characters");
        }
    }
    
    /// <summary>
    /// Validates and sanitizes JSON content
    /// </summary>
    public static bool IsValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return false;
        
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    /// <summary>
    /// Validates email format
    /// </summary>
    public static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;
        
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}