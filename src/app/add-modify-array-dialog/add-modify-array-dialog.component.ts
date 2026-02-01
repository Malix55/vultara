import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Component, Inject, OnInit, HostListener } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { environment } from "src/environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
@Component({
  selector: "app-add-modify-array-dialog",
  templateUrl: "./add-modify-array-dialog.component.html",
  styleUrls: ["./add-modify-array-dialog.component.css"],
})
export class AddModifyArrayDialogComponent implements OnInit {
  isDisable: boolean;
  isSpace: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      cancelText: string;
      confirmText: string;
      message: string;
      title: string;
      arrayData: string[];
    },
    private _mdDialogRef: MatDialogRef<AddModifyArrayDialogComponent>,
    private _snackBar: MatSnackBar,
    private _http: HttpClient
  ) {}

  arrayData: any[];
  componentRootUrl = environment.backendApiUrl + "components";

  ngOnInit(): void {
    this.arrayData = this.data.arrayData.map((item) => {
      return { category: item, initialCategory: item };
    });
  }

  public cancel() {
    this.close(false);
  }

  public close(value) {
    //Dont allow a duplicate category to be added
    if(value){
    const uniqueValues = new Set(value.map(v => v.category));
    if (uniqueValues.size < value.length) {
       this._snackBar.open(
        "This Module Category name already exists. Name duplication is not allowed.",
        "",
        {
          duration: 4000,
        }
      );
    }else{
      this._mdDialogRef.close(value);
    }
    }else{
      this._mdDialogRef.close(value);
    }
  }

  public confirm() {
    this.close(this.arrayData);
  }
  @HostListener("keydown.esc")
  public onEsc() {
    this.close(false);
  }

  @HostListener("keydown.enter")
  public onEnter() {
    this.close(true);
  }

  addAnEntry(index) {
    this.arrayData.splice(index + 1, 0, { category: "" });
    this.arrayCheck();
  }

  cancelAnEntry(index) {
    //Check if category is used in any module then dont allow delete
    let duplicate = this.arrayData.map(item=>item.category).filter((e, i, a) => a.indexOf(e) !== i)
    if(this.arrayData[index].category!=="" && !duplicate.includes(this.arrayData[index].category)){
      let queryParams = new HttpParams().set("category", this.arrayData[index].category);
      this._http.get(this.componentRootUrl + "/controlunitlibCategory",{ params: queryParams}).subscribe((res:any)=>{
      if(res){
        this._snackBar.open(
          "This module category is in use, and thus cannot be deleted",
          "",
          {
            duration: 4000,
          }
        );
      }else{
        this.isDisable = false;
        this.arrayData.splice(index, 1);
        this.arrayCheck();
      }
      })
    }else{
      this.isDisable = false;
      this.arrayData.splice(index, 1);
      this.arrayCheck();
    }
  }

  trackByFn(index: any, item: any) { // for some reason, the input form loses focus after a key stroke. this is a workaround.
    return index;
  }

  onInputChange(inputValue: string): void {//event for input field value change.
    this.isSpace = false;
    if (inputValue.trim().length === 0) {
      this.isSpace = true;
    }
    inputValue ? (this.isDisable = false) : (this.isDisable = true);
    this.arrayCheck();
  }

  arrayCheck() {//Check to see if a value in array empty.
    this.arrayData.map((deal) => {
      if (deal.category === "") {
        this.isDisable = true;
      }
    });
  }

}
