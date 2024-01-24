const axios = require("axios");

exports.main = async (context = {}) => {
  // const's are set by parameters that were passed in and from our secrets
  // todo: this is only working locally
  const PRIVATE_APP_TOKEN = process.env["PRIVATE_APP_ACCESS_TOKEN"];

  try {
    // Fetch associated shipments and assign to a const
    const { data } = await fetchProducts(query, PRIVATE_APP_TOKEN);

    // Send the response data
    return data;
  } catch (e) {
    return e;
  }
};

const fetchProducts = (query, token) => {
  // Set our body for the axios call
  const body = {
    operationName: "ProductsByTier",
    query,
  };
  // return the axios post
  return axios.post(
    "https://api.hubapi.com/collector/graphql",
    JSON.stringify(body),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// GraphQL query to get products with known tier
const query = `
query ProductsByTier {
  CRM {
    product_collection(filter: {tier__null: false}) {
      items {
        hs_object_id
        name
        default_quantity
        hs_price_usd
        tier
      }
    }
  }
}

`;
