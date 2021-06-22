import moment from 'moment'
import _ from 'lodash'

const path = require('path')



export const calcularIndicesPorEjercicio = (ejercicio: Ejercicio) => {
  const pasivoTotal = ejercicio.pasivoNoCorriente + ejercicio.pasivoCorriente
  const activoTotal = ejercicio.activoCorriente + ejercicio.activoNoCorriente
  const patrimonioNeto = activoTotal - pasivoTotal

  return {
    liquidez: parseFloat((ejercicio.activoCorriente / ejercicio.pasivoCorriente).toFixed(2)),
    solvencia: parseFloat(((ejercicio.activoCorriente + ejercicio.activoNoCorriente) / (ejercicio.pasivoCorriente + ejercicio.pasivoNoCorriente)).toFixed(2)),
    capitalPropio: parseFloat((patrimonioNeto / activoTotal).toFixed(2)),
    endeudamiento: parseFloat((pasivoTotal / patrimonioNeto).toFixed(2))
  }
}


export const getIndices = async () => {
  const csv = require('csvtojson')
  const jsonArray = await csv().fromFile(path.join(__dirname, '..', '/examples/indices.csv'))
  return jsonArray
}


export class CalculadoraCapacidad {

  private _empresa: TramiteAlta
  public value: any
  public compromisoObras: number
  private indices: any[]
  private evidencia: {
    multiplicadorPorAntiguedad: number,
    promedioDeLasMejoresTres: number,
    tresMejoresPeriodos: [],
    obrasInvolucradasEnElCalculoDeEjecucion: [],
    indicesEconomicos: {
      liquidez: number,
      solvencia: number,
      capitalPropio: number,
      endeudamiento: number
    },
    obrasCandidatas: Array<{
      id: string,
      denominacion: string
    }>,


  }

  constructor(empresa: TramiteAlta) {
    this._empresa = empresa
    this.value = []
    this.indices = []
    this.compromisoObras = 0
    this.evidencia = {
      multiplicadorPorAntiguedad: 0,
      promedioDeLasMejoresTres: 0,
      obrasInvolucradasEnElCalculoDeEjecucion: [],
      tresMejoresPeriodos: [],

      obrasCandidatas: [],
      indicesEconomicos: {
        liquidez: 0,
        solvencia: 0,
        capitalPropio: 0,
        endeudamiento: 0
      }
    }
  }

  private getIndiceLiquidezCorriente(indice: number) {
    if (indice >= 1.50) return 1.3
    if (indice > 1.25 && indice < 1.50) return 0.85
    if (indice > 1 && indice <= 1.25) return 0.45
    return 0
  }

  private getIndiceSolvencia(indice: number) {
    if (indice >= 1.50) return 1.30
    if (indice > 1.25 && indice < 1.50) return 0.85
    if (indice > 1 && indice <= 1.25) return 0.45
    return 0
  }

  private getIndiceCapitalPropio(indice: number) {
    if (indice >= 0.60) return 1.30
    if (indice > 0.20 && indice <= 0.40) return 0.45
    if (indice > 0.40 && indice <= 0.60) return 0.85
    return 0
  }

  private getInidiceEndeudamiento(indice: number) {
    if (indice >= 2.5) return 0
    if (indice > 1.65 && indice < 2.5) return 0.45
    if (indice > 0.75 && indice <= 1.65) return 0.85
    return 1.30
  }

  private getAntiguedadAnios() {

    let fechaInscripcion = null
    if (this._empresa.personeria === 'PF') {
      fechaInscripcion = moment(this._empresa.matriculaComerciante.fecha, 'DD/MM/YYYY').toDate()
      return moment().diff(fechaInscripcion, 'years')
    }

    if (this._empresa.personeria === 'PJESP') {
      fechaInscripcion = this._empresa.datosSocietarios.PJESP.modifcicacionObjeto.fecha.length === 10 ? moment(this._empresa.datosSocietarios.PJESP.modifcicacionObjeto.fecha, 'DD/MM/YYYY').toDate() : moment(this._empresa.datosSocietarios.PJESP.modifcicacionObjeto.fecha).toDate()
      // console.log(fechaInscripcion)
      return moment().diff(fechaInscripcion, 'years')
    }

    fechaInscripcion = moment(this._empresa.datosSocietarios.sociedadAnonima.modificacion.fecha, 'DD/MM/YYYY').toDate()
    return moment().diff(fechaInscripcion, 'years')
  }

