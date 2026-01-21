using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DemoApi.Models;
using DemoApi.Services;
using System.ComponentModel.DataAnnotations;

namespace DemoApi.Controllers;

/// <summary>
/// Controller for managing user operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all users with pagination
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Items per page</param>
    /// <returns>Paginated list of users</returns>
    [HttpGet]
    [Authorize(Policy = "CanManageUsers")]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Getting users page {Page} with size {PageSize}", page, pageSize);
        
        var result = await _userService.GetUsersAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets a specific user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User details</returns>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        _logger.LogDebug("Getting user with ID {UserId}", id);
        
        var result = await _userService.GetUserByIdAsync(id);
        
        return result.Match<ActionResult<UserDto>>(
            user => Ok(user),
            error => error switch
            {
                NotFoundError => NotFound(new { message = error.Message }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Creates a new user
    /// </summary>
    /// <param name="request">User creation request</param>
    /// <returns>Created user</returns>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Creating new user with email {Email}", request.Email);
        
        var result = await _userService.CreateUserAsync(request);
        
        return result.Match<ActionResult<UserDto>>(
            user => CreatedAtAction(nameof(GetUser), new { id = user.Id }, user),
            error => error switch
            {
                ValidationError ve => BadRequest(new { message = ve.Message, errors = ve.Errors }),
                ConflictError => Conflict(new { message = error.Message }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Updates an existing user
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Updated user</returns>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        _logger.LogInformation("Updating user {UserId}", id);
        
        var result = await _userService.UpdateUserAsync(id, request);
        
        return result.Match<ActionResult<UserDto>>(
            user => Ok(user),
            error => error switch
            {
                NotFoundError => NotFound(new { message = error.Message }),
                ValidationError ve => BadRequest(new { message = ve.Message, errors = ve.Errors }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Deletes a user
    /// </summary>
    /// <param name="id">User ID</param>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        _logger.LogWarning("Deleting user {UserId}", id);
        
        var result = await _userService.DeleteUserAsync(id);
        
        return result.Match<IActionResult>(
            _ => NoContent(),
            error => error switch
            {
                NotFoundError => NotFound(new { message = error.Message }),
                _ => BadRequest(new { message = error.Message })
            });
    }
}

public record CreateUserRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(2)] string FirstName,
    [Required][MinLength(2)] string LastName,
    [Required][MinLength(8)] string Password,
    string? Role = "User");

public record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    string? Role);
