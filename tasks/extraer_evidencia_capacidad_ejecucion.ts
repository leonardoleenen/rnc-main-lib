import { CalculadoraCapacidad, getIndices, getTramiteFromState } from "../lib"
import _ from 'lodash'

(async() => {
  const calculadora = new CalculadoraCapacidad(getTramiteFromState())
  await calculadora.init()
  const capacidadEjecucion = calculadora
    .getMontoCertificacionesPorPeriodo()
    .aplicarIndiceCorreccion()
    .ordenarMontoDescendente()
    .tomarLosTresPrimerosElementos()
    .aplicarPromedioLineal()
    .aplicarIndicesEconomicos()
    .actualizarPorAntiguedad()
    .value

  const capacidadFinanciera = 
    calculadora.filtrarObrasCandidatas()
      .value
      .map( obra => {
        return  calculadora.getCompromiso(obra) +  calculadora.getIndicadorMultiplicador(obra) 
      })
      .reduce( (acc,val) =>  acc += val,0)
      
  //console.log(getTramiteFromState().ddjjObras[0])
  console.log({
    //capacidadEjecucion,
    //capacidadFinanciera:  capacidadFinanciera - capacidadEjecucion,
    evidencia: calculadora.getEvidencia().obrasInvolucradasEnElCalculoDeEjecucion
  })


  
  

  
  
})()