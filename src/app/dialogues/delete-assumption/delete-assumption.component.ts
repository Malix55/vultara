import { Component,Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-assumption',
  templateUrl: './delete-assumption.component.html',
  styleUrls: ['./delete-assumption.component.css']
})
export class DeleteAssumptionComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<DeleteAssumptionComponent>,  @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }
  // if user press cancel close dialog
  public cancel() {
    this.dialogRef.close();
  }
  // if user press delete button close dialog and send delete command
  public delete(){
    this.dialogRef.close('delete');
  }
}
