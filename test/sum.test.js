import {sum, CalculadoraCapacidad} from '../lib/index'
import {empresas,getTramiteFromState} from '../examples/index'

describe('Primer test', () => {
 

  it('test indices',() => {
    const calculadora = new CalculadoraCapacidad(getTramiteFromState())
    console.dir(calculadora.calcularIndicesPorEjercicio(getTramiteFromState().ejercicios[0]))
    expect(1).toBe(1)
  })


  it('Certificaciones por periodo', ()=> {
    const calculadora = new CalculadoraCapacidad(getTramiteFromState())
    const result = calculadora
      .getMontoCertificacionesPorPeriodo()
      .aplicarIndiceCorreccion()
      .ordenarMontoDescendente()
      .tomarLosTresPrimerosElementos()
      .value
    expect(1).toBe(1)
  })
})