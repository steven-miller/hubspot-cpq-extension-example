# HubSpot Example CPQ App

This is an example "Configure, Price, Quote" app for HubSpot UI extensions. HubSpot has the ability to "price" and "quote", but many custom logic "configuration" options are not availabe out of the box.

This app is designed to give a starting ground of ideas that could be customized to your company's CPQ needs.

## Preview

Here it is in action - in this GIF, I:

1. Choose a "bundle" of products from the HubSpot product catalog
2. Configure a custom quantity for one of the products, above the default quantity for this bundle
3. Click "add to deal" and observe both the deal amount and line items being updated

![demo-gif](bundle.gif)

## Current features

✅ Able to "bundle" line items and add them onto a deal in bulk

## Potential future features:

- [ ] Automatic discounting based on "tier" and quantity of given products
- [ ] Limits and other business logic, depending on the product
- [ ] Creating quotes automatically alongside line items
- [ ] Inventory management

## Requirements

There are a few things that must be set up before you can make use of this getting started project.

- You must have an active HubSpot account.
- You must have the [HubSpot CLI](https://www.npmjs.com/package/@hubspot/cli) installed and set up.
- You must have access to developer projects (developer projects are currently [in public beta under "CRM Development Tools"](https://app.hubspot.com/l/whats-new/betas)).

I recommend following step 1 of this guide, "Set up your local environment", to get configured quickly: https://developers.hubspot.com/docs/platform/ui-extensions-quickstart#set-up-your-local-environment

## Usage

The HubSpot CLI enables you to run this project locally so that you may test and iterate quickly. Getting started is simple, just run this HubSpot CLI command in your project directory and follow the prompts:

`hs project dev`
