using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public required string Username { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public required string Email { get; set; }

        [Required]
        [Phone]
        [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone number must be exactly 10 digits.")]
        public required string PhoneNumber { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$", 
            ErrorMessage = "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
        public required string Password { get; set; }
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Password { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public required string OldPassword { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$", 
            ErrorMessage = "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
        public required string NewPassword { get; set; }
    }

    public class CreateStaffDto
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

        [Required]
        [StringLength(100, MinimumLength = 6)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$", 
            ErrorMessage = "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
        public required string Password { get; set; }
    }

    public class ToggleActiveDto
    {
        public bool IsActive { get; set; }
    }
}
