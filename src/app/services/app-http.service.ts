import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppHttpService {

  constructor(private http: HttpClient) { }

  // these methods are not used
  getHeaders() {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  };
  getNewDesign(url: string): any {
    return this.http.get(url);
  };
}
