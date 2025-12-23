# 💳 Online Payment System - Testing Guide

## 🎯 Feature Overview

**Simulated Payment System** for online medical consultations:
- ✅ **NO REAL MONEY** is transferred
- ✅ Demonstrates complete payment workflow
- ✅ Admin controls and refunds
- ✅ Digital invoice generation

---

## 🚀 Quick Start

### 1. Start Backend & Frontend

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend-react
npm run dev
```

**Servers:**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## 📋 Test Scenarios

### **Scenario 1: Patient Makes Payment for Consultation**

#### Step 1: Book Appointment (Patient)
1. Login as **Patient**
   - Email: `mahammirza08@gmail.com`
   - Password: (your password)

2. **Book Appointment**
   - Go to "Book Appointment"
   - Select doctor (Dr Ahmad)
   - Choose date & time
   - Submit request

3. **Wait for Doctor Approval**
   - Doctor must approve first
   - You'll receive email notification

#### Step 2: Approve Appointment (Doctor)
1. Logout and login as **Doctor**
   - Email: `233798@students.au.edu.pk`
   - Password: (your password)

2. **Approve Appointment**
   - Go to "Appointment Requests"
   - Click "Approve" on pending appointment

#### Step 3: Make Payment (Patient)
1. Login as **Patient** again

2. **Process Payment**
   - Go to approved appointment
   - Click "Pay for Consultation"
   - Select payment method:
     - ✅ Credit Card
     - ✅ Debit Card
     - ✅ Easypaisa
     - ✅ JazzCash
     - ✅ Stripe
     - ✅ PayPal
     - ✅ Apple Pay
     - ✅ Google Pay

3. **Enter Card Details (Simulated)**
   - Card number: `4111111111111111` (test card)
   - Last 4 digits: `1111`
   - Expiry: `12/25`
   - CVV: `123`

4. **Submit Payment**
   - ⏳ System simulates 1.5 second processing
   - ✅ Payment status changes to "Paid"
   - 📧 Confirmation email sent

#### Step 4: View Invoice
1. After payment success:
   - Click "Download Invoice" button
   - PDF invoice is generated automatically
   - Invoice includes:
     - Patient & Doctor details
     - Appointment date/time
     - Payment method
     - Transaction ID
     - Amount (PKR 2,000)
     - Invoice number

**Expected Console Output:**
```
💳 Payment processed successfully for appointment 67abc...
   Transaction ID: TXN-1734567890-ABC123DEF
   Amount: PKR 2000
   Method: credit_card
✅ Invoice generated: INV-202512-XYZ789
```

---

### **Scenario 2: View Payment History**

#### Patient View
1. Login as **Patient**
2. Go to "Payment History" (add this to your frontend)
3. See all payments:
   - Transaction ID
   - Amount
   - Date
   - Status
   - Doctor name
   - Download invoice button

**API Endpoint:**
```http
GET /api/payments/patient/history
Authorization: Bearer <patient_token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "67abc123...",
      "transactionId": "TXN-1734567890-ABC123",
      "amount": 2000,
      "currency": "PKR",
      "paymentMethod": "credit_card",
      "status": "paid",
      "invoiceNumber": "INV-202512-XYZ789",
      "doctor": {
        "name": "Dr Ahmad",
        "specialization": "Cardiology"
      }
    }
  ]
}
```

---

### **Scenario 3: Doctor Cancels → Patient Requests Refund**

#### Step 1: Doctor Cancels Appointment
1. Login as **Doctor**
2. Find paid appointment
3. Cancel appointment with reason

#### Step 2: Patient Requests Refund
1. Login as **Patient**
2. Go to paid appointment
3. Click "Request Refund"
4. Enter reason: "Doctor cancelled the appointment"

**API Call:**
```http
POST /api/payments/:paymentId/refund-request
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "reason": "Doctor cancelled the appointment"
}
```

**Expected Result:**
- Payment status: `paid` → `refund_requested`
- Notification sent to admin
- Patient sees "Refund Pending" status

---

### **Scenario 4: Admin Processes Refund**

#### Admin Dashboard
1. Login as **Admin**
   - Email: `admin@hospital.com`
   - Password: (admin password)

2. **View Refund Requests**
   - Go to "Payment Management"
   - See "Refund Requests" tab
   - List of all pending refunds

**API Endpoint:**
```http
GET /api/payments/admin/refund-requests
Authorization: Bearer <admin_token>
```

3. **Process Refund**
   - Click "Review" on refund request
   - See details:
     - Patient name
     - Doctor name
     - Payment amount
     - Refund reason
     - Appointment details
   
   - Click "Approve Refund"
   - Add admin notes: "Refund approved - doctor cancelled"

**API Call:**
```http
PUT /api/payments/admin/:paymentId/process-refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adminNotes": "Refund approved - doctor cancelled"
}
```

**Expected Result:**
- Payment status: `refund_requested` → `refunded`
- Refund amount: PKR 2,000
- Appointment status: `cancelled`
- Patient receives refund confirmation email
- Updated invoice shows refund

**Console Output:**
```
✅ Refund processed by admin for payment 67abc123...
   Amount: PKR 2000
   Admin: Admin User
