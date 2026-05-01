// ========== PAYGATE.TO NETLIFY FUNCTION - FIXED ==========
const https = require('https');

// YOUR CONFIGURATION
const MY_USDC_POLYGON_WALLET_ADDRESS = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";
const MY_PROVIDER = "moonpay";
const PAYGATE_WALLET_API = "https://api.paygate.to/control/wallet.php";
const PAYGATE_CHECKOUT_BASE = "https://checkout.paygate.to/process-payment.php";
const YOUR_DOMAIN = "https://novajet-airway.netlify.app";

function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({});
                }
            });
        }).on('error', reject);
    });
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
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }
    
    try {
        const { customerName, customerEmail, amount } = JSON.parse(event.body);
        
        // Validate
        if (!customerName || !customerEmail || !amount) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Missing required fields' })
            };
        }
        
        const orderId = generateOrderId();
        const callbackUrl = `${YOUR_DOMAIN}/success.html?order=${orderId}`;
        
        // Call PayGate.to API
        const walletApiUrl = `${PAYGATE_WALLET_API}?address=${MY_USDC_POLYGON_WALLET_ADDRESS}&callback=${encodeURIComponent(callbackUrl)}`;
        
        console.log('Calling PayGate.to:', walletApiUrl);
        
        let walletData = {};
        try {
            walletData = await httpsGet(walletApiUrl);
        } catch (err) {
            console.log('PayGate.to API error, using fallback');
        }
        
        const addressIn = walletData.address_in || walletData.polygon_address_in || walletData.address;
        
        // If no address from API, use manual fallback
        if (!addressIn) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    success: true,
                    manual_wallet: MY_USDC_POLYGON_WALLET_ADDRESS,
                    order_id: orderId,
                    fallback: true,
                    amount: amount
                })
            };
        }
        
        // Build payment URL
        const paymentUrl = `${PAYGATE_CHECKOUT_BASE}?address=${addressIn}&amount=${amount.toFixed(2)}&provider=${MY_PROVIDER}&email=${customerEmail}&currency=USD`;
        
        console.log('Payment URL:', paymentUrl);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                payment_url: paymentUrl,
                order_id: orderId
            })
        };
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Always return something useful
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                manual_wallet: MY_USDC_POLYGON_WALLET_ADDRESS,
                order_id: generateOrderId(),
                fallback: true
            })
        };
    }
};
