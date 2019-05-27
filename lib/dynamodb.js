const { promisify } = require('util')

// Default DynamoDB Schema
// CacheKey [String] /* primary key */
// CacheData [String] 
// Created [epoch]
// CacheExpires [epoch] /* ttl */

class DynamoDBCacheWrapper {

  constructor(client, options) {
    this.tableName = options.tableName
    this.keyName = options.keyName || 'CacheKey'
    this.dataName = options.dataName || 'CacheData'
    this.expiresName = options.expiresName || 'CacheExpires'
    this.client = client
    this.dynamoGet = promisify(client.get).bind(client)
    this.dynamoSet = promisify(client.put).bind(client)
    this.dynamoDel = promisify(client.delete).bind(client)
    this.dynamoScan = promisify(client.scan).bind(client)
  }

  async get(key) {
    let params = {
      TableName: this.tableName,
      Key: { }
    }
    params.Key[this.keyName] = key
    let item = await this.dynamoGet(params)
    if (!item.Item) return null
    // DynamoDB still returns expired Items until they are cleaned up
    // We make it stricter in that if an Item is expired we return null
    if (item.Item[this.expiresName] && item.Item[this.expiresName] <= (Date.now() / 1000)) return null
    return JSON.parse(item.Item[this.dataName])
  }

  async set(key, value, ttl) {
    let params = {
      TableName: this.tableName,
      Item: { }
    }
    params.Item[this.keyName] = key
    params.Item[this.dataName] = JSON.stringify(value)
    if (ttl > 0) {
      params.Item[this.expiresName] = Math.ceil(Date.now()/1000) + ttl // seconds
    }
    return await this.dynamoSet(params)
  }

  async del(key) {
    let params = {
      TableName: this.tableName,
      Key: { }
    }
    params.Key[this.keyName] = key
    return await this.dynamoDel(params)
  }

  async keys(prefix, options) {
    options = options || { }
    let params = {
      TableName: this.tableName,
      FilterExpression: `begins_with(${this.keyName}, :prefix)`,
      ProjectionExpression: `${this.keyName}`,
      ExpressionAttributeValues: {
        ':prefix': prefix
      }
    }
    let data = await this.dynamoScan(params)
    return data.Items.map(item => item[this.keyName])
  }

  async scan(prefix, options) {
    options = options || { }
    let params = {
      TableName: this.tableName,
      FilterExpression: `begins_with(${this.keyName}, :prefix)`,
      ExpressionAttributeValues: {
        ':prefix': prefix
      }
    }
    let data = await this.dynamoScan(params)
    data.Items = data.Items.map((item) => { 
      return [ item[this.keyName], JSON.parse(item[this.dataName]) ]
    })
    return data
  }
}

module.exports = DynamoDBCacheWrapper

