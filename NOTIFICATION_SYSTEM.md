# 🔔 Complete Notification System - HospitalCare

## Overview
The system includes **3 types of notifications** to keep patients and doctors informed throughout the appointment lifecycle:

---

## 1️⃣ Appointment Approval Notification ✅

### **Trigger:** 
Doctor approves a patient's appointment request

### **Recipients:**
- **Patient** (instant notification)

### **Channels:**
- 📧 **Email** - Professional HTML email with appointment details
- 💬 **WhatsApp** - Instant message with confirmation

### **Message Content:**
```
🏥 HospitalCare System

✅ Appointment Approved!

Dear [Patient Name],

Your appointment with Dr. [Doctor Name] has been approved!

📅 Date: [Full Date]
🕐 Time: [Start Time]
🏥 Specialization: [Doctor's Specialization]
📝 Notes: [Any notes from doctor]

You will receive reminders before your appointment.

Thank you! - HospitalCare System
```

### **Implementation:**
- File: `backend/controllers/appointment/appointmentController.js`
- Function: `approveAppointment()`
- Status: ✅ **ACTIVE**

---

## 2️⃣ Appointment Reminder Notifications ⏰

### **Trigger:**
Automated background scheduler checks every 5 minutes

### **Recipients:**
- **Patient** AND **Doctor** (both receive reminders)

### **Channels:**
- 📧 **Email** - Professional HTML template
- 💬 **WhatsApp** - Formatted message
- 📱 **SMS** (optional) - Short text message

### **Schedule:**
| **Timing** | **Window** | **Purpose** |
|------------|-----------|-------------|
| **24 Hours Before** | 23-24h | First advance notice |
| **2 Hours Before** | 1.5-2h | Day-of reminder |
| **15 Minutes Before** | 10-15min | Final urgent reminder |

### **Message Content (WhatsApp):**
```
🏥 HospitalCare System

⏰ Appointment Reminder (24 hours before)

Dear [Name],

You have an appointment with [Dr. Name / Patient Name]

📅 Date: [Date]
🕐 Time: [Time]
🏥 Specialization: [Specialization]

Please arrive 10 minutes early.

Thank you! - HospitalCare System
```

### **Implementation:**
- Scheduler: `backend/services/reminderScheduler.js`
- Email Service: `backend/services/emailService.js`
- WhatsApp/SMS: `backend/services/whatsappService.js`
- Auto-start: `backend/server.js` (runs on server startup)
- Status: ✅ **ACTIVE** (runs every 5 minutes)

### **Tracking:**
- Each reminder is tracked in database
- Prevents duplicate notifications
- Logs in Appointment model:
  ```javascript
  reminders: {
    twentyFourHours: { sent: true, patientSent: true, doctorSent: true, sentAt: Date },
    twoHours: { sent: true, ... },
    fifteenMinutes: { sent: true, ... }
  }
  ```

---

## 3️⃣ Second Opinion Completion Notification 🏥

### **Trigger:**
Doctor submits their medical opinion for a second opinion case

### **Recipients:**
- **Patient** (instant notification)

### **Channels:**
- 📧 **Email** - Detailed HTML email with opinion summary
- 💬 **WhatsApp** - Quick notification with key points

### **Message Content (Email):**
```html
🏥 HospitalCare System
Second Opinion Ready

✅ Opinion Submitted

Hello [Patient Name],

Great news! Dr. [Doctor Name] has submitted their second opinion for your case.

Medical Opinion Summary:

🔬 Diagnosis: [Full diagnosis]
💊 Recommendations: [Treatment recommendations]
💉 Prescribed Treatment: [Treatment plan]
📝 Additional Notes: [Any additional notes]

Please log in to your account to view the complete details.

Thank you! - HospitalCare System
```

### **Message Content (WhatsApp):**
```
🏥 HospitalCare System

✅ Second Opinion Ready!

Dear [Patient Name],

Dr. [Doctor Name] has submitted their medical opinion for your case.

🔬 Diagnosis: [Diagnosis]

💊 Key Recommendations: [First 100 chars...]

Please log in to view the complete second opinion and all details.

Thank you! - HospitalCare System
```

### **Implementation:**
- File: `backend/controllers/doctor/secondOpinionReviewController.js`
- Function: `submitOpinion()`
- Status: ✅ **ACTIVE**

---

## 📊 Notification Summary Matrix

| **Event** | **Trigger** | **Recipient** | **Email** | **WhatsApp** | **SMS** | **Timing** |
|-----------|-------------|---------------|-----------|--------------|---------|------------|
| Appointment Approved | Doctor clicks Approve | Patient | ✅ | ✅ | ❌ | Instant |
| 24h Reminder | Auto (scheduler) | Patient + Doctor | ✅ | ✅ | Optional | 24h before |
| 2h Reminder | Auto (scheduler) | Patient + Doctor | ✅ | ✅ | Optional | 2h before |
| 15min Reminder | Auto (scheduler) | Patient + Doctor | ✅ | ✅ | Optional | 15min before |
| Second Opinion Ready | Doctor submits opinion | Patient | ✅ | ✅ | ❌ | Instant |

