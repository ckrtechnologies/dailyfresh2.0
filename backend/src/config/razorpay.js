import Razorpay from 'razorpay';

/**
 * Returns a Razorpay instance using env vars resolved at call time.
 * Avoids ES module init-order issues where env vars are undefined at import time.
 */
const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(`[Razorpay] Missing credentials. key_id=${key_id ? 'SET' : 'MISSING'}, key_secret=${key_secret ? 'SET' : 'MISSING'}`);
  }

  return new Razorpay({ key_id, key_secret });
};

export default getRazorpay;
