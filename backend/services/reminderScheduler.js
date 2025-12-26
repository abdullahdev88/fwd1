const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminderEmail } = require('./emailService');
const { generateNotificationMessage } = require('./aiMessageGenerator');

/**
 * Send AI-enhanced email reminders for an appointment
 * @param {Object} appointment - Appointment document with populated patient and doctor
 * @param {String} recipientType - 'patient' or 'doctor'
 * @param {String} reminderType - '24hours', '2hours', or '15minutes'
 */
const sendAllReminders = async (appointment, recipientType, reminderType) => {
  try {
    // Send AI-enhanced Email only
    const emailSent = await sendAppointmentReminderEmail(appointment, recipientType, reminderType);
    
    return { email: emailSent };
  } catch (error) {
    console.error(`Error sending email reminder for ${recipientType}:`, error.message);
    return { email: false };
  }
};

/**
 * Check and send appointment reminders
 */
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    console.log(`\nChecking for appointment reminders at ${now.toLocaleString()}`);

    // Find all approved appointments that haven't been completed or cancelled
    const appointments = await Appointment.find({
      status: { $in: ['approved', 'pending'] },
      appointmentDate: { $gte: now } // Only future appointments
    })
    .populate('patient', 'name email phone')
    .populate('doctor', 'name email phone specialization');

    if (appointments.length === 0) {
      console.log('No upcoming appointments found.');
      return;
    }

    console.log(`Found ${appointments.length} upcoming appointment(s)`);

    for (const appointment of appointments) {
      try {
        // Parse appointment date and time
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.startTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Calculate time differences in milliseconds
        const timeDiff = appointmentDateTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const minutesDiff = timeDiff / (1000 * 60);

        // Initialize reminders object if it doesn't exist
        if (!appointment.reminders) {
          appointment.reminders = {
            twentyFourHours: { sent: false, patientSent: false, doctorSent: false },
            twoHours: { sent: false, patientSent: false, doctorSent: false },
            fifteenMinutes: { sent: false, patientSent: false, doctorSent: false }
          };
        }

        let updated = false;

        // Check for 24-hour reminder (send between 24h and 23h before)
        if (hoursDiff <= 24 && hoursDiff >= 23 && !appointment.reminders.twentyFourHours.sent) {
          console.log(`\n24-hour reminder for appointment ${appointment._id}`);
          
          // Send to patient
          if (!appointment.reminders.twentyFourHours.patientSent) {
            const patientResults = await sendAllReminders(appointment, 'patient', '24hours');
            appointment.reminders.twentyFourHours.patientSent = true;
            console.log(`   Patient: AI-Enhanced Email=${patientResults.email ? 'sent' : 'failed'}`);
          }
          
          // Send to doctor
          if (!appointment.reminders.twentyFourHours.doctorSent) {
            const doctorResults = await sendAllReminders(appointment, 'doctor', '24hours');
            appointment.reminders.twentyFourHours.doctorSent = true;
            console.log(`   Doctor: AI-Enhanced Email=${doctorResults.email ? 'sent' : 'failed'}`);
          }
          
          appointment.reminders.twentyFourHours.sent = true;
          appointment.reminders.twentyFourHours.sentAt = now;
          updated = true;
        }

        // Check for 2-hour reminder (send between 2h and 1.5h before)
        if (hoursDiff <= 2 && hoursDiff >= 1.5 && !appointment.reminders.twoHours.sent) {
          console.log(`\n2-hour reminder for appointment ${appointment._id}`);
          
          // Send to patient
          if (!appointment.reminders.twoHours.patientSent) {
            const patientResults = await sendAllReminders(appointment, 'patient', '2hours');
            appointment.reminders.twoHours.patientSent = true;
            console.log(`   Patient: AI-Enhanced Email=${patientResults.email ? 'sent' : 'failed'}`);
          }
          
          // Send to doctor
          if (!appointment.reminders.twoHours.doctorSent) {
            const doctorResults = await sendAllReminders(appointment, 'doctor', '2hours');
            appointment.reminders.twoHours.doctorSent = true;
            console.log(`   Doctor: AI-Enhanced Email=${doctorResults.email ? 'sent' : 'failed'}`);
          }
          
          appointment.reminders.twoHours.sent = true;
          appointment.reminders.twoHours.sentAt = now;
          updated = true;
        }

        // Check for 15-minute reminder (send between 15min and 10min before)
        if (minutesDiff <= 15 && minutesDiff >= 10 && !appointment.reminders.fifteenMinutes.sent) {
          console.log(`\n15-minute reminder for appointment ${appointment._id}`);
          
          // Send to patient
          if (!appointment.reminders.fifteenMinutes.patientSent) {
            const patientResults = await sendAllReminders(appointment, 'patient', '15minutes');
            appointment.reminders.fifteenMinutes.patientSent = true;
            console.log(`   Patient: AI-Enhanced Email=${patientResults.email ? 'sent' : 'failed'}`);
          }
          
          // Send to doctor
          if (!appointment.reminders.fifteenMinutes.doctorSent) {
            const doctorResults = await sendAllReminders(appointment, 'doctor', '15minutes');
            appointment.reminders.fifteenMinutes.doctorSent = true;
            console.log(`   Doctor: AI-Enhanced Email=${doctorResults.email ? 'sent' : 'failed'}`);
          }
          
          appointment.reminders.fifteenMinutes.sent = true;
          appointment.reminders.fifteenMinutes.sentAt = now;
          updated = true;
        }

        // Save if any reminders were sent
        if (updated) {
          await appointment.save();
          console.log(`Reminder status updated in database`);
        }
      } catch (error) {
        console.error(`Error processing appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`\nReminder check completed\n`);
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error.message);
  }
};

/**
 * Initialize the appointment reminder scheduler
 * Runs every 5 minutes to check for reminders
 */
const startReminderScheduler = () => {
  console.log('Appointment Reminder Scheduler Started');
  console.log('Running every 5 minutes to check for upcoming appointments');
  console.log('Reminders will be sent at: 24 hours, 2 hours, and 15 minutes before appointment\n');

  // Run immediately on startup
  checkAndSendReminders();

  // Schedule to run every 5 minutes
  // Cron format: */5 * * * * = every 5 minutes
  const task = cron.schedule('*/5 * * * *', () => {
    checkAndSendReminders();
  });

  return task;
};

/**
 * Send immediate test reminder (for testing purposes)
 */
const sendTestReminder = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone specialization');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    console.log('Sending test reminders...\n');
    
    const patientResults = await sendAllReminders(appointment, 'patient', '24hours');
    console.log(`Patient reminders: Email=${patientResults.email ? 'sent' : 'failed'}, WhatsApp=${patientResults.whatsapp ? 'sent' : 'failed'}, SMS=${patientResults.sms ? 'sent' : 'failed'}`);
    
    const doctorResults = await sendAllReminders(appointment, 'doctor', '24hours');
    console.log(`Doctor reminders: Email=${doctorResults.email ? 'sent' : 'failed'}, WhatsApp=${doctorResults.whatsapp ? 'sent' : 'failed'}, SMS=${doctorResults.sms ? 'sent' : 'failed'}`);
    
    return { success: true, patientResults, doctorResults };
  } catch (error) {
    console.error('Error sending test reminder:', error.message);
    throw error;
  }
};

module.exports = {
  startReminderScheduler,
  checkAndSendReminders,
  sendTestReminder
};
