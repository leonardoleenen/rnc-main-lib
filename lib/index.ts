export const testFunction = () => {
  return "Hello world!"
}

export const sum = (a, b) => {
  return a+b
} 

export class CalculadoraCapacidad {

  private obras 
  private ejercicios: Array<Ejercicio>

  constructor(obras, ejercicios) {
    this.ejercicios  = ejercicios
  }

}