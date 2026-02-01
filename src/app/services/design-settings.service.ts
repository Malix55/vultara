import { ArrOpService } from './arr-op.service';
import { ComponentList, ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentBoundary, ProjectType, MatrixType, ValueAndViewValue } from './../../threatmodel/ItemDefinition';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DesignSettingsService {
  // public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  // public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  // public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  // public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  // private newDesignShared = new BehaviorSubject(new ComponentList(this.microList, this.controlUnitList, this.lineList, this.boundaryList));
  // private _projectProperty = new BehaviorSubject<projectType>({id: ""});
  private _newDesignShared = new BehaviorSubject(new ComponentList({ id: "" }, [], [], [], []));
  private _sidePanelOpened = new BehaviorSubject<boolean>(false);
  private _updateProtocolTextPosition = new BehaviorSubject<boolean>(false);
  private projectId$ = new BehaviorSubject<string>('');

  addToDesign = this._newDesignShared.asObservable();
  sidePanelStatus = this._sidePanelOpened.asObservable();
  updateProtocolTextPosition = this._updateProtocolTextPosition.asObservable();
  projectIdObservable = this.projectId$.asObservable();
  // projectProperty = this._projectProperty.asObservable();
  projectStatus: any;
  public assetTypes = [
    // for display
    { value: "dataInTransit", viewValue: "Data In Transit" },
    { value: "dataAtRest", viewValue: "Data At Rest" },
    { value: "process", viewValue: "Software Function / Process" },
    { value: "computingResource", viewValue: "Computing Resource" },
    { value: "memoryResource", viewValue: "Memory Resource" },
    { value: "bandwidth", viewValue: "Communication Line Bandwidth" },
    // {value: "counter", viewValue: "Counter"},
    // {value: "secretKey", viewValue: "Secret Key"},
    // {value: "certificate", viewValue: "Certificate"},
    // {value: "token", viewValue: "Security Token"},
    // {value: "publicKey", viewValue: "Public Key"},
    // {value: "time", viewValue: "Timestamp"},
    // {value: "address", viewValue: "Address / Address Table"},
  ];

  public assetSubTypes = [
    { value: "generalData", viewValue: "General Data" },
    { value: "code", viewValue: "Code" },
    { value: "configData", viewValue: "Configuration Data" },
    { value: "securityData", viewValue: "Security Data" },
    { value: "log", viewValue: "Log" },
  ];

  public assetSubTypesTransit = [
    { value: "generalData", viewValue: "General Data" },
    { value: "configData", viewValue: "Configuration Data" },
    { value: "securityData", viewValue: "Security Data" },
    { value: "log", viewValue: "Log" }
  ];

  constructor(private _ArrOp: ArrOpService) { }

  // Update protocol text position when necessary
  public showHideTextPosition(visibilityProperty: any) {
    this._updateProtocolTextPosition.next(visibilityProperty);
  }

  public setProjectStatus(projectId: any) {
    if (localStorage.getItem("projectStatus")) {
      const projectStatus = JSON.parse(localStorage.getItem("projectStatus"));
      if (projectStatus) {
        const project = projectStatus.find(obj => obj.id === projectId);
        if (project) {
          this.projectStatus = project;
        }
      }
    }
  }

  localProjectInfoFromLocalStorage(): ProjectType {
    if (localStorage.getItem('newDesign')) { // if newDesign exists in local storage
      const storedObj = JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign'))));
      let project = new ProjectType("");
      Object.keys(storedObj.project).forEach((item, index) => {
        project[item] = storedObj.project[item]
      });
      this.updateProjectProperty(project.name, "name");
      return project
    } else { // return empty object
      let project = new ProjectType("");
      return project
    }
  }

  loadLocalStorage(microList: ComponentMicro[], controlUnitList: ComponentControlUnit[],
    lineList: ComponentCommLine[], boundaryList: ComponentBoundary[]): ComponentList { // load newDesign from localStorage
    if (localStorage.getItem('newDesign')) {
      const storedObj = JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign'))));
      let project = new ProjectType("");
      let connectivity = new MatrixType();
      let newDesign = new ComponentList(project, microList, controlUnitList, lineList, boundaryList);
      // console.log(storedObj);
      Object.keys(storedObj.project).forEach((item, index) => {
        if (item === "id") {
          this.projectId$.next(storedObj.project[item]);
        }
        project[item] = storedObj.project[item]
      });
      storedObj.micro.forEach((item, index) => {
        microList.push(JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign')))).micro[index]);
      });
      storedObj.controlUnit.forEach((item, index) => {
        controlUnitList.push(JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign')))).controlUnit[index]);
      });
      storedObj.commLine.forEach((item, index) => {
        lineList.push(JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign')))).commLine[index]);
      });
      storedObj.boundary.forEach((item, index) => {
        boundaryList.push(JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem('newDesign')))).boundary[index]);
      });
      // Object.keys(storedObj.connectivity).forEach((item, index) => {
      //   connectivity[item] = storedObj.connectivity[item]
      // });
      this.updateEntireNewDesign(newDesign);
      return newDesign
      // console.log(newDesign);
    } else {
      let project = new ProjectType("");
      let connectivity = new MatrixType();
      let newDesign = new ComponentList(project, microList, controlUnitList, lineList, boundaryList);
      this.updateEntireNewDesign(newDesign);
      return newDesign
    }

  };

  openSidePanel() {
    this._sidePanelOpened.next(false);
    setTimeout(() => {
      this._sidePanelOpened.next(true);
    }, 0);
  };
  closeSidePanel() {
    this._sidePanelOpened.next(false);
  };
  toggleSidePanel() {
    this._sidePanelOpened.next(!this._sidePanelOpened.value);
  };

  updateEntireNewDesign(data: ComponentList) {
    this._newDesignShared.next(data);
  };

  removeAllComponents(): ComponentList {
    this._newDesignShared.value.micro = [];
    this._newDesignShared.value.controlUnit = [];
    this._newDesignShared.value.commLine = [];
    this._newDesignShared.value.boundary = [];
    this._newDesignShared.value.project.deletedThreatId = [];
    this._newDesignShared.value.project.wp29 = [];
    this._newDesignShared.value.project.notApplicableWP29AttackIndex = [];
    return this._newDesignShared.value
  }

  updateNewDesignComponents(data: ComponentList) {
    // console.log(Object.keys(this._newDesignShared.value.project))
    Object.keys(this._newDesignShared.value.project).forEach((item, index) => {
      data.project[item] = this._newDesignShared.value.project[item]
    });
    // console.log(data);
    this._newDesignShared.next(data);
  };

  updateProjectProperty(data: any, property: string) {
    this._newDesignShared.value.project[property] = data;
  };

  // Get newDesign project property value by given property name
  getProjectProperty(property: string) {
    return this._newDesignShared.value.project[property];
  }

  getComponentType(id: string): string {
    for (const prop in this._newDesignShared.value) {
      let componentTypeIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value[prop]);
      if (componentTypeIndex != undefined) {
        // console.log("index of property " + prop + " is " + componentTypeIndex);
        return prop;
      }
    }
    Error("activeComponentId not found!");
  };
  updateMicroProperty(id: string, data: any, property: string, subproperty?: string) {
    let activeMicroIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.micro);
    if (subproperty) {
      this._newDesignShared.value.micro[activeMicroIndex][property][subproperty] = data;
    } else {
      this._newDesignShared.value.micro[activeMicroIndex][property] = data;
    }

    this._newDesignShared.next(this._newDesignShared.value);
  };
  getMicroProperty(id: string, property: string, subproperty?: string): any {
    let activeMicroIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.micro);
    if (subproperty) {
      return this._newDesignShared.value.micro[activeMicroIndex][property][subproperty];
    } else {
      return this._newDesignShared.value.micro[activeMicroIndex][property];
    }
  };
  findMicroWithFeatureIdForFeatureChain(activeComponentId: string, featureIdString: string, featureChainIdString: string, additionalIndexPropertyName?: string): any {
    // If featureChainId was generated for that featureId, even though a match of the featureId is found, the component will not be returned,
    // because the feature has already been used in another feature chain.
    if (additionalIndexPropertyName) { // if additional return has been requested
      let outputMicro = [];
      let outputIndex = [];
      let additionalOutput = []; // stores the value of the requested property using the found index of propertyValue
      this._newDesignShared.value.micro.forEach((microObj, microIndex) => {
        for (let [featureIdIndex, featureIdItem] of microObj.featureId.entries()) { // cannot use forEach, because we need to break
          // checkFeatureChainId is true when the feature is either not defined featureChain or it is defined in this featureChain
          let checkFeatureChainId = (!microObj.featureChainId[featureIdIndex]) || (microObj.featureChainId[featureIdIndex] == featureChainIdString);
          if (featureIdItem == featureIdString && checkFeatureChainId) { // if featureId matches, and it is not used in another feature chain
            outputMicro.push(microObj);
            outputIndex.push(featureIdIndex);
            additionalOutput.push(microObj[additionalIndexPropertyName][featureIdIndex]);
            break
          }
        }
      })
      return [outputMicro, outputIndex, additionalOutput]
    } else {
      let outputMicro = [];
      let outputIndex = [];
      this._newDesignShared.value.micro.forEach((microObj, microIndex) => {
        for (let [featureIdIndex, featureIdItem] of microObj.featureId.entries()) { // cannot use forEach, because we need to break
          // checkFeatureChainId is true when the feature is either not defined featureChain or it is defined in this featureChain
          let checkFeatureChainId = microObj.featureChainId[featureIdIndex] == "" || microObj.featureChainId[featureIdIndex] == featureChainIdString;
          if (featureIdItem == featureIdString && checkFeatureChainId) { // if featureId matches, and it is not used in another feature chain
            outputMicro.push(microObj);
            outputIndex.push(featureIdIndex);
            break
          }
        }
      })
      return [outputMicro, outputIndex]
    }
  };
  checkMicroFeatureChainId(microArray: ComponentMicro[], featureChainIdValue: string): boolean[] { // for "edit feature" dialog to mark which component has been marked before
    let output = [];
    microArray.forEach((element, index) => {
      let match = element.featureChainId.findIndex(value => value == featureChainIdValue); // if no match is found, it returns -1
      if (match >= 0) { // if the featureChainId was already generated, it means this feature has been edited before
        output.push(true)
      } else {
        output.push(false)
      }
    })
    return output
  }
  removeMicro(id: string) {
    let activeComponentIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.micro);
    this._newDesignShared.value.micro.splice(activeComponentIndex, 1);
    for (let i = 0; i < this._newDesignShared.value.commLine.length; i++) {
      let index = this._newDesignShared.value.commLine[i].terminalComponentId.findIndex(componentId => componentId == id);
      if (index !== -1) {
        this._newDesignShared.value.commLine[i].terminalComponentId[index] = "";
        this._newDesignShared.value.commLine[i].terminalComponentFeature[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentFeatureIndex[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentFeatureId[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentAssetAccessBoolean[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentAssetAccessType[index] = [];
      };
    };
    this._newDesignShared.next(this._newDesignShared.value);
    return
    // console.log(this._newDesignShared.value);
  };
  updateControlUnitProperty(id: string, data: any, property: string, subproperty?: string) {
    let activeControlUnitIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.controlUnit);
    if (subproperty) {
      this._newDesignShared.value.controlUnit[activeControlUnitIndex][property][subproperty] = data;
    } else {
      this._newDesignShared.value.controlUnit[activeControlUnitIndex][property] = data;
    }
    this._newDesignShared.next(this._newDesignShared.value);
  };
  getControlUnitProperty(id: string, property: string, subproperty?: string): any {
    let activeControlUnitIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.controlUnit);
    if (subproperty) {
      return this._newDesignShared.value.controlUnit[activeControlUnitIndex][property][subproperty];
    } else {
      return this._newDesignShared.value.controlUnit[activeControlUnitIndex][property];
    }
  };
  findControlUnitWithFeatureIdForFeatureChain(activeComponentId: string, featureIdString: string, featureChainIdString: string, additionalIndexPropertyName?: string): any {
    // If featureChainId was generated for that featureId, even though a match of the featureId is found, the component will not be returned,
    // because the feature has already been used in another feature chain.
    if (additionalIndexPropertyName) { // if additional return has been requested
      let outputControlUnit = [];
      let outputIndex = [];
      let additionalOutput = []; // stores the value of the requested property using the found index of propertyValue
      this._newDesignShared.value.controlUnit.forEach((controlUnitObj, controlUnitObjIndex) => {
        for (let [featureIdIndex, featureIdItem] of controlUnitObj.featureId.entries()) { // cannot use forEach, because we need to break
          // checkFeatureChainId is true when the feature is either not defined featureChain or it is defined in this featureChain
          let checkFeatureChainId = (!controlUnitObj.featureChainId[featureIdIndex]) || (controlUnitObj.featureChainId[featureIdIndex] == featureChainIdString);
          if (featureIdItem == featureIdString && checkFeatureChainId) { // if featureId matches, and it is not used in another feature chain
            outputControlUnit.push(controlUnitObj);
            outputIndex.push(featureIdIndex);
            additionalOutput.push(controlUnitObj[additionalIndexPropertyName][featureIdIndex]);
            break
          }
        }
      })
      return [outputControlUnit, outputIndex, additionalOutput]
    } else {
      let outputControlUnit = [];
      let outputIndex = [];
      this._newDesignShared.value.controlUnit.forEach((controlUnitObj, controlUnitObjIndex) => {
        for (let [featureIdIndex, featureIdItem] of controlUnitObj.featureId.entries()) { // cannot use forEach, because we need to break
          // checkFeatureChainId is true when the feature is either not defined featureChain or it is defined in this featureChain
          let checkFeatureChainId = controlUnitObj.featureChainId[featureIdIndex] == "" || controlUnitObj.featureChainId[featureIdIndex] == featureChainIdString;
          if (featureIdItem == featureIdString && checkFeatureChainId) { // if featureId matches, and it is not used in another feature chain
            outputControlUnit.push(controlUnitObj);
            outputIndex.push(featureIdIndex);
            break
          }
        }
      })
      return [outputControlUnit, outputIndex]
    }
  };
  checkControlUnitFeatureChainId(controlUnitArray: ComponentControlUnit[], featureChainIdValue: string): boolean[] { // for "edit feature" dialog to mark which component has been marked before
    let output = [];
    controlUnitArray.forEach((element, index) => {
      let match = element.featureChainId.findIndex(value => value == featureChainIdValue); // if no match is found, it returns -1
      if (match >= 0) { // if the featureChainId was already generated, it means this feature has been edited before
        output.push(true)
      } else {
        output.push(false)
      }
    })
    return output
  }
  removeControlUnit(id: string) {
    let activeComponentIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.controlUnit);
    this._newDesignShared.value.controlUnit.splice(activeComponentIndex, 1);
    for (let i = 0; i < this._newDesignShared.value.commLine.length; i++) {
      let index = this._newDesignShared.value.commLine[i].terminalComponentId.findIndex(componentId => componentId == id);
      if (index !== -1) {
        this._newDesignShared.value.commLine[i].terminalComponentId[index] = "";
        this._newDesignShared.value.commLine[i].terminalComponentFeature[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentFeatureIndex[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentFeatureId[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentAssetAccessBoolean[index] = [];
        this._newDesignShared.value.commLine[i].terminalComponentAssetAccessType[index] = [];
        // console.log(this._newDesignShared.value);
      };
    };
    this._newDesignShared.next(this._newDesignShared.value);
    return
    // console.log(this._newDesignShared.value);
  };
  updateCommLineProperty(id: string, data: any, property: string, subproperty?: string) {
    let activeCommLineIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.commLine);
    // terminalComponentFeature structure is [[], []]
    // if (property == "terminalComponentId") {
    // let previousData = this._newDesignShared.value.commLine[activeCommLineIndex][property];
    // previousData.forEach((componentId, i) => { // loop through each component in the original dataset, and see if they still exist in the new dataset
    //   let removedIndicator = data.findIndex((newComponentId) => {newComponentId == componentId}); // find if a terminalComponent is removed
    //   if (removedIndicator == undefined) {
    //     this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature.splice(i, 1); // remove the component by index
    //   }
    // })
    // let emptyArray = []; // to be added to terminalComponentFeature
    // data.forEach((componentId, i) => { // loop through each component in the new dataset, and see if they exist in the old dataset
    //   let addedComponent = previousData.findIndex((oldComponentId) => {oldComponentId == componentId}); // find if a terminalComponent is added
    //   if (addedComponent == undefined) {
    //     emptyArray.push(componentId);
    //     this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature.splice(i, 1, emptyArray);
    //   }
    // })
    // }
    if (subproperty) {
      this._newDesignShared.value.commLine[activeCommLineIndex][property][subproperty] = data;
    } else {
      this._newDesignShared.value.commLine[activeCommLineIndex][property] = data;
    }
    this._newDesignShared.next(this._newDesignShared.value);

    // save a copy of newDesign in local browser with updated CommLine app and secure protocols
    // localStorage.setItem('newDesign', JSON.stringify(this._newDesignShared.value)); 
    // console.log(this._newDesignShared.value.commLine[activeCommLineIndex]);
  };
  getCommLineProperty(id: string, property: string, subproperty?: string): any {
    let activeCommLineIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.commLine);
    if (activeCommLineIndex > -1) {
      if (subproperty) {
        return this._newDesignShared.value.commLine[activeCommLineIndex][property][subproperty];
      } else {
        return this._newDesignShared.value.commLine[activeCommLineIndex][property]
      }
    }
  }
  removeCommLine(id: string) {
    let activeComponentIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.commLine);
    let terminalIds = this._newDesignShared.value.commLine[activeComponentIndex].terminalId;
    for (let connectedComponent of this._newDesignShared.value.commLine[activeComponentIndex].terminalComponentId) {
      let connectedMicroIndex = this._ArrOp.findStringIndexInArrayProperty(connectedComponent, "id", this._newDesignShared.value.micro);
      let connectedControlUnitIndex = this._ArrOp.findStringIndexInArrayProperty(connectedComponent, "id", this._newDesignShared.value.controlUnit);
      if (connectedMicroIndex !== undefined) {
        for (let lineIdIndex = 0; lineIdIndex < this._newDesignShared.value.micro[connectedMicroIndex].lineId.length; lineIdIndex++) {
          if (this._newDesignShared.value.micro[connectedMicroIndex].lineId[lineIdIndex] == id) {
            this._newDesignShared.value.micro[connectedMicroIndex].lineId.splice(lineIdIndex, 1); // remove line id from component lineId property
          }
        }
        terminalIds.forEach((terId) => {
          let terminalIdIndex = this._newDesignShared.value.micro[connectedMicroIndex].lineTerminalId.findIndex(componentId => componentId == terId);
          if (terminalIdIndex !== -1) { this._newDesignShared.value.micro[connectedMicroIndex].lineTerminalId.splice(terminalIdIndex, 1) } // remove terminal id from component lineTerminalId property
        });
      } else if (connectedControlUnitIndex !== undefined) {
        for (let lineIdIndex = 0; lineIdIndex < this._newDesignShared.value.controlUnit[connectedControlUnitIndex].lineId.length; lineIdIndex++) {
          if (this._newDesignShared.value.controlUnit[connectedControlUnitIndex].lineId[lineIdIndex] == id) {
            this._newDesignShared.value.controlUnit[connectedControlUnitIndex].lineId.splice(lineIdIndex, 1); // remove line id from component lineId property
          }
        }
        terminalIds.forEach((terId) => {
          let terminalIdIndex = this._newDesignShared.value.controlUnit[connectedControlUnitIndex].lineTerminalId.findIndex(componentId => componentId == terId);
          if (terminalIdIndex !== -1) { this._newDesignShared.value.controlUnit[connectedControlUnitIndex].lineTerminalId.splice(terminalIdIndex, 1) } // remove terminal id from component lineTerminalId property
        });
      };
    };
    const commLineProtocolText: Element = document.querySelector(`.commLineProtocolText[tabindex='${id}']`);
    if (commLineProtocolText) {
      commLineProtocolText.remove();
    }
    this._newDesignShared.value.commLine.splice(activeComponentIndex, 1); // remove line from .commLine at last
    this._newDesignShared.next(this._newDesignShared.value);
    // console.log(this._newDesignShared.value);
  };
  updateLineFeatureCheckboxStatus(lineIdInput: string, componentIdInput: string, featureNameInput: string, featureIdInput: string, event: boolean, featureIndexInComponent: number) {
    let activeCommLineIndex = this._ArrOp.findStringIndexInArrayProperty(lineIdInput, "id", this._newDesignShared.value.commLine);
    let componentFeatureIndex = this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentId.findIndex(element => element == componentIdInput);
    if (event) { // if the checkbox is checked
      if (!this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature[componentFeatureIndex].includes(featureNameInput)) {
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature[componentFeatureIndex].push(featureNameInput);
      }
      if (!this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureIndex[componentFeatureIndex].includes(featureIndexInComponent)) {
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureIndex[componentFeatureIndex].push(featureIndexInComponent); // matches assetFeatureIndex in a component
      }
      if (!this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureId[componentFeatureIndex].includes(featureIdInput)) {
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureId[componentFeatureIndex].push(featureIdInput);
      }
    } else { // if the checkbox is unchecked
      // since very feature of a component can only show up in the terminalComponentFeature once at most, use the index of the feature in that component, or terminalComponentFeatureIndex...
      // ...to identify the correct feature and featureId to remove from the commLine
      let featureIndex = this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureIndex[componentFeatureIndex].findIndex(element => element == featureIndexInComponent);
      if (featureIndex != -1) {
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature[componentFeatureIndex].splice(featureIndex, 1);
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureIndex[componentFeatureIndex].splice(featureIndex, 1);
        this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureId[componentFeatureIndex].splice(featureIndex, 1);
      }
    }
    this._newDesignShared.next(this._newDesignShared.value);
    // console.log(this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeature);
  };
  getLineFeatureCheckboxStatus(lineIdInput: string, componentIdInput: string, featureIdInput: string, featureIndexInComponent: number): boolean {
    let status = false;
    let activeCommLineIndex = this._ArrOp.findStringIndexInArrayProperty(lineIdInput, "id", this._newDesignShared.value.commLine);
    let componentFeatureIndex = this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentId.findIndex(element => element == componentIdInput);
    // use featureIndexInComponent to check if a feature is accessible from this commLine
    let featureIndex = this._newDesignShared.value.commLine[activeCommLineIndex].terminalComponentFeatureIndex[componentFeatureIndex].findIndex(element => element == featureIndexInComponent);
    if (featureIndex == -1) {
      status = false;
    } else {
      status = true;
    }
    return status;
  };

  updateBoundaryProperty(id: string, data: any, property: string, subproperty?: string) {
    let activeBoundaryIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.boundary);
    if (subproperty) {
      this._newDesignShared.value.boundary[activeBoundaryIndex][property][subproperty] = data;
    } else {
      this._newDesignShared.value.boundary[activeBoundaryIndex][property] = data;
    }
    this._newDesignShared.next(this._newDesignShared.value);
  };
  getBoundaryProperty(id: string, property: string, subproperty?: string): any {
    let activeBoundaryIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.boundary);
    if (subproperty) {
      return this._newDesignShared.value.boundary[activeBoundaryIndex][property][subproperty];
    } else {
      return this._newDesignShared.value.boundary[activeBoundaryIndex][property];
    }
  }
  removeBoundary(id: string) {
    let activeComponentIndex = this._ArrOp.findStringIndexInArrayProperty(id, "id", this._newDesignShared.value.boundary);
    this._newDesignShared.value.boundary.splice(activeComponentIndex, 1);
    this._newDesignShared.next(this._newDesignShared.value);
  };

  listItemWithinBoundary(): Array<string> { // find components within the boundary, and return their component id
    let relevantComponentArray = [];
    this._newDesignShared.value.boundary.forEach((boundaryItem) => {
      if (boundaryItem.enable == true) {
        let xRange = [boundaryItem.position[0], boundaryItem.position[0] + boundaryItem.size[0]];
        let yRange = [boundaryItem.position[1], boundaryItem.position[1] + boundaryItem.size[1]];
        this._newDesignShared.value.micro.forEach((microItem) => {
          if (microItem.position[0] > xRange[0] && microItem.position[0] < xRange[1]
            && microItem.position[1] > yRange[0] && microItem.position[1] < yRange[1]) {
            relevantComponentArray.push(microItem.id);
          }
        })
        this._newDesignShared.value.controlUnit.forEach((controlUnitItem) => {
          if (controlUnitItem.position[0] > xRange[0] && controlUnitItem.position[0] < xRange[1]
            && controlUnitItem.position[1] > yRange[0] && controlUnitItem.position[1] < yRange[1]) {
            relevantComponentArray.push(controlUnitItem.id);
          }
        })
        this._newDesignShared.value.commLine.forEach((commLineItem) => { // this algorithm should work for commLine with multiple terminals
          let terminalXArray = [];
          let terminalYArray = [];
          for (let i = 0; i < commLineItem.position.length; i = i + 2) {
            terminalXArray.push(commLineItem.position[i])
          };
          for (let i = 1; i < commLineItem.position.length; i = i + 2) {
            terminalYArray.push(commLineItem.position[i])
          };
          let xOutlier = terminalXArray.find(x => x < xRange[0] || x > xRange[1]);
          let yOutlier = terminalYArray.find(y => y < yRange[0] || y > yRange[1]);
          if (xOutlier == undefined && yOutlier == undefined) {
            relevantComponentArray.push(commLineItem.id);
          }
        })
      }
    })
    let relevantComponentArrayDuplicatesRemoved = [...new Set(relevantComponentArray)];
    return relevantComponentArrayDuplicatesRemoved
  }

  FeatureTypes: ValueAndViewValue[] = [ // for display
    { value: "dataTransmission", viewValue: "Data Transmission" },
    { value: "control", viewValue: "Control" },
    { value: "accessControl", viewValue: "Security - Access Control" },
    { value: "cryptoAction", viewValue: "Security - Crypto Operation" },
    { value: "logging", viewValue: "Logging" },
    { value: "routing", viewValue: "Routing" },
    { value: "custom", viewValue: "Custom" },
  ];
  FeatureTypeDataTransmission: ValueAndViewValue[] = [
    // for display
    { value: "consumer", viewValue: "Data User", index: 0 },
    { value: "generator", viewValue: "Data Generator", index: 1 },
    { value: "router", viewValue: "Redirect Data", index: 2 },
    { value: "store", viewValue: "Data Store", index: 3 },
    { value: "consumer_store", viewValue: "Data User & Data Store", index: 4 },
  ];
  FeatureTypeControl: ValueAndViewValue[] = [
    // for display
    { value: "controller", viewValue: "Control Command Sender", index: 0 },
    { value: "implementer", viewValue: "Control Command Implementer", index: 1 },
    { value: "router", viewValue: "Redirect Control Command", index: 2 },
  ];
  FeatureTypeAccessControl: ValueAndViewValue[] = [
    // for display
    { value: "user", viewValue: "User to be Authenticated / Process to be authorized", index: 0 },
    { value: "system", viewValue: "System/Process to be Accessed", index: 1 },
    { value: "authorizer", viewValue: "Authenticator/Authorizer", index: 2 },
    { value: "system_authorizer", viewValue: "System/Process to be Accessed & Authenticator/Authorizer", index: 3 },
    { value: "router", viewValue: "Redirect Information", index: 4 },
  ];
  FeatureTypeCryptoAction: ValueAndViewValue[] = [
    // for display
    { value: "encryptorDecryptor", viewValue: "Encryptor and Decryptor", index: 0 },
    { value: "encryptor", viewValue: "Encryptor", index: 1 },
    { value: "decryptor", viewValue: "Decryptor", index: 2 },
    { value: "hasher", viewValue: "Hasher", index: 3 },
    { value: "signer", viewValue: "Signer", index: 4 },
    { value: "verifier", viewValue: "Verifier", index: 5 },
    { value: "router", viewValue: "Redirect Information", index: 6 },
  ];
  FeatureTypeLogging: ValueAndViewValue[] = [
    // for display
    { value: "consumer", viewValue: "Logs User", index: 0 },
    { value: "generator", viewValue: "Logs Generator", index: 1 },
    { value: "store", viewValue: "Logs Store", index: 2 },
    { value: "consumer_store", viewValue: "Logs User & Logs Store", index: 3 },
    { value: "router", viewValue: "Redirect Logs", index: 4 },
  ];
  FeatureTypeRouting: ValueAndViewValue[] = [
    // for display
    { value: "router", viewValue: "Router", index: 0 },
  ];
  FeatureTypeCustom: ValueAndViewValue[] = [
    // for display
    { value: "custom", viewValue: "Custom", index: 0 },
  ];

  dynamicallyAssignFeatureRole(inputFeatureType) {
    let dynamicFeatureRole = {};
    switch (inputFeatureType) {
      case "dataTransmission":
        return dynamicFeatureRole = this.FeatureTypeDataTransmission;
      case "control":
        return dynamicFeatureRole = this.FeatureTypeControl;
      case "accessControl":
        return dynamicFeatureRole = this.FeatureTypeAccessControl;
      case "cryptoAction":
        return dynamicFeatureRole = this.FeatureTypeCryptoAction;
      case "logging":
        return dynamicFeatureRole = this.FeatureTypeLogging;
      case "routing":
        return dynamicFeatureRole = this.FeatureTypeRouting;
      case "custom":
        return dynamicFeatureRole = this.FeatureTypeCustom;
      default:
        console.log('Error: feature type from library is ${inputFeatureType} not matching front end')
    }
  }

  getFeatureRoleIndex(inputFeatureType, inputFeatureRole): number {
    let returnValue = 0;
    switch (inputFeatureType) {
      case "dataTransmission":
        return returnValue = this.FeatureTypeDataTransmission.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "control":
        return returnValue = this.FeatureTypeControl.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "accessControl":
        return returnValue = this.FeatureTypeAccessControl.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "cryptoAction":
        return returnValue = this.FeatureTypeCryptoAction.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "logging":
        return returnValue = this.FeatureTypeLogging.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "routing":
        return returnValue = this.FeatureTypeRouting.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      case "custom":
        return returnValue = this.FeatureTypeCustom.findIndex((item) => item.viewValue == inputFeatureRole || item.value == inputFeatureRole);
      default:
        console.log('Error: feature type from library is ${inputFeatureType} not matching front end')
    }
  }

  getFeatureTypes() {
    return this.FeatureTypes
  }

  //lineConnectedComponentFeatures is only updated on ngOnchanges so this function updates it in case a component is removed from a line
  removeComponentFeaturesFromLine(lineConnectedComponentFeatures, componentId) {
    if (lineConnectedComponentFeatures.length) {
      return lineConnectedComponentFeatures.filter((component) => component.id !== componentId);
    } else {
      return [];
    }
  }
}

