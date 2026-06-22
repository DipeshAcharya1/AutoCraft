using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        [JsonIgnore]
        public User? Customer { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        [Required]
        public required string ServiceType { get; set; }   // Oil Change, Brake Check, General Inspection, etc.

        public DateTime AppointmentDate { get; set; }

        // Pending | Confirmed | Completed | Cancelled
        public string Status { get; set; } = "Pending";

        public string? Notes { get; set; }         // Customer notes

        public string? StaffNotes { get; set; }    // Admin/Staff response notes

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public static class AppointmentStatus
    {
        public const string Pending = "Pending";
        public const string Confirmed = "Confirmed";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
    }
}