  getEvidencia() {
    return this.evidencia
  }
  calcularIndicesPorEjercicio(ejercicio: Ejercicio) {
    const pasivoTotal = ejercicio.pasivoNoCorriente + ejercicio.pasivoCorriente
    const activoTotal = ejercicio.activoCorriente + ejercicio.activoNoCorriente
    const patrimonioNeto = activoTotal - pasivoTotal

    const liquidez = parseFloat((ejercicio.activoCorriente / ejercicio.pasivoCorriente).toFixed(2))
    const solvencia = parseFloat(((ejercicio.activoCorriente + ejercicio.activoNoCorriente) / (ejercicio.pasivoCorriente + ejercicio.pasivoNoCorriente)).toFixed(2))
    const capitalPropio = parseFloat((patrimonioNeto / activoTotal).toFixed(2))
    const endeudamiento = parseFloat((pasivoTotal / patrimonioNeto).toFixed(2))

    return {
      liquidez,
      solvencia,
      capitalPropio,
      endeudamiento,
      indiceLiquidezCorriente: this.getIndiceLiquidezCorriente(liquidez),
      indiceSolvencia: this.getIndiceSolvencia(solvencia),
      indiceCapitalPropio: this.getIndiceCapitalPropio(capitalPropio),
      indiceEndeudamiento: this.getInidiceEndeudamiento(endeudamiento),
      indiceSumarizado: this.getIndiceLiquidezCorriente(liquidez) + this.getIndiceSolvencia(solvencia) + this.getIndiceCapitalPropio(capitalPropio) + this.getInidiceEndeudamiento(endeudamiento)
    }
  }

  async init() {
    this.indices = await getIndices()
  }

  getIndice(periodoRaw: string) {
    const actual = _.last(this.indices)
    const anterior = _.head(this.indices.filter(i => i.mesanio === periodoRaw))
    if (!actual || !anterior)
      return 1
    return parseFloat(actual.factor) / parseFloat(anterior.factor)
  }