```

---

### **Scenario 5: Admin Rejects Refund**

1. Admin reviews refund request
2. Clicks "Reject Refund"
3. Adds reason: "Consultation was completed"

**API Call:**
```http
PUT /api/payments/admin/:paymentId/reject-refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adminNotes": "Consultation was completed, no refund applicable"
}
```

**Result:**
- Payment status: `refund_requested` → `paid`
- Patient notified of rejection

---

## 🔍 Admin Dashboard Features

### Payment Statistics

**API Endpoint:**
```http
GET /api/payments/admin/statistics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPayments": 45,
    "paidPayments": 38,
    "pendingPayments": 3,
    "refundRequests": 2,
    "refundedPayments": 2,
    "totalRevenue": 76000,
    "totalRefunded": 4000,
    "netRevenue": 72000
  },
  "paymentMethodsStats": [
    { "_id": "credit_card", "count": 15, "totalAmount": 30000 },
    { "_id": "easypaisa", "count": 12, "totalAmount": 24000 },
    { "_id": "jazzcash", "count": 11, "totalAmount": 22000 }
  ]
}
```

### All Payments View

**API Endpoint:**
```http
GET /api/payments/admin/all?status=paid&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Filters:**
- `status`: paid, pending, refunded, refund_requested
- `startDate`: 2025-12-01
- `endDate`: 2025-12-31
- `page`: pagination
- `limit`: results per page

---

## 💰 Doctor Earnings View

#### Doctor Dashboard
1. Login as **Doctor**
2. Go to "My Earnings"

**API Endpoint:**
```http
GET /api/payments/doctor/earnings
Authorization: Bearer <doctor_token>
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "totalEarnings": 30000,
  "refundedAmount": 2000,
  "netEarnings": 28000,
  "data": [
    {
      "transactionId": "TXN-123...",
      "amount": 2000,
      "status": "paid",
      "patient": {
        "name": "John Doe"
      },
      "createdAt": "2025-12-19T..."
    }
  ]
}
```

---

## 📄 Invoice System

### Generate Invoice

**Manual Generation (if not auto-generated):**
```http
POST /api/invoices/generate/:paymentId
Authorization: Bearer <token>
```

### Download Invoice

```http
GET /api/invoices/download/:invoiceNumber
Authorization: Bearer <token>
```

**Response:** PDF file download

### View Invoice in Browser

```http
GET /api/invoices/view/:invoiceNumber
Authorization: Bearer <token>
```

**Response:** PDF displayed inline

### Invoice Content

