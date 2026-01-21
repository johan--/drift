namespace DemoApi.Models;

/// <summary>
/// User data transfer object
/// </summary>
public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    List<string> Permissions,
    DateTime CreatedAt);

/// <summary>
/// Product data transfer object
/// </summary>
public record ProductDto(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string Category,
    int StockQuantity,
    bool InStock);

/// <summary>
/// Order data transfer object
/// </summary>
public record OrderDto(
    Guid Id,
    Guid UserId,
    OrderStatus Status,
    decimal TotalAmount,
    string? ShippingAddress,
    List<OrderItemDto> Items,
    DateTime CreatedAt);

/// <summary>
/// Order item data transfer object
/// </summary>
public record OrderItemDto(
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice);

/// <summary>
/// Paginated result wrapper
/// </summary>
/// <typeparam name="T">Type of items</typeparam>
public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);
