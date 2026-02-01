import { ENTER } from "@angular/cdk/keycodes";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatChipInputEvent, MatChipList } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { of, Subject, Subscription } from "rxjs";
import { debounceTime, finalize, map, startWith, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ControlUnitLib, ValueAndViewValue } from "../../threatmodel/ItemDefinition";
import { AddGoalDialog } from "../dialogues/add-goal-dialog/add-goal.component";
import { CreateAssetDialog } from "../dialogues/create-asset/create-asset.component";
import { CreateModuleDialog } from "../dialogues/create-module/create-module.component";
import { EditDeleteFeatureDialog } from "../dialogues/edit-delete-feature/editdelete-feature.component";
import { FeatureSettingDialog } from "../dialogues/feature-setting/feature-setting.component";
import { ControlUnitGroup } from "../property-panel/property-panel.component";
import { AuthenticationService } from "../services/authentication.service";
import { CybersecurityGoalService } from "../services/cybersecurity-goal.service";
import { AddModifyArrayDialogService } from "./../services/add-modify-array-dialog.service";
import { ArrOpService } from "./../services/arr-op.service";
import { ConfirmDialogService } from "./../services/confirm-dialog.service";
import { DesignSettingsService } from './../services/design-settings.service';

interface FeatureAsset {
  _id?: string;
  name: string;
  featureType?: string;
  assets?: string[];
  assetsId?: string[];
}
interface Asset {
  _id?: string;
  name: string;
  assetType?: string;
  subType?: string;
  tag?: string[];
}
// interface ValueAndViewValue {
//   value: string,
//   viewValue: string
// }
interface Feature extends FeatureAsset {
  application?: FeatureImpactType[];
}
interface AssetLibReformed {
  _id: string[];
  name: string[];
  assetType: string[];
  subType: string[];
  selected?: boolean[];
}
export enum ImpactLevelToValueConv {
  Critical = 10,
  High = 8,
  Medium = 5,
  Low = 2,
  Negligible = 0,
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
interface ControlUnitLibChange extends ControlUnitLib {
  changed?: boolean;
}

@Component({
  selector: "app-database-view",
  templateUrl: "./database-view.component.html",
  styleUrls: ["./database-view.component.css"],

})
export class DatabaseViewComponent implements OnInit {
  @ViewChildren("chipInput") private chipInput: QueryList<ElementRef>;
  searchFeatures: string;
  private availableFeaturesModelChanged: Subject<number> =
    new Subject<number>();
  private availableFeaturesSubscription: Subscription;
  updatedCategories: any;
  currentUserProfile: any;
  displayedColumns: string[] = ['serial', 'control', 'action'];
  searchValueControl:FormControl = new FormControl();
  controlLoading;
  controlSearchLoading;
  public dataSourceControl: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  readonly projectRootUrl = environment.backendApiUrl + "projects";
  confirmToDeleteGoalDialogOptions = {
    title: "",
    message: "Are you sure you want to delete this",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };


  constructor(private _http: HttpClient, private _router: Router, private _snackBar: MatSnackBar, public dialog: MatDialog, private _arrOp: ArrOpService,
    private _confirmDialogService: ConfirmDialogService, private _addModifyArrayDialogService: AddModifyArrayDialogService, private _editDesignShared: DesignSettingsService,private _authService:AuthenticationService,
    private cybersecurityGoalService: CybersecurityGoalService) { }
  // @ViewChild('auto') matAutocomplete: MatAutocomplete;
  @ViewChild("assetLibChip") assetLibChip: MatChipList;

  readonly featureRootUrl = environment.backendApiUrl + "features";
  readonly assetRootUrl = environment.backendApiUrl + "assets";
  readonly componentRootUrl = environment.backendApiUrl + "components";
  readonly separatorKeysCodes: number[] = [ENTER];
  private unsubscribe: Subject<void> = new Subject();

  AssetTypes: ValueAndViewValue[] = this._editDesignShared.assetTypes;

  featureList: Array<FeatureAsset> = [];
  assetList: Array<Asset> = [];
  assetLibReformed: AssetLibReformed = {
    _id: [],
    name: [],
    assetType: [],
    subType: [],
  };

