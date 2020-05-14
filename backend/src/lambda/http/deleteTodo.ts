import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { deleteTodo } from '../../business-logic/todos-crud'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

const deleteTodoLogger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  deleteTodoLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing TODO Id'

    deleteTodoLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: message })
    }
  }

  let userId

  try {
    userId = getUserId(event)

    await deleteTodo(userId, todoId)
  } catch (error) {
    deleteTodoLogger.info('Error while trying to delete an item', {
      error,
      userId,
      todoId
     })

    return {
      statusCode: error.statusCode || 501,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 200,
    headers: responseHeader,
    body: JSON.stringify({})
  }
}
