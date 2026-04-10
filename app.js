const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let database = null

const initializeDBServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is Listening at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBServer()

const hasPriorityAndStatusProperties = reqQuery => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined
}

const hasPriorityProperty = reqQuery => {
  return reqQuery.priority !== undefined
}

const hasStatusProperty = reqQuery => {
  return reqQuery.status !== undefined
}

//API 1->Returns a list of all todos whose status is 'TO DO'
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%' AND 
          status = '${status}' AND 
          priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%' AND
          priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      break

    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`
  }

  data = await database.all(getTodosQuery)
  respond.send(data)
})

//API 2->Returns a specific todo based on the todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};
  `

  const todo = await database.get(getTodoQuery)
  response.send(todo)
})

//API 3
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const addTodoQuery = `
    INSERT INTO todo (
      id, todo, priority, status
    )
    VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}'
    );
  `

  await database.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//API 3
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  let updateColumn = ''

  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break

    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break

    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId}
  `

  const previousTodo = await database.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};
  `

  await database.run(updateTodoQuery)
  respond.send(`${updateColumn} Updated`)
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};
  `

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app