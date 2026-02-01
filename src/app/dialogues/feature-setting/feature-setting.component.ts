import { HttpClient, HttpParams } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { debounceTime, take, takeUntil } from "rxjs/operators";
import { ArrOpService } from "src/app/services/arr-op.service";
import { environment } from "src/environments/environment";
import { ControlUnitLib, ValueAndViewValue} from "src/threatmodel/ItemDefinition";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ControlUnitGroup } from "src/app/property-panel/property-panel.component";
import { Subject, Subscription } from "rxjs";
import { ConfirmDialogService } from "src/app/services/confirm-dialog.service";
import { DesignSettingsService } from './../../services/design-settings.service';

interface FeatureAsset {
  _id?: string;
  name: string;
  featureType?: string;
  featureRoleIndex?: number;
  assets?: string[];
  assetsId?: string[];
  assets0?: string[];
  assetsId0?: string[];
  assets1?: string[];
  assetsId1?: string[];
  assets2?: string[];
  assetsId2?: string[];
  assets3?: string[];
  assetsId3?: string[];
  assets4?: string[];
  assetsId4?: string[];
  assets5?: string[];
  assetsId5?: string[];
  assets6?: string[];
  assetsId6?: string[];
  assets7?: string[];
  assetsId7?: string[];
  assets8?: string[];
  assetsId8?: string[];
  assets9?: string[];
  assetsId9?: string[];
  assets10?: string[];
  assetsId10?: string[];
}
export enum ImpactLevelToValueConv {
  Critical = 10,
  High = 8,
  Medium = 5,
  Low = 2,
  Negligible = 0,
}
interface Asset {
  _id?: string;
  name: string;
  assetType?: string;
  subType?: string;
}
interface Feature extends FeatureAsset {
  application?: FeatureImpactType[];
}
export interface FeatureImpactType {
  _id?: string;
  module?: string;
  moduleId?: string;
  feature?: string;
  featureId?: string;
  featureType?: string;
  featureRole?: string;
  safety?: number;
  financial?: number;
  operational?: number;
  privacy?: number;
  SLevel?: string;
  FLevel?: string;
  OLevel?: string;
  PLevel?: string;
  damageScenarioS?: string;
  damageScenarioF?: string;
  damageScenarioO?: string;
  damageScenarioP?: string;
  damageScenario?: string;
}
interface AssetLibReformed {
  _id: string[];
  name: string[];
  assetType: string[];
  subType: string[];
  selected?: boolean[];
}
interface ControlUnitLibChange extends ControlUnitLib {
  changed?: boolean;
}

@Component({
  selector: "feature-setting",
  templateUrl: "feature-setting.component.html",
  styleUrls: ["feature-setting.component.css"],
})
export class FeatureSettingDialog implements OnInit {
  showOrHideAssetLibText = "Show More Assets";
  confirmButton: string = "Create Feature";
  showAssetLib = false;
  assetsloading: boolean = false;
  numberOfAssetLimit: number = 20; // limit how many assets will be displayed by default
  featureSettingTitle: string = "Basic Feature Settings";
  pageFlag: string = "basic";

  readonly assetRootUrl = environment.backendApiUrl + "assets";
  readonly featureRootUrl = environment.backendApiUrl + "features";
  readonly componentRootUrl = environment.backendApiUrl + "components";
  controlUnitDatabaseFeatureBackup = {
    // duplicate database for recovery
    feature: [],
    featureId: [],
    featureType: [],
    featureRole: [],
  };
  modulesloading: boolean = false;
  controlUnitGroups: ControlUnitGroup[] = [];
  private unsubscribe: Subject<void> = new Subject();

