// ========== PAYGATE.TO NETLIFY FUNCTION ==========
// Your USDC Polygon wallet address
const MY_USDC_POLYGON_WALLET_ADDRESS = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";
const MY_PROVIDER = "moonpay";

// PayGate.to API endpoints
const PAYGATE_WALLET_API = "https://api.paygate.to/control/wallet.php";
const PAYGATE_CHECKOUT_BASE = "https://checkout.paygate.to/process-payment.php";

// Helper: Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD-${timestamp}-${random}`;
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
        
        // Get the domain from the request
        const domain = event.headers.origin || event.headers.referer || 'https://your-site.netlify.app';
        
        // Validate required fields
        if (!customerName || !customerEmail || !amount) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Missing required fields: customerName, customerEmail, amount' 
                })
            };
        }
        
        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Invalid amount' })
            };
        }
        
        // Generate unique order ID
        const orderId = generateOrderId();
        
        // Create callback URL for this order
        const callbackUrl = `${domain}/success.html?order=${orderId}`;
        
        console.log('Creating PayGate.to wallet for order:', {
            orderId,
            amount,
            customerEmail,
            callbackUrl
        });
        
        // Step 1: Call PayGate.to API to create temporary wallet
        const walletParams = new URLSearchParams({
            address: MY_USDC_POLYGON_WALLET_ADDRESS,
            callback: callbackUrl
        });
        
        const walletApiUrl = `${PAYGATE_WALLET_API}?${walletParams.toString()}`;
        
        const walletResponse = await fetch(walletApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!walletResponse.ok) {
            throw new Error(`PayGate.to API error: ${walletResponse.status}`);
        }
        
        const walletData = await walletResponse.json();
        
        console.log('PayGate.to wallet response:', walletData);
        
        // Extract address_in from response
        const addressIn = walletData.address_in || walletData.polygon_address_in || walletData.address;
        
        if (!addressIn) {
            throw new Error('Failed to get address_in from PayGate.to API');
        }
        
        // Step 2: Build payment URL
        const paymentParams = new URLSearchParams({
            address: addressIn,
            amount: amount.toFixed(2),
            provider: MY_PROVIDER,
            email: customerEmail,
            currency: 'USD'
        });
        
        const paymentUrl = `${PAYGATE_CHECKOUT_BASE}?${paymentParams.toString()}`;
        
        console.log('Payment URL created:', paymentUrl);
        
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
                address_in: addressIn,
                amount: amount
            })
        };
        
    } catch (error) {
        console.error('Payment creation error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            })
        };
    }
};
