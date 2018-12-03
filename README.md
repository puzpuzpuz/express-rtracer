# **Deprecated**: use [cls-rtracer](https://github.com/puzpuzpuz/cls-rtracer) instead

# express-rtracer

Express Request Tracer - a middleware for CLS-based request id generation, batteries included. An out-of-the-box solution for adding request id into your logs.

Automatically generates a UUID value as the id for each request and stores it in Continuation-Local Storage (CLS, see [cls-hooked](https://github.com/jeff-lewis/cls-hooked)). If the request contains `X-Request-Id` header, uses its value instead. Allows to obtain the generated id anywhere in your routes later and use it for logging or any other purposes.

## How to use it

Install:

```bash
npm install --save express-rtracer
```

Use the middleware provided by the library before the first middleware that needs to have access to request ids. Note that some middlewares, e.g. body-parser or express-jwt, may cause CLS context to get lost. To avoid such issues, you should use any third party middleware that does not need access to request ids *before* you use this middleware.

```javascript
const express = require('express')
const rTracer = require('express-rtracer')

const app = express()
// any third party middleware that does not need access to request ids goes here
// ...

app.use(rTracer.middleware())
// you can override default middleware config:
// app.use(rTracer.middleware({
//   headerName: 'X-Your-Request-Header'
// }))

// all code starting from here has access to request ids
```

Obtain request id in middlewares on the incoming request:

```javascript
// an example middleware for a generic find entity endpoint
app.get('/api/v1/entity/{id}', (req, res, next) => {
  entityService.find(req.params.id)
    .then((entity) => {
      // you can obtain the request id here
      const requestId = rTracer.id()
      logger.log(`requestId: ${requestId}`)
      
      res.json(entity)
    })
    .catch(next)
})
```

You can access the same request id from code that does not have access to the Express `req` object.

```javascript
// an imaginary entity-service.js
async function find (entityId) {
  // you can obtain the request id here
  const requestId = rTracer.id()
  // ...
}
```

## Integration with loggers

The main use case for this library is request id generation and logging automation. You can integrate with any logger library in a single place and get request ids in logs across your Express application.

Without having a request id, as a correlation value, in your logs, you will not be able to determine which log entries belong to the process of handling the same request. You could generate a request id manually and store it in the Express `req` object, but then you will have to explicitly pass `req` into all other modules on the route. And express-rtracer comes to the rescue!

Let's consider integration with [winston](https://github.com/winstonjs/winston), one of most popular logging libraries.

```javascript
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

// a custom format that outputs request id
const rTracerFormat = printf((info) => {
  const rid = rTracer.id()
  return rid
    ? `${info.timestamp} [request-id:${rid}]: ${info.message}`
    : `${info.timestamp}: ${info.message}`
})

const logger = createLogger({
  format: combine(
    timestamp(),
    rTracerFormat
  ),
  transports: [new transports.Console()]
})
```

A complete example is available in `/examples/winston.js` file.

## Middleware configuration

These are the available config options for the `middleware(options)` function. Options are optional.

```javascript
{
  // Respect request header flag (default: true).
  // If set to true, the middleware will be using a value from the specified header (if the value is present).
  useHeader: true,
  // Request header name, case insensitive (default: X-Request-Id).
  // Used if useHeader is set to true.
  headerName: 'X-Request-Id'
}
```

## Troubleshooting

To avoid weird behavior with Express:

* Make sure you require `express-rtracer` as the first dependency in your app. Some popular packages may use async which breaks CLS.

For Node 10 users:

* Node 10.0.x-10.3.x is not supported. That's because V8 version 6.6 introduced a bug that breaks async_hooks during async/await. Node 10.4.x uses V8 v6.7 where the bug is fixed. See: https://github.com/nodejs/node/issues/20274.

## License

Licensed under MIT.
