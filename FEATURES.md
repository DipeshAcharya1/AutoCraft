# Vehicle Parts Selling & Inventory Management System - Complete Feature Walkthrough

This document provides a detailed breakdown of the 16 primary features implemented in the system. It covers the business logic, API endpoint details, Next.js page components, and step-by-step instructions on how to access and verify each feature.

---

## 👑 Admin Features

### Feature 1: Admin can generate and view financial reports (daily, monthly, yearly)
* **Description & Logic**: Allows Administrators to monitor the garage's cash flow. It dynamically groups sales invoices to calculate Gross Revenue, Loyalty Discounts, Net Revenue, and total number of invoices generated.
* **Backend Endpoint**: `GET /api/sales/reports/financial?period={daily|monthly|yearly}&year={year}&month={month}` in `SalesController.cs` (restricted to the `Admin` role).
* **Frontend View**: `/admin/reports` page.
* **How to Verify**:
  1. Log in as an Administrator (`admin@system.com` / `Admin@123`).
  2. Click **Financial Reports** in the top navigation bar.
  3. Toggle between **Daily Report**, **Monthly Report**, and **Yearly Report**.
  4. Select a specific Year and Month from the filters to view aggregated data grids.

### Feature 2: Admin can manage staff registration and roles
* **Description & Logic**: Allows Admins to register new staff accounts and control login credentials. It also enables toggling the active status of any Customer or Staff account.
* **Backend Endpoints**:
  * `POST /api/admin/staff` (Register new staff)
  * `GET /api/admin/users` (List customers and staff)
  * `PUT /api/admin/users/{id}/toggle-active` (Activate/deactivate user accounts)
* **Frontend View**: `/admin/users` page.
* **How to Verify**:
  1. Go to the **Users** tab in the Admin Panel.
  2. Click **Create New Staff**, fill in the details, and submit.
  3. Locate any staff or customer in the directory and click **Deactivate** or **Activate** to control account access permissions.

### Feature 3: Admin can perform parts management (purchase, edit, delete)
* **Description & Logic**: Inventory control allowing admins to maintain the vehicle parts catalog. Includes sorting, searching, pagination, and stock indicators.
* **Backend Endpoints**:
  * `GET /api/parts` (Search, filter, paginate parts)
  * `POST /api/parts` (Create new parts)
  * `PUT /api/parts/{id}` (Edit part details)
  * `DELETE /api/parts/{id}` (Delete parts)
* **Frontend View**: `/admin/parts` page.
* **How to Verify**:
  1. Navigate to the **Parts & Invoices** section.
  2. Use the search bar or sort dropdowns to inspect stock levels.
  3. Click **Add New Part** to create a product, or use the **Edit** / **Delete** buttons on any item row.

### Feature 4: Admin can create purchase invoices for stock updates
* **Description & Logic**: Log incoming stock from external vendors. Submitting a purchase invoice automatically adds the purchased quantities to the database's existing stock levels.
* **Backend Endpoint**: `POST /api/parts/purchase-invoices` in `PartsController.cs`.
* **Frontend View**: `/admin/parts` page (via the **Create Purchase Invoice** modal).
* **How to Verify**:
  1. In the **Parts & Invoices** page, click the **Create Purchase Invoice** button.
  2. Choose a registered vendor, enter an invoice number, and add line items specifying parts and quantities.
  3. Click **Create Invoice**. The inventory level of the chosen parts will instantly increase.

### Feature 5: Admin can manage vendor details (CRUD operations)
* **Description & Logic**: Manage supplier contacts supplying garage inventory.
* **Backend Endpoints**: `GET`, `POST`, `PUT`, `DELETE` operations on `/api/vendors` in `VendorsController.cs`.
* **Frontend View**: `/admin/vendors` page.
* **How to Verify**:
  1. Go to the **Vendors** section in the Admin navigation bar.
  2. Click **Add New Vendor** to save details (Company Name, Email, Phone, Address, Contact Person).
  3. Edit or delete existing vendors from the list.

---

## 💼 Staff Features

