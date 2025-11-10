// // Base API URL
// const API_URL = 'http://localhost:5000/api'; // Ensure this matches your backend URL

// // Display message function
// function showMessage(message, isError = false) {
//   const messageElement = document.getElementById('message');
//   if (messageElement) {
//     messageElement.textContent = message;
//     messageElement.className = isError ? 'error' : 'success';
    
//     // Clear message after 3 seconds
//     setTimeout(() => {
//       messageElement.textContent = '';
//       messageElement.className = '';
//     }, 3000);
//   }
// }

// // Register new user
// async function register(name, email, password) {
//   try {
//     const response = await fetch(`${API_URL}/auth/register`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ name, email, password })
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Registration failed');
//     }

//     // Save token to localStorage
//     localStorage.setItem('userToken', data.token);
//     localStorage.setItem('userName', data.name);
    
//     showMessage('Registration successful! Redirecting to dashboard...');
    
//     // Redirect to dashboard
//     setTimeout(() => {
//       window.location.href = 'dashboard.html';
//     }, 1500);
    
//   } catch (error) {
//     showMessage(error.message, true);
//   }
// }

// // Login user
// async function login(email, password) {
//   try {
//     const response = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ email, password })
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Login failed');
//     }

//     // Save token to localStorage
//     localStorage.setItem('userToken', data.token);
//     localStorage.setItem('userName', data.name);
    
//     showMessage('Login successful! Redirecting to dashboard...');
    
//     // Redirect to dashboard
//     setTimeout(() => {
//       window.location.href = 'dashboard.html';
//     }, 1500);
    
//   } catch (error) {
//     showMessage(error.message, true);
//   }
// }

// // Check if user is logged in
// function isLoggedIn() {
//   return localStorage.getItem('userToken') !== null;
// }

// // Get user info from API
// async function getUserInfo() {
//   try {
//     const token = localStorage.getItem('userToken');
    
//     if (!token) {
//       window.location.href = 'login.html';
//       return;
//     }
    
//     const response = await fetch(`${API_URL}/users/me`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to fetch user info');
//     }

//     // Update the UI with user information
//     document.getElementById('user-name').textContent = data.name;
//     document.getElementById('user-email').textContent = data.email;
    
//     // Format and display creation date
//     const createdDate = new Date(data.createdAt);
//     document.getElementById('user-created').textContent = createdDate.toLocaleDateString();
    
//   } catch (error) {
//     console.error('Error fetching user info:', error);
    
//     // If unauthorized, redirect to login
//     if (error.message.includes('Not authorized')) {
//       logout();
//     }
//   }
// }

// // Logout user
// function logout() {
//   // Clear localStorage
//   localStorage.removeItem('userToken');
//   localStorage.removeItem('userName');
  
//   // Redirect to login
//   window.location.href = 'login.html';
// }

// // Check auth status on page load
// document.addEventListener('DOMContentLoaded', function() {
//   const currentPage = window.location.pathname.split('/').pop();
  
//   // Redirect if already logged in or out based on current page
//   if (currentPage === 'login.html' || currentPage === 'register.html') {
//     if (isLoggedIn()) {
//       window.location.href = 'dashboard.html';
//     }
//   } else if (currentPage === 'dashboard.html') {
//     if (!isLoggedIn()) {
//       window.location.href = 'login.html';
//     }
//   }
// });
