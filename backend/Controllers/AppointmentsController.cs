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
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AppointmentsController(AppDbContext context) => _context = context;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role)!;

        // GET /api/appointments — Staff/Admin: all; Customer: own
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var role = GetRole();
            var userId = GetUserId();

            var query = _context.Appointments
                .Include(a => a.Customer)
                .Include(a => a.Vehicle)
                .AsQueryable();

            if (role == UserRoles.Customer)
                query = query.Where(a => a.CustomerId == userId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            var list = await query.OrderByDescending(a => a.AppointmentDate)
                .Select(a => new
                {
                    a.Id, a.ServiceType, a.AppointmentDate, a.Status, a.Notes, a.StaffNotes, a.CreatedAt,
                    Customer = a.Customer == null ? null : new { a.Customer.Username, a.Customer.Email, a.Customer.PhoneNumber },
                    Vehicle = a.Vehicle == null ? null : new { a.Vehicle.VehicleNumber, a.Vehicle.Make, a.Vehicle.Model, a.Vehicle.Year }
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST /api/appointments — Customer books
        [HttpPost]
        [Authorize(Roles = UserRoles.Customer)]
        public async Task<IActionResult> Book([FromBody] BookAppointmentDto dto)
        {
            if (dto.AppointmentDate < DateTime.UtcNow.AddHours(1))
                return BadRequest("Appointment must be at least 1 hour from now.");

            var userId = GetUserId();
            if (dto.VehicleId.HasValue)
            {
                var v = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == dto.VehicleId && v.CustomerId == userId);
                if (v == null) return BadRequest("Invalid vehicle.");
            }

            var appointment = new Appointment
            {
                CustomerId = userId,
                VehicleId = dto.VehicleId,
                ServiceType = dto.ServiceType,
                AppointmentDate = dto.AppointmentDate.ToUniversalTime(),
                Notes = dto.Notes
            };

            _context.Appointments.Add(appointment);

            // Notify admin of new appointment request
            _context.Notifications.Add(new Notification
            {
                Type = NotificationType.General,
                Message = $"New appointment request: '{dto.ServiceType}' on {dto.AppointmentDate:yyyy-MM-dd HH:mm}."
            });

            await _context.SaveChangesAsync();
            return Ok(new { appointment.Id, appointment.Status, Message = "Appointment booked successfully." });
        }

        // PUT /api/appointments/{id}/status — Staff/Admin updates status + adds staff notes
        [HttpPut("{id}/status")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
        {
            var a = await _context.Appointments.FindAsync(id);
            if (a == null) return NotFound();

            var allowed = new[] { AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Completed, AppointmentStatus.Cancelled };
            if (!allowed.Contains(dto.Status)) return BadRequest("Invalid status.");

            a.Status = dto.Status;
            if (!string.IsNullOrEmpty(dto.StaffNotes)) a.StaffNotes = dto.StaffNotes;

            await _context.SaveChangesAsync();
            return Ok(new { a.Id, a.Status, a.StaffNotes });
        }

        // DELETE /api/appointments/{id} — Customer cancels own
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRoles.Customer)]
        public async Task<IActionResult> Cancel(int id)
        {
            var a = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.CustomerId == GetUserId());
            if (a == null) return NotFound();
            if (a.Status == AppointmentStatus.Completed) return BadRequest("Cannot cancel a completed appointment.");
            a.Status = AppointmentStatus.Cancelled;
            await _context.SaveChangesAsync();
            return Ok("Appointment cancelled.");
        }
    }

    public class BookAppointmentDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public required string ServiceType { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        public int? VehicleId { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentStatusDto
    {
        [Required]
        [StringLength(50)]
        public required string Status { get; set; }

        [StringLength(500)]
        public string? StaffNotes { get; set; }
    }
}
