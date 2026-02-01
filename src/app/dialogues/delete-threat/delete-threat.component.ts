import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-threat',
  templateUrl: './delete-threat.component.html',
  styleUrls: ['./delete-threat.component.css']
})
export class DeleteThreatComponent implements OnInit{
 
  constructor(
  private dialogRef: MatDialogRef<DeleteThreatComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any,
  
  ) { }

  ngOnInit(): void { }



  public cancel() {
    this.dialogRef.close();
  }

  public deletePermanently(){
      this.dialogRef.close({type: "permanent"});
  }

  public deleteTemporarily(){
      this.dialogRef.close({type: "temporary"});
  } 
}
