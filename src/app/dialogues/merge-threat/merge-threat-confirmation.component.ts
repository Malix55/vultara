import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-control-before-confirmation',
  templateUrl: './merge-threat-confirmation.component.html',
  styleUrls: ['./merge-threat-confirmation.component.css']
})
export class MergeThreatConfirmationComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<MergeThreatConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  // Delete threat permanently
  public deletePermanently() {
    this.dialogRef.close("permanentDelete");
  }

  // Delete threat temporarily
  public deleteTemporarily() {
    this.dialogRef.close("temporaryDelete");
  }

}
