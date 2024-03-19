import Stripe from "stripe";
import { buffer } from "micro";
import Cors from "micro-cors";

const stripe = new Stripe(
  "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"
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

const cors = Cors({
  allowMethods: ["POST", "HEAD"],
});

const webhookHandler = async (req, res) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        signature,
        webhookSecret
      );
    } catch (err) {
      // On error, log and return the error message.
      console.log(`❌ Error message: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Successfully constructed event.
    console.log("✅ Success:", event.id);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent status: ${paymentIntent.status}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(
          `❌ Payment failed: ${paymentIntent.last_payment_error?.message}`
        );
        break;
      }
      case "charge.succeeded": {
        const charge = event.data.object;
        console.log(`Charge id: ${charge.id}`);
        break;
      }
      default: {
        console.warn(`Unhandled event type: ${event.type}`);
        break;
      }
    }

    // Return a response to acknowledge receipt of the event.
    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default cors(webhookHandler);
