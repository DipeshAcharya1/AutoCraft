using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class Vehicle
    {
        public int Id { get; set; }

        [Required]
        public required string VehicleNumber { get; set; }  // Plate/Registration number

        [Required]
        public required string Make { get; set; }           // e.g. Toyota

        [Required]
        public required string Model { get; set; }          // e.g. Camry

        public int? Year { get; set; }

        public string? Color { get; set; }

        public string? Notes { get; set; }

        // FK to User (customer)
        public int CustomerId { get; set; }

        [JsonIgnore]
        public User? Customer { get; set; }
    }
}
