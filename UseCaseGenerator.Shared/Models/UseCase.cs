using System.ComponentModel.DataAnnotations;

namespace UseCaseGenerator.Shared.Models;

public class UseCase
{
    public string Id { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string UseCaseCode { get; set; } = string.Empty;
    public string UseCaseName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public UseCaseType UseCaseType { get; set; }
    public string Description { get; set; } = string.Empty;
    
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
    
    // Generated content
    public string? GeneratedContent { get; set; }
    public AIModel AiModel { get; set; }
    
    // Minute analysis
    public string? UploadedMinute { get; set; }
    public Dictionary<string, bool> AiGeneratedFields { get; set; } = new();
    
    // Metadata
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public enum UseCaseType
{
    Entity,
    API,
    Process
}

public enum AIModel
{
    Demo,
    OpenAI,
    Claude,
    Grok,
    Gemini
}

public class EntityField
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsMandatory { get; set; }
    public int? MaxLength { get; set; }
    public string? Description { get; set; }
    public string? ValidationRules { get; set; }
}

public class TestCase
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Objective { get; set; } = string.Empty;
    public string Preconditions { get; set; } = string.Empty;
    public List<TestStep> Steps { get; set; } = new();
    public string ExpectedResult { get; set; } = string.Empty;
    public TestCaseType Type { get; set; } = TestCaseType.Positive;
    public TestCasePriority Priority { get; set; } = TestCasePriority.Medium;
}

public enum TestCaseType
{
    Positive,
    Negative,
    Boundary,
    Integration
}

public enum TestCasePriority
{
    Low,
    Medium,
    High,
    Critical
}

public class TestStep
{
    public int Number { get; set; }
    public string Action { get; set; } = string.Empty;
    public string InputData { get; set; } = string.Empty;
    public string ExpectedResult { get; set; } = string.Empty;
    public string Observations { get; set; } = string.Empty;
    public TestStepStatus Status { get; set; }
}

public enum TestStepStatus
{
    Pending,
    Passed,
    Failed
}