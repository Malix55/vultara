import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ControlUnitLib } from "src/threatmodel/ItemDefinition";

interface ControlUnitLibChange extends ControlUnitLib {
    changed?: boolean;
  }

@Component({
  selector: "create-module-dialog",
  templateUrl: "create-module.component.html",
  styleUrls: ["create-module.component.css"],
})
export class CreateModuleDialog implements OnInit {
  moduleCategoryArray: [] = [];
  newModuleData = {
    _id: "",
    category: "",
    model: "",
    changed: true,
  };
  changed= true;
  controlUnitDatabase: ControlUnitLibChange[] = [];
  isSpace: boolean;

  constructor(
    private _http: HttpClient,
    public dialogRef: MatDialogRef<CreateModuleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  readonly componentRootUrl = environment.backendApiUrl + "components";
  readonly featureRootUrl = environment.backendApiUrl + "features";
  private unsubscribe: Subject<void> = new Subject();

  ngOnInit(): void {
    this.moduleCategoryArray = this.data?.moduleCategory;
  }
  createModule() {
    //Create Module logic
    this.controlUnitDatabase.push(this.newModuleData)
    let updateObj ={
        delete: false,
        data: [this.controlUnitDatabase[0]],
    };
    this._http
    .post(this.componentRootUrl + "/controlunitlib", updateObj)
    .pipe(takeUntil(this.unsubscribe))
    .subscribe((res: any) => {
        if(res[0].model) {
          this.dialogRef.close('Success')
        } else {
            console.log('Failure');
        }
    });
    if (this.controlUnitDatabase[0].changed && this.controlUnitDatabase[0]._id) {
      // if name changed, also change module names in featureImpactLib
      let nameChangedModules = [
        {
          module: this.controlUnitDatabase[0]?.model,
          _id: this.controlUnitDatabase[0]?._id,
        },
      ];
      this._http
      .post(
        this.featureRootUrl + "/featureimpactlibbymodule",
        nameChangedModules
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // console.log(res);
      })
    }
  }
  onNoClick(): void {
    // function to close dialog
    this.dialogRef.close(this.newModuleData);
  }
  moduleNameChange(event: any) {//validation for empty space in  field
    this.isSpace = false;
    if(event.trim().length === 0){
      this.isSpace = true;
    }
  }
}
