import { prisma } from '../../configuracion/baseDatos';

export class CountriesService {
  async getAllCountries() {
    // Buscamos todos los países en la tabla del profesor
    const countries = await prisma.paises.findMany({
      orderBy: {
        nombre: 'asc', // Los ordenamos de la A a la Z
      },
    });

    // Mapeamos la respuesta para que el Frontend reciba nombres de propiedades limpios
    return countries.map((country) => ({
      id: country.numero,
      name: country.nombre,
    }));
  }
}

export const countriesService = new CountriesService();