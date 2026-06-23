using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTOs
{
    public class CreateVendorDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [Phone]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
        public string? PhoneNumber { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }
    }

    public class UpdateVendorDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [Phone]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
        public string? PhoneNumber { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }
    }
}
