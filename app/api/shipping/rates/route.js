export const dynamic = 'force-dynamic';

// Delegate to the strict implementation to ensure no fallbacks are used.
import { POST as realPOST } from "../shop/shipping-rates/route";

export async function POST(req) {
  return realPOST(req);
}
