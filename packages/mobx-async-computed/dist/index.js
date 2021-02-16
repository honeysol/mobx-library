
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./mobx-async-computed.cjs.production.min.js')
} else {
  module.exports = require('./mobx-async-computed.cjs.development.js')
}
