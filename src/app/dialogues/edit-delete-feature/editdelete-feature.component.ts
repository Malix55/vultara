import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject } from "@angular/core";
import { Component, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ControlUnitGroup } from "src/app/property-panel/property-panel.component";
import { environment } from "src/environments/environment";
import { ValueAndViewValue } from "src/threatmodel/ItemDefinition";
import { DesignSettingsService } from './../../services/design-settings.service';

@Component({
    selector: "edit-delete-feature",
    templateUrl: "editdelete-feature.component.html",
    styleUrls: ["editdelete-feature.component.css"]
})
export class EditDeleteFeatureDialog implements OnInit {

    module: any;
    features: any[];
    featureList: any[];
    controlUnitGroups: ControlUnitGroup[] = [];
    ImpactLevels: any[];
    originalFeatureList: any[];
    modulesloading = false;
    dynamicFeatureRole: ValueAndViewValue[];

    AssetTypes: ValueAndViewValue[] = this._editDesignShared.assetTypes;
    
    readonly featureRootUrl = environment.backendApiUrl + "features";
    private unsubscribe: Subject<void> = new Subject();

    constructor(private _editDesignShared: DesignSettingsService, private http: HttpClient,private _snackBar: MatSnackBar, @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditDeleteFeatureDialog>,) {
      this.module = this.data.module;
      this.controlUnitGroups = this.data.controlUnitGroups;
      this.ImpactLevels = this.data.impactLevels;
      this.featureList  = this.data.featureList;
    }

    ngOnInit() {
      this.modulesloading = true;
        const params = new HttpParams()
                .set("featureIds", this.module.featureId.join(','))
                .set("module", this.module.model);

            this.originalFeatureList = [];
            this.features = [];

        this.http
            .get(this.featureRootUrl + "/featureimpactlibbymodule", {params: params})
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res: any) => {
              // console.log(res)
               this.modulesloading = false;
            if(res.data.length>0) {
              this.features = res.data;
              this.originalFeatureList = JSON.parse(JSON.stringify(res.data));
              // this.dynamicallyAssignFeatureRole(this.originalFeatureList[0].featureType);
            } else {
              this._snackBar.open("No such feature is found in your library.", "Failed", {
                duration: 5000,
              });
              console.log("Error: Features associated with this module are not found in the featureAssetLib.")
            }
          });
    }

    updateFeature(feature, index) {
      let hasChange = false;
      let featureId = feature.featureId;
      if(this.originalFeatureList[index].feature != feature.feature) {
        hasChange = true;
        featureId = this.originalFeatureList[index].featureId;
      }

      const model = {
        originalFeatureId: featureId,
        hasChange,
        feature
      }

      const duplicateCheck = this.features.filter((application, index, self) =>//Filter the array to check if a feature has duplicate featureRoles 
      index === self.findIndex((t) => (
        t.featureId === application.featureId && t.featureRole === application.featureRole
      ))
      )

      if(duplicateCheck.length != this.features.length) { // Pop up snack bar for error but doesn't close dialog
        return  this._snackBar.open("Duplicate features with the same role assigned to one module is not allowed", "", {
        duration: 3000,
        });
      }

      this.http
      .post(this.featureRootUrl + "/featureassetlibByAsset", model)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resp: any) => {
        if(resp.status) {
          this._snackBar.open(resp.msg, "Success", {
            duration: 3000,
          });

          this.originalFeatureList[index] = feature;
        } else {
          this._snackBar.open(resp.msg, "Failure", {
            duration: 3000,
          });
        }
      }, (err: any) => {
        this._snackBar.open(err.error.msg, "Failure", {
          duration: 3000,
        });
      })

      //Update the featureRole in controlunitlib
      let moduleData = {
        action: "updateSingleModule",
        moduleId: feature.moduleId,
        featureIndex: index,
        featureRole: feature.featureRole,
      }
      this.http.patch(environment.backendApiUrl + "components/controlunitlib", moduleData).pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
            // console.log(res, 'Res Second');
      });
    }

    removeFeature(featureId, moduleId, _id,featureRole, index) {

      const params = new HttpParams()
                .set("featureId", featureId)
                .set("moduleId", moduleId)
                .set("_id", _id).set("featureRole",featureRole);

      this.http
      .delete(this.featureRootUrl + "/featureimpactlibbymodule", {params: params})
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resp: any) => {

        if(resp.status) {
          this._snackBar.open(resp.msg, "Success", {
            duration: 3000,
          });

          this.originalFeatureList.splice(index, 1);
          this.features.splice(index, 1);
        } else {
          this._snackBar.open(resp.msg, "Failure", {
            duration: 3000,
          });
        }
      }, (err: any) => {
        this._snackBar.open(err.error.msg, "Failure", {
          duration: 3000,
        });
      })
    }
    // don't allow changing feature name under this dialog window
    // updateFeatureId(featureName, index) {
    //   const found = this.featureList.filter(x => x.name == featureName);
    //   if(found) {
    //     this.features[index].featureId = found[0]._id;
    //   }
    // }

    ngOnDestroy(){
      this.unsubscribe.next();
      this.unsubscribe.complete();
    }
    onNoClick(): void {
      // function to close dialog
      this.dialogRef.close('success');
    }
    dynamicallyAssignFeatureRole(inputFeatureType) {
      return this.dynamicFeatureRole = this._editDesignShared.dynamicallyAssignFeatureRole(inputFeatureType);
    }
}