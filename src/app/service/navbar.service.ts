import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private saveButton = new Subject<void>();
  private spinnerState = new Subject<boolean>();
  constructor() { }
  public isSaveButtonClicked(): Observable<void> {
    return this.saveButton.asObservable();
  }
  public saveButtonClicked(): void {
    this.saveButton.next();
  }
  public getSpinnerState(): Observable<boolean> {
    return this.spinnerState.asObservable();
  }
  public toggleSpinner(newSpinnerState: boolean): void {
    this.spinnerState.next(newSpinnerState)
  }
}
