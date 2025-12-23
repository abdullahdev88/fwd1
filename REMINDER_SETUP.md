# Appointment Reminder System - Setup Guide

## Overview
Automated appointment reminder system that sends notifications via **Email**, **WhatsApp**, and **SMS** to both patients and doctors at **24 hours**, **2 hours**, and **15 minutes** before appointments.

---

## 📋 Features
✅ **Multi-Channel Notifications**: Email, WhatsApp, SMS  
✅ **Automated Scheduling**: Runs every 5 minutes to check appointments  
✅ **Dual Recipient**: Sends reminders to both patients and doctors  
✅ **Smart Tracking**: Prevents duplicate reminders  
✅ **Beautiful Email Templates**: Professional HTML emails  

---

## 🔧 Configuration

### 1. Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Update `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### 2. WhatsApp Setup (Twilio)

1. **Create Twilio Account**: https://www.twilio.com/try-twilio
2. **Get Credentials**:
   - Account SID (from dashboard)
   - Auth Token (from dashboard)
   - WhatsApp Sandbox Number (for testing)

3. **Activate WhatsApp Sandbox**:
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Send "join <your-sandbox-code>" to the Twilio number from your WhatsApp
   - Repeat for all test phone numbers

4. **Update `.env` file**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. SMS Setup (Twilio - Optional)

1. **Get Twilio Phone Number**:
   - Purchase a phone number from Twilio console
   - Or use trial number (limited to verified numbers)

2. **Update `.env` file**:
```env
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_REMINDERS=true
```

---

## 🚀 How It Works

### Scheduler Flow
```
Server Starts → Scheduler Initializes → Runs Every 5 Minutes
                                        ↓
                        Check All Upcoming Appointments
                                        ↓
                        Calculate Time Until Appointment
                                        ↓
                    ┌──────────────┬────────────┬───────────────┐
                    ↓              ↓            ↓               ↓
              24h Before    2h Before    15min Before    Already Sent?
                    ↓              ↓            ↓               ↓
            Send Reminders → Update DB → Mark as Sent → Skip
```

### Reminder Timeline
- **24 Hours Before**: First reminder (full details)
- **2 Hours Before**: Second reminder (shorter message)
- **15 Minutes Before**: Final urgent reminder

### Notification Channels
Each reminder is sent via:
1. 📧 **Email** - Professional HTML template with appointment details
2. 💬 **WhatsApp** - Formatted message with emojis
3. 📱 **SMS** - Short text message (if enabled)

---

## 📱 Phone Number Format

The system automatically formats phone numbers to international format:
- **Pakistan**: Adds +92 prefix
- Removes leading zeros
- Converts to E.164 format

**Examples**:
```
Input: 03001234567  → Output: +923001234567
Input: 3001234567   → Output: +923001234567
Input: +923001234567 → Output: +923001234567
```

---

## 🧪 Testing

### Option 1: Create Test Appointment (Recommended)

1. **Book an appointment** in the frontend:
   - Choose a date/time within 24 hours
   - Ensure status is 'approved'

2. **Wait for scheduler** (runs every 5 minutes):
   - Check backend console for logs
   - Watch for "⏰ Reminder sent" messages

### Option 2: Manual Test Function

Create a test route in `server.js`:

```javascript
const { sendTestReminder } = require('./services/reminderScheduler');

app.post('/api/test-reminder/:appointmentId', async (req, res) => {
  try {
    const result = await sendTestReminder(req.params.appointmentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Then test with:
```bash
curl -X POST http://localhost:5000/api/test-reminder/YOUR_APPOINTMENT_ID
```

---

## 📊 Monitoring

### Backend Console Logs

The scheduler provides detailed logging:

```
🔍 Checking for appointment reminders at 12/17/2025, 2:30:00 PM
📋 Found 3 upcoming appointment(s)

