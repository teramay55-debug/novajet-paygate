// ========== NOVAJET AIRWAYS - COMPLETE WORKING VERSION ==========
const USDC_POLYGON_WALLET = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";
const API_URL = '/.netlify/functions/create-payment';

let smsActive = false;
let BASE_PRICE = 1675.00;
const SMS_COST = 9.99;

let passengerName = "MAGNET CARTER";
let passengerDOB = "November 5, 1991";
let contactEmail = "magnet.carter@novajet.com";
let contactPhone = "+1 (425) 788-2234";

// DOM elements
const totalSpan = document.getElementById("dynamicTotalPrice");
const smsBtn = document.getElementById("toggleSmsBtn");
const initiateBtn = document.getElementById("initiatePaymentBtn");
const processingModal = document.getElementById("processingModal");
const errorModal = document.getElementById("errorModal");
const errorMessageSpan = document.getElementById("errorMessage");

const emailSpan = document.getElementById("contactEmailDisplay");
const phoneSpan = document.getElementById("contactPhoneDisplay");
const passengerNameSpan = document.getElementById("passengerNameDisplay");
const passengerDobSpan = document.getElementById("passengerDobDisplay");
const seatLabelSpan = document.getElementById("seat1Label");

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
    openCustomEditor("Edit email address", contactEmail, (val) => { 
        contactEmail = val; 
        emailSpan.innerText = val; 
    });
};
phoneSpan.onclick = () => {
    openCustomEditor("Edit phone number", contactPhone, (val) => { 
        contactPhone = val; 
        phoneSpan.innerText = val; 
    });
};

document.getElementById("editPassengerBtn").onclick = () => {
    openCustomEditor("Edit full name", passengerName, (newName) => {
        passengerName = newName;
        passengerNameSpan.innerText = passengerName;
        seatLabelSpan.innerText = `${passengerName} - 14K (Window)`;
        setTimeout(() => {
            openCustomEditor("Edit date of birth", passengerDOB, (newDob) => {
                passengerDOB = newDob;
                passengerDobSpan.innerText = passengerDOB;
            });
        }, 100);
    });
};

// Full itinerary viewer
document.getElementById("viewFullItin").onclick = () => {
    const itineraryText = `✈️ NOVAJET COMPLETE SCHEDULE - ONE WAY TRIP

━━━━━━━━━━━━━━━━━━━━━━
🇺🇸→🇮🇸 LEG 1: Washington (SEA) to Reykjavík (KEF)
📅 May 7, 2026
🕑 Depart: 2:30 PM (SEA) | Arrive: 5:10 AM (May 8, KEF)
⏱️ Duration: 7h 40m | ✈️ Flight NX720
💺 Seat: 14K (Window)

━━━━━━━━━━━━━━━━━━━━━━
🇮🇸 ICELAND STAY: 4 DAYS
📅 May 8 - May 11, 2026
🎯 Activities: Northern Lights, Blue Lagoon, Golden Circle

━━━━━━━━━━━━━━━━━━━━━━
🇮🇸→🇲🇽 LEG 2: Keflavík (KEF) to Cancún (CUN)
📅 May 11, 2026
🕗 Depart KEF: 8:45 AM → Arrive YYZ: 11:20 AM
🕐 Depart YYZ: 1:10 PM → Arrive CUN: 4:25 PM
⏱️ Total: 12h 40m | ✈️ Flight NX845 + NX846

━━━━━━━━━━━━━━━━━━━━━━
🇲🇽 MEXICO STAY: 7 DAYS
📅 May 11 - May 18, 2026
📍 Destination: Cancún, Mexico
🎯 Activities: Beaches, Mayan Ruins, Cenotes

━━━━━━━━━━━━━━━━━━━━━━
📍 FINAL DESTINATION: Cancún, Mexico
✅ One-way trip • No return flight
✅ 2 checked bags • NovaProtect coverage • Meals included`;
    
    const modalDiv = document.createElement("div");
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:3000; display:flex; align-items:center; justify-content:center;";
    modalDiv.innerHTML = `<div style="background:white; border-radius:48px; max-width:500px; width:90%; padding:32px; max-height:80vh; overflow:auto;"><h3 style="margin-bottom:16px; color:#1e4a6e;">✈️ Complete Flight Schedule</h3><pre style="white-space:pre-wrap; font-family:'Plus Jakarta Sans'; font-size:0.85rem; line-height:1.6;">${itineraryText}</pre><button id="closeItinModal" style="margin-top:20px; padding:12px 28px; border-radius:40px; background:#1e4a6e; color:white; border:none; cursor:pointer;">Close</button></div>`;
    document.body.appendChild(modalDiv);
    document.getElementById("closeItinModal").onclick = () => modalDiv.remove();
    modalDiv.onclick = (e) => { if(e.target === modalDiv) modalDiv.remove(); };
};

function updateTotal() {
    let total = BASE_PRICE;
    if (smsActive) total += SMS_COST;
    totalSpan.innerText = `$${total.toFixed(2)}`;
    if (smsBtn) {
        smsBtn.innerText = smsActive ? "✓ Added" : "Add $9.99";
        smsBtn.classList.toggle("active", smsActive);
        smsBtn.style.background = smsActive ? "#2a7a5e" : "#1e4a6e";
    }
}
smsBtn.onclick = () => { smsActive = !smsActive; updateTotal(); };

// Show error function
function showError(message) {
    errorMessageSpan.innerText = message;
    errorModal.classList.add("active");
}

