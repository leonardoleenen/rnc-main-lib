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
  
      // 


      var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      
        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
      });

      console.log('Capacidad Ejecucion',formatter.format(capacidadEjecucion))
      console.log('Capacidad Financiera',formatter.format(capacidadFinanciera))

      //console.log(calculadora.getEvidencia())

    
    expect(1).toBe(1)
  })

  

})