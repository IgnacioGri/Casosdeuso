using Microsoft.EntityFrameworkCore;
using UseCaseGenerator.Shared.Models;
using System.Text.Json;

namespace UseCaseGenerator.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UseCase> UseCases { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var useCaseEntity = modelBuilder.Entity<UseCase>();
        
        useCaseEntity.HasKey(u => u.Id);
        useCaseEntity.Property(u => u.Id).ValueGeneratedOnAdd();
        
        // Configure JSON columns for complex types
        useCaseEntity.Property(u => u.SearchFilters)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>());

        useCaseEntity.Property(u => u.ResultColumns)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>());

        useCaseEntity.Property(u => u.EntityFields)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<EntityField>>(v, JsonSerializerOptions.Default) ?? new List<EntityField>());

        useCaseEntity.Property(u => u.WireframeDescriptions)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>());

        // AlternativeFlows is not a property of UseCase model - removed

        useCaseEntity.Property(u => u.TestSteps)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<TestStep>>(v, JsonSerializerOptions.Default) ?? new List<TestStep>());

        useCaseEntity.Property(u => u.AiGeneratedFields)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<Dictionary<string, bool>>(v, JsonSerializerOptions.Default) ?? new Dictionary<string, bool>());

        // Configure enums
        useCaseEntity.Property(u => u.UseCaseType)
            .HasConversion<string>();

        useCaseEntity.Property(u => u.AiModel)
            .HasConversion<string>();

        // Configure timestamps
        useCaseEntity.Property(u => u.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        useCaseEntity.Property(u => u.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}