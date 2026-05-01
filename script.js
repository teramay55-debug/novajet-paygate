// ========== NOVAJET AIRWAYS - PAYMENT FORM ==========
const API_URL = '/.netlify/functions/create-payment';

const form = document.getElementById('paymentForm');
const payBtn = document.getElementById('payNowBtn');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');
const nameInput = document.getElementById('customerName');
const emailInput = document.getElementById('customerEmail');
const amountInput = document.getElementById('amount');

function setLoading(isLoading) {
    if (isLoading) {
        payBtn.disabled = true;
        btnText.textContent = 'Redirecting to secure payment...';
        spinner.classList.remove('hidden');
    } else {
        payBtn.disabled = false;
        btnText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

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

function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!name) { showError('Please enter your full name'); return false; }
    if (!email) { showError('Please enter your email address'); return false; }
    if (!email.includes('@')) { showError('Please enter a valid email address'); return false; }
    if (isNaN(amount) || amount < 10) { showError('Minimum payment is $10 USD'); return false; }
    return true;
}

async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: nameInput.value.trim(),
                customerEmail: emailInput.value.trim(),
                amount: parseFloat(amountInput.value)
            })
        });
        
        const data = await response.json();
        
        if (data.payment_url) {
            sessionStorage.setItem('lastOrderId', data.order_id);
            sessionStorage.setItem('lastAmount', data.amount);
            sessionStorage.setItem('lastCustomerName', nameInput.value.trim());
            sessionStorage.setItem('lastCustomerEmail', emailInput.value.trim());
            window.location.href = data.payment_url;
        } else {
            throw new Error(data.error || 'Failed to create payment');
        }
    } catch (error) {
        setLoading(false);
        showError(error.message);
    }
}

form.addEventListener('submit', handleSubmit);

// Restore form values
window.addEventListener('load', () => {
    const savedName = sessionStorage.getItem('lastCustomerName');
    const savedEmail = sessionStorage.getItem('lastCustomerEmail');
    if (savedName) nameInput.value = savedName;
    if (savedEmail) emailInput.value = savedEmail;
});

console.log('✅ NovaJet payment system ready!');
console.log('💳 USDC Wallet:', '0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E');
