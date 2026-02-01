import { ENTER } from "@angular/cdk/keycodes";
import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { DesignSettingsService } from "src/app/services/design-settings.service";
import { environment } from "src/environments/environment";

interface Asset {
    _id?: string;
    name: string;
    assetType?: string;
    subType?: string;
    tag?: string[];
  }

@Component({
    selector: "create-asset-dialog",
    templateUrl: "create-asset.component.html",
    styleUrls: ["create-asset.component.css"]
})
export class CreateAssetDialog implements OnInit {
    @ViewChild("chipInput") private chipInput;
    assetType: any[]= [];
    assetList: Array<Asset> = [];
    selected: any;
    disabled = false;
    subType = this._editDesignShared.assetSubTypesTransit;
    newAsset = {
        _id: '',
        name: 'New asset',
        assetType :'dataInTransit',
        subType: '',
        tag: [],
    };
    isSpace: boolean;
    assetTypeCheck: boolean=false;
    readonly separatorKeysCodes: number[] = [ENTER];

    constructor(
        private _http: HttpClient,
        public dialogRef: MatDialogRef<CreateAssetDialog>,
        private _snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: any, private _editDesignShared: DesignSettingsService
    ) {
    }
    readonly assetRootUrl = environment.backendApiUrl + "assets";
    private unsubscribe: Subject<void> = new Subject();
    ngOnInit(): void {
        this.data.assetType.map(asset => {
         this.assetType.push(asset);
        })  
        this.modelChangeFn(this.newAsset.assetType);
    }
    modelChangeFn(selectedValue) {
         this.disabled = false;
         if(selectedValue === 'dataAtRest') {
           this.assetTypeCheck=true
           this.subType = this._editDesignShared.assetSubTypes;
          return this.subType;
        }else if (selectedValue === 'dataInTransit') {
          this.assetTypeCheck=true
          this.subType = this._editDesignShared.assetSubTypesTransit;
          return this.subType;
        }else if (selectedValue === '') {
            this.assetTypeCheck=false
            // return this.subType.splice(1, 1)

        }else {
            this.newAsset.subType = '';
            this.disabled = true; 
        }
        
    }
    createAsset() {
        let assetUnderEdit: Asset = this.newAsset;
        this._http
          .post(this.assetRootUrl + "/assetlib", assetUnderEdit)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res: any) => {
            // console.log(res);
           this.dialogRef.close('assetcreated')
          });
     
    }
    onNoClick(): void {
        // function to close dialog
        this.dialogRef.close();
      }
      subTypeChanges($event: any, assetItem: any) {
        assetItem.subType = $event;
      }
      moduleNameChange(event: any) {//validation for empty space in input
        this.isSpace = false;
        if(event.trim().length === 0){
          this.isSpace = true;
        }
      }


  //Adds the tag to the Tags array
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if(value){
      this.newAsset.tag.push(value);
    }else{
      this._snackBar.open("Cannot add an empty value.", "", {
        duration: 3000,
      });
    }
    // Clear the input value
    event.input.value = ''
  }

  removeTag(tag){//Remove tag from tag array
    const tagIndex = this.newAsset.tag.indexOf(tag);
    this.newAsset.tag.splice(tagIndex,1);
  }

  /*Due to fixed height you need to scroll to the bottom of the
    Input to enter a new tag this focuses the input on click to circumvent that
  */
  focusInput(){
    this.chipInput.nativeElement.focus();
  }
}
