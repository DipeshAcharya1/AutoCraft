using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class SalesInvoice
    {
        public int Id { get; set; }

        [Required]
        public required string InvoiceNumber { get; set; }

        public int CustomerId { get; set; }
        public User? Customer { get; set; }

        public int? StaffId { get; set; }
        [JsonIgnore]
        public User? Staff { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }           // before discount

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountPercent { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }        // after discount

        // Paid | Unpaid | Pending
        public string Status { get; set; } = "Unpaid";

        public bool EmailSent { get; set; } = false;
        public bool ReminderSent { get; set; } = false;  // for overdue reminders

        public string? Notes { get; set; }

        public List<SalesInvoiceItem> Items { get; set; } = new();
    }

    public static class InvoiceStatus
    {
        public const string Paid = "Paid";
        public const string Unpaid = "Unpaid";
        public const string Pending = "Pending";
    }
}