  getMontoCertificacionesPorPeriodo() {
    const parseCertificacion = (cert) => {

    
      const tipoContratacion = this._empresa.ddjjObras.filter(o => !_.isEmpty(o.certificaciones.filter(c => c.codigo === cert.codigo)))[0].datosObra[0].tipoContratacion
      const participacionUTE = this._empresa.ddjjObras.filter(o => !_.isEmpty(o.certificaciones.filter(c => c.codigo === cert.codigo)))[0].participacionUTE

      let montoCalculado = cert.monto


      //console.log(participacionUTE)

      if (participacionUTE && participacionUTE!=='NO INFORMA') {
        montoCalculado = montoCalculado * (parseFloat(participacionUTE) / 100)
      }


      if (tipoContratacion === 'Privada')
        montoCalculado = montoCalculado * 0.75

      if (tipoContratacion === 'SubPublica')
        montoCalculado = montoCalculado * 0.50

      if (tipoContratacion === 'SubPrivada')
        montoCalculado = montoCalculado * 0.25

      

        
      return {
        id: cert.codigo,
        tipoContratacion,
        participacionUTE,
        periodo: moment(cert.periodo, 'DD/MM/YYYY').format('MYYYY'),
        time: moment(cert.periodo, 'DD/MM/YYYY').valueOf(),
        montoBruto: cert.monto,
        monto: montoCalculado
      }
    }
    const listCruda = this._empresa.ddjjObras
      .reduce((acc, { certificaciones, id, datosObra }) => [...acc, ...certificaciones], [])
      .map(parseCertificacion)
      .filter(o => moment(this.getUltimoEjercicio().fechaCierre, 'DD/MM/YYYY').toDate().getTime() >= o.time)


    console.log(this._empresa.razonSocial)  
    console.log(moment(this.getUltimoEjercicio().fechaCierre, 'DD/MM/YYYY').format('DD/MM/YYYY'))
      /*
   console.log(this._empresa.ddjjObras
      .reduce((acc, { certificaciones, id, datosObra }) => [...acc, ...certificaciones], [])
      .map(parseCertificacion)
      .filter(o => moment(this.getUltimoEjercicio().fechaCierre, 'DD/MM/YYYY').toDate().getTime() < o.time))*/


    
    const list = []
    for (let e of this._empresa.ejercicios.filter(ej => moment().diff(moment(ej.fechaCierre, 'DD/MM/YYYY'), 'years') <= 10)) {
      const montoAccumulado = listCruda.filter(cert => cert.time >= moment(e.fechaInicio, 'DD/MM/YYYY').valueOf() && cert.time <= moment(e.fechaCierre, 'DD/MM/YYYY').valueOf())
        .reduce((acc, val) => acc += val.monto, 0)

      //console.log(listCruda.filter( cert => cert.time >= moment(e.fechaInicio,'DD/MM/YYYY').valueOf() && cert.time <=  moment(e.fechaCierre,'DD/MM/YYYY').valueOf()))

      list.push({
        periodo: moment(e.fechaCierre, 'DD/MM/YYYY').format('MYYYY'),
        time: moment(e.fechaCierre, 'DD/MM/YYYY').valueOf(),
        monto: montoAccumulado
      })
    }



    const sortedList = _.sortBy(list, e => e.time).reduce((acc, { id, periodo, monto }) => ({
      ...acc,
      [periodo]: {
        id: periodo,
        periodo,
        indice: this.getIndice(periodo),
        monto: list.filter(e => e.periodo === periodo).map(e => e.monto).reduce((a, v) => a += v),
        montoAjustado: list.filter(e => e.periodo === periodo).map(e => e.monto).reduce((a, v) => a += v) * this.getIndice(periodo)
      }
    }), {})

    this.value = Object.keys(sortedList).map(key => sortedList[key])
    this.evidencia.obrasInvolucradasEnElCalculoDeEjecucion = this.value
    return this

  }

  aplicarIndiceCorreccion() {
    const parser = (e) => {

      return {
        ...e,
        monto: e.monto * this.getIndice(e.periodo)
      }
    }
    this.value = this.value.map(parser)
    return this
  }

  ordenarMontoDescendente() {
    this.value = _.reverse(_.sortBy(this.value, e => e.monto))
    return this
  }

  tomarLosTresPrimerosElementos() {
 
    this.value = this.value.slice(0, 3)
    this.evidencia.tresMejoresPeriodos = this.value
    return this
  }

  aplicarPromedioLineal() {
    let promedio = 0

    const ultimoEjercicioIdx = _.last(this._empresa.ejercicios.map(e => moment(e.fechaCierre, 'DD/MM/YYYY').toDate().getTime()).sort())
    const ultimoEjercicio = this._empresa.ejercicios.filter(e => moment(e.fechaCierre, 'DD/MM/YYYY').toDate().getTime() === ultimoEjercicioIdx)
    let capitalSuscripto = _.last(ultimoEjercicio).capitalSuscripto

    if (!_.isEmpty(this.value))
      promedio = this.value.map(e => e.monto).reduce((acc, val) => acc += val) / this.value.length


    this.evidencia.promedioDeLasMejoresTres = promedio

    return {
      value: promedio,
      aplicarIndicesEconomicos: () => {


        const liquidez = this.getIndiceLiquidezCorriente(ultimoEjercicio
          .map(e => this.calcularIndicesPorEjercicio(e))
          .map(i => i.liquidez)
          .reduce((acc, val) => acc += val))

        const capitalPropio = this.getIndiceCapitalPropio(ultimoEjercicio
          .map(e => this.calcularIndicesPorEjercicio(e))
          .map(i => i.capitalPropio)
          .reduce((acc, val) => acc += val))

        const endeudamiento = this.getInidiceEndeudamiento(ultimoEjercicio
          .map(e => this.calcularIndicesPorEjercicio(e))
          .map(i => i.endeudamiento)
          .reduce((acc, val) => acc += val))

        const solvencia = this.getIndiceSolvencia(ultimoEjercicio
          .map(e => this.calcularIndicesPorEjercicio(e))
          .map(i => i.solvencia)
          .reduce((acc, val) => acc += val))

        const indiceEconomico = liquidez
          + capitalPropio
          + endeudamiento
          + solvencia

        this.evidencia = {
          ...this.evidencia,
          indicesEconomicos: {
            liquidez,
            capitalPropio,
            endeudamiento,
            solvencia
          }
        }

        const valorAjustado = promedio !== 0 ? promedio * indiceEconomico : indiceEconomico


        const factorAntiguedad = this.getAntiguedadAnios() * 0.04
        this.evidencia.multiplicadorPorAntiguedad = factorAntiguedad > 0.8 ? 0.8 : factorAntiguedad
        this.value = promedio !== 0 ? (indiceEconomico + factorAntiguedad) * promedio : capitalSuscripto * (indiceEconomico + factorAntiguedad)

        return this.value
      }
    }
  }



