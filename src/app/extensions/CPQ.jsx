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

  // "tier" packages
  // todo: move to `useReducer`?
  const [standardTier, setStandardTier] = useState([]);
  const [enterpriseTier, setEnterpriseTier] = useState([]);

  const getProductsByTier = async () =>
    await hubspot.serverless("getProductsByTier");

  const getIsPortalConfigured = async () =>
    await hubspot.serverless("getIsPortalConfigured");

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

  useEffect(async () => {
    setLoading(true);
    const config = await getIsPortalConfigured();
    console.log(config);
    getProductsByTier().then((resp) => {
      setStandardTier(getStandardTierProducts(resp));
      setEnterpriseTier(getEnterpriseTierProducts(resp));
      setLoading(false);
      // todo: add catch
    });
  }, []); // todo: evaluate deps in hooks

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
