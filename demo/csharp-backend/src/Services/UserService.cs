using DemoApi.Models;
using DemoApi.Data;
using Microsoft.EntityFrameworkCore;

namespace DemoApi.Services;

/// <summary>
/// User service interface
/// </summary>
public interface IUserService
{
    Task<PagedResult<UserDto>> GetUsersAsync(int page, int pageSize);
    Task<Result<UserDto>> GetUserByIdAsync(Guid id);
    Task<Result<UserDto>> CreateUserAsync(CreateUserRequest request);
    Task<Result<UserDto>> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<Result<Unit>> DeleteUserAsync(Guid id);
    Task<Result<UserDto>> ValidateCredentialsAsync(string email, string password);
}

/// <summary>
/// User service implementation
/// </summary>
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository userRepository, ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(int page, int pageSize)
    {
        var (users, totalCount) = await _userRepository.GetUsersAsync(page, pageSize);
        
        var dtos = users.Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<UserDto>(dtos, totalCount, page, pageSize, totalPages);
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        
        if (user == null)
        {
            return new NotFoundError($"User with ID {id} not found");
        }

        return MapToDto(user);
    }

    public async Task<Result<UserDto>> CreateUserAsync(CreateUserRequest request)
    {
        // Check for existing user
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new ConflictError($"User with email {request.Email} already exists");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = HashPassword(request.Password),
            Role = request.Role ?? "User",
            Permissions = GetDefaultPermissions(request.Role ?? "User"),
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        
        _logger.LogInformation("Created user {UserId} with email {Email}", user.Id, user.Email);

        return MapToDto(user);
    }

    public async Task<Result<UserDto>> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        
        if (user == null)
        {
            return new NotFoundError($"User with ID {id} not found");
        }

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.Role != null)
        {
            user.Role = request.Role;
            user.Permissions = GetDefaultPermissions(request.Role);
        }
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        
        _logger.LogInformation("Updated user {UserId}", id);

        return MapToDto(user);
    }

    public async Task<Result<Unit>> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        
        if (user == null)
        {
            return new NotFoundError($"User with ID {id} not found");
        }

        await _userRepository.DeleteAsync(user);
        
        _logger.LogInformation("Deleted user {UserId}", id);

        return Unit.Value;
    }

    public async Task<Result<UserDto>> ValidateCredentialsAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        
        if (user == null || !VerifyPassword(password, user.PasswordHash))
        {
            return new AuthenticationError("Invalid credentials");
        }

        if (!user.IsActive)
        {
            return new AuthenticationError("User account is disabled");
        }

        return MapToDto(user);
    }

    private static UserDto MapToDto(User user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        user.Role,
        user.Permissions,
        user.CreatedAt);

    private static string HashPassword(string password)
    {
        // In production, use proper password hashing (BCrypt, Argon2, etc.)
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private static List<string> GetDefaultPermissions(string role) => role switch
    {
        "Admin" => new List<string> { "users:manage", "products:manage", "orders:manage", "reports:view" },
        "Manager" => new List<string> { "products:manage", "orders:manage", "reports:view" },
        "User" => new List<string> { "orders:create", "orders:view" },
        _ => new List<string>()
    };
}
