using System;
using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // LowStock | OverdueReminder | PartRequest | General
        [Required]
        public required string Type { get; set; }

        [Required]
        public required string Message { get; set; }

        public bool IsRead { get; set; } = false;

        public int? RelatedId { get; set; }   // PartId, InvoiceId, etc.

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public static class NotificationType
    {
        public const string LowStock = "LowStock";
        public const string OverdueReminder = "OverdueReminder";
        public const string PartRequest = "PartRequest";
        public const string General = "General";
    }
}