---

## 🔧 Configuration Required

### **Email (Gmail):**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### **WhatsApp/SMS (Twilio):**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_REMINDERS=false
```

---

## 🧪 Testing Each Notification Type

### **Test 1: Appointment Approval**
1. Login as Patient → Book Appointment
2. Login as Doctor → Approve Appointment
3. Check Patient's Email & WhatsApp
4. Expected: Instant approval notification

### **Test 2: Appointment Reminders**
1. Book appointment 24 hours in future
2. Ensure status is 'approved'
3. Wait for scheduler (runs every 5 minutes)
4. Check backend console logs
5. Check both Patient & Doctor Email/WhatsApp
6. Expected: Reminders at 24h, 2h, 15min before

### **Test 3: Second Opinion Completion**
1. Patient submits second opinion request
2. Doctor reviews case
3. Doctor submits diagnosis & recommendations
4. Check Patient's Email & WhatsApp
5. Expected: Instant completion notification

---

## 📱 Backend Console Logs

### **Successful Notification Example:**
```
📧 Sending appointment approval notifications to patient...
✅ Email sent to patient: patient@example.com
✅ WhatsApp sent to patient: +923001234567
   Message SID: SM3a7f8b9c1d2e3f4g5h6i7j8k9l0m1n2o
✅ Approval notifications sent to patient
```

### **Reminder Scheduler Logs:**
```
🔍 Checking for appointment reminders at 12/18/2025, 10:30:00 AM
📋 Found 7 upcoming appointment(s)

⏰ 24-hour reminder for appointment 67a8b...
   Patient: Email=✅, WhatsApp=✅, SMS=❌
   Doctor: Email=✅, WhatsApp=✅, SMS=❌
✅ Reminder status updated in database

✅ Reminder check completed
```

### **Second Opinion Notification Logs:**
```
📧 Sending second opinion completion notifications to patient...
✅ Email sent to patient: patient@example.com
✅ WhatsApp sent to patient: +923001234567
   Message SID: SM4b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q
✅ Second opinion completion notifications sent
```

---

## ⚠️ Troubleshooting

### **No Notifications Received:**

1. **Check Environment Variables:**
   - Verify `.env` has real credentials (not placeholders)
   - Restart server after updating `.env`

2. **Check Backend Console:**
   - Look for error messages
   - Common errors:
     - `Invalid login` → Gmail app password wrong
     - `accountSid must start with AC` → Twilio credentials wrong
     - `21608 - Not in sandbox` → User hasn't joined WhatsApp sandbox

3. **Check User Data:**
   - Ensure patient/doctor has `email` field
   - Ensure patient/doctor has `phone` field
   - Phone format: 03001234567 or +923001234567

4. **Check Appointment Status:**
   - Reminders only sent for 'approved' or 'pending' appointments
   - Appointment date must be in future

---

## 🎯 Production Considerations

### **Email Rate Limits:**
- Gmail: 500 emails/day (free)
- Consider SendGrid/Mailgun for production

### **WhatsApp Business:**
- Sandbox: Testing only (requires "join" message)
- Production: Need approved WhatsApp Business Account

### **SMS Costs:**
- Twilio charges per SMS (~$0.04 per message)
- Keep `ENABLE_SMS_REMINDERS=false` unless needed

### **Monitoring:**
- Check Twilio console for message delivery logs
- Monitor Gmail sent folder
- Set up error logging (Sentry, etc.)

---

## ✅ Feature Status

| **Feature** | **Status** | **Implementation** |
|-------------|------------|-------------------|
| Appointment Approval Notification | ✅ Complete | Instant Email + WhatsApp |
| 24h Reminder (Patient & Doctor) | ✅ Complete | Auto-scheduled |
| 2h Reminder (Patient & Doctor) | ✅ Complete | Auto-scheduled |
| 15min Reminder (Patient & Doctor) | ✅ Complete | Auto-scheduled |
| Second Opinion Notification | ✅ Complete | Instant Email + WhatsApp |
| SMS Support | ✅ Optional | Configurable via .env |
| Duplicate Prevention | ✅ Complete | Database tracking |
| Error Handling | ✅ Complete | Graceful fallbacks |

---

## 📄 Files Modified/Created

### **Services:**
- ✅ `backend/services/emailService.js` - Email notification handler
- ✅ `backend/services/whatsappService.js` - WhatsApp/SMS handler  
- ✅ `backend/services/reminderScheduler.js` - Automated scheduler

### **Controllers:**
- ✅ `backend/controllers/appointment/appointmentController.js` - Approval notifications
- ✅ `backend/controllers/doctor/secondOpinionReviewController.js` - Second opinion notifications

### **Models:**
- ✅ `backend/models/Appointment.js` - Added reminder tracking fields

### **Server:**
- ✅ `backend/server.js` - Auto-start scheduler

### **Configuration:**
- ✅ `backend/.env` - Added notification credentials

---

**All notification features are now ACTIVE and ready for testing!** 🎉
