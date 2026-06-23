using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTOs
{
    // Vehicle DTOs
    public class CreateVehicleDto
    {
        [Required]
        [StringLength(20)]
        public required string VehicleNumber { get; set; }

        [Required]
        [StringLength(50)]
        public required string Make { get; set; }

        [Required]
        [StringLength(50)]
        public required string Model { get; set; }

        [Range(1900, 2100, ErrorMessage = "Year must be between 1900 and 2100")]
        public int? Year { get; set; }

        [StringLength(30)]
        public string? Color { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    // Register customer + vehicles in one shot (for staff use)
    public class CreateCustomerWithVehicleDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public required string Name { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public required string Email { get; set; }

        [Required]
        [Phone]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
        public required string PhoneNumber { get; set; }

        [StringLength(100, MinimumLength = 6)]
        public string? Password { get; set; }   // optional — auto-generated if omitted

        [Required]
        public List<CreateVehicleDto> Vehicles { get; set; } = new();
    }

    // Sales Invoice DTOs
    public class SalesInvoiceItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Invalid Part ID")]
        public int PartId { get; set; }

        [Range(1, 1000, ErrorMessage = "Quantity must be between 1 and 1000")]
        public int Quantity { get; set; }

        [Range(0.01, 100000.00, ErrorMessage = "Unit price must be between 0.01 and 100,000.00")]
        public decimal UnitPrice { get; set; }
    }

    public class CreateSalesInvoiceDto
    {
        [Required]
        [StringLength(50)]
        public required string InvoiceNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Invalid Customer ID")]
        public int CustomerId { get; set; }

        public int? VehicleId { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [Required]
        public List<SalesInvoiceItemDto> Items { get; set; } = new();
    }

    public class UpdateInvoiceStatusDto
    {
        [Required]
        [StringLength(20)]
        public required string Status { get; set; }
    }
}
