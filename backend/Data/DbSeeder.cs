using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Data
{
    public static class DbSeeder
    {
        private const string DefaultStaffPassword = "Dipshan123@";

        public static async Task SeedAllAsync(AppDbContext context)
        {
            Console.WriteLine("[Seeder] Checking database status for massive seeding...");

            // 1. Clear existing dynamic tables to guarantee exactly 500 items per section
            // Retain only Admin user (Id = 1)
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRoles.Admin);
            
            Console.WriteLine("[Seeder] Clearing old records...");
            
            // Delete invoice items and invoices
            context.SalesInvoiceItems.RemoveRange(context.SalesInvoiceItems);
            context.SalesInvoices.RemoveRange(context.SalesInvoices);

            // Delete appointments, part requests, reviews, notifications, vehicles
            context.Appointments.RemoveRange(context.Appointments);
            context.PartRequests.RemoveRange(context.PartRequests);
            context.ServiceReviews.RemoveRange(context.ServiceReviews);
            context.Notifications.RemoveRange(context.Notifications);
            context.Vehicles.RemoveRange(context.Vehicles);
            
            // Delete parts, purchase items, purchase invoices, vendors
            context.PurchaseInvoiceItems.RemoveRange(context.PurchaseInvoiceItems);
            context.PurchaseInvoices.RemoveRange(context.PurchaseInvoices);
            context.Parts.RemoveRange(context.Parts);
            context.Vendors.RemoveRange(context.Vendors);

            // Remove all users except the Admin
            var nonAdminUsers = context.Users.Where(u => u.Id != 1);
            context.Users.RemoveRange(nonAdminUsers);

            await context.SaveChangesAsync();
            Console.WriteLine("[Seeder] Clean slate achieved.");

            var random = new Random(42); // Seed for deterministic mock values

            // ==========================================
            // 2. SEED VENDORS (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 100 Vendors...");
            var vendorPrefixes = new[] { "NAPA", "AutoZone", "Brembo", "Bosch", "Carquest", "ACDelco", "Monroe", "BorgWarner", "Magna", "Denso", "Bando", "KYB", "Gates" };
            var contactNames = new[] { "Michael", "Sarah", "David", "Emma", "James", "Sophia", "Daniel", "Olivia", "Robert", "Emily" };
            var contactLastNames = new[] { "Smith", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Thomas", "Taylor", "Moore" };
            
            var vendors = new List<Vendor>();
            for (int i = 1; i <= 100; i++)
            {
                var prefix = vendorPrefixes[random.Next(vendorPrefixes.Length)];
                var contact = $"{contactNames[random.Next(contactNames.Length)]} {contactLastNames[random.Next(contactLastNames.Length)]}";
                vendors.Add(new Vendor
                {
                    Name = $"{prefix} Supply Center #{i:D3}",
                    ContactPerson = contact,
                    Email = $"contact@vendor{i}.com",
                    PhoneNumber = $"800{random.Next(100, 999)}{random.Next(1000, 9999)}",
                    Address = $"{random.Next(100, 9999)} Industrial Pkwy, Suite {random.Next(1, 50)}, Automotive City"
                });
            }
            context.Vendors.AddRange(vendors);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {vendors.Count} Vendors.");

            // ==========================================
            // 3. SEED PARTS (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 100 Parts...");
            var categories = new[] { "Engine", "Brakes", "Suspension", "Electrical", "Body", "Filters", "Transmission", "Exhaust" };
            var categoryParts = new Dictionary<string, string[]>
            {
                { "Engine", new[] { "Timing Belt Kit", "Spark Plug Set", "Cylinder Head Gasket", "Piston Ring Set", "Engine Valve", "Water Pump", "Radiator Fan", "Fuel Injector" } },
                { "Brakes", new[] { "Ceramic Brake Pads", "Brake Rotor Disc", "Brake Caliper Assembly", "Brake Master Cylinder", "Brake Hose Line", "ABS Speed Sensor" } },
                { "Suspension", new[] { "Front Shock Absorber", "Rear Coil Spring", "Control Arm Assembly", "Ball Joint", "Sway Bar Link", "Tie Rod End", "Wheel Hub Bearing" } },
                { "Electrical", new[] { "Alternator 12V", "Starter Motor", "12V AGM Car Battery", "Ignition Coil Pack", "Oxygen Sensor", "Headlight LED Bulb", "Fuses Box Kit" } },
                { "Body", new[] { "Windshield Wiper Blades", "Rear View Mirror", "Front Grille Trim", "Door Handle Assembly", "Gas Strut Lift", "Fender Guard" } },
                { "Filters", new[] { "Synthetic Engine Oil Filter", "Cabin Air Filter", "Engine Air Intake Filter", "Fuel Filter assembly" } },
                { "Transmission", new[] { "Clutch Plate Assembly", "Transmission Filter Kit", "CV Axle Shaft", "Gear Shifter Cable", "Flywheel Ring Gear" } },
                { "Exhaust", new[] { "Catalytic Converter", "Exhaust Muffler", "Oxygen Sensor", "Exhaust Pipe Hanger", "Exhaust Manifold Gasket" } }
            };

            var parts = new List<Part>();
            for (int i = 1; i <= 100; i++)
            {
                var category = categories[random.Next(categories.Length)];
                var partList = categoryParts[category];
                var name = $"{partList[random.Next(partList.Length)]} (Spec #{i})";
                var minStockLevel = random.Next(5, 12);
                var stockQuantity = i <= 8
                    ? 0
                    : random.Next(15, 120);
                
                parts.Add(new Part
                {
                    Name = name,
                    PartNumber = $"PN-{category.Substring(0, 3).ToUpper()}-{i:D4}",
                    Description = $"Heavy-duty grade premium replacement {name.ToLower()} engineered for high performance.",
                    Category = category,
                    Price = Math.Round((decimal)(random.NextDouble() * 380 + 15), 2), // $15 to $395
                    StockQuantity = stockQuantity,
                    MinStockLevel = minStockLevel
                });
            }
            context.Parts.AddRange(parts);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {parts.Count} Parts.");

            // ==========================================
            // 4. SEED STAFF AND CUSTOMER USERS (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 90 Customer Users & 10 Staff Members...");
            
            // Generate password hashes once to bypass heavy hashing overhead
            var staffPasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultStaffPassword);
            var customerPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password@123");

            // Seed 10 Staff Users
            var staffList = new List<User>();
            for (int i = 1; i <= 10; i++)
            {
                staffList.Add(new User
                {
                    Username = $"Staff_{i}",
                    Email = $"staff{i}@autocraft.com",
                    PhoneNumber = $"55555501{i:D2}",
                    PasswordHash = staffPasswordHash,
                    Role = UserRoles.Staff,
                    IsActive = true
                });
            }
            context.Users.AddRange(staffList);

            // Seed 90 Customer Users (totaling 100 dynamic users)
            var customerFirstNames = new[] { "Alex", "Brian", "Chris", "Dianne", "Edward", "Frank", "George", "Helen", "Ian", "Julia", "Kevin", "Laura", "Mark", "Nancy", "Oscar", "Patricia", "Quincy", "Rachel", "Steve", "Tanya" };
            var customerLastNames = new[] { "Adams", "Baker", "Carter", "Davidson", "Edwards", "Fisher", "Glover", "Harris", "Irwin", "Jackson", "King", "Lewis", "Morris", "Nelson", "Owens", "Parker", "Quigley", "Reed", "Stone", "Taylor" };

            var customersList = new List<User>();
            for (int i = 1; i <= 90; i++)
            {
                var username = $"{customerFirstNames[random.Next(customerFirstNames.Length)]}_{customerLastNames[random.Next(customerLastNames.Length)]}_{i}";
                customersList.Add(new User
                {
                    Username = username,
                    Email = $"customer{i}@gmail.com",
                    PhoneNumber = $"{random.Next(200, 999)}{random.Next(100, 999)}{random.Next(1000, 9999)}",
                    PasswordHash = customerPasswordHash,
                    Role = UserRoles.Customer,
                    IsActive = true
                });
            }
            context.Users.AddRange(customersList);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {context.Users.Count(u => u.Id != 1)} Users.");

            // Fetch newly updated lists with Database IDs
            var dbCustomers = await context.Users.Where(u => u.Role == UserRoles.Customer).ToListAsync();
            var dbStaff = await context.Users.Where(u => u.Role == UserRoles.Staff).ToListAsync();

            // ==========================================
            // 5. SEED VEHICLES (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 100 Vehicles...");
            var carMakes = new[] { "Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Hyundai", "Nissan", "Subaru" };
            var carModels = new Dictionary<string, string[]>
            {
                { "Toyota", new[] { "Camry", "Corolla", "RAV4", "Tacoma", "Prius" } },
                { "Honda", new[] { "Civic", "Accord", "CR-V", "Pilot", "Odyssey" } },
                { "Ford", new[] { "Mustang", "F-150", "Explorer", "Escape", "Focus" } },
                { "Chevrolet", new[] { "Silverado", "Malibu", "Equinox", "Camaro", "Cruze" } },
                { "BMW", new[] { "3 Series", "5 Series", "X5", "X3", "M3" } },
                { "Mercedes-Benz", new[] { "C-Class", "E-Class", "GLE", "GLC", "S-Class" } },
                { "Audi", new[] { "A4", "A6", "Q5", "Q7", "A3" } },
                { "Hyundai", new[] { "Elantra", "Sonata", "Tucson", "Santa Fe", "Kona" } },
                { "Nissan", new[] { "Altima", "Sentra", "Rogue", "Pathfinder", "Frontier" } },
                { "Subaru", new[] { "Outback", "Forester", "Impreza", "Legacy", "Crosstrek" } }
            };
            var carColors = new[] { "Midnight Black", "Polar White", "Slate Gray", "Metallic Silver", "Deep Blue", "Crimson Red", "Forest Green", "Champagne Gold" };

            var vehicles = new List<Vehicle>();
            for (int i = 1; i <= 100; i++)
            {
                var make = carMakes[random.Next(carMakes.Length)];
                var modelList = carModels[make];
                var model = modelList[random.Next(modelList.Length)];
                
                // Assing vehicles evenly to the seeded customers
                var assignedCustomer = dbCustomers[i % dbCustomers.Count];
                
                vehicles.Add(new Vehicle
                {
                    VehicleNumber = $"{(char)random.Next(65, 91)}{(char)random.Next(65, 91)}{(char)random.Next(65, 91)}-{random.Next(1000, 9999)}", // e.g. ABC-1234
                    Make = make,
                    Model = model,
                    Year = random.Next(2008, 2026),
                    Color = carColors[random.Next(carColors.Length)],
                    Notes = $"Vehicle regularly serviced. Owner: {assignedCustomer.Username}.",
                    CustomerId = assignedCustomer.Id
                });
            }
            context.Vehicles.AddRange(vehicles);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {vehicles.Count} Vehicles.");

            var dbVehicles = await context.Vehicles.ToListAsync();
            var dbParts = await context.Parts.ToListAsync();

            // ==========================================
            // 6. SEED SALES INVOICES & ITEMS (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 100 Sales Invoices & Line Items...");
            var invoiceStatusList = new[] { "Paid", "Paid", "Paid", "Pending", "Unpaid" };
            var invoiceRemarks = new[] { "Full diagnostic tune-up completed.", "Replaced heavily worn brake systems.", "Standard routine 5,000-mile lubrication and filter service.", "Exhaust leak successfully welded and sealed.", "Spark plugs changed, cylinder firing is normal.", "Alternator diagnostic performed and unit replaced." };

            var invoices = new List<SalesInvoice>();
            
            // Generate invoices spread over the past 12 months for stunning analytics reports
            var baseDate = DateTime.UtcNow;

            for (int i = 1; i <= 100; i++)
            {
                var randomVehicle = dbVehicles[random.Next(dbVehicles.Count)];
                var customerId = randomVehicle.CustomerId;
                var staffId = dbStaff[random.Next(dbStaff.Count)].Id;

                var saleDate = baseDate.AddDays(-random.Next(1, 365)).AddHours(-random.Next(1, 24));
                var status = invoiceStatusList[random.Next(invoiceStatusList.Length)];

                var invoice = new SalesInvoice
                {
                    InvoiceNumber = $"INV-{saleDate:yyyyMMdd}-{i:D4}",
                    CustomerId = customerId,
                    VehicleId = randomVehicle.Id,
                    StaffId = staffId,
                    SaleDate = saleDate,
                    Status = status,
                    EmailSent = random.NextDouble() > 0.4,
                    ReminderSent = status != "Paid" && random.NextDouble() > 0.7,
                    Notes = invoiceRemarks[random.Next(invoiceRemarks.Length)],
                    Subtotal = 0,
                    DiscountPercent = 0,
                    DiscountAmount = 0,
                    TotalAmount = 0
                };

                // Add 1 to 4 random line items per invoice
                int itemsCount = random.Next(1, 5);
                var selectedPartsForInvoice = new HashSet<int>();
                decimal invoiceSubtotal = 0;

                for (int j = 0; j < itemsCount; j++)
                {
                    var part = dbParts[random.Next(dbParts.Count)];
                    if (selectedPartsForInvoice.Contains(part.Id)) continue;
                    selectedPartsForInvoice.Add(part.Id);

                    var qty = random.Next(1, 3);
                    var price = part.Price;

                    invoice.Items.Add(new SalesInvoiceItem
                    {
                        PartId = part.Id,
                        Quantity = qty,
                        UnitPrice = price
                    });

                    invoiceSubtotal += qty * price;
                }

                invoice.Subtotal = invoiceSubtotal;

                // Loyalty discount validation: 10% discount on single orders exceeding $500
                if (invoiceSubtotal > 500)
                {
                    invoice.DiscountPercent = 10;
                    invoice.DiscountAmount = Math.Round(invoiceSubtotal * 0.10m, 2);
                }

                invoice.TotalAmount = invoice.Subtotal - invoice.DiscountAmount;
                invoices.Add(invoice);
            }
            context.SalesInvoices.AddRange(invoices);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {invoices.Count} Sales Invoices & related items.");

            // ==========================================
            // 7. SEED APPOINTMENTS (100 records)
            // ==========================================
            Console.WriteLine("[Seeder] Seeding 100 Appointments...");
            var serviceTypes = new[] { "Oil Change & Filter", "Brake Pad Replacement", "Suspension Alignment", "Electrical Systems Diagnostic", "Engine Tune-up", "Annual Vehicle Safety Check", "Tire Rotation & Balance", "AC System Recharge" };
            var apptStatusList = new[] { "Completed", "Completed", "Confirmed", "Pending", "Cancelled" };
            var apptNotes = new[] { "Engine making knocking noise at high RPMs.", "Left front brake squeaking constantly.", "Slight steering vibration when reaching 60mph.", "Air conditioning is blowing warm air.", "Blinking dashboard check-engine alert.", "Regular routine fluid inspection." };
            var staffApptRemarks = new[] { "Inspection complete, details compiled in service log.", "Client notified of secondary filter replacement needs.", "Car ready for immediate client pickup.", "Issues fully resolved under primary billing warranty.", "Work delayed pending delivery of custom structural mounting parts." };

            var appointments = new List<Appointment>();
            for (int i = 1; i <= 100; i++)
            {
                var randomVehicle = dbVehicles[random.Next(dbVehicles.Count)];
                var customerId = randomVehicle.CustomerId;
                
                // Distribute dates between past 6 months and future 3 months for perfect calendar lists
                var apptDate = baseDate.AddDays(random.Next(-180, 90)).AddHours(random.Next(8, 17)).AddMinutes(random.Next(0, 4) * 15);
                var status = apptStatusList[random.Next(apptStatusList.Length)];

                appointments.Add(new Appointment
                {
                    CustomerId = customerId,
                    VehicleId = randomVehicle.Id,
                    ServiceType = serviceTypes[random.Next(serviceTypes.Length)],
                    AppointmentDate = apptDate,
                    Status = status,
                    Notes = apptNotes[random.Next(apptNotes.Length)],
                    StaffNotes = status == "Completed" || status == "Confirmed" ? staffApptRemarks[random.Next(staffApptRemarks.Length)] : null,
                    CreatedAt = apptDate.AddDays(-random.Next(2, 10))
                });
            }
            context.Appointments.AddRange(appointments);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Successfully seeded {appointments.Count} Appointments.");

            Console.WriteLine("[Seeder] Massive enterprise-grade dataset successfully injected into database!");
        }
    }
}
