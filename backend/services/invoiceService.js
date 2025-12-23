const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF Invoice for Payment
 * @param {Object} payment - Payment document with populated fields
 * @returns {Promise<String>} - Path to generated PDF
 */
const generateInvoice = async (payment) => {
  return new Promise((resolve, reject) => {
    try {
      // Create invoices directory if it doesn't exist
      const invoicesDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const invoicePath = path.join(invoicesDir, `${payment.invoiceNumber}.pdf`);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(invoicePath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text('HOSPITALCARE SYSTEM', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666')
        .text('Online Medical Consultation', { align: 'center' })
        .text('Digital Invoice - Simulation Mode', { align: 'center' })
        .moveDown(1);

      // Invoice Details Box
      const boxTop = doc.y;
      doc
        .rect(50, boxTop, 500, 80)
        .fillAndStroke('#f0f9ff', '#2563eb');

      doc
        .fillColor('#000')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Invoice #${payment.invoiceNumber}`, 70, boxTop + 15)
        .fontSize(10)
        .font('Helvetica')
        .text(`Transaction ID: ${payment.transactionId}`, 70, boxTop + 35)
        .text(`Date: ${new Date(payment.invoiceGeneratedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, 70, boxTop + 50)
        .text(`Status: ${payment.status.toUpperCase()}`, 70, boxTop + 65, {
          color: payment.status === 'paid' ? '#10b981' : '#ef4444'
        });

      doc.moveDown(3);

      // Patient Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text('PATIENT INFORMATION', { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${payment.patient.name}`)
        .text(`Email: ${payment.patient.email}`)
        .text(`Phone: ${payment.patient.phone || 'N/A'}`)
        .moveDown(1);

      // Doctor Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('DOCTOR INFORMATION', { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: Dr. ${payment.doctor.name}`)
        .text(`Specialization: ${payment.doctor.specialization || 'General Medicine'}`)
        .text(`Email: ${payment.doctor.email}`)
        .moveDown(1);

      // Appointment Details
      if (payment.appointment) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('APPOINTMENT DETAILS', { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Date: ${new Date(payment.appointment.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`)
          .text(`Time: ${payment.appointment.startTime}`)
          .text(`Type: Online Consultation`)
          .moveDown(1);
      }

      // Payment Details Table
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PAYMENT DETAILS', { underline: true })
        .moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 300;
      const col3 = 450;

      // Table Header
      doc
        .rect(col1, tableTop, 500, 25)
        .fillAndStroke('#2563eb', '#2563eb');

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#fff')
        .text('Description', col1 + 10, tableTop + 8)
        .text('Method', col2 + 10, tableTop + 8)
        .text('Amount', col3 + 10, tableTop + 8);

      // Table Row
      const rowTop = tableTop + 25;
      doc
        .rect(col1, rowTop, 500, 30)
        .stroke('#ddd');

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000')
        .text(payment.description || 'Online Medical Consultation', col1 + 10, rowTop + 10, { width: 230 })
        .text(formatPaymentMethod(payment.paymentMethod), col2 + 10, rowTop + 10)
        .text(`PKR ${payment.amount.toLocaleString()}`, col3 + 10, rowTop + 10);

      // Total
      const totalTop = rowTop + 35;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL AMOUNT:', col2 + 10, totalTop)
        .fontSize(14)
        .fillColor('#2563eb')
        .text(`PKR ${payment.amount.toLocaleString()}`, col3 + 10, totalTop);

      doc.moveDown(2);

      // Refund Information (if applicable)
      if (payment.status === 'refunded' && payment.refundAmount) {
        doc
          .fillColor('#ef4444')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('REFUND INFORMATION', { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#000')
          .text(`Refund Amount: PKR ${payment.refundAmount.toLocaleString()}`)
          .text(`Refund Date: ${new Date(payment.refundProcessedAt).toLocaleDateString()}`)
          .text(`Reason: ${payment.refundReason || 'N/A'}`)
          .moveDown(1);
      }

      // Payment Method Details
      if (payment.cardLastFourDigits) {
        doc
          .fontSize(10)
          .fillColor('#666')
          .text(`Card ending in: **** ${payment.cardLastFourDigits}`)
          .moveDown(0.5);
      }

      // Notes
      if (payment.notes) {
        doc
          .fontSize(10)
          .fillColor('#666')
          .text(`Notes: ${payment.notes}`)
          .moveDown(1);
      }

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .fillColor('#999')
        .text('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(9)
        .fillColor('#ef4444')
        .font('Helvetica-Bold')
        .text('⚠️  SIMULATION MODE - NO REAL PAYMENT PROCESSED', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(8)
        .fillColor('#666')
        .font('Helvetica')
        .text('This is a simulated invoice for demonstration purposes only.', { align: 'center' })
        .text('No actual financial transaction has occurred.', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(8)
        .fillColor('#999')
        .text('Thank you for using HospitalCare System', { align: 'center' })
        .text('For support: support@hospitalcare.com | +92-300-1234567', { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        console.log(`✅ Invoice generated: ${payment.invoiceNumber}`);
        resolve(invoicePath);
      });

      stream.on('error', (err) => {
        console.error('❌ Error generating invoice:', err);
        reject(err);
      });

    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      reject(error);
    }
  });
};

/**
 * Format payment method for display
 */
const formatPaymentMethod = (method) => {
  const methodNames = {
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    easypaisa: 'Easypaisa',
    jazzcash: 'JazzCash',
    stripe: 'Stripe',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    bank_transfer: 'Bank Transfer'
  };
  return methodNames[method] || method;
};

/**
 * Get invoice path
 */
const getInvoicePath = (invoiceNumber) => {
  return path.join(__dirname, '../invoices', `${invoiceNumber}.pdf`);
};

/**
 * Check if invoice exists
 */
const invoiceExists = (invoiceNumber) => {
  const invoicePath = getInvoicePath(invoiceNumber);
  return fs.existsSync(invoicePath);
};

module.exports = {
  generateInvoice,
  getInvoicePath,
  invoiceExists
};
