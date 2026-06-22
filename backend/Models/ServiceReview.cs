using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class ServiceReview
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public User? Customer { get; set; }

        public int? SalesInvoiceId { get; set; }
        public SalesInvoice? SalesInvoice { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }          // 1–5 stars

        [Required]
        public required string Comment { get; set; }

        public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    }
}
