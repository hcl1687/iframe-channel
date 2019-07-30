import chai from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

global.TEST_UTILS = {
  chai,
  assert: chai.assert,
  expect: chai.expect,
  should: chai.should()
}

const testsContext = require.context('./', true, /\.spec\.jsx?$/)
testsContext.keys().forEach(testsContext)

const srcContext = require.context('../../src/', true, /\.jsx?$/)
srcContext.keys().forEach(srcContext)
