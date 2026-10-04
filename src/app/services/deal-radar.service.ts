import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MasterProduct, CreateMasterProductDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DealRadarService {
  private apiUrl = 'https://dealradar-api.runasp.net/api/MasterProducts'; // Adjust if needed

  constructor(private http: HttpClient) { }

  getProducts(): Observable<MasterProduct[]> {
    return this.http.get<MasterProduct[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<MasterProduct> {
    return this.http.get<MasterProduct>(`${this.apiUrl}/${id}`);
  }

  createProduct(dto: CreateMasterProductDto): Observable<MasterProduct> {
    return this.http.post<MasterProduct>(this.apiUrl, dto);
  }

  updateProduct(id: number, dto: CreateMasterProductDto): Observable<MasterProduct> {
    return this.http.put<MasterProduct>(`${this.apiUrl}/${id}`, dto);
  }

  checkPrices(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/check-prices`, {});
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
