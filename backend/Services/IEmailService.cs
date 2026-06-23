using System.Threading.Tasks;

namespace BackendApi.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
    }
}