  getUltimoEjercicio() {
    const ultimoEjercicioIdx = _.last(this._empresa.ejercicios.map(e => moment(e.fechaCierre, 'DD/MM/YYYY').toDate().getTime()).sort())
    return this._empresa.ejercicios.filter(e => moment(e.fechaCierre, 'DD/MM/YYYY').toDate().getTime() === ultimoEjercicioIdx)[0]
  }

  private getMontosObraGross = (o: DDJJObra) => {
    return {
      montoInicial: o.montoInicial,
      montoTotalRedeterminaciones: o.redeterminaciones.map(r => r.monto).reduce((acc, val) => acc += val, 0),
      montoCertificaciones: o.certificaciones.map(c => c.monto).reduce((acc, val) => acc += val, 0),
      montoAmpliaciones: o.ampliaciones.map(a => a.monto).reduce((acc, val) => acc += val, 0),
    }
  }

  private getMontosObraAjustado = (o: DDJJObra) => {
    const value = {
      denominacion: o.denominacion,
      tipo: o.datosObra[0].tipoContratacion,
      montoInicial: o.montoInicial,
      montoTotalRedeterminaciones: o.redeterminaciones
        .map(r => r.monto * this.getIndice(moment(o.datosObra[0].fechaAdjudicacion, 'DD/MM/YYYY').format('MYYYY')))
        .reduce((acc, val) => acc += val, 0),
      montoCertificaciones: o.certificaciones
        .map(r => r.monto * this.getIndice(moment(r.periodo, 'DD/MM/YYYY').format('MYYYY')))
        .reduce((acc, val) => acc += val, 0),
      montoAmpliaciones: o.ampliaciones
        .map(r => r.monto * this.getIndice(moment(r.fecha, 'DD/MM/YYYY').format('MYYYY')))
        .reduce((acc, val) => acc += val, 0),
    }

    if (value.tipo !== 'Publica') {
      value.montoInicial = value.montoInicial / 2
      value.montoAmpliaciones = value.montoAmpliaciones / 2
      value.montoCertificaciones = value.montoCertificaciones / 2
      value.montoTotalRedeterminaciones = value.montoTotalRedeterminaciones / 2
    }

    return value
  }

  filtrarObrasCandidatas() {
    this.value = this._empresa.ddjjObras
      .filter(obra => !_.isEmpty(obra.datosObra.filter(datosObra => _.includes(['Preadjudicada', 'Adjudicada', 'Ejecucion'], datosObra.estado))))

    const parse = (o: DDJJObra) => {
      return {
        id: o.id,
        denominacion: o.denominacion,
        montosObraGross: {
          ...this.getMontosObraGross(o)
        },
        montosAjustadosPorInflacion: {
          ...this.getMontosObraAjustado(o)
        },
        plazoContrato: o.plazoPorContrato,
        prorroga: o.prorroga,
        fechaAdjudicacion: o.datosObra[0].fechaAdjudicacion,
        fechaInicio: o.datosObra[0].fechaInicio
      }
    }
    this.evidencia.obrasCandidatas = this.value.map(parse)
    return this
  }

