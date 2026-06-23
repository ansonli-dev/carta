export function defaultOpenApiSource(title: string) {
  return `openapi: 3.0.3
info:
  title: ${title}
  version: 1.0.0
  description: |-
    ## Overview

    This sample API is stored as the project's first source revision. It gives a
    new project enough realistic OpenAPI structure for docs, endpoint cataloging,
    and mock generation without requiring the web client to invent data.
servers:
  - url: https://api.example.com
    description: Production
  - url: https://sandbox.example.com
    description: Sandbox
security:
  - ApiKeyAuth: []
tags:
  - name: Todos
    description: Task planning and status endpoints.
  - name: Users
    description: User profile endpoints used by the todo workflow.
paths:
  /todos:
    get:
      tags:
        - Todos
      summary: List Todos
      operationId: listTodos
      parameters:
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Returns a list of todos.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
              examples:
                default:
                  $ref: '#/components/examples/TodoList'
        '401':
          $ref: '#/components/responses/Unauthorized'
    post:
      tags:
        - Todos
      summary: Create Todo
      operationId: createTodo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
            examples:
              default:
                $ref: '#/components/examples/TodoCreate'
      responses:
        '201':
          description: Todo created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '401':
          $ref: '#/components/responses/Unauthorized'
  /todos/{todoId}:
    parameters:
      - $ref: '#/components/parameters/TodoId'
    get:
      tags:
        - Todos
      summary: Get Todo
      operationId: getTodo
      responses:
        '200':
          description: Returns the requested todo.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          $ref: '#/components/responses/NotFound'
    put:
      tags:
        - Todos
      summary: Replace Todo
      operationId: replaceTodo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
      responses:
        '200':
          description: Todo replaced.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          $ref: '#/components/responses/NotFound'
    patch:
      tags:
        - Todos
      summary: Update Todo
      operationId: updateTodo
      deprecated: true
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoUpdate'
      responses:
        '200':
          description: Todo updated.
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      tags:
        - Todos
      summary: Delete Todo
      operationId: deleteTodo
      responses:
        '204':
          description: Todo deleted.
        '404':
          $ref: '#/components/responses/NotFound'
  /users:
    get:
      tags:
        - Users
      summary: List Users
      operationId: listUsers
      security: []
      responses:
        '200':
          description: Returns users.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      tags:
        - Users
      summary: Create User
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
            examples:
              default:
                $ref: '#/components/examples/UserCreate'
      responses:
        '201':
          description: User created.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /users/{userId}:
    parameters:
      - $ref: '#/components/parameters/UserId'
    get:
      tags:
        - Users
      summary: Get User
      operationId: getUser
      responses:
        '200':
          description: Returns the requested user.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
    delete:
      tags:
        - Users
      summary: Delete User
      operationId: deleteUser
      responses:
        '204':
          description: User deleted.
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Use any demo value, for example 123.
  parameters:
    Limit:
      name: limit
      in: query
      required: false
      description: Maximum number of records to return.
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    TodoId:
      name: todoId
      in: path
      required: true
      schema:
        type: string
        example: todo_123
    UserId:
      name: userId
      in: path
      required: true
      schema:
        type: string
        example: usr_123
  schemas:
    Todo:
      type: object
      required:
        - id
        - title
        - completed
        - owner
        - createdAt
      properties:
        id:
          type: string
          readOnly: true
          example: todo_123
        title:
          type: string
          example: Review API changelog
        completed:
          type: boolean
          default: false
        priority:
          type: string
          enum:
            - low
            - medium
            - high
        owner:
          $ref: '#/components/schemas/User'
        createdAt:
          type: string
          format: date-time
          readOnly: true
    TodoCreate:
      type: object
      required:
        - title
        - ownerId
      properties:
        title:
          type: string
          example: Review API changelog
        ownerId:
          type: string
          example: usr_123
        priority:
          type: string
          enum:
            - low
            - medium
            - high
    TodoUpdate:
      type: object
      properties:
        title:
          type: string
        completed:
          type: boolean
    User:
      type: object
      required:
        - id
        - firstName
        - lastName
        - email
      properties:
        id:
          type: string
          readOnly: true
          example: usr_123
        firstName:
          type: string
          example: Avery
        lastName:
          type: string
          example: Stone
        email:
          type: string
          format: email
          example: avery@example.com
    UserCreate:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          example: Avery
        lastName:
          type: string
          example: Stone
        email:
          type: string
          format: email
          example: avery@example.com
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
  responses:
    Unauthorized:
      description: API key is missing or invalid.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found.
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  examples:
    TodoList:
      value:
        - id: todo_123
          title: Review API changelog
          completed: false
          priority: high
          owner:
            id: usr_123
            firstName: Avery
            lastName: Stone
            email: avery@example.com
          createdAt: '2026-06-23T09:00:00Z'
    TodoCreate:
      value:
        title: Review API changelog
        ownerId: usr_123
        priority: high
    UserCreate:
      value:
        firstName: Avery
        lastName: Stone
        email: avery@example.com
`;
}
