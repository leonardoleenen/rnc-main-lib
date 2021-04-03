
export const getTramiteFromState = () => { 
  var fs = require('fs')
  console.log(__dirname + '../exmples/state.data')
  var file = JSON.parse(fs.readFileSync(__dirname + '/state.data', 'utf8'));
  return JSON.parse(file.payload)[0].tramite
}

export const empresas = {
  firstCase:{
    ejercicios: [{
      fechaInicio:'',
      fechaCierre:'',
      activoCorriente:5390431055,
      activoNoCorriente:2788269305,
      pasivoCorriente: 3515716141,
      pasivoNoCorriente:2008117798,
      ventasEjercicio:0,
      capitalSuscripto:0
    },{
      
    }] as Array<Ejercicio>,
    ddjjObras: [{
      datosObra: [{
        
      }],
      certificaciones: [{

      }]
    }] as Array<DDJJObra>
  }
}

