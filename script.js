// ========== PAYGATE.TO INTEGRATION - FRONTEND ==========
const API_URL = '/.netlify/functions/create-payment';

// DOM Elements
const form = document.getElementById('paymentForm');
const payBtn = document.getElementById('payNowBtn');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');

// Form fields
const nameInput = document.getElementById('customerName');
const emailInput = document.getElementById('customerEmail');
const amountInput = document.getElementById('amount');

// Helper: Show loading state
function setLoading(isLoading) {
    if (isLoading) {
        payBtn.disabled = true;
        btnText.textContent = 'Creating payment...';
        spinner.classList.remove('hidden');
    } else {
        payBtn.disabled = false;
        btnText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

// Helper: Show error modal
function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    modal.classList.remove('hidden');
}

// Helper: Close modal
window.closeModal = function() {
    const modal = document.getElementById('errorModal');
    modal.classList.add('hidden');
};

// Validate form
function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!name) {
        showError('Please enter your full name');
        return false;
    }
    
    if (!email) {
        showError('Please enter your email address');
        return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if (isNaN(amount) || amount < 1) {
        showError('Please enter a valid amount (minimum $1)');
        return false;
    }
    
    return true;
}

// Submit payment
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    setLoading(true);
    
    const payload = {
        customerName: nameInput.value.trim(),
        customerEmail: emailInput.value.trim(),
        amount: parseFloat(amountInput.value)
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Payment creation failed');
        }
        
        if (data.success && data.payment_url) {
            // Store order info in session for success page
            sessionStorage.setItem('lastOrderId', data.order_id);
            sessionStorage.setItem('lastAmount', payload.amount);
            sessionStorage.setItem('lastCustomerName', payload.customerName);
            sessionStorage.setItem('lastCustomerEmail', payload.customerEmail);
            
            // Redirect to PayGate.to checkout
            window.location.href = data.payment_url;
        } else {
            throw new Error(data.error || 'Invalid response from server');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showError(error.message || 'Unable to create payment. Please try again.');
        setLoading(false);
    }
}

// Event listeners
form.addEventListener('submit', handleSubmit);

// Restore form values from session if returning from payment
window.addEventListener('load', () => {
    const savedName = sessionStorage.getItem('lastCustomerName');
    const savedEmail = sessionStorage.getItem('lastCustomerEmail');
    const savedAmount = sessionStorage.getItem('lastAmount');
    
    if (savedName) nameInput.value = savedName;
    if (savedEmail) emailInput.value = savedEmail;
    if (savedAmount) amountInput.value = savedAmount;
    
    // Clear after restoring
    setTimeout(() => {
        sessionStorage.removeItem('lastCustomerName');
        sessionStorage.removeItem('lastCustomerEmail');
        sessionStorage.removeItem('lastAmount');
    }, 1000);
});

console.log('NovaJet payment form ready!');
