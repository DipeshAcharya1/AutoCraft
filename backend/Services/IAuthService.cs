namespace BackendApi.Services
{
    public interface IAuthService
    {
        Task<string?> RegisterAsync(DTOs.RegisterDto dto);
        Task<string?> LoginAsync(DTOs.LoginDto dto);
        Task<bool> ChangePasswordAsync(int userId, DTOs.ChangePasswordDto dto);
    }
}
