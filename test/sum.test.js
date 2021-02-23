import {sum} from '../lib/index'


describe('Primer test', () => {
  it('un valor verdadero', () => {
    expect(sum(1,2)).toBe(3)
  })
})