using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BackendApi.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = HttpStatusCode.InternalServerError;
            var message = "Internal Server Error. Please contact support.";

            if (exception is InvalidOperationException invalidOp &&
                (invalidOp.Message.Contains("vehicle", StringComparison.OrdinalIgnoreCase) ||
                 invalidOp.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase)))
            {
                statusCode = HttpStatusCode.BadRequest;
                message = invalidOp.Message;
            }
            else if (exception is DbUpdateException dbUpdateEx &&
                     ((dbUpdateEx.InnerException?.Message?.Contains("IX_Vehicles_CustomerId_VehicleNumber", StringComparison.OrdinalIgnoreCase) ?? false) ||
                      dbUpdateEx.Message.Contains("IX_Vehicles_CustomerId_VehicleNumber", StringComparison.OrdinalIgnoreCase)))
            {
                statusCode = HttpStatusCode.BadRequest;
                message = "Duplicate vehicle numbers are not allowed for the same customer.";
            }

            context.Response.StatusCode = (int)statusCode;

            var response = new ExceptionResponse
            {
                StatusCode = context.Response.StatusCode,
                Message = message,
                Details = _env.IsDevelopment() ? exception.ToString() : null
            };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            return context.Response.WriteAsync(json);
        }
    }

    public class ExceptionResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
    }
}
