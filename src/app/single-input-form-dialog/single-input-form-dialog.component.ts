import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-single-input-form-dialog',
  templateUrl: './single-input-form-dialog.component.html',
  styleUrls: ['./single-input-form-dialog.component.css']
})
export class SingleInputFormDialogComponent implements OnInit {
  singleInputForm:FormGroup

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    cancelText: string,
    confirmText: string,
    message: string,
    title: string,
    input: string,
  }, private _mdDialogRef: MatDialogRef<SingleInputFormDialogComponent>,private _formBuilder:FormBuilder) { }

  ngOnInit(): void {
    this.singleInputForm = this._formBuilder.group({
      name:[this.data.input,[Validators.required,Validators.pattern(".*\\S.*[a-zA-z0-9 ]")]]
    })
  }



  public cancel() {
    // console.log(this.data.input);
    this.close(false);
  }
  public close(value) {
    this._mdDialogRef.close(value);
  }
  public confirm() {
    let formData =this.singleInputForm.getRawValue()
    this.close(formData.name);
  }
  @HostListener("keydown.esc")
  public onEsc() {
    this.close(false);
  }

  @HostListener("keydown.enter")
  public onEnter() {
   
    this.confirm();
  }

//   trackByFn(index: any, item: any) { // for some reason, the input form loses focus after a key stroke. this is a workaround.
//     return index;
//  }



}
