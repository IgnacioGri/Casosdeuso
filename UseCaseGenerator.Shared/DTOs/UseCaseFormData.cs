using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Shared.DTOs;

public class UseCaseFormData
{
    public UseCaseType UseCaseType { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string UseCaseCode { get; set; } = string.Empty;
    public string UseCaseName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Optional description fields for AI processing
    public string? FiltersDescription { get; set; }
    public string? ColumnsDescription { get; set; }
    public string? FieldsDescription { get; set; }
    
    // Entity-specific fields
    public List<string> SearchFilters { get; set; } = new();
    public List<string> ResultColumns { get; set; } = new();
    public List<EntityField> EntityFields { get; set; } = new();
    
    // Business logic
    public string? BusinessRules { get; set; }
    public string? SpecialRequirements { get; set; }
    
    // Wireframes
    public bool GenerateWireframes { get; set; }
    public List<string> WireframeDescriptions { get; set; } = new();
    public string? WireframesDescription { get; set; }
    
    // Alternative flows
    public List<string> AlternativeFlows { get; set; } = new();
    public string? AlternativeFlowsDescription { get; set; }
    
    // API-specific fields
    public string? ApiEndpoint { get; set; }
    public string? RequestFormat { get; set; }
    public string? ResponseFormat { get; set; }
    
    // Service-specific fields
    public string? ServiceFrequency { get; set; }
    public string? ExecutionTime { get; set; }
    public string? ConfigurationPaths { get; set; }
    public string? WebServiceCredentials { get; set; }
    
    // Test cases
    public bool GenerateTestCase { get; set; }
    public string? TestCaseObjective { get; set; }
    public string? TestCasePreconditions { get; set; }
    public List<TestStep> TestSteps { get; set; } = new();
    
    // AI configuration
    public bool IsAIGenerated { get; set; }
    public AIModel AiModel { get; set; } = AIModel.Demo;
}

public class EditUseCaseRequest
{
    public string Content { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public AIModel AiModel { get; set; } = AIModel.Demo;
}

public class GenerateDocxRequest
{
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class ConvertToHtmlRequest
{
    public string Content { get; set; } = string.Empty;
}

public class IntelligentTestCaseRequest
{
    public UseCaseFormData FormData { get; set; } = new();
    public AIModel AiModel { get; set; } = AIModel.Demo;
}

public class IntelligentTestCaseResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public List<TestCase> TestCases { get; set; } = new();
}

public class AnalyzeForTestCasesRequest
{
    public UseCaseFormData FormData { get; set; } = new();
    public AIModel AiModel { get; set; } = AIModel.Demo;
}

public class MinuteAnalysisRequest
{
    public string Content { get; set; } = string.Empty;
    public AIModel AiModel { get; set; } = AIModel.Demo;
}

public class MinuteAnalysisResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public UseCaseFormData? ExtractedData { get; set; }
}