⏰ 24-hour reminder for appointment 67a8b...
   Patient: Email=✅, WhatsApp=✅, SMS=❌
   Doctor: Email=✅, WhatsApp=✅, SMS=❌
✅ Reminder status updated in database

✅ Reminder check completed
```

### Database Tracking

Check appointment reminders in MongoDB:
```javascript
{
  reminders: {
    twentyFourHours: {
      sent: true,
      sentAt: ISODate("2025-12-17T14:30:00Z"),
      patientSent: true,
      doctorSent: true
    },
    twoHours: { sent: false, ... },
    fifteenMinutes: { sent: false, ... }
  }
}
```

---

## 🔍 Troubleshooting

### Email Not Sending

**Issue**: `Error: Invalid login`
- **Solution**: Use App Password, not regular Gmail password
- Verify 2FA is enabled on Gmail account

**Issue**: `Error: connect ETIMEDOUT`
- **Solution**: Check firewall/antivirus blocking SMTP (port 587)

### WhatsApp Not Sending

**Issue**: `Error: 21608 - The number is not in the sandbox`
- **Solution**: Send "join <sandbox-code>" from recipient's WhatsApp to Twilio number

**Issue**: `Error: 20003 - Authentication Error`
- **Solution**: Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct

### Reminders Not Triggering

**Issue**: No reminders being sent
1. Check appointment status is 'approved' or 'pending'
2. Verify appointmentDate is in the future
3. Check patient and doctor have email/phone fields populated
4. Ensure scheduler is running (check console logs)

**Issue**: Duplicate reminders
- Database tracks sent reminders to prevent duplicates
- Check `reminders.{type}.sent` field in appointment document

---

## 📝 Example Messages

### Email Subject (Patient)
```
Appointment Reminder - Dr. Sarah Johnson
```

### WhatsApp Message (Patient)
```
🏥 *HospitalCare System*

⏰ *Appointment Reminder* (24 hours before)

Dear John Doe,

You have an appointment with *Dr. Sarah Johnson*

📅 Date: Wed, Dec 18, 2025
🕐 Time: 14:30
🏥 Specialization: Cardiology

Please arrive 10 minutes early.

Thank you! - HospitalCare System
```

### SMS Message (Patient)
```
Reminder (24hrs): Appointment with Dr. Sarah Johnson on Dec 18 at 14:30 - HospitalCare
```

---

## 🎯 Production Deployment

### Before Going Live:

1. **Switch to Production Twilio Number**:
   - Purchase dedicated phone number
   - Request WhatsApp Business approval (takes 1-2 weeks)
   - Update `TWILIO_WHATSAPP_FROM` with approved number

2. **Email Considerations**:
   - Consider using SendGrid/Mailgun for better deliverability
   - Gmail has daily sending limits (500 emails/day)

3. **Monitoring**:
   - Set up error logging (e.g., Sentry)
   - Monitor Twilio usage/costs
   - Track delivery rates

4. **Security**:
   - Never commit `.env` file to Git
   - Use environment-specific configs
   - Rotate API keys regularly

---

## 💰 Cost Estimates (Twilio)

- **WhatsApp**: $0.005 per message
- **SMS (Pakistan)**: ~$0.04 per message
- **Example**: 100 appointments/day × 3 reminders × 2 people = 600 messages/day
  - WhatsApp only: $3/day = $90/month
  - With SMS: ~$24/day = $720/month

**Recommendation**: Start with WhatsApp + Email only, enable SMS as premium feature.

---

## 🛠️ Future Enhancements

- [ ] Web dashboard for reminder analytics
- [ ] Custom reminder templates per doctor
- [ ] Patient preferences (opt-out channels)
- [ ] Multi-language support
- [ ] Retry failed notifications
- [ ] Real-time status tracking in frontend

---

## 📞 Support

For issues or questions:
1. Check logs in backend console
2. Verify environment variables
3. Test with single appointment first
4. Review Twilio/Gmail documentation

---

**Note**: Always test thoroughly in development before enabling in production!
