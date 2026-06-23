export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planName, amount, userEmail, userId } = req.body;

  const payload = {
    order_amount: amount,
    order_currency: "INR",
    order_id: `PT_${userId}_${Date.now()}`,
    customer_details: {
      customer_id: userId,
      customer_email: userEmail,
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: `https://www.pulsetrade.in/payment-status?order_id={order_id}`,
    },
    order_note: `PulseTrade ${planName} Plan`,
  };

  const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": process.env.CASHFREE_TEST_APP_ID,
      "x-client-secret": process.env.CASHFREE_TEST_SECRET_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: data.message || "Cashfree error" });
  }

  return res.status(200).json({
    payment_session_id: data.payment_session_id,
    order_id: data.order_id,
  });
}
