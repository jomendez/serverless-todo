import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { createTodo } from '../../business-logic/todos-crud'

const createTodoLogger = createLogger('createTodoLambda')
const responseHeader = { 'Access-Control-Allow-Origin': '*' }

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  createTodoLogger.info('Processing event', { event })

  const todoNew: CreateTodoRequest = JSON.parse(event.body)

  let todoItem, userId

  try {
    userId = getUserId(event)
    todoItem = await createTodo(userId, todoNew)
  } catch (error) {
    createTodoLogger.error('Error while trying to insert todo', {
      error,
      userId,
      todoNew
    })

    return {
      statusCode: error.statusCode || 500,
      headers: responseHeader,
      body: JSON.stringify({ error })
    }
  }

  return {
    statusCode: 201,
    headers: responseHeader,
    body: JSON.stringify({ item: todoItem })
  }
}
