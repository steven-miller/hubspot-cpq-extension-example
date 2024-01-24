// for HubSpot API calls
const hubspot = require("@hubspot/api-client");

// Initialize HubSpot API client
const hubspotClient = new hubspot.Client({
  accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
});

// Entry function of this module, it creates line items
exports.main = async (context = {}) => {
  const { hs_object_id, amount } = context.propertiesToSend;
  const { products, total } = context.parameters;

  const lineItems = [];
  products.forEach((product) => {
    lineItems.push(
      addLineItem({
        productId: product.hs_object_id, // product ID
        dealId: hs_object_id,
        quantity: product.default_quantity,
      })
    );
  });

  await Promise.all(lineItems);

  const deal = await updateDeal({
    dealId: hs_object_id,
    amount,
    total,
  });

  return { deal };
};

// Function to create a line item and associate with deal and product
// todo: move to bulk update
async function addLineItem({ productId, dealId, quantity }) {
  const request = {
    properties: {
      hs_product_id: productId,
      quantity,
    },
    associations: [
      {
        to: { id: dealId },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: hubspot.AssociationTypes.lineItemToDeal,
          },
        ],
      },
    ],
  };

  await hubspotClient.crm.lineItems.basicApi.create(request);
}

async function updateDeal({ dealId, amount, total }) {
  await hubspotClient.crm.deals.basicApi.update(dealId, {
    properties: {
      amount: Number(amount) + total,
    },
  });
}
