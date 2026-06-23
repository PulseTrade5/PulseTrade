export default async function handler(req, res) {
  const { order_id } = req.query;
  if (!order_id) return res.status(400).json({ error: 'Order ID missing' });

  try {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Verification failed' });
    }

    return res.status(200).json({
      order_id: data.order_id,
      status: data.order_status,
      amount: data.order_amount,
      currency: data.order_currency,
      customer_email: data.customer_details?.customer_email,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
