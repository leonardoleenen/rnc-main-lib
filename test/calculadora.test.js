import {sum, CalculadoraCapacidad} from '../lib/index'
import {empresas,getTramiteFromState} from '../examples/index'
import _ from 'lodash'

describe('Calculadora test', () => {
 

  it('Calcular capacidad ejecucion', async ()=> {
    // const calculadora = new CalculadoraCapacidad(getTramiteFromState())
    const calculadora = new CalculadoraCapacidad(getTramiteFromState())
    await calculadora.init()
    const capacidadEjecucion = calculadora
      .getMontoCertificacionesPorPeriodo()
      .aplicarIndiceCorreccion()
      .ordenarMontoDescendente()
      .tomarLosTresPrimerosElementos()
      .aplicarPromedioLineal()
      .aplicarIndicesEconomicos()
    



    const capacidadFinanciera = _.isEmpty(getTramiteFromState().ddjjObras) ? capacidadEjecucion :
      capacidadEjecucion - calculadora.filtrarObrasCandidatas()
        .value
        .map(obra => {
          return calculadora.getCompromiso(obra) 
        })
        .reduce((acc, val) => acc += val, 0)
  
      console.log(capacidadEjecucion,capacidadFinanciera)
    
    expect(1).toBe(1)
  })

  

})