import { Component, Inject, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogService } from './../../services/confirm-dialog.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-create-bom',
  templateUrl: './create-bom.component.html',
  styleUrls: ['./create-bom.component.css']
})
export class CreateBOMComponent implements OnInit {

  sbomForm = this._fb.group({
    product: [''],
    vendor: [''],
    part: [''],
    version: [''],
    update: [''],
    edition: [''],
    language: [''],
    sw_edition: [''],
    target_sw: [''],
    target_hw: [''],
    other: ['']
  });

  confirmToDeleteBomDialogOptions = {
    title: "CONFIRM TO DELETE",
    message: "Are you sure you want to delete this software?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };

  constructor(
    private _confirmDialogService: ConfirmDialogService,
    private _snackBar: MatSnackBar,
    private _fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _dialogRef: MatDialogRef<CreateBOMComponent>,
    private _cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if(this.data?.sbom){
      this.sbomForm.patchValue(this.data.sbom);
    }
  }

  ngAfterViewInit() {
    this._cdr.detectChanges();
  }

  public confirmDeleteBomDialog() {
    this._confirmDialogService.open(this.confirmToDeleteBomDialogOptions);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        // this.confirmDeleteProject(projectId);
        this.deleteBom();
      } else {
        this._snackBar.open("No software is deleted.", "", { duration: 3000 });
      }
    });
  }

  deleteBom(){
    this._cdr.detectChanges();
    this._dialogRef.close({data: this.data.i, action:'delete'});
  }

  createBom(){
    this._cdr.detectChanges();
    // console.log(this.sbomForm.value)
    Object.keys(this.sbomForm.value).map((key, index) => {
      this.sbomForm.value[key] = this.cleanUpString(this.sbomForm.value[key])
    });
    this.sbomForm.value.cpe23 = this.assembleCPE(this.sbomForm.value.part, this.sbomForm.value.vendor, this.sbomForm.value.product, this.sbomForm.value.version,
      this.sbomForm.value.update, this.sbomForm.value.edition, this.sbomForm.value.language, this.sbomForm.value.sw_edition, this.sbomForm.value.target_sw, 
      this.sbomForm.value.target_hw, this.sbomForm.value.other);
    // console.log(this.sbomForm.value)
    if (this.data.i>=0) { // if this index exists, the user is performing an Update action
      this._dialogRef.close({data:this.sbomForm.value, action:'update'});
    } else {
      this._dialogRef.close({data:this.sbomForm.value, action:'add'});
    }
  }
  // functions to be used by SBOM
  cleanUpString (input: string): string {
    return input.trim().replace(/\s+/g, '_').toLowerCase()
  }
  assembleCPE (...inputs: any[]): string {
    const hardcodedString_1 = 'cpe';
    const hardcodedString_2 = '2.3';
    inputs = inputs.map(i => {
        if (i === undefined || i === '') {
            i = '*'
        }
        return i
    })
    return [hardcodedString_1, hardcodedString_2, ...inputs].join(':')
  }
}