  AssetTypes: ValueAndViewValue[] = this._editDesignShared.assetTypes;
  controlUnitDatabase: ControlUnitLibChange[] = [];
  moduleCategoryArray: string[] = []; // this is used for the pop-up dialog
  assetLibReformed: AssetLibReformed = {
    _id: [],
    name: [],
    assetType: [],
    subType: [],
  };
  confirmToDeleteFeatureDialogOptions = {
    title: "CONFIRM TO DELETE",
    message:
      "Deleting the feature will also delete the feature's applications in all modules. Are you sure you want to delete?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  featureUnderEdit: Feature = {
    name: "New Feature",
    featureType: "control",
    assets: [],
    assetsId: [],
  };
  featureName: string;
  selectable = true;
  removable = true;
  searchTerm: string = "";
  assetList: Array<Asset> = [];
  ImpactLevels = ["Severe", "Major", "Moderate", "Negligible"];
  dynamicFeatureRole: ValueAndViewValue[];
  oldModuleIdArray = [];
  featureRoleIndex: number = -1;
  featuresLoading: boolean = false;
  isSpace: boolean;
  noRole: boolean = false; //Flag for no roles selected
  applicationsInitialLength: number; //Initial length of current applications in a feature
  initialApplications: FeatureImpactType[] = []; //Initial applications currently in the feature
  changedModules: any[]= []; //Existing modules changed to another module stored in this

  constructor(private _editDesignShared: DesignSettingsService, private _http: HttpClient, private _arrOp: ArrOpService, private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<FeatureSettingDialog>, private _confirmDialogService: ConfirmDialogService, @Inject(MAT_DIALOG_DATA) public data: any) {}
  debounceTime = 500;
  private availableAssetsModelChanged: Subject<number> = new Subject<number>();
  private availableAssetsSubscription: Subscription;
  FeatureTypes = this._editDesignShared.getFeatureTypes();

