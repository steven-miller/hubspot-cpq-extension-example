const hubspot = require("@hubspot/api-client");

exports.main = async () => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env["PRIVATE_APP_ACCESS_TOKEN"],
  });

  const BatchReadInputPropertyName = {
    inputs: [{ name: "default_quantity" }, { name: "tier" }],
  };
  const objectType = "0-7";

  try {
    const apiResponse = await hubspotClient.crm.properties.batchApi.read(
      objectType,
      BatchReadInputPropertyName
    );
    console.log(JSON.stringify(apiResponse, null, 2));

    if (apiResponse.numErrors && apiResponse.numErrors > 0) {
      // some properties are missing
      return false;
    } else {
      return true;
    }
  } catch (e) {
    e.message === "HTTP request failed"
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e);
    return e;
  }
};