### Feature 6: Staff can register new customers with vehicle details
* **Description & Logic**: Allows staff members to register new customers alongside their primary vehicle details in a single step to optimize workflow.
* **Backend Endpoint**: `POST /api/customers` in `CustomersController.cs`.
* **Frontend View**: `/staff/customers` page (via **Register Customer** modal).
* **How to Verify**:
  1. Log in as a Staff member or Admin.
  2. Go to the **Customers** dashboard page.
  3. Click **Register Customer & Vehicle**, enter customer email, password, and vehicle make/model/license plate, then submit.

### Feature 7: Staff can sell vehicle parts and create sales invoices
* **Description & Logic**: Generates customer sales receipts. Deducts quantities from the database inventory, calculates subtotals, checks loyalty discounts, and generates a sales invoice.
* **Backend Endpoint**: `POST /api/sales` in `SalesController.cs`.
* **Frontend View**: `/staff/sales` page (via **Create Sales Invoice** modal).
* **How to Verify**:
  1. Go to the **Sales** page.
  2. Click **Create Sales Invoice**, select a customer, specify parts and quantities, and choose the payment status (Paid, Unpaid, or Pending).
  3. Submit to process the invoice and auto-deduct part stock.

### Feature 8: Staff can view customer details, history, and vehicle info
* **Description & Logic**: Comprehensive overview of customer profiles, registered vehicles, and history grids.
* **Backend Endpoint**: `GET /api/customers/{id}` in `CustomersController.cs`.
* **Frontend View**: `/staff/customers` (by clicking on a customer in the list).
* **How to Verify**:
  1. In the **Customers** tab, locate a customer and click **View Details**.
  2. View their profile, list of owned vehicles, and transaction history.

### Feature 9: Staff can generate customer-related reports (regulars, high spenders, pending credits)
* **Description & Logic**: Analyzes customer statistics to classify customers into groups.
* **Backend Endpoints**:
  * `/api/sales/reports/regulars` (Customers with 3+ purchases)
  * `/api/sales/reports/high-spenders` (Top high spenders)
  * `/api/sales/reports/pending-credits` (Invoices marked unpaid or pending)
* **Frontend View**: `/staff/reports` page.
* **How to Verify**:
  1. Click **Reports** in the staff header.
  2. Click through the tabs: **Revenue Summary**, **Regular Customers**, **High Spenders**, and **Pending Credits**.

### Feature 10: Staff can search customers by vehicle number, phone, ID, or name
* **Description & Logic**: Single-query projection lookup searching matching fields across customer profiles and vehicle license numbers.
* **Backend Endpoint**: `GET /api/customers/search?query={searchQuery}` in `CustomersController.cs`.
* **Frontend View**: `/staff/customers` search bar.
* **How to Verify**:
  1. On the **Customers** page, type a phone number, name, ID, or vehicle number in the search bar.
  2. The table filters immediately using a projected database-level query.

### Feature 11: Staff can send invoices via email to customers
* **Description & Logic**: Marks a customer sales invoice email status as sent in the system.
* **Backend Endpoint**: `POST /api/sales/{id}/send-email` in `SalesController.cs`.
* **Frontend View**: `/staff/sales` invoice detail modal.
* **How to Verify**:
  1. In the **Sales** page, click **View Invoice** on any record.
  2. Click **Send Invoice via Email**. The status badge changes to **Email Dispatched**.

---

## 🚗 Customer Features

### Feature 12: Customers can self-register and manage profile & vehicle details
* **Description & Logic**: Self-service account sign up, profile editing, and vehicle fleet management.
* **Backend Endpoints**: `CustomerPortalController.cs` (`profile` and `vehicles` routes).
* **Frontend Views**: `/register` page and `/customer/dashboard` (under **Manage Vehicles** and **Profile & Security** tabs).
* **How to Verify**:
  1. Register a new account at `/register`.
  2. Log in and navigate to **Profile & Account Security** to modify details, or **Manage Vehicles** to add, edit, or delete personal cars.

