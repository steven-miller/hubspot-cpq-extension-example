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
} from "@hubspot/ui-extensions";

const MINIMUM_PURCHASE_USD = 10000;

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

// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, actions }) => (
  <Extension
    context={context}
    sendAlert={actions.addAlert}
    refreshObjectProperties={actions.refreshObjectProperties}
  />
));

// Define the Extension component, taking in runServerless, context, & sendAlert as props
const Extension = ({ context, sendAlert, refreshObjectProperties }) => {
  // ui management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState("standard");

  // "tier" packages
  // todo: move to `useReducer`
  const [standardTier, setStandardTier] = useState([]);
  const [enterpriseTier, setEnterpriseTier] = useState([]);

  const getProductsByTier = async () =>
    await hubspot.serverless("getProductsByTier");

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

  useEffect(() => {
    setLoading(true);
    getProductsByTier().then((resp) => {
      setStandardTier(getStandardTierProducts(resp));
      setEnterpriseTier(getEnterpriseTierProducts(resp));
      setLoading(false);
      // todo: add catch
    });
  }, []); // todo: evaluate deps in hooks

  const standardTotal = useMemo(() => {
    return standardTier.reduce(
      (total, product) =>
        total + Number(product.hs_price_usd) * product.default_quantity,
      0
    );
  }, [standardTier]);

  const standardShortfall = useMemo(() => {
    return standardTotal - MINIMUM_PURCHASE_USD;
  }, [standardTotal]);

  const enterpriseTotal = useMemo(() => {
    return enterpriseTier.reduce(
      (total, product) =>
        total + Number(product.hs_price_usd) * product.default_quantity,
      0
    );
  }, [enterpriseTier]);

  const enterpriseShortfall = useMemo(() => {
    return enterpriseTotal - MINIMUM_PURCHASE_USD;
  }, [enterpriseTotal]);

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

  return (
    <>
      {loading === false && (
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
              {tier === "standard" && standardShortfall < 0 && (
                <Text>
                  Shortfall: {formatter.format(Math.abs(standardShortfall))}
                </Text>
              )}
              {tier === "enterprise" && enterpriseShortfall < 0 && (
                <Text>
                  Shortfall: {formatter.format(Math.abs(enterpriseShortfall))}
                </Text>
              )}
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
