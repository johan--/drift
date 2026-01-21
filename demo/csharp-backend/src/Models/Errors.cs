namespace DemoApi.Models;

/// <summary>
/// Base error class for domain errors
/// </summary>
public abstract record Error(string Message);

/// <summary>
/// Resource not found error
/// </summary>
public record NotFoundError(string Message) : Error(Message);

/// <summary>
/// Validation error with field-level details
/// </summary>
public record ValidationError(string Message, Dictionary<string, string[]> Errors) : Error(Message);

/// <summary>
/// Conflict error (e.g., duplicate resource)
/// </summary>
public record ConflictError(string Message) : Error(Message);

/// <summary>
/// Authentication error
/// </summary>
public record AuthenticationError(string Message) : Error(Message);

/// <summary>
/// Authorization error
/// </summary>
public record AuthorizationError(string Message) : Error(Message);

/// <summary>
/// Insufficient stock error for inventory operations
/// </summary>
public record InsufficientStockError(string Message, Guid ProductId, int RequestedQuantity, int AvailableQuantity) 
    : Error(Message);

/// <summary>
/// Invalid state transition error
/// </summary>
public record InvalidStateTransitionError(string Message, string CurrentState, string RequestedState) 
    : Error(Message);

/// <summary>
/// Result type for operations that can fail
/// </summary>
/// <typeparam name="T">Success value type</typeparam>
public class Result<T>
{
    private readonly T? _value;
    private readonly Error? _error;

    private Result(T value)
    {
        _value = value;
        IsSuccess = true;
    }

    private Result(Error error)
    {
        _error = error;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    
    public T Value => IsSuccess 
        ? _value! 
        : throw new InvalidOperationException("Cannot access value of failed result");
    
    public Error Error => !IsSuccess 
        ? _error! 
        : throw new InvalidOperationException("Cannot access error of successful result");

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<Error, TResult> onFailure)
        => IsSuccess ? onSuccess(_value!) : onFailure(_error!);

    public static implicit operator Result<T>(T value) => Success(value);
    public static implicit operator Result<T>(Error error) => Failure(error);
}

/// <summary>
/// Unit type for void results
/// </summary>
public readonly struct Unit
{
    public static readonly Unit Value = new();
}
