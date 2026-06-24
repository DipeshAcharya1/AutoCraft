using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueCustomerVehicleNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Vehicles""
                SET ""VehicleNumber"" = UPPER(BTRIM(""VehicleNumber""));
            ");

            migrationBuilder.Sql(@"
                WITH ranked AS (
                    SELECT
                        ""Id"",
                        MIN(""Id"") OVER (PARTITION BY ""CustomerId"", ""VehicleNumber"") AS ""KeepId"",
                        ROW_NUMBER() OVER (PARTITION BY ""CustomerId"", ""VehicleNumber"" ORDER BY ""Id"") AS rn
                    FROM ""Vehicles""
                )
                UPDATE ""Appointments"" a
                SET ""VehicleId"" = r.""KeepId""
                FROM ranked r
                WHERE a.""VehicleId"" = r.""Id"" AND r.rn > 1;
            ");

            migrationBuilder.Sql(@"
                WITH ranked AS (
                    SELECT
                        ""Id"",
                        MIN(""Id"") OVER (PARTITION BY ""CustomerId"", ""VehicleNumber"") AS ""KeepId"",
                        ROW_NUMBER() OVER (PARTITION BY ""CustomerId"", ""VehicleNumber"" ORDER BY ""Id"") AS rn
                    FROM ""Vehicles""
                )
                UPDATE ""SalesInvoices"" s
                SET ""VehicleId"" = r.""KeepId""
                FROM ranked r
                WHERE s.""VehicleId"" = r.""Id"" AND r.rn > 1;
            ");

            migrationBuilder.Sql(@"
                WITH ranked AS (
                    SELECT
                        ""Id"",
                        ROW_NUMBER() OVER (PARTITION BY ""CustomerId"", ""VehicleNumber"" ORDER BY ""Id"") AS rn
                    FROM ""Vehicles""
                )
                DELETE FROM ""Vehicles"" v
                USING ranked r
                WHERE v.""Id"" = r.""Id"" AND r.rn > 1;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CustomerId_VehicleNumber",
                table: "Vehicles",
                columns: new[] { "CustomerId", "VehicleNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_CustomerId_VehicleNumber",
                table: "Vehicles");
        }
    }
}
