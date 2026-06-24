using BackendApi.Data;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Controllers
{
    /// <summary>
    /// Admin/Staff: Notifications management + manual low-stock scan + overdue email reminders.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public NotificationsController(AppDbContext context) => _context = context;

        // GET /api/notifications
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false)
        {
            var query = _context.Notifications.AsQueryable();
            if (unreadOnly) query = query.Where(n => !n.IsRead);

            var list = await query.OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(list);
        }

        // GET /api/notifications/count
        [HttpGet("count")]
        public async Task<IActionResult> UnreadCount()
        {
            var count = await _context.Notifications.CountAsync(n => !n.IsRead);
            return Ok(new { UnreadCount = count });
        }

        // PUT /api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var n = await _context.Notifications.FindAsync(id);
            if (n == null) return NotFound();
            n.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok("Marked as read.");
        }

        // PUT /api/notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var unread = await _context.Notifications.Where(n => !n.IsRead).ToListAsync();
            unread.ForEach(n => n.IsRead = true);
            await _context.SaveChangesAsync();
            return Ok($"Marked {unread.Count} notifications as read.");
        }

        // POST /api/notifications/check-low-stock — manually scan for low stock (<10)
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost("check-low-stock")]
        public async Task<IActionResult> CheckLowStock()
        {
            var lowStockParts = await _context.Parts
                .Where(p => p.StockQuantity < 10)
                .ToListAsync();

            int created = 0;
            foreach (var part in lowStockParts)
            {
                bool alreadyNotified = await _context.Notifications
                    .AnyAsync(n => n.Type == NotificationType.LowStock
                               && n.RelatedId == part.Id
                               && !n.IsRead);
                if (!alreadyNotified)
                {
                    _context.Notifications.Add(new Notification
                    {
                        Type = NotificationType.LowStock,
                        Message = $"Low stock alert: '{part.Name}' (#{part.PartNumber}) — only {part.StockQuantity} unit(s) remaining.",
                        RelatedId = part.Id
                    });
                    created++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Message = $"Stock check complete. {created} new low-stock alert(s) created.",
                LowStockPartsCount = lowStockParts.Count,
                NewAlertsCreated = created
            });
        }

        // POST /api/notifications/send-overdue-reminders — simulate email for unpaid > 1 month
        [Authorize(Roles = UserRoles.Admin)]
        [HttpPost("send-overdue-reminders")]
        public async Task<IActionResult> SendOverdueReminders()
        {
            var cutoff = DateTime.UtcNow.AddMonths(-1);

            var overdueInvoices = await _context.SalesInvoices
                .Where(s => s.Status != InvoiceStatus.Paid && s.SaleDate < cutoff && !s.ReminderSent)
                .Include(s => s.Customer)
                .ToListAsync();

            foreach (var invoice in overdueInvoices)
            {
                invoice.ReminderSent = true;

                // In production: send real SMTP email here.
                // For now, log as a notification record to simulate the email.
                _context.Notifications.Add(new Notification
                {
                    Type = NotificationType.OverdueReminder,
                    Message = $"[Email Reminder] Sent to {invoice.Customer!.Email} — Invoice #{invoice.InvoiceNumber} " +
                              $"({invoice.TotalAmount:C}) unpaid since {invoice.SaleDate:yyyy-MM-dd}.",
                    RelatedId = invoice.Id
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                Message = $"Overdue reminders sent for {overdueInvoices.Count} invoice(s).",
                RemindersSent = overdueInvoices.Count
            });
        }
    }
}
