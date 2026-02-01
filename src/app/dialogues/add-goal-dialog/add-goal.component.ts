import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Subject } from "rxjs";


@Component({
  selector: "add-goal-dialog",
  templateUrl: "add-goal.component.html",
  styleUrls: ["add-goal.component.css"],
})
export class AddGoalDialog implements OnInit {

  goalForm: FormGroup;

  constructor(
    private _http: HttpClient,
    public dialogRef: MatDialogRef<AddGoalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _formBuilder:FormBuilder
  ) {}
  private unsubscribe: Subject<void> = new Subject();

  ngOnInit(): void {
    this.goalForm = this._formBuilder.group({
      content: ["",[Validators.required,Validators.pattern(/[\S]/)]],
    });
    if(this.data.goalData){
      this.goalForm.patchValue({content: this.data.goalData.content})
    }
  }
  createGoal() {
    this.dialogRef.close(this.goalForm.getRawValue());  
  }

  onNoClick(): void {
    // function to close dialog
    this.dialogRef.close(false);
  }
}
