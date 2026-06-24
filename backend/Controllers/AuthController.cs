using BackendApi.DTOs;
using BackendApi.Services;
using BackendApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;

        public AuthController(IAuthService authService, AppDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var token = await _authService.RegisterAsync(dto);
            if (token == null)
                return BadRequest("User with this email already exists.");

            return Ok(new { Token = token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var token = await _authService.LoginAsync(dto);
            if (token == null)
                return Unauthorized("Invalid email or password.");

            return Ok(new { Token = token });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return Unauthorized("Your session is invalid (account was deleted or database reset). Please log out and log back in.");

            var success = await _authService.ChangePasswordAsync(userId, dto);
            if (!success)
                return BadRequest("Failed to change password. Make sure your old password is correct.");

            return Ok(new { Message = "Password changed successfully." });
        }
    }
}
