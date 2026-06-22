using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class PartRequest
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        [JsonIgnore]
        public User? Customer { get; set; }

        [Required]
        public required string PartName { get; set; }

        public string? PartNumber { get; set; }

        public string? Description { get; set; }     // what they need it for

        // Pending | Fulfilled | Rejected
        public string Status { get; set; } = "Pending";

        public string? AdminNote { get; set; }       // staff response note

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }

    public static class PartRequestStatus
    {
        public const string Pending = "Pending";
        public const string Fulfilled = "Fulfilled";
        public const string Rejected = "Rejected";
    }
}
