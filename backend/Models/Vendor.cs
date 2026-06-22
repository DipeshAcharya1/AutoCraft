using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models
{
    public class Vendor
    {
        public int Id { get; set; }

        [Required]
        public required string Name { get; set; }

        public string? ContactPerson { get; set; }

        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Address { get; set; }
    }
}