### Feature 13: Customers can book appointments, request unavailable parts, and review services
* **Description & Logic**: Self-service request system for appointments, custom parts procurement, and service feedback.
* **Backend Endpoints**:
  * `POST /api/appointments` (Book appointment - at least 1 hour in advance)
  * `POST /api/partrequests` (Request part)
  * `POST /api/customer-portal/reviews` (Submit rating and comment)
* **Frontend View**: `/customer/dashboard` portal tabs (**Book Appointments**, **Unavailable Parts Request**, and **Service Feedback**).
* **How to Verify**:
  1. Under the **Book Appointments** tab, select a date/time and vehicle, then submit.
  2. Under the **Unavailable Parts Request** tab, enter a part name and submit.
  3. Under the **Service Feedback** tab, select a past invoice, select a rating, write comments, and submit.

### Feature 14: Customers can view their purchase/service history
* **Description & Logic**: Customer history tracker displaying details of all parts purchased and maintenance services completed.
* **Backend Endpoint**: `GET /api/customer-portal/history` in `CustomerPortalController.cs`.
* **Frontend View**: `/customer/dashboard` under the **Purchase & Service History** tab.
* **How to Verify**:
  1. In the customer dashboard, click **Purchase & Service History**.
  2. View the history list showing invoice numbers, dates, applied discounts, vehicles, and item breakdowns.

---

## ⚙️ Automation & Policies

### Feature 15: System automatically notifies Admin for low stock (<10) and sends email reminders to customers with unpaid credits for more than 1 month
* **Description & Logic**:
  * **Low Stock Notification**: Triggers when parts level drops below 10. Logs a warning notification instantly in the database.
  * **Unpaid Balance Reminders**: A background thread running daily checks for any invoices marked unpaid or pending with a `SaleDate` older than 1 month. It flags them and registers dispatch logs.
* **Backend Code**: `NotificationBackgroundService.cs` (unpaid balances check) and `/api/sales` endpoint (low stock check).
* **How to Verify**:
  1. Create a Sales Invoice that reduces any part's stock level to under 10.
  2. Log in as Admin. A red notification badge will display in the header, listing the low-stock parts.

### Feature 16: Loyalty Program: Customers get 10% discount if they spend more than 5000 in a single purchase
* **Description & Logic**: Automatically applies a 10% discount to any sales invoice subtotal if it exceeds 5,000.
* **Backend Code**: `SalesController.cs` inside the sales transaction processing logic:
  ```csharp
  if (subtotal > 5000)
  {
      invoice.DiscountPercent = 10;
      invoice.DiscountAmount = subtotal * 0.10m;
      invoice.TotalAmount = subtotal - invoice.DiscountAmount;
  }
  ```
* **How to Verify**:
  1. In the **Sales** tab, create a new sales invoice.
  2. Select parts that add up to a subtotal of 5,050.
  3. The invoice creator will show a 10% discount applied and deduct 505.00 from the final total.

---

## 🧭 Customer Guidance

Use this as the practical customer flow for the system:

1. Register first at `/register` with your name, email, phone number, and password.
2. Sign in and complete your profile so the garage can contact you easily.
3. Add every vehicle you own, including make, model, year, and license plate.
4. Book an appointment when your vehicle needs service, and choose the correct vehicle.
5. Request unavailable parts only when the item is not in stock, so staff can source it for you.
6. Leave a service review after a completed invoice so the team can track service quality.
7. Review your purchase and service history regularly to track spending, discounts, and past work.
8. Watch for loyalty savings on large purchases and make sure unpaid invoices are cleared on time.

### What customers should expect

* The profile area is for personal details and password management.
* The vehicle area is for maintaining one or more cars linked to your account.
* The booking and request features are for service scheduling and special part requests.
* The history area is for past purchases, service jobs, and discount records.
* Loyalty discounts apply automatically when a single purchase exceeds 5,000.

### Best customer workflow

1. Register.
2. Update profile.
3. Add vehicles.
4. Book service or request parts.
5. Review completed service.
6. Check history and payments.
