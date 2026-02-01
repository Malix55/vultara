import { ConfirmDialogService } from './../services/confirm-dialog.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentVisualChangeService } from './../services/component-visual-change.service';
import { ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentBoundary, ComponentList, ControlUnitProperty, CommLineProperty, ProjectType, SbomInterface, ThreatItem } from './../../threatmodel/ItemDefinition';
import { DesignSettingsService } from './../services/design-settings.service';
import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, ViewChild, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ArrOpService } from '../services/arr-op.service';
import { MicroProperty, ControlUnitLib, ValueAndViewValue } from '../../threatmodel/ItemDefinition';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpClient, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { takeUntil, take, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatTabGroup } from '@angular/material/tabs';
import { CreateBOMComponent } from '../dialogues/create-bom/create-bom.component';
import { ResultSharingService } from '../services/result-sharing.service';
import { FormControl } from '@angular/forms';
import { AssetPropertiesComponent } from '../dialogues/asset-properties/asset-properties.component';
import { NgxSpinnerService } from 'ngx-spinner';

// data structures for angular material list
interface MicroGroup {
  disabled?: boolean;
  manufacturer: string;
  cpe23: any;
  model: string[];
  modelId?: string[]
}
export interface ControlUnitGroup {
  disabled?: boolean;
  category: string;
  model: string[];
  modelId?: string[];
}
// data structure for angular material chip list
interface Feature {
  name?: string;
  id?: string;
  assets?: string[];
  assetsId?: string[];
  assetPropertyStride?: any[];
  note?: boolean;
  featureChainName?: string;
  featureChainId?: string;
  featureConfirmed?: boolean, // used by commLine property panel to check whether feature checkbox should be enabled
}
// data structure to display connected features in commLine sidePanel
interface lineConnectedComponentFeaturesType {
  id?: string,
  nickName?: string,
  features?: string[],
  featuresId?: string[],
  featureChainName?: string[];
  featureChainId?: string[];
  note?: boolean[],
  featureData?: Feature[]
}

interface Protocol {
  category: string,
  name: string
}

export enum ActiveComponentTypeShortName {
  Micro = 'micro',
  ControlUnit = 'controlUnit',
  CommLine = "commLine",
  SensorInput = "sensorInput",
  Boundary = 'boundary'
}


@Component({
  selector: 'app-property-panel',
  templateUrl: './property-panel.component.html',
  styleUrls: ['./property-panel.component.css']
})
export class PropertyPanelComponent implements OnInit, OnChanges {
  @Input() activeComponentId: string; // used to store the active component's id
  @Input() threatList: ThreatItem[] = [];
  @Input() systemConfig: any;

  @Output() threatAttackPath: EventEmitter<any> = new EventEmitter<any>();
  @Output() terminalIds = new EventEmitter()
  debounceSearch = new FormControl();

  confirmToDeleteComponentDialogOptions = {
    title: "CONFIRM TO DELETE",
    message: "Are you sure you want to delete this component?",
    cancelText: "Cancel",
    confirmText: "Confirm",
  };

  constructor(private _arrOp: ArrOpService, private _editDesignShared: DesignSettingsService, private _compVisual: ComponentVisualChangeService, public _confirmDialogService: ConfirmDialogService,
    private _router: Router, private _http: HttpClient, private _snackBar: MatSnackBar, public dialog: MatDialog, private changeDetector: ChangeDetectorRef, private _spinner: NgxSpinnerService) {

  }

  public project: ProjectType = { id: "" };
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  public ActiveComponentTypeShortName = ActiveComponentTypeShortName;

