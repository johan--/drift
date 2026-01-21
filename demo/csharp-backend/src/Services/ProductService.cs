using DemoApi.Models;
using DemoApi.Controllers;

namespace DemoApi.Services;

/// <summary>
/// Product service interface
/// </summary>
public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(ProductFilter filter, int page, int pageSize);
    Task<Result<ProductDto>> GetProductByIdAsync(Guid id);
    Task<Result<ProductDto>> CreateProductAsync(CreateProductRequest request);
    Task<Result<ProductDto>> UpdateInventoryAsync(Guid id, int quantity);
    Task<Result<Unit>> DeleteProductAsync(Guid id);
}

/// <summary>
/// Product service implementation
/// </summary>
public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductFilter filter, int page, int pageSize)
    {
        var (products, totalCount) = await _productRepository.GetProductsAsync(filter, page, pageSize);
        
        var dtos = products.Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<ProductDto>(dtos, totalCount, page, pageSize, totalPages);
    }

    public async Task<Result<ProductDto>> GetProductByIdAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        
        if (product == null)
        {
            return new NotFoundError($"Product with ID {id} not found");
        }

        return MapToDto(product);
    }

    public async Task<Result<ProductDto>> CreateProductAsync(CreateProductRequest request)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Category = request.Category,
            StockQuantity = request.InitialStock,
            CreatedAt = DateTime.UtcNow
        };

        await _productRepository.AddAsync(product);
        
        _logger.LogInformation("Created product {ProductId}: {ProductName}", product.Id, product.Name);

        return MapToDto(product);
    }

    public async Task<Result<ProductDto>> UpdateInventoryAsync(Guid id, int quantity)
    {
        var product = await _productRepository.GetByIdAsync(id);
        
        if (product == null)
        {
            return new NotFoundError($"Product with ID {id} not found");
        }

        if (quantity < 0)
        {
            return new ValidationError("Invalid quantity", new Dictionary<string, string[]>
            {
                ["quantity"] = new[] { "Quantity cannot be negative" }
            });
        }

        product.StockQuantity = quantity;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product);
        
        _logger.LogInformation("Updated inventory for product {ProductId}: {Quantity}", id, quantity);

        return MapToDto(product);
    }

    public async Task<Result<Unit>> DeleteProductAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        
        if (product == null)
        {
            return new NotFoundError($"Product with ID {id} not found");
        }

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        
        await _productRepository.UpdateAsync(product);
        
        _logger.LogInformation("Soft deleted product {ProductId}", id);

        return Unit.Value;
    }

    private static ProductDto MapToDto(Product product) => new(
        product.Id,
        product.Name,
        product.Description,
        product.Price,
        product.Category,
        product.StockQuantity,
        product.StockQuantity > 0);
}
