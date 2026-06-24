using BackendApi.Data;
using BackendApi.DTOs;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = UserRoles.Admin)]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string DefaultStaffPassword = "Dipshan123@";

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // 1. View all customers and staffs
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role == UserRoles.Customer || u.Role == UserRoles.Staff)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.PhoneNumber,
                    u.Role,
                    u.IsActive
                })
                .ToListAsync();

            return Ok(users);
        }

        // 2. Create a new staff member
        [HttpPost("staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("A user with this email already exists.");
            }

            var newStaff = new User
            {
                Username = dto.Name,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Role = UserRoles.Staff,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultStaffPassword),
                IsActive = true
            };

            _context.Users.Add(newStaff);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Staff member created successfully.", Staff = new { newStaff.Id, newStaff.Username, newStaff.Email, newStaff.PhoneNumber, newStaff.Role, newStaff.IsActive } });
        }

        // 3. Toggle active/inactive status of customers and staff
        [HttpPut("users/{id}/toggle-active")]
        public async Task<IActionResult> ToggleActive(int id, [FromBody] ToggleActiveDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.Role == UserRoles.Admin)
            {
                return BadRequest("Cannot toggle active status of an admin user.");
            }

            user.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"User is now {(dto.IsActive ? "Active" : "Inactive")}.", IsActive = user.IsActive });
        }

        // 4. POST /api/admin/seed — on-demand massive enterprise-grade seeder trigger
        [HttpPost("seed")]
        public async Task<IActionResult> TriggerMassiveSeed()
        {
            try
            {
                await DbSeeder.SeedAllAsync(_context);
                return Ok(new { Message = "Massive 500-item enterprise-grade dataset successfully injected into database!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Massive seeding failed: {ex.Message}");
            }
        }
    }
}
