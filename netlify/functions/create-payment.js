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

// Show manual payment instructions (fallback)
function showManualInstructions(walletAddress, amount, orderId) {
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:7000; display:flex; align-items:center; justify-content:center;';
    modalDiv.innerHTML = `
        <div style="background:white; border-radius:48px; max-width:500px; width:90%; padding:32px; text-align:center;">
            <div style="font-size:3rem;">💎</div>
            <h2 style="margin:16px 0;">Pay with USDC (Polygon)</h2>
            <p>Send exactly <strong>${amount} USDC</strong> to:</p>
            <div style="background:#1a1a2e; color:#00d4ff; border-radius:20px; padding:20px; margin:20px 0; word-break:break-all; font-family:monospace; font-size:0.8rem;">
                ${walletAddress}
            </div>
            <div style="background:#f0f6fa; border-radius:20px; padding:15px; margin:15px 0; text-align:left;">
                <div><strong>📋 Order ID:</strong> ${orderId}</div>
                <div><strong>👤 Customer:</strong> ${nameInput.value}</div>
                <div><strong>📧 Email:</strong> ${emailInput.value}</div>
            </div>
            <button id="copyAddressBtn" style="background:#1e4a6e; color:white; border:none; padding:12px 24px; border-radius:40px; font-weight:600; cursor:pointer; margin-right:10px;">📋 Copy Address</button>
            <button id="closeManualBtn" style="background:#eef3fc; color:#666; border:none; padding:12px 24px; border-radius:40px; font-weight:600; cursor:pointer;">Close</button>
        </div>
    `;
    document.body.appendChild(modalDiv);
    
    document.getElementById('copyAddressBtn').onclick = () => {
        navigator.clipboard.writeText(walletAddress);
        alert('Wallet address copied!');
    };
    document.getElementById('closeManualBtn').onclick = () => modalDiv.remove();
}

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
        
        if (data.success && data.payment_url) {
            // Store order info in session for success page
            sessionStorage.setItem('lastOrderId', data.order_id);
            sessionStorage.setItem('lastAmount', payload.amount);
            sessionStorage.setItem('lastCustomerName', payload.customerName);
            sessionStorage.setItem('lastCustomerEmail', payload.customerEmail);
            
            // Redirect to PayGate.to checkout
            window.location.href = data.payment_url;
        } else if (data.success && data.manual_wallet) {
            // Fallback: Show manual payment instructions
            setLoading(false);
            showManualInstructions(data.manual_wallet, payload.amount, data.order_id);
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
    
    setTimeout(() => {
        sessionStorage.removeItem('lastCustomerName');
        sessionStorage.removeItem('lastCustomerEmail');
        sessionStorage.removeItem('lastAmount');
    }, 1000);
});

console.log('NovaJet payment form ready!');
console.log('Site URL: https://novajet-airway.netlify.app');