  ngOnInit(): void {
    this.dynamicallyAssignFeatureRole(this.featureUnderEdit.featureType); // assign feature roles for display
    this.featureName = this.data.featureEdit.name;
    this.featureUnderEdit.featureType = this.data.featureEdit.featureType;
    this.featureUnderEdit.assets = this.data.featureEdit.assets;
    this.featureUnderEdit.assetsId = this.data.featureEdit.assetsId;
    this.featureUnderEdit.application = []
    if (this.data.featureEdit._id) {
      this.confirmButton = "Confirm Changes";
      this.getApplications(this.data.featureEdit._id, "any");
    }
    this.assignControlUnitDatabaseAndGroups();

    this.availableAssetsSubscription = this.availableAssetsModelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((d) => {
        this.loadAssetLibReformed(d);
      });
  }
  returnToBasicPage() {
    this.pageFlag = "basic";
    this.featureSettingTitle = "Basic Feature Settings";
    this.featureRoleIndex = -1; // restore this back to default
    this.ngOnInit();
  }
  switchToFeatureRoleView(featureRoleView) {
    // console.log(featureRoleView)
    this.featuresLoading = true;
    this.pageFlag = featureRoleView.value;
    this.featureSettingTitle = "Feature Settings For '" + featureRoleView.viewValue + "' Feature Role";
    this.featureRoleIndex = featureRoleView.index; // record the index number for easier composition of property name
    const assetPropertyName = "assets" + this.featureRoleIndex;
    const assetIdPropertyName = "assetsId" + this.featureRoleIndex;
    const params = new HttpParams().set("_id", this.data.featureEdit._id);
    this._http
      .get(this.featureRootUrl + "/featureassetlibSingleFeature", { params: params })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // console.log(res)
        this.featureUnderEdit.assets = res[assetPropertyName];
        this.featureUnderEdit.assetsId = res[assetIdPropertyName];
      });
    this.getApplications(this.data.featureEdit._id, featureRoleView.value);
  }
  getApplications(_id, featureRole) {
    const params = new HttpParams()
      .set("featureId", _id)
      .set("featureRole", featureRole);

    this._http
      .get(this.featureRootUrl + "/featureimpactlib", { params: params })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        this.noRole = true
        this.checkRoles()
        this.featureUnderEdit.application = res;
        if(res.featureType){ //In some cases featureType was not being updated
          this.featureUnderEdit.featureType = res.featureType;
        }
        if (res.length > 0) {
          res.forEach(featureApplication => {
            this.oldModuleIdArray.push(featureApplication.moduleId);
          });
          this.applicationsInitialLength = this.featureUnderEdit.application.length
          if(this.applicationsInitialLength>0 && this.pageFlag=="basic"){
            this.initialApplications = res.map(a => ({...a}));
          }
        }else{
          this.applicationsInitialLength = 0
        }
        this.dynamicallyAssignFeatureRole(this.featureUnderEdit.featureType); // assign feature roles for display
      });
    this.assignControlUnitDatabaseAndGroups();
  }

  onNoClick(): void {
    // function to close dialog
    this.dialogRef.close();
  }
  featureSettingConfirm() {
    //Confirm button click
    this.featureUnderEdit.name = this.featureName;
    this.featureUnderEdit._id = this.data.featureEdit._id;
    // console.log(this.featureUnderEdit)
    const duplicateCheck = this.featureUnderEdit.application.filter((application, index, self) =>//Filter the array to check if modules are unique or not when adding application
     index === self.findIndex((t) => (
      t.module === application.module
     ))
    )
    if(duplicateCheck.length != this.featureUnderEdit.application.length) { // Pop up snack bar for error but doesn't close dialog
      return  this._snackBar.open("Duplicate modules are not allowed", "", {
      duration: 3000,
      });
    }
    if (this.pageFlag == "basic") { // for basic feature settings
      this._http
      .post(this.featureRootUrl + "/featureassetlib", this.featureUnderEdit)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (!this.data.featureEdit._id) {
          // if new feature, need to get the id created in /featureassetlib first, and send it to /featureimpactlib
          if (this.featureUnderEdit.application) {
            for (let i = 0; i < this.featureUnderEdit.application.length; i++) {
              this.featureUnderEdit.application[i].featureId = res._id;
            }
          }
          this.featureUnderEdit._id = res._id;
        }
        if (this.featureUnderEdit.application) {
          this.featureUnderEdit.application = this.featureUnderEdit.application.filter((value) => { // filter to get values which has module name
            return value.module;
          })
          this.featureUnderEdit.application.forEach((x) => {
            x.feature = this.featureName;
          });

          if(this.featureUnderEdit?.application){ //set the feature type for all current applications
            this.featureUnderEdit.application.forEach(item=>item.featureType=this.featureUnderEdit.featureType)
          }
          this._http
            .post(this.featureRootUrl + "/featureimpactlib", this.featureUnderEdit.application)
            .pipe(take(1))
            .subscribe((resp) => {

            });
        }

          let newlyAdded = [] //If any new applications are added they are pushed to this array
          let moduleIds = this.featureUnderEdit.application.map(item=>item.moduleId)

          //Checks the initial number of applications if its increased adds the newly added applications to the array
          if(this.applicationsInitialLength < this.featureUnderEdit.application.length){
            let num = this.featureUnderEdit.application.length - this.applicationsInitialLength
            newlyAdded = this.featureUnderEdit.application.filter(item=>item._id=="")
          }


          //If applications are added for the first time
          if(this.applicationsInitialLength == 0 || this.applicationsInitialLength == undefined){
            newlyAdded = this.featureUnderEdit.application
            this.initialApplications = []
          }

          let changedModulesIndex = [] // index of existing modules changed to another module
          this.featureUnderEdit.application = this.featureUnderEdit.application.filter(item=>item._id!=='')
          let featureRole = this.featureUnderEdit.application.map(item=>item.featureRole)
          const moduleId = {
            action: "featureConfirm",
            moduleIdArray: moduleIds,
            featureId: this.featureUnderEdit._id,
            featureRole,
            featureType:this.featureUnderEdit.featureType,
            feature:this.featureUnderEdit.name,
            newAdded:newlyAdded,
            changedModules:this.changedModules,
            changedModulesIndex
          };

          if(this.changedModules.length){ // exist modules that are changed to another module
            moduleId.changedModules = this.changedModules
          }

          //more logic for existing modules that are changed to another module
          this.initialApplications.map((item,index)=>{
            if(item.moduleId !== this.featureUnderEdit.application[index]?.moduleId){
              let cIndex = this.changedModules.findIndex(cd=>cd.moduleId==item.moduleId)
              if(cIndex>-1){
                this.changedModules[cIndex].changes.push({featureRole:item.featureRole,featureId:item.featureId})
              }else{
              this.changedModules.push({
                moduleId: item.moduleId,
                changes:[{featureRole:item.featureRole,featureId:item.featureId}]
              })
              }
              changedModulesIndex.push(index)
              if(this.featureUnderEdit.application[index]){
                newlyAdded.push(this.featureUnderEdit.application[index])
              }
            }
          })

          this._http
            .patch(this.componentRootUrl + "/controlunitlib", moduleId)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res: any) => {
              // console.log(res, 'Res Second');
            });

            if (this.confirmButton == "Confirm Changes" && res) {
          this._snackBar.open("Feature updated!", "", {
            duration: 3000,
          });
        } else if (this.confirmButton == "Create Feature" && res) {
          this._snackBar.open("New feature created!", "", {
            duration: 3000,
          });
        }
        this.dialogRef.close();
      });
    } else { // if it's in Feature Settings page for a specific feature role
      const assetPropertyName = "assets" + this.featureRoleIndex;
      const assetIdPropertyName = "assetsId" + this.featureRoleIndex;
      this.featureUnderEdit[assetPropertyName] = this.featureUnderEdit.assets;
      this.featureUnderEdit[assetIdPropertyName] = this.featureUnderEdit.assetsId;
      this.featureUnderEdit.featureRoleIndex = this.featureRoleIndex;
      this._http
      .post(this.featureRootUrl + "/featureassetlibSingleFeature", this.featureUnderEdit)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // console.log(res)
        if (this.featureUnderEdit.application) { // update featureimpactlib if application exists
          this.featureUnderEdit.application.forEach((x) => {
            x.feature = this.featureName;
          });
          this._http
            .post(this.featureRootUrl + "/featureimpactlib", this.featureUnderEdit.application)
            .pipe(take(1))
            .subscribe((resp) => {

            });
        }
        

        let newlyAdded = [] //If any new applications are added they are pushed to this array

        //Checks the initial number of applications if its increased adds the newly added applications to the array
        if(this.applicationsInitialLength < this.featureUnderEdit.application.length){
          let num = this.featureUnderEdit.application.length - this.applicationsInitialLength
          newlyAdded = this.featureUnderEdit.application.filter(item =>item._id=="")
        }

        this.featureUnderEdit.application = [...this.initialApplications,...this.featureUnderEdit.application]

        //If applications are added for the first time
        if(this.applicationsInitialLength == 0 || this.applicationsInitialLength == undefined){
          newlyAdded = this.featureUnderEdit.application.filter(item=>item._id=='');
          this.initialApplications = []
        }
        this.featureUnderEdit.application = this.featureUnderEdit.application.filter(item=>item._id!=='')
        this.featureUnderEdit.application = this.featureUnderEdit.application.filter((v,i,a)=>a.findIndex(v2=>(v2._id===v._id))===i)
        
        
        let featureRole = this.featureUnderEdit.application.map(item=>item.featureRole);
        let moduleIds = this.featureUnderEdit.application.map(item=>item.moduleId);
        let newlyAddedIds = newlyAdded.map(item=>item.moduleId)
        moduleIds = [...moduleIds, ...newlyAddedIds]
        let changedModulesIndex = [] // index of existing modules changed to another module

        const moduleId = {
          action: "featureConfirm",
          moduleIdArray: moduleIds,
          featureId: this.featureUnderEdit._id,
          featureRole,
          featureType:this.featureUnderEdit.featureType,
          feature:this.featureUnderEdit.name,
          newAdded:newlyAdded,
          changedModules:this.changedModules,
          changedModulesIndex
        };

        // exist modules that are changed to another module sent to backend for deletion
        if(this.changedModules.length){
          moduleId.changedModules = this.changedModules
        }

        //more logic for existing modules that are changed to another module
        this.initialApplications.map((item,index)=>{
          if(item.moduleId !== this.featureUnderEdit.application[index]?.moduleId){
            let cIndex = this.changedModules.findIndex(cd=>cd.moduleId==item.moduleId)
            if(cIndex>-1){
              this.changedModules[cIndex].changes.push({featureRole:item.featureRole,featureId:item.featureId})
            }else{
            this.changedModules.push({
              moduleId: item.moduleId,
              changes:[{featureRole:item.featureRole,featureId:item.featureId}]
            })
            }
            changedModulesIndex.push(index)
            if(this.featureUnderEdit.application[index]){
              newlyAdded.push(this.featureUnderEdit.application[index])
            }
          }
        })
          
          
          this._http
            .patch(this.componentRootUrl + "/controlunitlib", moduleId)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res: any) => {
              // console.log(res, 'Res Second');
            });


        if (this.confirmButton == "Confirm Changes" && res) {
          this._snackBar.open("Feature updated!", "", {
            duration: 3000,
          });
        } else if (this.confirmButton == "Create Feature" && res) {
          this._snackBar.open("New feature created!", "", {
            duration: 3000,
          });
        }
        this.dialogRef.close();
      })
    }
  }
  deleteFeature() {
    this._confirmDialogService.open(this.confirmToDeleteFeatureDialogOptions);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      let queryParamsAsset = new HttpParams().set("_id", this.data.featureEdit._id);
      if (confirmed) {
        this._http
          .delete(this.featureRootUrl + "/featureassetlib", {params: queryParamsAsset})
          .pipe(take(1))
          .subscribe((res) => {
            // console.log(res)
          });
        if (
          this.featureUnderEdit.application &&
          this.featureUnderEdit.application.length > 0
        ) {
          let featureImpactIdArrayDelete = [];
          let affectedModuleIdArray = [];
          for (let i = 0; i < this.featureUnderEdit.application.length; i++) {
            featureImpactIdArrayDelete.push(this.featureUnderEdit.application[i]._id);
            affectedModuleIdArray.push(this.featureUnderEdit.application[i].moduleId)
          }
          let queryParamsFeatureImpact = new HttpParams()
            .set("_idArray", featureImpactIdArrayDelete.join())
            .set("featureId", this.featureUnderEdit._id)
            .set("moduleId", affectedModuleIdArray.join());

          this._http
            .delete(this.featureRootUrl + "/featureimpactlib", {params: queryParamsFeatureImpact})
            .pipe(take(1))
            .subscribe((resp) => {
              // console.log(resp)
            });
        }
        this.dialogRef.close();
        this._snackBar.open("Feature Deleted", "Success", {
          duration: 3000,
        });
      }
    });
  }
  featureTypeChange(selection) {
    this.featureUnderEdit.featureType = selection;
    this.dynamicallyAssignFeatureRole(this.featureUnderEdit.featureType); // assign feature roles for display
    let dynamicFeatureRoleValues = this.dynamicFeatureRole.map(item=>item.value)

    /*If feature type is changed and new featureType 
    does not have similar roles to previous types
    empty featureRole 
    */
    if(this.featureUnderEdit?.application){
      this.featureUnderEdit.application.forEach(item=>{
        item.featureType=selection
        if(!dynamicFeatureRoleValues.includes(item.featureRole)){
          item.featureRole=""
          this.noRole=true
          this._snackBar.open("Roles cannot be empty and need to be selected", "", {
            duration: 3000,
          });
        }
      })
    }
  }

  //If any of the roles are empty keep the confirm button disabled
  checkRoles(){
    setTimeout(() => {
      let roles = this.featureUnderEdit.application.map(item=>item.featureRole)
      let modules = this.featureUnderEdit.application.map(item=>item.module)
      let impacts = this.featureUnderEdit.application.map(({ FLevel,PLevel,OLevel,SLevel }) => ({FLevel,PLevel,OLevel,SLevel}));
      let impactsArray = [].concat.apply([], impacts.map(Object.values));
      if (!roles.includes("") && !modules.includes("") && !impactsArray.includes("")){
        this.noRole=false
      }
    })
  }

  removeFeatureAsset(removedAsset) {
    const index = this.featureUnderEdit.assets.indexOf(removedAsset);
    if (index >= 0) {
      this.featureUnderEdit.assets.splice(index, 1);
      this.featureUnderEdit.assetsId.splice(index, 1);
    }
  }
  showOrHideAssetLib() {
    if (!this.showAssetLib) {
      this.loadAssetLibReformed(0);
      this.showOrHideAssetLibText = "Hide Assets Library";
    } else {
      this.showOrHideAssetLibText = "Show More Assets";
      this.assetLibReformed.selected.forEach((item,index)=>{
        this.assetLibReformed.selected[index] = false;      
      })
    }
    this.showAssetLib = !this.showAssetLib;
  }
  editFeatureRoleAssets() {

  }
  loadAssetLibReformed(isGLobal, assetLimitArg?: number) {
    this.assetsloading = true;
    let assetLimit = this.numberOfAssetLimit;
    if (assetLimitArg != undefined) {
      assetLimit = assetLimitArg;
    }
    this._http
      .get(
        this.assetRootUrl +
          `/assetlib?searchTerm=${this.searchTerm}&global=${isGLobal}&limit=${assetLimit}`
      )
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          this.assetsloading = false;
          this.assetList = res;
          this.assetLibReformed =
            this._arrOp.reformLibArrayIntoObjOfArraysDefinedProp(
              res,
              Object.keys(this.assetLibReformed),
              "selected",
              false
            );
          if (assetLimitArg != undefined) {
            this._snackBar.open(
              `All ${res.length} assets in your asset library are shown.`,
              "",
              {
                duration: 5000,
              }
            );
          }
        },
        (err: any) => {
          this.assetsloading = false;
        }
      );
  }
  changeSelectedAsset(event, index) {
    // triggers when user selects or deselects an asset chip
    if (event.selected) {
      // triggers when user selects or deselects an asset chip
      if (event.selected) {
        let displayAssetTypeIndex = this._arrOp.findStringIndexInArrayProperty(
          this.assetList[index].assetType,
          "value",
          this.AssetTypes
        );
        let displayMsg =
          "Asset Type: " +
          this.AssetTypes[displayAssetTypeIndex].viewValue +
          ". Subtype: " +
          this.assetList[index].subType;
        this._snackBar.open(displayMsg, "", {
          duration: 5000,
        });
      }
    }
  }
  addAssetToFeature() {
    this.assetLibReformed.selected.forEach((value, index) => {
      if (value) {
        this.featureUnderEdit.assets.push(this.assetLibReformed.name[index]); // added only in the front end
        this.featureUnderEdit.assetsId.push(this.assetLibReformed._id[index]); // used to add new asset to the feature lib in database
        this.assetLibReformed.selected[index] = false; // remove highlight/color on the chip
      }
    });
  }
  addAFeatureApplication() {
    this.featureUnderEdit._id = this.data.featureEdit._id;
    let newFeatureApplication: FeatureImpactType = {
      _id: "",
      module: "",
      moduleId: "",
      feature: this.featureName,
      featureId: this.featureUnderEdit._id,
      featureType: this.featureUnderEdit.featureType,
      featureRole: "",
      SLevel: "",
      FLevel: "",
      OLevel: "",
      PLevel: "",
      damageScenario: "",
    };
    if (this.pageFlag != "basic") { // if in Feature Role page, pre-assign feature role
      newFeatureApplication.featureRole = this.pageFlag;
    };
    if (this.featureUnderEdit.application) {
      this.featureUnderEdit.application.push(newFeatureApplication);
    } else {
      this.featureUnderEdit.application = [];
      this.featureUnderEdit.application.push(newFeatureApplication);
    }
    this.noRole=true
  }

  // function used in subscribe() after GET componentLib
  assignControlUnitDatabaseAndGroups(limit: number = 0) {
    // console.log("assignControlUnitDatabase function executed")
    this.controlUnitDatabase = [];
    this.controlUnitDatabaseFeatureBackup = {
      // duplicate database for recovery
      feature: [],
      featureId: [],
      featureType: [],
      featureRole: [],
    };
    this.modulesloading = true;
    this._http
      .get(this.componentRootUrl + "/controlunitlib?limit=" + limit)
      .pipe(take(1))
      .subscribe((res: any) => {
        // this.controlUnitDatabase.category = res.category;
        // this.controlUnitDatabase.model = res.model;
        // this.controlUnitDatabase._id = res._id;
        this.modulesloading = false;
        if (res.length > 0) {
          this.controlUnitDatabase = res
          for (let i = 0; i < res.length; i++) {
            // this.controlUnitDatabase.push({
            //   category: res[i].category, // controlUnitDatabase's .category .model ._id properties are populated directly
            //   model: res[i].model, // controlUnitDatabase's .feature .featureId .featureType .featureRole properties are assembled below
            //   _id: res[i]._id
            // })
            // this.controlUnitDatabase.push(res[i]);
            // the following code is to compose the object controlUnitGroups...
            // ...so that the component can be sorted by category in the module list
            let tempIndexCat = this._arrOp.findStringIndexInArrayProperty(
              res[i].category,
              "category",
              this.controlUnitGroups
            );
            if (tempIndexCat == undefined) {
              this.controlUnitGroups.push({
                category: res[i].category,
                model: [],
                modelId: [],
              });
            }
            tempIndexCat = this._arrOp.findStringIndexInArrayProperty(
              res[i].category,
              "category",
              this.controlUnitGroups
            );
            let tempIndexModel = this._arrOp.findStringIndexInArray(
              res[i].model,
              this.controlUnitGroups[tempIndexCat].model
            );
            if (tempIndexModel == undefined) {
              this.controlUnitGroups[tempIndexCat].model.push(res[i].model);
              this.controlUnitGroups[tempIndexCat].modelId.push(res[i]._id);
            }
            if (!this.moduleCategoryArray.includes(res[i].category)) {
              this.moduleCategoryArray.push(res[i].category);
            }

            /*This code was calling the backed for each controlUnit Id
            To fetch the data of each feature and get the feature details
            and correct each controlUnit's feature data.
            Since the patch function now works correctly for controlUnit
            We dont need these api calls
            */
            // assemble the feature properties of controlUnitDatabase
            // const params = new HttpParams().set(
            //   "moduleId",
            //   this.controlUnitDatabase[i]._id
            // );
            // this._http
            //   .get(this.featureRootUrl + "/featureimpactlib", {
            //     params: params,
            //   })
            //   .pipe(take(1))
            //   .subscribe((res: any) => {
            //     let tempArray =
            //       this._arrOp.reformLibArrayIntoObjOfArraysDefinedProp(res, [
            //         "feature",
            //         "featureId",
            //         "featureType",
            //         "featureRole",
            //       ]);
            //     this.controlUnitDatabase[i].feature = tempArray.feature;
            //     this.controlUnitDatabase[i].featureId = tempArray.featureId;
            //     this.controlUnitDatabase[i].featureType = tempArray.featureType;
            //     this.controlUnitDatabase[i].featureRole = tempArray.featureRole;
            //     this.controlUnitDatabaseFeatureBackup.feature.push(
            //       tempArray.feature
            //     );
            //     this.controlUnitDatabaseFeatureBackup.featureId.push(
            //       tempArray.featureId
            //     );
            //     this.controlUnitDatabaseFeatureBackup.featureType.push(
            //       tempArray.featureType
            //     );
            //     this.controlUnitDatabaseFeatureBackup.featureRole.push(
            //       tempArray.featureRole
            //     );
            //   });
          }
        } else {
          this._snackBar.open("No module available in your library.", "", {
            duration: 5000,
          });
        }
      });
    // console.log(this.controlUnitDatabase);
    this.featuresLoading = false;
  }
  goToModulePage(index) {
    this.dialogRef.close(index);
  }
  deleteFeatureImpactModule(index) {
    //   Delete functionality
    this.featureUnderEdit._id = this.data.featureEdit._id;
    let queryParamsFeatureImpact = new HttpParams()
      .set("_idArray", this.featureUnderEdit.application[index]._id)
      .set("moduleId", this.featureUnderEdit.application[index].moduleId)
      .set("featureId", this.featureUnderEdit._id).set("featureRole",this.featureUnderEdit.application[index].featureRole);
    this._http
      .delete(this.featureRootUrl + "/featureimpactlib", {params: queryParamsFeatureImpact})
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        // console.log(res)
        // const featureToDelete = {
        //   action: "deleteFeature",
        //   moduleId: this.featureUnderEdit.application[index].moduleId,
        //   featureId: this.featureUnderEdit._id,
        // };
        // this._http
        //   .patch(this.componentRootUrl + "/controlunitlib", featureToDelete)
        //   .pipe(takeUntil(this.unsubscribe))
        //   .subscribe((res: any) => {
        //     // console.log(res, 'Res Second');
        //   });
        this.featureUnderEdit.application.splice(index, 1);
        this.dynamicallyAssignFeatureRole(this.featureUnderEdit.featureType); // assign feature roles for display
        this._snackBar.open("Database updated", "Success", {
          duration: 3000,
        });
        // refresh
        // const params = new HttpParams().set(
        //   "featureId",
        //   this.featureUnderEdit._id
        // );
        // this._http
        //   .get(this.featureRootUrl + "/featureimpactlib", { params: params })
        //   .pipe(takeUntil(this.unsubscribe))
        //   .subscribe((res: any) => {
        //     // console.log(res);
        //     const featureToDelete = {
        //       action: "deleteFeature",
        //       moduleId: this.featureUnderEdit.application[index].moduleId,
        //       featureId: this.featureUnderEdit._id,
        //     };
        //     this._http
        //       .patch(this.componentRootUrl + "/controlunitlib", featureToDelete)
        //       .pipe(takeUntil(this.unsubscribe))
        //       .subscribe((res: any) => {
        //         // console.log(res, 'Res Second');
        //       });
        //     this.featureUnderEdit.application = res;
        //     this.dynamicallyAssignFeatureRole(
        //       this.featureUnderEdit.featureType
        //     ); // assign feature roles for display
        //     this._snackBar.open("Database updated", "Success", {
        //       duration: 3000,
        //     });
        //   });
      });
      this.applicationsInitialLength = this.applicationsInitialLength-1
  }
  createNewFeatureApplication(index) {
    this.featureUnderEdit._id = this.data.featureEdit._id;
    let newFeatureApplication: FeatureImpactType = {
      _id: "",
      module: "",
      moduleId: "",
      feature: this.featureName,
      featureId: this.featureUnderEdit._id,
      featureType: this.featureUnderEdit.featureType,
      featureRole: "",
      SLevel: "",
      FLevel: "",
      OLevel: "",
      PLevel: "",
      damageScenario: "",
    };

    if (this.pageFlag != "basic") { // if in Feature Role page, pre-assign feature role
      newFeatureApplication.featureRole = this.pageFlag;
    };
    this.featureUnderEdit.application.splice(index, 0, newFeatureApplication);
    this.noRole=true
    
  }
  cancelNewFeatureApplication(index) {
    this.checkRoles()
    this.featureUnderEdit.application.splice(index, 1);
  }
  commitNewFeatureApplication(index) {
      // console.log(this.featureUnderEdit.application[index]);
    if(this.featureUnderEdit.application[index].module) {
    this._http
      .post(this.featureRootUrl + "/featureimpactlib", [
        this.featureUnderEdit.application[index],
      ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const params = new HttpParams().set(
          "featureId",
          this.data.featureEdit._id
        );
        this._http
          .get(this.featureRootUrl + "/featureimpactlib", { params: params })
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res: any) => {
            // console.log(res);
            this.featureUnderEdit.application = res;
            this.dynamicallyAssignFeatureRole(
              this.featureUnderEdit.featureType
            ); // assign feature roles for display
            this._snackBar.open("Database updated", "Success", {
              duration: 3000,
            });
          });
      });
    }else {
        this._snackBar.open(`Unassigned feature applications will not be saved`, "", {
        duration: 3000,
      });
    }
  }
  impactSLevelChange(event, i) {
    this.checkRoles()
    this.featureUnderEdit.application[i].safety = Number(
      ImpactLevelToValueConv[event.value]
    );
  }
  impactFLevelChange(event, i) {
    this.checkRoles()
    this.featureUnderEdit.application[i].financial = Number(
      ImpactLevelToValueConv[event.value]
    );
  }
  impactOLevelChange(event, i) {
    this.checkRoles()
    this.featureUnderEdit.application[i].operational = Number(
      ImpactLevelToValueConv[event.value]
    );
  }
  impactPLevelChange(event, i) {
    this.checkRoles()
    this.featureUnderEdit.application[i].privacy = Number(
      ImpactLevelToValueConv[event.value]
    );
  }
  featureSettingModuleChange(event, index, cat) {
    // assign moduleId property once module is changed
    // console.log(this.controlUnitGroups)
    if (event.isUserInput === true) {
      let moduleCategoryIndex = this._arrOp.findStringIndexInArrayProperty(
        cat,
        "category",
        this.controlUnitGroups
        );
        let moduleIndex = this._arrOp.findStringIndexInArray(
          event.source.value,
        this.controlUnitGroups[moduleCategoryIndex].model
      );
      this.featureUnderEdit.application[index].moduleId =
      this.controlUnitGroups[moduleCategoryIndex].modelId[moduleIndex];
    }
    this.checkRoles()
  }
  dynamicallyAssignFeatureRole(inputFeatureType) {
    this.dynamicFeatureRole = this._editDesignShared.dynamicallyAssignFeatureRole(inputFeatureType);
  }
  availableAssetChangedHandler(isGLobal = 0) {
    this.availableAssetsModelChanged.next(isGLobal);
  }
  editAssetLib() {
    this.dialogRef.close("Asset");
  }
  moduleNameChange(event: any) {//validation for empty space in input
    this.isSpace = false;
    if(event.trim().length === 0){
      this.isSpace = true;
    }
  }
}