✅ Hospital branding and header  
✅ Invoice number and transaction ID  
✅ Patient information  
✅ Doctor information  
✅ Appointment details  
✅ Payment method  
✅ Amount breakdown  
✅ Payment status  
✅ Refund information (if applicable)  
✅ **Simulation warning** (no real payment)  
✅ Professional footer  

---

## 🧪 API Testing with Postman/Thunder Client

### 1. Process Payment
```http
POST http://localhost:5000/api/payments/process
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "appointmentId": "67abc123def456...",
  "paymentMethod": "credit_card",
  "cardLastFourDigits": "1111",
  "notes": "Payment for online consultation"
}
```

### 2. Get Payment Details
```http
GET http://localhost:5000/api/payments/:paymentId
Authorization: Bearer <token>
```

### 3. Get Payment by Appointment
```http
GET http://localhost:5000/api/payments/appointment/:appointmentId
Authorization: Bearer <token>
```

### 4. Request Refund
```http
POST http://localhost:5000/api/payments/:paymentId/refund-request
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "reason": "Doctor unavailable"
}
```

### 5. Admin - Process Refund
```http
PUT http://localhost:5000/api/payments/admin/:paymentId/process-refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "adminNotes": "Refund approved"
}
```

---

## 📊 Payment Status Flow

```
pending → paid → completed
   ↓        ↓
   ↓    refund_requested → refunded
   ↓                    ↘ rejected (back to paid)
   ↓
cancelled
```

---

## ⚠️ Important Notes

### Simulation Mode
- **NO REAL MONEY** is transferred
- All transactions are simulated
- Payment processing has 1.5 second delay (mimics real processing)
- Transaction IDs are auto-generated (TXN-timestamp-random)
- Invoice numbers are auto-generated (INV-YYYYMM-random)

### Demo Payment Details
- **Default Amount:** PKR 2,000 per consultation
- **Currency:** PKR (Pakistani Rupee)
- **Test Card:** 4111 1111 1111 1111
- **Success Rate:** 100% (always successful in demo)

### Security
- All endpoints require authentication
- Role-based access control
- Patients can only see their payments
- Doctors can only see their earnings
- Admin has full access

---

## 🎨 Frontend Integration (TODO)

### Payment Button Component
```jsx
<button onClick={handlePayment}>
  💳 Pay PKR 2,000
</button>
```

### Payment Modal
```jsx
<PaymentModal 
  appointment={appointment}
  amount={2000}
  onSuccess={handlePaymentSuccess}
  onCancel={handleCancel}
/>
```

### Payment Method Selector
```jsx
<PaymentMethodSelector
  methods={[
    'credit_card',
    'debit_card',
    'easypaisa',
    'jazzcash',
    'stripe',
    'paypal'
  ]}
  onSelect={handleMethodSelect}
/>
```

---

## ✅ Testing Checklist

- [ ] Patient can process payment for approved appointment
- [ ] Payment generates unique transaction ID
- [ ] Invoice is auto-generated after payment
- [ ] Patient can download invoice PDF
- [ ] Patient can view payment history
- [ ] Doctor can see earnings dashboard
- [ ] Patient can request refund
- [ ] Admin receives refund request notification
- [ ] Admin can approve refund
- [ ] Admin can reject refund
- [ ] Payment status updates correctly
- [ ] Appointment status updates after refund
- [ ] Invoice shows refund information
- [ ] Admin can view all payments
- [ ] Admin can view payment statistics
- [ ] Payment methods are tracked correctly

---

## 🐛 Troubleshooting

**Issue:** Payment not processing
- Check if appointment is approved
- Check if payment already exists
- Verify authentication token

**Issue:** Invoice not generating
- Check if PDFKit is installed: `npm list pdfkit`
- Check backend logs for errors
- Verify invoices directory exists

**Issue:** Refund not working
- Payment must be in "paid" status
- Only patients/doctors can request
- Only admin can process

---

## 📞 Support

Console logs will show:
- Payment processing
- Invoice generation
- Refund actions
- Transaction IDs

Watch backend terminal for detailed logs! 🔍
