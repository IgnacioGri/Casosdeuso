using Blazored.LocalStorage;
using System.Text.Json;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Client.Services;

public class FormStateService : IFormStateService
{
    private readonly ILocalStorageService _localStorage;
    private const string FormStateKey = "useCaseFormState";

    public FormStateService(ILocalStorageService localStorage)
    {
        _localStorage = localStorage;
    }

    public event Action? OnFormStateChanged;

    public async Task SaveFormStateAsync(UseCaseFormData formData)
    {
        await _localStorage.SetItemAsync(FormStateKey, formData);
        OnFormStateChanged?.Invoke();
    }

    public async Task<UseCaseFormData?> LoadFormStateAsync()
    {
        return await _localStorage.GetItemAsync<UseCaseFormData>(FormStateKey);
    }

    public async Task ClearFormStateAsync()
    {
        await _localStorage.RemoveItemAsync(FormStateKey);
        OnFormStateChanged?.Invoke();
    }
}