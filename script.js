// ========== ICELANDAIR PAYMENT INTEGRATION ==========
let smsActive = false;
let BASE_PRICE = 1675.00;
const SMS_COST = 9.99;

// Passenger data
let passengerName = "MAGNET CARTER";
let passengerDOB = "November 5, 1991";
let contactEmail = "magnet.carter@icelandair.com";
let contactPhone = "+1 (425) 788-2234";

// DOM elements
const totalSpan = document.getElementById("dynamicTotalPrice");
const smsBtn = document.getElementById("toggleSmsBtn");
const initiateBtn = document.getElementById("initiatePaymentBtn");

// Modals
const methodModal = document.getElementById("methodSelectModal");
const cardModal = document.getElementById("cardPaymentModal");
const cryptoModal = document.getElementById("cryptoPaymentModal");
const processingModal = document.getElementById("processingModal");

const emailSpan = document.getElementById("contactEmailDisplay");
const phoneSpan = document.getElementById("contactPhoneDisplay");
const passengerNameSpan = document.getElementById("passengerNameDisplay");
const passengerDobSpan = document.getElementById("passengerDobDisplay");
const seatLabelSpan = document.getElementById("seat1Label");

// Stripe
const STRIPE_KEY = "pk_test_51P4Qk1EwY4LxZk9jA9Xv0cR3nL2kH1mJ7tY8uI6oP2aQ9wE4rT5yU7iOpLaZxCfVbNm1A2sD3fG4hJ5kL6pQ7rS8tU9vW0xZ";
let stripe = Stripe(STRIPE_KEY);
let elements = null;
let cardElement = null;

// Custom edit modal
let currentEditCallback = null;
const editModal = document.getElementById("customEditModal");
const editInput = document.getElementById("editModalInput");
const editModalTitle = document.getElementById("editModalTitle");

function openCustomEditor(title, currentValue, onSave) {
    editModalTitle.innerText = title;
    editInput.value = currentValue;
    editModal.style.display = "flex";
    currentEditCallback = (newValue) => {
        if (newValue && newValue.trim()) {
            onSave(newValue.trim());
        }
        editModal.style.display = "none";
        currentEditCallback = null;
    };
}

document.getElementById("editModalSave").onclick = () => {
    if (currentEditCallback) currentEditCallback(editInput.value);
    else editModal.style.display = "none";
};
document.getElementById("editModalCancel").onclick = () => {
    editModal.style.display = "none";
    currentEditCallback = null;
};

// Editable fields
emailSpan.onclick = () => {
    openCustomEditor("Edit email address", contactEmail, (val) => { contactEmail = val; emailSpan.innerText = val; });
};
phoneSpan.onclick = () => {
    openCustomEditor("Edit phone number", contactPhone, (val) => { contactPhone = val; phoneSpan.innerText = val; });
};

document.getElementById("editPassengerBtn").onclick = () => {
    openCustomEditor("Edit full name", passengerName, (newName) => {
        passengerName = newName;
        passengerNameSpan.innerText = passengerName;
        seatLabelSpan.innerText = `${passengerName} - 14K (Window)`;
        setTimeout(() => {
            openCustomEditor("Edit date of birth (e.g., January 15, 1990)", passengerDOB, (newDob) => {
                passengerDOB = newDob;
                passengerDobSpan.innerText = passengerDOB;
            });
        }, 100);
    });
};

