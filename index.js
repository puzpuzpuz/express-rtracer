'use strict'

const cls = require('cls-hooked')
const uuidv4 = require('uuid/v4')

// generate a unique value for namespace
const nsid = `rtracer:${uuidv4()}`
const ns = cls.createNamespace(nsid)

/**
 * Generates a request tracer middleware.
 * @param {Object} options possible options
 * @param {boolean} options.useHeader respect request header flag
 *                                    (default: `true`)
 * @param {string} options.headerName request header name, used if `useHeader` is set to `true`
 *                                    (default: `X-Request-Id`)
 */
const middleware = ({
  useHeader = true,
  headerName = 'X-Request-Id'
} = {}) => {
  return (req, _, next) => {
    let requestId
    if (useHeader) {
      requestId = req.headers[headerName.toLowerCase()]
    }
    requestId = requestId || uuidv4()

    ns.run(() => {
      ns.set('requestId', requestId)
      next()
    })
  }
}

/**
 * Returns request tracer id or `undefined` in case if the call is made from an outside CLS context.
 */
const id = () => {
  if (ns && ns.active) {
    return ns.get('requestId')
  }
}

module.exports = {
  middleware,
  id
}
