import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWSXRay = require('aws-xray-sdk')

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { createLogger } from '../utils/logger'

const
  XAWS = AWSXRay.captureAWS(AWS),
  todosAccessLogger = createLogger('todosAccess')

export class Access {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosIdIndex = process.env.TODOS_ID_INDEX,
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly bucketName = process.env.TODOS_FILES_S3_BUCKET
  ) {
    todosAccessLogger.info('constructing access class', {
      todosTable,
      todosIdIndex
    })
  }

  async createTodo(todoItem: TodoItem): Promise<void> {
    todosAccessLogger.info('creating new todo', { todoItem })

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()
  }

  async updateTodo(userId: string, createdAt: string, todoItem: TodoUpdate): Promise<void> {
    todosAccessLogger.info('updating todo', {
      userId,
      createdAt,
      todoItem
    })

    const {
      name,
      dueDate,
      done
    } = todoItem

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        createdAt
      },
      UpdateExpression: 'set #todoName=:todoName, dueDate=:dueDate, done=:done',
      ExpressionAttributeNames: { '#todoName': 'name' },
      ExpressionAttributeValues: {
        ':todoName': name,
        ':dueDate': dueDate,
        ':done': done
      }
    }).promise()
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    todosAccessLogger.info('getting all todos', { userId })

    let todoItems = []

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIdIndex,
      KeyConditionExpression: 'userId=:userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }).promise()

    const { Items } = result

    if (Items && Items.length) {
      todoItems = Items
    }

    return todoItems
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    todosAccessLogger.info('getting a todo', {
      userId,
      todoId
    })

    let todoItem

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIdIndex,
      KeyConditionExpression: 'todoId=:todoId AND userId=:userId',
      ExpressionAttributeValues: {
        ':todoId': todoId,
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    const { Items } = result

    if (Items && Items.length) {
      [ todoItem ] = Items
    }

    return todoItem
  }

  getTodoFileUploadSignedUrl(todoId: string): string {
    todosAccessLogger.info('getting todo file upload signed url', { todoId })

    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })

    todosAccessLogger.info('getting todo file upload signed url uploadUrl', { uploadUrl })

    return uploadUrl
  }


  async deleteTodo(userId: string, createdAt: string): Promise<void> {
    todosAccessLogger.info('deleting todo', {
      userId,
      createdAt
    })

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        createdAt
      }
    }).promise()
  }

}