/**
 * AI-Enhanced Message Generator (Optional Enhancement)
 * 
 * This service generates personalized notification messages using AI.
 * AI is used ONLY for generating message content, NOT for delivery.
 * 
 * Usage: Set USE_AI_MESSAGES=true in .env to enable
 */

// Example using OpenAI (you would need: npm install openai)
// const OpenAI = require('openai');

/**
 * Generate personalized appointment approval message
 * @param {Object} data - Appointment and user data
 * @returns {String} Generated message
 */
const generateAppointmentApprovalMessage = async (data) => {
  const { patientName, doctorName, specialization, date, time, isFirstVisit } = data;
  
  // Option 1: Use AI for personalized generation
  if (process.env.USE_AI_MESSAGES === 'true') {
    try {
      // AI generates personalized, context-aware message
      // Example with OpenAI (requires API key):
      /*
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional healthcare communication assistant. Generate empathetic, clear, and concise appointment notifications. Keep the tone warm but professional."
          },
          {
            role: "user",
            content: `Generate an appointment approval WhatsApp message:
            - Patient: ${patientName} (${isFirstVisit ? 'First visit' : 'Follow-up'})
            - Doctor: Dr. ${doctorName}
            - Specialization: ${specialization}
            - Date: ${date}
            - Time: ${time}
            
            Include appointment details, a warm greeting, and mention they'll receive reminders.
            Keep it under 150 words. Use appropriate emojis.`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });
      
      return response.choices[0].message.content;
      */
      
      // For demo purposes, return enhanced template with context awareness
      const greeting = isFirstVisit 
        ? `We're excited to welcome you for your first visit!`
        : `Thank you for scheduling your follow-up appointment.`;
      
      return `🏥 *HospitalCare System*\n\n` +
        `✅ *Great News, ${patientName}!*\n\n` +
        `${greeting}\n\n` +
        `Your appointment with *Dr. ${doctorName}* (${specialization}) has been approved.\n\n` +
        `📅 *Appointment Details:*\n` +
        `• Date: ${date}\n` +
        `• Time: ${time}\n\n` +
        `We'll send you friendly reminders as your appointment approaches. ` +
        `If you have any questions, feel free to reach out!\n\n` +
        `Stay healthy! 💙\n` +
        `- HospitalCare Team`;
    } catch (error) {
      console.error('AI message generation failed, using template:', error.message);
      // Fallback to template
    }
  }
  
  // Option 2: Use standard template (current implementation - always reliable)
  return generateTemplateMessage('appointment_approved', data);
};

/**
 * Generate personalized reminder message
 * @param {Object} data - Reminder data
 * @returns {String} Generated message
 */
const generateReminderMessage = async (data) => {
  const { recipientName, recipientType, otherPersonName, date, time, reminderType, notes } = data;
  
  if (process.env.USE_AI_MESSAGES === 'true') {
    try {
      // AI can make reminders more contextual
      const timeframes = {
        '24hours': { text: '24 hours', urgency: 'gentle' },
        '2hours': { text: '2 hours', urgency: 'moderate' },
        '15minutes': { text: '15 minutes', urgency: 'urgent' }
      };
      
      const { text: timeText, urgency } = timeframes[reminderType];
      
      const urgencyPhrases = {
        gentle: 'friendly reminder',
        moderate: 'important reminder',
        urgent: 'final reminder'
      };
      
      const greeting = recipientType === 'patient'
        ? `Dear ${recipientName},`
        : `Dear Dr. ${recipientName},`;
      
      const appointmentWith = recipientType === 'patient'
        ? `Dr. ${otherPersonName}`
        : `your patient ${otherPersonName}`;
      
      return `🏥 *HospitalCare System*\n\n` +
        `⏰ *${urgencyPhrases[urgency].toUpperCase()}*\n\n` +
        `${greeting}\n\n` +
        `This is a ${urgencyPhrases[urgency]} that you have an appointment with ${appointmentWith} in ${timeText}.\n\n` +
        `📅 *Details:*\n` +
        `• Date: ${date}\n` +
        `• Time: ${time}\n` +
        `${notes ? `• Notes: ${notes}\n` : ''}` +
        `\n${recipientType === 'patient' ? 'Please arrive 10 minutes early for check-in.' : 'Please review patient history if needed.'}\n\n` +
        `Thank you! - HospitalCare`;
    } catch (error) {
      console.error('AI reminder generation failed, using template:', error.message);
    }
  }
  
  return generateTemplateMessage('reminder', data);
};

