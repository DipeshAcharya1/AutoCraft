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
    public class PartsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PartsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Get all parts (Authenticated)
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllParts(
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? stockStatus = null, // "All", "In", "Low", "Out"
            [FromQuery] int? pageNumber = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null)
        {
            var query = _context.Parts.AsQueryable();

            // 1. Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(s) || p.PartNumber.ToLower().Contains(s));
            }

            // 2. Category filter
            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Category == category);
            }

            // 3. Stock status filter
            if (!string.IsNullOrWhiteSpace(stockStatus) && !stockStatus.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (stockStatus.Equals("Out", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.StockQuantity == 0);
                }
                else if (stockStatus.Equals("Low", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.StockQuantity > 0 && p.StockQuantity <= p.MinStockLevel);
                }
                else if (stockStatus.Equals("In", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.StockQuantity > p.MinStockLevel);
                }
            }

            // 4. Sorting
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                bool isDesc = !string.IsNullOrWhiteSpace(sortOrder) && sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase);
                query = sortBy.ToLower() switch
                {
                    "name" => isDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                    "price" => isDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                    "stock" => isDesc ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
                    "partnumber" => isDesc ? query.OrderByDescending(p => p.PartNumber) : query.OrderBy(p => p.PartNumber),
                    _ => isDesc ? query.OrderByDescending(p => p.Id) : query.OrderBy(p => p.Id)
                };
            }
            else
            {
                query = query.OrderBy(p => p.Id);
            }

            // 5. Pagination (Optional, fallback to list for backwards compatibility)
            if (pageNumber.HasValue && pageSize.HasValue)
            {
                int page = Math.Max(1, pageNumber.Value);
                int size = Math.Clamp(pageSize.Value, 1, 100);
                
                var totalCount = await query.CountAsync();
                var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();

                Response.Headers["X-Pagination-TotalCount"] = totalCount.ToString();
                Response.Headers["X-Pagination-PageNumber"] = page.ToString();
                Response.Headers["X-Pagination-PageSize"] = size.ToString();
                Response.Headers["X-Pagination-TotalPages"] = ((int)Math.Ceiling((double)totalCount / size)).ToString();

                return Ok(items);
            }

            var allParts = await query.ToListAsync();
            return Ok(allParts);
        }

        // 2. Get part by ID (Authenticated)
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPartById(int id)
        {
            var part = await _context.Parts.FindAsync(id);
            if (part == null)
            {
                return NotFound("Part not found.");
            }
            return Ok(part);
        }

        // 3. Create a part (Admin Only)
        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> CreatePart([FromBody] CreatePartDto dto)
        {
            if (await _context.Parts.AnyAsync(p => p.PartNumber == dto.PartNumber))
            {
                return BadRequest("A part with this part number already exists.");
            }

            var part = new Part
            {
                Name = dto.Name,
                PartNumber = dto.PartNumber,
                Description = dto.Description,
                Category = dto.Category,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                MinStockLevel = dto.MinStockLevel
            };

            _context.Parts.Add(part);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPartById), new { id = part.Id }, part);
        }

        // 4. Update a part (Admin Only)
        [HttpPut("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> UpdatePart(int id, [FromBody] UpdatePartDto dto)
        {
            var part = await _context.Parts.FindAsync(id);
            if (part == null)
            {
                return NotFound("Part not found.");
            }

            // Check duplicate PartNumber if it was changed
            if (part.PartNumber != dto.PartNumber && await _context.Parts.AnyAsync(p => p.PartNumber == dto.PartNumber))
            {
                return BadRequest("Another part with this part number already exists.");
            }

            part.Name = dto.Name;
            part.PartNumber = dto.PartNumber;
            part.Description = dto.Description;
            part.Category = dto.Category;
            part.Price = dto.Price;
            part.MinStockLevel = dto.MinStockLevel;

            await _context.SaveChangesAsync();
            return Ok(part);
        }

        // 5. Delete a part (Admin Only)
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> DeletePart(int id)
        {
            var part = await _context.Parts.FindAsync(id);
            if (part == null)
            {
                return NotFound("Part not found.");
            }

            // Check if there are any invoice items referencing this part
            var hasInvoices = await _context.PurchaseInvoiceItems.AnyAsync(pii => pii.PartId == id);
            if (hasInvoices)
            {
                return BadRequest("Cannot delete part because it is referenced in purchase invoices. Try editing its stock or details instead.");
            }

            _context.Parts.Remove(part);
            await _context.SaveChangesAsync();
            return Ok("Part deleted successfully.");
        }

        // 6. Create Purchase Invoice for stock updates (Admin Only)
        [HttpPost("purchase-invoices")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> CreatePurchaseInvoice([FromBody] CreatePurchaseInvoiceDto dto)
        {
            if (await _context.PurchaseInvoices.AnyAsync(i => i.InvoiceNumber == dto.InvoiceNumber))
            {
                return BadRequest("A purchase invoice with this invoice number already exists.");
            }

            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest("A purchase invoice must contain at least one item.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var invoice = new PurchaseInvoice
                {
                    InvoiceNumber = dto.InvoiceNumber,
                    SupplierName = dto.SupplierName,
                    PurchaseDate = dto.PurchaseDate,
                    TotalAmount = 0
                };

                decimal total = 0;

                foreach (var itemDto in dto.Items)
                {
                    var part = await _context.Parts.FindAsync(itemDto.PartId);
                    if (part == null)
                    {
                        return BadRequest($"Part with ID {itemDto.PartId} not found.");
                    }

                    // Create line item
                    var item = new PurchaseInvoiceItem
                    {
                        PartId = itemDto.PartId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice
                    };

                    invoice.Items.Add(item);

                    // Update stock quantity in database!
                    part.StockQuantity += itemDto.Quantity;

                    total += itemDto.Quantity * itemDto.UnitPrice;
                }

                invoice.TotalAmount = total;
                _context.PurchaseInvoices.Add(invoice);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { Message = "Purchase invoice created and stock updated successfully.", Invoice = invoice });
            }
            catch (System.Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while creating the purchase invoice.");
            }
        }

        // 7. Get all purchase invoices (Admin Only)
        [HttpGet("purchase-invoices")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> GetPurchaseInvoices()
        {
            var invoices = await _context.PurchaseInvoices
                .Include(i => i.Items)
                .ThenInclude(item => item.Part)
                .OrderByDescending(i => i.PurchaseDate)
                .ToListAsync();

            return Ok(invoices);
        }
    }
}
