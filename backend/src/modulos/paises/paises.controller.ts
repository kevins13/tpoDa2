import { Request, Response } from 'express';
import { countriesService } from './paises.service';

export class CountriesController {
  async getAll(req: Request, res: Response) {
    try {
      const data = await countriesService.getAllCountries();
      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al recuperar el listado de países: ' + error.message,
      });
    }
  }
}

export const countriesController = new CountriesController();