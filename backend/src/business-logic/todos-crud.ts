import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import { Access } from '../data-layer/access'

import { createLogger } from '../utils/logger'

const todosS3FileBucket = process.env.TODOS_FILES_S3_BUCKET;
const region = process.env.REGION;

const access = new Access();
const logger = createLogger('business logic')

export async function createTodo(userId, newTodo: CreateTodoRequest): Promise<TodoItem> {
  logger.info('create todo', {
    userId,
    newTodo
  })

  const createdAt = (new Date()).toISOString();
  const todoId = uuid.v4();
  const todoItem: TodoItem = {
    todoId,
    userId,
    createdAt,
    done: false,
    attachmentUrl: `https://${todosS3FileBucket}.s3${region ? `.${region}` : ''}.amazonaws.com/${todoId}`,
    ...newTodo
  };

  logger.info('create todo item', { todoItem })

  await access.createTodo(todoItem)

  return todoItem
}

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  logger.info('get all todos', { userId })

  const items = await access.getAllTodos(userId)

  logger.info('get all todos items', { items })

  return items
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
  logger.info('update todo', {
    userId,
    todoId,
    updatedTodo
  })

  const result = await access.getTodo(userId, todoId)

  logger.info('update todo item', { result })

  if (!result) {
    throw {
      statusCode: 404,
      message: 'No records found'
    }
  }

  const
    { createdAt } = result,
    {
      name,
      dueDate,
      done
    } = updatedTodo,
    todoItem: TodoUpdate = {
      name,
      dueDate,
      done
    }

  await access.updateTodo(userId, createdAt, todoItem)
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  logger.info('delete todo', {
    userId,
    todoId
  })

  const result = await access.getTodo(userId, todoId)

  logger.info('delete todo item', { result })

  if (!result) {
    throw {
      statusCode: 404,
      message: 'No records found'
    }
  }

  const { createdAt } = result

  await access.deleteTodo(userId, createdAt)
}

export function generateTodoUploadUrl(todoId: string) {
  logger.info('generate todo upload url', { todoId })

  const uploadUrl = access.getTodoFileUploadSignedUrl(todoId)

  logger.info('generate todo upload url uploadUrl', { uploadUrl })

  return uploadUrl
}