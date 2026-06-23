using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTOs
{
    public class CreatePartDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [Required]
        [StringLength(50)]
        public required string PartNumber { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public required string Category { get; set; }

        [Range(0.01, 100000.00, ErrorMessage = "Price must be between 0.01 and 100,000.00")]
        public decimal Price { get; set; }

        [Range(0, 100000, ErrorMessage = "Stock quantity must be non-negative")]
        public int StockQuantity { get; set; }

        [Range(0, 10000, ErrorMessage = "Minimum stock level must be non-negative")]
        public int MinStockLevel { get; set; }
    }

    public class UpdatePartDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [Required]
        [StringLength(50)]
        public required string PartNumber { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public required string Category { get; set; }

        [Range(0.01, 100000.00, ErrorMessage = "Price must be between 0.01 and 100,000.00")]
        public decimal Price { get; set; }

        [Range(0, 10000, ErrorMessage = "Minimum stock level must be non-negative")]
        public int MinStockLevel { get; set; }
    }

    public class PurchaseInvoiceItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Invalid Part ID")]
        public int PartId { get; set; }

        [Range(1, 100000, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Range(0.01, 100000.00, ErrorMessage = "Unit price must be between 0.01 and 100,000.00")]
        public decimal UnitPrice { get; set; }
    }

    public class CreatePurchaseInvoiceDto
    {
        [Required]
        [StringLength(50)]
        public required string InvoiceNumber { get; set; }

        [Required]
        [StringLength(100)]
        public required string SupplierName { get; set; }

        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        [Required]
        public List<PurchaseInvoiceItemDto> Items { get; set; } = new();
    }
}
