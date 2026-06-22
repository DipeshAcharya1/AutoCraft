using BackendApi.Data;
using BackendApi.Models;
using BackendApi.Services;
using BackendApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Dependency Injection for Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<NotificationBackgroundService>();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_needs_to_be_long_enough_for_hmac_sha256_for_dev";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

// Register Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Enterprise Automotive Repair Shop API",
        Version = "v1",
        Description = "An ASP.NET Core Web API for managing automotive repair shop sales, customers, inventory, and invoices."
    });

    // Configure JWT Authentication in Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// ── Startup Seeder: ensure admin account is valid & massive dataset seeded ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync(); // apply any pending migrations

    // Read admin credentials from configuration with safe defaults
    var adminEmail = builder.Configuration["Admin:Email"] ?? builder.Configuration["EmailSettings:SenderEmail"] ?? "admin@system.com";
    var adminPassword = builder.Configuration["Admin:Password"] ?? "Admin@123";
    const string defaultStaffPassword = "Dipshan123@";

    var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == "Admin" || u.Email == adminEmail || u.Email == "admin@system.com");
    if (admin == null)
    {
        // Create fresh admin if not seeded
        db.Users.Add(new User
        {
            Username = "Admin",
            Email = adminEmail,
            PhoneNumber = "1234567890",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            Role = UserRoles.Admin,
            IsActive = true
        });
        await db.SaveChangesAsync();
        Console.WriteLine("[Seeder] Admin account created.");
    }
    else
    {
        if (admin.Email != adminEmail)
        {
            admin.Email = adminEmail;
            Console.WriteLine($"[Seeder] Admin email updated to {adminEmail}.");
        }
        if (!BCrypt.Net.BCrypt.Verify(adminPassword, admin.PasswordHash))
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
            Console.WriteLine("[Seeder] Admin password hash fixed.");
        }
        await db.SaveChangesAsync();
        Console.WriteLine("[Seeder] Admin account OK.");
    }

    // Keep all staff accounts on one default password as requested.
    var staffUsers = await db.Users.Where(u => u.Role == UserRoles.Staff).ToListAsync();
    var staffUpdated = 0;
    foreach (var staff in staffUsers)
    {
        if (!BCrypt.Net.BCrypt.Verify(defaultStaffPassword, staff.PasswordHash))
        {
            staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultStaffPassword);
            staffUpdated++;
        }
    }

    if (staffUpdated > 0)
    {
        await db.SaveChangesAsync();
        Console.WriteLine($"[Seeder] Reset password for {staffUpdated} staff account(s).");
    }

    // Check user density. Trigger seeder to reset to 100 records if there are too many (500) or too few.
    if (await db.Users.CountAsync() > 200 || await db.Users.CountAsync() < 15)
    {
        await DbSeeder.SeedAllAsync(db);
    }
    else
    {
        Console.WriteLine("[Seeder] Massive enterprise dataset already present. Bypassing.");
    }

    var outOfStockParts = await db.Parts.Where(p => p.StockQuantity == 0).ToListAsync();
    if (outOfStockParts.Any())
    {
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRoles.Admin);
        var alertEmail = adminUser?.Email ?? builder.Configuration["Admin:Email"] ?? builder.Configuration["EmailSettings:SenderEmail"] ?? "admin@system.com";
        var totalParts = await db.Parts.CountAsync();

        await emailService.SendEmailAsync(
            alertEmail,
            "AutoCraft Garage - Seeded Out of Stock Alert",
            StockAlertReportBuilder.Build(totalParts, outOfStockParts)
        );

        Console.WriteLine($"[Seeder] Out-of-stock alert email sent to {alertEmail}.");
    }
    else
    {
        Console.WriteLine("[Seeder] No out-of-stock parts found after seeding.");
    }
}
// ───────────────────────────────────────────────────────────────────────────

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        c.RoutePrefix = "swagger"; // Available at /swagger
    });
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
