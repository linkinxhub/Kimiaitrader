import { getPaymentsHealth } from "../_lib/market.js";

export default async function handler(_request, response) {
  response.status(200).json(getPaymentsHealth());
}
