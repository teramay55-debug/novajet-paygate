// ========== NOVAJET AIRWAYS - MOONPAY PAYMENT GATEWAY ==========
const https = require('https');

// YOUR CONFIGURATION
const MY_USDC_POLYGON_WALLET = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";
const YOUR_SITE_URL = "https://novajet-airway.netlify.app";

// MoonPay API Key (Public key - safe to use in frontend)
// This key is provided by PayGate.to for MoonPay integration
const MOONPAY_API_KEY = "pk_live_uQG4BJC4w3cxnqpcSqAfohdBFDTsY6E";

function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `NOVA-${timestamp}-${random}`;
}

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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const { customerName, customerEmail, amount } = JSON.parse(event.body);
        const orderId = generateOrderId();

        // Build the MoonPay checkout URL with all required parameters
        // This will take customers to MoonPay's secure payment page
        const moonPayUrl = `https://buy.moonpay.com/v2/buy?` + new URLSearchParams({
            apiKey: MOONPAY_API_KEY,
            baseCurrencyAmount: amount.toFixed(2),
            baseCurrencyCode: 'usd',
            currencyCode: 'usdc_polygon',
            walletAddress: MY_USDC_POLYGON_WALLET,
            walletAddressTag: customerName,
            email: customerEmail,
            externalTransactionId: orderId,
            redirectUrl: `${YOUR_SITE_URL}/success.html?order=${orderId}`,
            colorCode: '#1e4a6e',
            theme: 'dark'
        }).toString();

        console.log('✅ Payment created for:', customerEmail);
        console.log('💰 Amount:', amount, 'USD');
        console.log('📦 Order ID:', orderId);
        console.log('🔗 MoonPay URL:', moonPayUrl);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                payment_url: moonPayUrl,
                order_id: orderId,
                amount: amount
            })
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
