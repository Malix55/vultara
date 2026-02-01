import { Observable } from 'rxjs';
import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {

  saveProjectEvent = new EventEmitter();

  constructor(private _dialog: MatDialog) { }

  emitSaveProjectEvent() : any {
    this.saveProjectEvent.emit(null);
  }

  getSaveProjectEventEmitter() : any {
    return this.saveProjectEvent;
  }

  dialogRef: MatDialogRef<ConfirmDialogComponent>;

  public open(options, disableClose?) {
    this.dialogRef = this._dialog.open(ConfirmDialogComponent, {
         data: {
           title: options.title,
           message: options.message,
           cancelText: options.cancelText,
           confirmText: options.confirmText,
           color:options.color??"warn",
         },
         disableClose: disableClose ? disableClose : false,
    });
  }

  public confirmed(): Observable<any> {
    return this.dialogRef.afterClosed().pipe(take(1), map(res=> {
      return res;
    }))
  }



  // public canceled(): Observable<any> {
  //   return this.dialogRef.afterClosed().pipe(take(1), map(res=> {
  //     return res;
  //   }))
  // }
}
