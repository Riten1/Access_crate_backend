import crypto from "crypto";


export const generateSignature = (params) => {
  // Validate required parameters
  if (
    !params.total_amount ||
    !params.transaction_uuid ||
    !params.product_code
  ) {
    throw new Error("Missing required parameters for signature generation");
  }

  // Validate secret key exists
  if (!process.env.ESEWA_SECRET_KEY) {
    throw new Error(
      "ESEWA_SECRET_KEY is not configured in environment variables"
    );
  }

  const { total_amount, transaction_uuid, product_code } = params;
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
};

// You can add other eSewa related utilities here
export const verifyEsewaSignature = (params, signature) => {
  const generatedSignature = generateSignature(params);
  return generatedSignature === signature;
};
