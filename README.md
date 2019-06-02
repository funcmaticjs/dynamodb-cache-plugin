# dynamodb-cache-plugin

Funcmatic plugin that creates a simple async cache interface (get, set, del) around DynamoDB.

## Environment Variables

This plugin requires the following variables to be defined in `ctx.env` after the env lifecycle.

- `FUNC_DYNAMODB_CACHE_TABLE`: The name of the DynamoDB table to use as a cache.

## Side Effects `ctx` 

- `ctx.state.cache`: Instance of the DynamoDB cache client.

## Usage

