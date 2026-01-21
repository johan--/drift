using DemoApi.Models;
using DemoApi.Controllers;

namespace DemoApi.Services;

/// <summary>
/// Order service interface
/// </summary>
public interface IOrderService
{
    Task<PagedResult<OrderDto>> GetUserOrdersAsync(Guid userId, OrderStatus? status, int page, int pageSize);
    Task<PagedResult<OrderDto>> GetAllOrdersAsync(OrderStatus? status, Guid? userId, int page, int pageSize);
    Task<Result<OrderDto>> GetOrderByIdAsync(Guid id);
    Task<Result<OrderDto>> CreateOrderAsync(Guid userId, CreateOrderRequest request);
    Task<Result<OrderDto>> UpdateOrderStatusAsync(Guid id, OrderStatus newStatus);
    Task<Result<OrderDto>> CancelOrderAsync(Guid id);
}

/// <summary>
/// Order service implementation
/// </summary>
public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task<PagedResult<OrderDto>> GetUserOrdersAsync(Guid userId, OrderStatus? status, int page, int pageSize)
    {
        var (orders, totalCount) = await _orderRepository.GetUserOrdersAsync(userId, status, page, pageSize);
        
        var dtos = orders.Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<OrderDto>(dtos, totalCount, page, pageSize, totalPages);
    }

    public async Task<PagedResult<OrderDto>> GetAllOrdersAsync(OrderStatus? status, Guid? userId, int page, int pageSize)
    {
        var (orders, totalCount) = await _orderRepository.GetAllOrdersAsync(status, userId, page, pageSize);
        
        var dtos = orders.Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<OrderDto>(dtos, totalCount, page, pageSize, totalPages);
    }

    public async Task<Result<OrderDto>> GetOrderByIdAsync(Guid id)
    {
        var order = await _orderRepository.GetByIdWithItemsAsync(id);
        
        if (order == null)
        {
            return new NotFoundError($"Order with ID {id} not found");
        }

        return MapToDto(order);
    }

    public async Task<Result<OrderDto>> CreateOrderAsync(Guid userId, CreateOrderRequest request)
    {
        // Validate and reserve inventory
        var orderItems = new List<OrderItem>();
        decimal totalAmount = 0;

        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            
            if (product == null)
            {
                return new NotFoundError($"Product with ID {item.ProductId} not found");
            }

            if (product.StockQuantity < item.Quantity)
            {
                return new InsufficientStockError(
                    $"Insufficient stock for product {product.Name}",
                    product.Id,
                    item.Quantity,
                    product.StockQuantity);
            }

            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                TotalPrice = product.Price * item.Quantity
            };

            orderItems.Add(orderItem);
            totalAmount += orderItem.TotalPrice;

            // Reserve inventory
            product.StockQuantity -= item.Quantity;
            await _productRepository.UpdateAsync(product);
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = OrderStatus.Pending,
            TotalAmount = totalAmount,
            ShippingAddress = request.ShippingAddress,
            Notes = request.Notes,
            Items = orderItems,
            CreatedAt = DateTime.UtcNow
        };

        await _orderRepository.AddAsync(order);
        
        _logger.LogInformation(
            "Created order {OrderId} for user {UserId} with {ItemCount} items, total: {Total}",
            order.Id, userId, orderItems.Count, totalAmount);

        return MapToDto(order);
    }

    public async Task<Result<OrderDto>> UpdateOrderStatusAsync(Guid id, OrderStatus newStatus)
    {
        var order = await _orderRepository.GetByIdWithItemsAsync(id);
        
        if (order == null)
        {
            return new NotFoundError($"Order with ID {id} not found");
        }

        // Validate state transition
        if (!IsValidStatusTransition(order.Status, newStatus))
        {
            return new InvalidStateTransitionError(
                $"Cannot transition from {order.Status} to {newStatus}",
                order.Status.ToString(),
                newStatus.ToString());
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order);
        
        _logger.LogInformation("Updated order {OrderId} status to {Status}", id, newStatus);

        return MapToDto(order);
    }

    public async Task<Result<OrderDto>> CancelOrderAsync(Guid id)
    {
        var order = await _orderRepository.GetByIdWithItemsAsync(id);
        
        if (order == null)
        {
            return new NotFoundError($"Order with ID {id} not found");
        }

        if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Delivered)
        {
            return new InvalidStateTransitionError(
                "Cannot cancel an order that has been shipped or delivered",
                order.Status.ToString(),
                OrderStatus.Cancelled.ToString());
        }

        // Restore inventory
        foreach (var item in order.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product != null)
            {
                product.StockQuantity += item.Quantity;
                await _productRepository.UpdateAsync(product);
            }
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        await _orderRepository.UpdateAsync(order);
        
        _logger.LogInformation("Cancelled order {OrderId}", id);

        return MapToDto(order);
    }

    private static bool IsValidStatusTransition(OrderStatus current, OrderStatus next)
    {
        return (current, next) switch
        {
            (OrderStatus.Pending, OrderStatus.Confirmed) => true,
            (OrderStatus.Pending, OrderStatus.Cancelled) => true,
            (OrderStatus.Confirmed, OrderStatus.Processing) => true,
            (OrderStatus.Confirmed, OrderStatus.Cancelled) => true,
            (OrderStatus.Processing, OrderStatus.Shipped) => true,
            (OrderStatus.Shipped, OrderStatus.Delivered) => true,
            _ => false
        };
    }

    private static OrderDto MapToDto(Order order) => new(
        order.Id,
        order.UserId,
        order.Status,
        order.TotalAmount,
        order.ShippingAddress,
        order.Items.Select(i => new OrderItemDto(
            i.ProductId,
            i.Product?.Name ?? "Unknown",
            i.Quantity,
            i.UnitPrice,
            i.TotalPrice)).ToList(),
        order.CreatedAt);
}
