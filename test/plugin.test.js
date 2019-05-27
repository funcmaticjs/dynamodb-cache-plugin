require('dotenv').config()
const DynamoDBCachePlugin = require('../lib/plugin')

describe('Start Handler', () => {
  let ctx = null
  let plugin = null
  beforeEach(() => {
    ctx = {
      env: { 
        FUNC_DYNAMODB_CACHE_TABLE: process.env.FUNC_DYNAMODB_CACHE_TABLE
      },
      state: { }
    }
    plugin = new DynamoDBCachePlugin()
  })
  afterEach(async () => {
    await plugin.teardown()
  })
  it ('should throw if ctx.env.FUNC_DYNAMODB_CACHE_TABLE is not defined', async () => {
    ctx.env.FUNC_DYNAMODB_CACHE_TABLE = null
    let error = null
    try {
      await plugin.start(ctx, noop)
    } catch (err) {
      error = err
    }
    expect(error).toBeTruthy()
    expect(error.message).toEqual(expect.stringContaining("ctx.env.FUNC_DYNAMODB_CACHE_TABLE"))
  })
  it ("should set 'ctx.state.cache' with a cache wrapper", async () => {
    await plugin.start(ctx, noop)
    expect(ctx.state.cache).toBeTruthy()
  })
}) 

function noop() { }
