/**
 * Payment System Quick Test Script
 * Run this to test the payment API endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials (update with your actual credentials)
const TEST_CREDENTIALS = {
  patient: {
    email: 'mahammirza08@gmail.com',
    password: 'your_password'  // Update this
  },
  doctor: {
    email: '233798@students.au.edu.pk',
    password: 'your_password'  // Update this
  },
  admin: {
    email: 'admin@hospital.com',
    password: 'your_password'  // Update this
  }
};

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data?.message);
    return null;
  }
}

// Test 1: Process Payment
async function testProcessPayment(patientToken, appointmentId) {
  console.log('\n🧪 TEST 1: Process Payment');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.post(
      `${API_URL}/payments/process`,
      {
        appointmentId,
        paymentMethod: 'credit_card',
        cardLastFourDigits: '1111',
        notes: 'Test payment for consultation'
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );

    console.log('✅ Payment processed successfully!');
    console.log('   Transaction ID:', response.data.data.transactionId);
    console.log('   Invoice Number:', response.data.data.invoiceNumber);
    console.log('   Amount:', `PKR ${response.data.data.amount}`);
    console.log('   Status:', response.data.data.status);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Payment failed:', error.response?.data?.message);
    return null;
  }
}

// Test 2: Get Payment History
async function testGetPaymentHistory(patientToken) {
  console.log('\n🧪 TEST 2: Get Payment History');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.get(
      `${API_URL}/payments/patient/history`,
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );

    console.log(`✅ Found ${response.data.count} payment(s):`);
    response.data.data.slice(0, 3).forEach((payment, index) => {
      console.log(`\n   Payment ${index + 1}:`);
      console.log(`   - Transaction: ${payment.transactionId}`);
      console.log(`   - Amount: PKR ${payment.amount}`);
      console.log(`   - Status: ${payment.status}`);
      console.log(`   - Method: ${payment.paymentMethod}`);
      console.log(`   - Date: ${new Date(payment.createdAt).toLocaleDateString()}`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get history:', error.response?.data?.message);
    return [];
  }
}

// Test 3: Request Refund
async function testRequestRefund(patientToken, paymentId) {
  console.log('\n🧪 TEST 3: Request Refund');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.post(
      `${API_URL}/payments/${paymentId}/refund-request`,
      {
        reason: 'Doctor cancelled the appointment'
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );

    console.log('✅ Refund requested successfully!');
    console.log('   Status:', response.data.data.status);
    console.log('   Reason:', response.data.data.refundReason);
    console.log('   Requested At:', new Date(response.data.data.refundRequestedAt).toLocaleString());
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Refund request failed:', error.response?.data?.message);
    return null;
  }
}

// Test 4: Admin - Get Payment Statistics
async function testAdminStatistics(adminToken) {
  console.log('\n🧪 TEST 4: Admin Payment Statistics');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.get(
      `${API_URL}/payments/admin/statistics`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const stats = response.data.statistics;
    console.log('✅ Payment Statistics:');
    console.log(`   Total Payments: ${stats.totalPayments}`);
    console.log(`   Paid: ${stats.paidPayments}`);
    console.log(`   Pending: ${stats.pendingPayments}`);
    console.log(`   Refund Requests: ${stats.refundRequests}`);
    console.log(`   Refunded: ${stats.refundedPayments}`);
    console.log(`   Total Revenue: PKR ${stats.totalRevenue.toLocaleString()}`);
    console.log(`   Net Revenue: PKR ${stats.netRevenue.toLocaleString()}`);
    
    if (response.data.paymentMethodsStats.length > 0) {
      console.log('\n   Payment Methods Breakdown:');
      response.data.paymentMethodsStats.forEach(method => {
        console.log(`   - ${method._id}: ${method.count} payments (PKR ${method.totalAmount.toLocaleString()})`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get statistics:', error.response?.data?.message);
    return null;
  }
}

// Test 5: Admin - Process Refund
async function testProcessRefund(adminToken, paymentId) {
  console.log('\n🧪 TEST 5: Admin Process Refund');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.put(
      `${API_URL}/payments/admin/${paymentId}/process-refund`,
      {
        adminNotes: 'Refund approved - test scenario'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log('✅ Refund processed successfully!');
    console.log('   Status:', response.data.data.status);
    console.log('   Refund Amount: PKR', response.data.data.refundAmount);
    console.log('   Processed At:', new Date(response.data.data.refundProcessedAt).toLocaleString());
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Refund processing failed:', error.response?.data?.message);
    return null;
  }
}

// Test 6: Generate Invoice
async function testGenerateInvoice(token, paymentId) {
  console.log('\n🧪 TEST 6: Generate Invoice');
  console.log('═══════════════════════════════════════');
  
  try {
    const response = await axios.post(
      `${API_URL}/invoices/generate/${paymentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Invoice generated successfully!');
    console.log('   Invoice Number:', response.data.data.invoiceNumber);
    console.log('   Download URL:', `http://localhost:5000${response.data.data.invoicePath}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Invoice generation failed:', error.response?.data?.message);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('\n💳 PAYMENT SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Testing Payment API Endpoints...\n');

  // Note: You need to provide an actual appointment ID to test
  const TEST_APPOINTMENT_ID = 'YOUR_APPOINTMENT_ID_HERE'; // Update this

  // Step 1: Login as patient
  console.log('📝 Step 1: Logging in as patient...');
  const patientToken = await login(
    TEST_CREDENTIALS.patient.email,
    TEST_CREDENTIALS.patient.password
  );
  
  if (!patientToken) {
    console.log('❌ Cannot proceed without patient login');
    console.log('\n⚠️  Please update TEST_CREDENTIALS with your actual passwords');
    return;
  }
  console.log('✅ Patient logged in successfully');

  // Step 2: Process payment (uncomment when you have a real appointment ID)
  /*
  const payment = await testProcessPayment(patientToken, TEST_APPOINTMENT_ID);
  if (payment) {
    // Step 3: Get payment history
    await testGetPaymentHistory(patientToken);
    
    // Step 4: Generate invoice
    await testGenerateInvoice(patientToken, payment._id);
    
    // Step 5: Request refund
    await testRequestRefund(patientToken, payment._id);
  }
  */

  // Step 3: Get payment history (works without new payment)
  await testGetPaymentHistory(patientToken);

  // Step 4: Login as admin
  console.log('\n📝 Step 4: Logging in as admin...');
  const adminToken = await login(
    TEST_CREDENTIALS.admin.email,
    TEST_CREDENTIALS.admin.password
  );
  
  if (adminToken) {
    console.log('✅ Admin logged in successfully');
    
    // Step 5: Get admin statistics
    await testAdminStatistics(adminToken);
  } else {
    console.log('⚠️  Admin login failed - skipping admin tests');
  }

  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('✅ Test Suite Completed!');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('📝 Next Steps:');
  console.log('1. Update TEST_CREDENTIALS with your actual passwords');
  console.log('2. Create an approved appointment and get its ID');
  console.log('3. Update TEST_APPOINTMENT_ID variable');
  console.log('4. Uncomment payment test section');
  console.log('5. Run: node testPaymentSystem.js\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
