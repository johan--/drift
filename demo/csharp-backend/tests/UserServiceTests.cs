using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using DemoApi.Models;
using DemoApi.Services;
using DemoApi.Data;

namespace DemoApi.Tests;

/// <summary>
/// Unit tests for UserService
/// </summary>
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ILogger<UserService>> _loggerMock;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _loggerMock = new Mock<ILogger<UserService>>();
        _service = new UserService(_userRepositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithExistingUser_ReturnsSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Role = "User",
            Permissions = new List<string> { "orders:create" },
            CreatedAt = DateTime.UtcNow
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await _service.GetUserByIdAsync(userId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().Be(userId);
        result.Value.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetUserByIdAsync_WithNonExistingUser_ReturnsNotFoundError()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _service.GetUserByIdAsync(userId);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().BeOfType<NotFoundError>();
    }

    [Fact]
    public async Task CreateUserAsync_WithNewEmail_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateUserRequest("new@example.com", "Jane", "Smith", "Password123!");

        _userRepositoryMock
            .Setup(x => x.GetByEmailAsync(request.Email))
            .ReturnsAsync((User?)null);

        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be(request.Email);
        result.Value.FirstName.Should().Be(request.FirstName);
        
        _userRepositoryMock.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_WithExistingEmail_ReturnsConflictError()
    {
        // Arrange
        var request = new CreateUserRequest("existing@example.com", "Jane", "Smith", "Password123!");
        var existingUser = new User { Email = request.Email };

        _userRepositoryMock
            .Setup(x => x.GetByEmailAsync(request.Email))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _service.CreateUserAsync(request);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().BeOfType<ConflictError>();
    }

    [Fact]
    public async Task UpdateUserAsync_WithExistingUser_ReturnsUpdatedUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Role = "User",
            Permissions = new List<string>(),
            CreatedAt = DateTime.UtcNow
        };

        var request = new UpdateUserRequest("Jane", "Smith", "Manager");

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateUserAsync(userId, request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.FirstName.Should().Be("Jane");
        result.Value.LastName.Should().Be("Smith");
        result.Value.Role.Should().Be("Manager");
    }

    [Fact]
    public async Task DeleteUserAsync_WithExistingUser_ReturnsSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.DeleteAsync(user))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteUserAsync(userId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _userRepositoryMock.Verify(x => x.DeleteAsync(user), Times.Once);
    }

    [Theory]
    [InlineData("Admin", 4)]
    [InlineData("Manager", 3)]
    [InlineData("User", 2)]
    public async Task CreateUserAsync_AssignsCorrectPermissions(string role, int expectedPermissionCount)
    {
        // Arrange
        var request = new CreateUserRequest("test@example.com", "Test", "User", "Password123!", role);

        _userRepositoryMock
            .Setup(x => x.GetByEmailAsync(request.Email))
            .ReturnsAsync((User?)null);

        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateUserAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Permissions.Should().HaveCount(expectedPermissionCount);
    }
}
