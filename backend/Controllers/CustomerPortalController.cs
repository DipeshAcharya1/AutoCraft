using BackendApi.Data;
using BackendApi.DTOs;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;

namespace BackendApi.Controllers
{
    /// <summary>
    /// Customer self-service portal: profile, vehicles, history, appointments,
    /// part requests, service reviews, and spending stats.
    /// Note: Appointments and Part Requests also have dedicated controllers
    /// (AppointmentsController, PartRequestsController) for shared access.
    /// </summary>
    [Route("api/customer-portal")]
    [ApiController]
    [Authorize(Roles = UserRoles.Customer)]
    public class CustomerPortalController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CustomerPortalController(AppDbContext context) => _context = context;
        private static string NormalizeVehicleNumber(string value) => value.Trim().ToUpperInvariant();

        private int GetCustomerId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ── PROFILE ──────────────────────────────────────────────

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var id = GetCustomerId();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            var vehicles = await _context.Vehicles.Where(v => v.CustomerId == id).ToListAsync();
            return Ok(new { user.Id, user.Username, user.Email, user.PhoneNumber, user.ProfilePictureUrl, Vehicles = vehicles });
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture([Required] IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
            
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only .jpg, .jpeg, .png, and .webp images are allowed.");
                
            if (file.Length > 2 * 1024 * 1024) // 2MB limit
                return BadRequest("Image size must be less than 2MB.");

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var fileBytes = ms.ToArray();
            var contentType = file.ContentType;
            var base64String = $"data:{contentType};base64,{Convert.ToBase64String(fileBytes)}";

            var id = GetCustomerId();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.ProfilePictureUrl = base64String;
            await _context.SaveChangesAsync();

            return Ok(new { ProfilePictureUrl = base64String });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var id = GetCustomerId();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return Unauthorized("Your session is invalid. Please log out and log back in.");

            // Check email uniqueness if changed
            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                    return BadRequest("Email is already in use by another account.");
                user.Email = dto.Email;
            }
            if (!string.IsNullOrWhiteSpace(dto.Username)) user.Username = dto.Username;
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) user.PhoneNumber = dto.PhoneNumber;

            await _context.SaveChangesAsync();
            return Ok(new { user.Username, user.Email, user.PhoneNumber });
        }

        [HttpDelete("profile")]
        public async Task<IActionResult> DeleteProfile()
        {
            var id = GetCustomerId();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return Unauthorized("Your session is invalid. Please log out and log back in.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Account deleted successfully." });
        }

        // ── VEHICLES ─────────────────────────────────────────────

        [HttpGet("vehicles")]
        public async Task<IActionResult> GetVehicles()
        {
            var vehicles = await _context.Vehicles.Where(v => v.CustomerId == GetCustomerId()).ToListAsync();
            return Ok(vehicles);
        }

        [HttpPost("vehicles")]
        public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleDto dto)
        {
            var customerId = GetCustomerId();
            var normalizedPlate = NormalizeVehicleNumber(dto.VehicleNumber);
            var duplicateExists = await _context.Vehicles
                .AnyAsync(v => v.CustomerId == customerId && v.VehicleNumber.Trim().ToUpper() == normalizedPlate);
            if (duplicateExists)
                return BadRequest("You already have a vehicle with this plate number.");

            var vehicle = new Vehicle
            {
                VehicleNumber = normalizedPlate, Make = dto.Make, Model = dto.Model,
                Year = dto.Year, Color = dto.Color, Notes = dto.Notes,
                CustomerId = customerId
            };
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return Ok(vehicle);
        }

        [HttpPut("vehicles/{id}")]
        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] CreateVehicleDto dto)
        {
            var customerId = GetCustomerId();
            var v = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == customerId);
            if (v == null) return NotFound();

            var normalizedPlate = NormalizeVehicleNumber(dto.VehicleNumber);
            var duplicateExists = await _context.Vehicles
                .AnyAsync(vh => vh.CustomerId == customerId && vh.Id != id && vh.VehicleNumber.Trim().ToUpper() == normalizedPlate);
            if (duplicateExists)
                return BadRequest("You already have a vehicle with this plate number.");

            v.VehicleNumber = normalizedPlate; v.Make = dto.Make; v.Model = dto.Model;
            v.Year = dto.Year; v.Color = dto.Color; v.Notes = dto.Notes;
            await _context.SaveChangesAsync();
            return Ok(v);
        }

        [HttpDelete("vehicles/{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var v = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == GetCustomerId());
            if (v == null) return NotFound();
            _context.Vehicles.Remove(v);
            await _context.SaveChangesAsync();
            return Ok("Vehicle removed.");
        }

        // ── PURCHASE / SERVICE HISTORY ────────────────────────────

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var id = GetCustomerId();
            var invoices = await _context.SalesInvoices
                .Where(s => s.CustomerId == id)
                .Include(s => s.Vehicle)
                .Include(s => s.Items).ThenInclude(i => i.Part)
                .OrderByDescending(s => s.SaleDate)
                .Select(s => new
                {
                    s.Id, s.InvoiceNumber, s.SaleDate, s.Subtotal,
                    s.DiscountPercent, s.DiscountAmount, s.TotalAmount,
                    s.Status, s.Notes,
                    LoyaltyApplied = s.DiscountPercent > 0,
                    Vehicle = s.Vehicle == null ? null : new { s.Vehicle.VehicleNumber, s.Vehicle.Make, s.Vehicle.Model },
                    Items = s.Items.Select(i => new { PartName = i.Part!.Name, i.Quantity, i.UnitPrice, LineTotal = i.Quantity * i.UnitPrice })
                })
                .ToListAsync();

            return Ok(invoices);
        }

        // ── SPENDING STATS + LOYALTY ──────────────────────────────

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var id = GetCustomerId();
            var invoices = await _context.SalesInvoices.Where(s => s.CustomerId == id).ToListAsync();

            var totalSpent = invoices.Sum(i => i.TotalAmount);
            var invoiceCount = invoices.Count;
            var loyaltyDiscounts = invoices.Where(i => i.DiscountPercent > 0).Sum(i => i.DiscountAmount);
            var unpaidAmount = invoices.Where(i => i.Status != InvoiceStatus.Paid).Sum(i => i.TotalAmount);

            return Ok(new
            {
                TotalSpent = totalSpent,
                InvoiceCount = invoiceCount,
                LoyaltySavings = loyaltyDiscounts,
                UnpaidAmount = unpaidAmount
            });
        }

        // ── SERVICE REVIEWS ───────────────────────────────────────

        [HttpGet("reviews")]
        public async Task<IActionResult> GetMyReviews()
        {
            var reviews = await _context.ServiceReviews
                .Where(r => r.CustomerId == GetCustomerId())
                .OrderByDescending(r => r.ReviewedAt)
                .ToListAsync();
            return Ok(reviews);
        }

        [HttpPost("reviews")]
        public async Task<IActionResult> SubmitReview([FromBody] CreateReviewDto dto)
        {
            var id = GetCustomerId();
            var userExists = await _context.Users.AnyAsync(u => u.Id == id);
            if (!userExists) return Unauthorized("Your session is invalid (account was deleted or database reset). Please log out and log back in.");

            if (dto.Rating < 1 || dto.Rating > 5) return BadRequest("Rating must be 1–5.");
            if (dto.SalesInvoiceId.HasValue)
            {
                var inv = await _context.SalesInvoices.FindAsync(dto.SalesInvoiceId.Value);
                if (inv == null || inv.CustomerId != id) return BadRequest("Invalid invoice.");
            }
            var review = new ServiceReview
            {
                CustomerId = id, Rating = dto.Rating, Comment = dto.Comment,
                SalesInvoiceId = dto.SalesInvoiceId
            };
            _context.ServiceReviews.Add(review);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Review submitted. Thank you!", ReviewId = review.Id });
        }
    }

    // ── DTOs (customer-portal specific) ───────────────────────────
    public class UpdateProfileDto
    {
        [StringLength(100, MinimumLength = 3)]
        public string? Username { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [Phone]
        [StringLength(30)]
        public string? PhoneNumber { get; set; }
    }

    public class CreateReviewDto
    {
        public int? SalesInvoiceId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 5)]
        public required string Comment { get; set; }
    }
}
