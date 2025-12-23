const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send appointment reminder via email
 * @param {Object} appointment - Appointment details with populated patient and doctor
 * @param {String} recipientType - 'patient' or 'doctor'
 * @param {String} reminderType - '24hours', '2hours', or '15minutes'
 */
const sendAppointmentReminderEmail = async (appointment, recipientType, reminderType) => {
  try {
    const transporter = createTransporter();
    
    const recipient = recipientType === 'patient' ? appointment.patient : appointment.doctor;
    const otherPerson = recipientType === 'patient' ? appointment.doctor : appointment.patient;
    
    if (!recipient || !recipient.email) {
      console.log(`⚠️ No email found for ${recipientType}`);
      return false;
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const timeMapping = {
      '24hours': '24 hours',
      '2hours': '2 hours',
      '15minutes': '15 minutes'
    };

    const subject = recipientType === 'patient' 
      ? `Appointment Reminder - Dr. ${otherPerson.name}`
      : `Appointment Reminder - Patient: ${otherPerson.name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .detail-value { color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          .reminder-badge { background: #ff6b6b; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 HospitalCare System</h1>
            <p>Appointment Reminder</p>
          </div>
          <div class="content">
            <span class="reminder-badge">⏰ ${timeMapping[reminderType]} before appointment</span>
            
            <h2>Hello ${recipient.name},</h2>
            <p>${recipientType === 'patient' 
              ? `This is a friendly reminder about your upcoming appointment with Dr. ${otherPerson.name}.`
              : `This is a reminder about your upcoming appointment with ${otherPerson.name}.`
            }</p>
            
            <div class="appointment-card">
              <h3 style="color: #667eea; margin-top: 0;">Appointment Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">🕐 Time:</span>
                <span class="detail-value">${appointment.startTime} - ${appointment.endTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">${recipientType === 'patient' ? '👨‍⚕️ Doctor:' : '👤 Patient:'}</span>
                <span class="detail-value">${otherPerson.name}</span>
              </div>
              
              ${otherPerson.specialization ? `
              <div class="detail-row">
                <span class="detail-label">🏥 Specialization:</span>
                <span class="detail-value">${otherPerson.specialization}</span>
              </div>
              ` : ''}
              
              ${appointment.notes ? `
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">📝 Notes:</span>
              </div>
              <p style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">${appointment.notes}</p>
              ` : ''}
            </div>
            
            <p style="color: #666;">
              ${recipientType === 'patient' 
                ? 'Please arrive 10 minutes early for check-in. If you need to reschedule or cancel, please contact us as soon as possible.'
                : 'Please ensure you review the patient history before the appointment.'
              }
            </p>
            
            <div class="footer">
              <p>This is an automated reminder from HospitalCare System.</p>
              <p>For any queries, please contact us at ${process.env.EMAIL_USER || 'support@hospitalcare.com'}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"HospitalCare System" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientType}: ${recipient.email} (${reminderType})`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${recipientType}:`, error.message);
    return false;
  }
};

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmationEmail = async (appointment, recipientType) => {
  try {
    const transporter = createTransporter();
    
    const recipient = recipientType === 'patient' ? appointment.patient : appointment.doctor;
    const otherPerson = recipientType === 'patient' ? appointment.doctor : appointment.patient;
    
    if (!recipient || !recipient.email) {
      return false;
    }

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = recipientType === 'patient'
      ? 'Appointment Confirmed - HospitalCare System'
      : 'New Appointment Request - HospitalCare System';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #51cf66; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 HospitalCare System</h1>
          </div>
          <div class="content">
            <span class="success-badge">✅ Appointment ${appointment.status === 'approved' ? 'Approved' : 'Booked'}</span>
            <h2>Hello ${recipient.name},</h2>
            <p>Your appointment has been ${appointment.status === 'approved' ? 'approved' : 'booked'} successfully!</p>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${appointment.startTime} - ${appointment.endTime}</p>
            <p><strong>${recipientType === 'patient' ? 'Doctor' : 'Patient'}:</strong> ${otherPerson.name}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"HospitalCare System" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: subject,
      html: htmlContent
    });

    console.log(`✅ Confirmation email sent to ${recipientType}: ${recipient.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending confirmation email:`, error.message);
    return false;
  }
};

module.exports = {
  sendAppointmentReminderEmail,
  sendAppointmentConfirmationEmail
};
