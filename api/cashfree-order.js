export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planName, amount, userEmail, userId, orderId, returnUrl } = req.body;

  const payload = {
    order_amount: amount,
    order_currency: "INR",
    order_id: orderId || `PT_${Date.now()}`,
    customer_details: {
      customer_id: userId || `guest_${Date.now()}`,
      customer_email: userEmail || "test@pulsetrade.in",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: returnUrl || `https://pulsetrade.in/payment-status?order_id={order_id}`,
    },
    order_note: `PulseTrade ${planName || 'Monthly'} Plan`,
  };

  try {
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Cashfree response:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data.message || "Cashfree error", details: data });
    }

    return res.status(200).json({
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
    });
  } catch (err) {
    console.error("Cashfree error:", err);
    return res.status(500).json({ error: err.message });
  }
}
