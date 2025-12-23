const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;

const initializeTwilioClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

/**
 * Format phone number to E.164 format (required by Twilio)
 * @param {String} phone - Phone number
 * @returns {String} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If number doesn't start with country code, add Pakistan's code (+92)
  if (!cleaned.startsWith('92') && !cleaned.startsWith('+92')) {
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '92' + cleaned;
  }
  
  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send WhatsApp appointment reminder
 * @param {Object} appointment - Appointment details with populated patient and doctor
 * @param {String} recipientType - 'patient' or 'doctor'
 * @param {String} reminderType - '24hours', '2hours', or '15minutes'
 */
const sendWhatsAppReminder = async (appointment, recipientType, reminderType) => {
  try {
    const client = initializeTwilioClient();
    
    if (!client) {
      console.log('⚠️ Twilio not configured. Skipping WhatsApp reminder.');
      return false;
    }

    const recipient = recipientType === 'patient' ? appointment.patient : appointment.doctor;
    const otherPerson = recipientType === 'patient' ? appointment.doctor : appointment.patient;
    
    if (!recipient || !recipient.phone) {
      console.log(`⚠️ No phone number found for ${recipientType}`);
      return false;
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const timeMapping = {
      '24hours': '24 hours',
      '2hours': '2 hours',
      '15minutes': '15 minutes'
    };

    // Create WhatsApp message
    const message = recipientType === 'patient'
      ? `🏥 *HospitalCare System*\n\n` +
        `⏰ *Appointment Reminder* (${timeMapping[reminderType]} before)\n\n` +
        `Dear ${recipient.name},\n\n` +
        `You have an appointment with *Dr. ${otherPerson.name}*\n\n` +
        `📅 Date: ${appointmentDate}\n` +
        `🕐 Time: ${appointment.startTime}\n` +
        `${otherPerson.specialization ? `🏥 Specialization: ${otherPerson.specialization}\n` : ''}` +
        `\nPlease arrive 10 minutes early.\n\n` +
        `Thank you! - HospitalCare System`
      : `🏥 *HospitalCare System*\n\n` +
        `⏰ *Appointment Reminder* (${timeMapping[reminderType]} before)\n\n` +
        `Dear Dr. ${recipient.name},\n\n` +
        `You have an appointment with patient *${otherPerson.name}*\n\n` +
        `📅 Date: ${appointmentDate}\n` +
        `🕐 Time: ${appointment.startTime}\n` +
        `${appointment.notes ? `📝 Notes: ${appointment.notes}\n` : ''}` +
        `\nThank you! - HospitalCare System`;

    // Format phone number
    const recipientPhone = formatPhoneNumber(recipient.phone);
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox number
    
    // Send WhatsApp message
    const sentMessage = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: `whatsapp:${recipientPhone}`
    });

    console.log(`✅ WhatsApp sent to ${recipientType}: ${recipientPhone} (${reminderType})`);
    console.log(`   Message SID: ${sentMessage.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${recipientType}:`, error.message);
    
    // Log specific Twilio errors
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`   More Info: ${error.moreInfo}`);
    }
    
    return false;
  }
};

/**
 * Send SMS appointment reminder
 * @param {Object} appointment - Appointment details with populated patient and doctor
 * @param {String} recipientType - 'patient' or 'doctor'
 * @param {String} reminderType - '24hours', '2hours', or '15minutes'
 */
const sendSMSReminder = async (appointment, recipientType, reminderType) => {
  try {
    const client = initializeTwilioClient();
    
    if (!client) {
      console.log('⚠️ Twilio not configured. Skipping SMS reminder.');
      return false;
    }

    const recipient = recipientType === 'patient' ? appointment.patient : appointment.doctor;
    const otherPerson = recipientType === 'patient' ? appointment.doctor : appointment.patient;
    
    if (!recipient || !recipient.phone) {
      console.log(`⚠️ No phone number found for ${recipientType}`);
      return false;
    }

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const timeMapping = {
      '24hours': '24hrs',
      '2hours': '2hrs',
      '15minutes': '15min'
    };

    // Create SMS message (shorter for SMS)
    const message = recipientType === 'patient'
      ? `Reminder (${timeMapping[reminderType]}): Appointment with Dr. ${otherPerson.name} on ${appointmentDate} at ${appointment.startTime} - HospitalCare`
      : `Reminder (${timeMapping[reminderType]}): Appointment with ${otherPerson.name} on ${appointmentDate} at ${appointment.startTime} - HospitalCare`;

    // Format phone number
    const recipientPhone = formatPhoneNumber(recipient.phone);
    
    // Send SMS
    const sentMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipientPhone
    });

    console.log(`✅ SMS sent to ${recipientType}: ${recipientPhone} (${reminderType})`);
    console.log(`   Message SID: ${sentMessage.sid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending SMS to ${recipientType}:`, error.message);
    
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
    }
    
    return false;
  }
};

module.exports = {
  sendWhatsAppReminder,
  sendSMSReminder,
  formatPhoneNumber
};
