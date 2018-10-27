const test = require('tape').test
const registry = require('../star-registry')

test('requestValidation', (t) => {
  let result = registry.requestValidation('abc123')
  t.equals('abc123', result.response.address, 'Registered address is correct')
  t.equals(true, result.response.requestTimeStamp <= Date.now(), 'Timestamp is reasonable')
  t.equals(300, result.response.validationWindow, 'Initial validation window is 300 seconds')
  t.equals(`abc123:${result.response.requestTimeStamp}:starRegistry`, result.response.message, 'Message is formatted correctly')

  // Additional validation requests with same address should just return remaining time
  result = registry.requestValidation('abc123')
  t.equals(true, result.response.validationWindow < 300, 'Validation window shrinks')

  t.end()
})
