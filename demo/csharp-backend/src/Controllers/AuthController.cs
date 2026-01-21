using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.ComponentModel.DataAnnotations;
using DemoApi.Models;
using DemoApi.Services;

namespace DemoApi.Controllers;

/// <summary>
/// Authentication controller for JWT token management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT token and user info</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        var result = await _userService.ValidateCredentialsAsync(request.Email, request.Password);

        return result.Match<ActionResult<LoginResponse>>(
            user =>
            {
                var token = GenerateJwtToken(user);
                _logger.LogInformation("User {UserId} logged in successfully", user.Id);
                
                return Ok(new LoginResponse(
                    Token: token,
                    ExpiresAt: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                    User: user));
            },
            error =>
            {
                _logger.LogWarning("Failed login attempt for email: {Email}", request.Email);
                return Unauthorized(new { message = "Invalid email or password" });
            });
    }

    /// <summary>
    /// Refreshes an existing JWT token
    /// </summary>
    [HttpPost("refresh")]
    [Authorize]
    public async Task<ActionResult<LoginResponse>> RefreshToken()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _userService.GetUserByIdAsync(Guid.Parse(userId));

        return result.Match<ActionResult<LoginResponse>>(
            user =>
            {
                var token = GenerateJwtToken(user);
                _logger.LogDebug("Token refreshed for user {UserId}", user.Id);
                
                return Ok(new LoginResponse(
                    Token: token,
                    ExpiresAt: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                    User: user));
            },
            error => Unauthorized());
    }

    /// <summary>
    /// Gets the current user's profile
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _userService.GetUserByIdAsync(Guid.Parse(userId));

        return result.Match<ActionResult<UserDto>>(
            user => Ok(user),
            error => NotFound());
    }

    private string GenerateJwtToken(UserDto user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new(ClaimTypes.Role, user.Role)
        };

        // Add permission claims
        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("Permission", permission));
        }

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password);

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    UserDto User);
