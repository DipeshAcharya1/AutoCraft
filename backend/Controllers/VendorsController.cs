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
    public class VendorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/vendors
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vendors = await _context.Vendors.OrderBy(v => v.Name).ToListAsync();
            return Ok(vendors);
        }

        // GET /api/vendors/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound("Vendor not found.");
            return Ok(vendor);
        }

        // POST /api/vendors
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateVendorDto dto)
        {
            var vendor = new Vendor
            {
                Name = dto.Name,
                ContactPerson = dto.ContactPerson,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address
            };

            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = vendor.Id }, vendor);
        }

        // PUT /api/vendors/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateVendorDto dto)
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound("Vendor not found.");

            vendor.Name = dto.Name;
            vendor.ContactPerson = dto.ContactPerson;
            vendor.Email = dto.Email;
            vendor.PhoneNumber = dto.PhoneNumber;
            vendor.Address = dto.Address;

            await _context.SaveChangesAsync();
            return Ok(vendor);
        }

        // DELETE /api/vendors/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound("Vendor not found.");

            _context.Vendors.Remove(vendor);
            await _context.SaveChangesAsync();
            return Ok("Vendor deleted successfully.");
        }
    }
}
