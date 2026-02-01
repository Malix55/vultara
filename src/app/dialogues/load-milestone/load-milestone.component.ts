import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-load-milestone',
  templateUrl: './load-milestone.component.html',
  styleUrls: ['./load-milestone.component.css']
})
export class LoadMilestoneComponent implements OnInit {
  private selectedMilestone: any;

  constructor(
    public snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LoadMilestoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void { }

  generateMilestoneTime(inputData) {
    let date = new Date(inputData);
    let entry =(date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ', ' + date.toLocaleTimeString() + " ";
    return entry
  }
  
  selectMilestone(milestone: any) {
    this.selectedMilestone = milestone;
  }

  public cancelLoadMilestone() {
    this.dialogRef.close();
  }

  public confirmLoadMilestone() {
    if (this.selectedMilestone) {
      this.dialogRef.close(this.selectedMilestone);
    } else {
      this.snackBar.open("Please select a milestone.", "", {
        duration: 600000,
      });
    }
  }

}