  getIndicadorMultiplicador(obra: DDJJObra) {
    const { montoInicial, montoAmpliaciones, montoCertificaciones, montoTotalRedeterminaciones } = this.getMontosObraAjustado(obra)
    const saldo = (montoInicial + montoAmpliaciones + montoTotalRedeterminaciones) - montoCertificaciones
    const montoVigente = montoInicial + montoTotalRedeterminaciones + montoAmpliaciones
    return (saldo / montoVigente) * (obra.plazoPorContrato + obra.prorroga)
  }


  private calcularSaldoObra(obra: DDJJObra) {

    const sumaRedeterminaciones = obra.redeterminaciones && obra.redeterminaciones.length !== 0 ? obra.redeterminaciones.map(r => parseInt(r.monto.toFixed(2), 10)).reduce((acc, val) => acc += val, 0) : 0
    const sumaAmpliaciones = obra.ampliaciones && obra.ampliaciones.length !== 0 ? obra.ampliaciones.map(a => parseInt(a.monto.toFixed(2), 10)).reduce((acc, val) => acc += val, 0) : 0
    const sumaCertifcaciones = obra.certificaciones && obra.certificaciones.length !== 0 ? obra.certificaciones.map(c => c.monto).reduce((acc, val) => acc += val, 0) : 0

    const saldo = (obra.montoInicial + sumaRedeterminaciones + sumaAmpliaciones) - sumaCertifcaciones

    return saldo < 10 ? 0 : saldo

  }

  getCompromiso(obra: DDJJObra) {

    const saldoObra = this.calcularSaldoObra(obra)

    const sumaRedeterminaciones = obra.redeterminaciones && obra.redeterminaciones.length !== 0 ? obra.redeterminaciones.map(r => parseInt(r.monto.toFixed(2), 10)).reduce((acc, val) => acc += val, 0) : 0
    const sumaAmpliaciones = obra.ampliaciones && obra.ampliaciones.length !== 0 ? obra.ampliaciones.map(a => parseInt(a.monto.toFixed(2), 10)).reduce((acc, val) => acc += val, 0) : 0
    const sumaCertifcaciones = obra.certificaciones && obra.certificaciones.length !== 0 ? obra.certificaciones.map(c => c.monto).reduce((acc, val) => acc += val, 0) : 0


    const montoVigente  = obra.montoInicial + sumaAmpliaciones + sumaRedeterminaciones
    const plazoTotalMeses = obra.plazoPorContrato + obra.prorrogaNueva.reduce( (acc,val) => acc+=val.prorrogaMeses,0)

    let montoCalculado =  (saldoObra / montoVigente) * plazoTotalMeses > 12  ? (saldoObra / ((saldoObra / montoVigente) * plazoTotalMeses)) * 12 : saldoObra
    
    if (obra.participacionUTE && obra.participacionUTE!=='NO INFORMA') {
      montoCalculado = montoCalculado * (parseFloat(obra.participacionUTE) / 100)
      //console.log(parseFloat(participacionUTE) / 100)
    }


    if (obra.datosObra[0].tipoContratacion === 'Privada')
      montoCalculado = montoCalculado * 0.75

    if (obra.datosObra[0].tipoContratacion === 'SubPublica')
      montoCalculado = montoCalculado * 0.50

    if (obra.datosObra[0].tipoContratacion === 'SubPrivada')
      montoCalculado = montoCalculado * 0.25

    const indiceInflacion  = this.getIndice(moment(obra.datosObra[0].fechaAdjudicacion,'DD/MM/YYYY').format('MYYYY'))
    // console.log(indiceInflacion, moment(obra.datosObra[0].fechaAdjudicacion,'DD/MM/YYYY').format('MYYYY'))
    
    montoCalculado = montoCalculado * indiceInflacion
    return montoCalculado
  }





}