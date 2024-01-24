# Backend Walkthrough

## getProductsByTier

This function retrieves all products and their tiers. This uses HubSpot's GraphQL system (see [more here](https://developers.hubspot.com/docs/cms/data/query-hubspot-data-using-graphql)).

I've chosen to use this as an example, however **note that GraphQL is only available for CMS Professional or Enterprise customers at this time**. I have it marked as a "todo" to fall back to RESTful Product APIs!

## createBundle

Once a product bundle (and item quantities) have been selected, this file creates all the associated line items and attaches them to their relevant product and deal.

For more about line items and their connections to products, deals, and quotes, read more here: https://developers.hubspot.com/docs/api/crm/line-items
