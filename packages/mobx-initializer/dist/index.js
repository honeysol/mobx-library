
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./mobx-initializer.cjs.production.min.js')
} else {
  module.exports = require('./mobx-initializer.cjs.development.js')
}
