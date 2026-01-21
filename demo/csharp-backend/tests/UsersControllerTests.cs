using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using DemoApi.Controllers;
using DemoApi.Models;
using DemoApi.Services;

namespace DemoApi.Tests;

/// <summary>
/// Unit tests for UsersController
/// </summary>
public class UsersControllerTests
{
    private readonly Mock<IUserService> _userServiceMock;
    private readonly Mock<ILogger<UsersController>> _loggerMock;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _userServiceMock = new Mock<IUserService>();
        _loggerMock = new Mock<ILogger<UsersController>>();
        _controller = new UsersController(_userServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetUsers_ReturnsPagedResult()
    {
        // Arrange
        var expectedResult = new PagedResult<UserDto>(
            Items: new List<UserDto>
            {
                new(Guid.NewGuid(), "test@example.com", "John", "Doe", "User", new List<string>(), DateTime.UtcNow)
            },
            TotalCount: 1,
            Page: 1,
            PageSize: 10,
            TotalPages: 1);

        _userServiceMock
            .Setup(x => x.GetUsersAsync(1, 10))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.GetUsers(1, 10);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResult);
    }

    [Fact]
    public async Task GetUser_WithValidId_ReturnsUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedUser = new UserDto(
            userId, "test@example.com", "John", "Doe", "User", new List<string>(), DateTime.UtcNow);

        _userServiceMock
            .Setup(x => x.GetUserByIdAsync(userId))
            .ReturnsAsync(Result<UserDto>.Success(expectedUser));

        // Act
        var result = await _controller.GetUser(userId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedUser);
    }

    [Fact]
    public async Task GetUser_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userServiceMock
            .Setup(x => x.GetUserByIdAsync(userId))
            .ReturnsAsync(Result<UserDto>.Failure(new NotFoundError($"User with ID {userId} not found")));

        // Act
        var result = await _controller.GetUser(userId);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreateUser_WithValidRequest_ReturnsCreatedUser()
    {
        // Arrange
        var request = new CreateUserRequest("test@example.com", "John", "Doe", "Password123!");
        var createdUser = new UserDto(
            Guid.NewGuid(), request.Email, request.FirstName, request.LastName, "User", new List<string>(), DateTime.UtcNow);

        _userServiceMock
            .Setup(x => x.CreateUserAsync(request))
            .ReturnsAsync(Result<UserDto>.Success(createdUser));

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result.Result as CreatedAtActionResult;
        createdResult!.Value.Should().BeEquivalentTo(createdUser);
    }

    [Fact]
    public async Task CreateUser_WithDuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var request = new CreateUserRequest("existing@example.com", "John", "Doe", "Password123!");

        _userServiceMock
            .Setup(x => x.CreateUserAsync(request))
            .ReturnsAsync(Result<UserDto>.Failure(new ConflictError("User already exists")));

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task DeleteUser_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userServiceMock
            .Setup(x => x.DeleteUserAsync(userId))
            .ReturnsAsync(Result<Unit>.Success(Unit.Value));

        // Act
        var result = await _controller.DeleteUser(userId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteUser_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userServiceMock
            .Setup(x => x.DeleteUserAsync(userId))
            .ReturnsAsync(Result<Unit>.Failure(new NotFoundError("User not found")));

        // Act
        var result = await _controller.DeleteUser(userId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
