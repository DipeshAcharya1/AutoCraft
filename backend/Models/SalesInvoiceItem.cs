using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BackendApi.Models
{
    public class SalesInvoiceItem
    {
        public int Id { get; set; }

        public int SalesInvoiceId { get; set; }

        [JsonIgnore]
        public SalesInvoice? SalesInvoice { get; set; }

        public int PartId { get; set; }
        public Part? Part { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
    }
}
