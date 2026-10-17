# TTRC Store — Feature Priority Backlog

**Framework:** Weighted Value vs Risk vs Complexity Scoring  
**Focus:** High-conversion robotics commerce, builder trust, checkout completion, and operational reliability.

---

## 1. Ranked Feature Priority Matrix

| Rank | Feature | Priority Level | Customer & Business Impact | Effort | Risk | Dependencies |
|:---:|:---|:---:|:---|:---:|:---:|:---|
| **1** | **Interactive Bundle & Spare Part Kit Builder** | `P0 (Delivered)` | High basket value increase; guarantees zero mechanical mismatch for robot kits. | Medium | Low | None (uses existing `ProductCompatibilityModel` & `useCartStore`) |
| **2** | **Safe Payment Retries & Stock Leak Prevention** | `P0 (Delivered)` | Prevents lost sales, overselling, and ghost stock lockouts on payment failure. | Low | Critical | MongoDB Atlas, Razorpay Webhook |
| **3** | **Interactive Hardware Compatibility Checker** | `P0 (Delivered)` | Reduces technical support load & returns from students buying mismatched 3.3V/5V logic or underpowered motors. | Medium | Low | Client Component |
| **4** | **Guest Order Tracking with Direct Courier Links** | `P0 (Delivered)` | Drastically reduces "Where is my order?" (WISMO) support queries from guest buyers. | Low | Low | Delhivery / Shiprocket / Courier AWB URL |
| **5** | **Downloadable PDF Manuals, Wiring Schematics & In-Box Checklist** | `P1 (Next Release)` | Essential for engineering students and competition teams needing pinouts before buying. | Low | Low | MongoDB Media GridFS / Storage |
| **6** | **Search Typo Tolerance & Technical Spec Filtering** | `P1 (Next Release)` | Enables search for part variations (e.g., "L298", "L298N", "Arduino Uno R3", "3.3V sensor"). | Medium | Low | MongoDB Atlas Search (or custom regex index) |
| **7** | **Back-in-Stock Notification Alerts** | `P2` | Recaptures lost sales when popular components (motors, controllers) replenish. | Medium | Low | Resend Email API / WhatsApp notification |
| **8** | **Guest Cart Server Synchronization on Login** | `P2` | Preserves cart across devices when student logs in on mobile after browsing on laptop. | Medium | Low | MongoDB User Cart Model |
| **9** | **Recently Viewed Products Carousel** | `P3` | Mild conversion bump for returning customers. | Low | Low | LocalStorage |

---

## 2. Top Three Feature Release Recommendations

### Feature 1: Interactive Component Compatibility Checking
- **Customer Benefit:** Robotics students and hobbyists frequently struggle with voltage mismatches (e.g. connecting a 5V Arduino directly to a 3.3V ESP32 sensor, or burning out microcontroller pins by attempting to power DC motors directly from 5V logic headers). The compatibility checker provides instant validation and level-shifter guidance.
- **Implementation Cost:** Minimal (Client UI logic evaluated against existing `ProductSchema` fields).
- **External Dependencies:** None.

### Feature 2: Robust Payment Recovery & Stock Idempotency
- **Customer Benefit:** Customers whose payment gets declined or dismissed no longer lose their cart or get locked out of purchasing the last unit in stock. Retries are seamless and instant.
- **Implementation Cost:** Low (Built directly into `createOrderAction`, `releasePendingOrderAction`, and Razorpay Webhook).
- **External Dependencies:** Razorpay gateway events.

### Feature 3: Project-Based Robotics Bundles
- **Customer Benefit:** Instead of browsing 10 different pages to assemble a Line Follower or Robo Race car, builders can buy a complete tested package (chassis + motors + sensors + driver) with a single click, saving money and time.
- **Implementation Cost:** Low to Medium (Implemented via `ProductBundleBox`).
- **External Dependencies:** None.