// Full itinerary - CORRECTED with proper Icelandair flight numbers and Mexico City destination
document.getElementById("viewFullItin").onclick = () => {
    const itineraryText = `✈️ ICELANDAIR COMPLETE FLIGHT SCHEDULE\n\n━━━━━━━━━━━━━━━━━━━━━━\n🇺🇸→🇮🇸 LEG 1: Seattle (SEA) to Reykjavík (KEF)\n📅 May 13, 2026\n🕑 Depart: 2:30 PM (SEA) | Arrive: 5:10 AM (May 14, KEF)\n⏱️ Duration: 7h 40m | ✈️ Icelandair Flight FI680\n💺 Seat: 14K (Window)\n\n━━━━━━━━━━━━━━━━━━━━━━\n🇮🇸 ICELAND STAY: 5 DAYS\n📅 May 14 - May 18, 2026\n\n━━━━━━━━━━━━━━━━━━━━━━\n🇮🇸→🇲🇽 LEG 2: Keflavík (KEF) to Mexico City (MEX)\n📅 May 18, 2026\n🕗 Depart KEF: 8:45 AM → Arrive YYZ: 11:20 AM (Toronto)\n🕐 Depart YYZ: 1:10 PM → Arrive MEX: 4:25 PM\n⏱️ Total: 12h 40m (1 stop in Toronto)\n✈️ Icelandair Flight FI845 (KEF→YYZ) + FI846 (YYZ→MEX)\n📍 Destination: Benito Juárez International Airport (MEX), Mexico City\n\n━━━━━━━━━━━━━━━━━━━━━━\n🇲🇽 MEXICO CITY STAY: 7 DAYS\n📅 May 18 - May 25, 2026\n\n━━━━━━━━━━━━━━━━━━━━━━\n✅ ONE-WAY TRIP • No return flight\n✅ 2 checked bags (23kg each) • Icelandair Complete coverage • Meals included onboard`;
    
    const modalDiv = document.createElement("div");
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); z-index:3000; display:flex; align-items:center; justify-content:center;";
    modalDiv.innerHTML = `<div style="background:white; border-radius:48px; max-width:550px; width:90%; padding:32px; max-height:80vh; overflow:auto;"><h3 style="margin-bottom:16px;">✈️ Icelandair Flight Schedule</h3><pre style="white-space:pre-wrap; font-family:'Courier New', monospace; font-size:0.85rem; line-height:1.6;">${itineraryText}</pre><button id="closeItinModal" style="margin-top:20px; padding:12px 28px; border-radius:40px; background:#1e4a6e; color:white; border:none; cursor:pointer;">Close</button></div>`;
    document.body.appendChild(modalDiv);
    document.getElementById("closeItinModal").onclick = () => modalDiv.remove();
    modalDiv.onclick = (e) => { if(e.target === modalDiv) modalDiv.remove(); };
};

// Update total price
function updateTotal() {
    let total = BASE_PRICE;
    if (smsActive) total += SMS_COST;
    totalSpan.innerText = `$${total.toFixed(2)}`;
    const submitBtn = document.getElementById("submitCardPayment");
    if (submitBtn) submitBtn.innerHTML = `Pay $${total.toFixed(2)}`;
    if (smsBtn) {
        smsBtn.innerText = smsActive ? "✓ Added" : "Add $9.99";
        smsBtn.classList.toggle("active", smsActive);
        smsBtn.style.background = smsActive ? "#2a7a5e" : "#1e4a6e";
    }
}

smsBtn.onclick = () => { smsActive = !smsActive; updateTotal(); };

// Show method selection modal when payment button clicked
initiateBtn.onclick = () => {
    methodModal.classList.add("active");
};

// Close method modal
document.getElementById("closeMethodModal").onclick = () => {
    methodModal.classList.remove("active");
};

// Select Credit Card
document.getElementById("selectCardMethod").onclick = () => {
    methodModal.classList.remove("active");
    initStripeCard();
    cardModal.classList.add("active");
};

// Select Crypto
document.getElementById("selectCryptoMethod").onclick = () => {
    methodModal.classList.remove("active");
    cryptoModal.classList.add("active");
};

// Close modals
document.getElementById("cancelCardBtn").onclick = () => cardModal.classList.remove("active");
document.getElementById("closeCryptoBtn").onclick = () => cryptoModal.classList.remove("active");