  visible = true;
  selectable = true;
  removable = true;
  removableAsset = true;
  removableSBOM = true;
  addOnBlur = true;
  readOnlyFlag = true;
  boms: string[] = ['AutoSAR Stack ACME 1.10.6b', 'HSM Firmware ACME 2.2.3'];
  sbom: SbomInterface[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  public sidePanelOpened = true;
  readonly sharedComponentRootUrl = environment.backendApiUrl + "sharedcomponents";
  readonly componentRootUrl = environment.backendApiUrl + "components";
  readonly featureRootUrl = environment.backendApiUrl + "features";
  readonly assetRootUrl = environment.backendApiUrl + "assets";
  microDatabase: MicroProperty[] = [];
  microGroups: MicroGroup[] = [];
  microGroupsList: MicroGroup[] = [];

  controlUnitDatabase: ControlUnitLib[] = [];
  controlUnitGroups: ControlUnitGroup[] = [];
  commLineDatabase: CommLineProperty[] = [];
  sensorInputDatabase: CommLineProperty[] = [];
  commLineModels: string[] = [];
  sensorInputModels: string[] = [];
  featuresLib: Feature[] = [];
  private unsubscribe: Subject<void> = new Subject();
  activeComponentType: string = "";
  microPhysicalAccess = false;
  controlUnitAttackSurface = false;
  commLineAttackSurface = false;
  selectedMicro = "";
  selectedModule = "";
  selectedControlUnit = "";
  selectedCommLine = "";
  microAssets: string[] = []; // assets to display in chips list
  microAssetsType: string[] = [];
  microAssetsSubType: string[] = [];
  microAssetsId: string[] = [];
  controlUnitAssets: string[] = [];
  controlUnitAssetsId: string[] = [];
  controlUnitAssetsType: string[] = [];
  controlUnitAssetsSubType: string[] = [];
  microFeatures = [];
  microFeaturesId = [];
  microFeatureChainId = [];
  microFeatureChainName = [];
  microFeaturesRole = [];
  microFeaturesRoleIndex = [];
  microFeaturesType = [];
  microFeatureSelected: boolean[];
  microFeatureEditDisable = true;
  selectedHsmFeatures: string[];
  selectedControlUnitFeatures: string[] = [];
  selectedControlUnitFeaturesId: string[] = [];
  selectedControlUnitFeatureChainId: string[] = [];
  selectedControlUnitFeatureChainName: string[] = [];
  selectedControlUnitFeaturesRole: string[] = [];
  selectedControlUnitFeaturesRoleIndex: number[] = [];
  selectedControlUnitFeaturesType: string[] = [];
  controlUnitFeatureSelected: boolean[];
  controlUnitFeatureEditDisable = true;
  commLineSecureProtocols: string[] = [];
  commLineAppProtocols: string[] = [];
  commLineFeatures: string[] = [];
  commLineFeaturesId: string[] = [];
  commLineAssets: string[] = [];
  commLineAssetsId: string[] = [];
  commLineAssetsType: string[] = [];
  commLineAssetsSubType: string[] = [];
  componentNickName = "";
  lineConnectedComponents: string[] = [];
  lineConnectedComponentFeatures: lineConnectedComponentFeaturesType[] = [];
  terminalComponentAssetAccessBoolean: any[] = [];
  terminalComponentAssetAccessType: any[] = [];
  assetFeatureIndex = [];
  boundaryEnable = false;
  // microFeatureUpdateStatus = "";
  // moduleFeatureUpdateStatus = "";
  confirmFeatureBtnTxt = "Confirm Features";
  confirmFeatureBtnDisable = false;
  // lineConnectedComponentFeature = "";
  transmissionMediaName: ValueAndViewValue[] = [ // for display
    { value: "physicalWire", viewValue: "Physical Wire" },
    { value: "shortWireless", viewValue: "Short-Range Wireless" },
    { value: "longWireless", viewValue: "Long-Range Wireless" },
  ];
  sensorInputTransmissionMediaName: ValueAndViewValue[] = [ // for display in sensor input panel
    { value: "physicalWire", viewValue: "Physical Contact" },
    { value: "shortWireless", viewValue: "Short-Range Contactless" },
  ];
  transmissionMedia = "";
  dynamicFeatureRole: ValueAndViewValue[];

  featureDirection: any = {};
  featureAssets: any[] = [];
  applicationProtocols: Protocol[] = [];
  securityProtocols: Protocol[] = [];
  existingApplicationProtocol: string = "";
  existingSecurityProtocol: string = "";
  textProtocolDisplay: boolean = false;

  public microAssetInput: string = "";
  public microAssetPreviousInput: string = "";
  public controlUnitAssetInput: string = "";
  public controlUnitAssetPreviousInput: string = "";
  public searchedAssets: any[] = [];
  public searchedAssetsLoading: boolean = false;

  public microAssetChanged: Subject<string> = new Subject<string>();
  public controlUnitAssetChanged: Subject<string> = new Subject<string>();

  @ViewChild("applicationProtocolsInput") applicationProtocolsInput: ElementRef;
  @ViewChild("securityProtocolsInput") securityProtocolsInput: ElementRef;
  @ViewChild("applicationProtocolsInput", { read: MatAutocompleteTrigger }) appProtocolAutoComplete: MatAutocompleteTrigger;
  @ViewChild("securityProtocolsInput", { read: MatAutocompleteTrigger }) secureProtocolAutoComplete: MatAutocompleteTrigger;
  @ViewChild("propertyPanelTab") propertyPanelTabGroup: MatTabGroup;

  // Control Unit asset search event 
  public controlUnitAssetText($event: string) {
    this.searchedAssetsLoading = $event ? true : false;
    this.controlUnitAssetChanged.next($event);
  }

  // Micro asset search events
  public microAssetText($event: string) {
    this.searchedAssetsLoading = $event ? true : false;
    this.microAssetChanged.next($event);
  }

  // Subscribe for new text from Micro or Control Unit and call API triggering method
  private moduleAssetInputChangeEvent() {
    this.microAssetChanged.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((res: any) => {
      if (res) {
        this.microAssetPreviousInput = res;
        this.searchForAvailableAssets(res);
      }
    });

    this.controlUnitAssetChanged.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((res: any) => {
      if (res) {
        this.controlUnitAssetPreviousInput = res;
        this.searchForAvailableAssets(res);
      }
    });
  }

  // Perform asset search API call for both Control Unit or Micro
  private searchForAvailableAssets(searchTerm: string) {
    this._http
      .get(this.assetRootUrl +
        `/assetlib?searchTerm=${searchTerm}&global=0&limit=10`)
      .pipe(take(1))
      .subscribe(
        (res: any) => {
          if (res) {
            this.searchedAssets = res;
            this.searchedAssetsLoading = false;
          }
        });
  }

  // Open pop-up with asset and feature information for selected Micro asset chip 
  public microAssetChipSelection(microAsset: string, microAssetId: string, editable: boolean) {
    const micro = this.newDesign.micro.find(obj => obj.id === this.activeComponentId);
    this.assetPropertyDetails(microAsset, microAssetId, micro, "micro", editable);
  }

  // Open pop-up with asset and feature information for selected Control Unit asset chip 
  public controlUnitAssetChipSelection(controlUnitAsset: string, controlUnitAssetId: string, editable: boolean) {
    const controlUnit = this.newDesign.controlUnit.find(obj => obj.id === this.activeComponentId);
    this.assetPropertyDetails(controlUnitAsset, controlUnitAssetId, controlUnit, "controlUnit", editable);
  }

  // Show pop-up for selected chip in property panel.
  private assetPropertyDetails(asset: string, assetId: string, module: any, moduleType: string, editable: boolean) {
    const dialogRef = this.dialog.open(AssetPropertiesComponent, {
      width: "500px",
      data: {
        asset,
        assetId,
        module,
        editable
      }
    });

    dialogRef.afterClosed().subscribe((_: any) => {
      if (_) {
        this.searchedAssets = [];

        const asset: string[] = module.asset;
        const assetId: string[] = module.assetId;
        const assetType: string[] = module.assetType;
        const assetSubType: string[] = module.assetSubType;
        const assetFeatureIndex: number[] = module.assetFeatureIndex;

        if (_.assetFeatureLastIndex > -1) {
          asset.splice(_.assetFeatureLastIndex + 1, 0, _.asset.name);
          assetId.splice(_.assetFeatureLastIndex + 1, 0, _.asset._id);
          assetType.splice(_.assetFeatureLastIndex + 1, 0, _.asset.assetType);
          assetSubType.splice(_.assetFeatureLastIndex + 1, 0, _.asset.subType);
          assetFeatureIndex.splice(_.assetFeatureLastIndex + 1, 0, _.assetFeatureIndex);
        } else {
          asset.push(_.asset.name);
          assetId.push(_.asset._id);
          assetType.push(_.asset.assetType);
          assetSubType.push(_.asset.subType);
          assetFeatureIndex.push(_.assetFeatureIndex);
        }

        switch (moduleType) {
          case "micro":
            this._editDesignShared.updateMicroProperty(this.activeComponentId, asset, "asset");
            this._editDesignShared.updateMicroProperty(this.activeComponentId, assetId, "assetId");
            this._editDesignShared.updateMicroProperty(this.activeComponentId, assetType, "assetType");
            this._editDesignShared.updateMicroProperty(this.activeComponentId, assetSubType, "assetSubType");
            this._editDesignShared.updateMicroProperty(this.activeComponentId, assetFeatureIndex, "assetFeatureIndex");
            break;
          case "controlUnit":
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, asset, "asset");
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, assetId, "assetId");
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, assetType, "assetType");
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, assetSubType, "assetSubType");
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, assetFeatureIndex, "assetFeatureIndex");
            break;

          default:
            break;
        }
      } else {
        switch (moduleType) {
          case "micro":
            this.microAssetInput = this.microAssetPreviousInput;
            break;
          case "controlUnit":
            this.controlUnitAssetInput = this.controlUnitAssetPreviousInput;
            break;

          default:
            break;
        }
      }
    });
  }

  //If secondary checkboxes are ticked Check the main checkbox
  isChecked(componentId, featureId, featureIndex) {
    const componentIndex = this.lineConnectedComponentFeatures.findIndex(item => item.id == componentId)
    const assets = this.featureAssets.filter(obj => obj.componentId === componentId && obj.featureId === featureId);
    const isAssetsChecked: boolean = assets !== null && assets.filter(t => t.checked === true).length > 0;
    this.lineConnectedComponentFeatures[componentIndex].featureData[featureIndex].note = isAssetsChecked;
  }

  public changeFeatureAssetSelection($event, componentId, featureId, componentIndex, featureIndex, assetIndex) {
    let index = assetIndex;
    if (featureIndex > 0) {
      const previousIndexes: number = this.countPreviousFeaturesAssets(featureIndex, componentIndex, componentId);
      index = index + previousIndexes;
    }
    const assets = this.featureAssets.filter(obj => obj.componentId === componentId && obj.featureId === featureId);
    const isAssetsChecked: boolean = assets !== null && assets.filter(t => t.checked === true).length > 0;
    this.lineConnectedComponentFeatures[componentIndex].featureData[featureIndex].note = isAssetsChecked;
    this.terminalComponentAssetAccessBoolean[componentIndex][index] = $event;
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
    const feature = this.lineConnectedComponentFeatures[componentIndex].featureData[featureIndex].name;
    this._editDesignShared.updateLineFeatureCheckboxStatus(this.activeComponentId, componentId, feature, featureId, isAssetsChecked, featureIndex);
  }

  private countPreviousFeaturesAssets(featureIndex: number, componentIndex: number, componentId: number) {
    let index = 0;
    for (let i = 0; i < featureIndex; i++) {
      const existingFeatureId = this.lineConnectedComponentFeatures[componentIndex].featureData[i].id;
      const assets = this.featureAssets.filter((asset) => asset.componentId === componentId && asset.featureId === existingFeatureId);
      index = index + assets.length;
    }
    return index;
  }

  // Check whether asset access type needs to load initially.
  private checkAssetAccessTypeInitializationRequired() {
    let initializeAssetAccessType: boolean = false;
    if (!this.terminalComponentAssetAccessType || this.terminalComponentAssetAccessType.length <= 0) {
      this.terminalComponentAssetAccessType = [];
      initializeAssetAccessType = true;
    }
    return initializeAssetAccessType;
  }

  // Load features assets information when property panel is opened for a commLine.
  private getFeaturesAssets() {
    this.featureAssets = [];
    let initializeAssetAccessType: boolean = this.checkAssetAccessTypeInitializationRequired();
    const components: any[] = [...this.newDesign.micro, ...this.newDesign.controlUnit];
    const activeCommLine: any = this.newDesign.commLine.find((commLine: any) => commLine.id === this.activeComponentId);
    this.lineConnectedComponentFeatures.forEach((lineConnectedComponentFeature, componentIndex) => {
      if (!initializeAssetAccessType) { // Check whether the commLine is connected with the module. If not then initialize with default value.
        initializeAssetAccessType = !activeCommLine.terminalComponentId.includes(lineConnectedComponentFeature.id);
      }
      const lineConnectedFeature = lineConnectedComponentFeature.featureData;
      const selectedComponent: any = components.find((obj: any) => obj.id === lineConnectedComponentFeature.id);
      if (!this.terminalComponentAssetAccessType[componentIndex]) { // If module asset access type is not initiated then initialize with empty value.
        this.terminalComponentAssetAccessType[componentIndex] = new Array(selectedComponent?.assetFeatureIndex?.length).fill("");
        initializeAssetAccessType = true;
      }
      let assetIndex = 0;
      lineConnectedFeature.forEach((feature: any, featureIndex: number) => {
        if (!initializeAssetAccessType) { // Check whether feature is newly added. If newly added then initialize with default value.
          const checkFeatureIdExist: boolean = selectedComponent.featureId.includes(feature.id);
          initializeAssetAccessType = !checkFeatureIdExist;
        }
        assetIndex = this.getFeatureAssets(lineConnectedComponentFeature, selectedComponent, feature, componentIndex, assetIndex, initializeAssetAccessType);
      });
    });
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.terminalComponentAssetAccessType, "terminalComponentAssetAccessType");
  }

  // Get feature assets information and store in global variable.
  private getFeatureAssets(component: any, selectedComponent: any, feature: any, componentIndex: number, assetIndex: number, initializeAssetAccessType: boolean) {
    if (component && feature && this.newDesign) {
      const componentFeatureIndex: number = selectedComponent?.featureId.findIndex(id => id === feature.id);
      let counter: number = 0;
      selectedComponent?.assetFeatureIndex.forEach((featureIndex, i) => {
        if (componentFeatureIndex === featureIndex) {
          const obj = {
            componentId: component.id,
            featureId: feature.id,
            assetId: selectedComponent.assetId[i],
            asset: selectedComponent.asset[i],
            assetType: selectedComponent.assetType[i],
            checked: this.terminalComponentAssetAccessBoolean[componentIndex][assetIndex + counter],
            accessType: this.getAssetAccessType(selectedComponent.assetType[i], componentIndex, assetIndex + counter, initializeAssetAccessType),
            position: this.featureAssets.length
          }
          this.featureAssets.push(obj);
          this.isChecked(component.id, feature.id, featureIndex)
          counter = counter + 1;
        }
      });
      return assetIndex + counter;
    }
    return assetIndex;
  }

  // Get asset access type for "dataAtRest" and "dataInTransit", otherwise keep them empty. Also, add default value if the asset is newly added.
  private getAssetAccessType(assetType: string, componentIndex: number, assetIndex: number, initializeAssetAccessType: boolean) {
    if (
      this.terminalComponentAssetAccessType[componentIndex] &&
      (typeof this.terminalComponentAssetAccessType[componentIndex][assetIndex] === "undefined" ||
        this.terminalComponentAssetAccessType[componentIndex][assetIndex] === null)
    ) {
      console.log({ initializeAssetAccessType });
      initializeAssetAccessType = true;
    }
    let accessType: string[] = [];
    switch (assetType) {
      case "dataAtRest":
        if (!initializeAssetAccessType) {
          accessType = this.terminalComponentAssetAccessType[componentIndex] ? this.terminalComponentAssetAccessType[componentIndex][assetIndex].split('') : [''];
        } else {
          this.terminalComponentAssetAccessType[componentIndex][assetIndex] = "CRUD";
          accessType = ['C', 'R', 'U', 'D'];
        }
        break;
      case "dataInTransit":
        if (!initializeAssetAccessType) {
          if (this.terminalComponentAssetAccessType[componentIndex][assetIndex]) {
            if (this.terminalComponentAssetAccessType[componentIndex][assetIndex].includes('S')) {
              accessType.push("S");
            }
            if (this.terminalComponentAssetAccessType[componentIndex][assetIndex].includes('Rec')) {
              accessType.push("Rec");
            }
          }
        } else {
          this.terminalComponentAssetAccessType[componentIndex][assetIndex] = "S";
          accessType = ['S'];
        }
        break;
      default:
        this.terminalComponentAssetAccessType[componentIndex][assetIndex] = "";
        break;
    }
    return accessType;
  }

  // Event for updating asset acces type when users select and deselect button toggle in the property panel.
  assetAccessTypeChangeEvent($event: string[], componentId: number, position: number, componentIndex: number, featureIndex: number, assetIndex: number) {
    let index = assetIndex;
    if (featureIndex > 0) {
      const previousIndexes: number = this.countPreviousFeaturesAssets(featureIndex, componentIndex, componentId);
      index = index + previousIndexes;
    }
    this.featureAssets[position].accessType = $event;
    this.terminalComponentAssetAccessType[componentIndex][index] = $event.join("");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.terminalComponentAssetAccessType, "terminalComponentAssetAccessType");
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        switch (propName) {
          case 'activeComponentId':

            //this was manually closing the autoCompletePanels and causing an error
            //Removing this fixed the issue and the panels close automatically no need for closePanel()

            // if (this.appProtocolAutoComplete) {
            //   this.appProtocolAutoComplete.closePanel();
            // }
            // if (this.secureProtocolAutoComplete) {
            //   this.secureProtocolAutoComplete.closePanel();
            // }
            this.searchedAssets = [];
            this.microAssetPreviousInput = "";
            this.microAssetInput = "";
            this.controlUnitAssetPreviousInput = "";
            this.controlUnitAssetInput = "";
            this.activeComponentType = this._editDesignShared.getComponentType(this.activeComponentId);
            // console.log("ngOnChange executed. this.activeComponentType is " + this.activeComponentType);
            // console.log(changes);
            this._compVisual.componentDropShadowById(changes.activeComponentId.currentValue);
            if (document.getElementById(changes.activeComponentId.previousValue)) { // remove shadow if the previous component was not deleted
              this._compVisual.removeComponentDropShadowById(changes.activeComponentId.previousValue);
            };
            // if (changes.activeComponentId.currentValue && document.getElementById(changes.activeComponentId.previousValue)?.style) {
            //   document.getElementById(this._editDesignShared.getComponentType(changes.activeComponentId.previousValue) + "PropertyPanel").style.display = "none";
            //   document.getElementById("sensorInputPropertyPanel").style.display = "none";
            // };
            // if (this.propertyPanelTabGroup) {
            //   this.propertyPanelTabGroup.selectedIndex = 0; // default to tab 0
            // }
            if (this.activeComponentType == "micro") {
              const modelWithManufacturer = this._editDesignShared.getMicroProperty(this.activeComponentId, "manufacturerName") + ' ' + this._editDesignShared.getMicroProperty(this.activeComponentId, "model")
              if (modelWithManufacturer !== "undefined ") {
                this.selectedMicro = modelWithManufacturer
              } else this.selectedMicro = "";
              this.selectedModule = this._editDesignShared.getMicroProperty(this.activeComponentId, "module");
              this.selectedHsmFeatures = this._editDesignShared.getMicroProperty(this.activeComponentId, "property");
              this.microFeatures = this._editDesignShared.getMicroProperty(this.activeComponentId, "feature");
              this.microFeaturesId = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureId");
              this.microFeaturesRole = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureRole");
              this.microFeaturesType = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureType");
              this.microFeaturesRoleIndex = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureRoleIndex");
              this.microFeatureChainId = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureChainId");
              this.microFeatureChainName = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureChainName");
              this.microFeatureSelected = new Array(this.microFeatures.length).fill(false);
              this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
              this.microFeatureEditDisable = !this.microFeatureSelected.includes(true);
              this.microPhysicalAccess = this._editDesignShared.getMicroProperty(this.activeComponentId, "attackSurface");
              this.microAssets = this._editDesignShared.getMicroProperty(this.activeComponentId, "asset");
              this.microAssetsId = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetId");
              this.microAssetsType = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetType");
              this.microAssetsSubType = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetSubType");
              this.componentNickName = this._editDesignShared.getMicroProperty(this.activeComponentId, "nickName");
              this.removable = !this._editDesignShared.getMicroProperty(this.activeComponentId, "featureConfirmed");
              this.assetFeatureIndex = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetFeatureIndex");
              if (this._editDesignShared.getMicroProperty(this.activeComponentId, "sbom")) {
                this.sbom = this._editDesignShared.getMicroProperty(this.activeComponentId, "sbom");
              } else {
                this.sbom = [];
              }
              // this.microFeatureUpdateStatus = "";
              // document.getElementById("microPropertyPanel").style.display = "block";
            } else if (this.activeComponentType == "controlUnit") {
              this.selectedControlUnit = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "model");
              this.selectedControlUnitFeatures = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "feature");
              this.selectedControlUnitFeaturesId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureId");
              this.selectedControlUnitFeatures = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "feature");
              this.selectedControlUnitFeaturesId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureId");
              this.selectedControlUnitFeaturesRole = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureRole");
              this.selectedControlUnitFeaturesType = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureType");
              this.selectedControlUnitFeaturesRoleIndex = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureRoleIndex");
              this.selectedControlUnitFeatureChainId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureChainId");
              this.selectedControlUnitFeatureChainName = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureChainName");
              this.controlUnitFeatureSelected = new Array(this.selectedControlUnitFeatures.length).fill(false);
              this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
              this.controlUnitFeatureEditDisable = !this.controlUnitFeatureSelected.includes(true);
              this.controlUnitAttackSurface = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "attackSurface");
              this.controlUnitAssets = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "asset");
              this.controlUnitAssetsId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetId");
              this.controlUnitAssetsType = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetType");
              this.controlUnitAssetsSubType = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetSubType");
              this.componentNickName = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "nickName");
              this.removable = !this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureConfirmed");
              this.assetFeatureIndex = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetFeatureIndex");
              if (this._editDesignShared.getControlUnitProperty(this.activeComponentId, "sbom")) {
                this.sbom = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "sbom");
              } else {
                this.sbom = [];
              }
              // this.moduleFeatureUpdateStatus = "";
              // document.getElementById("controlUnitPropertyPanel").style.display = "block";
            } else if (this.activeComponentType == "commLine" && this._editDesignShared.getCommLineProperty(this.activeComponentId, "sensorInput")) {
              this.transmissionMedia = this._editDesignShared.getCommLineProperty(this.activeComponentId, "transmissionMedia");
              this.refreshSensorInputBaseProtocol(this.transmissionMedia);
              this.selectedCommLine = this._editDesignShared.getCommLineProperty(this.activeComponentId, "model");
              this.commLineAttackSurface = this._editDesignShared.getCommLineProperty(this.activeComponentId, "attackSurface");
              this.componentNickName = this._editDesignShared.getCommLineProperty(this.activeComponentId, "nickName");
              this.lineConnectedComponents = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentId");
              this.terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentAssetAccessBoolean");
              this.terminalComponentAssetAccessType = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentAssetAccessType");
              this.assetFeatureIndex = this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetFeatureIndex");
              const textProtocolDisplay = this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay");
              this.textProtocolDisplay = textProtocolDisplay === undefined ? false : textProtocolDisplay;
              this.textProtocolDisplay = this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay") ? this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay") : false;
              this.removable = true;
              if (this.lineConnectedComponents.length > 0) { // display carried features
                this.lineConnectedComponentFeatures = [];
                for (let i = 0; i < this.lineConnectedComponents.length; i++) {
                  let componentId = this.lineConnectedComponents[i];
                  let type = this._editDesignShared.getComponentType(componentId);
                  this.lineConnectedComponentFeatures[i] = {};
                  this.lineConnectedComponentFeatures[i].id = componentId;
                  if (type == "micro") {
                    this.lineConnectedComponentFeatures[i].nickName = this._editDesignShared.getMicroProperty(componentId, "nickName");
                    this.lineConnectedComponentFeatures[i].features = this._editDesignShared.getMicroProperty(componentId, "feature");
                    this.lineConnectedComponentFeatures[i].featuresId = this._editDesignShared.getMicroProperty(componentId, "featureId");
                    this.lineConnectedComponentFeatures[i].featureChainName = this._editDesignShared.getMicroProperty(componentId, "featureChainName");
                    this.lineConnectedComponentFeatures[i].featureChainId = this._editDesignShared.getMicroProperty(componentId, "featureChainId");
                    let featureConfirmStatus = this._editDesignShared.getMicroProperty(componentId, "featureConfirmed");
                    // console.log(`featureConfirmStatus of micro is ${featureConfirmStatus}`)
                    this.lineConnectedComponentFeatures[i].featureData = [];
                    this.lineConnectedComponentFeatures[i].features.forEach((fea, ind) => {
                      this.lineConnectedComponentFeatures[i].featureData[ind] = {};
                      if (this.lineConnectedComponentFeatures[i].featureChainId[ind] == "") { // if this feature doesn't have a featureChainId, just display the feature name
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea;
                      } else { // if this feature has a featureChainId, add the featureChainName to the feature name display
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea + " - " + this.lineConnectedComponentFeatures[i].featureChainName[ind];
                      }
                      this.lineConnectedComponentFeatures[i].featureData[ind].id = this.lineConnectedComponentFeatures[i].featuresId[ind];
                      this.lineConnectedComponentFeatures[i].featureData[ind].note = this._editDesignShared.getLineFeatureCheckboxStatus(this.activeComponentId,
                        componentId, this.lineConnectedComponentFeatures[i].featuresId[ind], ind); // ind is the featureIndex of this feature in that component
                      this.lineConnectedComponentFeatures[i].featureData[ind].featureConfirmed = featureConfirmStatus;
                    })
                  } else if (type == "controlUnit") {
                    this.lineConnectedComponentFeatures[i].nickName = this._editDesignShared.getControlUnitProperty(componentId, "nickName");
                    this.lineConnectedComponentFeatures[i].features = this._editDesignShared.getControlUnitProperty(componentId, "feature");
                    this.lineConnectedComponentFeatures[i].featuresId = this._editDesignShared.getControlUnitProperty(componentId, "featureId");
                    this.lineConnectedComponentFeatures[i].featureChainName = this._editDesignShared.getControlUnitProperty(componentId, "featureChainName");
                    this.lineConnectedComponentFeatures[i].featureChainId = this._editDesignShared.getControlUnitProperty(componentId, "featureChainId");
                    let featureConfirmStatus = this._editDesignShared.getControlUnitProperty(componentId, "featureConfirmed");
                    // console.log(`featureConfirmStatus of controlUnit is ${featureConfirmStatus}`)
                    this.lineConnectedComponentFeatures[i].featureData = [];
                    this.lineConnectedComponentFeatures[i].features.forEach((fea, ind) => {
                      this.lineConnectedComponentFeatures[i].featureData[ind] = {};
                      if (this.lineConnectedComponentFeatures[i].featureChainId[ind] == "") { // if this feature doesn't have a featureChainId, just display the feature name
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea;
                      } else { // if this feature has a featureChainId, add the featureChainName to the feature name display
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea + " - " + this.lineConnectedComponentFeatures[i].featureChainName[ind];
                      }
                      this.lineConnectedComponentFeatures[i].featureData[ind].id = this.lineConnectedComponentFeatures[i].featuresId[ind];
                      this.lineConnectedComponentFeatures[i].featureData[ind].note = this._editDesignShared.getLineFeatureCheckboxStatus(this.activeComponentId,
                        componentId, this.lineConnectedComponentFeatures[i].featuresId[ind], ind); // ind is the featureIndex of this feature in that component
                      this.lineConnectedComponentFeatures[i].featureData[ind].featureConfirmed = featureConfirmStatus;
                    })
                  } else {
                    this.lineConnectedComponentFeatures[i].nickName = "none";
                    this.lineConnectedComponentFeatures[i].features = [];
                    this.lineConnectedComponentFeatures[i].featuresId = [];
                    this.lineConnectedComponentFeatures[i].featureChainName = [];
                    this.lineConnectedComponentFeatures[i].featureChainId = [];
                    this.lineConnectedComponentFeatures[i].featureData = [];
                  }
                }
              } else {
                this.lineConnectedComponentFeatures = [];
              }
              // document.getElementById("sensorInputPropertyPanel").style.display = "block";
              this.getFeaturesAssets();
            } else if (this.activeComponentType == "commLine") { // not sensor input
              this.loadProtocols();
              this.transmissionMedia = this._editDesignShared.getCommLineProperty(this.activeComponentId, "transmissionMedia");
              this.refreshBaseProtocol(this.transmissionMedia);
              this.selectedCommLine = this._editDesignShared.getCommLineProperty(this.activeComponentId, "model");
              this.commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");
              this.commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");
              this.commLineAttackSurface = this._editDesignShared.getCommLineProperty(this.activeComponentId, "attackSurface");
              this.componentNickName = this._editDesignShared.getCommLineProperty(this.activeComponentId, "nickName");
              this.lineConnectedComponents = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentId");
              this.terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentAssetAccessBoolean");
              this.terminalComponentAssetAccessType = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentAssetAccessType");
              this.assetFeatureIndex = this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetFeatureIndex");
              this.commLineAssetsType = this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetType") ? this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetType") : [];
              this.commLineAssetsSubType = this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetSubType") ? this._editDesignShared.getCommLineProperty(this.activeComponentId, "assetSubType") : [];
              const textProtocolDisplay = this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay");
              this.textProtocolDisplay = textProtocolDisplay === undefined ? false : textProtocolDisplay;
              this.textProtocolDisplay = this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay") ? this._editDesignShared.getCommLineProperty(this.activeComponentId, "textProtocolDisplay") : false;
              this.removable = true;
              if (this.lineConnectedComponents.length > 0) { // display carried features
                this.lineConnectedComponentFeatures = [];
                for (let i = 0; i < this.lineConnectedComponents.length; i++) {
                  let componentId = this.lineConnectedComponents[i];
                  let type = this._editDesignShared.getComponentType(componentId);
                  this.lineConnectedComponentFeatures[i] = {};
                  this.lineConnectedComponentFeatures[i].id = componentId;
                  if (type == "micro") {
                    this.lineConnectedComponentFeatures[i].nickName = this._editDesignShared.getMicroProperty(componentId, "nickName");
                    this.lineConnectedComponentFeatures[i].features = this._editDesignShared.getMicroProperty(componentId, "feature");
                    this.lineConnectedComponentFeatures[i].featuresId = this._editDesignShared.getMicroProperty(componentId, "featureId");
                    this.lineConnectedComponentFeatures[i].featureChainName = this._editDesignShared.getMicroProperty(componentId, "featureChainName");
                    this.lineConnectedComponentFeatures[i].featureChainId = this._editDesignShared.getMicroProperty(componentId, "featureChainId");
                    let featureConfirmStatus = this._editDesignShared.getMicroProperty(componentId, "featureConfirmed");
                    // console.log(`featureConfirmStatus of micro is ${featureConfirmStatus}`)
                    this.lineConnectedComponentFeatures[i].featureData = [];
                    this.lineConnectedComponentFeatures[i].features.forEach((fea, ind) => {
                      this.lineConnectedComponentFeatures[i].featureData[ind] = {};
                      if (this.lineConnectedComponentFeatures[i].featureChainId[ind] == "") { // if this feature doesn't have a featureChainId, just display the feature name
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea;
                      } else { // if this feature has a featureChainId, add the featureChainName to the feature name display
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea + " - " + this.lineConnectedComponentFeatures[i].featureChainName[ind];
                      }
                      this.lineConnectedComponentFeatures[i].featureData[ind].id = this.lineConnectedComponentFeatures[i].featuresId[ind];
                      this.lineConnectedComponentFeatures[i].featureData[ind].note = this._editDesignShared.getLineFeatureCheckboxStatus(this.activeComponentId,
                        componentId, this.lineConnectedComponentFeatures[i].featuresId[ind], ind); // ind is the featureIndex of this feature in that component
                      this.lineConnectedComponentFeatures[i].featureData[ind].featureConfirmed = featureConfirmStatus;
                    })
                  } else if (type == "controlUnit") {
                    this.lineConnectedComponentFeatures[i].nickName = this._editDesignShared.getControlUnitProperty(componentId, "nickName");
                    this.lineConnectedComponentFeatures[i].features = this._editDesignShared.getControlUnitProperty(componentId, "feature");
                    this.lineConnectedComponentFeatures[i].featuresId = this._editDesignShared.getControlUnitProperty(componentId, "featureId");
                    this.lineConnectedComponentFeatures[i].featureChainName = this._editDesignShared.getControlUnitProperty(componentId, "featureChainName");
                    this.lineConnectedComponentFeatures[i].featureChainId = this._editDesignShared.getControlUnitProperty(componentId, "featureChainId");
                    let featureConfirmStatus = this._editDesignShared.getControlUnitProperty(componentId, "featureConfirmed");
                    // console.log(`featureConfirmStatus of controlUnit is ${featureConfirmStatus}`)
                    this.lineConnectedComponentFeatures[i].featureData = [];
                    this.lineConnectedComponentFeatures[i].features.forEach((fea, ind) => {
                      this.lineConnectedComponentFeatures[i].featureData[ind] = {};
                      if (this.lineConnectedComponentFeatures[i].featureChainId[ind] == "") { // if this feature doesn't have a featureChainId, just display the feature name
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea;
                      } else { // if this feature has a featureChainId, add the featureChainName to the feature name display
                        this.lineConnectedComponentFeatures[i].featureData[ind].name = fea + " - " + this.lineConnectedComponentFeatures[i].featureChainName[ind];
                      }
                      this.lineConnectedComponentFeatures[i].featureData[ind].id = this.lineConnectedComponentFeatures[i].featuresId[ind];
                      this.lineConnectedComponentFeatures[i].featureData[ind].note = this._editDesignShared.getLineFeatureCheckboxStatus(this.activeComponentId,
                        componentId, this.lineConnectedComponentFeatures[i].featuresId[ind], ind); // ind is the featureIndex of this feature in that component
                      this.lineConnectedComponentFeatures[i].featureData[ind].featureConfirmed = featureConfirmStatus;
                    })
                  } else {
                    this.lineConnectedComponentFeatures[i].nickName = "none";
                    this.lineConnectedComponentFeatures[i].features = [];
                    this.lineConnectedComponentFeatures[i].featuresId = [];
                    this.lineConnectedComponentFeatures[i].featureChainName = [];
                    this.lineConnectedComponentFeatures[i].featureChainId = [];
                    this.lineConnectedComponentFeatures[i].featureData = [];
                  }
                }
              } else {
                this.lineConnectedComponentFeatures = [];
              }
              // document.getElementById("commLinePropertyPanel").style.display = "block";
              this.getFeaturesAssets();
            } else if (this.activeComponentType == "boundary") {
              this.removable = true;
              this.componentNickName = this._editDesignShared.getBoundaryProperty(this.activeComponentId, "nickName");
              this.boundaryEnable = this._editDesignShared.getBoundaryProperty(this.activeComponentId, "enable");
              // document.getElementById("boundaryPropertyPanel").style.display = "block";
            }
            break;
        }
      }
    }
  }
  ngOnInit() {
    this.moduleAssetInputChangeEvent();

    this._editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => this.newDesign = designData);
    this._editDesignShared.sidePanelStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => this.sidePanelOpened = status);
    // get microcontroller database
    let httpHeaders = new HttpHeaders({ "Content-type": "application/json" });
    // Used to implement auto search for micro models
    this.debounceSearch.valueChanges
      .pipe(startWith(''), debounceTime(400), distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe(res => this.getMicroLib(res));

    // get controlUnit database
    this.assignControlUnitDatabaseAndGroups();
    // get commLine database
    this._http
      .get(this.sharedComponentRootUrl + "/commlinelib", { headers: httpHeaders })
      .toPromise()
      .then((res: any) => {
        if (res.length > 0) {
          for (let i = 0; i < res.length; i++) {
            if (res[i].sensorInput) { // these are sensor inputs
              this.sensorInputDatabase.push(res[i]);
              this.sensorInputDatabase[this.sensorInputDatabase.length - 1].moduleIdInDb = res[i]._id;
              // the following code is to compose the object sensorInputModels...
              // ...so that the sensor input models can be sorted by baseProtocol in the Sensor Input Spec
              let tempIndexModel = this._arrOp.findStringIndexInArray(res[i].model, this.sensorInputModels);
              if (tempIndexModel == undefined) {
                this.sensorInputModels.push(res[i].model)
              }
            } else { // these are commLines
              this.commLineDatabase.push(res[i]);
              this.commLineDatabase[this.commLineDatabase.length - 1].moduleIdInDb = res[i]._id;
              // the following code is to compose the object commLineModels...
              // ...so that the commLine models can be sorted by baseProtocol in the Communication Line Spec
              let tempIndexModel = this._arrOp.findStringIndexInArray(res[i].model, this.commLineModels);
              if (tempIndexModel == undefined) {
                this.commLineModels.push(res[i].model)
              }
            }
          }
        } else {
          this._snackBar.open(res.msg, "", {
            duration: 3000,
          })
        }
      });
  }
  /**
   * Used to implement auto search for micro models
   * @param filterValue any
   */
  getMicroLib(filterValue) {
    this._http
      .post(this.sharedComponentRootUrl + "/microlib", { filterValue: filterValue || '' })
      .toPromise()
      .then((res: any) => {
        if (res.length > 0) {
          this.microGroups = [];
          for (let i = 0; i < res.length; i++) {

            this.microDatabase.push(res[i]);
            // the following code is to compose the object microGroups...
            // ...so that the component can be sorted by manufacturers in the microcontroller list
            let tempIndexMft = this._arrOp.findStringIndexInArrayProperty(res[i].manufacturer, "manufacturer", this.microGroups);
            if (tempIndexMft == undefined) {
              this.microGroups.push({
                manufacturer: res[i].manufacturer,
                cpe23: res[i].cpe23,
                model: [],
              })
            }
            tempIndexMft = this._arrOp.findStringIndexInArrayProperty(res[i].manufacturer, "manufacturer", this.microGroups);
            let tempIndexModel = this._arrOp.findStringIndexInArray(res[i].model, this.microGroups[tempIndexMft].model);
            if (tempIndexModel == undefined) {
              this.microGroups[tempIndexMft].model.push(res[i].model)
            }
          }

        } else if (this.microGroupsList.length) this.microGroups = this.microGroupsList;
      });
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Emit output threat to modeling view component
  showAttackPath($event: any) {
    this.threatAttackPath.emit($event);
  }
  onEnterApplicationProtocol(protocol: string) {
    const commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");

    this.removeDummyProtocol(commLineAppProtocols, this.existingApplicationProtocol, this.applicationProtocols, this.commLineAppProtocols, "appProtocol");

    if (!commLineAppProtocols.includes(protocol)) {
      commLineAppProtocols.push(protocol);
    }

    this.commLineAppProtocols = commLineAppProtocols;
    this.applicationProtocolsInput.nativeElement.value = "";
    this.applicationProtocolsInput.nativeElement.blur();

    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAppProtocols, "appProtocol");
  }

  onEnterSecurityProtocol(protocol: string) {
    const commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");

    this.removeDummyProtocol(commLineSecureProtocols, this.existingSecurityProtocol, this.securityProtocols, this.commLineSecureProtocols, "secureProtocol");

    if (!commLineSecureProtocols.includes(protocol)) {
      commLineSecureProtocols.push(protocol);
    }

    this.commLineSecureProtocols = commLineSecureProtocols;
    this.securityProtocolsInput.nativeElement.value = "";
    this.securityProtocolsInput.nativeElement.blur();

    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineSecureProtocols, "secureProtocol");
  }

  private removeDummyProtocol(appProtocols: string[] = [], existingProtocol: string, protocols: Protocol[], selectedProtocols: string[], protocolType: string) {
    if (existingProtocol) {
      const applicationProtocols: string[] = protocols.map(obj => obj.name.toLocaleLowerCase());
      const applicationProtocolIndex: number = applicationProtocols.indexOf(existingProtocol.toLocaleLowerCase());
      if (applicationProtocolIndex > -1) {
        const existingProtocol = protocols[applicationProtocolIndex].name;
        const index: number = appProtocols.indexOf(existingProtocol);
        if (!selectedProtocols.includes(appProtocols[index])) {
          appProtocols.splice(index, 1);
          this._editDesignShared.updateCommLineProperty(this.activeComponentId, appProtocols, protocolType);
        }
      } else {
        const index: number = appProtocols.indexOf(existingProtocol);
        if (index > -1) {
          if (!selectedProtocols.includes(appProtocols[index])) {
            appProtocols.splice(index, 1);
            this._editDesignShared.updateCommLineProperty(this.activeComponentId, appProtocols, protocolType);
          }
        }
      }
    }
  }

  changeApplicationProtocolName($event: any) {
    const protocol: string = $event.target.value;
    const commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");

    this.removeDummyProtocol(commLineAppProtocols, this.existingApplicationProtocol, this.applicationProtocols, this.commLineAppProtocols, "appProtocol");

    if (protocol) {
      const applicationProtocols: string[] = commLineAppProtocols.map(value => value.toLocaleLowerCase());
      const exists = applicationProtocols.indexOf(protocol.toLocaleLowerCase());
      if (exists === -1) {
        const applicationProtocols: string[] = this.applicationProtocols.map(obj => obj.name.toLocaleLowerCase());
        const applicationProtocolIndex: number = applicationProtocols.indexOf(protocol.toLocaleLowerCase());
        if (applicationProtocolIndex > -1) {
          this._editDesignShared.updateCommLineProperty(this.activeComponentId, [...commLineAppProtocols, this.applicationProtocols[applicationProtocolIndex].name], "appProtocol");
        } else {
          this._editDesignShared.updateCommLineProperty(this.activeComponentId, [...commLineAppProtocols, protocol], "appProtocol");
        }
      }

      this.existingApplicationProtocol = protocol;
    }
  }

  changeSecurityProtocolName($event: any) {
    const protocol: string = $event.target.value;
    const commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");

    this.removeDummyProtocol(commLineSecureProtocols, this.existingSecurityProtocol, this.securityProtocols, this.commLineSecureProtocols, "secureProtocol");

    if (protocol) {
      const securityProtocols: string[] = commLineSecureProtocols.map(value => value.toLocaleLowerCase());
      const exists = securityProtocols.indexOf(protocol.toLocaleLowerCase());
      if (exists === -1) {
        const securityProtocols: string[] = this.securityProtocols.map(obj => obj.name.toLocaleLowerCase());
        const securityProtocolIndex: number = securityProtocols.indexOf(protocol.toLocaleLowerCase());
        if (securityProtocolIndex > -1) {
          this._editDesignShared.updateCommLineProperty(this.activeComponentId, [...commLineSecureProtocols, this.securityProtocols[securityProtocolIndex].name], "secureProtocol");
        } else {
          this._editDesignShared.updateCommLineProperty(this.activeComponentId, [...commLineSecureProtocols, protocol], "secureProtocol");
        }
      }
      this.existingSecurityProtocol = protocol;
    }
  }

  private loadProtocols() {
    if (this.securityProtocols.length <= 0 && this.applicationProtocols.length <= 0) {
      this._http
        .get(this.sharedComponentRootUrl + "/protocollib")
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: any) => {
          if (res && res.length) {
            this.applicationProtocols = res.filter(obj => obj.category === "application");
            this.securityProtocols = res.filter(obj => obj.category === "security");
          } else {
            this._snackBar.open("Protocol database connection failed.", "", {
              duration: 5000,
            })
          }
        });
    } else {
      this.resetProtocols();
      this.fillMissingProtocols(this.commLineAppProtocols, "appProtocol");
      this.fillMissingProtocols(this.commLineSecureProtocols, "secureProtocol");
    }
  }

  private fillMissingProtocols(selectedProtocols: string[], protocolType: string) {

    const newDesign = this.newDesign
    const commLine = newDesign.commLine.find(obj => obj.id === this.activeComponentId);
    if (commLine) {
      const savedProtocols = commLine[protocolType];
      savedProtocols.forEach((protocol, i) => {
        const index = selectedProtocols.indexOf(protocol);
        if (index === -1) {
          switch (protocolType) {
            case "appProtocol":
              this.commLineAppProtocols.push(savedProtocols[i]);
              break;
            case "secureProtocol":
              this.commLineSecureProtocols.push(savedProtocols[i]);
              break;
          }
          this.changeDetector.detectChanges();
        }
      });
    }
  }

  private resetProtocols() {
    if (this.existingApplicationProtocol) {
      const commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");
      this.removeDummyProtocol(commLineAppProtocols, this.existingApplicationProtocol, this.applicationProtocols, this.commLineAppProtocols, "appProtocol");
      this.existingApplicationProtocol = "";
    }

    if (this.existingSecurityProtocol) {
      const commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");
      this.removeDummyProtocol(commLineSecureProtocols, this.existingSecurityProtocol, this.securityProtocols, this.commLineSecureProtocols, "secureProtocol");
      this.existingSecurityProtocol = "";
    }

    this.commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");
    this.commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");
  }

  microNickNameChange(myValue) {
    if (myValue.length > 15 && myValue.search(' ')) {
      document.getElementById(this.activeComponentId).parentElement.parentElement.classList.add('longTitle')
    } else {
      document.getElementById(this.activeComponentId).parentElement.parentElement.classList.remove('longTitle')
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, myValue, "nickName");
  }

  // retrieve the hsm properties of the selelcted HSM once a selection is made
  microSelectionChange(group, model) {
    //Find in microDatabase if model has cpe23 and store it in cpe
    let obj = this.microDatabase.find((obj => obj.model == model));
    let cpe = obj?.cpe23

    this.microGroupsList = this.microGroups
    if ((group.manufacturer + ' ' + model) != this.selectedMicro) {
      this.selectedMicro = group.manufacturer + ' ' + model;
      this.changeDetector.detectChanges();
      this.selectedHsmFeatures = [];
      let selectedHsmIndex = this._arrOp.findStringIndexInArrayProperty(model, "model", this.microDatabase);
      for (let i = 0; i < this.microDatabase[selectedHsmIndex].hsm.length; i++) {
        this.selectedHsmFeatures.push(this.microDatabase[selectedHsmIndex].hsm[i]);
      };
      this._editDesignShared.updateMicroProperty(this.activeComponentId, model, "model");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, group.manufacturer, "manufacturerName");

      this._editDesignShared.updateMicroProperty(this.activeComponentId, "TODO", "modelIdInCompLib");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.selectedHsmFeatures, "property");
    }
    let micro = this.newDesign.micro.find(res => res.id == this.activeComponentId) as any;
    let updatedBomData = {};
    if (micro) {
      if (Array.isArray(micro.hbom)) {
        updatedBomData = { ...micro.hbom[0], vendor: this.cleanUpString(group.manufacturer), product: this.cleanUpString(model), part: 'h', cpe23: cpe || '' }
      } else {
        updatedBomData = [{ ...micro.hbom, vendor: this.cleanUpString(group.manufacturer), product: this.cleanUpString(model), part: 'h', cpe23: cpe || '' }]
      }
      this._editDesignShared.updateMicroProperty(this.activeComponentId, updatedBomData, "hbom");
    }

  };

  cleanUpString(input: string): string {

    return input.trim().replace(/\s+/g, '_').toLowerCase()

  }
  // chip list for HSM features
  addHsmFeature(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add hsm feature
    if ((value || '').trim()) {
      this.selectedHsmFeatures.push(value.trim());
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.selectedHsmFeatures, "property");
  };
  removeHsmFeature(hsmFeature: string): void {
    const index = this.selectedHsmFeatures.indexOf(hsmFeature);
    if (index >= 0) {
      this.selectedHsmFeatures.splice(index, 1);
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.selectedHsmFeatures, "property");
  };

  addFeature(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add features
    if ((value || '').trim()) {
      this.microFeatures.push(value.trim());
      this.microFeaturesId.push(""); // TODO: adding a features by typing doesn't affect anything. need to add feature from database
      this.microFeatureChainId.push("");
      this.microFeatureChainName.push("");
      this.microFeaturesRole.push("");
      this.microFeaturesRoleIndex.push(0);
      this.microFeaturesType.push("");
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatures, "feature");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesId, "featureId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainId, "featureChainId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainName, "featureChainName");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRole, "featureRole");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRoleIndex, "featureRoleIndex");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesType, "featureType");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, false, "featureConfirmed");
    // TODO: once adding feature from database is available, assets need to be added accordingly, without "Confirm Features" button. Otherwise it complicates featureChainId.
    // this.microFeatureUpdateStatus = "You can only add features in the database management view. Security assets are not updated!"
    this._snackBar.open("You can only add features in the database management view.", "Security assets not updated!", {
      duration: 5000,
    })
  }
  removeFeature(featureIndex: number): void {
    if (featureIndex >= 0) {
      this.microFeatures.splice(featureIndex, 1);
      this.microFeaturesId.splice(featureIndex, 1);
      this.microFeatureChainId.splice(featureIndex, 1);
      this.microFeatureChainName.splice(featureIndex, 1);
      this.microFeaturesRole.splice(featureIndex, 1);
      this.microFeaturesRoleIndex.splice(featureIndex, 1);
      this.microFeaturesType.splice(featureIndex, 1);
    }
    this.assetFeatureIndex = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetFeatureIndex");
    let assetFeatureIndexTemp = []; // to build new assetFeatureIndex while looping assetFeatureIndex array
    this.assetFeatureIndex.forEach((element, ind) => {
      if (element == featureIndex) {
        this.microAssets.splice(ind, 1);
        this.microAssetsId.splice(ind, 1);
      } else if (element > featureIndex) {
        assetFeatureIndexTemp.push(element - 1); // new feature index should be reduced by 1
      } else if (element < featureIndex) {
        assetFeatureIndexTemp.push(element);
      }
    })
    this._editDesignShared.updateMicroProperty(this.activeComponentId, assetFeatureIndexTemp, "assetFeatureIndex");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatures, "feature");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesId, "featureId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainId, "featureChainId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainName, "featureChainName");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRole, "featureRole");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRoleIndex, "featureRoleIndex");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesType, "featureType");
    // the featureIndex is used by commLine to identify if a feature is accessible. So we also need to modify commLine properties
    let connectedCommLineArray = this._editDesignShared.getMicroProperty(this.activeComponentId, "lineId"); // connected commLines
    connectedCommLineArray.forEach(lineId => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndexInCommLine = terminalComponentIdArray.indexOf(this.activeComponentId); // use this to identify the location of the component in terminalComponentFeature, etc.
      let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
      let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
      let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      terminalComponentAssetAccessBoolean[componentIndexInCommLine] = new Array(this.microAssets.length).fill(false);
      // console.log(`featureIndex is ${featureIndex}, terminalComponentFeatureIndexArray[componentIndexInCommLine] is ${terminalComponentFeatureIndexArray[componentIndexInCommLine]}`)
      let featureIndexInTerminalComponentFeature = terminalComponentFeatureIndexArray[componentIndexInCommLine].indexOf(featureIndex); // use this to identify the location of the feature in terminalComponentFeature[], etc.
      // console.log(`featureIndexInTerminalComponentFeature is ${featureIndexInTerminalComponentFeature}`)
      if (featureIndexInTerminalComponentFeature >= 0) { // if the removed feature is accessible from the commLine
        terminalComponentFeatureArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
        terminalComponentFeatureIdArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
        terminalComponentFeatureIndexArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
      };
      terminalComponentFeatureIndexArray[componentIndexInCommLine].forEach((element, elementIndex) => { // adjust the rest of the index
        if (element > featureIndex) { // index should be reduced by one if it's ranked after the deleted feature
          terminalComponentFeatureIndexArray[componentIndexInCommLine][elementIndex] = element - 1;
        }
      });
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
      // let terminalComponentFeatureChainIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureChainId");
      // if (terminalComponentFeatureChainIdArray.length > 0) { // if feature chain exists, update it too
      //   terminalComponentFeatureChainIdArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
      //   this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureChainIdArray, "terminalComponentFeatureChainId");
      // }
    });
    // let selectedModuleIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedModule, "model", this.controlUnitDatabase);
    // console.log(`microFeatures is ${this.microFeatures}`);
    // console.log(`controlUnitDatabase.feature is ${this.controlUnitDatabase[selectedModuleIndex].feature}`)
    this._snackBar.open("Relevant security assets have been removed. No need to confirm features again!.", "Successful!", {
      duration: 5000,
    })
    // this.microFeatureUpdateStatus = "Security assets have been updated to accomodate the feature removal!"
  };
  selectedModuleUpdateForMicro(selection) {
    if (selection == this.selectedModule) { // the selection didn't change after the change event, do nothing

    } else {
      this.microAssets = [];
      this.microAssetsId = [];
      this.microAssetsType = [];
      this.microAssetsSubType = [];
      this.assetFeatureIndex = [];
      this.microFeatures = [];
      this.microFeaturesId = [];
      this.microFeaturesRole = [];
      this.microFeaturesType = [];
      this.microFeaturesRoleIndex = [];
      this.selectedModule = selection;
      this.removable = true;
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.selectedModule, "module");
      let selectedModuleIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedModule, "model", this.controlUnitDatabase);
      this.microFeatures = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].feature));
      this.microFeaturesId = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].featureId));
      this.microFeaturesRole = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].featureRole));
      this.microFeaturesType = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].featureType));
      this.microFeaturesRole.forEach((currentFeatureRole, currentFeatureRoleIndex) => {
        this.microFeaturesRoleIndex.push(this._editDesignShared.getFeatureRoleIndex(this.microFeaturesType[currentFeatureRoleIndex], currentFeatureRole))
      })
      this.microFeatureChainId = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
      this.microFeatureChainName = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
      this.selectedControlUnitFeatureChainId = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
      this.selectedControlUnitFeatureChainName = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.controlUnitDatabase[selectedModuleIndex]._id, "moduleId");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.controlUnitDatabase[selectedModuleIndex]._id, "moduleIdInDb"); // moduleId and moduleIdInDB are the same for micro
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatures, "feature");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesId, "featureId");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainId, "featureChainId");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainName, "featureChainName");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRole, "featureRole");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRoleIndex, "featureRoleIndex");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesType, "featureType");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsType, "assetType");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsSubType, "assetSubType");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
      this._editDesignShared.updateMicroProperty(this.activeComponentId, false, "featureConfirmed");
      // need to reset the commLine features
      let connectedLineId = this._editDesignShared.getMicroProperty(this.activeComponentId, "lineId");
      connectedLineId.forEach((lineId) => {
        let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
        if (terminalComponentIdArray) {
          let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
          let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
          let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
          let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
          let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
          terminalComponentFeatureArray[componentIndex] = [];
          terminalComponentFeatureIdArray[componentIndex] = [];
          terminalComponentFeatureIndexArray[componentIndex] = [];
          terminalComponentAssetAccessBoolean[componentIndex] = [];
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
        }
      })
      this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      this._snackBar.open("Confirm Features to commit security assets. Feature chain related to this component is removed.", "Features restored to default", {
        duration: 5000,
      })
      // this.microFeatureUpdateStatus = "Features have been set to database defaults. Confirm to commit security assets. If feature chains were set up in this component, they are removed."
    }
  }

  // "Confirm Features" will update security asset.
  featuresUpdate() {
    this._spinner.show()
    this.microAssets = [];
    this.microAssetsId = [];
    this.microAssetsType = [];
    this.microAssetsSubType = [];
    this.assetFeatureIndex = [];
    let missingFeaturesArray = [];
    for (let i = 0; i < this.microFeaturesId.length; i++) {
      if (!this.microFeaturesId[i]) {
        missingFeaturesArray.push(this.microFeatures[i])
      }
    }
    if (missingFeaturesArray.length == 1) {
      this._snackBar.open("This feature - " + missingFeaturesArray[0] +
        " - does not exist in your database. Please check the result carefully.", "Warning!", {
        duration: 5000,
      })
      // this.microFeatureUpdateStatus = "This feature - " + missingFeaturesArray[0] +
      //   " - does not exist in your database. Please check the result carefully."
    } else if (missingFeaturesArray.length > 1) {
      this._snackBar.open("These features - " + missingFeaturesArray.join() +
        " - do not exist in your database. Please check the result carefully.", "Warning!", {
        duration: 5000,
      })
      // this.microFeatureUpdateStatus = "These features - " + missingFeaturesArray.join() +
      //   " - do not exist in your database. Please check the result carefully."
    }
    // else {
    // this._snackBar.open("Features confirmed. Security assets updated!", "Successful!", {
    //   duration: 5000,
    // })
    // this.microFeatureUpdateStatus = "Features confirmed. Security assets updated!"
    // }
    // retrieve assets and add them to the micro
    let microFeaturesString = this.microFeaturesId.join();
    let microFeaturesRoleIndexString = this.microFeaturesRoleIndex.join();
    let params = new HttpParams()
      .set("featureList", microFeaturesString)
      .set("featureRoleList", microFeaturesRoleIndexString);
    this._http
      .get(this.featureRootUrl + "/featureassetlib", { params: params })
      .toPromise()
      .then((res: any) => {
        // console.log(res)
        this._spinner.hide()
        this.microAssets = res.asset;
        this.microAssetsId = res.assetId;
        this.microAssetsType = res.assetType;
        this.microAssetsSubType = res.assetSubType;
        this.assetFeatureIndex = res.index;
        if (res.missingFeaturesArray.length > 0) {
          let missingFeatureName = [];
          res.missingFeaturesArray.forEach((currentFeatureId) => {
            let featureIndex = this.microFeaturesId.indexOf(currentFeatureId);
            missingFeatureName.push(this.microFeatures[featureIndex]);
          })
          let notificationMsg = missingFeatureName.join("");
          this._snackBar.open("These features are missing from your database: " + notificationMsg, "", {
            duration: 5000,
          })
        } else {
          this._snackBar.open("Features confirmed. Security assets updated!", "Successful!", {
            duration: 5000,
          })
        }
        // this.featuresUpdateStatus = res.msg;
      })
      .then((value) => {
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsType, "assetType");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsSubType, "assetSubType");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, true, "featureConfirmed");
        this.removable = false;
        let connectedLineId = this._editDesignShared.getMicroProperty(this.activeComponentId, "lineId");
        connectedLineId.forEach((lineId) => {
          let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
          let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
          let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
          terminalComponentAssetAccessBoolean[componentIndex] = new Array(this.microAssets.length).fill(false);
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
          let terminalComponentAssetAccessType = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessType");
          terminalComponentAssetAccessType[componentIndex] = null;
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessType, "terminalComponentAssetAccessType");
        })
        this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      })
      .catch((err) => {
        throwError(err)
      });
  };
  microFeatureDefault() { // reset micro features and asset to default
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.selectedModule, "module");
    let selectedModuleIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedModule, "model", this.controlUnitDatabase);
    this.microFeatures = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].feature));
    this.microFeaturesId = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].featureId));
    this.microFeaturesRole = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedModuleIndex].featureRole));
    this.microFeaturesType = this.controlUnitDatabase[selectedModuleIndex].featureType;
    this.microFeaturesRoleIndex = []
    this.microFeaturesRole.forEach((currentFeatureRole, currentFeatureRoleIndex) => {
      this.microFeaturesRoleIndex.push(this._editDesignShared.getFeatureRoleIndex(this.microFeaturesType[currentFeatureRoleIndex], currentFeatureRole))
    })
    this.microFeatureChainId = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
    this.microFeatureChainName = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
    this.selectedControlUnitFeatureChainId = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
    this.selectedControlUnitFeatureChainName = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.controlUnitDatabase[selectedModuleIndex]._id, "moduleId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.controlUnitDatabase[selectedModuleIndex]._id, "moduleIdInDb"); // moduleId and moduleIdInDB are the same for micro
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatures, "feature");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesId, "featureId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainId, "featureChainId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeatureChainName, "featureChainName");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRole, "featureRole");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesRoleIndex, "featureRoleIndex");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microFeaturesType, "featureType");
    // need to check if commLine features align with the default features
    let affectedCommLineNameArray = [];
    let connectedLineId = this._editDesignShared.getMicroProperty(this.activeComponentId, "lineId");
    connectedLineId.forEach((lineId) => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
      let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
      let featureIndexArrayInCommLine = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      let featureMatch = true;
      // if all features in commLine exist in micro, and in the right place (same index), return true - no need to empty the commLine features.
      for (let i = 0; i < terminalComponentFeatureIdArray[componentIndex].length; i++) {
        // console.log(`microFeaturesId is ${this.microFeaturesId[featureIndexArrayInCommLine[componentIndex][i]]}, terminalComponentFeatureIdArray is ${terminalComponentFeatureIdArray[componentIndex][i]}`);
        featureMatch = (this.microFeaturesId[featureIndexArrayInCommLine[componentIndex][i]] == terminalComponentFeatureIdArray[componentIndex][i]) && featureMatch;
        if (!featureMatch) {
          break
        }
      }
      // console.log(`featureMatch is ${featureMatch}`)
      if (featureMatch) { // if features in commLine match default features of the micro, do nothing

      } else {
        let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
        let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
        terminalComponentFeatureArray[componentIndex] = [];
        terminalComponentFeatureIdArray[componentIndex] = [];
        terminalComponentFeatureIndexArray[componentIndex] = [];
        let microAssetTemp = this._editDesignShared.getMicroProperty(this.activeComponentId, "asset");
        terminalComponentAssetAccessBoolean[componentIndex] = new Array(this.microAssets.length).fill(false);
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
        affectedCommLineNameArray.push(this._editDesignShared.getCommLineProperty(lineId, "nickName"))
      }
    })
    if (affectedCommLineNameArray.length == 0) { // if features stored in connected lines are the same as default feature
      this._snackBar.open("Features and assets have been restored to default.", "Features restored to default", {
        duration: 5000,
      })
    } else { // if default features differ from features stored in connected lines
      let warningText = `Features and assets have been restored to default. Please reset Accessible Features in these lines ${affectedCommLineNameArray}`;
      this._snackBar.open(warningText, "Warning", {
        duration: 10000,
      })
    }
    this.microAssets = [];
    this.microAssetsId = [];
    this.microAssetsType = [];
    this.microAssetsSubType = [];
    this.assetFeatureIndex = [];
    // retrieve assets and add them to the micro
    let microFeaturesString = this.microFeaturesId.join();
    let microFeaturesRoleIndexString = this.microFeaturesRoleIndex.join();
    let params = new HttpParams()
      .set("featureList", microFeaturesString)
      .set("featureRoleList", microFeaturesRoleIndexString);
    this._http
      .get(this.featureRootUrl + "/featureassetlib", { params: params })
      .toPromise()
      .then((res: any) => {
        // console.log(res)
        this.microAssets = res.asset;
        this.microAssetsId = res.assetId;
        this.microAssetsType = res.assetType;
        this.microAssetsSubType = res.assetSubType;
        this.assetFeatureIndex = res.index;
        if (res.missingFeaturesArray.length > 0) {
          let missingFeatureName = [];
          res.missingFeaturesArray.forEach((currentFeatureId) => {
            let featureIndex = this.microFeaturesId.indexOf(currentFeatureId);
            missingFeatureName.push(this.microFeatures[featureIndex]);
          })
          let notificationMsg = missingFeatureName.join("");
          this._snackBar.open("These features are missing from your database: " + notificationMsg, "", {
            duration: 5000,
          })
        }
        // this.featuresUpdateStatus = res.msg;
      })
      .then((value) => {
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsType, "assetType");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsSubType, "assetSubType");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
        this._editDesignShared.updateMicroProperty(this.activeComponentId, true, "featureConfirmed");
        this.removable = false;
        this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      })
      .catch((err) => {
        let missingFeaturesArray = [];
        for (let i = 0; i < this.microFeaturesId.length; i++) {
          if (!this.microFeaturesId[i]) {
            missingFeaturesArray.push(this.microFeatures[i])
          }
        }
        if (missingFeaturesArray.length == 1) {
          this._snackBar.open("This feature - " + missingFeaturesArray[0] +
            " - does not exist in your database. Please check the result carefully.", "Warning!", {
            duration: 5000,
          })
        } else if (missingFeaturesArray.length > 1) {
          this._snackBar.open("These features - " + missingFeaturesArray.join() +
            " - do not exist in your database. Please check the result carefully.", "Warning!", {
            duration: 5000,
          })
        } else {
          this._snackBar.open("Features confirmed. Security assets updated!", "Successful!", {
            duration: 5000,
          })
        }
        throwError(err)
      });
  }
  //remove Component popup
  deleteComponent(module: any) {
    let message = "Are you sure you want to delete this Component?";
    message = message.replace('?', ' ' + this.componentNickName + ' ?');
    this.confirmToDeleteComponentDialogOptions.message = message;
    this._confirmDialogService.open(this.confirmToDeleteComponentDialogOptions);
    this._confirmDialogService.confirmed().subscribe((confirmed) => {
      if (confirmed) {
        if (module == "micro") {
          this.removeMicro();
        }
        if (module == 'controlUnit') {
          this.removeControlUnit();
        }
        if (module == "commLine") {
          this.removeCommLine();
        }
        if (module == "boundary") {
          this.removeBoundary();
        }
      } else {
        this._snackBar.open("No component is deleted.", "", { duration: 3000 });
      }
    });
  }
  // remove a micro
  removeMicro() {
    this.lineConnectedComponentFeatures = this._editDesignShared.removeComponentFeaturesFromLine(this.lineConnectedComponentFeatures, this.activeComponentId)
    this._editDesignShared.closeSidePanel();
    // document.getElementById(this._editDesignShared.getComponentType(this.activeComponentId) + "PropertyPanel").style.display = "none";
    this._compVisual.removeComponentById(this.activeComponentId, this.newDesign);
    this._editDesignShared.removeMicro(this.activeComponentId);
    this.activeComponentId = "";
    // console.log(this.newDesign);
  };
  // bom card is for vulnerability management. it is not functional at this time
  addBom(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add boms
    if ((value || '').trim()) {
      this.boms.push(value.trim());
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  };
  removeBom(index): void {
    if (index >= 0) {
      this.boms.splice(index, 1);
    }
  };
  // bomUpdateStatus = "";
  bomUpdate() {
    // return this.bomUpdateStatus = "Software BOM updated!";
  }
  // Security Settings Tab
  // Assumptions card
  microPropertyPanelTabClick(event: any) {
    if (event.index == 1) { // if Security Settings tab is clicked
      this.microPhysicalAccess = this._editDesignShared.getMicroProperty(this.activeComponentId, "attackSurface");
      this.microAssets = this._editDesignShared.getMicroProperty(this.activeComponentId, "asset");
      this.microAssetsId = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetId");
      this.microAssetsType = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetType");
      this.microAssetsSubType = this._editDesignShared.getMicroProperty(this.activeComponentId, "assetSubType");
      this.removable = true;
    } else if (event.index == 0) { // if Product Spec tab is clicked
      this.componentNickName = this._editDesignShared.getMicroProperty(this.activeComponentId, "nickName");
      this.selectedMicro = this._editDesignShared.getMicroProperty(this.activeComponentId, "model");
      this.selectedHsmFeatures = this._editDesignShared.getMicroProperty(this.activeComponentId, "property");
      this.microFeatures = this._editDesignShared.getMicroProperty(this.activeComponentId, "feature");
      this.microFeaturesId = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureId");
      this.removable = !this._editDesignShared.getMicroProperty(this.activeComponentId, "featureConfirmed");
    }
  };
  microPhysicalAccessChange() {
    this.microPhysicalAccess = !this.microPhysicalAccess;
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microPhysicalAccess, "attackSurface");
    // console.log(this._editDesignShared);
  };
  // microAsset card
  addMicroAsset(event: MatChipInputEvent): void { // not used. content outdated
    const input = event.input;
    const value = event.value;
    // Add microAssets
    if ((value || '').trim()) {
      this.microAssets.push(value.trim());
      this.microAssetsId.push("");
      // this.assetFeatureIndex.push();
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
    // this._editDesignShared.updateMicroProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
  };
  removeMicroAsset(assetIndex: number): void {
    // const assetIndex = this.microAssets.indexOf(microAsset);
    if (assetIndex >= 0) {
      this.microAssets.splice(assetIndex, 1);
      this.microAssetsId.splice(assetIndex, 1);
      this.microAssetsType.splice(assetIndex, 1);
      this.microAssetsSubType.splice(assetIndex, 1);
      this.assetFeatureIndex.splice(assetIndex, 1);
    }
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssets, "asset");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsId, "assetId");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsType, "assetType");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.microAssetsSubType, "assetSubType");
    this._editDesignShared.updateMicroProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
    // terminalComponentAssetAccessBoolean property of connected commLines also needs to be addressed if an asset is removed
    let connectedLineId = this._editDesignShared.getMicroProperty(this.activeComponentId, "lineId");
    connectedLineId.forEach((lineId) => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      terminalComponentAssetAccessBoolean[componentIndex].splice(assetIndex, 1);
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
    })
  };
  microFeatureChipListClick(index) {
    if (this.microFeatureSelected[index]) {
      this.microFeatureSelected[index] = false;
    } else {
      this.microFeatureSelected.fill(false);
      this.microFeatureSelected[index] = true;
      this._snackBar.open("Feature Chain button is enabled to link this feature with others.", "", {
        duration: 5000,
      })
    }
    this.microFeatureEditDisable = !this.microFeatureSelected.includes(true);
  }
  microFeatureChainEdit() {
    let featureIndex = this.microFeatureSelected.findIndex(element => element);
    let microFeatureChainIdArray = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureChainId");
    let thisFeatureChainId = microFeatureChainIdArray[featureIndex]; // initialize featureChainId
    let thisFeatureChainName = "";
    let [involvedMicro, microFeatureIndex, microFeatureType] = this._editDesignShared.findMicroWithFeatureIdForFeatureChain(this.activeComponentId, this.microFeaturesId[featureIndex], thisFeatureChainId, "featureType");
    let [involvedControlUnit, controlUnitIndex, controlUnitFeatureType] = this._editDesignShared.findControlUnitWithFeatureIdForFeatureChain(this.activeComponentId, this.microFeaturesId[featureIndex], thisFeatureChainId, "featureType");
    let componentUnderEditIndex = this._arrOp.findStringIndexInArrayProperty(this.activeComponentId, "id", involvedMicro); // identify the location of the component under edit in the component array
    let involvedMicroFeatureRoles = [];
    let involvedMicroFeatureRolesIndex = [];
    microFeatureType.forEach((featureTypeItem) => {
      this.dynamicallyAssignFeatureRole(featureTypeItem);
      involvedMicroFeatureRoles.push(this.dynamicFeatureRole);
      involvedMicroFeatureRolesIndex.push(this._editDesignShared.getFeatureRoleIndex(featureTypeItem, this.dynamicFeatureRole));
    });
    let involvedControlUnitFeatureRoles = [];
    let involvedControlUnitFeatureRolesIndex = [];
    controlUnitFeatureType.forEach((featureTypeItem) => {
      this.dynamicallyAssignFeatureRole(featureTypeItem);
      involvedControlUnitFeatureRoles.push(this.dynamicFeatureRole);
      involvedControlUnitFeatureRolesIndex.push(this._editDesignShared.getFeatureRoleIndex(featureTypeItem, this.dynamicFeatureRole));
    });
    let confirmedMicroArray = [];
    let confirmedControlUnitArray = [];
    // console.log(`thisFeatureChainId is ${thisFeatureChainId}`)
    if (thisFeatureChainId) { // if this id exists, it means this feature was edited before
      this.microFeatureChainName = this._editDesignShared.getMicroProperty(this.activeComponentId, "featureChainName");
      thisFeatureChainName = this.microFeatureChainName[featureIndex];
      confirmedMicroArray = this._editDesignShared.checkMicroFeatureChainId(involvedMicro, thisFeatureChainId); // returns an array of booleans showing whether featureChainId exists
      confirmedMicroArray[componentUnderEditIndex] = true; // the component under edit, by default, is part of the feature chain
      confirmedControlUnitArray = this._editDesignShared.checkControlUnitFeatureChainId(involvedControlUnit, thisFeatureChainId); // returns an array of booleans showing whether featureChainId exists
    } else { // if this feature was not generated before
      thisFeatureChainId = this._arrOp.genRandomId(10); // generate a new id
      confirmedMicroArray = new Array(involvedMicro.length).fill(false);
      confirmedMicroArray[componentUnderEditIndex] = true; // the component under edit, by default, is part of the feature chain
      confirmedControlUnitArray = new Array(involvedControlUnit.length).fill(false);
    };
    let microDisabledArray = new Array(confirmedMicroArray.length).fill(false); // when editing a controlUnit, all micro components can be checked/unchecked
    let controlUnitDisabled = new Array(confirmedControlUnitArray.length).fill(false);
    microDisabledArray[componentUnderEditIndex] = true; // the component under edit has to be part of the feature chain. can't be modified
    // console.log(`thisFeatureChainName is ${thisFeatureChainName}`)
    const dialogRef = this.dialog.open(EditFeatureDialog, {
      width: "auto",
      height: "auto",
      maxWidth: "50em",
      maxHeight: "50em",
      // autoFocus: false,
      data: {
        activeComponentId: this.activeComponentId,
        activeComponentNickName: this._editDesignShared.getMicroProperty(this.activeComponentId, "nickName"),
        componentType: "micro",
        featureIndex: featureIndex,
        featureName: this.microFeatures[featureIndex],
        featureId: this.microFeaturesId[featureIndex],
        featureType: microFeatureType[0], // micro and controlUnit must have the same feature type, so no need to differentiate
        involvedMicro: involvedMicro,
        involvedMicroFeatureIndex: microFeatureIndex,
        involvedMicroFeatureRoles: involvedMicroFeatureRoles, // for the dialog to identify available feature roles
        involvedMicroFeatureRolesIndex: involvedMicroFeatureRolesIndex, //
        confirmedMicroArray: confirmedMicroArray, // for the check boxes in the dialog
        involvedControlUnit: involvedControlUnit,
        involvedControlUnitFeatureIndex: controlUnitIndex,
        involvedControlUnitFeatureRoles: involvedControlUnitFeatureRoles, // for the dialog to identify available feature roles
        involvedControlUnitFeatureRolesIndex: involvedControlUnitFeatureRolesIndex, //
        confirmedControlUnitArray: confirmedControlUnitArray, // for the check boxes in the dialog
        featureChainId: thisFeatureChainId,
        featureChainName: thisFeatureChainName,
        microDisabled: microDisabledArray,
        controlUnitDisabled: controlUnitDisabled,
      },
    });
  }

  addNewBOM() {
    const dialogRef = this.dialog.open(CreateBOMComponent, {
      width: "500px",
      height: "700px",
      // maxWidth: "50em",
      // maxHeight: "50em",
      disableClose: true,
      // autoFocus: false,
      data: {},
    });
    this.activeComponentType = this._editDesignShared.getComponentType(this.activeComponentId);
    dialogRef.afterClosed().subscribe(result => {
      if (result?.action == "add") {
        this.sbom.push(result.data);
        switch (this.activeComponentType) {
          case "micro":
            this._editDesignShared.updateMicroProperty(this.activeComponentId, this.sbom, "sbom");
            break;
          case "controlUnit":
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.sbom, "sbom");
            break;
        }
      }
    });
  }

  updateSbom(sbom, i) {
    const dialogRef = this.dialog.open(CreateBOMComponent, {
      width: "500px",
      height: "700px",
      // maxWidth: "50em",
      // maxHeight: "50em",
      disableClose: true,
      // autoFocus: false,
      data: { sbom, i },
    });
    this.activeComponentType = this._editDesignShared.getComponentType(this.activeComponentId);
    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
      switch (result.action) {
        case "add":
          this.sbom.push(result.data);
          switch (this.activeComponentType) {
            case "micro":
              this._editDesignShared.updateMicroProperty(this.activeComponentId, this.sbom, "sbom");
              break;
            case "controlUnit":
              this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.sbom, "sbom");
              break;
          }
          break;
        case "update":
          this.sbom.splice(i, 1, result.data);
          switch (this.activeComponentType) {
            case "micro":
              this._editDesignShared.updateMicroProperty(this.activeComponentId, this.sbom, "sbom");
              break;
            case "controlUnit":
              this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.sbom, "sbom");
              break;
          }
          break;
        case "delete":
          this.sbom.splice(i, 1);
          switch (this.activeComponentType) {
            case "micro":
              this._editDesignShared.updateMicroProperty(this.activeComponentId, this.sbom, "sbom");
              break;
            case "controlUnit":
              this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.sbom, "sbom");
              break;
          }
      }
    });
  }

  //////////////////////////////////////////////
  // Control Unit Panel
  /////////////////////////////////////////////
  controlUnitPropertyPanelTabClick(event: any) {
    if (event.index == 1) { // if Security Settings tab is clicked
      this.controlUnitAttackSurface = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "attackSurface");
      this.controlUnitAssets = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "asset");
      this.controlUnitAssetsId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetId");
      this.controlUnitAssetsType = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetType");
      this.controlUnitAssetsSubType = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetSubType");
      this.removable = true;
    } else if (event.index == 0) { // if Product Spec tab is clicked
      this.componentNickName = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "nickName");
      this.selectedControlUnit = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "model");
      this.selectedControlUnitFeatures = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "feature");
      this.selectedControlUnitFeaturesId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureId");
      this.removable = !this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureConfirmed");
    }
  };
  // selectedControlUnitFeatures: string[];
  controlUnitNickNameChange(myValue) {
    if (myValue.length > 15 && myValue.search(' ')) {
      document.getElementById(this.activeComponentId).parentElement.parentElement.classList.add('longTitle')
    } else {
      document.getElementById(this.activeComponentId).parentElement.parentElement.classList.remove('longTitle')
    }
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, myValue, "nickName");
  }
  selectedModuleUpdateForControlUnit(selection) {
    if (selection == this.selectedControlUnit) { // the selection didn't change after the change event, do nothing
      // console.log(selection)
    } else {
      this.controlUnitAssets = [];
      this.controlUnitAssetsId = [];
      this.controlUnitAssetsType = [];
      this.controlUnitAssetsSubType = [];
      this.assetFeatureIndex = [];
      this.selectedControlUnit = selection;
      this.selectedControlUnitFeatures = [];
      this.selectedControlUnitFeaturesId = [];
      this.selectedControlUnitFeaturesRole = [];
      this.selectedControlUnitFeaturesRoleIndex = [];
      this.removable = true;
      let selectedControlUnitIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedControlUnit, "model", this.controlUnitDatabase);
      this.selectedControlUnitFeatures = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].feature));
      this.selectedControlUnitFeaturesId = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].featureId));
      this.selectedControlUnitFeaturesRole = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].featureRole));
      this.selectedControlUnitFeaturesType = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].featureType));
      this.selectedControlUnitFeaturesRole.forEach((currentFeatureRole, currentFeatureRoleIndex) => {
        this.selectedControlUnitFeaturesRoleIndex.push(this._editDesignShared.getFeatureRoleIndex(this.selectedControlUnitFeaturesType[currentFeatureRoleIndex], currentFeatureRole))
      })
      this.microFeatureChainId = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
      this.microFeatureChainName = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
      this.selectedControlUnitFeatureChainId = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
      this.selectedControlUnitFeatureChainName = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnit, "model");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnit, "module");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitDatabase[selectedControlUnitIndex]._id, "moduleId");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitDatabase[selectedControlUnitIndex]._id, "moduleIdInDb"); // the same as moduleId for controlUnit
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatures, "feature");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesId, "featureId");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRole, "featureRole");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRoleIndex, "featureRoleIndex");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesType, "featureType");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainId, "featureChainId");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainName, "featureChainName");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset"); // new module selection will clear all assets
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsType, "assetType");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsSubType, "assetSubType");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
      this._editDesignShared.updateControlUnitProperty(this.activeComponentId, false, "featureConfirmed");
      this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      // need to reset the commLine features
      let connectedLineId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "lineId");
      connectedLineId.forEach((lineId) => {
        let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
        let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
        let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
        let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
        let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
        let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
        terminalComponentFeatureArray[componentIndex] = [];
        terminalComponentFeatureIdArray[componentIndex] = [];
        terminalComponentFeatureIndexArray[componentIndex] = [];
        terminalComponentAssetAccessBoolean[componentIndex] = [];
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
      })
      this._snackBar.open("Confirm Features to commit security assets. Feature chain related to this component is removed.", "Features restored to default", {
        duration: 5000,
      })
      // this.moduleFeatureUpdateStatus = "Features have been set to database defaults. Confirm to commit security assets. If feature chains were set up in this component, they are removed."
    }
  };
  controlUnitSubmit() {
    this.controlUnitAssets = [];
    this.controlUnitAssetsType = [];
    this.controlUnitAssetsSubType = [];
    this.assetFeatureIndex = [];
    // console.log(`controlUnit features are ${this.selectedControlUnitFeatures}`)
    // retrieve assets and add them to the controlUnit
    let missingFeaturesArray = [];
    for (let i = 0; i < this.selectedControlUnitFeaturesId.length; i++) {
      if (!this.selectedControlUnitFeaturesId[i]) {
        missingFeaturesArray.push(this.selectedControlUnitFeatures[i])
      }
    }
    if (missingFeaturesArray.length == 1) {
      this._snackBar.open("This feature - " + missingFeaturesArray[0] +
        " - does not exist in your database. Please check the result carefully.", "Warning!", {
        duration: 5000,
      })
      // this.moduleFeatureUpdateStatus = "This feature - " + missingFeaturesArray[0] +
      //   " - does not exist in your database. Please check the result carefully."
    } else if (missingFeaturesArray.length > 1) {
      this._snackBar.open("These features - " + missingFeaturesArray.join() +
        " - do not exist in your database. Please check the result carefully.", "Warning!", {
        duration: 5000,
      })
      // this.moduleFeatureUpdateStatus = "These features - " + missingFeaturesArray.join() +
      //   " - do not exist in your database. Please check the result carefully."
    } else {
      this._snackBar.open("Features confirmed. Security assets updated!", "Successful!", {
        duration: 5000,
      })
      // this.moduleFeatureUpdateStatus = "Features confirmed. Security assets updated!"
    }
    // retrieve assets and add them to the controlUnit
    let controlUnitFeaturesString = this.selectedControlUnitFeaturesId.join();
    let controlUnitFeaturesRoleIndexString = this.selectedControlUnitFeaturesRoleIndex.join();
    let params = new HttpParams()
      .set("featureList", controlUnitFeaturesString)
      .set("featureRoleList", controlUnitFeaturesRoleIndexString);

    this._http
      .get(this.featureRootUrl + "/featureassetlib", { params: params })
      .toPromise()
      .then((res: any) => {
        // console.log(res)
        this.controlUnitAssets = res.asset;
        this.controlUnitAssetsId = res.assetId;
        this.controlUnitAssetsType = res.assetType;
        this.controlUnitAssetsSubType = res.assetSubType;
        this.assetFeatureIndex = res.index;
        if (res.missingFeaturesArray.length > 0) {
          let missingFeatureName = [];
          res.missingFeaturesArray.forEach((currentFeatureId) => {
            let featureIndex = this.selectedControlUnitFeaturesId.indexOf(currentFeatureId);
            missingFeatureName.push(this.selectedControlUnitFeatures[featureIndex]);
          })
          let notificationMsg = missingFeatureName.join("");
          this._snackBar.open("These features are missing from your database: " + notificationMsg, "", {
            duration: 5000,
          })
        }
      })
      .then((value) => {
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsType, "assetType");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsSubType, "assetSubType");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, true, "featureConfirmed");
        this.removable = false;
        let connectedLineId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "lineId");
        connectedLineId.forEach((lineId) => {
          let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
          let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
          let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
          terminalComponentAssetAccessBoolean[componentIndex] = new Array(this.controlUnitAssets.length).fill(false);
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
          let terminalComponentAssetAccessType = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessType");
          terminalComponentAssetAccessType[componentIndex] = null;
          this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessType, "terminalComponentAssetAccessType");
        })
        this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      })
      .catch((err) => {
        throwError(err)
      });
  };
  controlUnitFeatureDefault() { // reset controlUnit features and asset to default
    let selectedControlUnitIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedControlUnit, "model", this.controlUnitDatabase);
    this.selectedControlUnitFeatures = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].feature));
    this.selectedControlUnitFeaturesId = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].featureId));
    this.selectedControlUnitFeaturesRole = JSON.parse(JSON.stringify(this.controlUnitDatabase[selectedControlUnitIndex].featureRole));
    this.selectedControlUnitFeaturesType = this.controlUnitDatabase[selectedControlUnitIndex].featureType;
    this.selectedControlUnitFeaturesRoleIndex = []
    this.selectedControlUnitFeaturesRole.forEach((currentFeatureRole, currentFeatureRoleIndex) => {
      this.selectedControlUnitFeaturesRoleIndex.push(this._editDesignShared.getFeatureRoleIndex(this.selectedControlUnitFeaturesType[currentFeatureRoleIndex], currentFeatureRole))
    })
    this.selectedControlUnitFeaturesType = this.controlUnitDatabase[selectedControlUnitIndex].featureType;
    this.microFeatureChainId = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
    this.microFeatureChainName = new Array(this.microFeaturesId.length).fill(""); // reset the featureChainId for micro
    this.selectedControlUnitFeatureChainId = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
    this.selectedControlUnitFeatureChainName = new Array(this.selectedControlUnitFeaturesId.length).fill(""); // reset the featureChainId for controlUnit
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnit, "model");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnit, "module");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitDatabase[selectedControlUnitIndex]._id, "moduleId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitDatabase[selectedControlUnitIndex]._id, "moduleIdInDb"); // the same as moduleId for controlUnit
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatures, "feature");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesId, "featureId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRole, "featureRole");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRoleIndex, "featureRoleIndex");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesType, "featureType");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainId, "featureChainId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainName, "featureChainName");
    // need to check if commLine features align with the default features
    let affectedCommLineNameArray = [];
    let connectedLineId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "lineId");
    connectedLineId.forEach((lineId) => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
      let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
      let featureIndexArrayInCommLine = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      let featureMatch = true;
      // if all features in commLine exist in micro, and in the right place (same index), return true - no need to empty the commLine features.
      for (let i = 0; i < terminalComponentFeatureIdArray[componentIndex].length; i++) {
        featureMatch = (this.selectedControlUnitFeaturesId[featureIndexArrayInCommLine[componentIndex][i]] == terminalComponentFeatureIdArray[componentIndex][i]) && featureMatch;
        if (!featureMatch) {
          break
        }
      }
      // console.log(`featureMatch is ${featureMatch}`)
      if (featureMatch) { // if features in commLine match default features of the controlUnit, do nothing

      } else {
        let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
        let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
        terminalComponentFeatureArray[componentIndex] = [];
        terminalComponentFeatureIdArray[componentIndex] = [];
        terminalComponentFeatureIndexArray[componentIndex] = [];
        terminalComponentAssetAccessBoolean[componentIndex] = new Array(this.controlUnitAssets.length).fill(false);
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
        this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
        affectedCommLineNameArray.push(this._editDesignShared.getCommLineProperty(lineId, "nickName"))
      }
    })
    if (affectedCommLineNameArray.length == 0) { // if features stored in connected lines are the same as default feature
      this._snackBar.open("Features and assets have been restored to default.", "Features restored to default", {
        duration: 5000,
      })
    } else { // if default features differ from features stored in connected lines
      let warningText = `Features and assets have been restored to default. Please reset Accessible Features in these lines ${affectedCommLineNameArray}`;
      this._snackBar.open(warningText, "Warning", {
        duration: 10000,
      })
    }
    this.controlUnitAssets = [];
    this.controlUnitAssetsId = [];
    this.controlUnitAssetsType = [];
    this.controlUnitAssetsSubType = [];
    this.assetFeatureIndex = [];
    // retrieve assets and add them to the controlUnit
    let controlUnitFeaturesString = this.selectedControlUnitFeaturesId.join();
    let controlUnitFeaturesRoleIndexString = this.selectedControlUnitFeaturesRoleIndex.join();
    let params = new HttpParams()
      .set("featureList", controlUnitFeaturesString)
      .set("featureRoleList", controlUnitFeaturesRoleIndexString);

    this._http
      .get(this.featureRootUrl + "/featureassetlib", { params: params })
      .toPromise()
      .then((res: any) => {
        this.controlUnitAssets = res.asset;
        this.controlUnitAssetsId = res.assetId;
        this.controlUnitAssetsType = res.assetType;
        this.controlUnitAssetsSubType = res.assetSubType;
        this.assetFeatureIndex = res.index;
        if (res.missingFeaturesArray.length > 0) {
          let missingFeatureName = [];
          res.missingFeaturesArray.forEach((currentFeatureId) => {
            let featureIndex = this.selectedControlUnitFeaturesId.indexOf(currentFeatureId);
            missingFeatureName.push(this.selectedControlUnitFeatures[featureIndex]);
          })
          let notificationMsg = missingFeatureName.join("");
          this._snackBar.open("These features are missing from your database: " + notificationMsg, "", {
            duration: 5000,
          })
        }
      })
      .then((value) => {
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsType, "assetType");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsSubType, "assetSubType");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
        this._editDesignShared.updateControlUnitProperty(this.activeComponentId, true, "featureConfirmed");
        this.removable = false;
        this.adjustConfirmFeaturesBtnStatus(this.activeComponentId);
      })
      .catch((err) => {
        let missingFeaturesArray = [];
        for (let i = 0; i < this.selectedControlUnitFeaturesId.length; i++) {
          if (!this.selectedControlUnitFeaturesId[i]) {
            missingFeaturesArray.push(this.selectedControlUnitFeatures[i])
          }
        }
        if (missingFeaturesArray.length == 1) {
          this._snackBar.open("This feature - " + missingFeaturesArray[0] +
            " - does not exist in your database. Please check the result carefully.", "Warning!", {
            duration: 5000,
          })
        } else if (missingFeaturesArray.length > 1) {
          this._snackBar.open("These features - " + missingFeaturesArray.join() +
            " - do not exist in your database. Please check the result carefully.", "Warning!", {
            duration: 5000,
          })
        } else {
          this._snackBar.open("Features confirmed. Security assets updated!", "Successful!", {
            duration: 5000,
          })
        }
        throwError(err);
      });
  }
  // remove a control unit
  removeControlUnit() {
    this.lineConnectedComponentFeatures = this._editDesignShared.removeComponentFeaturesFromLine(this.lineConnectedComponentFeatures, this.activeComponentId)
    this._editDesignShared.closeSidePanel();
    // document.getElementById(this._editDesignShared.getComponentType(this.activeComponentId) + "PropertyPanel").style.display = "none";
    this._compVisual.removeComponentById(this.activeComponentId, this.newDesign);
    this._editDesignShared.removeControlUnit(this.activeComponentId);
    this.activeComponentId = "";
  };
  // chip list for software features. need to call from library
  addControlUnitFeature(event: MatChipInputEvent): void { // not used. content out of date
    const input = event.input;
    const value = event.value;
    // Add features
    if ((value || '').trim()) {
      this.selectedControlUnitFeatures.push(value.trim());
      this.selectedControlUnitFeaturesId.push("");
      this.selectedControlUnitFeaturesRole.push("");
      this.selectedControlUnitFeaturesType.push("");
      this.selectedControlUnitFeatureChainId.push("");
      this.selectedControlUnitFeatureChainName.push("");
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatures, "feature");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesId, "featureId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRole, "featureRole");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesType, "featureType");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainId, "featureChainId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainName, "featureChainName");
    // TODO: once adding feature from database is available, assets need to be added accordingly, without "Confirm Features" button. Otherwise it complicates featureChainId.
    this._snackBar.open("", "Successful!", {
      duration: 5000,
    })
    // this.moduleFeatureUpdateStatus = "You can only add features in the database management view. Security assets are not updated!"
  }
  removeControlUnitFeature(featureIndex: number): void {
    if (featureIndex >= 0) {
      this.selectedControlUnitFeatures.splice(featureIndex, 1);
      this.selectedControlUnitFeaturesId.splice(featureIndex, 1);
      this.selectedControlUnitFeatureChainId.splice(featureIndex, 1);
      this.selectedControlUnitFeatureChainName.splice(featureIndex, 1);
      this.selectedControlUnitFeaturesRole.splice(featureIndex, 1);
      this.selectedControlUnitFeaturesRoleIndex.splice(featureIndex, 1);
      this.selectedControlUnitFeaturesType.splice(featureIndex, 1);
    }
    this.assetFeatureIndex = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "assetFeatureIndex");
    let assetFeatureIndexTemp = []; // to build new assetFeatureIndex while looping assetFeatureIndex array
    this.assetFeatureIndex.forEach((element, ind) => {
      if (element == featureIndex) {
        this.controlUnitAssets.splice(ind, 1);
        this.controlUnitAssetsId.splice(ind, 1);
      } else if (element > featureIndex) {
        assetFeatureIndexTemp.push(element - 1); // new feature index should be reduced by 1
      } else if (element < featureIndex) {
        assetFeatureIndexTemp.push(element);
      }
    })
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, assetFeatureIndexTemp, "assetFeatureIndex");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatures, "feature");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesId, "featureId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRole, "featureRole");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesRoleIndex, "featureRoleIndex");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeaturesType, "featureType");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainId, "featureChainId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainName, "featureChainName");
    // the featureIndex is used by commLine to identify if a feature is accessible. So we also need to modify commLine properties
    let connectedCommLineArray = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "lineId"); // connected commLines
    connectedCommLineArray.forEach(lineId => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndexInCommLine = terminalComponentIdArray.indexOf(this.activeComponentId); // use this to identify the location of the component in terminalComponentFeature, etc.
      let terminalComponentFeatureArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeature");
      let terminalComponentFeatureIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureId");
      let terminalComponentFeatureIndexArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureIndex");
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      terminalComponentAssetAccessBoolean[componentIndexInCommLine] = new Array(this.controlUnitAssets.length).fill(false);
      let featureIndexInTerminalComponentFeature = terminalComponentFeatureIndexArray[componentIndexInCommLine].indexOf(featureIndex); // use this to identify the location of the feature in terminalComponentFeature[], etc.
      if (featureIndexInTerminalComponentFeature >= 0) { // if the removed feature is accessible from the commLine
        terminalComponentFeatureArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
        terminalComponentFeatureIdArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
        terminalComponentFeatureIndexArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
      }
      terminalComponentFeatureIndexArray[componentIndexInCommLine].forEach((element, elementIndex) => { // adjust the rest of the index
        if (element > featureIndex) { // index should be reduced by one if it's ranked after the deleted feature
          terminalComponentFeatureIndexArray[componentIndexInCommLine][elementIndex] = element - 1;
        }
      });
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureArray, "terminalComponentFeature");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIdArray, "terminalComponentFeatureId");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureIndexArray, "terminalComponentFeatureIndex");
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
      // let terminalComponentFeatureChainIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentFeatureChainId");
      // if (terminalComponentFeatureChainIdArray.length > 0) { // if feature chain exists, update it too
      //   terminalComponentFeatureChainIdArray[componentIndexInCommLine].splice(featureIndexInTerminalComponentFeature, 1);
      //   this._editDesignShared.updateCommLineProperty(lineId, terminalComponentFeatureChainIdArray, "terminalComponentFeatureChainId");
      // }
    });
    this._snackBar.open("Relevant security assets have been removed. No need to confirm features again!.", "Successful!", {
      duration: 5000,
    })
    // this.moduleFeatureUpdateStatus = "Security assets have been updated to accomodate the feature removal!"
  }
  controlUnitAttackSurfaceChange() {
    this.controlUnitAttackSurface = !this.controlUnitAttackSurface;
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAttackSurface, "attackSurface");
    // console.log(this._editDesignShared);
  };
  addControlUnitAsset(event: MatChipInputEvent): void { // not used. content out of date
    const input = event.input;
    const value = event.value;
    // Add microAssets
    if ((value || '').trim()) {
      this.controlUnitAssets.push(value.trim());
      this.controlUnitAssetsId.push("");
      // this.assetFeatureIndex.push();
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
    // this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetFeatureIndex");
  };
  removeControlUnitAsset(assetIndex: number): void {
    if (assetIndex >= 0) {
      this.controlUnitAssets.splice(assetIndex, 1);
      this.controlUnitAssetsId.splice(assetIndex, 1);
      this.controlUnitAssetsType.splice(assetIndex, 1);
      this.controlUnitAssetsSubType.splice(assetIndex, 1);
      this.assetFeatureIndex.splice(assetIndex, 1);
    }
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssets, "asset");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsId, "assetId");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsType, "assetType");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.controlUnitAssetsSubType, "assetSubType");
    this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
    // need to address terminalComponentAssetAccessBoolean in commLines if asset is removed from controlUnit
    let connectedLineId = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "lineId");
    connectedLineId.forEach((lineId) => {
      let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
      let componentIndex = terminalComponentIdArray.indexOf(this.activeComponentId);
      let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
      terminalComponentAssetAccessBoolean[componentIndex].splice(assetIndex, 1);
      this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
    })
  };
  controlUnitFeatureChipListClick(index) {
    if (this.controlUnitFeatureSelected[index]) {
      this.controlUnitFeatureSelected[index] = false;
    } else {
      this.controlUnitFeatureSelected.fill(false);
      this.controlUnitFeatureSelected[index] = true;
    }
    this.controlUnitFeatureEditDisable = !this.controlUnitFeatureSelected.includes(true);
  }
  controlUnitFeatureChainEdit() {
    let featureIndex = this.controlUnitFeatureSelected.findIndex(element => element);
    let controlUnitFeatureChainIdArray = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureChainId");
    let thisFeatureChainId = controlUnitFeatureChainIdArray[featureIndex]; // initialize featureChainId
    let thisFeatureChainName = "";
    let [involvedMicro, microFeatureIndex, microFeatureType] = this._editDesignShared.findMicroWithFeatureIdForFeatureChain(this.activeComponentId, this.selectedControlUnitFeaturesId[featureIndex], thisFeatureChainId, "featureType");
    let [involvedControlUnit, controlUnitIndex, controlUnitFeatureType] = this._editDesignShared.findControlUnitWithFeatureIdForFeatureChain(this.activeComponentId, this.selectedControlUnitFeaturesId[featureIndex], thisFeatureChainId, "featureType");
    let componentUnderEditIndex = this._arrOp.findStringIndexInArrayProperty(this.activeComponentId, "id", involvedControlUnit); // identify the location of the component under edit in the component array
    let involvedMicroFeatureRoles = [];
    let involvedMicroFeatureRolesIndex = [];
    microFeatureType.forEach((featureTypeItem) => {
      this.dynamicallyAssignFeatureRole(featureTypeItem);
      involvedMicroFeatureRoles.push(this.dynamicFeatureRole);
      involvedMicroFeatureRolesIndex.push(this._editDesignShared.getFeatureRoleIndex(featureTypeItem, this.dynamicFeatureRole));
    });
    let involvedControlUnitFeatureRoles = [];
    let involvedControlUnitFeatureRolesIndex = [];
    controlUnitFeatureType.forEach((featureTypeItem) => {
      this.dynamicallyAssignFeatureRole(featureTypeItem);
      involvedControlUnitFeatureRoles.push(this.dynamicFeatureRole);
      involvedControlUnitFeatureRolesIndex.push(this._editDesignShared.getFeatureRoleIndex(featureTypeItem, this.dynamicFeatureRole));
    });
    let confirmedMicroArray = [];
    let confirmedControlUnitArray = [];
    // console.log(`thisFeatureChainId is ${thisFeatureChainId}`)
    if (thisFeatureChainId) { // if this id exists, it means this feature was edited before
      this.selectedControlUnitFeatureChainName = this._editDesignShared.getControlUnitProperty(this.activeComponentId, "featureChainName");
      thisFeatureChainName = this.selectedControlUnitFeatureChainName[featureIndex];
      confirmedMicroArray = this._editDesignShared.checkMicroFeatureChainId(involvedMicro, thisFeatureChainId); // returns an array of booleans showing whether featureChainId exists
      confirmedControlUnitArray = this._editDesignShared.checkControlUnitFeatureChainId(involvedControlUnit, thisFeatureChainId); // returns an array of booleans showing whether featureChainId exists
      confirmedControlUnitArray[componentUnderEditIndex] = true; // the component under edit, by default, is part of the feature chain
    } else { // if this feature was not generated before
      thisFeatureChainId = this._arrOp.genRandomId(10); // generate a new id
      confirmedMicroArray = new Array(involvedMicro.length).fill(false);
      confirmedControlUnitArray = new Array(involvedControlUnit.length).fill(false);
      confirmedControlUnitArray[componentUnderEditIndex] = true; // the component under edit, by default, is part of the feature chain
    };
    let microDisabledArray = new Array(confirmedMicroArray.length).fill(false); // when editing a controlUnit, all micro components can be checked/unchecked
    let controlUnitDisabled = new Array(confirmedControlUnitArray.length).fill(false);
    controlUnitDisabled[componentUnderEditIndex] = true; // the component under edit has to be part of the feature chain. can't be modified
    // console.log(`controlUnitDisabled is ${controlUnitDisabled}`)
    const dialogRef = this.dialog.open(EditFeatureDialog, {
      width: "auto",
      height: "auto",
      maxWidth: "50em",
      maxHeight: "50em",
      // autoFocus: false,
      data: {
        activeComponentId: this.activeComponentId,
        activeComponentNickName: this._editDesignShared.getControlUnitProperty(this.activeComponentId, "nickName"),
        componentType: "controlUnit",
        featureIndex: featureIndex,
        featureName: this.selectedControlUnitFeatures[featureIndex],
        featureId: this.selectedControlUnitFeaturesId[featureIndex],
        featureType: controlUnitFeatureType[0], // micro and controlUnit must have the same feature type, so no need to differentiate
        involvedMicro: involvedMicro,
        involvedMicroFeatureIndex: microFeatureIndex,
        involvedMicroFeatureRoles: involvedMicroFeatureRoles, // for the dialog to identify available feature roles
        involvedMicroFeatureRolesIndex: involvedMicroFeatureRolesIndex,
        confirmedMicroArray: confirmedMicroArray, // for the check boxes in the dialog
        involvedControlUnit: involvedControlUnit,
        involvedControlUnitFeatureIndex: controlUnitIndex,
        involvedControlUnitFeatureRoles: involvedControlUnitFeatureRoles, // for the dialog to identify available feature roles
        involvedControlUnitFeatureRolesIndex: involvedControlUnitFeatureRolesIndex,
        confirmedControlUnitArray: confirmedControlUnitArray, // for the check boxes in the dialog
        featureChainId: thisFeatureChainId,
        featureChainName: thisFeatureChainName,
        microDisabled: microDisabledArray,
        controlUnitDisabled: controlUnitDisabled,
      },
    });
    this._snackBar.open("If security assets are affected, they are updated automatically. No need to confirm features again.", "Successful!", {
      duration: 5000,
    })
    dialogRef.afterClosed()
      .subscribe(result => {
        // console.log(result);
        if (result) {
          if (result.confirmed) { // if Confirm button was clicked in the feature chain edit dialog
            this.selectedControlUnitFeatureChainName[featureIndex] = result.featureChainName;
            this.selectedControlUnitFeatureChainId[featureIndex] = thisFeatureChainId;
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainName, "featureChainName");
            this._editDesignShared.updateControlUnitProperty(this.activeComponentId, this.selectedControlUnitFeatureChainId, "featureChainId");
          } else if (result.removed) { // if remove feature button was clicked

          }
        }
      })
  }

  //////////////////////////////////////////////
  // CommLine Panel
  /////////////////////////////////////////////
  commLinePropertyPanelTabClick(event: any) {
    if (event.index == 1) { // if Security Settings tab is clicked
      this.commLineAttackSurface = this._editDesignShared.getCommLineProperty(this.activeComponentId, "attackSurface");
    } else if (event.index == 0) { // if Component Spec tab is clicked
      this.transmissionMedia = this._editDesignShared.getCommLineProperty(this.activeComponentId, "transmissionMedia");
      this.refreshBaseProtocol(this.transmissionMedia);
      this.componentNickName = this._editDesignShared.getCommLineProperty(this.activeComponentId, "nickName");
      this.commLineSecureProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "secureProtocol");
      this.commLineAppProtocols = this._editDesignShared.getCommLineProperty(this.activeComponentId, "appProtocol");
      this.selectedCommLine = this._editDesignShared.getCommLineProperty(this.activeComponentId, "model");
      // this.lineConnectedComponents = this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalComponentId");
    }
  };
  commLineNickNameChange(myValue) {
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, myValue, "nickName");
  }
  textProtocolDisplayChange(display: boolean) {
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, display, "textProtocolDisplay");
    this._editDesignShared.showHideTextPosition({ show: display, commLineId: this.activeComponentId });
  }
  commLineBaseProtocolChange(selection) {
    if (selection == this.selectedCommLine) { // the selection didn't change after the change event, do nothing

    } else {
      this.selectedCommLine = selection;
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, selection, "baseProtocol");
      this.commLineAppProtocols = [];
      this.commLineSecureProtocols = [];
      this.commLineFeatures = [];
      this.commLineFeaturesId = [];
      this.commLineAssets = [];
      this.commLineAssetsId = [];
      this.commLineAssetsType = [];
      this.commLineAssetsSubType = [];
      this.assetFeatureIndex = [];
      let commLineModuleId = "";
      // model property, rather than baseProtocol property, of the commLineLib document is used in the Base protocol blank
      let modelIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedCommLine, "model", this.commLineDatabase);
      commLineModuleId = this.commLineDatabase[modelIndex].moduleIdInDb;
      for (let i = 0; i < this.commLineDatabase[modelIndex].appProtocol.length; i++) {
        this.commLineAppProtocols.push(this.commLineDatabase[modelIndex].appProtocol[i]);
      };
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAppProtocols, "appProtocol");
      for (let i = 0; i < this.commLineDatabase[modelIndex].secureProtocol.length; i++) {
        this.commLineSecureProtocols.push(this.commLineDatabase[modelIndex].secureProtocol[i]);
      };
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineSecureProtocols, "secureProtocol");
      for (let i = 0; i < this.commLineDatabase[modelIndex].feature.length; i++) {
        this.commLineFeatures.push(this.commLineDatabase[modelIndex].feature[i]);
        this.commLineFeaturesId.push(this.commLineDatabase[modelIndex].featureId[i]);
      };
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineFeatures, "feature");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineFeaturesId, "featureId");
      for (let i = 0; i < this.commLineDatabase[modelIndex].asset.length; i++) {
        this.commLineAssets.push(this.commLineDatabase[modelIndex].asset[i]);
        this.commLineAssetsId.push(this.commLineDatabase[modelIndex].assetId[i]);
        this.assetFeatureIndex.push(0);
      };
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssets, "asset");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsId, "assetId");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.selectedCommLine, "model");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.selectedCommLine, "module");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, commLineModuleId, "moduleIdInDb");

      this._http
        .get(this.assetRootUrl +
          `/assetLibByIds?assetIds=${JSON.stringify(this.commLineAssetsId)}`)
        .pipe(take(1))
        .subscribe(
          (res: any) => {
            if (res) {
              this.commLineAssetsId.forEach((assetId: string) => {
                const asset: any = res.find((singleAsset: any) => singleAsset._id == assetId);
                if (asset) {
                  this.commLineAssetsType.push(asset.assetType);
                  this.commLineAssetsSubType.push(asset.subType);
                }
              });
              this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsType, "assetType");
              this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsSubType, "assetSubType");
            }
          });
    }
  };
  transmissionMediaChange(selection) {
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, "", "baseProtocol");
    this.transmissionMedia = selection;
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.transmissionMedia, "transmissionMedia");
    // console.log(this.commLineDatabase);
    this.refreshBaseProtocol(selection);
  };
  refreshBaseProtocol(targetTransmissionMedia) {
    let targetTransmissionMediaIndex = this._arrOp.findStringIndexInArrayPropertyArray(targetTransmissionMedia, "transmissionMedia", this.commLineDatabase);
    this.commLineModels = [];
    if (targetTransmissionMediaIndex && targetTransmissionMediaIndex.length > 0) {
      targetTransmissionMediaIndex.forEach(element => {
        this.commLineModels.push(this.commLineDatabase[element].model);
      });
    }
  }

  // remove a comm line
  removeCommLine() {
    this._editDesignShared.closeSidePanel();
    this.terminalIds.emit(this._editDesignShared.getCommLineProperty(this.activeComponentId, "terminalId"))
    // if (this._editDesignShared.getCommLineProperty(this.activeComponentId, "sensorInput")) {
    //   document.getElementById("sensorInputPropertyPanel").style.display = "none";
    // } else {
    //   document.getElementById(this._editDesignShared.getComponentType(this.activeComponentId) + "PropertyPanel").style.display = "none";
    // }
    this._compVisual.removeComponentById(this.activeComponentId, this.newDesign);
    this._editDesignShared.removeCommLine(this.activeComponentId);
    this.activeComponentId = "";
  };
  // chip list for software features. need to call from library
  addCommLineAppProtocol(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add features
    if ((value || '').trim()) {
      this.commLineAppProtocols.push(value.trim());
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAppProtocols, "appProtocol");
  }
  removeCommLineAppProtocol(feature: string): void {
    const index = this.commLineAppProtocols.indexOf(feature);
    if (index >= 0) {
      this.commLineAppProtocols.splice(index, 1);
    }

    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAppProtocols, "appProtocol");
  }
  addCommLineSecureProtocol(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add features
    if ((value || '').trim()) {
      this.commLineSecureProtocols.push(value.trim());
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineSecureProtocols, "secureProtocol");
  }
  removeCommLineSecureProtocol(feature: string): void {
    const index = this.commLineSecureProtocols.indexOf(feature);
    if (index >= 0) {
      this.commLineSecureProtocols.splice(index, 1);
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineSecureProtocols, "secureProtocol");
  }

  featureCheckboxEvent(componentId, feature, featureId, event, featureIndex, componentIndex) {
    this._editDesignShared.updateLineFeatureCheckboxStatus(this.activeComponentId, componentId, feature, featureId, event, featureIndex);
    this.lineConnectedComponentFeatures[componentIndex].featureData[featureIndex].note = event;
    const assets = this.featureAssets.filter(obj => obj.componentId === componentId && obj.featureId === featureId);
    if (assets == null) {
      return;
    }
    assets.forEach(t => t.checked = event);
    let index = 0;
    if (featureIndex > 0) {
      const previousIndexes: number = this.countPreviousFeaturesAssets(featureIndex, componentIndex, componentId);
      index = index + previousIndexes;
    }
    const lastIndex: number = (index + assets.length)
    for (let i = index; i < lastIndex; i++) {
      this.terminalComponentAssetAccessBoolean[componentIndex][i] = event;
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
  };

  commLineAttackSurfaceChange() {
    this.commLineAttackSurface = !this.commLineAttackSurface;
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAttackSurface, "attackSurface");
    // console.log(this._editDesignShared);
  };
  addCommLineAsset(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add commLineAssets
    if ((value || '').trim()) {
      this.commLineAssets.push(value.trim());
      this.commLineAssetsId.push("");
      this.commLineAssetsType.push("");
      this.commLineAssetsSubType.push("");
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssets, "asset");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsId, "assetId");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsType, "assetType");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsSubType, "assetSubType");
  };
  removeCommLineAsset(asset: string): void {
    const index = this.commLineAssets.indexOf(asset);
    if (index >= 0) {
      this.commLineAssets.splice(index, 1);
      this.commLineAssetsId.splice(index, 1);
      this.commLineAssetsType.splice(index, 1);
      this.commLineAssetsSubType.splice(index, 1);
      this.assetFeatureIndex.splice(index, 1);
    }
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssets, "asset");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsId, "assetId");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsType, "assetType");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.commLineAssetsSubType, "assetSubType");
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.assetFeatureIndex, "assetFeatureIndex");
  };

  //////////////////////////////////////////////
  // Sensor Input Panel
  /////////////////////////////////////////////
  sensorInputPropertyPanelTabClick(event: any) {
    if (event.index == 1) { // if Security Settings tab is clicked
      this.commLineAttackSurface = this._editDesignShared.getCommLineProperty(this.activeComponentId, "attackSurface");
    } else if (event.index == 0) { // if Component Spec tab is clicked
      this.transmissionMedia = this._editDesignShared.getCommLineProperty(this.activeComponentId, "transmissionMedia");
      this.refreshSensorInputBaseProtocol(this.transmissionMedia);
      this.componentNickName = this._editDesignShared.getCommLineProperty(this.activeComponentId, "nickName");
      this.commLineSecureProtocols = [];
      this.commLineAppProtocols = [];
      this.selectedCommLine = this._editDesignShared.getCommLineProperty(this.activeComponentId, "model");
    }
  };
  sensorInputTransmissionMediaChange(selection) {
    this.transmissionMedia = selection;
    this.selectedCommLine = "";
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.transmissionMedia, "transmissionMedia");
    // console.log(this.transmissionMedia);
    this.refreshSensorInputBaseProtocol(this.transmissionMedia);
    this._editDesignShared.updateCommLineProperty(this.activeComponentId, "", "baseProtocol");
  };
  sensorInputBaseProtocolChange(selection) {
    if (selection == this.selectedCommLine) { // the selection didn't change after the change event, do nothing

    } else {
      this.selectedCommLine = selection;
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, selection, "baseProtocol");
      let commLineModuleId = "";
      // model property, rather than baseProtocol property, of the commLineLib document is used in the Base protocol blank
      let modelIndex = this._arrOp.findStringIndexInArrayProperty(this.selectedCommLine, "model", this.sensorInputDatabase);
      commLineModuleId = this.sensorInputDatabase[modelIndex].moduleIdInDb;
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.selectedCommLine, "model");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, this.selectedCommLine, "module");
      this._editDesignShared.updateCommLineProperty(this.activeComponentId, commLineModuleId, "moduleIdInDb");
    }
  };
  refreshSensorInputBaseProtocol(targetTransmissionMedia) {
    // console.dir(this.sensorInputDatabase);
    // console.log(targetTransmissionMedia)
    let targetTransmissionMediaIndex = this._arrOp.findStringIndexInArrayPropertyArray(targetTransmissionMedia, "transmissionMedia", this.sensorInputDatabase);
    // console.log(targetTransmissionMediaIndex)
    this.sensorInputModels = [];
    if (targetTransmissionMediaIndex && targetTransmissionMediaIndex.length > 0) {
      targetTransmissionMediaIndex.forEach(element => {
        this.sensorInputModels.push(this.sensorInputDatabase[element].model);
      });
    }
  };
  //////////////////////////////////////////////
  // Boundary Panel
  /////////////////////////////////////////////

  boundaryPropertyPanelTabClick(event) {
    if (event.index == 1) { // if Security Settings tab is clicked

    } else if (event.index == 0) { // if Component Spec tab is clicked

    }
  }

  boundaryNickNameChange(event) {
    setTimeout(() => {
      this._editDesignShared.updateBoundaryProperty(this.activeComponentId, this.componentNickName, "nickName");
    }, 1000)

  }

  boundaryEnableStatusChange(event) {
    this.boundaryEnable = event.checked;
    this._editDesignShared.updateBoundaryProperty(this.activeComponentId, this.boundaryEnable, "enable");
    // console.log(this.newDesign);
  }

  // remove a boundary
  removeBoundary() {
    this._editDesignShared.closeSidePanel();
    // document.getElementById(this._editDesignShared.getComponentType(this.activeComponentId) + "PropertyPanel").style.display = "none";
    this._compVisual.removeComponentById(this.activeComponentId, this.newDesign);
    this._editDesignShared.removeBoundary(this.activeComponentId);
    this.activeComponentId = "";
  };

  //////////////////////////////////////////////
  // reusable functions
  /////////////////////////////////////////////
  assignControlUnitDatabaseAndGroups() {
    // console.log("assignControlUnitDatabase function executed")
    this.controlUnitDatabase = [];
    this._http
      .get(this.componentRootUrl + "/controlunitlib")
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: any) => {
        // this.controlUnitDatabase.category = res.category;
        // this.controlUnitDatabase.model = res.model;
        // this.controlUnitDatabase._id = res._id;
        // console.log(res);
        if (res.length > 0) {
          let moduleIdList = [];
          for (let i = 0; i < res.length; i++) {
            this.controlUnitDatabase.push({
              category: res[i].category, // controlUnitDatabase's .category .model ._id properties are populated directly
              model: res[i].model, // controlUnitDatabase's .feature .featureId .featureType .featureRole properties are assembled below
              _id: res[i]._id,
              feature: [],
              featureId: [],
              featureType: [],
              featureRole: [],
              featureRoleIndex: []
            })
            // this.controlUnitDatabase.push(res[i]);
            // the following code is to compose the object controlUnitGroups...
            // ...so that the component can be sorted by category in the module list
            let tempIndexCat = this._arrOp.findStringIndexInArrayProperty(res[i].category, "category", this.controlUnitGroups);
            if (tempIndexCat == undefined) {
              this.controlUnitGroups.push({
                category: res[i].category,
                model: [],
                modelId: [],
              })
            }
            tempIndexCat = this._arrOp.findStringIndexInArrayProperty(res[i].category, "category", this.controlUnitGroups);
            let tempIndexModel = this._arrOp.findStringIndexInArray(res[i].model, this.controlUnitGroups[tempIndexCat].model);
            if (tempIndexModel == undefined) {
              this.controlUnitGroups[tempIndexCat].model.push(res[i].model);
              this.controlUnitGroups[tempIndexCat].modelId.push(res[i]._id);
            }
            moduleIdList.push(this.controlUnitDatabase[i]._id)
          }
          // assemble the feature properties of controlUnitDatabase
          this._http
            .post(this.featureRootUrl + "/featureimpactlibgroup", { moduleIdList: moduleIdList })
            .pipe(take(1))
            .subscribe((res: any) => {
              res.forEach((currentModule) => {
                let matchModuleIndex = this.controlUnitDatabase.findIndex((controlUnitItem) => controlUnitItem._id == currentModule.moduleId);
                this.controlUnitDatabase[matchModuleIndex].feature.push(currentModule.feature);
                this.controlUnitDatabase[matchModuleIndex].featureId.push(currentModule.featureId);
                this.controlUnitDatabase[matchModuleIndex].featureType.push(currentModule.featureType);
                this.controlUnitDatabase[matchModuleIndex].featureRole.push(currentModule.featureRole);
                const currentFeatureRoleIndex = this._editDesignShared.getFeatureRoleIndex(currentModule.featureType, currentModule.featureRole);
                this.controlUnitDatabase[matchModuleIndex].featureRoleIndex.push(currentFeatureRoleIndex);
              })
            })
        } else {
          this._snackBar.open(res.msg, "", {
            duration: 5000,
          })
        }
      });
    // console.log(this.controlUnitDatabase);
  }
  dynamicallyAssignFeatureRole(inputFeatureType) {
    this.dynamicFeatureRole = this._editDesignShared.dynamicallyAssignFeatureRole(inputFeatureType);
  }
  checkFeatureConfirmed(componentId): boolean {
    let componentType = this._editDesignShared.getComponentType(componentId);
    if (componentType == "micro") {
      return this._editDesignShared.getMicroProperty(componentId, "featureConfirmed")
    } else if (componentType == "controlUnit") {
      return this._editDesignShared.getControlUnitProperty(componentId, "featureConfirmed")
    }
  };
  adjustConfirmFeaturesBtnStatus(componentId) { // if features are already confirmed, disable the button and show "Features Confirmed".
    if (this.checkFeatureConfirmed(componentId)) {
      this.confirmFeatureBtnDisable = true;
      this.confirmFeatureBtnTxt = "Features Confirmed";
    } else {
      this.confirmFeatureBtnDisable = false;
      this.confirmFeatureBtnTxt = "Confirm Features";
    }
  }
}

