using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace BackendApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var portStr = _config["EmailSettings:Port"] ?? "587";
            var senderEmail = _config["EmailSettings:SenderEmail"] ?? "ssavr.np@gmail.com";
            var senderName = _config["EmailSettings:SenderName"] ?? "AutoCraft Garage";
            var username = _config["EmailSettings:Username"] ?? "ssavr.np@gmail.com";
            var password = _config["EmailSettings:Password"] ?? "ggqq cgss aevn tidr";

            if (string.IsNullOrWhiteSpace(password))
            {
                Console.WriteLine($"[EmailService] Simulated email to {toEmail}: Subject: {subject}");
                return;
            }

            int port = int.Parse(portStr);

            using var client = new SmtpClient(smtpServer, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"[EmailService] Successfully sent real email to {toEmail}");
        }
    }
}
