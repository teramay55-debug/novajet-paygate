// ========== NOVAJET AIRWAYS - PAYMENT FORM ==========
const API_URL = '/.netlify/functions/create-payment';

// DOM Elements
const form = document.getElementById('paymentForm');
const payBtn = document.getElementById('payNowBtn');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');
const nameInput = document.getElementById('customerName');
const emailInput = document.getElementById('customerEmail');
const amountInput = document.getElementById('amount');

// Show loading state
function setLoading(isLoading) {
    if (isLoading) {
        payBtn.disabled = true;
        btnText.textContent = 'Creating order...';
        spinner.classList.remove('hidden');
    } else {
        payBtn.disabled = false;
        btnText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

// Show error modal
function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    modal.classList.remove('hidden');
}

window.closeModal = function() {
    const modal = document.getElementById('errorModal');
    modal.classList.add('hidden');
};

// Show payment instructions with wallet address
function showPaymentInstructions(walletAddress, amount, orderId, customerName, customerEmail) {
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(8px); z-index:7000; display:flex; align-items:center; justify-content:center;';
    modalDiv.innerHTML = `
        <div style="background:white; border-radius:48px; max-width:500px; width:90%; padding:32px; text-align:center; max-height:90vh; overflow-y:auto;">
            <div style="font-size:3rem;">💎</div>
            <h2 style="margin:16px 0; color:#1e4a6e;">Complete Your Payment</h2>
            <p style="color:#666;">Send <strong>${amount} USDC</strong> on the <strong>Polygon network</strong> to the wallet below:</p>
            
            <div style="background:#1a1a2e; color:#00d4ff; border-radius:20px; padding:20px; margin:20px 0; word-break:break-all; font-family:monospace; font-size:0.8rem;">
                ${walletAddress}
            </div>
            
            <div style="background:#f0f6fa; border-radius:20px; padding:15px; margin:15px 0; text-align:left;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong>📋 Order ID:</strong>
                    <span style="font-family:monospace;">${orderId}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong>👤 Passenger:</strong>
                    <span>${customerName}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <strong>📧 Email:</strong>
                    <span>${customerEmail}</span>
                </div>
            </div>
            
            <div style="background:#e8f3e8; border-radius:16px; padding:12px; margin:15px 0;">
                <p style="color:#2a7a5e; font-size:13px;">✅ After sending, funds will automatically settle to this wallet on the Polygon network.</p>
            </div>
            
            <button id="copyAddressBtn" style="background:#1e4a6e; color:white; border:none; padding:14px 24px; border-radius:50px; font-weight:600; cursor:pointer; width:100%; margin-bottom:10px;">
                📋 Copy Wallet Address
            </button>
            <button id="closeManualBtn" style="background:#eef3fc; color:#666; border:none; padding:12px 24px; border-radius:50px; font-weight:600; cursor:pointer; width:100%;">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(modalDiv);
    
    document.getElementById('copyAddressBtn').onclick = () => {
        navigator.clipboard.writeText(walletAddress);
        const btn = document.getElementById('copyAddressBtn');
        btn.textContent = '✓ Copied!';
        btn.style.background = '#2a7a5e';
        setTimeout(() => {
            btn.textContent = '📋 Copy Wallet Address';
            btn.style.background = '#1e4a6e';
        }, 2000);
    };
    document.getElementById('closeManualBtn').onclick = () => modalDiv.remove();
}

// Validate form
function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!name) { showError('Please enter your full name'); return false; }
    if (!email) { showError('Please enter your email address'); return false; }
    if (!email.includes('@') || !email.includes('.')) { showError('Please enter a valid email address'); return false; }
    if (isNaN(amount) || amount < 1) { showError('Please enter a valid amount (minimum $1)'); return false; }
    return true;
}

// Submit payment
async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    const payload = {
        customerName: nameInput.value.trim(),
        customerEmail: emailInput.value.trim(),
        amount: parseFloat(amountInput.value).toFixed(2)
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        setLoading(false);
        
        if (data.manual_wallet) {
            showPaymentInstructions(
                data.manual_wallet, 
                payload.amount, 
                data.order_id, 
                payload.customerName, 
                payload.customerEmail
            );
        } else if (data.payment_url) {
            window.location.href = data.payment_url;
        } else {
            showError('Unable to process payment. Please try again.');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        setLoading(false);
        showError('Network error. Please check your connection and try again.');
    }
}

// Event listener
form.addEventListener('submit', handleSubmit);

// Restore form values from session
window.addEventListener('load', () => {
    const savedName = sessionStorage.getItem('lastCustomerName');
    const savedEmail = sessionStorage.getItem('lastCustomerEmail');
    const savedAmount = sessionStorage.getItem('lastAmount');
    
    if (savedName) nameInput.value = savedName;
    if (savedEmail) emailInput.value = savedEmail;
    if (savedAmount) amountInput.value = savedAmount;
});

console.log('NovaJet payment system ready!');
console.log('USDC Wallet:', "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E");
