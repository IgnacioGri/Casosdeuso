using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Services;

public interface IUseCaseRepository
{
    Task<UseCase> CreateAsync(UseCase useCase);
    Task<UseCase?> GetByIdAsync(string id);
    Task<List<UseCase>> GetAllAsync();
    Task<UseCase> UpdateAsync(UseCase useCase);
    Task DeleteAsync(string id);
}