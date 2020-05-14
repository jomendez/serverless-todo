import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const accessControlAllowOrigin = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import { getAllTodos } from '../../business-logic/todos-crud'

const getTodosLogger = createLogger('getTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  getTodosLogger.info('Processing event', { event })

  let userId, todos

  try {
    const userId = getUserId(event)

    todos = await getAllTodos(userId)
  } catch (error) {
    getTodosLogger.error('Error while trying to get todos', {
      error,
      userId
    })

    return {
      statusCode: 500,
      headers: accessControlAllowOrigin,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 200,
    headers: accessControlAllowOrigin,
    body: JSON.stringify({ items: todos })
  }
}
