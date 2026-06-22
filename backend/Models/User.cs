namespace BackendApi.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; }
        public bool IsActive { get; set; } = true;
        public string? ProfilePictureUrl { get; set; }
    }

    public static class UserRoles
    {
        public const string Admin = "Admin";
        public const string Staff = "Staff";
        public const string Customer = "Customer";
    }
}
