using BackendApi.Data;
using BackendApi.DTOs;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static string NormalizeVehicleNumber(string value) => value.Trim().ToUpperInvariant();

        public CustomersController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/customers — list all customers with their vehicles
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _context.Users
                .Where(u => u.Role == UserRoles.Customer)
                .Select(u => new
                {
                    u.Id, u.Username, u.Email, u.PhoneNumber, u.IsActive,
                    Vehicles = _context.Vehicles.Where(v => v.CustomerId == u.Id).ToList()
                })
                .ToListAsync();

            return Ok(customers);
        }

        // GET /api/customers/{id} — customer detail + vehicles + invoice history
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await _context.Users.FindAsync(id);
            if (customer == null || customer.Role != UserRoles.Customer)
                return NotFound("Customer not found.");

            var vehicles = await _context.Vehicles.Where(v => v.CustomerId == id).ToListAsync();

            var invoices = await _context.SalesInvoices
                .Where(s => s.CustomerId == id)
                .Include(s => s.Items).ThenInclude(i => i.Part)
                .Include(s => s.Vehicle)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();

            return Ok(new
            {
                customer.Id, customer.Username, customer.Email,
                customer.PhoneNumber, customer.IsActive,
                Vehicles = vehicles,
                Invoices = invoices
            });
        }

        // POST /api/customers — staff creates customer + vehicles
        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerWithVehicleDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("A user with this email already exists.");

            // Validate duplicate plates in request payload before creating customer.
            var normalizedPlates = dto.Vehicles
                .Select(v => NormalizeVehicleNumber(v.VehicleNumber))
                .ToList();
            if (normalizedPlates.Count != normalizedPlates.Distinct().Count())
                return BadRequest("Duplicate vehicle plate numbers are not allowed for the same customer.");

            // Auto-generate password if staff doesn't set one
            var rawPassword = string.IsNullOrWhiteSpace(dto.Password)
                ? Guid.NewGuid().ToString("N")[..10] + "A1!"
                : dto.Password;

            var customer = new User
            {
                Username = dto.Name,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword),
                Role = UserRoles.Customer,
                IsActive = true
            };

            _context.Users.Add(customer);
            await _context.SaveChangesAsync();

            // Add vehicles
            foreach (var v in dto.Vehicles)
            {
                _context.Vehicles.Add(new Vehicle
                {
                    VehicleNumber = NormalizeVehicleNumber(v.VehicleNumber),
                    Make = v.Make,
                    Model = v.Model,
                    Year = v.Year,
                    Color = v.Color,
                    Notes = v.Notes,
                    CustomerId = customer.Id
                });
            }
            await _context.SaveChangesAsync();

            return Ok(new { customer.Id, customer.Username, customer.Email, TempPassword = dto.Password == null ? rawPassword : null });
        }

        // POST /api/customers/{id}/vehicles — add vehicle to existing customer
        [HttpPost("{id}/vehicles")]
        public async Task<IActionResult> AddVehicle(int id, [FromBody] CreateVehicleDto dto)
        {
            var customer = await _context.Users.FindAsync(id);
            if (customer == null || customer.Role != UserRoles.Customer)
                return NotFound("Customer not found.");

            var normalizedPlate = NormalizeVehicleNumber(dto.VehicleNumber);
            var duplicateExists = await _context.Vehicles
                .AnyAsync(v => v.CustomerId == id && v.VehicleNumber.Trim().ToUpper() == normalizedPlate);
            if (duplicateExists)
                return BadRequest("This customer already has a vehicle with this plate number.");

            var vehicle = new Vehicle
            {
                VehicleNumber = normalizedPlate,
                Make = dto.Make,
                Model = dto.Model,
                Year = dto.Year,
                Color = dto.Color,
                Notes = dto.Notes,
                CustomerId = id
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return Ok(vehicle);
        }

        // PUT /api/customers/{id}/vehicles/{vehicleId} — update vehicle
        [HttpPut("{id}/vehicles/{vehicleId}")]
        public async Task<IActionResult> UpdateVehicle(int id, int vehicleId, [FromBody] CreateVehicleDto dto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == id);
            if (vehicle == null) return NotFound("Vehicle not found.");

            var normalizedPlate = NormalizeVehicleNumber(dto.VehicleNumber);
            var duplicateExists = await _context.Vehicles
                .AnyAsync(v => v.CustomerId == id && v.Id != vehicleId && v.VehicleNumber.Trim().ToUpper() == normalizedPlate);
            if (duplicateExists)
                return BadRequest("This customer already has a vehicle with this plate number.");

            vehicle.VehicleNumber = normalizedPlate;
            vehicle.Make = dto.Make;
            vehicle.Model = dto.Model;
            vehicle.Year = dto.Year;
            vehicle.Color = dto.Color;
            vehicle.Notes = dto.Notes;
            await _context.SaveChangesAsync();
            return Ok(vehicle);
        }

        // DELETE /api/customers/{id}/vehicles/{vehicleId}
        [HttpDelete("{id}/vehicles/{vehicleId}")]
        public async Task<IActionResult> DeleteVehicle(int id, int vehicleId)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == id);
            if (vehicle == null) return NotFound("Vehicle not found.");
            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return Ok("Vehicle removed.");
        }

        // GET /api/customers/search?q=
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(new List<object>());

            var term = q.Trim().ToLower();

            var query = _context.Users.AsNoTracking()
                .Where(u => u.Role == UserRoles.Customer && (
                    u.Username.ToLower().Contains(term) ||
                    u.Email.ToLower().Contains(term) ||
                    u.PhoneNumber.Contains(term) ||
                    u.Id.ToString() == term ||
                    _context.Vehicles.Any(v => v.CustomerId == u.Id && v.VehicleNumber.ToLower().Contains(term))
                ));

            var result = await query
                .Select(u => new
                {
                    u.Id, u.Username, u.Email, u.PhoneNumber, u.IsActive,
                    Vehicles = _context.Vehicles.Where(v => v.CustomerId == u.Id).ToList()
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}
