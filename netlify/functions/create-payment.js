// ========== NOVAJET AIRWAYS - PAYGATE.TO PAYMENT FUNCTION ==========
// This function creates payment links and handles the PayGate.to integration

const https = require('https');

// ===== CONFIGURATION - UPDATE THESE =====
const MY_USDC_POLYGON_WALLET = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";
const YOUR_SITE_URL = "https://novajet-airway.netlify.app";
// ========================================

// Helper: Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `NOVA-${timestamp}-${random}`;
}

// Helper: Make HTTPS GET request
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({});
                }
            });
        }).on('error', reject);
    });
}

// Main handler
exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const { customerName, customerEmail, amount } = JSON.parse(event.body);

        // Validate required fields
        if (!customerName || !customerEmail || !amount) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing required fields: name, email, or amount' 
                })
            };
        }

        // Validate amount
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Invalid amount' })
            };
        }

        // Generate order ID
        const orderId = generateOrderId();

        // Create callback URLs
        const successUrl = `${YOUR_SITE_URL}/success.html?order=${orderId}&status=success`;
        const cancelUrl = `${YOUR_SITE_URL}/?payment=cancelled`;

        // Build the PayGate.to direct payment URL
        // This is the correct format for direct credit card payments
        const paymentParams = new URLSearchParams({
            amount: numAmount.toFixed(2),
            currency: 'USD',
            address: MY_USDC_POLYGON_WALLET,
            order_id: orderId,
            name: customerName,
            email: customerEmail,
            success_url: successUrl,
            cancel_url: cancelUrl,
            description: `NovaJet Flight Booking: ${customerName}`
        });

        const paymentUrl = `https://paygate.to/pay?${paymentParams.toString()}`;

        console.log('Payment created:', { orderId, amount: numAmount, customerEmail });
        console.log('Payment URL:', paymentUrl);

        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                payment_url: paymentUrl,
                order_id: orderId,
                amount: numAmount
            })
        };

    } catch (error) {
        console.error('Payment creation error:', error.message);

        // Return fallback with manual wallet address
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                manual_wallet: MY_USDC_POLYGON_WALLET,
                order_id: generateOrderId(),
                fallback: true,
                message: 'PayGate.to API temporarily unavailable. Please send USDC directly.'
            })
        };
    }
};
