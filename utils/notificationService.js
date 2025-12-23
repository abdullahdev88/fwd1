/**
 * Notification Service
 * Handles sending notifications for appointments and second opinions
 * NO SENSITIVE DATA in messages - only general updates
 */

const sendNotification = async (type, recipient, data) => {
  try {
    console.log(`📧 Notification [${type}] sent to:`, recipient.email);
    console.log('📱 Notification data:', {
      recipientName: recipient.name,
      notificationType: type,
      timestamp: new Date().toISOString()
    });

    // In production, integrate with:
    // - WhatsApp Business API
    // - Email service (SendGrid, AWS SES, etc.)
    // - SMS gateway
    
    // Example structure for different notification types
    switch (type) {
      case 'APPOINTMENT_BOOKED':
        return logNotification(recipient, 'Appointment request submitted successfully');
      
      case 'APPOINTMENT_APPROVED':
        return logNotification(recipient, 'Your appointment has been approved');
      
      case 'APPOINTMENT_REJECTED':
        return logNotification(recipient, 'Your appointment request needs attention');
      
      case 'REPORTS_UPLOADED':
        return logNotification(recipient, 'Medical reports uploaded successfully');
      
      case 'SECOND_OPINION_SUBMITTED':
        return logNotification(recipient, 'Second opinion request submitted');
      
      case 'SECOND_OPINION_ASSIGNED':
        return logNotification(recipient, 'Your second opinion request has been assigned to a doctor');
      
      case 'SECOND_OPINION_UNDER_REVIEW':
        return logNotification(recipient, 'Doctor is reviewing your case');
      
      case 'SECOND_OPINION_COMPLETED':
        return logNotification(recipient, 'Your second opinion is ready to view');
      
      case 'NEW_SECOND_OPINION_REQUEST':
        return logNotification(recipient, 'New second opinion request assigned to you');
      
      default:
        return logNotification(recipient, 'You have a new update');
    }
  } catch (error) {
    console.error('❌ Notification Error:', error.message);
    // Don't throw - notification failures shouldn't break the main flow
    return false;
  }
};

const logNotification = (recipient, message) => {
  console.log(`✅ [${new Date().toISOString()}] ${recipient.name}: ${message}`);
  return true;
};

// Batch notification for multiple recipients
const sendBatchNotifications = async (type, recipients, data) => {
  const results = await Promise.allSettled(
    recipients.map(recipient => sendNotification(type, recipient, data))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`📊 Batch notifications: ${successful}/${recipients.length} sent`);
  
  return successful;
};

// Send reminder notifications
const sendReminder = async (recipient, reminderType, data) => {
  console.log(`🔔 Reminder [${reminderType}] for:`, recipient.email);
  return sendNotification(`REMINDER_${reminderType}`, recipient, data);
};

module.exports = {
  sendNotification,
  sendBatchNotifications,
  sendReminder
};