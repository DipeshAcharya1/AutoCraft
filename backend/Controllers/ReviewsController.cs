using BackendApi.Data;
using BackendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Controllers
{
    /// <summary>
    /// Admin/Staff: view all customer service reviews.
    /// </summary>
    [Route("api/reviews")]
    [ApiController]
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Staff}")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReviewsController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reviews = await _context.ServiceReviews
                .Include(r => r.Customer)
                .Include(r => r.SalesInvoice)
                .OrderByDescending(r => r.ReviewedAt)
                .Select(r => new
                {
                    r.Id, r.Rating, r.Comment, r.ReviewedAt,
                    Customer = new { r.Customer!.Username, r.Customer.Email },
                    InvoiceNumber = r.SalesInvoice != null ? r.SalesInvoice.InvoiceNumber : null
                })
                .ToListAsync();
            return Ok(reviews);
        }
    }
}
