const hubspot = require("@hubspot/api-client");

exports.main = async () => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  try {
    const productProperties = await createProductProperties(hubspotClient);
    const products = await createProducts(hubspotClient);

    return { productProperties, products };
  } catch (e) {
    return e;
  }
};

async function createProductProperties(hubspotClient) {
  const BatchInputPropertyCreate = {
    inputs: [
      {
        label: "Default Quantity",
        type: "number",
        fieldType: "number",
        groupName: "productinformation",
        hidden: false,
        displayOrder: -1,
        hasUniqueValue: false,
        formField: true,
        options: [],
        description:
          'The default quantity for a given product when included in a "package". Defined by the Hubspot CPQ example extension.',
        name: "default_quantity",
      },
      {
        description:
          'Tier of the "package" which the product belongs to. Created as part of the HubSpot example CPQ extension.',
        label: "Tier",
        type: "enumeration",
        groupName: "productinformation",
        name: "tier",
        options: [
          { label: "Standard", value: "standard" },
          { label: "Enterprise", value: "enterprise" },
        ],
        fieldType: "select",
      },
    ],
  };
  const objectType = "0-7";

  try {
    const apiResponse = await hubspotClient.crm.properties.batchApi.create(
      objectType,
      BatchInputPropertyCreate
    );
    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);

    throw e;
  }
}

async function createProducts(hubspotClient) {
  const BatchInputSimplePublicObjectInputForCreate = {
    inputs: [
      {
        properties: {
          name: "[Standard] Core Offering",
          price: "5000.00",
          default_quantity: 1,
          tier: "standard",
        },
        associations: [],
      },
      {
        properties: {
          name: "[Standard] Implementation",
          price: "3000.00",
          default_quantity: 1,
          tier: "standard",
        },
      },
      {
        properties: {
          name: "[Standard] Add-on A",
          price: "10.00",
          default_quantity: 500,
          tier: "standard",
        },
      },
      {
        properties: {
          name: "[Enterprise] Core Offering",
          price: "8000.00",
          default_quantity: 1,
          tier: "enterprise",
        },
      },
      {
        properties: {
          name: "[Enterprise] Implementation",
          price: "5000.00",
          default_quantity: 1,
          tier: "enterprise",
        },
      },
      {
        properties: {
          name: "[Enterprise] Add-on A",
          price: "7.00",
          default_quantity: 1000,
          tier: "enterprise",
        },
      },
      {
        properties: {
          name: "[Enterprise] Add-on B",
          price: "10.00",
          default_quantity: 250,
          tier: "enterprise",
        },
      },
    ],
  };

  try {
    const apiResponse = await hubspotClient.crm.products.batchApi.create(
      BatchInputSimplePublicObjectInputForCreate
    );
    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);

    throw e;
  }
}
