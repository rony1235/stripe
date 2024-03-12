const stripe = require("stripe")(
  "sk_test_51JirpHE2so6yJwQvVpTfDZb0sdN2V7lUdG2mkrbi17rdKYrutZZiDC6ZmtRk6dO7VniDfsJNsTQcmF3LKjDX2I3e00VHPyBY76"
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Create Checkout Sessions from body params.
      const amount = 20;
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Your Product",
              },
              unit_amount: Math.round(parseFloat(amount) * 100), // Stripe requires amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
        automatic_tax: { enabled: true },
      });
      res.redirect(303, session.url);
    } catch (err) {
      res.status(err.statusCode || 500).json(err.message);
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