// dialog to edit a feature
@Component({
  selector: 'property-panel-component-dialog-edit-feature',
  templateUrl: './property-panel.component.dialog.edit.feature.html',
  styleUrls: ['./property-panel.component.css']
})
export class EditFeatureDialog {

  constructor(private _ArrOp: ArrOpService, private _editDesignShared: DesignSettingsService,
    public dialogRef: MatDialogRef<EditFeatureDialog>, private _http: HttpClient, private _router: Router,
    private _confirmDialogService: ConfirmDialogService, private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public dataInput: any) {

    // dialogRef.beforeClosed().subscribe(() => dialogRef.close({featureChainName: "", confirmed: false}));
  }

  public project: ProjectType = { id: "" };
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  private unsubscribe: Subject<void> = new Subject();
  dialogTitle = "Editing Feature Chain: " + this.dataInput.featureName;
  involvedMicroTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedMicro)); // these temporary arrays are for user editing. original data are preserved for recovery
  involvedMicroFeatureIndexTempArray = [...this.dataInput.involvedMicroFeatureIndex];
  involvedMicroFeatureRolesTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedMicroFeatureRoles));
  involvedMicroFeatureRolesIndexTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedMicroFeatureRolesIndex));
  involvedControlUnitTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedControlUnit));
  involvedControlUnitFeatureIndexTempArray = [...this.dataInput.involvedControlUnitFeatureIndex];
  involvedControlUnitFeatureRolesTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedControlUnitFeatureRoles));
  involvedControlUnitFeatureRolesIndexTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedControlUnitFeatureRolesIndex));
  featureType = this.dataInput.featureType;
  featureChainName = this.dataInput.featureChainName;
  confirmedMicroTempArray = this.dataInput.confirmedMicroArray;
  confirmedControlUnitTempArray = this.dataInput.confirmedControlUnitArray;
  readonly featureRootUrl = environment.backendApiUrl + "features";


  ngOnInit() {
    this._editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => this.newDesign = designData);
    // console.log(`involvedMicro are ${this.involvedMicroTempArray}`)
    // console.dir(this.involvedMicroTempArray)
    // console.log(`involvedControlUnit are ${this.involvedControlUnitTempArray}`)
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  cancelEditFeature() {
    this.recoverComponents();
    this._snackBar.open("Operation canceled.", "Canceled!", {
      duration: 5000,
    })
    this.dialogRef.close();
    // this.dialogRef.close({featureChainName: this.featureChainName, confirmed: false});
  }
  confirmEditFeature() {
    this.involvedMicroTempArray.forEach((element, index) => {
      let microId = element.id;
      let featureIndex = this.involvedMicroFeatureIndexTempArray[index];
      let newFeatureRoleArray = [...this._editDesignShared.getMicroProperty(microId, "featureRole")];
      // console.log(this.involvedMicroTempArray[index].featureRole[this.involvedMicroFeatureIndexTempArray[index]]);
      // if feature role of this micro has been changed
      if (newFeatureRoleArray[featureIndex] != this.involvedMicroTempArray[index].featureRole[featureIndex]) {
        let newFeatureRoleIndexArray = this._editDesignShared.getMicroProperty(microId, "featureRoleIndex");
        newFeatureRoleArray[featureIndex] = this.involvedMicroTempArray[index].featureRole[featureIndex]; // update the feature role in featureRole array
        newFeatureRoleIndexArray[featureIndex] = this.involvedMicroTempArray[index].featureRoleIndex[featureIndex]; //
        this._editDesignShared.updateMicroProperty(microId, newFeatureRoleArray, "featureRole"); // update the design with the new featureRole array
        this._editDesignShared.updateMicroProperty(microId, newFeatureRoleIndexArray, "featureRoleIndex"); //
        let microFeatureConfirmationStatus = this._editDesignShared.getMicroProperty(microId, "featureConfirmed");
        if (microFeatureConfirmationStatus) { // if Features of this micro have been confirmed, changing feature roles will affect assets
          let microAssets = this._editDesignShared.getMicroProperty(microId, "asset");
          let featureAssets = [];
          let microAssetsId = this._editDesignShared.getMicroProperty(microId, "assetId");
          let featureAssetsId = [];
          let microTypes = this._editDesignShared.getMicroProperty(microId, "assetType")
          let featureAssetType = [];
          let microSubTypes = this._editDesignShared.getMicroProperty(microId, "assetSubType")
          let featureAssetSubType = [];
          let originalAssetFeatureIndexArray = this._editDesignShared.getMicroProperty(microId, "assetFeatureIndex");
          let originalFeatureAssetCount = this._ArrOp.countOccurrence(originalAssetFeatureIndexArray, featureIndex);
          let originalFeatureAssetStartingIndex = originalAssetFeatureIndexArray.indexOf(featureIndex);
          // retrieve assets of the new feature role
          let microFeatureIdArray = this._editDesignShared.getMicroProperty(microId, "featureId");
          let microFeaturesString = [microFeatureIdArray[featureIndex]].join();
          let microFeaturesRoleIndexString = [newFeatureRoleIndexArray[featureIndex]].join();
          let params = new HttpParams()
            .set("featureList", microFeaturesString)
            .set("featureRoleList", microFeaturesRoleIndexString);
          this._http
            .get(this.featureRootUrl + "/featureassetlib", { params: params })
            .toPromise()
            .then((res: any) => {
              // console.log(res)
              if (res.missingFeaturesArray.length > 0) {
                this._snackBar.open("Feature " + this.dataInput.featureName + " is missing from your database.", "", {
                  duration: 5000,
                })
              }
              featureAssets = res.asset;
              featureAssetsId = res.assetId;
              featureAssetType = res.assetType;
              featureAssetSubType = res.assetSubType;
              // replace all assets from the original feature role with assets from the new feature role
              // console.log(`microAssets is ${microAssets}`)
              microAssets.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssets);
              microAssetsId.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetsId);
              microTypes.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetType);
              microSubTypes.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetSubType);
              this._editDesignShared.updateMicroProperty(microId, microAssets, "asset");
              this._editDesignShared.updateMicroProperty(microId, microAssetsId, "assetId");
              this._editDesignShared.updateMicroProperty(microId, microTypes, "assetType");
              this._editDesignShared.updateMicroProperty(microId, microSubTypes, "assetSubType");
              let newAssetFeatureIndexSnippet = new Array(featureAssets.length).fill(featureIndex);
              originalAssetFeatureIndexArray.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...newAssetFeatureIndexSnippet);
              this._editDesignShared.updateMicroProperty(microId, originalAssetFeatureIndexArray, "assetFeatureIndex");
              // update the terminalComponentAssetAccessBoolean property in connected commLines
              let connectedLineId = this._editDesignShared.getMicroProperty(microId, "lineId");
              connectedLineId.forEach((lineId) => {
                let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
                let componentIndex = terminalComponentIdArray.indexOf(microId);
                let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
                let newAssetBooleanSnippet = new Array(featureAssets.length).fill(true);
                terminalComponentAssetAccessBoolean[componentIndex].splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...newAssetBooleanSnippet);
                this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
              })
            })
        }
      }
      let newFeatureChainIdArray = this._editDesignShared.getMicroProperty(microId, "featureChainId");
      let newFeatureChainNameArray = this._editDesignShared.getMicroProperty(microId, "featureChainName");
      let newFeatureNameArray = this._editDesignShared.getMicroProperty(microId, "feature");
      if (this.confirmedMicroTempArray[index]) { // if this component is checked
        if (newFeatureChainIdArray[featureIndex]) { // if the feature chain was created before, only update feature chain name
          newFeatureChainNameArray.splice(featureIndex, 1, this.featureChainName); // replace the current featureChainName
          this._editDesignShared.updateMicroProperty(microId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        } else { // if the feature chain is new to this component
          newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex] + "*"; // chained features are displayed with a *
          this._editDesignShared.updateMicroProperty(microId, newFeatureNameArray, "feature"); // update the design with the new feature name array
          newFeatureChainIdArray.splice(featureIndex, 1, this.dataInput.featureChainId); // replace the current featureChainId
          this._editDesignShared.updateMicroProperty(microId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
          newFeatureChainNameArray.splice(featureIndex, 1, this.featureChainName); // replace the current featureChainName
          this._editDesignShared.updateMicroProperty(microId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        }
      } else { // if unchecked
        if (newFeatureChainIdArray[featureIndex]) { // if the feature chain was created before, remove all feature chain related information
          newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex].slice(0, -1); // remove the last character, *
          this._editDesignShared.updateMicroProperty(microId, newFeatureNameArray, "feature"); // update the design with the new feature name array
          newFeatureChainIdArray.splice(featureIndex, 1, ""); // replace featureChainId with empty string
          this._editDesignShared.updateMicroProperty(microId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
          newFeatureChainNameArray.splice(featureIndex, 1, ""); //  replace featureChainName with empty string
          this._editDesignShared.updateMicroProperty(microId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        } else { // if it was never checked, do nothing

        }
      }
    });
    this.involvedControlUnitTempArray.forEach((element, index) => {
      let controlUnitId = element.id;
      let featureIndex = this.involvedControlUnitFeatureIndexTempArray[index];
      let newFeatureRoleArray = [...this._editDesignShared.getControlUnitProperty(controlUnitId, "featureRole")];
      // if feature role of this control unit has been changed
      if (newFeatureRoleArray[featureIndex] != this.involvedControlUnitTempArray[index].featureRole[featureIndex]) {
        let newFeatureRoleIndexArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureRoleIndex");
        newFeatureRoleArray[featureIndex] = this.involvedControlUnitTempArray[index].featureRole[featureIndex]; // update the feature role in featureRole array
        newFeatureRoleIndexArray[featureIndex] = this.involvedControlUnitTempArray[index].featureRoleIndex[featureIndex]; // update the feature role in featureRole array
        this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureRoleArray, "featureRole"); // update the design with the new featureRole array
        this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureRoleIndexArray, "featureRoleIndex"); //
        let controlUnitFeatureConfirmationStatus = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureConfirmed")
        if (controlUnitFeatureConfirmationStatus) { // if Features of this control unit have been confirmed, changing feature roles will affect assets
          let componentAssets = this._editDesignShared.getControlUnitProperty(controlUnitId, "asset");
          let featureAssets = [];
          let componentAssetsId = this._editDesignShared.getControlUnitProperty(controlUnitId, "assetId");
          let featureAssetsId = [];
          let componentAssetType = this._editDesignShared.getControlUnitProperty(controlUnitId, "assetType");
          let featureAssetType = [];
          let componentAssetSubType = this._editDesignShared.getControlUnitProperty(controlUnitId, "assetSubType");
          let featureAssetSubType = [];
          let originalAssetFeatureIndexArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "assetFeatureIndex");
          let originalFeatureAssetCount = this._ArrOp.countOccurrence(originalAssetFeatureIndexArray, featureIndex);
          let originalFeatureAssetStartingIndex = originalAssetFeatureIndexArray.indexOf(featureIndex);
          // retrieve assets of the new feature role
          let componentFeatureIdArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureId");
          let componentFeaturesString = [componentFeatureIdArray[featureIndex]].join();
          let componentFeaturesRoleIndexString = [newFeatureRoleIndexArray[featureIndex]].join();
          let params = new HttpParams()
            .set("featureList", componentFeaturesString)
            .set("featureRoleList", componentFeaturesRoleIndexString);
          this._http
            .get(this.featureRootUrl + "/featureassetlib", { params: params })
            .toPromise()
            .then((res: any) => {
              // console.log(res)
              if (res.missingFeaturesArray.length > 0) {
                this._snackBar.open("Feature " + this.dataInput.featureName + " is missing from your database.", "", {
                  duration: 5000,
                })
              }
              featureAssets = res.asset;
              featureAssetsId = res.assetId;
              featureAssetType = res.assetType;
              featureAssetSubType = res.assetSubType;
              // replace all assets from the original feature role with assets from the new feature role
              componentAssets.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssets);
              componentAssetsId.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetsId);
              componentAssetType.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetType);
              componentAssetSubType.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...featureAssetSubType);
              this._editDesignShared.updateControlUnitProperty(controlUnitId, componentAssets, "asset");
              this._editDesignShared.updateControlUnitProperty(controlUnitId, componentAssetsId, "assetId");
              this._editDesignShared.updateControlUnitProperty(controlUnitId, componentAssetType, "assetType");
              this._editDesignShared.updateControlUnitProperty(controlUnitId, componentAssetSubType, "assetSubType");

              let newAssetFeatureIndexSnippet = new Array(featureAssets.length).fill(featureIndex);
              originalAssetFeatureIndexArray.splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...newAssetFeatureIndexSnippet);
              this._editDesignShared.updateControlUnitProperty(controlUnitId, originalAssetFeatureIndexArray, "assetFeatureIndex");
              // update the terminalComponentAssetAccessBoolean property in connected commLines
              let connectedLineId = this._editDesignShared.getControlUnitProperty(controlUnitId, "lineId");
              connectedLineId.forEach((lineId) => {
                let terminalComponentIdArray = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentId");
                let componentIndex = terminalComponentIdArray.indexOf(controlUnitId);
                let terminalComponentAssetAccessBoolean = this._editDesignShared.getCommLineProperty(lineId, "terminalComponentAssetAccessBoolean");
                let newAssetBooleanSnippet = new Array(featureAssets.length).fill(true);
                terminalComponentAssetAccessBoolean[componentIndex].splice(originalFeatureAssetStartingIndex, originalFeatureAssetCount, ...newAssetBooleanSnippet);
                this._editDesignShared.updateCommLineProperty(lineId, terminalComponentAssetAccessBoolean, "terminalComponentAssetAccessBoolean");
              })
            })
        }
      }
      let newFeatureChainIdArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureChainId");
      let newFeatureChainNameArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureChainName");
      let newFeatureNameArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "feature");
      if (this.confirmedControlUnitTempArray[index]) { // if this component is checked
        if (newFeatureChainIdArray[featureIndex]) { // if the feature chain was created before, only update feature chain name
          newFeatureChainNameArray.splice(featureIndex, 1, this.featureChainName); // replace the current featureChainName
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        } else { // if the feature chain is new to this component
          newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex] + "*"; // chained features are displayed with a *
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureNameArray, "feature"); // update the design with the new feature name array
          newFeatureChainIdArray.splice(featureIndex, 1, this.dataInput.featureChainId); // replace the current featureChainId
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
          newFeatureChainNameArray.splice(featureIndex, 1, this.featureChainName); // replace the current featureChainName
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        }
      } else { // if unchecked
        if (newFeatureChainIdArray[featureIndex]) { // if the feature chain was created before, remove all feature chain related information
          newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex].slice(0, -1); // remove the last character, *
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureNameArray, "feature"); // update the design with the new feature name array
          newFeatureChainIdArray.splice(featureIndex, 1, ""); // replace featureChainId with empty string
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
          newFeatureChainNameArray.splice(featureIndex, 1, ""); //  replace featureChainName with empty string
          this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
        } else { // if it was never checked, do nothing

        }
      }
    });
    this._snackBar.open("If security assets are affected, they are updated automatically. No need to confirm features again.", "Successful!", {
      duration: 5000,
    })
    this.dialogRef.close();
    // this.dialogRef.close({
    //   confirmed: true,
    //   featureChainName: this.featureChainName,
    // });
  }
  microFeatureRoleChange(myEvent, index) {
    let featureIndex = this.involvedMicroFeatureIndexTempArray[index];
    this.involvedMicroTempArray[index].featureRole[featureIndex] = myEvent.value;
    this.involvedMicroTempArray[index].featureRoleIndex[featureIndex] = this._editDesignShared.getFeatureRoleIndex(this.featureType, myEvent.value);
  }
  controlUnitFeatureRoleChange(myEvent, index) {
    let featureIndex = this.involvedControlUnitFeatureIndexTempArray[index];
    this.involvedControlUnitTempArray[index].featureRole[featureIndex] = myEvent.value;
    this.involvedControlUnitTempArray[index].featureRoleIndex[featureIndex] = this._editDesignShared.getFeatureRoleIndex(this.featureType, myEvent.value);
  }
  removeFeatureChain() {
    this.involvedMicroTempArray.forEach((element, index) => {
      let microId = element.id;
      let featureIndex = this.involvedMicroFeatureIndexTempArray[index];
      let newFeatureChainIdArray = this._editDesignShared.getMicroProperty(microId, "featureChainId");
      let newFeatureChainNameArray = this._editDesignShared.getMicroProperty(microId, "featureChainName");
      let newFeatureNameArray = this._editDesignShared.getMicroProperty(microId, "feature");
      if (newFeatureChainIdArray[featureIndex] != "") { // if featureChainId was assigned before, need to remove the *
        newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex].slice(0, -1); // remove the last character, *
      }
      newFeatureChainNameArray.splice(featureIndex, 1, ""); // replace the current featureChainName with ""
      newFeatureChainIdArray.splice(featureIndex, 1, ""); // replace the current featureChainId with ""
      this._editDesignShared.updateMicroProperty(microId, newFeatureNameArray, "feature"); // update the design with the new feature name array
      this._editDesignShared.updateMicroProperty(microId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
      this._editDesignShared.updateMicroProperty(microId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
    });
    this.involvedControlUnitTempArray.forEach((element, index) => {
      let controlUnitId = element.id;
      let featureIndex = this.involvedControlUnitFeatureIndexTempArray[index];
      let newFeatureChainIdArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureChainId");
      let newFeatureChainNameArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "featureChainName");
      let newFeatureNameArray = this._editDesignShared.getControlUnitProperty(controlUnitId, "feature");
      if (newFeatureChainIdArray[featureIndex] != "") { // if featureChainId was assigned before, need to remove the *
        newFeatureNameArray[featureIndex] = newFeatureNameArray[featureIndex].slice(0, -1); // remove the last character, *
      }
      newFeatureChainNameArray.splice(featureIndex, 1, ""); // replace the current featureChainName with ""
      newFeatureChainIdArray.splice(featureIndex, 1, ""); // replace the current featureChainId with ""
      this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureNameArray, "feature"); // update the design with the new feature name array
      this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainIdArray, "featureChainId"); // update the design with the new featureChainId array
      this._editDesignShared.updateControlUnitProperty(controlUnitId, newFeatureChainNameArray, "featureChainName"); // update the design with the new featureChainName array
    });
    this.recoverComponents();
    this._snackBar.open("Feature chain removed, but prior changes of feature roles stay. Please check security assets carefully.", "Successful!", {
      duration: 5000,
    })
    this.dialogRef.close();
  }
  recoverComponents() { // recover deleted components, but doesn't recover changes made to feature roles
    this.involvedMicroTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedMicro));
    this.involvedMicroFeatureIndexTempArray = this.dataInput.involvedMicroFeatureIndex;
    this.involvedMicroFeatureRolesTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedMicroFeatureRoles));
    this.involvedControlUnitTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedControlUnit));
    this.involvedControlUnitFeatureIndexTempArray = this.dataInput.involvedControlUnitFeatureIndex;
    this.involvedControlUnitFeatureRolesTempArray = JSON.parse(JSON.stringify(this.dataInput.involvedControlUnitFeatureRoles));
    this.featureChainName = this.dataInput.featureChainName;
    this.confirmedMicroTempArray = this.dataInput.confirmedMicroArray;
    this.confirmedControlUnitTempArray = this.dataInput.confirmedControlUnitArray;
  }
}