document.getElementById("closeErrorBtn").onclick = () => {
    errorModal.classList.remove("active");
};

// Set loading state
function setLoading(isLoading) {
    if (isLoading) {
        processingModal.classList.add("active");
    } else {
        processingModal.classList.remove("active");
    }
}

// Initiate payment - redirect to MoonPay
async function initiatePayment() {
    const totalAmount = BASE_PRICE + (smsActive ? SMS_COST : 0);
    const orderId = `NOVA-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Store booking info
    sessionStorage.setItem("lastOrderId", orderId);
    sessionStorage.setItem("lastAmount", totalAmount);
    sessionStorage.setItem("lastCustomerName", passengerName);
    sessionStorage.setItem("lastCustomerEmail", contactEmail);
    
    setLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: passengerName,
                customerEmail: contactEmail,
                amount: totalAmount,
                order_id: orderId
            })
        });
        
        const data = await response.json();
        setLoading(false);
        
        if (data.payment_url) {
            window.location.href = data.payment_url;
        } else if (data.manual_wallet) {
            showManualInstructions(data.manual_wallet, totalAmount, orderId);
        } else {
            showError("Unable to create payment. Please try again.");
        }
    } catch (error) {
        setLoading(false);
        console.error("Payment error:", error);
        showError("Network error. Please check your connection and try again.");
    }
}

// Fallback manual instructions
function showManualInstructions(walletAddress, amount, orderId) {
    const modalDiv = document.createElement("div");
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(8px); z-index:6000; display:flex; align-items:center; justify-content:center;";
    modalDiv.innerHTML = `
        <div style="background:white; border-radius:48px; max-width:500px; width:90%; padding:32px; text-align:center;">
            <div style="font-size:3rem;">💎</div>
            <h2 style="margin:16px 0; color:#1e4a6e;">Payment Required</h2>
            <p>Please contact support to complete your booking.</p>
            <div style="background:#f0f6fa; border-radius:20px; padding:15px; margin:20px 0; text-align:left;">
                <div><strong>📋 Order:</strong> ${orderId}</div>
                <div><strong>👤 Name:</strong> ${passengerName}</div>
                <div><strong>📧 Email:</strong> ${contactEmail}</div>
            </div>
            <button id="closeManualBtn" style="background:#1e4a6e; color:white; border:none; padding:14px 24px; border-radius:50px; cursor:pointer; width:100%;">Close</button>
        </div>
    `;
    document.body.appendChild(modalDiv);
    document.getElementById("closeManualBtn").onclick = () => modalDiv.remove();
}

document.getElementById("cancelProcessingBtn").onclick = () => {
    processingModal.classList.remove("active");
};

initiateBtn.onclick = initiatePayment;

// Check for return from MoonPay
function checkPaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    const transactionId = urlParams.get('transactionId');
    const status = urlParams.get('status');
    
    if (orderId && (status === 'success' || transactionId)) {
        const amount = sessionStorage.getItem('lastAmount');
        showSuccessModal(amount, orderId);
        sessionStorage.removeItem('lastOrderId');
        sessionStorage.removeItem('lastAmount');
        sessionStorage.removeItem('lastCustomerName');
        sessionStorage.removeItem('lastCustomerEmail');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function showSuccessModal(amount, orderId) {
    const ref = `NJ-${Math.floor(10000 + Math.random() * 90000)}`;
    const successDiv = document.createElement("div");
    successDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:5000; display:flex; align-items:center; justify-content:center;";
    successDiv.innerHTML = `
        <div style="background:white; border-radius:56px; max-width:500px; width:90%; padding:36px; text-align:center;">
            <div style="font-size:3.5rem;">✅</div>
            <h2 style="margin:12px 0; color:#1e4a6e;">Booking Confirmed!</h2>
            <p><strong>${passengerName}</strong><br>Washington → Iceland → Mexico</p>
            <div style="background:#f4f9fe; border-radius:32px; padding:18px; margin:20px 0; text-align:left;">
                <div><strong>🎫 Booking Ref:</strong> ${ref}</div>
                <div><strong>💰 Amount Paid:</strong> $${parseFloat(amount).toFixed(2)}</div>
                <div><strong>📧 Confirmation sent to:</strong> ${contactEmail}</div>
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid #ddd;">
                    <strong>📍 Trip Details:</strong><br>
                    🇺🇸 Washington → 🇮🇸 Iceland (4 days) → 🇲🇽 Mexico
                </div>
            </div>
            <button id="closeSuccessBtn" style="background:#1e4a6e; color:white; border:none; padding:14px 32px; border-radius:50px; font-weight:600; cursor:pointer;">View My Trip</button>
        </div>
    `;
    document.body.appendChild(successDiv);
    document.getElementById("closeSuccessBtn").onclick = () => successDiv.remove();
}

// Google Translate
function googleTranslateElementInit() {
    if (typeof google !== 'undefined' && google.translate) {
        new google.translate.TranslateElement({ 
            pageLanguage: 'en', 
            includedLanguages: 'en,es,fr,de,is,it,pt,zh-CN,ja',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE 
        }, 'google_translate_element');
    }
}
window.googleTranslateElementInit = googleTranslateElementInit;

// Initialize
checkPaymentReturn();
updateTotal();
console.log('NovaJet Airways Ready!');
console.log('Trip: Washington → Iceland (4 days) → Mexico (One-way)');
