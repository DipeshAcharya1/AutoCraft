using BackendApi.Data;
using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public SalesController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET /api/sales — all invoices (paginated on frontend)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _context.SalesInvoices
                .Include(s => s.Customer)
                .Include(s => s.Vehicle)
                .Include(s => s.Items).ThenInclude(i => i.Part)
                .OrderByDescending(s => s.SaleDate)
                .Select(s => new
                {
                    s.Id, s.InvoiceNumber, s.SaleDate, s.TotalAmount, s.Status, s.EmailSent, s.Notes,
                    Customer = new { s.Customer!.Id, s.Customer.Username, s.Customer.Email, s.Customer.PhoneNumber },
                    Vehicle = s.Vehicle == null ? null : new { s.Vehicle.Id, s.Vehicle.VehicleNumber, s.Vehicle.Make, s.Vehicle.Model },
                    Items = s.Items.Select(i => new { i.Id, i.PartId, PartName = i.Part!.Name, i.Quantity, i.UnitPrice })
                })
                .ToListAsync();

            return Ok(invoices);
        }

        // GET /api/sales/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(s => s.Customer)
                .Include(s => s.Vehicle)
                .Include(s => s.Staff)
                .Include(s => s.Items).ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (invoice == null) return NotFound("Invoice not found.");
            return Ok(invoice);
        }

        // POST /api/sales — create sales invoice (deducts stock)
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateSalesInvoiceDto dto)
        {
            if (await _context.SalesInvoices.AnyAsync(s => s.InvoiceNumber == dto.InvoiceNumber))
                return BadRequest("An invoice with this number already exists.");

            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest("Invoice must contain at least one item.");

            var customer = await _context.Users.FindAsync(dto.CustomerId);
            if (customer == null || customer.Role != UserRoles.Customer)
                return BadRequest("Invalid customer ID.");

            // Get staff ID from JWT
            var staffIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int? staffId = staffIdClaim != null ? int.Parse(staffIdClaim) : null;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var invoice = new SalesInvoice
                {
                    InvoiceNumber = dto.InvoiceNumber,
                    CustomerId = dto.CustomerId,
                    VehicleId = dto.VehicleId,
                    StaffId = staffId,
                    Notes = dto.Notes,
                    SaleDate = DateTime.UtcNow
                };

                decimal total = 0;

                foreach (var itemDto in dto.Items)
                {
                    var part = await _context.Parts.FindAsync(itemDto.PartId);
                    if (part == null) return BadRequest($"Part ID {itemDto.PartId} not found.");

                    // Enforce admin-fixed price on server-side (ignore client-sent unitPrice)
                    var unitPrice = part.Price;
                    if (unitPrice <= 0)
                        return BadRequest($"Price for part '{part.Name}' has not been set by admin.");

                    if (part.StockQuantity < itemDto.Quantity)
                        return BadRequest($"Insufficient stock for '{part.Name}'. Available: {part.StockQuantity}");

                    part.StockQuantity -= itemDto.Quantity;

                    invoice.Items.Add(new SalesInvoiceItem
                    {
                        PartId = itemDto.PartId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = unitPrice
                    });

                    total += itemDto.Quantity * unitPrice;
                }

                invoice.Subtotal = total;

                // ── Loyalty Program: 10% discount if single purchase > 5000 ──
                if (total > 5000)
                {
                    invoice.DiscountPercent = 10;
                    invoice.DiscountAmount = Math.Round(total * 0.10m, 2);
                    total -= invoice.DiscountAmount;
                }

                invoice.TotalAmount = total;
                _context.SalesInvoices.Add(invoice);
                await _context.SaveChangesAsync();

                // ── Auto-notify admin for parts with stock < 10 ──
                foreach (var itemDto in dto.Items)
                {
                    var partAfterSale = await _context.Parts.FindAsync(itemDto.PartId);
                    if (partAfterSale != null && partAfterSale.StockQuantity < 10)
                    {
                        // Avoid duplicate unread notifications for same part
                        bool alreadyNotified = await _context.Notifications
                            .AnyAsync(n => n.Type == NotificationType.LowStock
                                       && n.RelatedId == partAfterSale.Id
                                       && !n.IsRead);
                        if (!alreadyNotified)
                        {
                            _context.Notifications.Add(new Notification
                            {
                                Type = NotificationType.LowStock,
                                Message = $"Low stock alert: '{partAfterSale.Name}' (#{partAfterSale.PartNumber}) has only {partAfterSale.StockQuantity} unit(s) remaining.",
                                RelatedId = partAfterSale.Id
                            });
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    Message = "Sales invoice created.",
                    InvoiceId = invoice.Id,
                    Subtotal = invoice.Subtotal,
                    DiscountPercent = invoice.DiscountPercent,
                    DiscountAmount = invoice.DiscountAmount,
                    TotalAmount = invoice.TotalAmount,
                    LoyaltyApplied = invoice.DiscountPercent > 0
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "Error creating invoice.");
            }
        }

        // PUT /api/sales/{id}/status — update paid/unpaid/pending
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateInvoiceStatusDto dto)
        {
            var invoice = await _context.SalesInvoices.FindAsync(id);
            if (invoice == null) return NotFound("Invoice not found.");

            var allowed = new[] { InvoiceStatus.Paid, InvoiceStatus.Unpaid, InvoiceStatus.Pending };
            if (!allowed.Contains(dto.Status))
                return BadRequest("Invalid status. Use Paid, Unpaid, or Pending.");

            invoice.Status = dto.Status;
            await _context.SaveChangesAsync();
            return Ok(new { invoice.Id, invoice.Status });
        }

        // POST /api/sales/{id}/send-email — send real invoice via SMTP
        [HttpPost("{id}/send-email")]
        public async Task<IActionResult> SendEmail(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(s => s.Customer)
                .Include(s => s.Items).ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (invoice == null) return NotFound("Invoice not found.");
            if (invoice.Customer == null || string.IsNullOrWhiteSpace(invoice.Customer.Email))
            {
                return BadRequest(new { Message = "Customer email is missing for this invoice." });
            }

            try
            {
                // Generate a beautiful premium-styled responsive HTML email invoice template
                var itemsRowsHtml = new System.Text.StringBuilder();
                foreach (var item in invoice.Items)
                {
                    itemsRowsHtml.Append($@"
                        <tr>
                            <td style=""padding: 12px; border-bottom: 1px solid #e0e0e0; color: #333333; font-weight: 500;"">{item.Part?.Name ?? "Unknown Part"}</td>
                            <td style=""padding: 12px; border-bottom: 1px solid #e0e0e0; color: #555555; text-align: center;"">{item.Quantity}</td>
                            <td style=""padding: 12px; border-bottom: 1px solid #e0e0e0; color: #555555; text-align: right;"">${item.UnitPrice:F2}</td>
                            <td style=""padding: 12px; border-bottom: 1px solid #e0e0e0; color: #333333; text-align: right; font-weight: 700;"">${(item.Quantity * item.UnitPrice):F2}</td>
                        </tr>");
                }

                string loyaltySavingsSection = "";
                if (invoice.DiscountPercent > 0)
                {
                    loyaltySavingsSection = $@"
                        <tr style=""background-color: #f0fdf4;"">
                            <td colspan=""3"" style=""padding: 12px; text-align: right; color: #166534; font-weight: bold;"">Loyalty Program Discount ({invoice.DiscountPercent}%):</td>
                            <td style=""padding: 12px; text-align: right; color: #166534; font-weight: bold;"">-${invoice.DiscountAmount:F2}</td>
                        </tr>";
                }

                var htmlContent = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset=""utf-8"">
                        <style>
                            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
                            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e8e8e8; }}
                            .header {{ background: linear-gradient(135deg, #1e1e24 0%, #121214 100%); padding: 35px 25px; text-align: center; border-bottom: 4px solid #d61f2c; }}
                            .header h1 {{ color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }}
                            .header p {{ color: #a0a0ab; margin: 5px 0 0; font-size: 13px; font-weight: 500; }}
                            .content {{ padding: 30px 25px; }}
                            .greeting {{ font-size: 16px; color: #333333; margin-bottom: 20px; font-weight: bold; }}
                            .details-table {{ width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; }}
                            .details-table th {{ background-color: #f4f4f7; padding: 12px; color: #555555; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e2e6; }}
                            .summary-card {{ background-color: #fafafa; border: 1px solid #ededed; border-radius: 12px; padding: 20px; margin-top: 25px; }}
                            .summary-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #555555; }}
                            .summary-total {{ display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #e2e2e6; font-size: 18px; font-weight: 800; color: #d61f2c; }}
                            .footer {{ background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #7f7f8d; border-top: 1px solid #ededed; }}
                            .status-paid {{ color: #22c55e; font-weight: bold; text-transform: uppercase; border: 1px solid #22c55e; padding: 2px 8px; border-radius: 4px; display: inline-block; font-size: 11px; }}
                            .status-unpaid {{ color: #ef4444; font-weight: bold; text-transform: uppercase; border: 1px solid #ef4444; padding: 2px 8px; border-radius: 4px; display: inline-block; font-size: 11px; }}
                        </style>
                    </head>
                    <body>
                        <div class=""container"">
                            <div class=""header"">
                                <h1>AutoCraft Garage</h1>
                                <p>OFFICIAL DIGITAL INVOICE</p>
                            </div>
                            <div class=""content"">
                                <div class=""greeting"">Hello {invoice.Customer?.Username ?? "Valued Customer"},</div>
                                <p style=""color: #555555; font-size: 14px; line-height: 1.6; margin: 0;"">
                                    Thank you for choosing AutoCraft Garage for your mechanical and parts services. Your invoice <strong>#{invoice.InvoiceNumber}</strong> has been compiled and is details are listed below:
                                </p>
                                
                                <div style=""margin: 20px 0; font-size: 13px; color: #777777;"">
                                    <strong>Billing Date:</strong> {invoice.SaleDate.ToLocalTime():yyyy-MM-dd HH:mm}<br/>
                                    <strong>Invoice Status:</strong> <span class=""{(invoice.Status == "Paid" ? "status-paid" : "status-unpaid")}"">{invoice.Status}</span>
                                </div>

                                <table class=""details-table"">
                                    <thead>
                                        <tr>
                                            <th style=""border-bottom: 2px solid #e2e2e6;"">Part Description</th>
                                            <th style=""text-align: center; border-bottom: 2px solid #e2e2e6;"">Qty</th>
                                            <th style=""text-align: right; border-bottom: 2px solid #e2e2e6;"">Unit Price</th>
                                            <th style=""text-align: right; border-bottom: 2px solid #e2e2e6;"">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsRowsHtml}
                                        <tr>
                                            <td colspan=""3"" style=""padding: 12px; text-align: right; color: #555555; font-weight: bold; border-top: 2px solid #e2e2e6;"">Subtotal:</td>
                                            <td style=""padding: 12px; text-align: right; color: #333333; font-weight: bold; border-top: 2px solid #e2e2e6;"">${invoice.Subtotal:F2}</td>
                                        </tr>
                                        {loyaltySavingsSection}
                                        <tr style=""border-top: 2px dashed #e2e2e6; background-color: #fafafa;"">
                                            <td colspan=""3"" style=""padding: 14px; text-align: right; color: #d61f2c; font-size: 18px; font-weight: 800;"">Total Amount Paid:</td>
                                            <td style=""padding: 14px; text-align: right; color: #d61f2c; font-size: 18px; font-weight: 800;"">${invoice.TotalAmount:F2}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {(string.IsNullOrWhiteSpace(invoice.Notes) ? "" : $@"
                                    <div style=""background-color: #fdf2f2; border-left: 4px solid #d61f2c; padding: 15px; border-radius: 4px; margin-top: 20px;"">
                                        <strong style=""color: #d61f2c; font-size: 13px; display: block; margin-bottom: 4px;"">TECHNICIAN REMARKS:</strong>
                                        <span style=""font-size: 13px; color: #555555; line-height: 1.5; font-style: italic;"">""{invoice.Notes}""</span>
                                    </div>")}

                            </div>
                            <div class=""footer"">
                                <strong style=""color: #333333;"">AutoCraft Garage Ltd.</strong><br/>
                                100 Main Motorway, Automotive Plaza<br/>
                                Support Contact: support@autocraft.com | +1 800-GARAGE
                            </div>
                        </div>
                    </body>
                    </html>";

                // Dispatch the real email using the configured SMTP server and App password
                await _emailService.SendEmailAsync(
                    invoice.Customer!.Email, 
                    $"AutoCraft Garage Invoice Receipt - #{invoice.InvoiceNumber}", 
                    htmlContent
                );

                invoice.EmailSent = true;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = $"Invoice #{invoice.InvoiceNumber} successfully dispatched via email to {invoice.Customer!.Email}.",
                    EmailSent = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Email delivery failed: {ex.Message}" });
            }
        }

        // ───── REPORTS ─────

        // GET /api/sales/reports/summary
        [HttpGet("reports/summary")]
        public async Task<IActionResult> Summary()
        {
            var total = await _context.SalesInvoices.SumAsync(s => s.TotalAmount);
            var paid = await _context.SalesInvoices.Where(s => s.Status == InvoiceStatus.Paid).SumAsync(s => s.TotalAmount);
            var pending = await _context.SalesInvoices.Where(s => s.Status != InvoiceStatus.Paid).SumAsync(s => s.TotalAmount);
            var count = await _context.SalesInvoices.CountAsync();

            return Ok(new { TotalRevenue = total, PaidAmount = paid, PendingAmount = pending, InvoiceCount = count });
        }

        // GET /api/sales/reports/regulars — customers with 3+ invoices
        [HttpGet("reports/regulars")]
        public async Task<IActionResult> Regulars()
        {
            var regulars = await _context.SalesInvoices
                .GroupBy(s => s.CustomerId)
                .Where(g => g.Count() >= 3)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    InvoiceCount = g.Count(),
                    TotalSpent = g.Sum(s => s.TotalAmount)
                })
                .OrderByDescending(r => r.InvoiceCount)
                .ToListAsync();

            var customerIds = regulars.Select(r => r.CustomerId).ToList();
            var customers = await _context.Users
                .Where(u => customerIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var result = regulars.Select(r => new
            {
                r.CustomerId,
                CustomerName = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].Username : "Unknown",
                CustomerEmail = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].Email : "",
                CustomerPhone = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].PhoneNumber : "",
                r.InvoiceCount,
                r.TotalSpent
            });

            return Ok(result);
        }

        // GET /api/sales/reports/high-spenders — top customers by total spend
        [HttpGet("reports/high-spenders")]
        public async Task<IActionResult> HighSpenders()
        {
            var spenders = await _context.SalesInvoices
                .GroupBy(s => s.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    TotalSpent = g.Sum(s => s.TotalAmount),
                    InvoiceCount = g.Count()
                })
                .OrderByDescending(r => r.TotalSpent)
                .Take(20)
                .ToListAsync();

            var customerIds = spenders.Select(r => r.CustomerId).ToList();
            var customers = await _context.Users
                .Where(u => customerIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var result = spenders.Select(r => new
            {
                r.CustomerId,
                CustomerName = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].Username : "Unknown",
                CustomerEmail = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].Email : "",
                CustomerPhone = customers.ContainsKey(r.CustomerId) ? customers[r.CustomerId].PhoneNumber : "",
                r.TotalSpent,
                r.InvoiceCount
            });

            return Ok(result);
        }

        // GET /api/sales/reports/pending-credits — unpaid/pending invoices
        [HttpGet("reports/pending-credits")]
        public async Task<IActionResult> PendingCredits()
        {
            var pending = await _context.SalesInvoices
                .Where(s => s.Status != InvoiceStatus.Paid)
                .Include(s => s.Customer)
                .Include(s => s.Vehicle)
                .OrderByDescending(s => s.SaleDate)
                .Select(s => new
                {
                    s.Id, s.InvoiceNumber, s.SaleDate, s.TotalAmount, s.Status,
                    Customer = new { s.Customer!.Username, s.Customer.Email, s.Customer.PhoneNumber },
                    Vehicle = s.Vehicle == null ? null : new { s.Vehicle.VehicleNumber, s.Vehicle.Make, s.Vehicle.Model }
                })
                .ToListAsync();

            return Ok(pending);
        }

        // GET /api/sales/reports/financial — daily, monthly, yearly reports (Admin Only)
        [HttpGet("reports/financial")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetFinancialReport(
            [FromQuery] string period = "monthly", 
            [FromQuery] int? year = null, 
            [FromQuery] int? month = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var targetMonth = month ?? DateTime.UtcNow.Month;

            var invoicesQuery = _context.SalesInvoices.AsQueryable();

            if (period.Equals("daily", StringComparison.OrdinalIgnoreCase))
            {
                var invoices = await invoicesQuery
                    .Where(s => s.SaleDate.Year == targetYear && s.SaleDate.Month == targetMonth)
                    .ToListAsync();

                var dailyData = invoices
                    .GroupBy(s => s.SaleDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Revenue = g.Sum(s => s.TotalAmount),
                        Discount = g.Sum(s => s.DiscountAmount),
                        Count = g.Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                return Ok(new { Period = "daily", Year = targetYear, Month = targetMonth, Data = dailyData });
            }
            else if (period.Equals("yearly", StringComparison.OrdinalIgnoreCase))
            {
                var invoices = await invoicesQuery.ToListAsync();

                var yearlyData = invoices
                    .GroupBy(s => s.SaleDate.Year)
                    .Select(g => new
                    {
                        Year = g.Key,
                        Revenue = g.Sum(s => s.TotalAmount),
                        Discount = g.Sum(s => s.DiscountAmount),
                        Count = g.Count()
                    })
                    .OrderBy(y => y.Year)
                    .ToList();

                return Ok(new { Period = "yearly", Data = yearlyData });
            }
            else
            {
                var invoices = await invoicesQuery
                    .Where(s => s.SaleDate.Year == targetYear)
                    .ToListAsync();

                var monthlyData = invoices
                    .GroupBy(s => s.SaleDate.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        MonthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(g.Key),
                        Revenue = g.Sum(s => s.TotalAmount),
                        Discount = g.Sum(s => s.DiscountAmount),
                        Count = g.Count()
                    })
                    .OrderBy(m => m.Month)
                    .ToList();

                return Ok(new { Period = "monthly", Year = targetYear, Data = monthlyData });
            }
        }
    }
}
