using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DemoApi.Models;
using DemoApi.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace DemoApi.Controllers;

/// <summary>
/// Controller for order management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Gets orders for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> GetMyOrders(
        [FromQuery] OrderStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        _logger.LogInformation("Getting orders for user {UserId}, status: {Status}", userId, status);
        
        var result = await _orderService.GetUserOrdersAsync(userId, status, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets all orders (admin only)
    /// </summary>
    [HttpGet("all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<PagedResult<OrderDto>>> GetAllOrders(
        [FromQuery] OrderStatus? status,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        _logger.LogInformation("Admin getting all orders - Status: {Status}, UserId: {UserId}", status, userId);
        
        var result = await _orderService.GetAllOrdersAsync(status, userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gets a specific order
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        
        var result = await _orderService.GetOrderByIdAsync(id);
        
        return result.Match<ActionResult<OrderDto>>(
            order =>
            {
                // Resource-based authorization: users can only see their own orders
                if (!isAdmin && order.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to access order {OrderId} belonging to another user", userId, id);
                    return Forbid();
                }
                return Ok(order);
            },
            error => NotFound(new { message = error.Message }));
    }

    /// <summary>
    /// Creates a new order
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        _logger.LogInformation("Creating order for user {UserId} with {ItemCount} items", userId, request.Items.Count);
        
        var result = await _orderService.CreateOrderAsync(userId, request);
        
        return result.Match<ActionResult<OrderDto>>(
            order => CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order),
            error => error switch
            {
                ValidationError ve => BadRequest(new { message = ve.Message, errors = ve.Errors }),
                InsufficientStockError ise => BadRequest(new { message = ise.Message, productId = ise.ProductId }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Updates order status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        _logger.LogInformation("Updating order {OrderId} status to {Status}", id, request.Status);
        
        var result = await _orderService.UpdateOrderStatusAsync(id, request.Status);
        
        return result.Match<ActionResult<OrderDto>>(
            order => Ok(order),
            error => error switch
            {
                NotFoundError => NotFound(new { message = error.Message }),
                InvalidStateTransitionError => BadRequest(new { message = error.Message }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Cancels an order
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        
        // Check ownership first
        var orderResult = await _orderService.GetOrderByIdAsync(id);
        if (orderResult.IsFailure)
        {
            return NotFound(new { message = "Order not found" });
        }
        
        var order = orderResult.Value;
        if (!isAdmin && order.UserId != userId)
        {
            return Forbid();
        }

        _logger.LogInformation("Cancelling order {OrderId}", id);
        
        var result = await _orderService.CancelOrderAsync(id);
        
        return result.Match<ActionResult<OrderDto>>(
            o => Ok(o),
            error => BadRequest(new { message = error.Message }));
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public record CreateOrderRequest(
    [Required][MinLength(1)] List<OrderItemRequest> Items,
    string? ShippingAddress,
    string? Notes);

public record OrderItemRequest(
    [Required] Guid ProductId,
    [Required][Range(1, 100)] int Quantity);

public record UpdateOrderStatusRequest([Required] OrderStatus Status);
