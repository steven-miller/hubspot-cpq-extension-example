import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Divider,
  Button,
  hubspot,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  NumberInput,
  TableCell,
  Select,
  LoadingSpinner,
  Text,
  Heading,
} from "@hubspot/ui-extensions";

const productItems = (response) => response.data.CRM.product_collection.items;

const getStandardTierProducts = (response) =>
  productItems(response).filter((product) => product.tier.value === "standard");

const getEnterpriseTierProducts = (response) =>
  productItems(response).filter(
    (product) => product.tier.value === "enterprise"
  );

// From https://stackoverflow.com/a/16233919
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

hubspot.extend(({ context, actions }) => (
  <CPQ
    context={context}
    sendAlert={actions.addAlert}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));

// todo: do I need context
const CPQ = ({ context, sendAlert, refreshObjectProperties }) => {
  // ui management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState(null);
  const [portalReady, setPortalReady] = useState();

  // "tier" packages
  // todo: move to `useReducer`?
  const [standardTier, setStandardTier] = useState([]);
  const [enterpriseTier, setEnterpriseTier] = useState([]);

  const getProductsByTier = async () =>
    await hubspot.serverless("getProductsByTier");

  const getIsPortalConfigured = async () =>
    await hubspot.serverless("getIsPortalConfigured");

  const setupPortal = async () => await hubspot.serverless("setupPortal");

  const addLineItems = ({ products, total }) => {
    return hubspot.serverless("createBundle", {
      propertiesToSend: ["hs_object_id", "amount"],
      parameters: { products, total },
    });
  };

  const handleAddToDeal = ({ products, total }) => {
    setSaving(true);
    addLineItems({ products, total }).then((resp) => {
      refreshObjectProperties();
      setSaving(false);
      sendAlert({ type: "success", message: "Package succcessfully added!" });
    });
  };

  const handleGetProductsByTier = async () => {
    const products = await getProductsByTier();

    const standardProducts = getStandardTierProducts(products);
    const enterpriseProducts = getEnterpriseTierProducts(products);

    setStandardTier(standardProducts);
    setEnterpriseTier(enterpriseProducts);
  };

  useEffect(async () => {
    setLoading(true);
    const isPortalConfigured = await getIsPortalConfigured();
    setPortalReady(isPortalConfigured);

    if (isPortalConfigured) {
      await handleGetProductsByTier();
    }

    setLoading(false);
  }, []); // todo: evaluate deps in hooks

  const handleSetupPortal = async () => {
    setLoading(true);

    try {
      await setupPortal();
      setPortalReady(true);
      await handleGetProductsByTier();
      setLoading(false);
      sendAlert({
        message: "Portal successfully updated!",
        type: "success",
      });
    } catch {
      sendAlert({
        message:
          "The setup script encountered an error. Please refresh the page and try again.",
        type: "error",
      });

      throw e;
    }
  };

  // todo: probably a clever way to use one "total" rather than split logic everywhere
  const standardTotal = useMemo(() => {
    return standardTier.reduce(
      (total, product) =>
        total + Number(product.hs_price_usd) * product.default_quantity,
      0
    );
  }, [standardTier]);

  const enterpriseTotal = useMemo(() => {
    return enterpriseTier.reduce(
      (total, product) =>
        total + Number(product.hs_price_usd) * product.default_quantity,
      0
    );
  }, [enterpriseTier]);

  const getProductTableBody = useCallback((productsByTier, setLineItem) =>
    productsByTier.map((product, index) => (
      <TableRow>
        <TableCell>{product.name}</TableCell>
        <TableCell>{formatter.format(product.hs_price_usd)}</TableCell>
        <TableCell>
          <NumberInput
            min={0}
            precision={0}
            value={product.default_quantity}
            onChange={(value) =>
              setLineItem((prev) => {
                const newState = [...prev];
                // todo: moving to reducer should ensure immutability here
                newState[index] = {
                  ...newState[index],
                  default_quantity: value, // todo: change name
                };
                return newState;
              })
            }
          />
        </TableCell>
        <TableCell>
          {formatter.format(
            Number(product.hs_price_usd) * product.default_quantity
          )}
        </TableCell>
      </TableRow>
    ))
  );

  // todo: break up into components
  return (
    <>
      {portalReady === false && loading === false && (
        <>
          <Heading>Setup</Heading>
          <Text>
            Looks like your portal isn't set up for the CPQ example! Click the
            button below for a one-click setup of product properties and
            records.
          </Text>
          <Button onClick={() => handleSetupPortal()}>Set up now</Button>
        </>
      )}
      {loading === false && portalReady === true && (
        <>
          <Select
            label="Select a package"
            required={true}
            value={tier}
            onChange={(value) => {
              setTier(value);
            }}
            options={[
              {
                label: "Standard",
                value: "standard",
              },
              {
                label: "Enterprise",
                value: "enterprise",
              },
            ]}
          />
          {tier !== null && (
            <>
              <Divider />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Price</TableHeader>
                    <TableHeader>Quantity</TableHeader>
                    <TableHeader>Total Cost</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tier === "standard" &&
                    getProductTableBody(standardTier, setStandardTier)}
                  {tier === "enterprise" &&
                    getProductTableBody(enterpriseTier, setEnterpriseTier)}
                </TableBody>
              </Table>
              <Text>
                Total:{" "}
                {tier === "standard"
                  ? formatter.format(standardTotal)
                  : formatter.format(enterpriseTotal)}
              </Text>
              {!saving && (
                <Button
                  onClick={() => {
                    if (tier === "standard") {
                      return handleAddToDeal({
                        products: standardTier,
                        total: standardTotal,
                      });
                    }
                    return handleAddToDeal({
                      products: enterpriseTier,
                      total: enterpriseTotal,
                    });
                  }}
                >
                  Add to deal
                </Button>
              )}
              {saving && <LoadingSpinner />}
            </>
          )}
        </>
      )}
      {loading === true && <LoadingSpinner />}
    </>
  );
};
