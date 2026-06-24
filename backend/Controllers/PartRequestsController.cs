using BackendApi.Data;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PartRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PartRequestsController(AppDbContext context) => _context = context;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        // GET — Staff/Admin: all; Customer: own
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var role = GetRole();
            var userId = GetUserId();

            var query = _context.PartRequests.Include(p => p.Customer).AsQueryable();
            if (role == UserRoles.Customer) query = query.Where(p => p.CustomerId == userId);

            var list = await query.OrderByDescending(p => p.RequestedAt)
                .Select(p => new
                {
                    p.Id, p.PartName, p.PartNumber, p.Description, p.Status, p.AdminNote, p.RequestedAt,
                    Customer = p.Customer == null ? null : new { p.Customer.Username, p.Customer.Email }
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST — Customer submits
        [HttpPost]
        [Authorize(Roles = UserRoles.Customer)]
        public async Task<IActionResult> Submit([FromBody] SubmitPartRequestDto dto)
        {
            var request = new PartRequest
            {
                CustomerId = GetUserId(),
                PartName = dto.PartName,
                PartNumber = dto.PartNumber,
                Description = dto.Description
            };
            _context.PartRequests.Add(request);
            await _context.SaveChangesAsync();

            // Also create an admin notification
            _context.Notifications.Add(new Notification
            {
                Type = NotificationType.PartRequest,
                Message = $"New part request: '{dto.PartName}' (#{dto.PartNumber ?? "N/A"}) from customer #{GetUserId()}.",
                RelatedId = request.Id
            });
            await _context.SaveChangesAsync();

            return Ok(new { request.Id, Message = "Part request submitted." });
        }

        // PUT /{id}/status — Staff/Admin updates
        [HttpPut("{id}/status")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePartRequestDto dto)
        {
            var req = await _context.PartRequests.FindAsync(id);
            if (req == null) return NotFound();
            req.Status = dto.Status;
            req.AdminNote = dto.AdminNote;
            await _context.SaveChangesAsync();
            return Ok(new { req.Id, req.Status, req.AdminNote });
        }

        // DELETE — Customer cancels (only if Pending)
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRoles.Customer)]
        public async Task<IActionResult> Cancel(int id)
        {
            var req = await _context.PartRequests.FirstOrDefaultAsync(p => p.Id == id && p.CustomerId == GetUserId());
            if (req == null) return NotFound();
            if (req.Status != PartRequestStatus.Pending) return BadRequest("Can only cancel pending requests.");
            _context.PartRequests.Remove(req);
            await _context.SaveChangesAsync();
            return Ok("Request cancelled.");
        }
    }

    public class SubmitPartRequestDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public required string PartName { get; set; }

        [StringLength(50)]
        public string? PartNumber { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }
    }

    public class UpdatePartRequestDto
    {
        [Required]
        [StringLength(50)]
        public required string Status { get; set; }

        [StringLength(500)]
        public string? AdminNote { get; set; }
    }
}
