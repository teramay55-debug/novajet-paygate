// ========== NOVAJET AIRWAYS - DIRECT USDC PAYMENT ==========
const MY_USDC_POLYGON_WALLET = "0xeABA510c0F7286B894A7C9229F41dC1ee0e8038E";

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

        // Store order info (optional - for tracking)
        console.log('Order created:', { orderId, customerName, customerEmail, amount });

        // Return manual payment instructions with wallet address
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                manual_wallet: MY_USDC_POLYGON_WALLET,
                order_id: orderId,
                amount: amount,
                customer_name: customerName,
                customer_email: customerEmail
            })
        };

    } catch (error) {
        console.error('Error:', error.message);
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
                fallback: true
            })
        };
    }
};
