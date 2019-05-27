const AWS = require('aws-sdk')
const DynamoDBCacheWrapper = require('./dynamodb')

class DynamoDBCachePlugin {
  
  constructor() {
    this.cache = null
  }

  async start(ctx, next) {
    if (!ctx.env.FUNC_DYNAMODB_CACHE_TABLE) throw new Error("ctx.env.FUNC_DYNAMODB_CACHE_TABLE is not defined")
    this.cache = new DynamoDBCacheWrapper(new AWS.DynamoDB.DocumentClient(), { 
      tableName: ctx.env.FUNC_DYNAMODB_CACHE_TABLE
    })
    ctx.state.cache = this.cache
    await next()
  }

  async request(ctx, next) {
    if (!this.cache) {
      await this.start(ctx, noop)
    }
    if (!ctx.state.cache) {
      ctx.state.cache = this.cache
    }
    await next()
  }

  async error(ctx, next) {
    await this.teardown()
    await next()
  }

  async teardown() {
    this.cache = null
  }
}

module.exports = DynamoDBCachePlugin
