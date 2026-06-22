using BackendApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace BackendApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<SalesInvoice> SalesInvoices { get; set; }
        public DbSet<SalesInvoiceItem> SalesInvoiceItems { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<PartRequest> PartRequests { get; set; }
        public DbSet<ServiceReview> ServiceReviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        public override int SaveChanges()
        {
            NormalizeAndValidateVehicles();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            NormalizeAndValidateVehicles();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void NormalizeAndValidateVehicles()
        {
            var pendingVehicleEntries = ChangeTracker.Entries<Vehicle>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
                .ToList();

            if (pendingVehicleEntries.Count == 0) return;

            foreach (var entry in pendingVehicleEntries)
            {
                var value = entry.Entity.VehicleNumber?.Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(value))
                    throw new InvalidOperationException("Vehicle number is required.");

                entry.Entity.VehicleNumber = value;
            }

            var duplicateInRequest = pendingVehicleEntries
                .GroupBy(e => new { e.Entity.CustomerId, e.Entity.VehicleNumber })
                .FirstOrDefault(g => g.Count() > 1);

            if (duplicateInRequest != null)
                throw new InvalidOperationException("Duplicate vehicle numbers are not allowed for the same customer.");

            foreach (var entry in pendingVehicleEntries)
            {
                var duplicateExists = Vehicles
                    .AsNoTracking()
                    .Any(v => v.CustomerId == entry.Entity.CustomerId
                              && v.Id != entry.Entity.Id
                              && v.VehicleNumber.Trim().ToUpper() == entry.Entity.VehicleNumber);

                if (duplicateExists)
                    throw new InvalidOperationException("Duplicate vehicle numbers are not allowed for the same customer.");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique Indexes for performance and data integrity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Part>()
                .HasIndex(p => p.PartNumber)
                .IsUnique();

            modelBuilder.Entity<PurchaseInvoice>()
                .HasIndex(pi => pi.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<SalesInvoice>()
                .HasIndex(si => si.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => new { v.CustomerId, v.VehicleNumber })
                .IsUnique();

            // SalesInvoice - Customer (no cascade to avoid cycles)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Customer)
                .WithMany()
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // SalesInvoice - Staff (no cascade)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Staff)
                .WithMany()
                .HasForeignKey(s => s.StaffId)
                .OnDelete(DeleteBehavior.SetNull);

            // SalesInvoice - Vehicle (no cascade)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Vehicle)
                .WithMany()
                .HasForeignKey(s => s.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            // Vehicle - Customer
            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Customer)
                .WithMany()
                .HasForeignKey(v => v.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Appointment - Customer
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Customer)
                .WithMany()
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Appointment - Vehicle
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Vehicle)
                .WithMany()
                .HasForeignKey(a => a.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            // PartRequest - Customer
            modelBuilder.Entity<PartRequest>()
                .HasOne(pr => pr.Customer)
                .WithMany()
                .HasForeignKey(pr => pr.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ServiceReview - Customer
            modelBuilder.Entity<ServiceReview>()
                .HasOne(sr => sr.Customer)
                .WithMany()
                .HasForeignKey(sr => sr.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ServiceReview - SalesInvoice
            modelBuilder.Entity<ServiceReview>()
                .HasOne(sr => sr.SalesInvoice)
                .WithMany()
                .HasForeignKey(sr => sr.SalesInvoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Admin account is seeded at application startup in Program.cs
        }
    }
}
