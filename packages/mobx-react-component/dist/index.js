
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./mobx-react-component.cjs.production.min.js')
} else {
  module.exports = require('./mobx-react-component.cjs.development.js')
}
