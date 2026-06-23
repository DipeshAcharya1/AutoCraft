using BackendApi.Data;
using BackendApi.DTOs;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BackendApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<string?> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return null; // Email already exists
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Role = UserRoles.Customer, // Registration defaults to Customer now
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return GenerateJwtToken(user);
        }

        public async Task<string?> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return null; // Invalid credentials or inactive user
            }

            return GenerateJwtToken(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
            {
                return false; // Old password mismatch
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _config["Jwt:Key"] ?? "super_secret_key_needs_to_be_long_enough_for_hmac_sha256_for_dev";
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
