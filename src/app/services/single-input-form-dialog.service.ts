import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SingleInputFormDialogComponent } from '../single-input-form-dialog/single-input-form-dialog.component';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SingleInputFormDialogService {

  constructor(private _dialog: MatDialog) { }

  dialogRef: MatDialogRef<SingleInputFormDialogComponent>;

  public open(options) {
    this.dialogRef = this._dialog.open(SingleInputFormDialogComponent, {    
         data: {
           title: options.title,
           message: options.message,
           cancelText: options.cancelText,
           confirmText: options.confirmText,
           input: options.input,
         }
    });
    // console.log(options.input)
  }

  public confirmed(): Observable<any> {
    return this.dialogRef.afterClosed().pipe(take(1), map(res=> {
      return res;
    }))
  }
}
