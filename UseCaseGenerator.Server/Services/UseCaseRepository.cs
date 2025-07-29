using Microsoft.EntityFrameworkCore;
using UseCaseGenerator.Server.Data;
using UseCaseGenerator.Shared.Models;

namespace UseCaseGenerator.Server.Services;

public class UseCaseRepository : IUseCaseRepository
{
    private readonly AppDbContext _context;

    public UseCaseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UseCase> CreateAsync(UseCase useCase)
    {
        useCase.Id = Guid.NewGuid().ToString();
        useCase.CreatedAt = DateTime.UtcNow;
        useCase.UpdatedAt = DateTime.UtcNow;

        _context.UseCases.Add(useCase);
        await _context.SaveChangesAsync();
        return useCase;
    }

    public async Task<UseCase?> GetByIdAsync(string id)
    {
        return await _context.UseCases.FindAsync(id);
    }

    public async Task<List<UseCase>> GetAllAsync()
    {
        return await _context.UseCases
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
    }

    public async Task<UseCase> UpdateAsync(UseCase useCase)
    {
        useCase.UpdatedAt = DateTime.UtcNow;
        _context.Entry(useCase).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return useCase;
    }

    public async Task DeleteAsync(string id)
    {
        var useCase = await _context.UseCases.FindAsync(id);
        if (useCase != null)
        {
            _context.UseCases.Remove(useCase);
            await _context.SaveChangesAsync();
        }
    }
}