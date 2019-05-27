require('dotenv').config()
const AWS = require('aws-sdk')
const client = new AWS.DynamoDB.DocumentClient()
const DynamoDBCacheWrapper = require('../lib/dynamodb')
const { promisify } = require('util')
const DEFAULT_DATA = { hello: "world" }

describe('Basic Get Set Del', () => {
  let cache = null
  beforeEach(() => {
    cache = new DynamoDBCacheWrapper(client, {
      tableName: process.env.FUNC_DYNAMODB_CACHE_TABLE
    })
  })
  afterEach(async () => {
  })
  it ('should do basic dynamodb cache operations', async () => {
    let key = `my-cache:my-key`
    let value = DEFAULT_DATA
    let data = await cache.get(key)
    expect(data).toBeFalsy()
    await cache.set(key, value)
    data = await cache.get(key)
    expect(data).toMatchObject(value)
    await cache.del(key)
    data = await cache.get(key)
    expect(data).toBeFalsy()
  }, 10 * 1000)
  it ('should set ttl', async () => {
    let key = `my-cache:my-key-ttl`
    let value = DEFAULT_DATA
    // TTL = 1 second
    await cache.set(key, value, 1)
    let data = await cache.get(key)
    expect(data).toMatchObject(value)
    await wait(2 * 1000)
    data = await cache.get(key)
    expect(data).toBeFalsy()
  })
})

describe('Keys and Scan', () => {
  let cache = null
  const key = "component:scan-key-1"
  beforeEach(async () => {
    cache = new DynamoDBCacheWrapper(client, {
      tableName: process.env.FUNC_DYNAMODB_CACHE_TABLE
    })
    await cache.set(key, DEFAULT_DATA)
  })
  afterEach(async () => {
    await cache.del(key)
  })
  it ('should scan with no results', async () => {
    let data = await cache.scan('noresults:')
    expect(data.Items.length).toBe(0)
  })
  it ('should scan with results', async () => {
    let data = await cache.scan('component:')
    expect(data.Items.length).toBe(1)
    expect(data).toMatchObject({
      "Items": [ [ key, DEFAULT_DATA ] ]
    })
  })
  it ('should only return keys', async () => {
    let data = await cache.keys('component:')
    expect(data.length).toBe(1)
    expect(data[0]).toEqual(key)
  })
  it ('should return no keys', async () => {
    let data = await cache.keys('noresults:')
    expect(data.length).toBe(0)
  })
})

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}