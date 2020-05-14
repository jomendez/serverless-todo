import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

const responseHeader = { 'Access-Control-Allow-Origin': '*' }

import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

import { updateTodo } from '../../business-logic/todos-crud'

const updateTodoLogger = createLogger('updateTodo')

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  updateTodoLogger.info('Processing event', { event })

  const todoId = event.pathParameters.todoId

  if (!todoId) {
    const message = 'Missing todoId'

    updateTodoLogger.error(message)

    return {
      statusCode: 400,
      headers: responseHeader,
      body: JSON.stringify({ error: message })
    }
  }

  const updateItem: UpdateTodoRequest = JSON.parse(event.body)
  let userId

  try {
    userId = getUserId(event)

    await updateTodo(userId, todoId, updateItem)
  } catch (error) {
    updateTodoLogger.error('Error while trying to update item', {
      error,
      userId,
      updateItem
    })

    return {
      statusCode: 500,
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
