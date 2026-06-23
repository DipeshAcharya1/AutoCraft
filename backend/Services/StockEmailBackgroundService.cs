using BackendApi.Data;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BackendApi.Services
{
    public class StockEmailBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<StockEmailBackgroundService> _logger;
        private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5);

        public StockEmailBackgroundService(IServiceScopeFactory scopeFactory, ILogger<StockEmailBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[StockEmail] Service started. Emails will be sent every 5 minutes.");

            while (!stoppingToken.IsCancellationRequested)
            {
                await SendStockEmailAsync();
                await Task.Delay(CheckInterval, stoppingToken);
            }
        }

        private async Task SendStockEmailAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var totalParts = await db.Parts.CountAsync();
                var outOfStockParts = await db.Parts.Where(p => p.StockQuantity == 0).ToListAsync();
                if (!outOfStockParts.Any())
                {
                    _logger.LogInformation("[StockEmail] No out-of-stock parts found; skipping email.");
                    return;
                }

                // Prefer sending to the configured Admin user from database, fall back to configuration
                var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRoles.Admin);
                var config = scope.ServiceProvider.GetService<IConfiguration>();
                var fallbackAdminEmail = config?["Admin:Email"] ?? config?["EmailSettings:SenderEmail"] ?? "admin@system.com";
                var toEmail = adminUser?.Email ?? fallbackAdminEmail;

                await emailService.SendEmailAsync(
                    toEmail: toEmail,
                    subject: "AutoCraft Garage - Out of Stock Alert",
                    htmlMessage: StockAlertReportBuilder.Build(totalParts, outOfStockParts)
                );

                _logger.LogInformation("[StockEmail] Successfully sent 5-minute stock alert email to {AdminEmail}.", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[StockEmail] Error sending stock report email.");
            }
        }
    }
}