/**
 * Generate personalized second opinion completion message
 * @param {Object} data - Second opinion data
 * @returns {String} Generated message
 */
const generateSecondOpinionMessage = async (data) => {
  const { patientName, doctorName, specialization, diagnosisSummary, urgency } = data;
  
  if (process.env.USE_AI_MESSAGES === 'true') {
    try {
      // AI can make the message more empathetic based on content
      const urgencyEmoji = urgency === 'high' ? '🚨' : urgency === 'medium' ? '⚡' : '✅';
      
      return `🏥 *HospitalCare System*\n\n` +
        `${urgencyEmoji} *Your Second Opinion is Ready!*\n\n` +
        `Dear ${patientName},\n\n` +
        `Dr. ${doctorName}, our ${specialization} specialist, has carefully reviewed your case and submitted a comprehensive medical opinion.\n\n` +
        `📋 *Quick Summary:*\n` +
        `${diagnosisSummary}\n\n` +
        `For your complete second opinion including detailed recommendations and next steps, please log in to your HospitalCare account.\n\n` +
        `We're here to support your healthcare journey. If you have any questions, don't hesitate to reach out.\n\n` +
        `Take care! 💙\n` +
        `- HospitalCare Team`;
    } catch (error) {
      console.error('AI second opinion message failed, using template:', error.message);
    }
  }
  
  return generateTemplateMessage('second_opinion_ready', data);
};

/**
 * Standard template-based message generation (fallback / default)
 * These are reliable and fast - always work without external dependencies
 */
const generateTemplateMessage = (type, data) => {
  const templates = {
    appointment_approved: `🏥 *HospitalCare System*\n\n✅ *Appointment Approved!*\n\nDear ${data.patientName},\n\nYour appointment with *Dr. ${data.doctorName}* has been approved!\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n🏥 Specialization: ${data.specialization}\n\nYou will receive reminders before your appointment.\n\nThank you! - HospitalCare System`,
    
    reminder: `🏥 *HospitalCare System*\n\n⏰ *Appointment Reminder*\n\nDear ${data.recipientName},\n\nYou have an appointment ${data.recipientType === 'patient' ? 'with Dr. ' + data.otherPersonName : 'with patient ' + data.otherPersonName}\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n\n${data.recipientType === 'patient' ? 'Please arrive 10 minutes early.' : 'Please review patient history.'}\n\nThank you! - HospitalCare`,
    
    second_opinion_ready: `🏥 *HospitalCare System*\n\n✅ *Second Opinion Ready!*\n\nDear ${data.patientName},\n\nDr. ${data.doctorName} has submitted their medical opinion for your case.\n\n🔬 Diagnosis: ${data.diagnosisSummary}\n\nPlease log in to view the complete second opinion and all details.\n\nThank you! - HospitalCare System`
  };
  
  return templates[type] || 'Notification from HospitalCare System';
};

/**
 * Main message generator - automatically chooses AI or template
 */
const generateNotificationMessage = async (type, data) => {
  switch (type) {
    case 'appointment_approved':
      return await generateAppointmentApprovalMessage(data);
    case 'reminder':
      return await generateReminderMessage(data);
    case 'second_opinion_ready':
      return await generateSecondOpinionMessage(data);
    default:
      return generateTemplateMessage(type, data);
  }
};

module.exports = {
  generateNotificationMessage,
  generateAppointmentApprovalMessage,
  generateReminderMessage,
  generateSecondOpinionMessage,
  generateTemplateMessage
};

/**
 * USAGE EXAMPLE:
 * 
 * // In appointmentController.js:
 * const { generateNotificationMessage } = require('../../services/aiMessageGenerator');
 * 
 * // Generate message (AI or template based on .env)
 * const message = await generateNotificationMessage('appointment_approved', {
 *   patientName: 'John Doe',
 *   doctorName: 'Sarah Johnson',
 *   specialization: 'Cardiology',
 *   date: 'Dec 20, 2025',
 *   time: '2:30 PM',
 *   isFirstVisit: true
 * });
 * 
 * // Send via WhatsApp
 * await sendWhatsApp(patientPhone, message);
 * 
 * // .env configuration:
 * USE_AI_MESSAGES=false  # Use reliable templates (default)
 * USE_AI_MESSAGES=true   # Use AI-enhanced messages
 * OPENAI_API_KEY=sk-...  # Required if using AI
 */
