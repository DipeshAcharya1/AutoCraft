using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models
{
    public class PurchaseInvoice
    {
        public int Id { get; set; }

        [Required]
        public required string InvoiceNumber { get; set; }

        [Required]
        public required string SupplierName { get; set; }

        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public List<PurchaseInvoiceItem> Items { get; set; } = new();
    }
}
