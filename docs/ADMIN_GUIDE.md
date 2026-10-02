# TTRC Store: Admin Panel Operating Guide (`docs/ADMIN_GUIDE.md`)

This guide explains how shop administrators and staff manage products, mapped spare parts, categories, order fulfillment, and customer refunds on `ttrc.store`.

---

## 1. Managing Products & Mapped Spare Parts

### 1.1 Adding a New Kit Product
1. Log in at `/admin` -> Navigate to **Products** -> Click **Add Product**.
2. Set **Product Type** to `kit`.
3. Select appropriate category (e.g. `Gamified Robots` -> `Robo Race`).
4. Enter Name, SKU, Price (in Rupees), MRP, HSN code, Stock quantity, Weight (in grams), and Country of Origin (`India`).
5. Upload product images (drag to re-order main thumbnail).
6. Click **Save Product**.

### 1.2 Mapping Compatible Spare Parts to a Kit
1. Edit or create a `spare_part` product.
2. In the **Compatible Kits** multi-select field, select all kits that this spare part fits (e.g., select *Robo Race Chassis Kit Pro*).
3. Save the spare part. It will instantly appear under **"Spare Parts for this Kit"** on the kit's product page!

---

## 2. Order Fulfillment & Shipping (Shiprocket)

1. Navigate to **Orders** in the Admin panel.
2. Click on an order in `Pending` or `Confirmed` status.
3. Click **Create Courier Shipment (Shiprocket)**.
4. Review length, width, height, and weight package specs.
5. Click **Assign AWB & Generate Tracking**.
6. The system will automatically update order status to `Packed` / `Shipped` and email the AWB tracking link to the customer!

---

## 3. Processing Customer Refunds

1. Navigate to **Orders** -> Open target order.
2. Click **Process Refund**.
3. Select Full or Partial refund amount.
4. Enter internal reason note (e.g., *Customer cancellation prior to dispatch*).
5. Click **Confirm Refund**. For Razorpay orders, the API will credit the customer's payment method. For COD orders, perform manual bank transfer.
