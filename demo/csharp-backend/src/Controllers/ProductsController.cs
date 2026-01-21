using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DemoApi.Models;
using DemoApi.Services;
using System.ComponentModel.DataAnnotations;

namespace DemoApi.Controllers;

/// <summary>
/// Controller for product management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all products with optional filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        _logger.LogInformation(
            "Getting products - Category: {Category}, Price: {MinPrice}-{MaxPrice}, Page: {Page}",
            category, minPrice, maxPrice, page);

        var filter = new ProductFilter(category, minPrice, maxPrice);
        var result = await _productService.GetProductsAsync(filter, page, pageSize);
        
        return Ok(result);
    }

    /// <summary>
    /// Gets a product by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        var result = await _productService.GetProductByIdAsync(id);
        
        return result.Match<ActionResult<ProductDto>>(
            product => Ok(product),
            error => NotFound(new { message = error.Message }));
    }

    /// <summary>
    /// Creates a new product
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Creating product: {ProductName}", request.Name);
        
        var result = await _productService.CreateProductAsync(request);
        
        return result.Match<ActionResult<ProductDto>>(
            product => CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product),
            error => BadRequest(new { message = error.Message }));
    }

    /// <summary>
    /// Updates product inventory
    /// </summary>
    [HttpPatch("{id:guid}/inventory")]
    [Authorize(Roles = "Admin,Manager,Inventory")]
    public async Task<ActionResult<ProductDto>> UpdateInventory(
        Guid id,
        [FromBody] UpdateInventoryRequest request)
    {
        _logger.LogInformation("Updating inventory for product {ProductId}: {Quantity}", id, request.Quantity);
        
        var result = await _productService.UpdateInventoryAsync(id, request.Quantity);
        
        return result.Match<ActionResult<ProductDto>>(
            product => Ok(product),
            error => error switch
            {
                NotFoundError => NotFound(new { message = error.Message }),
                ValidationError ve => BadRequest(new { message = ve.Message }),
                _ => BadRequest(new { message = error.Message })
            });
    }

    /// <summary>
    /// Deletes a product
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        _logger.LogWarning("Deleting product {ProductId}", id);
        
        var result = await _productService.DeleteProductAsync(id);
        
        return result.Match<IActionResult>(
            _ => NoContent(),
            error => NotFound(new { message = error.Message }));
    }
}

public record CreateProductRequest(
    [Required][MinLength(1)] string Name,
    string? Description,
    [Required][Range(0.01, double.MaxValue)] decimal Price,
    [Required] string Category,
    [Range(0, int.MaxValue)] int InitialStock = 0);

public record UpdateInventoryRequest([Required][Range(0, int.MaxValue)] int Quantity);

public record ProductFilter(string? Category, decimal? MinPrice, decimal? MaxPrice);