  ImpactLevels = ["Severe", "Major", "Moderate", "Negligible"];
  dynamicFeatureRole: ValueAndViewValue[];
  selectedTabIndex: number = 0;
  featureUnderEdit: Feature = {
    name: "New Feature",
    featureType: "control",
    assets: [],
    assetsId: [],
  };
  selectedFeatureType: string = "";
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  showAssetLib = false;
  showOrHideAssetLibText = "Show More Assets";
  addedAssetId = [];
  controlUnitDatabase: ControlUnitLibChange[] = [];
  controlUnitDatabaseFeatureBackup = {
    // duplicate database for recovery
    feature: [],
    featureId: [],
    featureType: [],
    featureRole: [],
  };
  controlUnitGroups: ControlUnitGroup[] = [];
  moduleCategoryArray: string[] = []; // this is used for the pop-up dialog
  submitFeatureChange = "Create Feature";
  confirmToDeleteFeatureDialogOptions = {
    title: "CONFIRM TO DELETE",
    message:
      "Deleting the feature will also delete the feature's applications in all modules. Are you sure you want to delete?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };

  confirmToDeleteModuleDialogOptions = {
    title: "CONFIRM TO DELETE",
    message:
      "Are you sure you want to delete this module?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  confirmToDeleteAssetDialogOptions = {
    title: "CONFIRM TO DELETE",
    message: "Are you sure you want to delete this asset?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };
  addModifyModuleCategoryDialogOptions = {
    title: "MODULE CATEGORY",
    message: "",
    cancelText: "Cancel",
    confirmText: "Confirm",
    arrayData: this.moduleCategoryArray,
  };
  searchTerm: string = "";
  assetsloading: boolean = false;
  modulesloading: boolean = false;
  featuresLoading: boolean = false;
  private availableAssetsModelChanged: Subject<number> = new Subject<number>();
  private availableModulesModelChanged: Subject<number> = new Subject<number>();
  private availableAssetsSubscription: Subscription;
  private availableModulesSubscription: Subscription;

  debounceTime = 500;
  numberOfFeatureLimit: number = 40; // limit how many features will be displayed by default
  numberOfAssetLimit: number = 20; // limit how many assets will be displayed by default
  numberOfModuleLimit: number = 40; // limit how many modules will be displayed by default
  subTypeDisable = true; // disable subType input field for future use
  indexNumber: number;//number store the index of input field which is empty
  readonly newDesign = JSON.parse(localStorage.getItem("newDesign"));
  assetSubTypes = this._editDesignShared.assetSubTypes;
  assetSubTypesTransit = this._editDesignShared.assetSubTypesTransit;


  ngOnInit(): void {
    localStorage.setItem("intendedUrl", this._router.url);
    this.searchFeatures = "";
    this.loadFeatureLibReformed(0, this.numberOfFeatureLimit);
    // const featureParams = new HttpParams().set("limit", this.numberOfFeatureLimit.toString());
    // this._http
    //   .get(this.featureRootUrl + "/featureassetlib", {params: featureParams})
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe((res: any) => {
    //       if (res.length>0) {
    //         this.featureList = res;
    //       } else {
    //         this._snackBar.open(res.msg, "", {
    //           duration: 3000,
    //         })
    //       }
    //   });

    this.availableModulesSubscription = this.availableModulesModelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((d) => {
        this.loadModuleLibReformed(d);
      });

    this.availableAssetsSubscription = this.availableAssetsModelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((d) => {
        this.loadAssetLibReformed(d);
      });

    this.availableFeaturesSubscription = this.availableFeaturesModelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((d) => {
        this.loadFeatureLibReformed(d);
      });
    if (this.selectedTabIndex === 0) {
      //On database view we can see selected Tab data.
      this.searchTerm = "";
      this.assignControlUnitDatabaseAndGroups(this.numberOfModuleLimit);
    }

    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => this.currentUserProfile = currentUser);


      this.searchValueControl.valueChanges.pipe(
        startWith(<string>null),
        debounceTime(400),
        switchMap((val) => {
          return this.filter(val || "").pipe(
            finalize(() => {
              this.controlSearchLoading = false;
            })
            );
          })
          ).subscribe();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.availableFeaturesSubscription.unsubscribe();
    this.availableAssetsSubscription.unsubscribe();
    this.availableModulesSubscription.unsubscribe();
  }

  // function triggers when a tab is clicked

  settingsTabClick(event) {
    if (event.index == 0) {
      // Module Library tab is clicked. no action
      this.searchTerm = "";
      this.assignControlUnitDatabaseAndGroups(this.numberOfModuleLimit);
    }
    else if (event.index == 1) {
      // Feature Library tab is clicked
      this.searchFeatures = "";
      this.loadFeatureLibReformed(0);
      //
    } else if (event.index == 2) {
      // Asset lib tab is clicked
      this.searchTerm = "";
      this.loadAssetLibReformed(1);
    }else if (event.index == 4){
      this.loadControls();
    }
  }
  //////////////////////////////////////////////
  //////     Features Settings     ////////////
  /////////////////////////////////////////////

  // show all features. otherwise only a limited number of features are displayed by default
  showAllFeatures() {
    this.searchFeatures = "";
    this.loadFeatureLibReformed(1, 0); // second arg is the limit number
  }

  createNewFeature(featureIndex): void {
    const featureEdit = {};
    let dataDialog = {};
    if (featureIndex > -1) {
      Object.assign(featureEdit, {
        _id: this.featureList[featureIndex]._id,
        name: this.featureList[featureIndex].name,
        featureType: this.featureList[featureIndex].featureType,
        assets: this.featureList[featureIndex].assets,
        assetsId: this.featureList[featureIndex].assetsId,
      });
      dataDialog = featureEdit;
    } else {
      this.featureUnderEdit = {
        name: "New",
        featureType: "control",
        assets: [],
        assetsId: [],
      };
      dataDialog = this.featureUnderEdit;
    }
    const dialogRef = this.dialog.open(FeatureSettingDialog, {
      disableClose: true,
      height: "100vh",
      width: "100vw",
      data: {
        featureEdit: dataDialog,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log(`Dialog result: ${result}`);
      if (result >= 0) {
        this.selectedTabIndex = 0;
      }
      if (result === "Asset") {
        this.selectedTabIndex = 2;
      }
      this.loadFeatureLibReformed(1, 20);
    });
  }
  showOrHideAssetLib() {
    if (!this.showAssetLib) {
      this.loadAssetLibReformed(0);
      // if (this.assetLibReformed._id.length>1) { // if the asset lib was queried before
      // } else { // if not before, query now
      //   this._http
      //   .get(this.assetRootUrl + "/assetlib")
      //   .pipe(takeUntil(this.unsubscribe))
      //   .subscribe((res: any)=> {
      //     // console.log(res)
      //     this.assetList = res;
      //     this.assetLibReformed = this._arrOp.reformLibArrayIntoObjOfArraysDefinedProp(res, Object.keys(this.assetLibReformed), "selected", false);
      //     Object.defineProperty(this.assetLibReformed, "delete", {
      //       value: false
      //     })
      //   });
      // }
      // console.log(this.assetList)
      this.showOrHideAssetLibText = "Hide Assets Library";
    } else {
      this.showOrHideAssetLibText = "Show More Assets";
    }
    this.showAssetLib = !this.showAssetLib;
  }
  refreshFeature() {
    this.loadFeatureLibReformed(1, 20);
  }


  goToModulePage(index) {
    // console.log(this.featureUnderEdit.application[index].moduleId)
    this.selectedTabIndex = 0;
  }
  autoAssetGeneration() { }

  //////////////////////////////////////////////
  //////     Assets Settings     //////////////
  /////////////////////////////////////////////
  refreshAssetLib() {
    this.searchTerm = "";
    this.loadAssetLibReformed(1);
  }
  showAllAssets() {
    this.searchTerm = "";
    this.loadAssetLibReformed(1, 0); // second arg is the limit number
  }
  showAllModules() {
    this.searchTerm = "";
    this.loadModuleLibReformed(1, 0); // second arg is the limit number
  }
  updateAsset(index: number) {
    let assetUnderEdit: Asset = this.assetList[index];
    //Compares the current assetType to see if its not dataAtRest or transit then clears the subtype
    if(assetUnderEdit.assetType.localeCompare('dataAtRest')!==0 && assetUnderEdit.assetType.localeCompare('dataInTransit')!==0){
        this.assetList[index].subType=''
      }
    this._http
      .post(this.assetRootUrl + "/assetlib", assetUnderEdit)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (res.name) {
          this._snackBar.open("Asset update successful!", "", {
            duration: 3000,
          });
        }
      });
  }
  cancelNewAsset(index) {
    this.assetList.splice(index, 1);
  }
  deleteAsset(index) {
    this._confirmDialogService.open(this.confirmToDeleteAssetDialogOptions);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      const params = new HttpParams().set("_id", this.assetList[index]._id);
      if (confirmed) {
        this._http
          .delete(this.assetRootUrl + "/assetlib", { params: params })
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res: any) => {
            // delete feature asset logic
            let queryParamsAsset = new HttpParams().set("_id", res._id);
            this._http
              .delete(this.featureRootUrl + "/featureassetlib", {
                params: queryParamsAsset,
              })
              .pipe(take(1))
              .subscribe((res) => {
                // console.log(res)
              });

            //Delete feature assert logic
            if (res) {
              this._snackBar.open("Asset deleted!", "", {
                duration: 3000,
              });
            }
            this.assetList.splice(index, 1);
          }, (error) => {
            if (error) {
              this._snackBar.open(error.error.msg, "", {
                duration: 3000,
              });
            }
          });
      }
    });
  }
  createNewAsset() {
    const dialogRef = this.dialog.open(CreateAssetDialog, {
      disableClose: true,
      data: {
        assetType: this.AssetTypes,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log(result);
      if (result === "assetcreated") {
        this.refreshAssetLib();
      }
    });
  }

  //////////////////////////////////////////////
  //////     Module Settings     //////////////
  /////////////////////////////////////////////
  refreshModuleLib() {
    this.assignControlUnitDatabaseAndGroups(20);
    if(this.searchTerm && this.searchTerm.trim().length){
      this.availableModuleChangedHandler(1)
    }
  }
  createNewModule() {
    // Open in new dialog
    const dialogRef = this.dialog.open(CreateModuleDialog, {
      disableClose: true,
      data: {
        moduleCategory: this.moduleCategoryArray,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log(`Dialog result: ${result}`);
      if (result === "Success") {
        this.assignControlUnitDatabaseAndGroups();
      }
    });
  }
  editModuleCategory() {
    if (this.updatedCategories){
      this.addModifyModuleCategoryDialogOptions.arrayData = this.updatedCategories
    }
    this._addModifyArrayDialogService.open(
      this.addModifyModuleCategoryDialogOptions
    );
    this._addModifyArrayDialogService.confirmed().subscribe((res: any) => {
      if (res) {
        this.updatedCategories = res.map(item=>item.category)
        this.moduleCategoryArray = res.map(item=>item.category)
        let changedCategories = []
        res.map(item=>{
          if(item.initialCategory){
            if(item.category!==item.initialCategory){
              changedCategories.push(item)
            }
          }
        })
        
        if(changedCategories.length){ //If module categories are updated or deleted then update the db
          this._http.patch(this.componentRootUrl + "/controlunitlib", {categories:changedCategories,action:"updateCateogries"}).subscribe((res:any)=>{
            if(res.Msg=="success"){
              changedCategories.map(item=>{
                this.controlUnitDatabase.map(cud=>{
                  let index = this.controlUnitDatabase.findIndex(cu=>cu.category==item.initialCategory)
                  if(index>-1){
                    this.controlUnitDatabase[index].category=item.category
                  }
                })
              })
              this._snackBar.open(
                "Category has been updated!",
                "",
                {
                  duration: 6000,
                }
              );  
            }
          })
        }else{
        this._snackBar.open(
          "If you leave DataBase view without adding a module to the newly created category, the newly created category will not be saved.",
          "",
          {
            duration: 6000,
          }
        );
        }
      }
    });
  }
  // this function works, but the changes are not linked with backend.
  // moduleFeatureSelectionChange(event, moduleIndex, featureIndex) {
  //   if (this.controlUnitDatabase[moduleIndex].feature.length != this.controlUnitDatabase[moduleIndex].featureId.length) { // if changes occurred
  //     if (!event.source.selected) { // if the change is a feature is removed
  //       this.controlUnitDatabase[moduleIndex].featureId.slice(featureIndex);
  //       this.controlUnitDatabase[moduleIndex].featureType.slice(featureIndex);
  //       this.controlUnitDatabase[moduleIndex].featureRole.slice(featureIndex);
  //     } else { // if the change is a feature is added
  //       this.controlUnitDatabase[moduleIndex].featureId.splice(featureIndex, 0, this.controlUnitDatabaseFeatureBackup.featureId[moduleIndex][featureIndex]);
  //       this.controlUnitDatabase[moduleIndex].featureRole.splice(featureIndex, 0, this.controlUnitDatabaseFeatureBackup.featureRole[moduleIndex][featureIndex]);
  //       this.controlUnitDatabase[moduleIndex].featureType.splice(featureIndex, 0, this.controlUnitDatabaseFeatureBackup.featureType[moduleIndex][featureIndex]);
  //     }
  //   }
  //   console.log(this.controlUnitDatabase)
  //   console.log(this.controlUnitDatabaseFeatureBackup)
  // }
  moduleNameChange(newValue, index) {
    this.controlUnitDatabase[index].changed = true;
    this.controlUnitDatabase[index].model = newValue;
  }
  submitModuleChange() {
    let updateObj = {
      // add a delete flag
      delete: false,
      data: this.controlUnitDatabase,
    };
    this._http
      .post(this.componentRootUrl + "/controlunitlib", updateObj)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // console.log(res)
        if (res[0].model) {
          this._snackBar.open(
            "Module database updated! Refresh to see changes.",
            "Success",
            {
              duration: 3000,
            }
          );
        } else {
          this._snackBar.open("Module database not updated!", "Failure", {
            duration: 3000,
          });
        }
        // console.log(res)
      });
    let nameChangedModules = [];
    for (let i = 0; i < this.controlUnitDatabase.length; i++) {
      // extract modules whose name changed
      if (
        this.controlUnitDatabase[i].changed &&
        this.controlUnitDatabase[i]._id
      ) {
        // && it's not a new module
        nameChangedModules.push({
          module: this.controlUnitDatabase[i].model,
          _id: this.controlUnitDatabase[i]._id,
        });
      }
    }
    if (nameChangedModules.length > 0) {
      // if there are name changes
      this._http
        .post(
          this.featureRootUrl + "/featureimpactlibbymodule",
          nameChangedModules
        ) // change module names in featureImpactLib
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          // if (res[0].model) {
          //   this._snackBar.open("Module database updated!", "Success", {
          //     duration: 3000,
          //   })
          // } else {
          //   this._snackBar.open("Module database not updated!", "Failure", {
          //     duration: 3000,
          //   })
          // }
          // console.log(res)
        });
    }
    this.assignControlUnitDatabaseAndGroups(); // refresh
  }
  commitOneModule(index) {
    if (this.controlUnitDatabase[index].model.trim().length === 0) {//Check to see if user entering empty module name 
      return this._snackBar.open("Module name can't be empty!", "Failure", {
        duration: 3000,
      });
    }
    let updateObj = {
      // add a delete flag
      delete: false,
      data: [this.controlUnitDatabase[index]],
    };
    this._http
      .post(this.componentRootUrl + "/controlunitlib", updateObj)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // console.log(res);
        if (res[0].model) {
          this._snackBar.open("Module database updated!", "Success", {
            duration: 3000,
          });
        } else {
          this._snackBar.open("Module database not updated!", "Failure", {
            duration: 3000,
          });
        }
        // console.log(res)
      });
    if (
      this.controlUnitDatabase[index].changed &&
      this.controlUnitDatabase[index]._id
    ) {
      // if name changed, also change module names in featureImpactLib
      let nameChangedModules = [
        {
          module: this.controlUnitDatabase[index].model,
          _id: this.controlUnitDatabase[index]._id,
        },
      ];
      this._http
        .post(
          this.featureRootUrl + "/featureimpactlibbymodule",
          nameChangedModules
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          if(res){
          this.assignControlUnitDatabaseAndGroups(); // refresh
          if(this.searchTerm && this.searchTerm.trim().length){
            this.availableModuleChangedHandler(1)
          }
          }
          // console.log(res)
          // if (res[0].model) {
          //   this._snackBar.open("Module database updated!", "Success", {
          //     duration: 3000,
          //   })
          // } else {
          //   this._snackBar.open("Module database not updated!", "Failure", {
          //     duration: 3000,
          //   })
          // }
        });
    }
  }
  cancelNewModule(index) {
    this.controlUnitDatabase.splice(index, 1);
  }
  deleteModule(index) {
  this.confirmToDeleteModuleDialogOptions.message = `Confirm deleting this module: ${this.controlUnitDatabase[index].model}`
  this._confirmDialogService.open(this.confirmToDeleteModuleDialogOptions);
  this._confirmDialogService.confirmed().subscribe((confirmed) => {
    if(confirmed){
    let updateObj = {
      // add a delete flag. TODO: change to HTTP DELETE
      delete: true,
      data: [this.controlUnitDatabase[index]],
    };
    this._http
      .post(this.componentRootUrl + "/controlunitlib", updateObj)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        if (!res?.msg) {
          this._snackBar.open("Module database updated!", "Success", {
            duration: 3000,
          });
          let queryParams = new HttpParams().set("category", this.controlUnitDatabase[index].category);
          this._http.get(this.componentRootUrl+"/controlunitlibCategory", { params: queryParams }).subscribe(res=>{
            if(res==null){
              this.updatedCategories = this.updatedCategories.filter(item=>item !== this.controlUnitDatabase[index].category)
              this.moduleCategoryArray = this.updatedCategories.filter(item=>item !== this.controlUnitDatabase[index].category)
            }
            this.controlUnitDatabase.splice(index, 1)
          })
        } else {
          this._snackBar.open("Module database not updated!", "Failure", {
            duration: 3000,
          });
        }
        // console.log(res) // this operation returns the deleted doc, not null.
      });
    let deletedModule = [
      {
        delete: true,
        _id: this.controlUnitDatabase[index]._id,
      },
    ];
    this._http
      .post(this.featureRootUrl + "/featureimpactlibbymodule", deletedModule)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // if (res[0].model) {
        //   this._snackBar.open("New module created!", "successful", {
        //     duration: 3000,
        //   })
        // } else {
        //   this._snackBar.open("Module database not updated!", "Failure", {
        //     duration: 3000,
        //   })
        // }
        // console.log(res)
      });

    // this.refreshModuleLib(); // refresh
    }
  })
  }

  ////////////////////////////////////////
  /////  support functions  /////////////
  //////////////////////////////////////
  availableAssetChangedHandler(isGLobal = 0) {
    this.availableAssetsModelChanged.next(isGLobal);
  }

  availableModuleChangedHandler(isGLobal = 0) {
    this.availableModulesModelChanged.next(isGLobal);
  }

  ////////////////////////////////////////
  /////  support functions  /////////////
  //////////////////////////////////////
  availableFeatureChangedHandler(isGLobal = 0) {
    this.availableFeaturesModelChanged.next(isGLobal);
  }

  /**
   * Used to fetch all available assets
   * @param isGLobal {number}
   * if global value is 1 that means we have to search from "name", "assetType" and "subType"
   * if global value is 0 that means we have to search from "name" only
   * @param searchTerm {string} Keyword used to search assets
   */
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

  /**
   * Used to fetch all available modules
   * @param isGLobal {number}
   * if global value is 1 that means we have to search from "name", "assetType" and "subType"
   * if global value is 0 that means we have to search from "name" only
   * @param searchTerm {string} Keyword used to search assets
   */
  private loadModuleLibReformed(isGLobal: any, moduleLimitArg?: number) {
    this.modulesloading = true;
    let moduleLimit = this.numberOfModuleLimit;
    if (moduleLimitArg != undefined) {
      moduleLimit = moduleLimitArg;
    }
    this._http
      .get(
        this.componentRootUrl +
        `/controlunitlib?searchTerm=${this.searchTerm}&global=${isGLobal}&limit=${moduleLimit}`
      )
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          this.modulesloading = false;
          this.controlUnitDatabase = res;
          if (moduleLimitArg != undefined) {
            this._snackBar.open(
              `All ${res.length} modules in your component library are shown.`,
              "",
              {
                duration: 5000,
              }
            );
          }
        },
        (err: any) => {
          this.modulesloading = false;
        }
      );
  }

  /**
   * Used to fetch all available features
   * @param isGLobal {number}
   * if global value is 1 that means we have to search from "name", and "featureType"
   * if global value is 0 that means we have to search from "name" only
   * @param featureLiitArg {number} To limit the feature
   */
  loadFeatureLibReformed(isGLobal: number, featureLiitArg?: number) {
    this.featuresLoading = true;
    let featureLimit = this.numberOfFeatureLimit;
    if (featureLiitArg != undefined) {
      featureLimit = featureLiitArg;
    }

    this._http
      .get(
        this.featureRootUrl +
        `/featureassetlib?searchTerm=${this.searchFeatures}&global=${isGLobal}&limit=${featureLimit}`
      )
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          this.featuresLoading = false;
          this.featureList = res;
          if (!res || res.length <= 0) {
            this._snackBar.open(
              `No feature is found in your feature library. Maybe network is busy.`,
              "",
              {
                duration: 5000,
              }
            );
          } else {
            if (featureLimit === 0) {
              this._snackBar.open(
                `All ${res.length} features in your asset library are shown.`,
                "",
                {
                  duration: 5000,
                }
              );
            }
          }
        },
        (err: any) => {
          this.featuresLoading = false;
        }
      );
  }

  dynamicallyAssignFeatureRole(inputFeatureType) {
    this.dynamicFeatureRole = this._editDesignShared.dynamicallyAssignFeatureRole(inputFeatureType);
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
            To fetch the data of each feature and get the feature's details
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
            //     //Start of a method for backward compatibility for featureImpactLib featureId with controlUnitLib featureId codes to remove after sometime
            //     const tempFeatureArray = [];
            //     const tempFeatureIdArray = [];
            //     const tempResArray = res;
            //     tempResArray.map(result => {
            //       tempFeatureIdArray.push(result.featureId);
            //       tempFeatureArray.push(result.feature)
            //     })
            //     if (tempFeatureIdArray.length > this.controlUnitDatabase[i].featureId.length
            //       || JSON.stringify(tempFeatureIdArray) !== JSON.stringify(this.controlUnitDatabase[i].featureId)) {
            //       this.controlUnitDatabase[i].featureId = tempFeatureIdArray;
            //       this.controlUnitDatabase[i].feature = tempFeatureArray;
            //       let updateObj = {
            //         delete: false,
            //         data: [this.controlUnitDatabase[i]],
            //       };
            //       this._http
            //         .post(this.componentRootUrl + "/controlunitlib", updateObj)
            //         .pipe(takeUntil(this.unsubscribe))
            //         .subscribe((res: any) => {
            //           if (res[0].model) {
            //             // console.log("I am success");
            //           } else {
            //             // console.log('Failure');
            //           }
            //         });
            //     }
            //     //End of a method for backward compatibility for featureImpactLib featureId with controlUnitLib featureId codes to remove after sometime
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
  }


  /**
   * This feature is to
   *  Sync Between Feature Impact Lib and Control UNit lib, remove extra values from Control Unit lib
   * This has to removed from the 1 month after deplyment
   */
  // Yuanbo comment: this following code are crashing nodejs server. so they are disabled.
  // syncModulesFeatures() {
  //   this._http
  //   .patch(this.componentRootUrl + "/controlunitlib", {})
  //   .subscribe((res: any) => {
  //     console.log({'Response For Sync': res});
  //   }, (err) => {
  //     console.error({'Error For Sync': err});
  //   });
  // }
  onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  assignImpactValueOrImpactLevel(myArray) {
    // not used
    for (let i = 0; i < myArray.length; i++) {
      if (!myArray[i].impactF) {
        myArray[i].impactF = ImpactLevelToValueConv[myArray[i].impactFLevel];
        myArray[i].impactS = ImpactLevelToValueConv[myArray[i].impactSLevel];
        myArray[i].impactO = ImpactLevelToValueConv[myArray[i].impactOLevel];
        myArray[i].impactP = ImpactLevelToValueConv[myArray[i].impactPLevel];
      }
    }
  }

  subTypeChanges($event: any, assetItem: any) {
    assetItem.subType = $event;
  }

  typeChanges(assetItem){ //If assetType is changed and the new assetType does not contain the subtype set subtype=''
    if(assetItem.assetType.localeCompare('dataInTransit')==0 && !this.assetSubTypesTransit.some(item => item.value == assetItem.subType)
    || assetItem.assetType.localeCompare('dataAtRest')==0 && !this.assetSubTypes.some(item => item.value == assetItem.subType)){
      assetItem.subType = '';
    }else{
      return;
    }
  }

  // If asset name is empty disable update button
  checkEmpty(i){
    let assetUnderEdit = this.assetList[i];

    //If asset name is empty or asset type is dataAtRest or dataAtTransit and subtype is not selected disable the update button
    if (assetUnderEdit.name.trim().length === 0 || (assetUnderEdit.assetType.localeCompare('dataAtRest')==0 || assetUnderEdit.assetType.localeCompare('dataInTransit')==0) && assetUnderEdit.subType=='') {
      return true
    }else{
      return false
    }
  }
  
  getModuleFeatures(module: any) {
    if (module) {
      const dialogRef = this.dialog.open(EditDeleteFeatureDialog, {
        maxWidth: "none",
        width: "95vw",
        data: {
          module,
          controlUnitGroups: this.controlUnitGroups,
          impactLevels: this.ImpactLevels,
          featureList: this.featureList,
        },

        disableClose: true,
      });
      dialogRef.afterClosed().subscribe((result) => {
        // console.log(`this is the ${result}`);
        if (result === "success") {
          this.refreshModuleLib();
        }
      });
    }
  }


  loadControls(){
    this.controlLoading = true;
    const params = new HttpParams().set("limit", "40").set("id",this.newDesign.project.id);
    this._http.get(this.projectRootUrl+"/controlLib",{params}).subscribe((res:any)=>{
      if(res){
        this.dataSourceControl.data = res;
        this.controlLoading = false;
      }
    })
  }

  showAllControls(){
    this.controlLoading = true;
    const params = new HttpParams().set("limit", "0").set("id",this.newDesign.project.id);
    this._http.get(this.projectRootUrl+"/controlLib",{params}).subscribe((res:any)=>{
      if(res){
        this.controlLoading = false;
        this.dataSourceControl.data = res;
      }})
  }


  addControl(row?){
    const dialogRef = this.dialog.open(AddGoalDialog, {
      width: "30vw",
      data: {
        type:'control',
        goalData:row
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      
      if(result&&row){
        row.content = result.content;
        this._http.patch(this.projectRootUrl+"/controlLib",{data:row}).subscribe(res=>{
          if(res){
            const rowIndex = this.dataSourceControl.data.findIndex(item => item.id==row.id);
            this.dataSourceControl.data[rowIndex].content = result.content;
          }
        })
      }else if(result){
        const control = this.cybersecurityGoalService.getEmptyGoal('control');
        control.content = result.content.replace(/\s{2,}/g, ' ').trim(); //Remove extra spaces or empty nbsp from content
        delete control.rowNumber;
        this._http.post(this.projectRootUrl+"/controlLib",{data:control, projectId:this.newDesign.project.id}).subscribe(res=>{
          if(res){
            this.dataSourceControl.data = [...this.dataSourceControl.data,res];
          }
        });
      }
    })
  }

  removeControl(row){
    this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this control "${row.content}" ?`
    this.confirmToDeleteGoalDialogOptions.title = `Delete Control ?`
    if(row.content.length >= 120){// Only display 120 characters of content
      this.confirmToDeleteGoalDialogOptions.message = `Are you sure you want to delete this control "${row.content.slice(0,120)}..." ?`
    }

    this._confirmDialogService.open(this.confirmToDeleteGoalDialogOptions);
    this._confirmDialogService.confirmed()
    .subscribe(confirmed=>{
      if(confirmed){
        const params = new HttpParams().set("_id", row._id).set("id",this.newDesign.project.id);
        this._http.delete(this.projectRootUrl+"/controlLib",{params}).subscribe(res=>{
          if(res){
            const rowIndex = this.dataSourceControl.data.findIndex(item => item.id==row.id);
            this.dataSourceControl.data.splice(rowIndex,1);
            this.dataSourceControl.data = [...this.dataSourceControl.data]
          }
        })
      }
    })
  }


  filter(val){
      let searchWord = val
      // call the service which makes the http-request
      return this.searchControl()
      .pipe(
        map((response:any) => response.filter(control => { 
          return control.content.toLowerCase().includes(searchWord.toLowerCase());
        }))
      ) 
  }


  searchControl() {
    this.controlSearchLoading = true;
    let search = this.searchValueControl.value
    let queryParams = new HttpParams().set("search", search);
    if(search !== null){
      if(!search.trim().length || search==""){
        this.loadControls();
        return of([]);
      }
      return this._http.get<any>(this.projectRootUrl + '/controlLib', { params: queryParams }).pipe(tap(data => {
        if (!data[0].id) {
          this._snackBar.open(data[0].content, "", {
            duration: 3000,
          });
        }else{
            return this.dataSourceControl.data = data;
        }
      }))
    }else{
      return of([]);
    }
    
  }

  //Adds the tag to the Tags array
  add(event: MatChipInputEvent,assetItem): void {
    const value = (event.value || '').trim();
    if(value){//If value not empty
      assetItem.tag.push(value);
    }else{
      this._snackBar.open("Cannot add an empty value.", "", {
        duration: 3000,
      });
    }
    // Clear the input value
    event.input.value = ''
  }

  removeTag(tag,assetItem){//Remove tag from tag array
    const index = this.assetList.findIndex(item=>item._id==assetItem._id);
    const tagIndex = this.assetList[index].tag.indexOf(tag);
    this.assetList[index].tag.splice(tagIndex,1);
  }

  /*Due to fixed height you need to scroll to the bottom of the
    Input to enter a new tag this focuses the input on click to circumvent that
  */
  focusInput(i){
    const array = this.chipInput.toArray();
    array[i].nativeElement.focus();
  }
  // assetNameChange(event: any, index: number) {//event on name change
  //   if (event.trim().length === 0) {
  //     this.indexNumber = index;
  //   } else {
  //     this.indexNumber = 0;
  //   }
  // }
}
