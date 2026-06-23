using BackendApi.Data;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services
{
    /// <summary>
    /// Runs on startup and every hour to:
    /// 1. Create LowStock notifications for parts with StockQuantity < 10
    /// 2. Create OverdueReminder notifications for unpaid invoices older than 30 days
    /// </summary>
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationBackgroundService> _logger;
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1);

        public NotificationBackgroundService(IServiceScopeFactory scopeFactory, ILogger<NotificationBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[Notifications] Background service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                await RunChecksAsync();
                await Task.Delay(CheckInterval, stoppingToken);
            }
        }

        private async Task RunChecksAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await CheckLowStockAsync(db);
            await CheckOverdueInvoicesAsync(db);
        }

        private async Task CheckLowStockAsync(AppDbContext db)
        {
            try
            {
                var lowStockParts = await db.Parts
                    .Where(p => p.StockQuantity < 10)
                    .ToListAsync();

                foreach (var part in lowStockParts)
                {
                    // Avoid duplicate notifications: skip if unread one already exists for this part today
                    var existsToday = await db.Notifications.AnyAsync(n =>
                        n.Type == NotificationType.LowStock &&
                        n.RelatedId == part.Id &&
                        !n.IsRead &&
                        n.CreatedAt.Date == DateTime.UtcNow.Date);

                    if (!existsToday)
                    {
                        db.Notifications.Add(new Notification
                        {
                            Type = NotificationType.LowStock,
                            Message = $"Low stock alert: '{part.Name}' (Part #{part.PartNumber}) has only {part.StockQuantity} units remaining.",
                            RelatedId = part.Id
                        });
                        _logger.LogInformation("[Notifications] Low stock notification created for: {PartName}", part.Name);
                    }
                }

                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Notifications] Error checking low stock.");
            }
        }

        private async Task CheckOverdueInvoicesAsync(AppDbContext db)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-30);

                var overdueInvoices = await db.SalesInvoices
                    .Include(s => s.Customer)
                    .Where(s => s.Status != InvoiceStatus.Paid && s.SaleDate < cutoffDate && !s.ReminderSent)
                    .ToListAsync();

                foreach (var invoice in overdueInvoices)
                {
                    // Mark reminder as sent
                    invoice.ReminderSent = true;

                    // Create admin notification
                    db.Notifications.Add(new Notification
                    {
                        Type = NotificationType.OverdueReminder,
                        Message = $"Overdue invoice: #{invoice.InvoiceNumber} for customer '{invoice.Customer?.Username}' ({invoice.Customer?.Email}) — ${invoice.TotalAmount:F2} unpaid for over 30 days.",
                        RelatedId = invoice.Id
                    });

                    _logger.LogInformation("[Notifications] Overdue reminder created for invoice: {InvoiceNumber}", invoice.InvoiceNumber);
                }

                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Notifications] Error checking overdue invoices.");
            }
        }
    }
}
