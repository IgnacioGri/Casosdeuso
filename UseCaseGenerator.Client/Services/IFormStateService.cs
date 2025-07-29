using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Client.Services;

public interface IFormStateService
{
    Task SaveFormStateAsync(UseCaseFormData formData);
    Task<UseCaseFormData?> LoadFormStateAsync();
    Task ClearFormStateAsync();
    event Action? OnFormStateChanged;
}