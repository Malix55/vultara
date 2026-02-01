import { AddModifyArrayDialogComponent } from '../add-modify-array-dialog/add-modify-array-dialog.component';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AddModifyArrayDialogService {

  constructor(private _dialog: MatDialog) { }

  dialogRef: MatDialogRef<AddModifyArrayDialogComponent>;

  public open(options) {
    this.dialogRef = this._dialog.open(AddModifyArrayDialogComponent, {    
         data: {
           title: options.title,
           message: options.message,
           cancelText: options.cancelText,
           confirmText: options.confirmText,
           arrayData: options.arrayData.filter(entry => entry.trim() != ''),
         }
    });
    // console.log(options.arrayData)
  }

  public confirmed(): Observable<any> {
    return this.dialogRef.afterClosed().pipe(take(1), map(res=> {
      return res;
    }))
  }
}