// Initialize Stripe Card Element
async function initStripeCard() {
    const container = document.getElementById("stripe-card-element");
    if (!container) return;
    container.innerHTML = "";
    const { error, elements: stripeElements } = stripe.elements({
        appearance: { theme: 'flat', variables: { fontFamily: 'Plus Jakarta Sans', borderRadius: '28px' } }
    });
    if (error) {
        const errorDiv = document.getElementById("card-errors");
        if (errorDiv) errorDiv.innerText = error.message;
        return;
    }
    elements = stripeElements;
    cardElement = elements.create('card', { hidePostalCode: false });
    cardElement.mount("#stripe-card-element");
    cardElement.on('change', (event) => {
        const errorDiv = document.getElementById("card-errors");
        if (event.error) errorDiv.innerText = event.error.message;
        else if (errorDiv) errorDiv.innerText = "";
    });
}

// Submit card payment
document.getElementById("submitCardPayment").onclick = async () => {
    const totalAmount = BASE_PRICE + (smsActive ? SMS_COST : 0);
    if (!cardElement) return;
    
    processingModal.classList.add("active");
    cardModal.classList.remove("active");
    
    // Simulate payment processing
    setTimeout(() => {
        processingModal.classList.remove("active");
        showBookingSuccess(totalAmount, "Visa/Mastercard");
    }, 2000);
};

// Confirm crypto payment
document.getElementById("confirmCryptoPayment").onclick = () => {
    const totalAmount = BASE_PRICE + (smsActive ? SMS_COST : 0);
    cryptoModal.classList.remove("active");
    processingModal.classList.add("active");
    setTimeout(() => {
        processingModal.classList.remove("active");
        showBookingSuccess(totalAmount, "Cryptocurrency (USDC)");
    }, 1500);
};

// Booking success modal
function showBookingSuccess(amount, method) {
    const ref = `FI-${Math.floor(10000 + Math.random() * 90000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const successDiv = document.createElement("div");
    successDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:5000; display:flex; align-items:center; justify-content:center;";
    successDiv.innerHTML = `<div style="background:white; border-radius:56px; max-width:480px; width:90%; padding:36px; text-align:center;">
        <div style="font-size:3.5rem;">✅</div>
        <h2 style="margin:12px 0;">Booking Confirmed!</h2>
        <p style="font-weight:600;">${passengerName} · Seattle → Iceland → Mexico City</p>
        <div style="background:#f4f9fe; border-radius:32px; padding:18px; margin:20px 0; text-align:left;">
            <div><strong>🎫 Icelandair Reference:</strong> ${ref}</div>
            <div><strong>💰 Paid:</strong> $${amount.toFixed(2)} (${method})</div>
            <div><strong>📱 SMS alerts:</strong> ${smsActive ? "Active ✅" : "Not added ❌"}</div>
            <div><strong>📧 Confirmation email:</strong> ${contactEmail}</div>
            <div><strong>💺 Seat SEA→KEF:</strong> ${passengerName} - 14K (Window)</div>
            <div><strong>📍 Destination:</strong> Benito Juárez International Airport (MEX), Mexico City</div>
        </div>
        <button id="closeSuccessBtn" style="background:#1e4a6e; color:white; border:none; padding:14px 32px; border-radius:50px; font-weight:600; cursor:pointer; margin-top:10px;">View My Trip</button>
    </div>`;
    document.body.appendChild(successDiv);
    document.getElementById("closeSuccessBtn").onclick = () => {
        successDiv.remove();
        alert(`Thank you ${passengerName}! Your Icelandair booking to Mexico City is confirmed. Details sent to ${contactEmail}.`);
    };
    successDiv.onclick = (e) => { if(e.target === successDiv) successDiv.remove(); };
}

// Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({ 
        pageLanguage: 'en', 
        includedLanguages: 'en,es,fr,de,is,it,pt,zh-CN,ja',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE 
    }, 'google_translate_element');
}
window.googleTranslateElementInit = googleTranslateElementInit;

// Initial update
updateTotal();
