using System.Collections.Generic;
using System.Text;
using BackendApi.Models;

namespace BackendApi.Services
{
    public static class StockAlertReportBuilder
    {
        public static string Build(int totalParts, IReadOnlyCollection<Part> alertParts)
        {
            var sb = new StringBuilder();
            var alertCount = alertParts.Count;

            sb.AppendLine("<!DOCTYPE html>");
            sb.AppendLine("<html>");
            sb.AppendLine("<head>");
            sb.AppendLine("<meta charset='utf-8' />");
            sb.AppendLine("<meta name='viewport' content='width=device-width, initial-scale=1.0' />");
            sb.AppendLine("</head>");
            sb.AppendLine("<body style='margin:0; padding:0; background:#f4f6fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;'>");
            sb.AppendLine("<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6fb; padding:24px 0;'>");
            sb.AppendLine("<tr><td align='center'>");
            sb.AppendLine("<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='max-width:760px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 12px 30px rgba(15, 23, 42, 0.10);'>");

            sb.AppendLine("<tr><td style='background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%); padding:28px 32px;'>");
            sb.AppendLine("<div style='color:#93c5fd; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700;'>AutoCraft Garage</div>");
            sb.AppendLine("<div style='color:#ffffff; font-size:28px; font-weight:800; line-height:1.2; margin-top:8px;'>Low Stock Alert Report</div>");
            sb.AppendLine("<div style='color:#dbeafe; font-size:14px; margin-top:8px; line-height:1.6;'>A summary of items that need immediate replenishment. This report is generated automatically by the inventory monitor.</div>");
            sb.AppendLine("</td></tr>");

            sb.AppendLine("<tr><td style='padding:28px 32px 16px 32px;'>");
            sb.AppendLine("<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>");
            sb.AppendLine($"<td style='background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:18px 16px; text-align:center;'><div style='font-size:26px; font-weight:800; color:#1d4ed8;'>{totalParts}</div><div style='font-size:12px; color:#3b82f6; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;'>Total Parts</div></td>");
            sb.AppendLine("<td style='width:14px;'></td>");
            sb.AppendLine($"<td style='background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:18px 16px; text-align:center;'><div style='font-size:26px; font-weight:800; color:#ea580c;'>{alertCount}</div><div style='font-size:12px; color:#f97316; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;'>Low / Out of Stock</div></td>");
            sb.AppendLine("</tr></table>");
            sb.AppendLine("</td></tr>");

            sb.AppendLine("<tr><td style='padding:0 32px 8px 32px;'>");
            sb.AppendLine("<div style='font-size:15px; line-height:1.7; color:#374151;'>The following parts are currently at zero stock and should be reviewed immediately. Please restock these items to keep service operations running smoothly.</div>");
            sb.AppendLine("</td></tr>");

            if (alertParts.Count > 0)
            {
                sb.AppendLine("<tr><td style='padding:16px 32px 8px 32px;'>");
                sb.AppendLine("<div style='max-height:320px; overflow:auto; border:1px solid #e5e7eb; border-radius:14px; background:#ffffff;'>");
                sb.AppendLine("<table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse; min-width:640px;'>");
                sb.AppendLine("<tr style='background:#f8fafc;'>");
                sb.AppendLine("<th align='left' style='padding:14px 16px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e5e7eb;'>Part Number</th>");
                sb.AppendLine("<th align='left' style='padding:14px 16px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e5e7eb;'>Part Name</th>");
                sb.AppendLine("<th align='center' style='padding:14px 16px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e5e7eb;'>Stock</th>");
                sb.AppendLine("<th align='center' style='padding:14px 16px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; border-bottom:1px solid #e5e7eb;'>Minimum</th>");
                sb.AppendLine("</tr>");

                foreach (var part in alertParts)
                {
                    sb.AppendLine("<tr>");
                    sb.AppendLine($"<td style='padding:14px 16px; border-bottom:1px solid #eef2f7; color:#0f172a; font-weight:700;'>{part.PartNumber}</td>");
                    sb.AppendLine($"<td style='padding:14px 16px; border-bottom:1px solid #eef2f7; color:#0f172a;'>{part.Name}</td>");
                    sb.AppendLine($"<td align='center' style='padding:14px 16px; border-bottom:1px solid #eef2f7;'><span style='display:inline-block; min-width:64px; background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; padding:6px 10px; border-radius:999px; font-weight:800;'>{part.StockQuantity}</span></td>");
                    sb.AppendLine($"<td align='center' style='padding:14px 16px; border-bottom:1px solid #eef2f7; color:#334155; font-weight:600;'>{part.MinStockLevel}</td>");
                    sb.AppendLine("</tr>");
                }

                sb.AppendLine("</table>");
                sb.AppendLine("</div>");
                sb.AppendLine("</td></tr>");
            }
            else
            {
                sb.AppendLine("<tr><td style='padding:18px 32px 8px 32px;'>");
                sb.AppendLine("<div style='background:#ecfdf5; border:1px solid #a7f3d0; color:#047857; padding:16px 18px; border-radius:14px; font-weight:700;'>All parts are currently in stock.</div>");
                sb.AppendLine("</td></tr>");
            }

            sb.AppendLine("<tr><td style='padding:12px 32px 30px 32px;'>");
            sb.AppendLine("<div style='border-top:1px solid #e5e7eb; padding-top:16px; font-size:12px; line-height:1.6; color:#6b7280;'>");
            sb.AppendLine("This is an automated alert generated every 5 minutes by the inventory monitoring service.<br/>");
            sb.AppendLine("Please do not reply to this email. Log in to the admin dashboard to review the current stock levels.");
            sb.AppendLine("</div>");
            sb.AppendLine("</td></tr>");

            sb.AppendLine("<tr><td style='background:#f8fafc; padding:16px 32px; font-size:12px; color:#94a3b8; text-align:center;'>AutoCraft Garage Inventory System</td></tr>");
            sb.AppendLine("</table>");
            sb.AppendLine("</td></tr>");
            sb.AppendLine("</table>");
            sb.AppendLine("</body>");
            sb.AppendLine("</html>");
            return sb.ToString();
        }
    }
}