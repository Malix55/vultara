import { ThreatItem, WP29Model } from './../../threatmodel/ItemDefinition';
import { take, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserProfile, AuthenticationService } from './../services/authentication.service';
import { ComponentVisualChangeService } from '../services/component-visual-change.service';
import { DesignSettingsService } from '../services/design-settings.service';
import { ArrOpService } from '../services/arr-op.service';
import { ComponentMicro, ComponentControlUnit, ComponentCommLine, ComponentList, ComponentBoundary, ProjectType } from '../../threatmodel/ItemDefinition';
import { Component, ViewEncapsulation, OnInit, HostListener, EventEmitter, Output, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { SingleInputFormDialogService } from '../services/single-input-form-dialog.service';
import { HttpClient, HttpRequest, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { LoadProjectDialog } from "../navbar/navbar.component";
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { ResultSharingService } from '../services/result-sharing.service';

// variable used to identify if the draggable is a new item from the sidebar or an existing one in the canvas
var dragFlag = 0; // 0 means its an existing item being dragged around within the canvas
// variables used to make sure mousemove event only works while mousedown event is ongoing
var targetTerminalSVG = null; // null means no SVG Line Terminal is selected
var terminalSVGFilled = null; // null means SVG Line Terminal is NOT connected to another component
// variables used to enable accurate element movements
var mouseDownFlag = false; // flag to indicate when a component has been clicked
var mouseDownX = 0; // stores cursor location upon first click
var mouseDownY = 0; // stores cursor location upon first click
var shiftX = 0; // stores coordinates to help position img element
var shiftY = 0; // stores coordinates to help position img element
var elementWithFocus = null; // stores DOM target
var diffX1 = 0, diffY1 = 0, diffX2 = 0, diffY2 = 0, diffX3 = 0, diffY3 = 0, diffX4 = 0, diffY4 = 0, diffX5 = 0, diffY5 = 0;; // stores offsets from commLine terminals to first click location
var diffX = 0; // stores offset to compensate the unknown 17px position shift
var diffY = 0; // stores offset for potentially unknown Y-direction shift
// to off set component library sidebar
const sidebarWidth = 130 * window.devicePixelRatio;
const navBarHeight = 50 * window.devicePixelRatio;
let defaultLength = 25;
let polylineName: string = 'polyline';

// Additional space for modules from which it can not go further.
export enum MIN_MODULE_SPACE {
  X = 45,
  Y = 25
}

// Additional space for commLine from which it can not go further.
export enum MIN_LINE_SPACE {
  X = 50,
  Y = 15
}

// Additional space for commLine terminal from which it can not go further.
export enum MIN_TERMINAL_SPACE {
  X = 50,
  Y = 15
}

// Additional space for sidebar and top navbar from which components/modules (excluding text) can not go further.
export enum MIN_SIDEBAR_NAVBAR_SPACE {
  X = sidebarWidth + 30,
  Y = navBarHeight
}

// Hardcoded value for horizontal and vertical scrollbar space.
export enum PAGE_SCROLLBAR_SPACE {
  X = 10,
  Y = 10
}

// The maximum attempts algorithm tries to find out the intersection coordinate.
export enum MAX_INTERSECTION_FINDING_ATTEMPTS {
  COUNT = 5
}

// Edges of a module
export enum MODULE_EDGE_DIRECTION {
  LEFT = 'LEFT',
  TOP = 'TOP',
  RIGHT = 'RIGHT',
  BOTTOM = 'BOTTOM'
}

@Component({
  selector: 'app-modeling-view',
  templateUrl: './modeling-view.component.html',
  styleUrls: ['./modeling-view.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModelingViewComponent implements OnInit, AfterViewInit {
  project: ProjectType = { id: "123" };
  public minModuleSpace: any = MIN_MODULE_SPACE;
  public minLineSpace: any = MIN_LINE_SPACE;
  public minTerminalSpace: any = MIN_TERMINAL_SPACE;
  public minSidebarNavbarSpace: any = MIN_SIDEBAR_NAVBAR_SPACE;
  public microList: ComponentMicro[] = [];   // microList is the list of microcontrollers in this design
  public controlUnitList: ComponentControlUnit[] = [];   // controlUnitList is the list of controlUnits in this design
  public lineList: ComponentCommLine[] = [];   // lineList is the list of communication lines in this design
  public boundaryList: ComponentBoundary[] = [];   // boundaryList is the list of boundaries in this design
  // newDesign is the list of all components to document what's on the canvas
  public newDesign = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  public newDesignShared = new ComponentList(this.project, this.microList, this.controlUnitList, this.lineList, this.boundaryList);
  private unsubscribe: Subject<void> = new Subject();
  createNewProjectNameDialogOptions = {
    title: "Load Project or Create New Project",
    message: "Give the new project a name...",
    cancelText: "Load Project",
    confirmText: "Create New Project",
    input: this.newDesign.project.name,
  };
  activeComponentId: string = "";
  readonly rootUrl = environment.backendApiUrl + "projects";
  readonly systemConfigRootUrl = environment.backendApiUrl + "config";
  posts: any;
  currentUserProfile: UserProfile;
  projectName = "";
  public systemConfig: any;
  terminalReduceTerminalSpace: number = 14; // Reduce (should be positive value, range (0 to 14)) some space betweeen terminal and block, so that user can catch terminal easily
  terminalExtendTerminalSpace: number = 0; // Extend (should be negative value, range (0 to -14)) some space betweeen terminal and block, so that user can catch terminal easily
  extendToDeep: number = 18 * window.devicePixelRatio; // Defines how deep a terminal can enter to detect edge
  polylineDisplayNameInCompLib: string = "Communication Polyline"; // Keeps actual polyline name
  commLinesTerminals: any[] = []; // Preserve dragged component terminals information
  private globalScrollX: number = 0;
  private globalScrollY: number = 0;
  public threatList: ThreatItem[] = [];
  private highlightedModules: string[] = [];

  @Output() saveProjectEvent = new EventEmitter<string>();

  constructor(public ArrOp: ArrOpService, public editDesignShared: DesignSettingsService, private _compVisual: ComponentVisualChangeService,
    private _snackBar: MatSnackBar, private _router: Router, private _authService: AuthenticationService, private _spinner: NgxSpinnerService,
    private _singleInputFormDialogService: SingleInputFormDialogService, private _http: HttpClient, public dialog: MatDialog, private resultShared: ResultSharingService,
    private _confirmDialogService: ConfirmDialogService, private changeDetector: ChangeDetectorRef) { };

  ngOnInit(): void {

    // disable the ctrl shortcut keys
    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey) {
        const target = event.target as HTMLTextAreaElement;
        if (target.nodeName !== "INPUT") {
          event.preventDefault();
        }
      }
    });
    // console.log(`intendedUrl is ${this._router.url}`);
    // this._authService.updateIntendedUrl(this._router.url);
    window.scrollTo(0, 0);
    this.getSystemConfigData();
    this.getResultData();

    localStorage.setItem("intendedUrl", this._router.url);
    this.editDesignShared.addToDesign
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((designData) => {
        // console.log({designData});
        this.newDesignShared = designData;
        this.updateTextProtocolsDisplay(this.newDesignShared);
        this.updateLastModifiedBy();
        this.updateComponentInformation(designData);
      });
    this.editDesignShared.updateProtocolTextPosition
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((visibilityProperty: any) => {
        this.updateTextProtocolsDisplay(this.newDesignShared, visibilityProperty);
      });
    this.editDesignShared.sidePanelStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => {
        this.sidePanelOpened = status;
        this.changeDetector.detectChanges();
      });
    this.initializeSVGHtml();
    this._compVisual.designHtmlUpdated$.pipe(takeUntil(this.unsubscribe)).subscribe((_: string) => {
      if (_) {
        switch (_) {
          case "default":
            if (localStorage.getItem("newDesign")) {
              this.editDesignShared.loadLocalStorage(this.microList, this.controlUnitList, this.lineList, this.boundaryList); // load newDesign from localStorage
            }
            break;
          case "updated":
            this.newDesign = this.newDesignShared;

            this.lineList = this.newDesign.commLine;
            this.microList = this.newDesign.micro;
            this.controlUnitList = this.newDesign.controlUnit;
            this.project = this.newDesign.project;
            this.boundaryList = this.newDesign.boundary;
            break;

          default:
            break;
        }
        if (localStorage.getItem("newDesign")) { // if localStorage exists, load the project
          if (!(this.editDesignShared.projectStatus?.milestoneView)) {
            this.recoverEventListeners(); // add event listeners for loaded HTML elements
          } else {
            this.previewPropertyPanel();
          }
        }
      }
    });
    this.editDesignShared.closeSidePanel(); // make sure panel is closed
    if (document.getElementsByClassName("dropShadow").length != 0) {
      this._compVisual.removeComponentDropShadowById(document.getElementsByClassName("dropShadow")[0].id); // make sure no component is highlighted
    };
    this._authService.currentUserObservable
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentUser) => {
        this.currentUserProfile = currentUser
      });
    // console.log(`current project id is ${this.newDesignShared.project.id}`)
    if (!this.newDesignShared.project.id) { // if no project is loaded or created
      // console.log(`current user id is ${this.currentUserProfile._id}`);
      if (!(["Admin", "Super Admin", "Security Manager"].includes(this.currentUserProfile.role))) { // if not Admin/Super Admin or security manager, only allow to load accessible projects
        let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
        this.posts = this._http.get(this.rootUrl + "/getAllProjectIdsOfUser", { params: queryParams });
        this.posts
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            // console.log(res);
            if (res.id.length == 0) {
              this._snackBar.open("User is not authorized to access any project. You won't be able to save or model your design. Please contact your administrator.", "Warning!", {
                duration: 600000,
              });
            } else {
              const dialogRef = this.dialog.open(LoadProjectDialog, {
                // width: '700px',
                data: res,
              });
              dialogRef.afterClosed()
                .pipe(takeUntil(this.unsubscribe))
                .subscribe(result => {
                  this.projectName = res.id[result];
                });
            }
          });
      } else { // Admin/Super Admin is allowed to either create a new project or load existing projects
        this._singleInputFormDialogService.open(this.createNewProjectNameDialogOptions);
        this._singleInputFormDialogService
          .confirmed()
          .subscribe(confirmed => {
            if (confirmed) {
              this.newDesign = new ComponentList(this.project, [], [], [], []);
              document.getElementById("drawingCanvas").innerHTML = "";
              localStorage.removeItem("newDesign");
              localStorage.removeItem("result");
              localStorage.removeItem("newDesignHtml");
              localStorage.removeItem("projectStatus");
              localStorage.removeItem("goal");
              this.project.id = this.ArrOp.genRandomId(10);
              this.project.name = confirmed;
              // console.log(this.project.id)
              this.editDesignShared.updateProjectProperty(this.project.id, "id");
              // console.log(this.editDesignShared.addToDesign)
              this.editDesignShared.updateProjectProperty(confirmed, "name");
              localStorage.setItem('newDesign', JSON.stringify(this.newDesign)); // save the project id and name
              location.reload();
            } else { // if user clicks cancel
              let queryParams = new HttpParams().set("_id", this.currentUserProfile._id);
              this.posts = this._http.get(this.rootUrl + "/getAllProjectIdsOfUser", { params: queryParams });
              this.posts
                .pipe(takeUntil(this.unsubscribe))
                .subscribe((res) => {
                  // console.log(res);
                  if (res.id.length == 0) {
                    this._snackBar.open("Project database server busy. Please try again.", "", {
                      duration: 5000,
                    });
                  } else {
                    const dialogRef = this.dialog.open(LoadProjectDialog, {
                      // width: '700px',
                      data: res,
                    });
                    dialogRef.afterClosed()
                      .pipe(takeUntil(this.unsubscribe))
                      .subscribe(result => {
                        this.projectName = res.id[result];
                      });
                  }
                });
            }
          })
      }
    }
  };

  ngAfterViewInit() {
    this.assignComponentCommLinePositions(this.newDesign.commLine, this.newDesign.micro, this.newDesign.controlUnit);
  }

  ngOnDestroy() {
    this._compVisual.updateModelingViewDesign(document.getElementById("drawingCanvas").innerHTML);
    this.editDesignShared.updateEntireNewDesign(this.newDesignShared);
    this._compVisual.updateVisualDesign("updated");
    this.editDesignShared.closeSidePanel();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Backward compatibility for updating a file name with new one.  
  private updateComponentsName(svgHtml: string) {
    let matches = svgHtml.match(/.\/assets\/images\/(.*?(?="))/g);
    if (matches && matches.length > 0) {
      matches = matches.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      matches.forEach(match => {
        const fileName: string = match.split("/").pop();
        let newFilePath: string = '';
        switch (fileName) {
          case 'micro blank.svg':
            newFilePath = match.replace(fileName, 'micro.svg');
            break;
          case 'general module blank.svg':
            newFilePath = match.replace(fileName, 'general-module.svg');
            break;
          case 'chip blank.svg':
            newFilePath = match.replace(fileName, 'chip.svg');
            break;
          case 'actor blank.svg':
            newFilePath = match.replace(fileName, 'actor.svg');
            break;
          case 'backend blank.svg':
            newFilePath = match.replace(fileName, 'backend.svg');
            break;

          default:
            newFilePath = match;
            break;
        }
        const conditionToReplace = new RegExp(`${match}`, "g");
        svgHtml = svgHtml.replace(conditionToReplace, newFilePath);
      });
    }
    return svgHtml;
  }

  // Initialize SVG Html content from Observable
  private initializeSVGHtml() {
    this._compVisual.addToDesignHtml$.pipe(takeUntil(this.unsubscribe)).subscribe((svgHtml: string) => {
      if (svgHtml) {
        svgHtml = this.updateComponentsName(svgHtml);
        document.getElementById("drawingCanvas").innerHTML = svgHtml;
      }
    });
  }

  // Update protocol text display upon selection from property panel
  private updateTextProtocolsDisplay(newDesign: any, visibilityProperty?: any) {
    const commLines = newDesign.commLine;
    if (commLines && commLines.length > 0) {
      commLines.forEach((commLine: ComponentCommLine) => {
        const textProtocolDisplay = commLine.textProtocolDisplay === undefined ? false : commLine.textProtocolDisplay;
        if (textProtocolDisplay) {
          const existingProtocolText = document.querySelector(`[tabindex="${commLine.id}"]`);
          if (existingProtocolText === null || (visibilityProperty && visibilityProperty.show && commLine.id === visibilityProperty.commLineId)) {
            this.renderProtocolTextAlongWithCommLine(commLine.id);
          } else {
            const newDesignCommLine = this.newDesign.commLine.find(obj => obj.id == commLine.id);
            if (newDesignCommLine) {
              this.setProtocolText(existingProtocolText, newDesignCommLine);
            }
            this.showProtocolText(commLine.id);
          }
        } else {
          this.removeProtocolText(commLine.id);
        }
      });
    }
  }

  sidePanelOpened = false;
  module = "";

  // define items in the sidebar (component library)
  componentLibrary: any[] = [
    {
      "name": "Microcontroller", // for visual only
      "image": "./assets/images/micro.svg",
      "model": "S32K", // will be used to call component properties from database
      "type": "micro", // will be used as HTML class name, and it is used to group models in database
      "module": this.module,
      "id": "microcontroller", // use this to identify which component is dropped. some phrases, such as "Sensor Input", is changed once calling className ("Sensor Input" is saved as "Input Sensor" in className)
    },
    // {
    //   "name": "Communication Line",
    //   "image": "./assets/images/straight line.svg",
    //   "model": "CAN",
    //   "type": "commLine",
    //   "module": "CAN bus",
    //   "id": "communicationLine",
    // },
    {
      "name": "Communication Line",
      "image": "./assets/images/polyline.svg",
      "model": "CAN",
      "type": "commLine",
      "module": "CAN bus",
      "id": "communicationPolyline",
    },
    {
      "name": "Module",
      "image": "./assets/images/general-module.svg",
      "model": "",
      "type": "controlUnit",
      "module": "Module",
      "id": "generalModule",
    },
    {
      "name": "Backend",
      "image": "./assets/images/backend.svg",
      "model": "",
      "type": "controlUnit",
      "module": "",
      "id": "backendModule",
    },
    {
      "name": "Module Boundary",
      "image": "./assets/images/rectangular boundary.svg",
      "model": "boundary",
      "type": "boundary",
      "module": "",
      "id": "moduleBoundary",
    },
    {
      "name": "User/Attacker",
      "image": "./assets/images/actor.svg",
      "model": "Actor",
      "type": "controlUnit",
      "module": "Actor",
      "id": "userAttacker",
    },
    {
      "name": "Sensor Input",
      "image": "./assets/images/sensorInputLine.svg",
      "model": "Sensor",
      "type": "commLine",
      "module": "Sensor",
      "id": "sensorInput",
    },
    {
      "name": "Memory Chip",
      "image": "./assets/images/chip.svg",
      "model": "",
      "type": "micro",
      "module": "",
      "id": "memory",
    }
  ];

  // Highlight selected attackSurface's
  private highlightAttackPaths(attackPaths: string[]) {
    attackPaths.forEach((_: string) => {
      const component: HTMLElement = document.getElementById(_);
      const tagName: string = component ? component.tagName : null;
      if (tagName === "g") {
        const polyline: HTMLCollection = component.getElementsByTagName("polyline");
        if (polyline && polyline.length > 0) {
          const polylineId: string = polyline[0].id;
          this.highlightSVGCommLine(polylineId);
        }
        const commLine: HTMLCollection = component.getElementsByTagName("line");
        if (commLine && commLine.length > 0) {
          const commLineId: string = commLine[0].id;
          this.highlightSVGCommLine(commLineId);
        }
      } else if (tagName === "IMG") {
        this.highlightSVGImg(component);
      }
    });
  }

  // Highlight selected attackSurface's
  private animateAttackSurfaces(attackSurfaces: string[]) {
    attackSurfaces.forEach((_: string) => {
      const component: HTMLElement = document.getElementById(_);
      const tagName: string = component ? component.tagName : null;
      if (tagName === "g") {
        const polyline: HTMLCollection = component.getElementsByTagName("polyline");
        if (polyline && polyline.length > 0) {
          const polylineId: string = polyline[0].id;
          this.removeAnimation(component);
          this.animateHighlightedSVGCommLine(component);
        }
        const commLine: HTMLCollection = component.getElementsByTagName("line");
        if (commLine && commLine.length > 0) {
          const commLineId: string = commLine[0].id;
          this.removeAnimation(component);
          this.animateHighlightedSVGCommLine(component);
        }
      } else if (tagName === "IMG") {
        this.removeAnimation(component);
        this.animateHighlightedSVGImg(component);
      }
    });
  }

  // Dehighlight selected attackSurface's
  private dehighlightAttackPaths(attackPaths: string[]) {
    attackPaths.forEach((_: string) => {
      const component: HTMLElement = document.getElementById(_);
      const tagName: string = component ? component.tagName : null;
      if (tagName === "g") {
        const polyline: HTMLCollection = component.getElementsByTagName("polyline");
        if (polyline && polyline.length > 0) {
          const polylineId: string = polyline[0].id;
          this.deHighlightSVGCommLine(polylineId);
        }
        const commLine: HTMLCollection = component.getElementsByTagName("line");
        if (commLine && commLine.length > 0) {
          const commLineId: string = commLine[0].id;
          this.deHighlightSVGCommLine(commLineId);
        }
      } else if (tagName === "IMG") {
        this.dehighlightSVGImg(component.id);
      }
    });
  }

  // Dehighlight selected attackSurface's
  private removeAnimationFromAttackSurfaces(attackSurfaces: string[]) {
    attackSurfaces.forEach((_: string) => {
      const component: HTMLElement = document.getElementById(_);
      const tagName: string = component ? component.tagName : null;
      if (tagName === "g") {
        const polyline: HTMLCollection = component.getElementsByTagName("polyline");
        if (polyline && polyline.length > 0) {
          const polylineId: string = polyline[0].id;
          this.removeAnimation(component);
        }
        const commLine: HTMLCollection = component.getElementsByTagName("line");
        if (commLine && commLine.length > 0) {
          const commLineId: string = commLine[0].id;
          this.removeAnimation(component);
        }
      } else if (tagName === "IMG") {
        this.removeAnimation(component);
      }
    });
  }

  // Get attack surfaces from threat
  private getAttackSurfaces(threat: ThreatItem) {
    let attackSurfaces: string[] = [];
    if (threat.threatSource === "merged") {
      attackSurfaces = threat.attackPath.filter((_: string, index: number, array: string[]) =>
        index > 0 &&
        threat.attackPath[index - 1] === "-" &&
        array.indexOf(_) === index);
    } else {
      attackSurfaces = [threat.attackPath[0]];
    }

    return attackSurfaces;
  }

  // Show highlighted attack path
  public hightlightAttackPath(data: any) {
    const attackSurfaces: string[] = this.getAttackSurfaces(data.threat);
    if (data.highlight) {
      this.highlightAttackPaths(data.threat.attackPath);
      this.animateAttackSurfaces(attackSurfaces);
    } else {
      this.dehighlightAttackPaths(data.threat.attackPath);
      this.removeAnimationFromAttackSurfaces(attackSurfaces);
    }
  }

  // Remove animation from both commLine and IMG
  private removeAnimation(component: HTMLElement) {
    const removeImgElement = document.getElementById("animateThreatImg" + component.id);
    if (removeImgElement) {
      removeImgElement.remove();
    }

    const removeCommLineElement = document.getElementById("animateThreatCommLine" + component.id);
    if (removeCommLineElement) {
      removeCommLineElement.remove();
    }

    const lineElements = document.getElementsByClassName("lineAnimation");
    while (lineElements.length > 0) {
      lineElements[0].parentElement.remove();
    }

    const polylineAnimationElements = document.getElementsByClassName("polylineAnimation");
    while (polylineAnimationElements.length > 0) {
      polylineAnimationElements[0].parentElement.remove();
    }
  }

  // Animate highlighted SVG image
  private animateHighlightedSVGImg(component: HTMLElement) {
    const animationIMGContainer1 = document.createElement("div");
    animationIMGContainer1.id = "animateThreatImg" + component.id;
    animationIMGContainer1.classList.add("animationIMGContainer1");
    const animationIMGContainer2 = document.createElement("div");
    animationIMGContainer2.classList.add("animationIMGContainer2");

    const animationIMGContainerSphere1 = document.createElement("div");
    animationIMGContainerSphere1.classList.add("animationIMGContainerSphere1");
    const animationIMGContainerSphere2 = document.createElement("div");
    animationIMGContainerSphere2.classList.add("animationIMGContainerSphere2");

    animationIMGContainer2.appendChild(animationIMGContainerSphere1);
    animationIMGContainer2.appendChild(animationIMGContainerSphere2);

    animationIMGContainer1.appendChild(animationIMGContainer2);
    component.parentElement.insertBefore(animationIMGContainer1, component);
  }

  // Animate highlighted SVG commLine
  private animateHighlightedSVGCommLine(component: HTMLElement) {
    const line = component.querySelector("line");
    const polyline = component.querySelector("polyline");
    if (line) {
      line.insertAdjacentElement('afterend', this.showLineAnimation(line));
    }
    if (polyline) {
      polyline.insertAdjacentElement('afterend', this.showPolylineAnimation(polyline));
    }
  }

  // Show polyline animation when mouse hovering over related threat in "Modeling Threats Tab"
  private showPolylineAnimation(polyline: Element) {
    let polylineAnimationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const shadowPolyline = this.getPolylineShadow(polyline);
    polylineAnimationGroup.appendChild(shadowPolyline);
    return polylineAnimationGroup;
  }

  // Show line animation when mouse hovering over related threat in "Modeling Threats Tab"
  private showLineAnimation(line: Element) {
    let lineAnimationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const shadowLine = this.getLineShadow(line);
    lineAnimationGroup.appendChild(shadowLine);
    return lineAnimationGroup;
  }

  // Create polyline shadow at same place of existing polyLine position
  private getPolylineShadow(polyline: Element) {
    let shadowPolyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    shadowPolyline.setAttribute("points", polyline.getAttribute("points"));
    shadowPolyline.classList.add("polylineAnimation");
    shadowPolyline.setAttribute("tabindex", polyline.id);
    shadowPolyline.setAttribute("stroke", "lightpink");
    shadowPolyline.setAttribute("fill", "none");
    return shadowPolyline;
  }

  // Create line shadow at same place of existing line position
  private getLineShadow(line: Element) {
    const shadowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    shadowLine.setAttribute("x1", line.getAttribute("x1"));
    shadowLine.setAttribute("x2", line.getAttribute("x2"));
    shadowLine.setAttribute("y1", line.getAttribute("y1"));
    shadowLine.setAttribute("y2", line.getAttribute("y2"));
    shadowLine.classList.add("lineAnimation");
    shadowLine.setAttribute("tabindex", line.id);
    shadowLine.setAttribute("stroke", "lightpink");
    shadowLine.setAttribute("stroke-width", line.getAttribute("stroke-width"));
    return shadowLine;
  }

  private getLineMiddleCircle(line: Element) {
    let lineMiddleCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    lineMiddleCircle.setAttribute("r", "5");
    const x1: number = Number(line.getAttribute("x1"));
    const y1: number = Number(line.getAttribute("y1"));
    const x2: number = Number(line.getAttribute("x2"));
    const y2: number = Number(line.getAttribute("y2"));
    const xMiddle: number = x1 > x2 ? x1 - (x1 / x2) : x1 + (x2 / x1);
    const yMiddle: number = y1 > y2 ? y1 - (y1 / y2) : y1 + (y2 / y1);
    lineMiddleCircle.setAttribute("cx", xMiddle.toString());
    lineMiddleCircle.setAttribute("cy", yMiddle.toString());
    lineMiddleCircle.setAttribute("fill", "red");
    lineMiddleCircle.setAttribute("stroke-width", "0");
    return lineMiddleCircle;
  }

  // Get commLine animation position
  private getCommLineAnimationPosition(commLine: HTMLElement) {
    const lineStartTerminal: HTMLElement = commLine.querySelector(".lineStartTerminal");
    const lineEndTerminal: HTMLElement = commLine.querySelector(".lineEndTerminal");
    const lineStartTerminalCX: number = Number(lineStartTerminal.getAttribute("cx"));
    const lineStartTerminalCY: number = Number(lineStartTerminal.getAttribute("cy"));
    const lineEndTerminalCX: number = Number(lineEndTerminal.getAttribute("cx"));
    const lineEndTerminalCY: number = Number(lineEndTerminal.getAttribute("cy"));
    const angle: number = Math.atan2(lineEndTerminalCY - lineStartTerminalCY, lineEndTerminalCX - lineStartTerminalCX) * 180 / Math.PI;
    let xDiff: number = Math.abs(lineEndTerminalCX - lineStartTerminalCX);
    let yDiff: number = Math.abs(lineEndTerminalCY - lineStartTerminalCY);
    const lineWidth: number = xDiff > yDiff ? Math.abs(xDiff) : Math.abs(yDiff);
    let x: number = lineStartTerminalCX;
    let y: number = lineStartTerminalCY;
    if (yDiff > xDiff) {
      if (lineEndTerminalCY < lineStartTerminalCY) {
        x = lineStartTerminalCX;
        y = lineStartTerminalCY;
        yDiff = Math.abs(lineStartTerminalCY - lineEndTerminalCY)
        xDiff = Math.abs(lineStartTerminalCX - lineEndTerminalCX)
      }
    }
    return {
      x,
      y,
      lineWidth,
      lineHeight: 30,
      angle,
      xDiff,
      yDiff
    }
  }

  // Calculate angle between points
  private calculateAngle(xDiff: number, yDiff: number, lineStartTerminalCY: number, lineEndTerminalCY: number, lineStartTerminalCX: number, lineEndTerminalCX: number) {
    if (yDiff > xDiff) {
      return lineStartTerminalCY > lineEndTerminalCY ?
        Math.atan2(lineEndTerminalCY - lineStartTerminalCY, lineEndTerminalCX - lineStartTerminalCX) * 180 / Math.PI :
        Math.atan2(lineStartTerminalCY - lineEndTerminalCY, lineStartTerminalCX - lineEndTerminalCX) * 180 / Math.PI;
    } else {
      return Math.atan2(lineEndTerminalCY - lineStartTerminalCY, lineEndTerminalCX - lineStartTerminalCX) * 180 / Math.PI;
    }
  }

  // Animation for image component
  private commLineAnimation(startCordinatsX: number, startCordinatsY: number, lineWidth: number, lineHeight: number, xDiff: number = 0, yDiff: number = 0, angle: number, delay: number) {
    let xAdjust: number = 0;
    let yAdjust: number = 0;

    if (xDiff > yDiff) {
      yAdjust = angle < 0 ? -Math.abs(yDiff / 2) : yDiff / 2;
    } else {
      yAdjust = angle < 0 ? -Math.abs(yDiff / 2) : yDiff / 2;
      xAdjust = angle < 0 ? -Math.abs(lineWidth / 2) + (xDiff / 2) : -Math.abs(Math.abs(lineWidth / 2));
      if (angle < 0) {
        xAdjust = -Math.abs(lineWidth / 2) + (xDiff / 2);
      } else {
        xAdjust = angle > 90 ? -Math.abs(Math.abs(lineWidth / 2) + (xDiff / 2)) : -Math.abs(Math.abs(lineWidth / 2) - (xDiff / 2));
      }
    }
    const container1 = `left: ${startCordinatsX + xAdjust}px; top: ${startCordinatsY + yAdjust}px; transform: rotate(${angle}deg);`;
    const container2 = `height: ${lineHeight}px; width: ${lineWidth}px; `;
    const sphere1 = ``;
    const sphere2 = `
      animation: pulsate ${delay}ms ease-out infinite;`;

    return {
      container1,
      container2,
      sphere1,
      sphere2
    }
  }

  // Dehighlight component when user leave mouse from threat
  deHighlightSVGCommLine(commLineId: string) {
    let lineDrag = document.getElementById(commLineId);
    lineDrag.setAttribute("stroke-width", "5");
    lineDrag.setAttribute("stroke", "#3C98CF");
    let lineGroupDrag = document.getElementById(commLineId).parentElement;
    lineGroupDrag.querySelectorAll("circle")[0].setAttribute("stroke", "#3C98CF");
    lineGroupDrag.querySelectorAll("circle")[1].setAttribute("stroke", "#3C98CF");
    if (lineDrag.getAttribute("name") == polylineName) {
      var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'none'
        elems[index].setAttribute("stroke", "#3C98CF")
      }
    }
  }

  // GET Http request for systemConfig information
  private getSystemConfigData() {
    this._spinner.show();
    this._http
      .get(this.systemConfigRootUrl + "/systemconfig")
      .pipe(take(1))
      .subscribe((res: any) => {
        this._spinner.hide();
        if (res) {
          this.systemConfig = res;
        }
      });
  }

  // Get threat list
  private getResultData() {
    this.resultShared.resultSharedObs
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultData: any) => {
        this.threatList = resultData;
      });
  }

  // Calculate commLines positions over component and store them to relocate in newly dropped component
  private assignComponentCommLinePositions(commLines: any[], micro: any[], controlUnit: any[]) {
    if (commLines.length === 0) return;

    const components: any[] = [...micro, ...controlUnit];
    if (components.length > 0) {
      components.forEach(component => {
        const terminals: any[] = component.lineTerminalId;
        terminals.forEach((terminal: string) => {
          const terminalElement: Element = document.getElementById(terminal);
          if (terminalElement) {
            const terminalAxis: number[] = [Number(terminalElement.getAttribute("cx")), Number(terminalElement.getAttribute("cy"))];
            this.calculateCommLineTerminals(terminalElement.getAttribute("id"), component.id, terminalAxis);
          }
        });
      });
    }
  }

  // Update newDesign object for lastModifiedBy when there is any changes in newDesign object
  private updateLastModifiedBy() {
    if (this.currentUserProfile && this.currentUserProfile.username) {
      const userId: string = this.currentUserProfile._id;
      const newDesign = JSON.parse(localStorage.getItem('newDesign'));
      this.newDesign.project.lastModifiedBy = userId;
      newDesign.project.lastModifiedBy = userId;
      this.project.lastModifiedBy = userId;
      this.editDesignShared.updateProjectProperty(userId, "lastModifiedBy");
      localStorage.setItem('newDesign', JSON.stringify(newDesign));
    }
  }

  updateComponentInformation(designData: any) {
    const activeComponent: HTMLElement = document.getElementById(this.activeComponentId);
    if (activeComponent) {
      const classList = Array.prototype.slice.call(activeComponent.classList);
      if (classList.includes("micro")) {
        const componentIndex: any = this.ArrOp.findStringIndexInArrayProperty(this.activeComponentId, "id", this.microList);
        const text: string = designData.micro[componentIndex].nickName;
        const microDiv: HTMLElement = activeComponent.parentElement;
        if (microDiv) {
          const microText: HTMLElement = microDiv.querySelector("p");
          if (microText) {
            microText.innerHTML = text;
          }
        }
        const moduleText: HTMLElement = document.querySelector(`[tabindex="${this.activeComponentId}"]`);
        if (moduleText) {
          moduleText.innerHTML = text;
        }
      } else if (classList.includes("controlUnit")) {
        const componentIndex: any = this.ArrOp.findStringIndexInArrayProperty(this.activeComponentId, "id", this.controlUnitList);
        const text: string = designData.controlUnit[componentIndex].nickName;
        const controlUnit: HTMLElement = activeComponent.parentElement;
        if (controlUnit) {
          const controlUnitText: HTMLElement = controlUnit.querySelector("p");
          if (controlUnitText) {
            controlUnitText.innerHTML = text;
          }
        }
        const moduleText = document.querySelector(`[tabindex="${this.activeComponentId}"]`);
        if (moduleText) {
          moduleText.innerHTML = text;
        }
      }

      if (activeComponent.dataset.textId) {
        const componentIndex: any = this.ArrOp.findStringIndexInArrayProperty(this.activeComponentId, "id", this.boundaryList);
        const text: string = designData.boundary[componentIndex].nickName;
        const textContainerId: string = activeComponent.dataset.textId;
        if (textContainerId) {
          const textContainer: HTMLElement = document.getElementById(textContainerId);
          if (textContainer) {
            const textElement: HTMLElement = document.getElementById(textContainerId).querySelector("p");
            if (textElement) {
              textElement.innerHTML = text;
            }
          }
        }
        const moduleText: HTMLElement = document.querySelector(`[tabindex="${this.activeComponentId}"]`);
        if (moduleText) {
          moduleText.innerHTML = text;
        }
      }
    }

  }

  // drag and drop from sidebar to drawingCanvas
  dragStart(event: any) {
    const img = event.target.querySelector("img");
    // console.dir(img)
    // console.log(`img.className is ${img.className}, length is ${img.className.length}`)
    event.dataTransfer.setData("text/plain", img.className);  // let drop handler know the component being dragged
    dragFlag = 1;
  };
  allowDrop() {
    event.preventDefault();
  };

  dropped(event: any) {
    if (dragFlag == 1) { // dragFlag == 1 means it's a new item dragged from sidebar
      // console.log(`event.dataTransfer.getData("text") is ${event.dataTransfer.getData("text")}, length is ${event.dataTransfer.getData("text").length}`)
      let droppedComponent = this.componentLibrary.find(findComponent => findComponent.id === event.dataTransfer.getData("text"));
      // console.log(`droppedComponent is ${droppedComponent}`)
      // console.dir(droppedComponent)
      // if straight communication line component is dropped
      if (droppedComponent.id === "communicationLine") {
        // newComponentDroppedGroup is the group for the DOM of line, for visual only
        let newComponentDroppedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let newId = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDroppedGroup.id = newId;
        document.getElementById("svgViewBox").appendChild(newComponentDroppedGroup);
        // newComponentDropped is the line DOM
        let newComponentDropped = document.createElementNS("http://www.w3.org/2000/svg", "line");
        newComponentDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.setAttribute("class", "commLine");
        let xStart = event.clientX - sidebarWidth - 50 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let yStart = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        let xEnd = event.clientX - sidebarWidth + 50 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let yEnd = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        newComponentDropped.setAttribute("x1", xStart.toString());
        newComponentDropped.setAttribute("y1", yStart.toString());
        newComponentDropped.setAttribute("x2", xEnd.toString());
        newComponentDropped.setAttribute("y2", yEnd.toString());
        newComponentDropped.setAttribute("stroke", "#3C98CF");
        newComponentDropped.setAttribute("stroke-width", "5");
        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.dropSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (newId)) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newId; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
        document.getElementById(newId).appendChild(newComponentDropped);
        // newComponentDropped is the line-start handler DOM
        let newComponentHandlerStartDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerStartDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerStartDropped.setAttribute("class", "lineStartTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerStartDropped.setAttribute("cx", xStart.toString());
        newComponentHandlerStartDropped.setAttribute("cy", yStart.toString());
        newComponentHandlerStartDropped.setAttribute("r", "7");
        newComponentHandlerStartDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerStartDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerStartDropped.setAttribute("stroke-width", "5px");
        newComponentHandlerStartDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerStartDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerStartDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerStartDropped);
        let newComponentHandlerEndDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerEndDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerEndDropped.setAttribute("class", "lineEndTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerEndDropped.setAttribute("cx", xEnd.toString());
        newComponentHandlerEndDropped.setAttribute("cy", yEnd.toString());
        newComponentHandlerEndDropped.setAttribute("r", "7");
        newComponentHandlerEndDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerEndDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerEndDropped.setAttribute("stroke-width", "5px");
        newComponentHandlerEndDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerEndDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerEndDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerEndDropped);
        let nickNameTemp1 = "Line";
        let nickNameTemp2 = "0";
        if (this.lineList.length) { nickNameTemp2 = this.lineList.length.toString() };
        let nickName = nickNameTemp1.concat(nickNameTemp2);
        // component created in newDesign is used for analysis. we only record the line item. All other
        // dom elements can be derived from the properties of the line.
        this.lineList.push(new ComponentCommLine("", droppedComponent.type, newId,
          [xStart, yStart, xEnd, yEnd], [newComponentHandlerStartDropped.id, newComponentHandlerEndDropped.id],
          [], [], [], [], [], [], [], true, false, "", nickName, [], [], ["control"], ["conveyor"], droppedComponent.module, "", "", "", [], []));
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        this.renderProtocolTextAlongWithCommLine(newId);
        console.log("Line id " + newId + " has been created in newDesign.");
      }
      // if sensor input is dropped
      else if (droppedComponent.id == "sensorInput") {
        // newComponentDroppedGroup is the group for the DOM of line, for visual only
        let newComponentDroppedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let newId = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDroppedGroup.id = newId;
        document.getElementById("svgViewBox").appendChild(newComponentDroppedGroup);
        // newComponentDropped is the line DOM
        let newComponentDropped = document.createElementNS("http://www.w3.org/2000/svg", "line");
        newComponentDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.setAttribute("class", "commLine");
        let xStart = event.clientX - sidebarWidth - 50 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let yStart = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        let xEnd = event.clientX - sidebarWidth + 50 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let yEnd = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        newComponentDropped.setAttribute("x1", xStart.toString());
        newComponentDropped.setAttribute("y1", yStart.toString());
        newComponentDropped.setAttribute("x2", xEnd.toString());
        newComponentDropped.setAttribute("y2", yEnd.toString());
        newComponentDropped.setAttribute("stroke", "#3C98CF");
        newComponentDropped.setAttribute("stroke-width", "5");
        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.dropSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (newId)) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newId; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
        // newComponentDropped is the line-start handler DOM
        document.getElementById(newId).appendChild(newComponentDropped);
        let newComponentHandlerStartDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerStartDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerStartDropped.setAttribute("class", "lineStartTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerStartDropped.setAttribute("cx", xStart.toString());
        newComponentHandlerStartDropped.setAttribute("cy", yStart.toString());
        newComponentHandlerStartDropped.setAttribute("r", "7");
        newComponentHandlerStartDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerStartDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerStartDropped.setAttribute("stroke-width", "5px");
        newComponentHandlerStartDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerStartDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerStartDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerStartDropped);
        let newComponentHandlerEndDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerEndDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerEndDropped.setAttribute("class", "lineEndTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerEndDropped.setAttribute("cx", xEnd.toString());
        newComponentHandlerEndDropped.setAttribute("cy", yEnd.toString());
        newComponentHandlerEndDropped.setAttribute("r", "7");
        newComponentHandlerEndDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerEndDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerEndDropped.setAttribute("stroke-width", "5px");
        newComponentHandlerEndDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerEndDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerEndDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerEndDropped);
        let nickNameTemp1 = "Sensor Input";
        let nickNameTemp2 = "0";
        if (this.lineList.length) { nickNameTemp2 = this.lineList.length.toString() };
        let nickName = nickNameTemp1.concat(" ", nickNameTemp2);
        // component created in newDesign is used for analysis. we only record the line item. All other
        // dom elements can be derived from the properties of the line.
        this.lineList.push(new ComponentCommLine("", droppedComponent.type, newId,
          [xStart, yStart, xEnd, yEnd], [newComponentHandlerStartDropped.id, newComponentHandlerEndDropped.id],
          [], [], [], [], [], [], [], true, true, "", nickName, [], [], ["control"], ["conveyor"], droppedComponent.module, "", "", "", [], []));
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        console.log("Sensor Input with line id " + newId + " has been created in newDesign.");
      }
      // if microcontroller components are dropped
      else if (droppedComponent.id === "microcontroller" || droppedComponent.id === "memory") {
        const microControllerDroppedDiv = document.createElement("div");
        microControllerDroppedDiv.setAttribute("class", "micro-container");
        microControllerDroppedDiv.id = this.genRandomId();

        const microControllerDroppedContentDiv = document.createElement("div");
        microControllerDroppedContentDiv.id = this.genRandomId();

        // newComponentDropped is the DOM, for visual only
        let newComponentDropped = document.createElement("img");
        // identify the component dropped from the componentLibrary
        newComponentDropped.src = droppedComponent.image;
        let newId = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.id = newId;
        let x = event.clientX - sidebarWidth - 40 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let y = event.clientY - 40 - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        newComponentDropped.setAttribute("class", droppedComponent.type);
        newComponentDropped.addEventListener("mouseup", (event) => {
          if (event.button == 0) { // trigger only when left button is up
            this.connectOverlappedCommLineWithModule();
            this.addMicroOrControlUnitToLineComponent(event);
            this.updateMicroLineAfterMovingLine(event);
            this.dropSvgTerminalAtImg(event);
          }
        });
        if (droppedComponent.id === "microcontroller") {
          newComponentDropped.src = "./assets/images/micro.svg";
        } else {
          newComponentDropped.src = "./assets/images/chip.svg";
        }
        newComponentDropped.style.border = "3px solid #3C98CF";
        newComponentDropped.addEventListener("mouseenter", (event) => this.moveSvgTerminalIntoImg(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.moveSvgTerminalOutOfImg(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);

        microControllerDroppedContentDiv.appendChild(newComponentDropped);
        microControllerDroppedDiv.style.top = y + "px";
        microControllerDroppedDiv.style.left = x + "px";
        microControllerDroppedDiv.appendChild(microControllerDroppedContentDiv)
        document.getElementById("drawingCanvas").appendChild(microControllerDroppedDiv);

        let nickNameTemp1 = null;
        if (droppedComponent.id === "microcontroller") {
          nickNameTemp1 = "Microcontroller";
        } else {
          nickNameTemp1 = "Memory Chip";
        }
        let nickNameTemp2 = "0";
        if (this.microList.length) { nickNameTemp2 = this.microList.length.toString() };
        let nickName = nickNameTemp1.concat(nickNameTemp2);

        this.showModuleText(newId, nickName, x + 40, y);
        // component created in newDesign is used for analysis
        this.microList.push(new ComponentMicro("", droppedComponent.type, newId,
          [x, y], "", [], [], false, nickName, [], [], [], [],
          [], [], [], droppedComponent.module, "", "", [], ""));
        console.log(droppedComponent.model + " id " + newId + " has been created in newDesign.");
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        // console.log(this.newDesign);
      }
      // if boundary components are dropped. Not sure why the name order is reversed by dragevent
      else if (droppedComponent.id === "moduleBoundary") {
        // newComponentDropped is the DOM, for visual only
        let newComponentDroppedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");          // identify the component dropped from the componentLibrary
        const newId = this.genRandomId();
        newComponentDroppedGroup.id = newId;  // each component on the canvas has a unique id
        newComponentDroppedGroup.dataset.textId = this.genRandomId();
        document.getElementById("svgViewBox").appendChild(newComponentDroppedGroup);
        // newComponentDropped is the line DOM
        let newComponentDropped = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newComponentDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.setAttribute("class", "boundary");
        let x = event.clientX - sidebarWidth + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let y = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        let boundaryWidth = 400;
        let boundaryHeight = 400;
        newComponentDropped.setAttribute("x", x.toString());
        newComponentDropped.setAttribute("y", y.toString());
        newComponentDropped.setAttribute("width", boundaryWidth.toString());
        newComponentDropped.setAttribute("height", boundaryHeight.toString());
        newComponentDropped.setAttribute("stroke", "#3C98CF");
        newComponentDropped.setAttribute("stroke-dasharray", "120 10");
        newComponentDropped.setAttribute("stroke-width", "5");
        newComponentDropped.setAttribute("fill", "none");
        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseleave", this.dropSVGLineBoundary);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == newComponentDroppedGroup.id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newComponentDroppedGroup.id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
        document.getElementById(newComponentDroppedGroup.id).appendChild(newComponentDropped);
        let newComponentStartHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentStartHandlerDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentStartHandlerDropped.setAttribute("class", "boundaryStartTerminal"); // class name is mainly used in mousemove event to determine which end of the rect moves
        newComponentStartHandlerDropped.setAttribute("cx", x.toString());
        newComponentStartHandlerDropped.setAttribute("cy", y.toString());
        newComponentStartHandlerDropped.setAttribute("r", "7");
        newComponentStartHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentStartHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentStartHandlerDropped.setAttribute("stroke-width", "5");
        newComponentStartHandlerDropped.style.display = 'none';
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newComponentDroppedGroup.id).appendChild(newComponentStartHandlerDropped);
        let newComponentEndHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentEndHandlerDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentEndHandlerDropped.setAttribute("class", "boundaryEndTerminal"); // class name is mainly used in mousemove event to determine which end of the rect moves
        let cx2 = x + boundaryWidth;
        let cy2 = y + boundaryHeight;
        newComponentEndHandlerDropped.setAttribute("cx", cx2.toString());
        newComponentEndHandlerDropped.setAttribute("cy", cy2.toString());
        newComponentEndHandlerDropped.setAttribute("r", "7");
        newComponentEndHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentEndHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentEndHandlerDropped.setAttribute("stroke-width", "5");
        newComponentEndHandlerDropped.style.display = 'none';
        newComponentEndHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentEndHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentEndHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newComponentDroppedGroup.id).appendChild(newComponentEndHandlerDropped);
        let nickNameTemp1 = "Boundary";
        let nickNameTemp2 = "0";
        if (this.boundaryList.length) { nickNameTemp2 = this.boundaryList.length.toString() };
        let nickName = nickNameTemp1.concat(nickNameTemp2);

        // document.getElementById("drawingCanvas").appendChild(boundaryTextContainer);
        this.showModuleText(newId, nickName, x + (boundaryWidth / 2), y);
        // component created in newDesign is used for analysis. we only record the boundary item. All other
        // dom elements can be derived from the properties of the boundary.
        this.boundaryList.push(new ComponentBoundary(droppedComponent.model, droppedComponent.type,
          newComponentDroppedGroup.id, [x, y], [boundaryWidth, boundaryHeight], true, false, nickName));
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        console.log("Boundary id " + newComponentDroppedGroup.id + " has been created in newDesign.");
      }
      // if communication line - polyline is dropped
      else if (droppedComponent.id === "communicationPolyline") {
        // newComponentDroppedGroup is the group for the DOM of line, for visual only
        let newComponentDroppedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let newId = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDroppedGroup.id = newId;
        document.getElementById("svgViewBox").appendChild(newComponentDroppedGroup);
        // newComponentDropped is the line DOM
        let newComponentDropped = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        newComponentDropped.setAttribute("name", polylineName);
        newComponentDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.setAttribute("class", "commLine");
        let xStart = event.clientX - sidebarWidth - 50 + document.getElementById("modelViewContent").scrollLeft;
        let yStart = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        let xEnd = event.clientX - sidebarWidth + 50 + document.getElementById("modelViewContent").scrollLeft;
        let yEnd = event.clientY - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset + 50;
        let x1 = xStart;
        let y1 = yStart;
        let x2;
        let y2;
        let x3;
        let y3;
        let x4 = xEnd;
        let y4 = yEnd;
        x2 = x1 + (x4 - x1) / 2;
        x3 = x1 + (x4 - x1) / 2;
        y2 = y1;
        y3 = y4;
        newComponentDropped.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
        newComponentDropped.setAttribute("stroke", "#3C98CF");
        newComponentDropped.setAttribute("stroke-width", "5");
        newComponentDropped.setAttribute("fill", "none");
        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.dropSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (newId)) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newId; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);

        document.getElementById(newId).appendChild(newComponentDropped);
        // newComponentDropped is the line-start handler DOM
        let newComponentHandlerStartDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerStartDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerStartDropped.setAttribute("class", "lineStartTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerStartDropped.setAttribute("cx", xStart.toString());
        newComponentHandlerStartDropped.setAttribute("cy", yStart.toString());
        newComponentHandlerStartDropped.setAttribute("r", "7");
        newComponentHandlerStartDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerStartDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerStartDropped.setAttribute("stroke-width", "5");
        newComponentHandlerStartDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerStartDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerStartDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerStartDropped);
        let newComponentHandlerEndDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentHandlerEndDropped.id = this.genRandomId();  // each component on the canvas has a unique id
        newComponentHandlerEndDropped.setAttribute("class", "lineEndTerminal"); // class name is mainly used in mousemove event to determine which end of the line moves
        newComponentHandlerEndDropped.setAttribute("cx", xEnd.toString());
        newComponentHandlerEndDropped.setAttribute("cy", yEnd.toString());
        newComponentHandlerEndDropped.setAttribute("r", "7");
        newComponentHandlerEndDropped.setAttribute("fill", "#FFFCF5");
        newComponentHandlerEndDropped.setAttribute("stroke", "#3C98CF");
        newComponentHandlerEndDropped.setAttribute("stroke-width", "5");
        newComponentHandlerEndDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerEndDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerEndDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        document.getElementById(newId).appendChild(newComponentHandlerEndDropped);
        let newComponentStartHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentStartHandlerDropped.id = newComponentDropped.id + '_1';  // each component on the canvas has a unique id
        newComponentStartHandlerDropped.setAttribute("class", "inlineHandler"); // class name is mainly used in mousemove event to determine which end of the rect moves
        newComponentStartHandlerDropped.setAttribute("cx", x2.toString());
        newComponentStartHandlerDropped.setAttribute("cy", ((y2 + y3) / 2).toString());
        newComponentStartHandlerDropped.setAttribute("r", "7");
        newComponentStartHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentStartHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentStartHandlerDropped.setAttribute("stroke-width", "5");
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentStartHandlerDropped.style.display = 'none';
        document.getElementById(newComponentDroppedGroup.id).appendChild(newComponentStartHandlerDropped);
        let nickNameTemp1 = "Line";
        let nickNameTemp2 = "0";
        if (this.lineList.length) { nickNameTemp2 = this.lineList.length.toString() };
        let nickName = nickNameTemp1.concat(nickNameTemp2);
        // component created in newDesign is used for analysis. we only record the line item. All other
        // dom elements can be derived from the properties of the line.
        this.lineList.push(new ComponentCommLine("", droppedComponent.type, newId,
          [x1, y1, x2, y2, x3, y3, x4, y4], [newComponentHandlerStartDropped.id, newComponentHandlerEndDropped.id],
          [], [], [], [], [], [], [], true, false, "", nickName, [], [], ["control"], ["conveyor"], droppedComponent.module, "", "", "", [], []));
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        this.renderProtocolTextAlongWithCommLine(newId);
        console.log("Line id " + newId + " has been created in newDesign.");
      }
      // if controlUnit components are dropped
      else {
        const controlUnitDropped = document.createElement("div");
        controlUnitDropped.setAttribute("class", "control-unit-container");
        controlUnitDropped.id = this.genRandomId();

        const controlUnitDroppedContent = document.createElement("div");
        controlUnitDroppedContent.id = this.genRandomId();

        // newComponentDropped is the DOM, for visual only
        let newComponentDropped = document.createElement("img");
        // identify the component dropped from the componentLibrary
        let newId = this.genRandomId();  // each component on the canvas has a unique id
        newComponentDropped.id = newId;
        let x = event.clientX - sidebarWidth - 40 + document.getElementById("modelViewContent").scrollLeft + window.pageXOffset;
        let y = event.clientY - 40 - navBarHeight + document.getElementById("modelViewContent").scrollTop + window.pageYOffset;
        newComponentDropped.setAttribute("class", droppedComponent.type);
        document.getElementById("drawingCanvas").appendChild(newComponentDropped);
        newComponentDropped.addEventListener("mouseup", (event) => {
          if (event.button == 0) { // trigger only when left button is up
            this.connectOverlappedCommLineWithModule();
            this.addMicroOrControlUnitToLineComponent(event);
            this.updateControlUnitLineAfterMovingLine(event);
            this.dropSvgTerminalAtImg(event);
          }
        });
        newComponentDropped.addEventListener("mouseenter", (event) => this.moveSvgTerminalIntoImg(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.moveSvgTerminalOutOfImg(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change adtive id
            this.editDesignShared.openSidePanel();
          }
        }, false);

        controlUnitDroppedContent.appendChild(newComponentDropped);
        controlUnitDropped.style.top = y + "px";
        controlUnitDropped.style.left = x + "px";
        controlUnitDropped.appendChild(controlUnitDroppedContent)
        document.getElementById("drawingCanvas").appendChild(controlUnitDropped);
        let nickNameTemp1 = "";
        let nickNameTemp2 = "0";
        if (this.controlUnitList.length) { nickNameTemp2 = this.controlUnitList.length.toString() };
        switch (droppedComponent.id) {
          case "generalModule":
            newComponentDropped.src = "./assets/images/general-module.svg";
            nickNameTemp1 = "Module";
            break;
          case "backendModule":
            newComponentDropped.src = "./assets/images/backend.svg";
            nickNameTemp1 = "Backend";
            break;
          case "userAttacker":
            newComponentDropped.src = "./assets/images/actor.svg";
            nickNameTemp1 = "Actor";
            break;
        }
        newComponentDropped.style.border = "3px solid #3C98CF";
        let nickName = nickNameTemp1.concat(nickNameTemp2);
        this.showModuleText(newId, nickName, x + 40, y);
        // component created in newDesign is used for analysis
        this.controlUnitList.push(new ComponentControlUnit(droppedComponent.model, droppedComponent.type,
          newId, [x, y], [], [], false, nickName, [],
          [], [], [], [], [], [], droppedComponent.module, "", "", ""));
        this.editDesignShared.updateNewDesignComponents(this.newDesign);
        console.log(droppedComponent.model + " id " + newId + " has been created in newDesign.");
      }
      dragFlag = 0;
    } else {  // if item is not from the sidebar, move it instead of creating a new DOM element
      // unique id, stored in event.dataTransfer, is used to identify the moved components from either lineList or microList
      if (!(this.ArrOp.findStringIndexInArrayProperty(event.dataTransfer.getData("text"), "id", this.lineList) === undefined)) { // if straight line item is moved
        // svg element movement is controlled by a different function, mouseMoveSvg(event)
      } else if (!(this.ArrOp.findStringIndexInArrayProperty(event.dataTransfer.getData("text"), "id", this.microList) === undefined)) { // if micro component is moved
        const componentPosition = this.updateDroppedComponentPosition(event);
        // also update the coordinates of the connected lines
        const componentIndex = this.ArrOp.findStringIndexInArrayProperty(event.dataTransfer.getData("text"), "id", this.microList);
        this.newDesign.micro[componentIndex].position = [componentPosition.x, componentPosition.y];
        if (this.newDesign.micro[componentIndex].lineTerminalId.length > 0) { // if the micro has line terminals attached, move those terminals (not functional)
          this.updateTerminalPositionsWithComponent(event.dataTransfer.getData("text"), this.microList, "micro", componentPosition);
        }
        const microId: string = this.newDesign.micro[componentIndex].id;
        const module: HTMLElement = document.getElementById(microId);
        const x: number = Number(module.parentElement.parentElement.style.left.replace("px", "")) + 40;
        const y: number = Number(module.parentElement.parentElement.style.top.replace("px", ""));
        this.updateModuleText(microId, x, y);
        // this.editDesignShared.updateNewDesignComponents(this.newDesign);
        console.log("Position of microcontroller id " + microId + " has been updated in newDesign.");
      } else if (!(this.ArrOp.findStringIndexInArrayProperty(event.dataTransfer.getData("text"), "id", this.controlUnitList) === undefined)) { // if controlUnit component is moved
        const componentPosition = this.updateDroppedComponentPosition(event);
        // also update the coordinates of the connected lines
        let componentIndex = this.ArrOp.findStringIndexInArrayProperty(event.dataTransfer.getData("text"), "id", this.controlUnitList);
        this.newDesign.controlUnit[componentIndex].position = [componentPosition.x, componentPosition.y];
        if (this.newDesign.controlUnit[componentIndex].lineTerminalId.length > 0) { // if the controlUnit has line terminals attached, move those terminals (not functional)
          this.updateTerminalPositionsWithComponent(event.dataTransfer.getData("text"), this.controlUnitList, "controlUnit", componentPosition);
        }
        const controlUnitId: string = this.newDesign.controlUnit[componentIndex].id;
        const module: HTMLElement = document.getElementById(controlUnitId);
        const x: number = Number(module.parentElement.parentElement.style.left.replace("px", "")) + 40;
        const y: number = Number(module.parentElement.parentElement.style.top.replace("px", ""));
        this.updateModuleText(controlUnitId, x, y);
        // this.newDesign.controlUnit[componentIndex]?.lineId.forEach((lineId: string) => {
        //   const textProtocolDisplay: boolean = this.editDesignShared.getCommLineProperty(lineId, "textProtocolDisplay");
        //   this.editDesignShared.showHideTextPosition({ show: !textProtocolDisplay ? false : true, commLineId: lineId });
        // });
        console.log("Position of controlUnit id " + controlUnitId + " has been updated in newDesign.");
      }
    }
  };

  // Update text position along with module
  private updateModuleText(moduleId: string, x: number, y: number) {
    const moduleText = document.querySelector(`[tabindex="${moduleId}"]`);
    if (moduleText) {
      moduleText.setAttribute("x", x.toString());
      moduleText.setAttribute("y", y.toString());
    }
  }

  // Show module text when it is rendered via drag/drop from left sidepanel or existing saved model
  private showModuleText(moduleId: string, moduleText: string, x: number, y: number, existingId: string = '') {
    const newId = this.genRandomId();
    const moduleProtocolText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    moduleProtocolText.id = existingId ? existingId : newId;  // each component on the canvas has a unique id
    moduleProtocolText.setAttribute("class", "module-text"); // class name is mainly used in mousemove event to determine which end of the rect moves
    moduleProtocolText.setAttribute("x", x.toString());
    moduleProtocolText.setAttribute("y", y.toString());
    moduleProtocolText.setAttribute("dx", "10");
    moduleProtocolText.setAttribute("dy", "-8");
    moduleProtocolText.setAttribute("tabindex", moduleId);
    moduleProtocolText.setAttribute("lengthAdjust", "spacingAndGlyphs");
    moduleProtocolText.setAttribute("text-anchor", "middle");
    moduleProtocolText.addEventListener("mouseup", (event) => this.endSvgMove(event));
    moduleProtocolText.addEventListener("mousedown", (event) => this.mouseDownSvg(event));
    moduleProtocolText.addEventListener("mousemove", (event) => this.mouseMoveSvg(event));
    moduleProtocolText.innerHTML = `${moduleText}`;
    document.getElementById("svgViewBox").appendChild(moduleProtocolText);
  }

  // Show existing protocol (baseProtocol, appProtocol and secureProtocol) text related to commLine (straight and polyline)
  private showProtocolText(commLineId: string) {
    const commLineProtocolsText = document.querySelector(`[tabindex="${commLineId}"]`);
    if (commLineProtocolsText) {
      commLineProtocolsText.setAttribute("visibility", "visible");
    }
  }

  // Remove protocol (baseProtocol, appProtocol and secureProtocol) text related to commLine (straight and polyline)
  private removeProtocolText(commLineId: string) {
    const commLineProtocolsText = document.querySelector(`[tabindex="${commLineId}"]`);
    if (commLineProtocolsText) {
      commLineProtocolsText.setAttribute("visibility", "hidden");
    }
  }

  // Calculate protocol text initial default position 
  private calculateProtocolTextPosition(lineStartTerminalCX: string, lineStartTerminalCY: string, lineEndTerminalCX: string, lineEndTerminalCY: string) {
    const gapX = Number(lineEndTerminalCX) - Number(lineStartTerminalCX);
    const middlePositionX = gapX / 2;
    const positionX = Number(lineStartTerminalCX) + middlePositionX;

    const gapY = Number(lineEndTerminalCY) - Number(lineStartTerminalCY);
    const middlePositionY = gapY / 2;
    const positionY = Number(lineStartTerminalCY) + middlePositionY;

    return { x: positionX, y: positionY };
  }

  // Place protocol (baseProtocol, appProtocol and secureProtocol) text related to commLine (straight and polyline)
  private renderProtocolTextAlongWithCommLine(commLineId: string) {
    const newDesignCommLine = this.newDesign.commLine.find(obj => obj.id == commLineId);
    const commLine = document.getElementById(commLineId);
    const existingCommLineProtocolsText = document.querySelector(`[tabindex="${commLineId}"]`);
    if (existingCommLineProtocolsText) {
      existingCommLineProtocolsText.remove();
    }
    if (newDesignCommLine && commLine) {
      const lineStartTerminal = commLine.querySelector(".lineStartTerminal");
      const lineEndTerminal = commLine.querySelector(".lineEndTerminal");
      if (lineStartTerminal && lineEndTerminal) {
        const lineStartTerminalCX = lineStartTerminal.getAttribute("cx");
        const lineStartTerminalCY = lineStartTerminal.getAttribute("cy");
        const lineEndTerminalCX = lineEndTerminal.getAttribute("cx");
        const lineEndTerminalCY = lineEndTerminal.getAttribute("cy");
        const gap = Number(lineEndTerminalCX) - Number(lineStartTerminalCX);
        const middlePosition = gap / 2;
        const midllePositionX = Number(lineStartTerminalCX) + middlePosition;
        const textPosition = this.calculateProtocolTextPosition(lineStartTerminalCX, lineStartTerminalCY, lineEndTerminalCX, lineEndTerminalCY);
        const newId = this.genRandomId();
        const commLineProtocolText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        commLineProtocolText.id = newId;  // each component on the canvas has a unique id
        commLineProtocolText.setAttribute("class", "commLineProtocolText"); // class name is mainly used in mousemove event to determine which end of the rect moves
        commLineProtocolText.setAttribute("x", textPosition.x.toString());
        commLineProtocolText.setAttribute("y", textPosition.y.toString());
        commLineProtocolText.setAttribute("dx", "10");
        commLineProtocolText.setAttribute("dy", "-8");
        commLineProtocolText.setAttribute("tabindex", commLineId);
        commLineProtocolText.setAttribute("lengthAdjust", "spacingAndGlyphs");
        commLineProtocolText.setAttribute("text-anchor", "middle");
        commLineProtocolText.addEventListener("mouseup", (event) => this.endSvgMove(event));
        commLineProtocolText.addEventListener("mousedown", (event) => this.mouseDownSvg(event));
        commLineProtocolText.addEventListener("mousemove", (event) => this.mouseMoveSvg(event));
        this.setProtocolText(commLineProtocolText, newDesignCommLine);
      }
    }
  }

  // Add/update text according to protocols selection from property panel
  private setProtocolText(commLineProtocolTextElement: any, newDesignCommLine: any) {
    let protocols = [];
    const baseProtocol = newDesignCommLine.baseProtocol ? `${newDesignCommLine.baseProtocol}` : '';
    protocols = [baseProtocol];
    if (newDesignCommLine.appProtocol && newDesignCommLine.appProtocol.length > 0) {
      const appProtocol = newDesignCommLine.appProtocol.length > 1 ? `${newDesignCommLine.appProtocol[0]}, ...` : `${newDesignCommLine.appProtocol[0]}`;
      protocols.push(appProtocol);
    }
    if (newDesignCommLine.secureProtocol && newDesignCommLine.secureProtocol.length > 0) {
      const secureProtocol = newDesignCommLine.secureProtocol.length > 1 ? `${newDesignCommLine.secureProtocol[0]}, ...` : `${newDesignCommLine.secureProtocol[0]}`;
      protocols.push(secureProtocol);
    }
    protocols = protocols.filter(e => e);
    if (protocols.length > 0) {
      const protocolsText = protocols.join(" | ");
      commLineProtocolTextElement.innerHTML = `${protocolsText}`;
      document.getElementById("svgViewBox").appendChild(commLineProtocolTextElement);
    } else {
      commLineProtocolTextElement.remove();
    }
  }

  // Update component position after dropped to a new position
  private updateDroppedComponentPosition(event: any) {
    let movedComponent = document.getElementById(event.dataTransfer.getData("text"));
    const movedComponentParent = movedComponent.parentElement;
    if (movedComponentParent.id !== "drawingCanvas") {
      movedComponent = document.getElementById(event.dataTransfer.getData("text")).parentElement.parentElement;
    }
    const movedComponentPositionX = parseInt(movedComponent.style.left, 10);
    const movedComponentPositionY = parseInt(movedComponent.style.top, 10);

    let componentX = (movedComponentPositionX + this.globalScrollX) + (event.clientX - movedComponentPositionX) - shiftX - sidebarWidth;
    let componentY = (movedComponentPositionY + this.globalScrollY) + (event.clientY - movedComponentPositionY) - shiftY - navBarHeight;

    if (componentX < this.minModuleSpace.X) {
      componentX = this.minModuleSpace.X;
    }

    if (componentY < this.minModuleSpace.Y) {
      componentY = this.minModuleSpace.Y;
    }

    movedComponent.style.left = componentX + "px";
    movedComponent.style.top = componentY + "px";

    return { x: componentX, y: componentY };
  }
  // function to calibrate coordinates of <img> elements
  // mouseDownImg(event: any) {
  //   if (event.button == 0) { // only if it's left button down
  //     // console.log(`event.clientX is ${event.clientX}, event.pageX is ${event.pageX}, event.screenX is ${event.screenX}`)
  //     diffX = Number(event.target.getBoundingClientRect().left) - event.clientX; // offset from img left to mouse location
  //     diffY = Number(event.target.getBoundingClientRect().top) - event.clientY; // offset from img top to mouse location
  //   }
  // }
  // functions to move SVG elements. <img> elements are moved by a different mechanism, dropped(event), moveStart(event), etc.
  mouseDownSvg(event: any) {
    event.preventDefault();
    if (event.button == 0) { // only if it's left button down
      mouseDownFlag = true;
      elementWithFocus = event.target;
      mouseDownX = event.clientX;
      mouseDownY = event.clientY;
      const elementCheck = elementWithFocus.getAttribute("class");
      const scrollX: number = document.getElementById("modelViewContent").scrollLeft;
      const scrollY: number = document.getElementById("modelViewContent").scrollTop;
      switch (elementCheck) {
        case "module-text":
          diffX = Number(elementWithFocus.getAttribute("x")) - mouseDownX - scrollX; // offsets from previous text to mouse location
          diffY = Number(elementWithFocus.getAttribute("y")) - mouseDownY - scrollY; // offsets from previous text to mouse location
          break;
        case "commLineProtocolText":
          diffX = Number(elementWithFocus.getAttribute("x")) - mouseDownX; // offsets from previous text to mouse location
          diffY = Number(elementWithFocus.getAttribute("y")) - mouseDownY; // offsets from previous text to mouse location
          break;
        case "commLine":
          if (elementWithFocus.getAttribute("name") && elementWithFocus.getAttribute("name") == polylineName) {
            let points = elementWithFocus.getAttribute("points");
            let coordinates = points.split(" ");
            if (coordinates.length < 5) {
              diffX1 = Number(coordinates[0].split(",")[0]) - mouseDownX; // offsets from terminals to mouse location
              diffY1 = Number(coordinates[0].split(",")[1]) - mouseDownY;
              diffX2 = Number(coordinates[1].split(",")[0]) - mouseDownX;
              diffY2 = Number(coordinates[1].split(",")[1]) - mouseDownY;
              diffX3 = Number(coordinates[2].split(",")[0]) - mouseDownX;
              diffY3 = Number(coordinates[2].split(",")[1]) - mouseDownY;
              diffX4 = Number(coordinates[3].split(",")[0]) - mouseDownX;
              diffY4 = Number(coordinates[3].split(",")[1]) - mouseDownY;
            } else {
              diffX1 = Number(coordinates[0].split(",")[0]) - mouseDownX; // offsets from terminals to mouse location
              diffY1 = Number(coordinates[0].split(",")[1]) - mouseDownY;
              diffX2 = Number(coordinates[1].split(",")[0]) - mouseDownX;
              diffY2 = Number(coordinates[1].split(",")[1]) - mouseDownY;
              diffX3 = Number(coordinates[2].split(",")[0]) - mouseDownX;
              diffY3 = Number(coordinates[2].split(",")[1]) - mouseDownY;
              diffX4 = Number(coordinates[3].split(",")[0]) - mouseDownX;
              diffY4 = Number(coordinates[3].split(",")[1]) - mouseDownY;
              diffX5 = Number(coordinates[coordinates.length - 1].split(",")[0]) - mouseDownX;
              diffY5 = Number(coordinates[coordinates.length - 1].split(",")[1]) - mouseDownY;
            }
          } else {
            diffX1 = Number(elementWithFocus.getAttribute("x1")) - mouseDownX; // offsets from terminals to mouse location
            diffY1 = Number(elementWithFocus.getAttribute("y1")) - mouseDownY;
            diffX2 = Number(elementWithFocus.getAttribute("x2")) - mouseDownX;
            diffY2 = Number(elementWithFocus.getAttribute("y2")) - mouseDownY;
          }
          break;
        case "lineStartTerminal":
        case "lineEndTerminal":
          targetTerminalSVG = elementWithFocus.id;
          if (elementWithFocus.getAttribute("line-name") == 'sensorInput') {
            diffX = Number(elementWithFocus.getAttribute("x")) - mouseDownX - scrollX; // offsets from terminals to mouse location
            diffY = Number(elementWithFocus.getAttribute("y")) - mouseDownY - scrollY; // offsets from terminals to mouse location
          } else {
            diffX = Number(elementWithFocus.getAttribute("cx")) - mouseDownX - scrollX; // offsets from terminals to mouse location
            diffY = Number(elementWithFocus.getAttribute("cy")) - mouseDownY - scrollY; // offsets from terminals to mouse location
          }
          // console.log(diffY)
          break;
        case "inlineHandler":
          diffX = Number(elementWithFocus.getAttribute("cx")) - mouseDownX - scrollX; // offsets from terminals to mouse location
          diffY = Number(elementWithFocus.getAttribute("cy")) - mouseDownY - scrollY; // offsets from terminals to mouse location
          break;
        case "boundary":
          diffX = Number(elementWithFocus.getAttribute("x")) - mouseDownX; // offsets from terminals to mouse location
          diffY = Number(elementWithFocus.getAttribute("y")) - mouseDownY; // offsets from terminals to mouse location
          break;
        case "boundaryStartTerminal":
        case "boundaryEndTerminal":
          diffX = Number(elementWithFocus.getAttribute("cx")) - mouseDownX - scrollX; // offsets from terminals to mouse location
          diffY = Number(elementWithFocus.getAttribute("cy")) - mouseDownY - scrollY; // offsets from terminals to mouse location
          break;
      }
    }
  };

  // Update commLineProtocolText position when mouse position changes
  updateCommLineProtocolTextVisualPos(event: MouseEvent): void {
    const textElement = document.getElementById(elementWithFocus.id);
    const x = event.x + diffX;
    const y = event.y + diffY;
    textElement.setAttribute("x", x.toString());
    textElement.setAttribute("y", y.toString());
  }

  // Detect modules and terminals that overlap when the line move by the mouse's left button.
  private detectModulesToConnectWithCommLine(targetCommLineId: any) {
    if (!targetCommLineId) {
      return [];
    }
    const targetCommLine: HTMLElement = document.getElementById(targetCommLineId);
    const targetCommLineParentId: string = targetCommLine.parentElement.id;
    const targetCommLineTerminals: NodeList = targetCommLine?.parentElement.querySelectorAll(".lineStartTerminal, .lineEndTerminal");
    if (!targetCommLineTerminals) return [];
    const modules: any[] = [...this.newDesign.micro, ...this.newDesign.controlUnit];
    const detectedModulesAndTerminals: any[] = [];
    targetCommLineTerminals.forEach((terminalToConnectWithModule: any) => {
      const x: number = Number(terminalToConnectWithModule.getAttribute("cx"));
      const y: number = Number(terminalToConnectWithModule.getAttribute("cy"));
      const moduleToBeConnected: any = modules.find((module: any) => { // Find out a module when the terminal's [x, y] coordinate is within the module's coordinate.
        if (module.lineId.includes(targetCommLineParentId)) return false;
        let modulePositionFirst: number[] = module.position;
        if (modulePositionFirst && modulePositionFirst.length > 0) {
          let modulePositionLast: number[] = modulePositionFirst.map((value: number) => value + 100);
          if (x > modulePositionFirst[0] && x < modulePositionLast[0] && y > modulePositionFirst[1] && y < modulePositionLast[1]) {
            return true;
          }
        }
        this.deHighlightOverlappedModules([module.id]);
        return false;
      });
      if (moduleToBeConnected) {
        detectedModulesAndTerminals.push({ module: moduleToBeConnected, terminal: terminalToConnectWithModule }); // Collect both the module and terminal information that overlapped.
      }
    });

    return detectedModulesAndTerminals;
  }

  // Calculate polyline starting and ending coordinates by terminal CSS class.
  private calculatePolylineStartingAndEndingCoordinate(terminal: HTMLElement, terminalInitialCoordinateIndex: number = 1) {
    let polyline: HTMLCollection = terminal.parentElement.getElementsByTagName("polyline");
    let terminalClass: string = terminal.classList[0];
    let lineStartingCoordinate: number[] = [];
    let lineEndingCoordinate: number[] = [];
    const pageXOff = window.pageXOffset;
    const pageYOff = window.pageYOffset;
    if (polyline && polyline.length > 0) {
      const coordinates: any[] = polyline[0].getAttribute("points").split(" ");
      let coordinateStartingPoint: any[] = [];
      let coordinateEndingPoint: any[] = [];
      if (terminalClass === "lineStartTerminal") {
        coordinateStartingPoint = coordinates[terminalInitialCoordinateIndex - 1].split(",");
        lineStartingCoordinate = coordinateStartingPoint.map((point: string) => Number(point));
        lineStartingCoordinate = [lineStartingCoordinate[0] - scrollX - pageXOff, lineStartingCoordinate[1] - scrollY - pageYOff];

        coordinateEndingPoint = coordinates[terminalInitialCoordinateIndex].split(",");
        lineEndingCoordinate = coordinateEndingPoint.map((point: string) => Number(point));
        lineEndingCoordinate = [lineEndingCoordinate[0] - scrollX - pageXOff, lineEndingCoordinate[1] - scrollY - pageYOff];
      } else if (terminalClass === "lineEndTerminal") {
        coordinateStartingPoint = coordinates[coordinates.length - terminalInitialCoordinateIndex].split(",");
        lineStartingCoordinate = coordinateStartingPoint.map((point: string) => Number(point));
        lineStartingCoordinate = [lineStartingCoordinate[0] - scrollX - pageXOff, lineStartingCoordinate[1] - scrollY - pageYOff];

        coordinateEndingPoint = coordinates[coordinates.length - (terminalInitialCoordinateIndex + 1)].split(",");
        lineEndingCoordinate = coordinateEndingPoint.map((point: string) => Number(point));
        lineEndingCoordinate = [lineEndingCoordinate[0] - scrollX - pageXOff, lineEndingCoordinate[1] - scrollY - pageYOff];
      }
    }

    return { lineStartingCoordinate, lineEndingCoordinate };
  }

  // Calculate line coordinates by line type (straight line or polyline)
  private calculateLinePointsByLineType(terminal: HTMLElement, terminalInitialCoordinateIndex: number = 1) {
    let line: HTMLCollection = terminal.parentElement.getElementsByTagName("line");
    let lineStartingCoordinate: number[] = [];
    let lineEndingCoordinate: number[] = [];
    if (line && line.length > 0) {
      lineStartingCoordinate = [Number(line[0].getAttribute("x1")), Number(line[0].getAttribute("y1"))];
      lineEndingCoordinate = [Number(line[0].getAttribute("x2")), Number(line[0].getAttribute("y2"))];
    } else {
      const polylineCoordinate = this.calculatePolylineStartingAndEndingCoordinate(terminal, terminalInitialCoordinateIndex);
      lineStartingCoordinate = polylineCoordinate.lineStartingCoordinate;
      lineEndingCoordinate = polylineCoordinate.lineEndingCoordinate;
    }

    return {
      lineStartingCoordinate,
      lineEndingCoordinate
    }
  }

  // Root function to connect a terminal with overlapped module. Perform following actions -
  // * Collect line coordinates by line type (straight line or polyline).
  // * Find intersection point where line and module get together.
  // * Attach the terminal with overlapped module in SVG.
  // * Update newDesign Object from the visual position. 
  private connectTerminalIntersectionCoordinateWithModule(module: any, terminal: HTMLElement, terminalInitialCoordinateIndex: number = 1, intersectionFindingAttempts: number = 1) {
    let moduleUpperLeftCoordinate: number[] = module.position;
    if (moduleUpperLeftCoordinate && moduleUpperLeftCoordinate.length > 0) {
      let moduleUpperRightCoordinate: number[] = [moduleUpperLeftCoordinate[0] + 100, moduleUpperLeftCoordinate[1]];
      let moduleLowerLeftCoordinate: number[] = [moduleUpperLeftCoordinate[0], moduleUpperLeftCoordinate[1] + 100];
      let moduleLowerRightCoordinate: number[] = moduleUpperLeftCoordinate.map((value: number) => value + 100);
      let { lineStartingCoordinate, lineEndingCoordinate } = this.calculateLinePointsByLineType(terminal, terminalInitialCoordinateIndex);
      const intersectionCoordinate: any = this.getLinesIntersectionCoordinate(lineStartingCoordinate, lineEndingCoordinate, moduleUpperLeftCoordinate, moduleUpperRightCoordinate, moduleLowerLeftCoordinate, moduleLowerRightCoordinate);
      if (intersectionCoordinate) {
        this.attachOverlappedTerminalWithModuleVisually(terminal, module, intersectionCoordinate.direction, intersectionCoordinate.x, intersectionCoordinate.y, intersectionFindingAttempts);
        this.addMicroOrControlUnitWithOverlappedLineComponent(terminal, module.id);
        if (module.type == "micro") {
          this.updateMicroLineAfterDroppedLine(terminal, module.id);
        } else {
          this.updateControlUnitLineAfterDroppedLine(terminal, module.id);
        }
      } else {
        if (intersectionFindingAttempts <= MAX_INTERSECTION_FINDING_ATTEMPTS.COUNT) {
          this.connectTerminalIntersectionCoordinateWithModule(module, terminal, terminalInitialCoordinateIndex + 1, intersectionFindingAttempts + 1);
        }
      }
    }
  }

  // Update newDesign Object for controlUnit parameter.
  private updateControlUnitLineAfterDroppedLine(terminalElement: HTMLElement, moduleId: string) {
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(moduleId, "id", this.controlUnitList);
    let terminalDragParentId = terminalElement.parentElement.id;
    let lineIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.newDesign.controlUnit[componentIndex].lineId);
    if (lineIndex == undefined) { // add the line into newDesign if the terminal circle is filled and it's not recorded
      const terminalClassList = Array.prototype.slice.call(terminalElement.classList);
      if (terminalClassList.includes("boundaryStartTerminal") || terminalClassList.includes("boundaryEndTerminal")) return;
      this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalElement.id, terminalDragParentId);
      this.newDesign.controlUnit[componentIndex].lineTerminalId.push(terminalElement.id);
      this.newDesign.controlUnit[componentIndex].lineId.push(terminalDragParentId);
      console.log("Line " + terminalDragParentId + " has been added to controlUnit " + moduleId + " in newDesign.");
    }
  }

  // Update newDesign Object for Micro parameter
  private updateMicroLineAfterDroppedLine(terminalElement: HTMLElement, moduleId: string) {
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(moduleId, "id", this.microList);
    let terminalDragParentId = terminalElement.parentElement.id;
    let lineIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.newDesign.micro[componentIndex].lineId);
    if (lineIndex == undefined) { // add the line into newDesign if the terminal circle is filled and it's not recorded
      const terminalClassList = Array.prototype.slice.call(terminalElement.classList);
      if (terminalClassList.includes("boundaryStartTerminal") || terminalClassList.includes("boundaryEndTerminal")) return;
      this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalElement.id, terminalDragParentId);
      this.newDesign.micro[componentIndex].lineTerminalId.push(terminalElement.id);
      this.newDesign.micro[componentIndex].lineId.push(terminalDragParentId);
      console.log("Line " + terminalDragParentId + " has been added to micro " + moduleId + " in newDesign.");
    }
  }

  // Update newDesign Object for commLine parameter
  private addMicroOrControlUnitWithOverlappedLineComponent(terminalElement: HTMLElement, moduleId: string) {
    const terminalDragParent = terminalElement.parentElement;
    const lineDrag = terminalDragParent.querySelector(".commLine");
    const terminalDragParentId = terminalDragParent.id;
    const lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
    const terminalIndex = this.ArrOp.findStringIndexInArray(terminalElement.id, this.lineList[lineIdIndex].terminalId); // lineStartTerminal is 0, lineEndTerminal is 1
    const module: any = this.ArrOp.getComponentById(moduleId, [...this.newDesign.micro, ...this.newDesign.controlUnit]);
    // If a connected terminal reconnects within the same module, don't empty the feature and asset property from newDesign. But empty these properties when a terminal is not connected.
    if (module && !module.lineTerminalId.includes(terminalElement.id)) {
      this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] = module.id; // terminalIndex stays fixed. terminalComponentId and features match terminalIndex.
      this.newDesign.commLine[lineIdIndex].terminalComponentFeature[terminalIndex] = [];
      this.newDesign.commLine[lineIdIndex].terminalComponentFeatureIndex[terminalIndex] = [];
      this.newDesign.commLine[lineIdIndex].terminalComponentFeatureId[terminalIndex] = [];
      this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessBoolean[terminalIndex] = new Array(module.asset ? module.asset.length : 0).fill(false);
    }
    if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
      const coordinates = lineDrag.getAttribute('points');
      const updatedCoordinates: any[] = coordinates.split(" ").map((point: string) => point.split(","));
      const pointValues: number[] = [];
      updatedCoordinates.forEach((arr: string[]) => {
        pointValues.push(Number(arr[0]));
        pointValues.push(Number(arr[1]));
      });
      this.newDesign.commLine[lineIdIndex].position = pointValues;
    } else {
      this.newDesign.commLine[lineIdIndex].position = [Number(lineDrag.getAttribute("x1")), Number(lineDrag.getAttribute("y1")),
      Number(lineDrag.getAttribute("x2")), Number(lineDrag.getAttribute("y2"))];
    }
    this.editDesignShared.updateNewDesignComponents(this.newDesign);
    console.log("Component id " + moduleId + " has been added to lineList of newDesign.");
  };

  // Attach a commLine with a module when the commLine's starting or ending terminal overlapped it.
  private attachOverlappedTerminalWithModuleVisually(terminalElement: HTMLElement, module: any, direction: string, x: number, y: number, intersectionFindingAttempts: number) {
    const terminalDragParent = terminalElement.parentElement;
    if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
      let polylineDrag: any = terminalDragParent.querySelector(".commLine");
      let coordinates: any = polylineDrag.getAttribute("points");
      coordinates = coordinates.split(" ");
      if (intersectionFindingAttempts > 1) {
        this.repositionPolylineByExcludingHiddenArea(terminalElement, module.id, direction, x, y, intersectionFindingAttempts);
      } else {
        terminalElement.setAttribute("cx", x.toString());
        terminalElement.setAttribute("cy", y.toString());
        terminalElement.setAttribute("fill", "#3C98CF");
        if (terminalElement.getAttribute("class") == 'lineStartTerminal')
          coordinates[0] = `${x},${y}`;
        else
          coordinates[coordinates.length - 1] = `${x},${y}`;
        polylineDrag.setAttribute("points", coordinates.join(" "));
        this.calculateCommLineTerminals(terminalElement.id, module.id, [x, y]);
      }
    } else {
      let commLineDrag = terminalDragParent.querySelector(".commLine");
      if (terminalElement.getAttribute("class") == 'lineStartTerminal') {
        commLineDrag.setAttribute('x1', x.toString());
        commLineDrag.setAttribute('y1', y.toString());
      } else {
        commLineDrag.setAttribute('x2', x.toString());
        commLineDrag.setAttribute('y2', y.toString());
      }
      terminalElement.setAttribute("cx", x.toString());
      terminalElement.setAttribute("cy", y.toString());
      terminalElement.setAttribute("fill", "#3C98CF");
      this.calculateCommLineTerminals(terminalElement.id, module.id, [x, y]);
    }
    this.resetOverlappedModuleConnections(module.id);
  }

  // Exclude the overlapped area of the polyline to apply the polyline adjusting algorithm.
  private repositionPolylineByExcludingHiddenArea(terminalElement: HTMLElement, moduleId: string, direction: string, x: number, y: number, intersectionFindingAttempts: number) {
    const terminalDragParent = terminalElement.parentElement;
    let polylineDrag: any = terminalDragParent.querySelector(".commLine");
    if (terminalDragParent.getElementsByTagName('polyline').length > 0) {
      let coordinates = polylineDrag.getAttribute("points").split(" ");
      let imaginaryX: number = null;
      let imaginaryY: number = null;
      if (terminalElement.getAttribute("class") === "lineStartTerminal") {
        imaginaryX = coordinates[1].split(",")[0];
        imaginaryY = coordinates[1].split(",")[1];
        // Calculate an imaginary coordinate that can detect a location for placing a turning point to adjust the whole polyline.
        switch (direction) {
          case MODULE_EDGE_DIRECTION.RIGHT:
            var xAxisGap: number = x - Number(coordinates[0].split(",")[0]);
            var connectedTerminalPositionX: number = Number(coordinates[0].split(",")[0]) + xAxisGap;
            var connectedTerminalPositionY: number = Number(coordinates[0].split(",")[1]);
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[0] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = parseInt(coordinates[0].split(",")[0]) + defaultLength;
            imaginaryY = coordinates[0].split(",")[1];
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.LEFT:
            var xAxisGap: number = Number(coordinates[0].split(",")[0]) - x;
            var connectedTerminalPositionX: number = Number(coordinates[0].split(",")[0]) - xAxisGap;
            var connectedTerminalPositionY: number = Number(coordinates[0].split(",")[1]);
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[0] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = parseInt(coordinates[0].split(",")[0]) - defaultLength;
            imaginaryY = coordinates[0].split(",")[1];
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.TOP:
            var yAxisGap: number = Number(coordinates[0].split(",")[1]) - y;
            var connectedTerminalPositionX: number = Number(coordinates[0].split(",")[0]);
            var connectedTerminalPositionY: number = Number(coordinates[0].split(",")[1]) - yAxisGap;
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[0] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = coordinates[0].split(",")[0];
            imaginaryY = parseInt(coordinates[0].split(",")[1]) - defaultLength;
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.BOTTOM:
            var yAxisGap: number = y - Number(coordinates[0].split(",")[1]);
            var connectedTerminalPositionX: number = Number(coordinates[0].split(",")[0]);
            var connectedTerminalPositionY: number = Number(coordinates[0].split(",")[1]) + yAxisGap;
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[0] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = coordinates[0].split(",")[0];
            imaginaryY = parseInt(coordinates[0].split(",")[1]) + defaultLength;
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
        }
        // Place the imaginary coordinate to the polyline that can add "defaultLength - 25" for adding space.
        coordinates[1] = `${imaginaryX},${imaginaryY}`;
      } else {
        imaginaryX = coordinates[coordinates.length - 2].split(",")[0];
        imaginaryY = coordinates[coordinates.length - 2].split(",")[1];
        switch (direction) {
          case MODULE_EDGE_DIRECTION.RIGHT:
            var xAxisGap: number = x - Number(coordinates[coordinates.length - 1].split(",")[0]);
            var connectedTerminalPositionX: number = Number(coordinates[coordinates.length - 1].split(",")[0]) + xAxisGap;
            var connectedTerminalPositionY: number = Number(coordinates[coordinates.length - 1].split(",")[1]);
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[coordinates.length - 1] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = parseInt(coordinates[coordinates.length - 1].split(",")[0]) + defaultLength;
            imaginaryY = coordinates[coordinates.length - 1].split(",")[1];
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.LEFT:
            var xAxisGap: number = Number(coordinates[coordinates.length - 1].split(",")[0]) - x;
            var connectedTerminalPositionX: number = Number(coordinates[coordinates.length - 1].split(",")[0]) - xAxisGap;
            var connectedTerminalPositionY: number = Number(coordinates[coordinates.length - 1].split(",")[1]);
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[coordinates.length - 1] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = parseInt(coordinates[coordinates.length - 1].split(",")[0]) - defaultLength;
            imaginaryY = coordinates[coordinates.length - 1].split(",")[1];
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.TOP:
            var yAxisGap: number = Number(coordinates[coordinates.length - 1].split(",")[1]) - y;
            var connectedTerminalPositionX: number = Number(coordinates[coordinates.length - 1].split(",")[0]);
            var connectedTerminalPositionY: number = Number(coordinates[coordinates.length - 1].split(",")[1]) - yAxisGap;
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[coordinates.length - 1] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = coordinates[coordinates.length - 1].split(",")[0];
            imaginaryY = parseInt(coordinates[coordinates.length - 1].split(",")[1]) - defaultLength;
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
          case MODULE_EDGE_DIRECTION.BOTTOM:
            var yAxisGap: number = y - Number(coordinates[coordinates.length - 1].split(",")[1]);
            var connectedTerminalPositionX: number = Number(coordinates[coordinates.length - 1].split(",")[0]);
            var connectedTerminalPositionY: number = Number(coordinates[coordinates.length - 1].split(",")[1]) + yAxisGap;
            terminalElement.setAttribute("cx", connectedTerminalPositionX.toString());
            terminalElement.setAttribute("cy", connectedTerminalPositionY.toString());
            coordinates[coordinates.length - 1] = `${connectedTerminalPositionX},${connectedTerminalPositionY}`;
            imaginaryX = coordinates[coordinates.length - 1].split(",")[0];
            imaginaryY = parseInt(coordinates[coordinates.length - 1].split(",")[1]) + defaultLength;
            // Save the connected terminal location to a global variable
            this.calculateCommLineTerminals(terminalElement.id, moduleId, [connectedTerminalPositionX, connectedTerminalPositionY]);
            break;
        }
        // Place the imaginary coordinate to the polyline that can add "defaultLength - 25" for adding space.
        coordinates[coordinates.length - 2] = `${imaginaryX},${imaginaryY}`;
      }
      polylineDrag.setAttribute("points", coordinates.join(" "));

      // Reset the polyline coordinates with newly calculated values and adjust coordinates to 4 or 5.
      this.adjustOverlappedPolylineCoordinates(coordinates, terminalElement, polylineDrag);

      // Highlight the module and terminal UI after polyline position is changed
      const targetModule: HTMLElement = document.getElementById(moduleId);
      targetModule.style.border = "3.5px solid #3C98CF";
      if (targetModule.parentElement.parentElement.style.border) {
        targetModule.parentElement.parentElement.style.removeProperty("border");
      }
      targetModule.parentElement.parentElement.style.backgroundColor = "#85cef8";
      terminalElement.setAttribute("fill", "#3C98CF");
      terminalElement.setAttribute("stroke", "#3C98CF");
      terminalElement.setAttribute("stroke-width", "5");

      // Update inlineHandler's position
      this.updateInlineHandlerAfterPolylineGeometryChange(terminalElement);
    }
  }

  // Find out the starting and ending edges whether they are vertical or horizontal, then adjust the polyline by adding or updating coordinate.
  private adjustPolylineCoordinates(coordinates: any[], terminalElement: HTMLElement, polylineDrag: HTMLElement) {
    let first = coordinates[0].split(",");
    let last = coordinates[coordinates.length - 1].split(",");
    let second = coordinates[1].split(",");
    let second_last = coordinates[coordinates.length - 2].split(",");
    let firstPoints: string = null;
    let lastPoints: string = null;
    if (first[1] == second[1]) {
      //they are horizonal
      firstPoints = "HORIZONTAL"
    } else if (first[0] == second[0]) {
      //they are vertical
      firstPoints = "VERTICAL"
    }

    if (last[1] == second_last[1]) {
      //they are horizonal
      lastPoints = "HORIZONTAL"
    } else if (last[0] == second_last[0]) {
      //they are vertical
      lastPoints = "VERTICAL"
    }


    //need to calculate if polyline will be 4 point(both points needs to be parallel) or 5 point polyline
    if (firstPoints == lastPoints) {
      // they are parallel
      if (coordinates.length > 4) {
        coordinates.splice(2, 1);
        let second_updated;
        let third_updated;
        let updated_x2 = coordinates[1].split(",")[0];
        let updated_x3 = (firstPoints == "HORIZONTAL") ? updated_x2 : coordinates[coordinates.length - 1].split(",")[0];
        let updated_y2 = coordinates[1].split(",")[1];
        let updated_y3 = (firstPoints == "HORIZONTAL") ? coordinates[coordinates.length - 1].split(",")[1] : updated_y2;
        second_updated = `${updated_x2},${updated_y2}`;
        third_updated = `${updated_x3},${updated_y3}`;
        coordinates.splice(1, 1, second_updated);
        coordinates.splice(2, 1, third_updated);
        polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
        second = coordinates[1].split(",")
        second_last = coordinates[coordinates.length - 2].split(",")
      } else {
        let updatedx;
        let updatedy;
        if (terminalElement.getAttribute("class") === "lineStartTerminal") {
          if (lastPoints == "HORIZONTAL") {
            updatedy = coordinates[0].split(",")[1]
            updatedx = coordinates[coordinates.length - 2].split(",")[0]
          } else {
            updatedx = coordinates[0].split(",")[0]
            updatedy = coordinates[coordinates.length - 2].split(",")[1]
          }
          coordinates.splice(1, 1, `${updatedx},${updatedy}`);
        } else {
          if (firstPoints == "HORIZONTAL") {
            updatedy = coordinates[coordinates.length - 1].split(",")[1]
            updatedx = coordinates[1].split(",")[0]
          } else {
            updatedx = coordinates[coordinates.length - 1].split(",")[0]
            updatedy = coordinates[1].split(",")[1]
          }
          coordinates.splice(2, 1, `${updatedx},${updatedy}`);
        }

        polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
        second = coordinates[1].split(",")
        second_last = coordinates[coordinates.length - 2].split(",")
      }
    } else {
      //they are not parallel and polyline should be 5 lines
      let updatedx = (firstPoints == "HORIZONTAL") ? second[0] : second_last[0];
      let updatedy = (lastPoints == "HORIZONTAL") ? second[1] : second_last[1];

      coordinates.splice(2, 0, `${updatedx},${updatedy}`);
      polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[2]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
    }
  }

  // Find out the starting and ending edges whether they are vertical or horizontal, then adjust the polyline by adding or updating coordinates on overlapped module.
  private adjustOverlappedPolylineCoordinates(coordinates: any[], terminalElement: HTMLElement, polylineDrag: HTMLElement) {
    let first = coordinates[0].split(",");
    let last = coordinates[coordinates.length - 1].split(",");
    let second = coordinates[1].split(",");
    let second_last = coordinates[coordinates.length - 2].split(",");
    let firstPoints: string = null;
    let lastPoints: string = null;
    if (first[1] == second[1]) {
      //they are horizonal
      firstPoints = "HORIZONTAL"
    } else if (first[0] == second[0]) {
      //they are vertical
      firstPoints = "VERTICAL"
    }

    if (last[1] == second_last[1]) {
      //they are horizonal
      lastPoints = "HORIZONTAL"
    } else if (last[0] == second_last[0]) {
      //they are vertical
      lastPoints = "VERTICAL"
    }


    //need to calculate if polyline will be 4 point(both points needs to be parallel) or 5 point polyline
    if (firstPoints == lastPoints) {
      // they are parallel
      if (coordinates.length > 4) {
        coordinates.splice(2, 1);
        let second_updated;
        let third_updated;
        let updated_x2 = coordinates[1].split(",")[0];
        let updated_x3 = (firstPoints == "HORIZONTAL") ? updated_x2 : coordinates[coordinates.length - 1].split(",")[0];
        let updated_y2 = coordinates[1].split(",")[1];
        let updated_y3 = (firstPoints == "HORIZONTAL") ? coordinates[coordinates.length - 1].split(",")[1] : updated_y2;
        second_updated = `${updated_x2},${updated_y2}`;
        third_updated = `${updated_x3},${updated_y3}`;
        coordinates.splice(1, 1, second_updated);
        coordinates.splice(2, 1, third_updated);
        polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
        second = coordinates[1].split(",")
        second_last = coordinates[coordinates.length - 2].split(",")
      } else {
        let updatedx;
        let updatedy;
        if (terminalElement.getAttribute("class") === "lineStartTerminal") {
          if (lastPoints == "HORIZONTAL") {
            updatedy = coordinates[coordinates.length - 1].split(",")[1];
            updatedx = coordinates[1].split(",")[0];
          } else {
            updatedy = coordinates[coordinates.length - 2].split(",")[1];
            updatedx = coordinates[1].split(",")[0];
          }
          coordinates.splice(2, 1, `${updatedx},${updatedy}`);
        } else {
          if (firstPoints == "HORIZONTAL") {
            updatedy = coordinates[0].split(",")[1];
            updatedx = coordinates[coordinates.length - 2].split(",")[0];
          } else {
            updatedx = coordinates[coordinates.length - 2].split(",")[0];
            updatedy = coordinates[1].split(",")[1];
          }
          coordinates.splice(coordinates.length - 3, 1, `${updatedx},${updatedy}`);
        }

        polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
        second = coordinates[1].split(",");
        second_last = coordinates[coordinates.length - 2].split(",");
      }
    } else {
      //they are not parallel and polyline should be 5 lines
      let updatedx = (firstPoints == "HORIZONTAL") ? second[0] : second_last[0];
      let updatedy = (lastPoints == "HORIZONTAL") ? second[1] : second_last[1];

      coordinates.splice(2, 0, `${updatedx},${updatedy}`);
      polylineDrag.setAttribute("points", `${coordinates[0]} ${coordinates[1]} ${coordinates[2]} ${coordinates[coordinates.length - 2]} ${coordinates[coordinates.length - 1]}`);
    }
  }

  // Reset overlapped modules after terminal is connected
  private resetOverlappedModuleConnections(targetId: any): void {
    const targetMicro = document.getElementById(targetId);
    targetMicro.style.backgroundColor = "transparent";
    if (elementWithFocus) {
      const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
      const inlineHandlersData = terminalDragParent.querySelectorAll('.inlineHandler');
      inlineHandlersData.forEach((val: any) => val.style.display = 'none');
    }
    // Improve the algorithm to highligh/dehighlight a module.
    this.deHighlightOverlappedModules(this.highlightedModules);

    terminalSVGFilled = null;
    mouseDownFlag = false;
    targetTerminalSVG = null;
  }

  // Apply math to calculate intersection point of 2 lines. In our case, we calculate intersection coordinate of a module's edge and commLine.
  // Math we are applying: Ax + By + C = 0
  private getLinesIntersectionCoordinate(...args: any) {
    const lineStartingCoordinate: number[] = args[0],
      lineEndingCoordinate: number[] = args[1],
      moduleUpperLeftCoordinate: number[] = args[2],
      moduleUpperRightCoordinate: number[] = args[3],
      moduleLowerLeftCoordinate: number[] = args[4],
      moduleLowerRightCoordinate: number[] = args[5];

    const topEdge: any = this.getModuleEdgeIntersectionCoordinate(moduleUpperLeftCoordinate, moduleUpperRightCoordinate, lineStartingCoordinate, lineEndingCoordinate);
    if (topEdge) {
      const { x, y } = topEdge;
      const isCoordinateQualified: boolean = this.qualifyIntersectionCoordanite(x, y, moduleUpperLeftCoordinate[0], moduleUpperRightCoordinate[0], moduleUpperLeftCoordinate[1], moduleLowerRightCoordinate[1], lineStartingCoordinate, lineEndingCoordinate);
      if (isCoordinateQualified) {
        return { x, y, direction: MODULE_EDGE_DIRECTION.TOP };
      }
    }

    const rightEdge: any = this.getModuleEdgeIntersectionCoordinate(moduleUpperRightCoordinate, moduleLowerRightCoordinate, lineStartingCoordinate, lineEndingCoordinate);
    if (rightEdge) {
      const { x, y } = rightEdge;
      const isCoordinateQualified: boolean = this.qualifyIntersectionCoordanite(x, y, moduleUpperLeftCoordinate[0], moduleUpperRightCoordinate[0], moduleUpperLeftCoordinate[1], moduleLowerRightCoordinate[1], lineStartingCoordinate, lineEndingCoordinate);
      if (isCoordinateQualified) {
        return { x, y, direction: MODULE_EDGE_DIRECTION.RIGHT };
      }
    }

    const bottomEdge: any = this.getModuleEdgeIntersectionCoordinate(moduleLowerLeftCoordinate, moduleLowerRightCoordinate, lineStartingCoordinate, lineEndingCoordinate);
    if (bottomEdge) {
      const { x, y } = bottomEdge;
      const isCoordinateQualified: boolean = this.qualifyIntersectionCoordanite(x, y, moduleUpperLeftCoordinate[0], moduleUpperRightCoordinate[0], moduleUpperLeftCoordinate[1], moduleLowerRightCoordinate[1], lineStartingCoordinate, lineEndingCoordinate);
      if (isCoordinateQualified) {
        return { x, y, direction: MODULE_EDGE_DIRECTION.BOTTOM };
      }
    }

    const leftEdge: any = this.getModuleEdgeIntersectionCoordinate(moduleUpperLeftCoordinate, moduleLowerLeftCoordinate, lineStartingCoordinate, lineEndingCoordinate);
    if (leftEdge) {
      const { x, y } = leftEdge;
      const isCoordinateQualified: boolean = this.qualifyIntersectionCoordanite(x, y, moduleUpperLeftCoordinate[0], moduleUpperRightCoordinate[0], moduleUpperLeftCoordinate[1], moduleLowerRightCoordinate[1], lineStartingCoordinate, lineEndingCoordinate);
      if (isCoordinateQualified) {
        return { x, y, direction: MODULE_EDGE_DIRECTION.LEFT };
      }
    }

    return null;
  }

  // Check whether 2 lines are not parallel.
  private qualifyIntersectionCoordanite(x: number, y: number, x0: number, x1: number, y0: number, y2: number, lineStartingCoordinate: number[], lineEndingCoordinate: number[]) {
    return (x0 <= x && x <= x1) && (y0 <= y && y <= y2) &&
      (Math.min(lineStartingCoordinate[0], lineEndingCoordinate[0]) <= x && x <= Math.max(lineStartingCoordinate[0], lineEndingCoordinate[0])) &&
      (Math.min(lineStartingCoordinate[1], lineEndingCoordinate[1]) <= y && y <= Math.max(lineStartingCoordinate[1], lineEndingCoordinate[1]))
  }

  // Apply Math to get intersection coordinate.
  private getModuleEdgeIntersectionCoordinate(moduleEdgeStartingCoordinate: number[], moduleEdgeEndingCoordinate: number[], lineStartingCoordinate: number[], lineEndingCoordinate: number[]) {
    const moduleEdgeA = this.calculateCoordinateA(moduleEdgeStartingCoordinate[1], moduleEdgeEndingCoordinate[1]);
    const moduleEdgeB = this.calculateCoordinateB(moduleEdgeStartingCoordinate[0], moduleEdgeEndingCoordinate[0]);
    const moduleEdgeC = this.calculateCoordinateC(moduleEdgeStartingCoordinate[0], moduleEdgeStartingCoordinate[1], moduleEdgeEndingCoordinate[0], moduleEdgeEndingCoordinate[1]);

    const lineA = this.calculateCoordinateA(lineStartingCoordinate[1], lineEndingCoordinate[1]);
    const lineB = this.calculateCoordinateB(lineStartingCoordinate[0], lineEndingCoordinate[0]);
    const lineC = this.calculateCoordinateC(lineStartingCoordinate[0], lineStartingCoordinate[1], lineEndingCoordinate[0], lineEndingCoordinate[1]);

    const isParallelLines: boolean = this.checkTwoLinesInParallel(moduleEdgeA, lineA, moduleEdgeB, lineB);
    if (!isParallelLines) {
      let x: number = null;
      let y: number = null;
      x = ((moduleEdgeB * lineC) - (lineB * moduleEdgeC)) / ((moduleEdgeA * lineB) - (lineA * moduleEdgeB));
      y = ((moduleEdgeA * lineC) - (lineA * moduleEdgeC)) / ((lineA * moduleEdgeB) - (moduleEdgeA * lineB));

      return { x, y };
    }

    return null;
  }

  // Apply Math to check whether 2 lines are parallel or not. (A1B2 == A2B1) means they are parallel.
  private checkTwoLinesInParallel(moduleEdgeA: number, lineA: number, moduleEdgeB: number, lineB: number) {
    return (moduleEdgeA * lineB) == (lineA * moduleEdgeB);
  }

  // Apply Math: A = y2 - y1
  private calculateCoordinateA(y1: number, y2: number) {
    return y2 - y1;
  }

  // Apply Math: B = X1 - X2
  private calculateCoordinateB(x1: number, x2: number) {
    return x1 - x2;
  }

  // Apply Math: C = Y1(X2 - X1) - X1(Y2 - Y1)
  private calculateCoordinateC(x1: number, y1: number, x2: number, y2: number) {
    return (y1 * (x2 - x1)) - (x1 * (y2 - y1));
  }

  // Highlight modules visually if terminals overlapped modules
  private highlightOverlappedModules(modulesId: string[]) {
    if (modulesId.length > 0) {
      modulesId.forEach(moduleId => {
        const targetModule = document.getElementById(moduleId);
        targetModule.style.border = "3.5px solid #3C98CF";
        if (targetModule.parentElement.parentElement.style.border) {
          targetModule.parentElement.parentElement.style.removeProperty("border");
        }
        targetModule.parentElement.parentElement.style.backgroundColor = "#85cef8";
      });
      this.highlightedModules = modulesId;
    }
  }

  // Dehighlight modules visually if terminals move out of modules
  private deHighlightOverlappedModules(modulesId: string[]) {
    modulesId.forEach((moduleId: string) => {
      const targetModule = document.getElementById(moduleId);
      targetModule.style.backgroundColor = "transparent";
      targetModule.style.border = "3px solid #3C98CF";
      if (targetModule.parentElement.parentElement.style.border) {
        targetModule.parentElement.parentElement.style.removeProperty("border");
      }
      targetModule.parentElement.parentElement.style.backgroundColor = "transparent";
    });
    this.highlightedModules = [];
  }

  // Check whether a commLine is already connected with a module
  private checkCommLineConnectedWithModule(commLineId: string) {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
    let lineEmptyCheck = true; // start by assuming line is not connected to any component
    this.lineList[componentIndex]?.terminalComponentId.forEach((element, index, self) => {
      lineEmptyCheck = lineEmptyCheck && !element // every element has to be "", so that lineEmptyCheck can stay true
    });
    return lineEmptyCheck;
  }

  // The event listener is triggered when mouse is moved. `mouseDownFlag` is the identifier whether dragging an HTML element along with mouse. 
  mouseMoveSvg(event: any) {
    // console.log(document.getElementById("modelViewContent").scrollTop);
    // console.log(document.getElementById("drawingCanvas").scrollTop);
    // console.log(document.getElementById("svgViewBox").scrollTop);
    // console.log(window.scrollY);
    event.preventDefault();
    if (mouseDownFlag) { // only moves if mouse is down.
      let elementCheck = elementWithFocus.getAttribute("class");
      switch (elementCheck) {
        case "module-text":
          this.updateModuleTextPosition(event);
          break;
        case "commLine":
          let lineEmptyCheck: boolean = this.checkCommLineConnectedWithModule(elementWithFocus.id); // start by assuming line is not connected to any component
          if (lineEmptyCheck) { // line dragging only works when it is not connected to any other component
            // We need to improve the algorithm so that it can highlight module from a good number of modules when hovering over them.
            let detectedModulesAndTerminals: any[] = this.detectModulesToConnectWithCommLine(elementWithFocus.id);
            const newlyHighlightedModulesId: string[] = detectedModulesAndTerminals
              .filter((detectedModulesAndTerminal: any) => !this.highlightedModules.includes(detectedModulesAndTerminal.module.id))
              .map((highlightedModuleAndTerminal: any) => highlightedModuleAndTerminal.module.id);
            this.highlightOverlappedModules(newlyHighlightedModulesId);
            if (elementWithFocus.getAttribute("name") == polylineName) {
              this.updatePolylineVisualPos(event);
            } else
              this.updateLineVisualPos(event);
          } else {
            this._snackBar.open("Disconnect the line before moving.", "", {
              duration: 4000,
            });
          }
          break;
        case "commLineProtocolText":
          this.updateCommLineProtocolTextVisualPos(event);
          break;
        case "inlineHandler":
          this.updateInlineHandlerVisualPos(event);
          break;
        case "lineStartTerminal":
        case "lineEndTerminal":
          this.updateLineTerminalVisualPos(event);
          targetTerminalSVG = elementWithFocus.id;
          break;
        case "boundary":
          this.updateBoundaryVisualPos(event);
          break;
        case "boundaryStartTerminal":
        case "boundaryEndTerminal":
          this.updateBoundaryTerminalVisualPos(event);
          break;

        default:
          break;
      }
    }
  }

  // Add/Update module text to a position when the text is dragged & dropped with mouse
  private updateModuleTextPosition(event: any) {
    event.preventDefault();
    const textDragElement: HTMLElement = document.getElementById(elementWithFocus.id);
    const textDragParentElement: HTMLElement = textDragElement.parentElement;
    const x: number = event.x + document.getElementById("modelViewContent").scrollLeft + diffX;
    const y: number = event.y + document.getElementById("modelViewContent").scrollTop + diffY;

    if (textDragParentElement.id === "svgViewBox") {
      textDragElement.setAttribute("x", x.toString());
      textDragElement.setAttribute("y", y.toString());
    } else {
      if (textDragElement) {
        textDragElement.remove();
      }
      this.showModuleText(elementWithFocus.id, elementWithFocus.innerHTML, x, y);
    }
  }

  // Get commLine terminal ID from the given opposite terminal ID.
  private getOppositeCommLineTerminal(currentTerminalId: string) {
    if (currentTerminalId) {
      const currentTerminal: HTMLElement = document.getElementById(currentTerminalId);
      if (currentTerminal) {
        let oppositeTerminal: any = null;
        if (currentTerminal.classList.contains("lineStartTerminal")) {
          oppositeTerminal = currentTerminal.parentElement.getElementsByClassName("lineEndTerminal")[0];
        } else {
          oppositeTerminal = currentTerminal.parentElement.getElementsByClassName("lineStartTerminal")[0];
        }
        return oppositeTerminal.id;
      }
    }

    return null;
  }

  // Check whether both terminals of a commLine are attached with the same module.
  private checkBothTerminalsConnentedWithSameModule(detectedModuleAndTerminal: any) {
    const oppositeTerminalId: string = this.getOppositeCommLineTerminal(detectedModuleAndTerminal.terminal.id);
    if (oppositeTerminalId) {
      return this.commLinesTerminals.find((commLine: any, index: number, self: any) => {
        if (commLine.id === oppositeTerminalId) {
          const oppositeTerminalAndModule: any = self.find((commLineTerminalAndModule: any) => commLineTerminalAndModule.id === oppositeTerminalId && commLineTerminalAndModule.componentId === detectedModuleAndTerminal.module.id);
          return oppositeTerminalAndModule;
        }
        return false;
      });
    }
  }

  endSvgMove(event: any) {
    if (event.type == "mouseout" && mouseDownFlag) {
      return;
    }
    mouseDownFlag = false;
    if (elementWithFocus != null) {
      let elementCheck = elementWithFocus.getAttribute("class");
      switch (elementCheck) {
        case "module-text":
          this.updateModuleTextPosition(event);
          break;
        case "commLine":
          let detectedModulesAndTerminals: any[] = this.detectModulesToConnectWithCommLine(event.target.id);
          if (detectedModulesAndTerminals.length > 0) {
            detectedModulesAndTerminals.forEach(detectedModuleAndTerminal => {
              const oppositeTerminalAlreadyConnected: any = this.checkBothTerminalsConnentedWithSameModule(detectedModuleAndTerminal);
              if (!oppositeTerminalAlreadyConnected) { // Don't allow user to connect the both starting and ending terminals with same module.
                this.connectTerminalIntersectionCoordinateWithModule(detectedModuleAndTerminal.module, detectedModuleAndTerminal.terminal);
                this.deHighlightOverlappedModules([detectedModuleAndTerminal.module.id]);
              } else {
                this._snackBar.open("Connecting a component to itself is not allowed.", "Warning", {
                  duration: 10000,
                });
              }
            });
          }
          const lineType: string = elementWithFocus.getAttribute("name");
          if (lineType === polylineName) {
            this.updatePolyLinePosition(event);
          } else
            this.updateCommLinePosition(event);
          break;
        case "commLineProtocolText":
          /// update protocol text
          this.updateCommLineProtocolTextPosition(event);
          break;
        case "lineStartTerminal":
        case "lineEndTerminal":
          this.updateCommLinePosition(event);
          let moduleType: string = "";
          if (targetTerminalSVG && event.target.id != targetTerminalSVG) {
            moduleType = this.getModuleTypeFromMovingTerminalId(targetTerminalSVG);
          } else {
            moduleType = this.getModuleTypeFromMovingTerminalId(event.target.id);
          }
          if (moduleType == "micro") {
            if (targetTerminalSVG && event.target.id != targetTerminalSVG) {
              this.disconnectTerminalAndMicro(targetTerminalSVG);
            } else {
              this.disconnectTerminalAndMicro(event.target.id);
            }
          } else if (moduleType == "controlUnit") {
            if (targetTerminalSVG && event.target.id != targetTerminalSVG) {
              this.disconnectTerminalAndControlUnit(targetTerminalSVG);
            } else {
              this.disconnectTerminalAndControlUnit(event.target.id);
            }
          }
          this.dropSvgTerminal(event);
          // this.updateTextProtocolsDisplay(this.newDesign, { show: true, commLineId: elementWithFocus?.parentElement?.id });
          break;
        case "boundary":
          this.updateBoundaryPosition(event);
          break;
        case "boundaryStartTerminal":
        case "boundaryEndTerminal":
          this.updateBoundaryPosition(event);
          this.dropSvgTerminal(event);
          break;
      }
    }
    elementWithFocus = null;
  }
  // function to update line and line terminals position in newDesign
  updateCommLineProtocolTextPosition(myEvent: any): void {
    let x = myEvent.x + diffX;
    let y = myEvent.y + diffY;
    document.getElementById(elementWithFocus.id).setAttribute("x", x);
    document.getElementById(elementWithFocus.id).setAttribute("y", y);
  }

  // functions to move <img> components
  moveStart(event: any) {
    dragFlag = 0;
    if ((this.editDesignShared.projectStatus?.milestoneView)) {
      return;
    }
    let element = document.getElementById(event.target.id);
    const movedComponentParent = element.parentElement;
    if (movedComponentParent.id !== "drawingCanvas") {
      element = document.getElementById(event.target.id).parentElement.parentElement;
    }

    this.globalScrollX = document.getElementById("modelViewContent").scrollLeft;
    this.globalScrollY = document.getElementById("modelViewContent").scrollTop;

    const positionLeft = parseInt(element.style.left, 10);
    const positionTop = parseInt(element.style.top, 10);

    shiftX = (event.clientX + this.globalScrollX) - positionLeft - sidebarWidth;
    shiftY = (event.clientY + this.globalScrollY) - positionTop - navBarHeight;

    event.dataTransfer.setData("text/plain", event.target.id);  // let drop handler know the component being dragged
  }

  private resetTerminalConnections(targetId: any): void {
    const targetMicro = document.getElementById(targetId);
    targetMicro.style.backgroundColor = "transparent";
    if (elementWithFocus) {
      const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
      const inlineHandlersData = terminalDragParent.querySelectorAll('.inlineHandler');
      inlineHandlersData.forEach((val: any) => val.style.display = 'none');
    }
    terminalSVGFilled = null;
    mouseDownFlag = false;
    elementWithFocus = null;
    targetTerminalSVG = null;
  }

  // connect line components with other components
  dropSvgTerminalAtImg(event: any) {
    if (terminalSVGFilled) {
      let terminal = document.getElementById(terminalSVGFilled);

      if (terminal.getAttribute('line-name') == 'sensorInput') {
        let x = Number(terminal.getAttribute("x"));
        let y = Number(terminal.getAttribute("y"));
        //get macro coordinates
        let module = event.target;
        let width = module.width;
        let height = module.height;
        //logic to identify the direction from which the terminal is being dropped
        const direction = this.getConnectedEdgeDirection(module, document.getElementById(terminalSVGFilled));
        const terminalPosition = document.getElementById(terminalSVGFilled).getBoundingClientRect();
        const modulePosition = module.getBoundingClientRect();
        switch (direction) {
          case MODULE_EDGE_DIRECTION.TOP: {
            const diff = modulePosition.y - terminalPosition.y;
            y = y + diff - this.terminalReduceTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.BOTTOM: {
            const diff = modulePosition.y - terminalPosition.y;
            y = y + height + diff + this.terminalExtendTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.LEFT: {
            const diff = modulePosition.x - terminalPosition.x;
            x = x + diff - this.terminalReduceTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.RIGHT: {
            const diff = modulePosition.x - terminalPosition.x;
            x = x + width + diff + this.terminalExtendTerminalSpace;
            break;
          }
        }
        this.calculateCommLineTerminals(terminalSVGFilled, event.target.id, [x, y]);

        terminal.setAttribute("cx", x.toString());
        terminal.setAttribute("cy", y.toString());
        //need to update the position of polyline after
        const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
        let terminalDrag = document.getElementById(elementWithFocus.id);
        if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
          let polylineDrag: any = terminalDragParent.querySelector(".commLine");
          //updating polyline
          let coordinates: any = polylineDrag.getAttribute("points");
          coordinates = coordinates.split(" ");
          if (terminalDrag.getAttribute("class") == 'lineStartTerminal')
            coordinates[0] = `${x},${y}`;
          else
            coordinates[coordinates.length - 1] = `${x},${y}`;
          polylineDrag.setAttribute("points", coordinates.join(" "));
        } else {
          let commLineDrag = terminalDragParent.querySelector(".commLine");
          commLineDrag.setAttribute('x1', terminalDragParent.querySelector(".lineStartTerminal").getAttribute("x"))
          commLineDrag.setAttribute('y1', terminalDragParent.querySelector(".lineStartTerminal").getAttribute("y"))
          commLineDrag.setAttribute('x2', terminalDragParent.querySelector(".lineEndTerminal").getAttribute("x"))
          commLineDrag.setAttribute('y2', terminalDragParent.querySelector(".lineEndTerminal").getAttribute("y"))
        }
      } else {
        let x = Number(terminal.getAttribute("cx"));
        let y = Number(terminal.getAttribute("cy"));
        //get macro coordinates
        let module = event.target;
        let width = module.width;
        let height = module.height;
        //logic to identify the direction from which the terminal is being dropped
        const direction = this.getConnectedEdgeDirection(module, document.getElementById(terminalSVGFilled));
        const terminalPosition = document.getElementById(terminalSVGFilled).getBoundingClientRect();
        const modulePosition = module.getBoundingClientRect();
        switch (direction) {
          case MODULE_EDGE_DIRECTION.TOP: {
            const diff = modulePosition.y - terminalPosition.y;
            y = y + diff - this.terminalReduceTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.BOTTOM: {
            const diff = modulePosition.y - terminalPosition.y;
            y = y + height + diff + this.terminalExtendTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.LEFT: {
            const diff = modulePosition.x - terminalPosition.x;
            x = x + diff - this.terminalReduceTerminalSpace;
            break;
          }
          case MODULE_EDGE_DIRECTION.RIGHT: {
            const diff = modulePosition.x - terminalPosition.x;
            x = x + width + diff + this.terminalExtendTerminalSpace;
            break;
          }
        }
        this.calculateCommLineTerminals(terminalSVGFilled, event.target.id, [x, y]);

        terminal.setAttribute("cx", x.toString());
        terminal.setAttribute("cy", y.toString());
        //need to update the position of polyline after
        const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
        let terminalDrag = document.getElementById(elementWithFocus.id);
        if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
          let polylineDrag: any = terminalDragParent.querySelector(".commLine");
          //updating polyline
          let coordinates: any = polylineDrag.getAttribute("points");
          coordinates = coordinates.split(" ");
          if (terminalDrag.getAttribute("class") == 'lineStartTerminal')
            coordinates[0] = `${x},${y}`;
          else
            coordinates[coordinates.length - 1] = `${x},${y}`;
          polylineDrag.setAttribute("points", coordinates.join(" "));
        } else {
          let commLineDrag = terminalDragParent.querySelector(".commLine");
          commLineDrag.setAttribute('x1', terminalDragParent.querySelector(".lineStartTerminal").getAttribute("cx"))
          commLineDrag.setAttribute('y1', terminalDragParent.querySelector(".lineStartTerminal").getAttribute("cy"))
          commLineDrag.setAttribute('x2', terminalDragParent.querySelector(".lineEndTerminal").getAttribute("cx"))
          commLineDrag.setAttribute('y2', terminalDragParent.querySelector(".lineEndTerminal").getAttribute("cy"))
        }
      }

    }

    this.resetTerminalConnections(event.target.id);
  };

  // Calculate component terminal relative position before dragging a component
  private calculateCommLineTerminals(terminalId: string, componentId: any, terminalPosition: any[]) {
    const compPositionX = parseInt(document.getElementById(componentId).parentElement.parentElement.style.left, 10);
    const compPositionY = parseInt(document.getElementById(componentId).parentElement.parentElement.style.top, 10);
    const position = [terminalPosition[0] - compPositionX,
    terminalPosition[1] - compPositionY];
    const terminalObj: any = {
      id: terminalId,
      componentId: componentId,
      position: position
    };

    // if ((position[0] === -7 || position[0] === 107) || (position[1] === -7 || position[1] === 107)) { } else {
    // console.log({ position });
    // console.log({terminalPosition});
    // document.getElementById(componentId).style.backgroundColor = "yellow";
    //   // console.log({ componentX: document.getElementById(componentId).parentElement.parentElement.style.left, componentY: document.getElementById(componentId).parentElement.parentElement.style.top, terminalPosition });
    //   // console.log({ terminalObj });
    // }
    const index: number = this.commLinesTerminals.findIndex(terminal => terminal.id === terminalId && terminal.componentId === componentId);
    if (index > -1) {
      this.commLinesTerminals[index] = terminalObj;
    } else {
      this.commLinesTerminals.push(terminalObj);
    }
  }

  // detect edge direction between two elements connection
  getConnectedEdgeDirection(...args: any[]) {
    const module = args[0];
    const terminal = args[1];
    const terminalPosition = terminal.getBoundingClientRect();
    const modulePosition = module.getBoundingClientRect();
    const width = module.width * window.devicePixelRatio;
    const height = module.height * window.devicePixelRatio;
    const x1 = module.x;
    const y1 = module.y;
    const x2 = x1 + width;
    const y2 = y1;
    const x3 = x1;
    const y3 = y1 + height;
    // detect left edge
    const isLeftEdge: any = this.detectLeftEdge(x1, y1, x3, y3, terminalPosition, modulePosition, width);
    if (isLeftEdge) {
      return MODULE_EDGE_DIRECTION.LEFT;
    }
    // detect right edge
    const isRightEdge: any = this.detectRightEdge(x1, y1, x3, y3, terminalPosition, modulePosition, width);
    if (isRightEdge) {
      return MODULE_EDGE_DIRECTION.RIGHT;
    }
    // detect top edge
    const isTopEdge: any = this.detectTopEdge(x1, y1, x2, y2, terminalPosition, modulePosition, width, height);
    if (isTopEdge) {
      return MODULE_EDGE_DIRECTION.TOP;
    }
    // detect bottom edge
    const isBottomEdge: any = this.detectBottomEdge(x1, y1, x2, y2, terminalPosition, modulePosition, width, height);
    if (isBottomEdge) {
      return MODULE_EDGE_DIRECTION.BOTTOM;
    }
  }

  // logic to detect left edge
  private detectBottomEdge(...args: any[]) {
    const height: number = args[7];
    const x1: number = args[0] - sidebarWidth;
    const y1: number = args[1] - navBarHeight;
    const x2: number = args[2] - sidebarWidth;
    const x3: number = x1;
    const y3: number = y1 + height;
    const x4: number = x2;
    const terminalPosition: any = args[4];
    const terminalPositionX = (terminalPosition.x * window.devicePixelRatio) - sidebarWidth;
    const terminalPositionY = (terminalPosition.y * window.devicePixelRatio) - navBarHeight;
    const reduceTop: number = y3 - this.extendToDeep - 2; // Added -2 additional value because we are checking bottom edge at last
    const extendBottom: number = y3 + terminalPositionY;
    const terminal = document.getElementById(terminalSVGFilled);
    if ((terminalPositionX >= x3 && terminalPositionX <= x4) && (terminalPositionY >= reduceTop && terminalPositionY <= extendBottom)) {
      const coordinatePoint = this.getTerminalLineCoordinate(terminal);
      const isWithinBottomPolyline: boolean = (coordinatePoint[1] >= reduceTop && coordinatePoint[1] <= extendBottom) && (coordinatePoint[0] >= x3 && coordinatePoint[0] <= x4);
      if (isWithinBottomPolyline) {
        return true;
      }
    }
    return false;
  }

  // logic to detect top edge
  private detectTopEdge(...args: any[]) {
    const height: number = args[7];
    const x1: number = args[0] - sidebarWidth;
    const y1: number = args[1] - navBarHeight;
    const x2: number = args[2] - sidebarWidth;
    const y3: number = y1;
    const terminalPosition: any = args[4];
    const terminalPositionX = (terminalPosition.x * window.devicePixelRatio) - sidebarWidth;
    const terminalPositionY = (terminalPosition.y * window.devicePixelRatio) - navBarHeight;
    const reduceTop: number = y1 - terminalPositionY;
    const extendBottom: number = y1 + this.extendToDeep;
    const terminal = document.getElementById(terminalSVGFilled);
    if ((terminalPositionX >= x1 && terminalPositionX <= x2) && (terminalPositionY >= reduceTop && terminalPositionY <= extendBottom)) {
      const coordinatePoint = this.getTerminalLineCoordinate(terminal);
      const isWithinTopPolyline: boolean = (coordinatePoint[1] >= reduceTop && coordinatePoint[1] <= extendBottom) && (coordinatePoint[0] >= x1 && coordinatePoint[0] <= x2);
      if (isWithinTopPolyline) {
        return true;
      }
    }
    return false;
  }

  // logic to detect right edge
  private detectRightEdge(...args: any[]) {
    const width: number = args[6];
    const x1: number = args[0] - sidebarWidth;
    const y1: number = args[1] - navBarHeight;
    const x2: number = x1 + width;
    const y2: number = y1;
    const y3: number = args[3] - navBarHeight;
    const y4: number = y3;
    const terminalPosition: any = args[4];
    const terminalPositionX = (terminalPosition.x * window.devicePixelRatio) - sidebarWidth;
    const terminalPositionY = (terminalPosition.y * window.devicePixelRatio) - navBarHeight;
    const terminal = document.getElementById(terminalSVGFilled);
    const reduceLeft = x2 - (width / 2);
    const extendRight = x2 + terminalPositionX;
    if ((terminalPositionY >= y2 && terminalPositionY <= y4) && (terminalPositionX >= reduceLeft && terminalPositionX <= extendRight)) {
      const coordinatePoint = this.getTerminalLineCoordinate(terminal);
      const reduceX2: number = x2 - this.extendToDeep;
      const extendX2: number = x2 + terminalPositionX;
      const isWithinRightPolyline: boolean = (coordinatePoint[0] >= reduceX2 && coordinatePoint[0] < extendX2) && (coordinatePoint[1] >= y2 && coordinatePoint[1] <= y4);
      if (isWithinRightPolyline) {
        return true;
      }
    }
    return false;
  }

  // logic to detect left edge
  private detectLeftEdge(...args: any[]) {
    const width: number = args[6];
    const x1: number = args[0] - sidebarWidth;
    const y1: number = args[1] - navBarHeight;
    const x2: number = x1 + width;
    const y3: number = args[3] - navBarHeight;
    const terminalPosition: any = args[4];
    const terminalPositionX = (terminalPosition.x * window.devicePixelRatio) - sidebarWidth;
    const terminalPositionY = (terminalPosition.y * window.devicePixelRatio) - navBarHeight;
    const terminal = document.getElementById(terminalSVGFilled);
    const reduceLeft = x1 - terminalPositionX;
    const extendRight = x2 + (width / 2);
    if ((terminalPositionY >= y1 && terminalPositionY <= y3) && (terminalPositionX >= reduceLeft && terminalPositionX <= extendRight)) {
      const coordinatePoint = this.getTerminalLineCoordinate(terminal);
      const reduceX1: number = x1 - terminalPositionX;
      const extendX1: number = x1 + (width / 2);
      const isWithinLeftPolyline: boolean = (coordinatePoint[0] >= reduceX1 && coordinatePoint[0] < extendX1) && (coordinatePoint[1] >= y1 && coordinatePoint[1] <= y3);
      if (isWithinLeftPolyline) {
        return true;
      }
    }
    return false;
  }

  // retrieve line/polyline coordinate to calculate connected terminal position
  private getTerminalLineCoordinate(terminal: any) {
    const svgGroup: Element = terminal.parentElement;
    const terminalClass: string = terminal.getAttribute("class");
    const lineDrag: Element = svgGroup.querySelector("line");
    const polylineDrag: Element = svgGroup.querySelector("polyline");
    const scrollX: number = document.getElementById("modelViewContent").scrollLeft;
    const scrollY: number = document.getElementById("modelViewContent").scrollTop;
    const pageXOff = window.pageXOffset;
    const pageYOff = window.pageYOffset;
    let coordinatePoint: any[] = [];
    if (lineDrag === null) {
      const coordinates: any[] = polylineDrag.getAttribute("points").split(" ");
      if (terminalClass === "lineStartTerminal") {
        coordinatePoint = coordinates[0].split(",");
      } else if (terminalClass === "lineEndTerminal") {
        coordinatePoint = coordinates[coordinates.length - 1].split(",");
      }
      coordinatePoint = coordinatePoint.map((point: string) => Number(point));
      coordinatePoint = [coordinatePoint[0] - scrollX - pageXOff, coordinatePoint[1] - scrollY - pageYOff];
    } else {
      if (terminalClass === "lineStartTerminal") {
        const axisX1: number = Number(lineDrag.getAttribute("x1"));
        const axisY1: number = Number(lineDrag.getAttribute("y1"));
        coordinatePoint = [axisX1 - scrollX - pageXOffset, axisY1 - scrollY - pageYOff];
      } else if (terminalClass === "lineEndTerminal") {
        const axisX2: number = Number(lineDrag.getAttribute("x2"));
        const axisY2: number = Number(lineDrag.getAttribute("y2"));
        coordinatePoint = [axisX2 - scrollX - pageXOffset, axisY2 - scrollY - pageYOff];
      }
    }
    coordinatePoint = coordinatePoint.map((point: number) => point * window.devicePixelRatio);
    return coordinatePoint;
  }

  // Detect the user mouse cursor entered on a module
  public moveSvgTerminalIntoImg(event: any) {
    const module = event.target;
    this.highlightSVGImg(module);
  }

  // Highlight a module when a terminal is connecting with it. 
  public highlightSVGImg(module: HTMLElement) {
    terminalSVGFilled = targetTerminalSVG;
    let targetMicro = document.getElementById(module.id);
    if (terminalSVGFilled != null) {
      //getting details if the mobing terminal and the polyline
      if (!elementWithFocus || !document.getElementById(elementWithFocus.id)) {
        return
      }
      let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
      let terminalDrag = document.getElementById(elementWithFocus.id);
      let lineDrag = terminalDragParent.querySelector(".commLine");
      if (terminalDragParent.getElementsByTagName('polyline').length > 0) {
        //logic to identify the direction from which the terminal is being dropped
        const direction = this.getConnectedEdgeDirection(module, document.getElementById(terminalSVGFilled));
        //direction logic ends here
        let coordinates = lineDrag.getAttribute("points").split(" ");
        //calculating the imaginary x and y for the moving terminal
        let imgx;
        let imgy;
        if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
          imgx = coordinates[1].split(",")[0]
          imgy = coordinates[1].split(",")[1]
          switch (direction) {
            case MODULE_EDGE_DIRECTION.RIGHT:
              if (coordinates[1].split(",")[0] > coordinates[0].split(",")[0] && coordinates[1].split(",")[1] == coordinates[0].split(",")[1]) {
                // console.log("Currently in right direction")
              } else {
                // console.log("Currently in not inright direction", coordinates[1])
                imgx = parseInt(coordinates[0].split(",")[0]) + defaultLength
                imgy = coordinates[0].split(",")[1]
              }
              break;
            case MODULE_EDGE_DIRECTION.LEFT:
              if (coordinates[1].split(",")[0] < coordinates[0].split(",")[0] && coordinates[1].split(",")[1] == coordinates[0].split(",")[1]) {
                // console.log("Currently in right direction")
              } else {
                // console.log("Currently in not inright direction",coordinates[1] )
                imgx = parseInt(coordinates[0].split(",")[0]) - defaultLength
                imgy = coordinates[0].split(",")[1]
              }
              break;
            case MODULE_EDGE_DIRECTION.TOP:
              if (coordinates[1].split(",")[1] < coordinates[0].split(",")[1] && coordinates[1].split(",")[0] == coordinates[0].split(",")[0]) {
                // console.log("Currently in right direction")
              } else {
                // console.log("Currently in not inright direction",coordinates[1] )
                imgx = coordinates[0].split(",")[0]
                imgy = parseInt(coordinates[0].split(",")[1]) - defaultLength
              }
              break;
            case MODULE_EDGE_DIRECTION.BOTTOM:
              if (coordinates[1].split(",")[1] > coordinates[0].split(",")[1] && coordinates[1].split(",")[0] == coordinates[0].split(",")[0]) {
                // console.log("Currently in right direction")
              } else {
                // console.log("Currently in not inright direction",coordinates[1] )
                imgx = coordinates[0].split(",")[0]
                imgy = parseInt(coordinates[0].split(",")[1]) + defaultLength
              }
              break;
          }
          coordinates[1] = `${imgx},${imgy}`
        } else {
          imgx = coordinates[coordinates.length - 2].split(",")[0]
          imgy = coordinates[coordinates.length - 2].split(",")[1]
          switch (direction) {
            case MODULE_EDGE_DIRECTION.RIGHT:
              if (coordinates[coordinates.length - 2].split(",")[0] > coordinates[coordinates.length - 1].split(",")[0] && coordinates[coordinates.length - 2].split(",")[1] == coordinates[coordinates.length - 1].split(",")[1]) {
                // console.log("Currently in right direction, no need to add default value")
              } else {
                imgx = parseInt(coordinates[coordinates.length - 1].split(",")[0]) + defaultLength
                imgy = coordinates[coordinates.length - 1].split(",")[1]
              }
              break;
            case MODULE_EDGE_DIRECTION.LEFT:
              if (coordinates[coordinates.length - 2].split(",")[0] < coordinates[coordinates.length - 1].split(",")[0] && coordinates[coordinates.length - 2].split(",")[1] == coordinates[coordinates.length - 1].split(",")[1]) {
                // console.log("Currently in right direction, no need to add default value")
              } else {
                imgx = parseInt(coordinates[coordinates.length - 1].split(",")[0]) - defaultLength
                imgy = coordinates[coordinates.length - 1].split(",")[1]
              }
              break;
            case MODULE_EDGE_DIRECTION.TOP:
              if (coordinates[coordinates.length - 2].split(",")[1] < coordinates[coordinates.length - 1].split(",")[1] && coordinates[coordinates.length - 2].split(",")[0] == coordinates[coordinates.length - 1].split(",")[0]) {
                // console.log("Currently in right direction, no need to add default value")
              } else {
                imgx = coordinates[coordinates.length - 1].split(",")[0]
                imgy = parseInt(coordinates[coordinates.length - 1].split(",")[1]) - defaultLength
              }
              break;
            case MODULE_EDGE_DIRECTION.BOTTOM:
              if (coordinates[coordinates.length - 2].split(",")[1] > coordinates[coordinates.length - 1].split(",")[1] && coordinates[coordinates.length - 2].split(",")[0] == coordinates[coordinates.length - 1].split(",")[0]) {
                // console.log("Currently in right direction, no need to add default value")
              } else {
                imgx = coordinates[coordinates.length - 1].split(",")[0]
                imgy = parseInt(coordinates[coordinates.length - 1].split(",")[1]) + defaultLength
              }
              break;
          }
          coordinates[coordinates.length - 2] = `${imgx},${imgy}`
        }

        //calculating the imaginary x and y for the moving terminal
        lineDrag.setAttribute("points", coordinates.join(" "));
        this.adjustPolylineCoordinates(coordinates, terminalDrag, (lineDrag as HTMLElement));
      }
      targetMicro.style.border = "3.5px solid #3C98CF";
      if (targetMicro.parentElement.parentElement.style.border) {
        targetMicro.parentElement.parentElement.style.removeProperty("border");
      }
      targetMicro.parentElement.parentElement.style.backgroundColor = "#85cef8";
      elementWithFocus.setAttribute("fill", "#3C98CF");
      elementWithFocus.setAttribute("stroke", "#3C98CF");
      elementWithFocus.setAttribute("stroke-width", "5");
      this.updateInlineHandlerAfterPolylineGeometryChange();
    } else {
      let detectedModulesAndTerminals: any[] = elementWithFocus ? this.detectModulesToConnectWithCommLine(elementWithFocus.id) : null;
      if (mouseDownFlag && elementWithFocus && elementWithFocus.classList.contains("commLine") && detectedModulesAndTerminals && detectedModulesAndTerminals.length > 0) {
        targetMicro.parentElement.parentElement.style.backgroundColor = "#85cef8";
      } else {
        targetMicro.parentElement.parentElement.style.backgroundColor = "#8c8e8f3f";
      }
      targetMicro.style.border = "3.5px solid #3C98CF";
      if (targetMicro.parentElement.parentElement.style.border) {
        targetMicro.parentElement.parentElement.style.removeProperty("border");
      }
    }
  }
  public moveSvgTerminalOutOfImg(event: any) {
    this.dehighlightSVGImg(event.target.id);
    // let targetMicro = document.getElementById(event.target.id);
    // targetMicro.style.backgroundColor = "transparent";
    // targetMicro.style.border = "none";
    // if (terminalSVGFilled != null) {
    //   let terminalHandle = document.getElementById(terminalSVGFilled);
    //   terminalHandle.setAttribute("fill", "white");
    //   terminalHandle.setAttribute("stroke-width", "1");
    //   terminalSVGFilled = null;
    // } else { }
  }
  private dehighlightSVGImg(imgId: string) {
    let targetMicro = document.getElementById(imgId);
    targetMicro.style.backgroundColor = "transparent";
    targetMicro.style.border = "3px solid #3C98CF";
    if (targetMicro.parentElement.parentElement.style.border) {
      targetMicro.parentElement.parentElement.style.removeProperty("border");
    }
    targetMicro.parentElement.parentElement.style.backgroundColor = "transparent";
    if (terminalSVGFilled != null) {
      let terminalHandle = document.getElementById(terminalSVGFilled);
      terminalHandle.setAttribute("fill", "#fff");
      terminalHandle.setAttribute("stroke-width", "5");
      terminalSVGFilled = null;
    } else { }
  }
  // random ID generator for newly created components
  genRandomId(): string {
    let charPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfId = 10;
    let text = "";
    for (let i = 0; i < lengthOfId; i++) {
      text += charPool.charAt(Math.floor(Math.random() * charPool.length));
    };
    return text;
  };

  // functions to manipulate SVG terminal moves
  enterSvgTerminal(event: any) {
    let terminalDrag = document.getElementById(event.target.id);
    terminalDrag.setAttribute("stroke", "#3C98CF");
    terminalDrag.setAttribute("stroke-width", "2");
    if (terminalDrag.getAttribute('line-name') == 'sensorInput') {
      terminalDrag.setAttribute("width", "12");
      terminalDrag.setAttribute("height", "12");
    } else {
      terminalDrag.setAttribute("r", "14");
    }
    let lineGroupDrag = document.getElementById(event.target.id).parentElement;
    if (terminalDrag.getAttribute("class") == 'inlineHandler') {
      var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'block'
      }
    }
    const terminalDragClassList = Array.prototype.slice.call(terminalDrag.classList);
    if (terminalDragClassList.includes('boundaryStartTerminal')) {
      const elems: any = lineGroupDrag.querySelectorAll(".boundaryStartTerminal");
      let index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'block'
      }
    }
    if (terminalDragClassList.includes('boundaryEndTerminal')) {
      const elems: any = lineGroupDrag.querySelectorAll(".boundaryEndTerminal");
      let index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'block'
      }
    }

  };
  holdSvgTerminal(event: any) { // TODO: delete
    targetTerminalSVG = event.target.id;
    let terminalDrag = document.getElementById(event.target.id);
    terminalDrag.setAttribute("r", "14");
  };
  dropSvgTerminal(event: any) {
    if (event.target.id != targetTerminalSVG) return false; // Skip terminal click if the current component is not the same as the target terminal.
    let terminalDrag = document.getElementById(event.target.id);
    let targetClassName = terminalDrag.getAttribute("class");
    if (["lineStartTerminal", "lineEndTerminal"].includes(targetClassName)) { // in case the terminal is dropped at boundary border
      if (terminalDrag.getAttribute('line-name') == 'sensorInput') {
        terminalDrag.setAttribute("x", (parseInt(terminalDrag.getAttribute('x'))).toString());
        terminalDrag.setAttribute("y", (parseInt(terminalDrag.getAttribute('y'))).toString());
        terminalDrag.setAttribute("width", "12");
        terminalDrag.setAttribute("height", "12");
        terminalDrag.setAttribute("fill", "#FFFCF5");
        terminalDrag.setAttribute("stroke", "#3C98CF");
      } else {
        terminalDrag.setAttribute("r", "7");
        terminalDrag.setAttribute("stroke", "#3C98CF");
        targetTerminalSVG = null;
        terminalDrag.setAttribute("fill", "#FFFCF5");
        terminalSVGFilled = null;
      }
    }
  };
  mouseLeaveSvgTerminal(event: any) {
    let terminalDrag = document.getElementById(event.target.id);
    terminalDrag.setAttribute("r", "7");
    terminalDrag.setAttribute("stroke", "#3C98CF");
    terminalDrag.setAttribute("stroke-width", "5");
    let lineGroupDrag = document.getElementById(event.target.id).parentElement;
    if (lineGroupDrag.getElementsByTagName("polyline").length > 0) {
      var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'none'
      }
    }

    const terminalDragClassList = Array.prototype.slice.call(terminalDrag.classList);
    if (terminalDragClassList.includes("boundaryStartTerminal") || terminalDragClassList.includes("boundaryEndTerminal")) {
      var elems: any = lineGroupDrag.querySelectorAll("circle");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'none'
      }
    }
    // targetTerminalSVG = null;
    if (!mouseDownFlag) { // only nullify targetTerminalSVG if mouse is not down
      targetTerminalSVG = null
    } else { }
    // setTimeout(function(){ targetTerminalSVG = null }, 200);
  };

  updateInlineHandlerVisualPos(myEvent: any) {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalDrag = document.getElementById(elementWithFocus.id);
    let lineDrag = terminalDragParent.querySelector(".commLine");
    let x = myEvent.x + document.getElementById("modelViewContent").scrollLeft + diffX;
    let y = myEvent.y + document.getElementById("modelViewContent").scrollTop + diffY;
    let inlineHandler_1 = document.getElementById(lineDrag.id + "_1")
    let inlineHandler_2 = document.getElementById(lineDrag.id + "_2")
    //determine position
    let coordinates = lineDrag.getAttribute("points").split(" ");
    // console.log({coordinates})
    if (coordinates.length < 5) {
      //need to handle one inline handlers
      terminalDrag.setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      //need to update x2,y2
      let second = coordinates[1].split(",")
      let second_last = coordinates[coordinates.length - 2].split(",")
      let firstPoints;
      if (second[0] == second_last[0] && second[1] == second_last[1]) {
      } else if (second[1] == second_last[1]) {
        //they are horizonal
        firstPoints = "HORIZONTAL"
      } else if (second[0] == second_last[0]) {
        //they are vertical
        firstPoints = "VERTICAL"
      }

      // console.log({firstPoints});
      if (firstPoints == "HORIZONTAL") {
        coordinates[1] = `${second[0]},${y}`
        coordinates[coordinates.length - 2] = `${second_last[0]},${y}`
        terminalDrag.setAttribute("cy", y.toString());
      } else if (firstPoints == "VERTICAL") {
        coordinates[1] = `${x},${second[1]}`
        coordinates[coordinates.length - 2] = `${x},${second_last[1]}`
        terminalDrag.setAttribute("cx", x.toString());
      }
      //need to update x3,y3
      terminalDrag.style.display = 'block'
      lineDrag.setAttribute("points", coordinates.join(" "));
    } else {
      //need to handle two scenarios
      // console.log({inlineHandler_1,inlineHandler_2});
      let whichPart = terminalDrag.id.split("_")[1];
      let second = coordinates[1].split(",");
      let third = coordinates[2].split(",");
      let second_last = coordinates[coordinates.length - 2].split(",");
      let firstPoints;
      let lastPoints;
      if (second[0] == third[0] && second[1] == third[1]) { }
      else if (second[1] == third[1]) {
        //they are horizonal
        firstPoints = "HORIZONTAL"
      } else if (second[0] == third[0]) {
        //they are vertical
        firstPoints = "VERTICAL"
      }

      if (third[0] == second_last[0] && third[1] == second_last[1]) { }
      else if (third[1] == second_last[1]) {
        //they are horizonal
        lastPoints = "HORIZONTAL"
      } else if (third[0] == second_last[0]) {
        //they are vertical
        lastPoints = "VERTICAL"
      }
      // terminalDrag.setAttribute("fill", "white");
      // terminalSVGFilled = null;
      // console.log({whichPart,lastPoints,firstPoints});
      inlineHandler_1.setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      switch (whichPart) {
        case "1":
          //need to update x2,y2 and x3,y3
          if (firstPoints == "HORIZONTAL") {
            inlineHandler_1.setAttribute("cy", y.toString());
            coordinates[1] = `${second[0]},${y}`
            coordinates[2] = `${third[0]},${y}`
          } else {
            inlineHandler_1.setAttribute("cx", x.toString());
            coordinates[1] = `${x},${second[1]}`
            coordinates[2] = `${x},${third[1]}`
          }
          break;
        case "2":
          //need to update x3,y3 and x4,y4
          if (lastPoints == "HORIZONTAL") {
            inlineHandler_2.setAttribute("cy", y.toString());
            coordinates[2] = `${third[0]},${y}`
            coordinates[coordinates.length - 2] = `${second_last[0]},${y}`
          } else {
            inlineHandler_2.setAttribute("cx", x.toString());
            coordinates[2] = `${x},${third[1]}`
            coordinates[coordinates.length - 2] = `${x},${second_last[1]}`
          }
          break;
      }
      lineDrag.setAttribute("points", coordinates.join(" "));
      inlineHandler_1.style.display = 'block';
      inlineHandler_2.style.display = 'block';
    }
    this.updateInlineHandlerAfterPolylineGeometryChange();
  }

  // Update polyline handler coordinate after geometry is changed
  updateInlineHandlerAfterPolylineGeometryChange(terminalElement?: HTMLElement) {
    let terminalDragParent = document.getElementById(terminalElement ? terminalElement.id : elementWithFocus.id).parentElement;
    let lineDrag = terminalDragParent.querySelector(".commLine");
    if (terminalDragParent.getElementsByTagName("polyline").length == 0)
      return;
    let coordinates = lineDrag.getAttribute("points").split(" ");
    let id = lineDrag.getAttribute("id");
    // console.log({coordinates});
    if (coordinates.length > 4) {
      //need to update two inline handlers
      let inlineHandler_1 = document.getElementById(id + "_1")
      let inlineHandler_2 = document.getElementById(id + "_2")
      let second = coordinates[1].split(",");
      let third = coordinates[2].split(",");
      let second_last = coordinates[coordinates.length - 2].split(",");
      let firstPoints;
      let lastPoints;
      if (second[1] == third[1]) {
        //they are horizonal
        firstPoints = "HORIZONTAL"
      } else if (second[0] == third[0]) {
        //they are vertical
        firstPoints = "VERTICAL"
      }

      if (third[1] == second_last[1]) {
        //they are horizonal
        lastPoints = "HORIZONTAL"
      } else if (third[0] == second_last[0]) {
        //they are vertical
        lastPoints = "VERTICAL"
      }

      let first_avg_horizontal = (parseFloat(second[0]) + parseFloat(third[0])) / 2;
      let first_avg_vertical = (parseFloat(second[1]) + parseFloat(third[1])) / 2;
      let second_avg_vertical = (parseFloat(third[1]) + parseFloat(second_last[1])) / 2;
      let second_avg_horizonal = (parseFloat(third[0]) + parseFloat(second_last[0])) / 2;
      // console.log({second,second_last,third,firstPoints,lastPoints,second_avg_vertical,second_avg_horizonal});

      if (inlineHandler_1) {
        if (firstPoints == "HORIZONTAL") {
          inlineHandler_1.setAttribute("cx", first_avg_horizontal.toString())
          inlineHandler_1.setAttribute("cy", second[1].toString())
        } else {
          inlineHandler_1.setAttribute("cx", second[0].toString())
          inlineHandler_1.setAttribute("cy", first_avg_vertical.toString())
        }
        inlineHandler_1.style.display = 'block'
      } else {
        //need to create new inline handler
        let newId = id + "_1";
        let newComponentStartHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentStartHandlerDropped.id = newId;  // each component on the canvas has a unique id
        newComponentStartHandlerDropped.setAttribute("class", "inlineHandler"); // class name is mainly used in mousemove event to determine which end of the rect moves
        if (firstPoints == "HORIZONTAL") {
          newComponentStartHandlerDropped.setAttribute("cx", first_avg_horizontal.toString())
          newComponentStartHandlerDropped.setAttribute("cy", second[1].toString())
        } else {
          newComponentStartHandlerDropped.setAttribute("cx", second[0].toString())
          newComponentStartHandlerDropped.setAttribute("cy", first_avg_vertical.toString())
        }
        newComponentStartHandlerDropped.setAttribute("r", "7");
        newComponentStartHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentStartHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentStartHandlerDropped.style.display = 'block'
        document.getElementById(terminalDragParent.id).appendChild(newComponentStartHandlerDropped);
      }


      if (inlineHandler_2) {
        if (lastPoints == "HORIZONTAL") {
          inlineHandler_2.setAttribute("cx", second_avg_horizonal.toString())
          inlineHandler_2.setAttribute("cy", third[1].toString())
        } else {
          inlineHandler_2.setAttribute("cx", third[0].toString())
          inlineHandler_2.setAttribute("cy", second_avg_vertical.toString())
        }
        inlineHandler_2.style.display = 'block'
      } else {
        //need to create new inline handler
        let newId = id + "_2";
        let newComponentStartHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentStartHandlerDropped.id = newId;  // each component on the canvas has a unique id
        newComponentStartHandlerDropped.setAttribute("class", "inlineHandler"); // class name is mainly used in mousemove event to determine which end of the rect moves
        if (lastPoints == "HORIZONTAL") {
          newComponentStartHandlerDropped.setAttribute("cx", second_avg_horizonal.toString())
          newComponentStartHandlerDropped.setAttribute("cy", third[1].toString())
        } else {
          newComponentStartHandlerDropped.setAttribute("cx", third[0].toString())
          newComponentStartHandlerDropped.setAttribute("cy", second_avg_vertical.toString())
        }
        newComponentStartHandlerDropped.setAttribute("r", "7");
        newComponentStartHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentStartHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentStartHandlerDropped.setAttribute("stroke-width", "6");
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentStartHandlerDropped.style.display = 'block'
        document.getElementById(terminalDragParent.id).appendChild(newComponentStartHandlerDropped);
      }
    } else {
      let second = coordinates[1].split(",")
      let second_last = coordinates[coordinates.length - 2].split(",")
      // console.log({second, second_last});
      let firstPoints;
      if (second[1] == second_last[1]) {
        //they are horizonal
        firstPoints = "HORIZONTAL"
      } else if (second[0] == second_last[0]) {
        //they are vertical
        firstPoints = "VERTICAL"
      }
      let average_y: Number = (parseFloat(second[1]) + parseFloat(second_last[1])) / 2;
      let average_x: Number = (parseFloat(second[0]) + parseFloat(second_last[0])) / 2;
      let inlineHandler_1 = document.getElementById(id + "_1")
      let inlineHandler_2 = document.getElementById(id + "_2")
      if (inlineHandler_2) {
        inlineHandler_2.remove();
      }
      if (inlineHandler_1) {
        if (firstPoints == "HORIZONTAL") {
          inlineHandler_1.setAttribute("cx", average_x.toString())
          inlineHandler_1.setAttribute("cy", second[1].toString())
        } else if (firstPoints == "VERTICAL") {
          inlineHandler_1.setAttribute("cx", second[0].toString())
          inlineHandler_1.setAttribute("cy", average_y.toString())
        }
        inlineHandler_1.style.display = 'block'
      } else {
        //need to create new inline handler
        let newId = id + "_1";
        let newComponentStartHandlerDropped = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        newComponentStartHandlerDropped.id = newId;  // each component on the canvas has a unique id
        newComponentStartHandlerDropped.setAttribute("class", "inlineHandler"); // class name is mainly used in mousemove event to determine which end of the rect moves
        if (firstPoints == "HORIZONTAL") {
          newComponentStartHandlerDropped.setAttribute("cx", average_x.toString())
          newComponentStartHandlerDropped.setAttribute("cy", second[1].toString())
        } else if (firstPoints == "VERTICAL") {
          newComponentStartHandlerDropped.setAttribute("cx", second[0].toString())
          newComponentStartHandlerDropped.setAttribute("cy", average_y.toString())
        }
        newComponentStartHandlerDropped.setAttribute("r", "7");
        newComponentStartHandlerDropped.setAttribute("fill", "#FFFCF5");
        newComponentStartHandlerDropped.setAttribute("stroke", "#3C98CF");
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentStartHandlerDropped.style.display = 'block'
        document.getElementById(terminalDragParent.id).appendChild(newComponentStartHandlerDropped);
      }

    }
  }


  // function to update line terminal position visually on the Canvas
  updateLineTerminalVisualPos(myEvent: any): [number, number] {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalDrag = document.getElementById(elementWithFocus.id);
    let lineDrag = terminalDragParent.querySelector(".commLine");
    // console.log(`mouse x is ${myEvent.x}, scrollLeft is ${document.getElementById("modelViewContent").scrollLeft}, diffX is ${diffX}`)
    let x = myEvent.x + document.getElementById("modelViewContent").scrollLeft + diffX;
    let y = myEvent.y + document.getElementById("modelViewContent").scrollTop + diffY;
    if (x < this.minTerminalSpace.X || y < this.minTerminalSpace.Y) {
      return [x, y];
    }
    terminalDrag.setAttribute("fill", "#FFFCF5");
    terminalSVGFilled = null;
    if (terminalDrag.getAttribute("line-name") === 'sensorInput') {
      terminalDrag.setAttribute("x", x.toString());
      terminalDrag.setAttribute("y", y.toString());
    } else {
      terminalDrag.setAttribute("cx", x.toString());
      terminalDrag.setAttribute("cy", y.toString());
    }
    if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
      //in this we need to detect either this is going to br a
      let points = lineDrag.getAttribute("points");
      let coordinates = points.split(" ");
      let x1;
      let y1;
      let x2;
      let y2;
      let x3;
      let y3;
      let x4;
      let y4;
      let x5;
      let y5;
      // console.log("Printing coordinates for the internal checkup", {coordinates})
      if (coordinates.length > 4) {
        // console.log("five point polyline, need to work on this part");
        if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
          x1 = x;
          y1 = y;
          x4 = parseInt(coordinates[coordinates.length - 2].split(",")[0]);
          y4 = parseInt(coordinates[coordinates.length - 2].split(",")[1]);
          x5 = parseInt(coordinates[coordinates.length - 1].split(",")[0])
          y5 = parseInt(coordinates[coordinates.length - 1].split(",")[1])

          if (coordinates[1].split(",")[1] > coordinates[0].split(",")[1]) {
            let diff = parseFloat(coordinates[1].split(",")[1]) - parseFloat(coordinates[0].split(",")[1])
            y2 = parseFloat(y) + diff
          } else if (coordinates[1].split(",")[1] < coordinates[0].split(",")[1]) {
            let diff = parseFloat(coordinates[0].split(",")[1]) - parseFloat(coordinates[1].split(",")[1])
            y2 = parseFloat(y) - diff
          } else {
            y2 = y;
          }

          if (coordinates[1].split(",")[0] > coordinates[0].split(",")[0]) {
            let diff = parseFloat(coordinates[1].split(",")[0]) - parseFloat(coordinates[0].split(",")[0])
            x2 = parseFloat(x) + diff
          } else if (coordinates[1].split(",")[0] < coordinates[0].split(",")[0]) {
            let diff = parseFloat(coordinates[0].split(",")[0]) - parseFloat(coordinates[1].split(",")[0])
            x2 = parseFloat(x) - diff
          } else {
            x2 = x;
          }

          //now we need to calculate x3 and y3
          let first = [x1, y1]
          let last = coordinates[coordinates.length - 1].split(",");
          let second = [x2, y2]
          let second_last = coordinates[coordinates.length - 2].split(",");
          // console.log({first,second, second_last, last})
          let firstPoints;
          let lastPoints;
          if (first[1] == second[1]) {
            //they are horizonal
            firstPoints = "HORIZONTAL"
          } else if (first[0] == second[0]) {
            //they are vertical
            firstPoints = "VERTICAL"
          }

          if (last[1] == second_last[1]) {
            //they are horizonal
            lastPoints = "HORIZONTAL"
          } else if (last[0] == second_last[0]) {
            //they are vertical
            lastPoints = "VERTICAL"
          }

          let x3 = (firstPoints == "HORIZONTAL") ? second[0] : second_last[0]
          let y3 = (lastPoints == "HORIZONTAL") ? second[1] : second_last[1];

          // console.log(`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5}`)
          lineDrag.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5}`)

        } else {
          x1 = parseInt(coordinates[0].split(",")[0]);
          y1 = parseInt(coordinates[0].split(",")[1]);
          x2 = parseInt(coordinates[1].split(",")[0]);
          y2 = parseInt(coordinates[1].split(",")[1]);
          x5 = x;
          y5 = y;

          //checking movement of last point in which direction:

          if (coordinates[coordinates.length - 2].split(",")[1] > coordinates[coordinates.length - 1].split(",")[1]) {
            let diff = parseFloat(coordinates[coordinates.length - 2].split(",")[1]) - parseFloat(coordinates[coordinates.length - 1].split(",")[1])
            y4 = parseFloat(y) + diff
          } else if (coordinates[coordinates.length - 2].split(",")[1] < coordinates[coordinates.length - 1].split(",")[1]) {
            let diff = parseFloat(coordinates[coordinates.length - 1].split(",")[1]) - parseFloat(coordinates[coordinates.length - 2].split(",")[1])
            y4 = parseFloat(y) - diff
          } else {
            y4 = y;
          }

          if (coordinates[coordinates.length - 2].split(",")[0] > coordinates[coordinates.length - 1].split(",")[0]) {
            let diff = parseFloat(coordinates[coordinates.length - 2].split(",")[0]) - parseFloat(coordinates[coordinates.length - 1].split(",")[0])
            x4 = parseFloat(x) + diff
          } else if (coordinates[coordinates.length - 2].split(",")[0] < coordinates[coordinates.length - 1].split(",")[0]) {
            let diff = parseFloat(coordinates[coordinates.length - 1].split(",")[0]) - parseFloat(coordinates[coordinates.length - 2].split(",")[0])
            x4 = parseFloat(x) - diff
          } else {
            x4 = x;
          }


          //now we need to calculate x3 and y3
          let first = coordinates[0].split(",")
          let last = [x5, y5]
          let second = coordinates[1].split(",");
          let second_last = [x4, y4];
          // console.log({first,second, second_last, last})
          let firstPoints;
          let lastPoints;
          if (first[1] == second[1]) {
            //they are horizonal
            firstPoints = "HORIZONTAL"
          } else if (first[0] == second[0]) {
            //they are vertical
            firstPoints = "VERTICAL"
          }

          if (last[1] == second_last[1]) {
            //they are horizonal
            lastPoints = "HORIZONTAL"
          } else if (last[0] == second_last[0]) {
            //they are vertical
            lastPoints = "VERTICAL"
          }

          let x3 = (firstPoints == "HORIZONTAL") ? second[0] : second_last[0]
          let y3 = (lastPoints == "HORIZONTAL") ? second[1] : second_last[1];

          // console.log(`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5}`)
          lineDrag.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5}`)
        }
      } else {
        if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
          x1 = x;
          y1 = y;
          x4 = parseInt(coordinates[coordinates.length - 1].split(",")[0]);
          y4 = parseInt(coordinates[coordinates.length - 1].split(",")[1]);
          //checking if other is connected.
          let lastTerminal = terminalDragParent.querySelector(".lineEndTerminal")
          // console.log(lastTerminal, lastTerminal.getAttribute("fill"));
          if (lastTerminal.getAttribute("fill") == '#3C98CF') {
            x3 = parseInt(coordinates[coordinates.length - 2].split(",")[0])
            y3 = parseInt(coordinates[coordinates.length - 2].split(",")[1])
            if (coordinates[coordinates.length - 1].split(",")[1] == coordinates[coordinates.length - 2].split(",")[1]) {
              x2 = x3
              y2 = y;
            } else if (coordinates[coordinates.length - 1].split(",")[0] == coordinates[coordinates.length - 2].split(",")[0]) {
              //they are vertical
              x2 = x1
              y2 = y3
            }
          } else {
            x2 = x1 + (x4 - x1) / 2;
            x3 = x1 + (x4 - x1) / 2;
            y2 = y1;
            y3 = y4;
          }
        } else {
          x1 = parseInt(coordinates[0].split(",")[0])
          y1 = parseInt(coordinates[0].split(",")[1])
          x4 = x;
          y4 = y;
          let firstTerminal = terminalDragParent.querySelector(".lineStartTerminal")
          // console.log(firstTerminal, firstTerminal.getAttribute("fill"));
          if (firstTerminal.getAttribute("fill") == '#3C98CF') {
            //get connected values
            x2 = parseInt(coordinates[1].split(",")[0])
            y2 = parseInt(coordinates[1].split(",")[1])
            if (coordinates[0].split(",")[1] == coordinates[1].split(",")[1]) {
              x3 = coordinates[1].split(",")[0]
              y3 = y4;
            } else if (coordinates[0].split(",")[0] == coordinates[1].split(",")[0]) {
              //they are vertical
              x3 = x4
              y3 = coordinates[1].split(",")[1]
            }
          } else {
            x2 = x1 + (x4 - x1) / 2;
            x3 = x1 + (x4 - x1) / 2;
            y2 = y1;
            y3 = y4;
          }
        }

        // console.log("four point polyline, already have logic for this.")
        lineDrag.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);
      }
      this.updateInlineHandlerAfterPolylineGeometryChange();
    } else {
      if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
        lineDrag.setAttribute("x1", x.toString());
        lineDrag.setAttribute("y1", y.toString());
      } else {
        lineDrag.setAttribute("x2", x.toString());
        lineDrag.setAttribute("y2", y.toString());
      };
    }

    return [x, y];
  };

  // function to update line position visually on the Canvas
  updateLineVisualPos(myEvent: any) {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalsArray,
      lineDrag = elementWithFocus,
      x1 = myEvent.x + diffX1,
      y1 = myEvent.y + diffY1,
      x2 = myEvent.x + diffX2,
      y2 = myEvent.y + diffY2;
    if (x1 < this.minLineSpace.X || y1 < this.minLineSpace.Y || x2 < this.minLineSpace.X || y2 < this.minLineSpace.Y) {
      return false;
    }
    if (terminalDragParent.children[1].tagName === 'circle') {
      terminalsArray = terminalDragParent.querySelectorAll("circle");
      terminalsArray[0].setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      terminalsArray[0].setAttribute("cx", x1.toString());
      terminalsArray[0].setAttribute("cy", y1.toString());
      terminalsArray[1].setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      terminalsArray[1].setAttribute("cx", x2.toString());
      terminalsArray[1].setAttribute("cy", y2.toString());
    } else {
      terminalsArray = terminalDragParent.querySelectorAll("rect");
      terminalsArray[0].setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      terminalsArray[0].setAttribute("x", x1.toString());
      terminalsArray[0].setAttribute("y", y1.toString());
      terminalsArray[1].setAttribute("fill", "#FFFCF5");
      terminalSVGFilled = null;
      terminalsArray[1].setAttribute("x", x2.toString());
      terminalsArray[1].setAttribute("y", y2.toString());
    }
    if (lineDrag) {
      lineDrag.setAttribute("x1", x1.toString());
      lineDrag.setAttribute("y1", y1.toString());
      lineDrag.setAttribute("x2", x2.toString());
      lineDrag.setAttribute("y2", y2.toString());
    }
    if (terminalsArray.length > 0) {
      terminalsArray[0].setAttribute("fill", "white");
      terminalSVGFilled = null;
      terminalsArray[0].setAttribute("cx", x1.toString());
      terminalsArray[0].setAttribute("cy", y1.toString());
      terminalsArray[1].setAttribute("fill", "white");
      terminalSVGFilled = null;
      terminalsArray[1].setAttribute("cx", x2.toString());
      terminalsArray[1].setAttribute("cy", y2.toString());
    }
  };

  // Update polyline visual position on canvas when dragged to another position.
  updatePolylineVisualPos(myEvent: any) {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalsArray = terminalDragParent.querySelectorAll("circle");
    let x1 = myEvent.x + diffX1;
    let y1 = myEvent.y + diffY1;
    let x2 = myEvent.x + diffX2;
    let y2 = myEvent.y + diffY2;
    let x3 = myEvent.x + diffX3;
    let y3 = myEvent.y + diffY3;
    let x4 = myEvent.x + diffX4;
    let y4 = myEvent.y + diffY4;
    let x5 = myEvent.x + diffX5;
    let y5 = myEvent.y + diffY5;
    //need to update the polyline as well
    let polylineDrag = terminalDragParent.querySelector(".commLine");
    let coordinates = polylineDrag.getAttribute("points").split(" ");
    if (coordinates.length < 5) {
      if (x1 < this.minLineSpace.X || y1 < this.minLineSpace.Y || x4 < this.minLineSpace.X || y4 < this.minLineSpace.Y) {
        return false;
      }
      polylineDrag.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`);

      terminalsArray[0].setAttribute("fill", "#FFFCF5");
      terminalsArray[0].setAttribute("cx", x1.toString());
      terminalsArray[0].setAttribute("cy", y1.toString());
      terminalsArray[1].setAttribute("fill", "#FFFCF5");
      terminalsArray[1].setAttribute("cx", x4.toString());
      terminalsArray[1].setAttribute("cy", y4.toString());
    } else {
      if (x1 < this.minLineSpace.X || y1 < this.minLineSpace.Y || x5 < this.minLineSpace.X || y5 < this.minLineSpace.Y) {
        return false;
      }
      polylineDrag.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5}`);

      terminalsArray[0].setAttribute("fill", "#FFFCF5");
      terminalsArray[0].setAttribute("cx", x1.toString());
      terminalsArray[0].setAttribute("cy", y1.toString());
      terminalsArray[1].setAttribute("fill", "#FFFCF5");
      terminalsArray[1].setAttribute("cx", x5.toString());
      terminalsArray[1].setAttribute("cy", y5.toString());
    }
    this.updateInlineHandlerAfterPolylineGeometryChange();
    terminalSVGFilled = null;
  }

  // function to update boundary position and size visually on the Canvas
  updateBoundaryVisualPos(myEvent: any): void {
    const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    const rectDrag = terminalDragParent.querySelector(".boundary");
    const terminalsArray = terminalDragParent.querySelectorAll("circle");
    let x = myEvent.x + diffX,
      y = myEvent.y + diffY;
    if (x < this.minModuleSpace.X) {
      x = this.minModuleSpace.X;
    }
    if (y < this.minModuleSpace.Y) {
      y = this.minModuleSpace.Y;
    }
    rectDrag.setAttribute("x", x.toString());
    rectDrag.setAttribute("y", y.toString());
    terminalsArray[0].setAttribute("cx", x.toString());
    terminalsArray[0].setAttribute("cy", y.toString());
    terminalsArray[1].setAttribute("cx", (x + Number(rectDrag.getAttribute("width"))).toString());
    terminalsArray[1].setAttribute("cy", (y + Number(rectDrag.getAttribute("height"))).toString());

    const textX: number = Number(elementWithFocus.getAttribute("x")) + (Number(elementWithFocus.getAttribute("width")) / 2) - scrollX;
    const textY: number = Number(elementWithFocus.getAttribute("y")) - scrollY;
    this.updateModuleText(terminalDragParent.id, textX, textY);
  };
  // function to update boundary position and size visually on the Canvas
  updateBoundaryTerminalVisualPos(myEvent: any) {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalDrag = document.getElementById(elementWithFocus.id);
    let rectDrag = terminalDragParent.querySelector(".boundary");
    let x = myEvent.x + document.getElementById("modelViewContent").scrollLeft + diffX;
    let y = myEvent.y + document.getElementById("modelViewContent").scrollTop + diffY;
    if (x < this.minTerminalSpace.X || y < this.minTerminalSpace.Y) return false;
    if (terminalDrag.getAttribute("class") === "boundaryStartTerminal") { // this will update position
      const anchorX = Number(rectDrag.getAttribute("x"));
      const anchorY = Number(rectDrag.getAttribute("y"));
      const otherHandler = terminalDragParent.querySelector(".boundaryEndTerminal");
      const width = Number(otherHandler.getAttribute("cx")) - x;
      const height = Number(otherHandler.getAttribute("cy")) - y;
      if (width > 10 && height > 10) {
        rectDrag.setAttribute("width", width.toString());
        rectDrag.setAttribute("height", height.toString());
        rectDrag.setAttribute("x", x.toString());
        rectDrag.setAttribute("y", y.toString());
        terminalDrag.setAttribute("cx", x.toString());
        terminalDrag.setAttribute("cy", y.toString());
        // move boundary header text along with boundary module
        const boundarySVGGroup = terminalDrag.parentElement;
        const textContainer = document.getElementById(boundarySVGGroup.dataset.textId);
        if (textContainer) {
          textContainer.style.left = anchorX.toString() + "px";
          textContainer.style.top = anchorY.toString() + "px";
          textContainer.style.width = width + "px";
        }
      }
    } else if (terminalDrag.getAttribute("class") === "boundaryEndTerminal") { // this will update size
      let anchorX = Number(rectDrag.getAttribute("x"));
      let anchorY = Number(rectDrag.getAttribute("y"));
      let rectWidth = Math.max(myEvent.x - anchorX + document.getElementById("modelViewContent").scrollLeft + diffX, 10);
      let rectHeight = Math.max(myEvent.y - anchorY + document.getElementById("modelViewContent").scrollTop + diffY, 10);
      rectDrag.setAttribute("width", rectWidth.toString());
      rectDrag.setAttribute("height", rectHeight.toString());
      x = Math.max(x, anchorX + 10);
      y = Math.max(y, anchorY + 10);
      terminalDrag.setAttribute("cx", x.toString());
      terminalDrag.setAttribute("cy", y.toString());
      // Move text along with boundary
      const boundarySVGGroup = terminalDrag.parentElement;
      const textContainer = document.getElementById(boundarySVGGroup.dataset.textId);
      if (textContainer) {
        textContainer.style.left = anchorX.toString() + "px";
        textContainer.style.top = anchorY.toString() + "px";
        textContainer.style.width = rectWidth + "px";
      }
    }
    const textX: number = Number(rectDrag.getAttribute("x")) + (Number(rectDrag.getAttribute("width")) / 2) - scrollX;
    const textY: number = Number(rectDrag.getAttribute("y")) - scrollY;
    this.updateModuleText(terminalDragParent.id, textX, textY);
  };
  // Update inlineHandlers positions when polyline is repositioned
  private updateInlineHandlersPositions(lineDrag: any) {
    const coordinatesAttr = lineDrag.getAttribute('points');
    let coordinates: any[] = coordinatesAttr.split(" ");
    // console.log({ lineDrag });
    coordinates = coordinates.map(point => point.split(",")).map((point: string[]) => point.map((value: string) => Number(value)));
    const inlineHandlers = lineDrag.parentElement.querySelectorAll(".inlineHandler");
    coordinates.shift();
    coordinates.pop();
    inlineHandlers.forEach((inlineHandler: any, i: number) => {
      const cx: number = Number(inlineHandler.getAttribute("cx"));
      const cy: number = Number(inlineHandler.getAttribute("cy"));
      // console.log(lineDrag);
      // console.log({ coordinates })

      if ((coordinates[i][0] === coordinates[i + 1][0]) && (cx === coordinates[i][0])) {
        const diff = coordinates[i + 1][1] - coordinates[i][1];
        // const middlePosition = diff < 0 ? (- diff) / 2 : diff / 2;
        const middlePosition = diff / 2;
        inlineHandler.setAttribute("cy", (coordinates[i][1] + middlePosition).toString());
        // console.log("y updated")
      } else if ((coordinates[i][1] === coordinates[i + 1][1]) && (cy === coordinates[i][1])) {
        const diff = coordinates[i + 1][0] - coordinates[i][0];
        // console.log({ diff })
        // const middlePosition = diff < 0 ? (- diff) / 2 : diff / 2;
        const middlePosition = diff / 2;
        // console.log({ middlePosition });
        inlineHandler.setAttribute("cx", (coordinates[i][0] + middlePosition).toString());
        // console.log("x updated");
      }
    });
  }
  updateTerminalPositionsWithComponent(componentId: string, componentList: any[], type: string, componentPosition: any) { // x, y here are new coordinates of the micro
    const componentIndex = this.ArrOp.findStringIndexInArrayProperty(componentId, "id", componentList);
    if (this.newDesign[type][componentIndex].lineTerminalId.length !== undefined) { // if the micro has line terminals attached, move those terminals
      const commLinesTerminals = this.commLinesTerminals.filter(terminal => terminal.componentId === componentId);
      for (let i = 0; i < commLinesTerminals.length; i++) {
        const terminalId = commLinesTerminals[i].id;
        const componentX = componentPosition.x; // original coordinates of micro
        const componentY = componentPosition.y;
        const terminalDragParent = document.getElementById(terminalId).parentElement;
        const terminalDrag = document.getElementById(terminalId);
        const lineDrag = terminalDragParent.querySelector(".commLine");
        const lineIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
        const terminalX = commLinesTerminals[i].position[0]; // original coordinates of the terminal
        const terminalY = commLinesTerminals[i].position[1];
        // console.log({ componentPosition, terminalPosition: commLinesTerminals[i].position });
        const newX = componentX + terminalX;
        const newY = componentY + terminalY;
        if (terminalDrag.getAttribute('line-name') == 'sensorInput') {
          terminalDrag.setAttribute("x", newX.toString());
          terminalDrag.setAttribute("y", newY.toString());
        } else {
          terminalDrag.setAttribute("cx", newX.toString());
          terminalDrag.setAttribute("cy", newY.toString());
        }
        if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
          if (lineDrag.getAttribute("name") === "polyline") {
            const coordinatesAttr = lineDrag.getAttribute('points');
            const coordinatesPoints: any[] = coordinatesAttr.split(" ")
              .map((point: string) => point.split(","))
              .map((point: any[]) => point.map(value => Number(value)));
            let coordinates: any[] = coordinatesAttr.split(" ");
            const adjustPreviousPoint = coordinates[1].split(",");
            if ((coordinatesPoints[0][0] === coordinatesPoints[1][0]) && (coordinatesPoints[0][1] === coordinatesPoints[1][1])) {
              coordinates[1] = `${adjustPreviousPoint[0]},${newY}`;
            } else if (coordinatesPoints[0][0] === coordinatesPoints[1][0]) {
              coordinates[1] = `${newX},${adjustPreviousPoint[1]}`;
            } else if (coordinatesPoints[0][1] === coordinatesPoints[1][1]) {
              coordinates[1] = `${adjustPreviousPoint[0]},${newY}`;
            }
            coordinates[0] = `${newX},${newY}`;
            lineDrag.setAttribute('points', coordinates.join(" "));

            // Settle inlineHandlers
            this.updateInlineHandlersPositions(lineDrag);
          } else {
            lineDrag.setAttribute("x1", newX.toString());
            lineDrag.setAttribute("y1", newY.toString());
            this.newDesign.commLine[lineIndex].position[0] = newX;
            this.newDesign.commLine[lineIndex].position[1] = newY;
          }
        } else if (terminalDrag.getAttribute("class") === "lineEndTerminal") {
          if (lineDrag.getAttribute("name") === "polyline") {
            const coordinatesAttr = lineDrag.getAttribute('points');
            const coordinatesPoints: any[] = coordinatesAttr.split(" ").map((point: string) => point.split(","));
            let coordinates: any[] = coordinatesAttr.split(" ");
            const adjustPreviousPoint = coordinates[coordinates.length - 2].split(",");
            if ((coordinatesPoints[coordinates.length - 1][0] === coordinatesPoints[coordinates.length - 2][0]) && (coordinatesPoints[coordinates.length - 1][1] === coordinatesPoints[coordinates.length - 2][1])) {
              coordinates[coordinates.length - 2] = `${adjustPreviousPoint[0]},${newY}`;
            } else if (coordinatesPoints[coordinates.length - 1][0] === coordinatesPoints[coordinates.length - 2][0]) {
              coordinates[coordinates.length - 2] = `${newX},${adjustPreviousPoint[1]}`;
            } else if (coordinatesPoints[coordinates.length - 1][1] === coordinatesPoints[coordinates.length - 2][1]) {
              coordinates[coordinates.length - 2] = `${adjustPreviousPoint[0]},${newY}`;
            }
            coordinates[coordinates.length - 1] = `${newX},${newY}`;
            lineDrag.setAttribute('points', coordinates.join(" "));

            // Settle inlineHandlers
            this.updateInlineHandlersPositions(lineDrag);
          } else {
            lineDrag.setAttribute("x2", newX.toString());
            lineDrag.setAttribute("y2", newY.toString());
            this.newDesign.commLine[lineIndex].position[2] = newX;
            this.newDesign.commLine[lineIndex].position[3] = newY;
          }
        };

        this.editDesignShared.updateNewDesignComponents(this.newDesign);
      }
    }
  };
  // non-functional function
  // funcion to update line terminal position both visually and logically using transforming coordinates.
  // Used to move connected line terminals together when a micro is moved
  updateTerminalPositionsWithMicro(microId: string, x: number, y: number) { // x, y here are new coordinates of the micro
    let microIndex = this.ArrOp.findStringIndexInArrayProperty(microId, "id", this.microList);
    // console.log(microId);
    // console.log(this.newDesign.micro);
    if (this.newDesign.micro[microIndex].lineTerminalId.length !== undefined) { // if the micro has line terminals attached, move those terminals
      for (let i = 0; i < this.newDesign.micro[microIndex].lineTerminalId.length; i++) {
        let terminalId = this.newDesign.micro[microIndex].lineTerminalId[i];
        let microX = this.newDesign.micro[microIndex].position[0]; // original coordinates of micro
        let microY = this.newDesign.micro[microIndex].position[1];
        let terminalDragParent = document.getElementById(terminalId).parentElement;
        let terminalDrag = document.getElementById(terminalId);
        let lineDrag = terminalDragParent.querySelector(".commLine");
        let lineIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
        if (terminalDrag.getAttribute("class") === "lineStartTerminal") {
          let terminalX = this.newDesign.commLine[lineIndex].position[0]; // original coordinates of the terminal
          let terminalY = this.newDesign.commLine[lineIndex].position[1];
          let diffX = terminalX - microX; // original coordinates delta between terminal and micro
          let diffY = terminalY - microY;
          let newX = diffX + x;
          let newY = diffY + y;
          lineDrag.setAttribute("x1", newX.toString());
          lineDrag.setAttribute("y1", newY.toString());
          if (terminalDrag.getAttribute('line-name') == 'sensorInput') {
            terminalDrag.setAttribute("x", newX.toString());
            terminalDrag.setAttribute("y", newY.toString());
          } else {
            terminalDrag.setAttribute("cx", newX.toString());
            terminalDrag.setAttribute("cy", newY.toString());
          }
          this.newDesign.commLine[lineIndex].position[0] = newX;
          this.newDesign.commLine[lineIndex].position[1] = newY;
        } else if (terminalDrag.getAttribute("class") === "lineEndTerminal") {
          let newX = this.newDesign.commLine[lineIndex].position[2] + x;
          lineDrag.setAttribute("x2", newX.toString());
          let newY = this.newDesign.commLine[lineIndex].position[3] + y;
          lineDrag.setAttribute("y2", newY.toString());
          this.newDesign.commLine[lineIndex].position[2] = newX;
          this.newDesign.commLine[lineIndex].position[3] = newY;
        };
      }
    }
  };
  // function to update line and line terminals position in newDesign
  updateCommLinePosition(myEvent: any): void {
    const terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    const lineDrag = terminalDragParent.querySelector(".commLine");
    if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
      const componentIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
      //need to get all the attributes of the array
      const coordinates = lineDrag.getAttribute('points');
      const updatedCoordinates: any[] = coordinates.split(" ").map((point: string) => point.split(","));
      const pointValues: number[] = [];
      updatedCoordinates.forEach((arr: string[]) => {
        pointValues.push(Number(arr[0]));
        pointValues.push(Number(arr[1]));
      });
      this.newDesign.commLine[componentIndex].position = pointValues;
      this.editDesignShared.updateNewDesignComponents(this.newDesign);
      console.log("The position of line id " + terminalDragParent.id + " has been updated in newDesign.")
    } else {
      const componentIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
      this.newDesign.commLine[componentIndex].position = [Number(lineDrag.getAttribute("x1")), Number(lineDrag.getAttribute("y1")),
      Number(lineDrag.getAttribute("x2")), Number(lineDrag.getAttribute("y2"))];
      this.editDesignShared.updateNewDesignComponents(this.newDesign);
      console.log("The position of line id " + terminalDragParent.id + " has been updated in newDesign.")
    }

  };

  // function to update polyline and line terminals position in newDesign
  updatePolyLinePosition(myEvent: any): void {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let lineDrag = terminalDragParent.querySelector(".commLine");
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.lineList);
    //need to get all the attributes of the array
    let coordinates = lineDrag.getAttribute('points');
    let updatedCoordinates: any[] = coordinates.split(" ").map((point: string) => point.split(","));
    const pointValues: number[] = [];
    updatedCoordinates.forEach((arr: string[]) => {
      pointValues.push(Number(arr[0]));
      pointValues.push(Number(arr[1]));
    });
    this.newDesign.commLine[componentIndex].position = pointValues;
    this.editDesignShared.updateNewDesignComponents(this.newDesign);
    console.log("The position of line id " + terminalDragParent.id + " has been updated in newDesign.")
  };
  // function to update boundary component position in newDesign
  updateBoundaryPosition(myEvent: any): void {
    let terminalDragParent = document.getElementById(elementWithFocus.id).parentElement;
    let terminalDrag = document.getElementById(elementWithFocus.id);
    let x = myEvent.clientX - sidebarWidth;
    let y = myEvent.clientY - navBarHeight;
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParent.id, "id", this.boundaryList);
    const boundary = document.getElementById(this.newDesign.boundary[componentIndex].id).children.item(0);
    if (terminalDrag.getAttribute("class") === "boundary") { // change position
      // this.newDesign.boundary[componentIndex].position[0] = x;
      // this.newDesign.boundary[componentIndex].position[1] = y;
      // console.log(document.getElementById(this.newDesign.boundary[componentIndex].id).children.item(0).getAttribute("x"))
      this.newDesign.boundary[componentIndex].position[0] = parseInt(boundary.getAttribute("x"));
      this.newDesign.boundary[componentIndex].position[1] = parseInt(boundary.getAttribute("y"));
      console.log("The position of boundary id " + terminalDragParent.id + " has been updated in newDesign.")
    } else { // change size
      // let rectDrag = terminalDragParent.querySelector(".boundary");
      // let anchorX = Number(rectDrag.getAttribute("x"));
      // let anchorY = Number(rectDrag.getAttribute("y"));
      // let rectWidth = myEvent.x - sidebarWidth - anchorX;
      // let rectHeight = myEvent.y - anchorY;
      this.newDesign.boundary[componentIndex].size[0] = parseInt(boundary.getAttribute("width"));
      this.newDesign.boundary[componentIndex].size[1] = parseInt(boundary.getAttribute("height"));
      this.newDesign.boundary[componentIndex].position[0] = parseInt(boundary.getAttribute("x"));
      this.newDesign.boundary[componentIndex].position[1] = parseInt(boundary.getAttribute("y"));
      console.log("The size of boundary id " + terminalDragParent.id + " has been updated in newDesign.")
    }
  };

  // add micro id or controlUnit id to line component in newDesign
  addMicroOrControlUnitToLineComponent(myEvent: any) {
    if (terminalSVGFilled) { // works only if terminal circle is filled (connected to another component)
      const terminalDragParent = document.getElementById(terminalSVGFilled).parentElement;
      const lineDrag = terminalDragParent.querySelector(".commLine");
      const terminalDragParentId = terminalDragParent.id;
      const lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
      const terminalIndex = this.ArrOp.findStringIndexInArray(terminalSVGFilled, this.lineList[lineIdIndex].terminalId); // lineStartTerminal is 0, lineEndTerminal is 1
      const module: any = this.ArrOp.getComponentById(myEvent.target.id, [...this.newDesign.micro, ...this.newDesign.controlUnit]);
      // If a connected terminal reconnects within the same module, don't empty the feature and asset property from newDesign. But empty these properties when a terminal is not connected.
      if (module && !module.lineTerminalId.includes(terminalSVGFilled)) {
        this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] = myEvent.target.id; // terminalIndex stays fixed. terminalComponentId and features match terminalIndex.
        this.newDesign.commLine[lineIdIndex].terminalComponentFeature[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureIndex[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureId[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessBoolean[terminalIndex] = new Array(module.asset ? module.asset.length : 0).fill(false);
      }
      if (terminalDragParent.getElementsByTagName("polyline").length > 0) {
        const coordinates = lineDrag.getAttribute('points');
        const updatedCoordinates: any[] = coordinates.split(" ").map((point: string) => point.split(","));
        const pointValues: number[] = [];
        updatedCoordinates.forEach((arr: string[]) => {
          pointValues.push(Number(arr[0]));
          pointValues.push(Number(arr[1]));
        });
        this.newDesign.commLine[lineIdIndex].position = pointValues;
      } else {
        this.newDesign.commLine[lineIdIndex].position = [Number(lineDrag.getAttribute("x1")), Number(lineDrag.getAttribute("y1")),
        Number(lineDrag.getAttribute("x2")), Number(lineDrag.getAttribute("y2"))];
      }
      this.editDesignShared.updateNewDesignComponents(this.newDesign);
      console.log("Component id " + myEvent.target.id + " has been added to lineList of newDesign.");
    }
  };
  // disconnect a terminal and a micro in newDesign. remove the micro id from lineList. remove terminal id in microList. remove line id from micro.lineId.
  disconnectTerminalAndMicro(terminalId: string): void {
    if (!terminalSVGFilled) { // works only if the terminal circle is not filled
      let terminalDragParentId = document.getElementById(terminalId).parentElement.id;
      let lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
      let terminalIndex = this.ArrOp.findStringIndexInArray(terminalId, this.lineList[lineIdIndex]?.terminalId); // lineStartTerminal is 0, lineEndTerminal is 1
      let microId = this.newDesign.commLine[lineIdIndex]?.terminalComponentId[terminalIndex]; // find the micro and remove the terminal id from microList as well
      let microComponentIndex = this.ArrOp.findStringIndexInArrayProperty(microId, "id", this.microList);
      if (microComponentIndex != undefined) { // if the micro id still exists in terminalComponentId of lineList
        // let terminalInMicroIndex = this.ArrOp.findStringIndexInArrayProperty(myEvent.target.id, "id", this.microList[microComponentIndex].lineTerminalId);
        let terminalInMicroIndex = this.microList[microComponentIndex].lineTerminalId.findIndex(value => value === terminalId);
        console.log("Micro id " + this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] + " has been disconnected from terminal " + terminalId + " and newDesign has been updated.")
        this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] = "";
        this.newDesign.commLine[lineIdIndex].terminalComponentFeature[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureIndex[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureId[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessBoolean[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessType[terminalIndex] = [];
        // this.newDesign.commLine[lineIdIndex].terminalComponentId.splice(terminalIndex, 1);
        // this.newDesign.commLine[lineIdIndex].terminalComponentFeature.splice(terminalIndex, 1);
        // console.log({ terminalInMicroIndex, elem: myEvent.target.id, arr: this.microList[microComponentIndex].lineTerminalId });
        if (terminalInMicroIndex > -1) {
          this.microList[microComponentIndex].lineTerminalId.splice(terminalInMicroIndex, 1);
        }
        // console.log(terminalDragParentId)
        // let lineIdInMicroIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.microList[microComponentIndex].lineId);
        let lineIdInMicroIndex = this.microList[microComponentIndex].lineId.findIndex(value => value === terminalDragParentId);
        if (lineIdInMicroIndex > -1) {
          this.microList[microComponentIndex].lineId.splice(lineIdInMicroIndex, 1);
        }
        // console.log({ lineIdIndex, terminalDragParentId, terminalIndex, terminal: myEvent.target.id });
        // console.log({ lineIdInMicroIndex, terminalInMicroIndex });
        // console.log({ microList: this.microList[microComponentIndex] });
        // this.commLinesTerminals = this.commLinesTerminals.filter(terminal => terminal.id !== myEvent.target.id);
        const commLinesTerminalIndex = this.commLinesTerminals.findIndex(terminal => terminal.id === terminalId && terminal.componentId === microId);
        if (commLinesTerminalIndex > -1) {
          this.commLinesTerminals.splice(commLinesTerminalIndex, 1);
        }
        // this.editDesignShared.updateNewDesignComponents(this.newDesign);
        // console.log("this.commLinesTerminals", this.commLinesTerminals);
      } else { // if the micro has already been disconnected, do nothing
      }
    }
  };
  // disconnect a terminal and a controlUnit in newDesign. remove the controlUnit id from lineList, and remove terminal id in controlUnitList. remove line id from controlUnit.lineId.
  disconnectTerminalAndControlUnit(terminalId: string): void {
    if (!terminalSVGFilled) { // works only if the terminal circle is not filled
      let terminalDragParentId = document.getElementById(terminalId).parentElement.id;
      let lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
      let terminalIndex = this.ArrOp.findStringIndexInArray(terminalId, this.lineList[lineIdIndex]?.terminalId); // lineStartTerminal is 0, lineEndTerminal is 1
      let controlUnitId = this.newDesign.commLine[lineIdIndex]?.terminalComponentId[terminalIndex]; // find the controlUnit and remove the terminal id from controlUnitList as well
      let controlUnitComponentIndex = this.ArrOp.findStringIndexInArrayProperty(controlUnitId, "id", this.controlUnitList);
      if (controlUnitComponentIndex != undefined) { // if the controlUnit id still exists in terminalComponentId of lineList
        // let terminalInControlUnitIndex = this.ArrOp.findStringIndexInArrayProperty(myEvent.target.id, "id", this.controlUnitList[controlUnitComponentIndex].lineTerminalId);
        let terminalInControlUnitIndex = this.controlUnitList[controlUnitComponentIndex].lineTerminalId.findIndex(value => value === terminalId);
        console.log("ControlUnit id " + this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] + " has been disconnected from terminal " + terminalId + " and newDesign has been updated.")
        this.newDesign.commLine[lineIdIndex].terminalComponentId[terminalIndex] = "";
        this.newDesign.commLine[lineIdIndex].terminalComponentFeature[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureIndex[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentFeatureId[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessBoolean[terminalIndex] = [];
        this.newDesign.commLine[lineIdIndex].terminalComponentAssetAccessType[terminalIndex] = [];
        // this.newDesign.commLine[lineIdIndex].terminalComponentId.splice(terminalIndex, 1);
        // this.newDesign.commLine[lineIdIndex].terminalComponentFeature.splice(terminalIndex, 1);
        if (terminalInControlUnitIndex > -1) {
          this.controlUnitList[controlUnitComponentIndex].lineTerminalId.splice(terminalInControlUnitIndex, 1);
        }
        // let lineIdInControlUnitIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.controlUnitList[controlUnitComponentIndex].lineId);
        let lineIdInControlUnitIndex = this.controlUnitList[controlUnitComponentIndex].lineId.findIndex(value => value === terminalDragParentId);
        if (lineIdInControlUnitIndex > -1) {
          this.controlUnitList[controlUnitComponentIndex].lineId.splice(lineIdInControlUnitIndex, 1);
        }
        // this.commLinesTerminals = this.commLinesTerminals.filter(terminal => terminal.id !== myEvent.target.id);
        const commLinesTerminalIndex = this.commLinesTerminals.findIndex(terminal => terminal.id === terminalId && terminal.componentId === controlUnitId);
        if (commLinesTerminalIndex > -1) {
          this.commLinesTerminals.splice(commLinesTerminalIndex, 1);
        }
        // this.editDesignShared.updateNewDesignComponents(this.newDesign);
        // console.log("this.commLinesTerminals", this.commLinesTerminals);
      } else { // if the controlUnit has already been disconnected, do nothing
      }
    }
  };
  // Detect module type by the ID of the moving terminal.
  getModuleTypeFromMovingTerminalId(terminalId: any): string {
    let terminalDragParentId = document.getElementById(terminalId).parentElement.id;
    let lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
    let terminalIndex = this.ArrOp.findStringIndexInArray(terminalId, this.lineList[lineIdIndex]?.terminalId);
    let moduleId = this.newDesign.commLine[lineIdIndex]?.terminalComponentId[terminalIndex];
    return this.editDesignShared.getComponentType(moduleId);
  }
  // add or remove a line and terminals to or from a micro
  updateMicroLineAfterMovingLine(myEvent: any): void {
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(myEvent.target.id, "id", this.microList);
    if (!elementWithFocus) return;
    if (terminalSVGFilled != null) { // if line terminal is being dragged
      let terminalDragParentId = elementWithFocus.parentElement.id;
      let lineTerminalIndex = this.ArrOp.findStringIndexInArray(elementWithFocus.id, this.newDesign.micro[componentIndex].lineTerminalId);
      let lineIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.newDesign.micro[componentIndex].lineId);
      // console.log(lineIndex);
      if (terminalSVGFilled && lineIndex == undefined) { // add the line into newDesign if the terminal circle is filled and it's not recorded
        const terminalClassList = Array.prototype.slice.call(document.getElementById(terminalSVGFilled).classList);
        if (terminalClassList.includes("boundaryStartTerminal") || terminalClassList.includes("boundaryEndTerminal")) return;
        this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalSVGFilled, terminalDragParentId);
        this.newDesign.micro[componentIndex].lineTerminalId.push(elementWithFocus.id);
        this.newDesign.micro[componentIndex].lineId.push(terminalDragParentId);
        console.log("Line " + terminalDragParentId + " has been added to micro " + myEvent.target.id + " in newDesign.");
      } else if (terminalSVGFilled && lineIndex != undefined) { // do nothing if terminal is filled and it's already recorded, except maybe a warning
        let lineIndexInLineList = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
        if (lineIndexInLineList != undefined) {
          let lineTerminalIndex = this.newDesign.commLine[lineIndexInLineList].terminalId.indexOf(elementWithFocus.id);
          let lineOtherTerminalIndex = 1 - lineTerminalIndex; // if lineTerminalIndex=0, other index is 1; if lineTerminalIndex=1, other index is 0
          // if the other terminal of the line is connecting to the same component, show snackbar
          if (this.newDesign.commLine[lineIndexInLineList].terminalComponentId[lineOtherTerminalIndex] &&
            (this.newDesign.commLine[lineIndexInLineList].terminalComponentId[lineOtherTerminalIndex] == myEvent.target.id)) {
            // this._snackBar.open("Connecting a microcontroller with itself corrupts these components and will cause further errors. Both the line and the microcontroller must be deleted.", "Warning", {
            //   duration: 10000,
            // });
            this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalSVGFilled, terminalDragParentId);
            this.clearTerminalMicroOrControlUnit()
            this._snackBar.open("Connecting a component to itself is not allowed.", "Warning", {
              duration: 10000,
            });
          }
        }
      } else if (!terminalSVGFilled && lineIndex != undefined) { // remove terminal from newDesign.micro if it's not filled but recorded
        this.newDesign.micro[componentIndex].lineTerminalId.splice(lineTerminalIndex, 1);
        this.newDesign.micro[componentIndex].lineId.splice(lineIndex, 1);
        console.log("Line " + terminalDragParentId + " has been removed from micro " + myEvent.target.id + " in newDesign.");
      }
    }
  };

  // When a line is connected to a module then remove the line from all previously connected modules.
  private disconnectLineFromPreviouslyConnectedModules(micro: any[] = [], controlUnit: any[] = [], terminalSVGFilled: string, terminalDragParentId: string) {
    micro = micro.filter(element => element.lineTerminalId.includes(terminalSVGFilled) && element.lineId.includes(terminalDragParentId));
    if (micro.length > 0) {
      micro.forEach((element: any, index: number) => {
        let lineTerminalIndex = element.lineTerminalId.findIndex((id: string) => id == terminalSVGFilled);
        let lineIndex = element.lineId.findIndex((id: string) => id == terminalDragParentId);
        if (lineTerminalIndex > -1 && lineIndex > -1) {
          element.lineTerminalId.splice(lineTerminalIndex, 1);
          element.lineId.splice(lineIndex, 1);

          const commLinesTerminalIndex = this.commLinesTerminals.findIndex(terminal => terminal.id === terminalSVGFilled && terminal.componentId === element.id);
          if (commLinesTerminalIndex > -1) {
            this.commLinesTerminals.splice(commLinesTerminalIndex, 1);
          }
        }
      });
    }

    controlUnit = controlUnit.filter(element => element.lineTerminalId.includes(terminalSVGFilled) && element.lineId.includes(terminalDragParentId));
    if (controlUnit.length > 0) {
      controlUnit.forEach((element: any, index: number) => {
        let lineTerminalIndex = element.lineTerminalId.findIndex((id: string) => id == terminalSVGFilled);
        let lineIndex = element.lineId.findIndex((id: string) => id == terminalDragParentId);
        if (lineTerminalIndex > -1 && lineIndex > -1) {
          element.lineTerminalId.splice(lineTerminalIndex, 1);
          element.lineId.splice(lineIndex, 1);

          const commLinesTerminalIndex = this.commLinesTerminals.findIndex(terminal => terminal.id === terminalSVGFilled && terminal.componentId === element.id);
          if (commLinesTerminalIndex > -1) {
            this.commLinesTerminals.splice(commLinesTerminalIndex, 1);
          }
        }
      });
    }
  }

  // add or remove a line and terminals to or from a control unit
  updateControlUnitLineAfterMovingLine(myEvent: any): void {
    let componentIndex = this.ArrOp.findStringIndexInArrayProperty(myEvent.target.id, "id", this.controlUnitList);
    if (!elementWithFocus) return;
    if (terminalSVGFilled != null) { // if line terminal is being dragged
      let terminalDragParentId = document.getElementById(terminalSVGFilled).parentElement.id;
      let lineTerminalIndex = this.ArrOp.findStringIndexInArray(terminalSVGFilled, this.newDesign.controlUnit[componentIndex].lineTerminalId);
      let lineIndex = this.ArrOp.findStringIndexInArray(terminalDragParentId, this.newDesign.controlUnit[componentIndex].lineId);
      if (terminalSVGFilled && lineIndex == undefined) { // add the line into newDesign if the terminal circle is filled and it's not recorded
        const terminalClassList = Array.prototype.slice.call(document.getElementById(terminalSVGFilled).classList);
        if (terminalClassList.includes("boundaryStartTerminal") || terminalClassList.includes("boundaryEndTerminal")) return;
        this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalSVGFilled, terminalDragParentId);
        this.newDesign.controlUnit[componentIndex].lineTerminalId.push(terminalSVGFilled);
        this.newDesign.controlUnit[componentIndex].lineId.push(terminalDragParentId);
        console.log("Line " + terminalDragParentId + " has been added to controlUnit " + myEvent.target.id + " in newDesign.");
      } else if (terminalSVGFilled && lineIndex != undefined) { // do nothing if terminal is filled and it's already recorded, except maybe a warning
        let lineIndexInLineList = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
        if (lineIndexInLineList != undefined) {
          let lineTerminalIndex = this.newDesign.commLine[lineIndexInLineList].terminalId.indexOf(elementWithFocus.id);
          let lineOtherTerminalIndex = 1 - lineTerminalIndex; // if lineTerminalIndex=0, other index is 1; if lineTerminalIndex=1, other index is 0
          // if the other terminal of the line is connecting to the same component, show snackbar
          if (this.newDesign.commLine[lineIndexInLineList].terminalComponentId[lineOtherTerminalIndex] &&
            (this.newDesign.commLine[lineIndexInLineList].terminalComponentId[lineOtherTerminalIndex] == myEvent.target.id)) {
            // this._snackBar.open("Connecting a module with itself corrupts these components and will cause further errors. Both the line and the module must be deleted.", "Warning", {
            //   duration: 10000,
            // });
            this.disconnectLineFromPreviouslyConnectedModules(this.newDesign.micro, this.newDesign.controlUnit, terminalSVGFilled, terminalDragParentId);
            this.clearTerminalMicroOrControlUnit();
            this._snackBar.open("Connecting a component to itself is not allowed.", "Warning", {
              duration: 10000,
            });
          }
        }
      } else if (!terminalSVGFilled && lineIndex != undefined) { // remove terminal from newDesign.controlUnit if it's not filled but recorded
        this.newDesign.controlUnit[componentIndex].lineTerminalId.splice(lineTerminalIndex, 1);
        this.newDesign.controlUnit[componentIndex].lineId.splice(lineIndex, 1);
        console.log("Line " + terminalDragParentId + " has been removed from controlUnit " + myEvent.target.id + " in newDesign.");
      }
    }
  };
  // functions to manipulate svg line moves
  enterSVGLine(event: any) {
    this.highlightSVGCommLine(event.target.id);
    // let lineDrag = document.getElementById(event.target.id);
    // let lineGroupDrag = document.getElementById(event.target.id).parentElement;
    // lineGroupDrag.querySelectorAll("circle")[0].setAttribute("stroke", "red");
    // lineGroupDrag.querySelectorAll("circle")[1].setAttribute("stroke", "red");
    // lineDrag.setAttribute("stroke", "red");
    // lineDrag.setAttribute("stroke-width", "10");
    // if (lineDrag.getAttribute("name") == polylineName) {
    //   var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
    //   var index = 0, length = elems.length;
    //   for (; index < length; index++) {
    //     elems[index].style.display = 'block'
    //   }
    // }

    // const lineDragClassList = Array.prototype.slice.call(lineDrag.classList);
    // if (lineDragClassList.includes("boundary")) {
    //   var elems: any = lineGroupDrag.querySelectorAll("circle");
    //   var index = 0, length = elems.length;
    //   for (; index < length; index++) {
    //     elems[index].setAttribute("stroke", "black");
    //     elems[index].style.display = 'block'
    //   }
    // }
  }

  // Highlight component when user enters mouse to threat
  private highlightSVGCommLine(commLineId: string) {
    let lineDrag = document.getElementById(commLineId);
    let lineGroupDrag = document.getElementById(commLineId).parentElement;
    if (lineGroupDrag.querySelectorAll('circle').length == 0) {
      lineGroupDrag.querySelectorAll("rect")[0].setAttribute("stroke", "#3C98CF");
      lineGroupDrag.querySelectorAll("rect")[1].setAttribute("stroke", "#3C98CF");
    } else {
      lineGroupDrag.querySelectorAll("circle")[0].setAttribute("stroke", "#3C98CF");
      lineGroupDrag.querySelectorAll("circle")[1].setAttribute("stroke", "#3C98CF");
    }
    lineDrag.setAttribute("stroke", "#3C98CF");
    lineDrag.setAttribute("stroke-width", "6");
    if (lineDrag.getAttribute("name") == polylineName) {
      var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'block';
        elems[index].setAttribute("stroke", "#3C98CF");
        elems[index].setAttribute("stroke-width", "6");
      }
    }

    const lineDragClassList = Array.prototype.slice.call(lineDrag.classList);
    if (lineDragClassList.includes("boundary")) {
      var elems: any = lineGroupDrag.querySelectorAll("circle");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].setAttribute("stroke", "#3C98CF");
        elems[index].setAttribute("stroke-width", "6");
        elems[index].style.display = 'block'
      }
    }

    var elems: any = lineGroupDrag.querySelectorAll(".lineStartTerminal,.lineEndTerminal");
    var index = 0, length = elems.length;
    for (; index < length; index++) {
      elems[index].setAttribute("stroke-width", "6");
    }
  }

  // Update commLine UI when it is moved over the canvas.
  dropSVGLine(event: any) {
    let lineDrag = document.getElementById(event.target.id);
    lineDrag.setAttribute("stroke-width", "5");
    lineDrag.setAttribute("stroke", "#3C98CF");
    let lineGroupDrag = document.getElementById(event.target.id).parentElement;
    if (lineGroupDrag.querySelectorAll('circle').length == 0) {
      lineGroupDrag.querySelectorAll("rect")[0].setAttribute("stroke", "#3C98CF");
      lineGroupDrag.querySelectorAll("rect")[1].setAttribute("stroke", "#3C98CF");
    } else {
      lineGroupDrag.querySelectorAll("circle")[0].setAttribute("stroke", "#3C98CF");
      lineGroupDrag.querySelectorAll("circle")[1].setAttribute("stroke", "#3C98CF");
    }
    if (lineDrag.getAttribute("name") == polylineName) {
      var elems: any = lineGroupDrag.querySelectorAll(".inlineHandler");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'none'
      }
    }

    var elems: any = lineGroupDrag.querySelectorAll(".lineStartTerminal,.lineEndTerminal");
    var index = 0, length = elems.length;
    for (; index < length; index++) {
      elems[index].setAttribute("stroke-width", "5");
    }
  };
  dropSVGLineBoundary(event: any) {
    let lineDrag = document.getElementById(event.target.id);
    lineDrag.setAttribute("stroke-width", "5");
    lineDrag.setAttribute("stroke", "#3C98CF");
    let lineGroupDrag = document.getElementById(event.target.id).parentElement;
    lineGroupDrag.querySelectorAll("circle")[0].setAttribute("stroke", "#3C98CF");
    lineGroupDrag.querySelectorAll("circle")[1].setAttribute("stroke", "#3C98CF");

    const lineDragClassList = Array.prototype.slice.call(lineDrag.classList);
    if (lineDragClassList.includes("boundary")) {
      var elems: any = lineGroupDrag.querySelectorAll("circle");
      var index = 0, length = elems.length;
      for (; index < length; index++) {
        elems[index].style.display = 'none'
      }
    }
  };
  rightClickOnCanvas(event: any) {
    event.preventDefault();
    if (event.target.id == "svgViewBox") { // onlly work if clicking on the canvas
      // console.log(`right clicked`)
      const dropShadowElements = document.getElementsByClassName("dropShadow");
      if (dropShadowElements.length > 0) {
        this.activeComponentId = "";
        this._compVisual.removeComponentDropShadowById(dropShadowElements[0].id);
        this.editDesignShared.closeSidePanel();
      }
    }
  }
  private previewPropertyPanel() {
    if (this.newDesign.micro.length > 0) {
      this.newDesign.micro.forEach((microItem) => {
        let newComponentDropped = document.getElementById(microItem.id);
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
      });
    };
    if (this.newDesign.controlUnit.length > 0) {
      this.newDesign.controlUnit.forEach((controlUnitItem) => {
        let newComponentDropped = document.getElementById(controlUnitItem.id);
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change adtive id
            this.editDesignShared.openSidePanel();
          }
        }, false);
      });
    };
    if (this.newDesign.boundary.length > 0) {
      this.newDesign.boundary.forEach((boundaryItem) => {
        let newComponentDroppedGroup = document.getElementById(boundaryItem.id);
        let newComponentDropped = newComponentDroppedGroup.children[0];
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == newComponentDroppedGroup.id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newComponentDroppedGroup.id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
      });
    };

    if (this.newDesign.commLine.length > 0) {
      this.newDesign.commLine.forEach((commLineItem: any) => {
        let newComponentDroppedGroup = document.getElementById(commLineItem.id);
        let newComponentDropped = newComponentDroppedGroup.children[0];
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (commLineItem.id)) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = commLineItem.id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
      });
    };
  }

  // Add event listener for module text, relocate the module position when drag and drop via mouse
  private addEventListenerModuleText(module: any) {
    let selectedModule = module;
    switch (module.nodeName) {
      case "rect":
        selectedModule = module.parentElement;
        break;
    }
    const moduleParentContainer: HTMLElement = module.parentElement;
    const moduleText = document.querySelector(`[tabindex="${selectedModule.id}"]`);
    if (moduleText) {
      moduleText.addEventListener("mouseup", (event) => this.endSvgMove(event));
      moduleText.addEventListener("mousedown", (event) => this.mouseDownSvg(event));
      moduleText.addEventListener("mousemove", event => this.mouseMoveSvg(event));
    } else {
      const moduleClassList: DOMTokenList = module.classList;
      if (moduleClassList.contains("micro") || moduleClassList.contains("controlUnit")) {
        const textElement: HTMLElement = moduleParentContainer.querySelector("p");
        this.addTextAboveModule(textElement, module);
      } else if (moduleClassList.contains("boundary")) {
        const boundaryParentContainer: HTMLElement = module.parentElement;
        const boundaryTextElementId: string = boundaryParentContainer.dataset.textId;
        const boundaryTextElement: HTMLElement = document.getElementById(boundaryTextElementId);
        this.addTextAboveModule(boundaryTextElement, module);
      }
    }
  }

  // Add text above a module when it's dragged from component library or relocate for backward compatibility
  private addTextAboveModule(textElement: HTMLElement, module: HTMLElement) {
    const moduleClassList: DOMTokenList = module.classList;

    if (textElement) {
      textElement.remove();
    }

    if (moduleClassList.contains("micro") || moduleClassList.contains("controlUnit")) {
      const scrollX: number = document.getElementById("modelViewContent").scrollLeft;
      const scrollY: number = document.getElementById("modelViewContent").scrollTop;
      const x: number = Number(module.parentElement.parentElement.style.left.replace("px", "")) + 40 - scrollX;
      const y: number = Number(module.parentElement.parentElement.style.top.replace("px", "")) - scrollY;
      const text: string = this.getModuleTextFromDesign(moduleClassList, module);
      this.showModuleText(module.id, text, x, y);
    } else if (moduleClassList.contains("boundary")) {
      const scrollX: number = document.getElementById("modelViewContent").scrollLeft;
      const scrollY: number = document.getElementById("modelViewContent").scrollTop;
      const middlePosition = Number(module.getAttribute("width")) / 2;
      const x: number = Number(module.getAttribute("x")) + middlePosition - scrollX;
      const y: number = Number(module.getAttribute("y")) - scrollY;
      const text: string = this.newDesign.boundary.find((boundary: any) => boundary.id === module.parentElement.id).nickName;
      this.showModuleText(module.parentElement.id, text, x, y);
    }
  }

  // Get module text from newDesign object
  private getModuleTextFromDesign(moduleClassList: DOMTokenList, module: HTMLElement) {
    if (moduleClassList.contains("micro")) {
      return this.newDesign.micro.find((boundary: any) => boundary.id === module.id).nickName;
    } else if (moduleClassList.contains("controlUnit")) {
      return this.newDesign.controlUnit.find((boundary: any) => boundary.id === module.id).nickName;
    }
  }

  // Disable focusing SVG elements when cursor is outside of SVG.
  private disableFocusingSVGElementsAtOutside() {
    document.addEventListener("mousemove", event => {
      if (mouseDownFlag) {
        const innerWidth: number = document.body.clientWidth;
        const innerHeight: number = document.body.clientHeight;
        let adjustInnerWidth: number = innerWidth - PAGE_SCROLLBAR_SPACE.X;
        let adjustInnerHeight: number = innerHeight - PAGE_SCROLLBAR_SPACE.Y;
        // Subtract property panel width if it is opened.
        if (this.sidePanelOpened) {
          const sidePanelWidth: number = document.getElementById("modelingViewSidenav").clientWidth;
          adjustInnerWidth = adjustInnerWidth - sidePanelWidth;
        }
        // Restrict the mouse cursor left botton strictness if it extends the left/top/right/bottom edge.
        if (event.clientX <= this.minSidebarNavbarSpace.X || event.clientX > adjustInnerWidth || event.clientY <= this.minSidebarNavbarSpace.Y || event.clientY > adjustInnerHeight) {
          this.disconnectDetachedTerminalAndModule(elementWithFocus.id); // Disconnect a connected terminal from a module if it is dragged outside of the canvas.
          mouseDownFlag = !mouseDownFlag;
          elementWithFocus = null;
          terminalSVGFilled = null;
        }
      }
    });
  }

  // When a user drags a commLine and hovers over the module then connect the commLine with the module.
  private connectOverlappedCommLineWithModule() {
    if (elementWithFocus && elementWithFocus.classList.contains("commLine")) {
      let detectedModulesAndTerminals: any[] = this.detectModulesToConnectWithCommLine(elementWithFocus.id);
      if (detectedModulesAndTerminals.length > 0) {
        let previousModuleId: string = null;
        detectedModulesAndTerminals.forEach(detectedModuleAndTerminal => {
          if (previousModuleId != detectedModuleAndTerminal.module.id) { // Don't allow user to connect the both starting and ending terminals with same module.
            previousModuleId = detectedModuleAndTerminal.module.id;
            this.connectTerminalIntersectionCoordinateWithModule(detectedModuleAndTerminal.module, detectedModuleAndTerminal.terminal);
          }
        });
      }
      elementWithFocus = null;
    }
  }

  // Disconnect a terminal that is dragged outside of the canvas.
  private disconnectDetachedTerminalAndModule(terminalId: string): void {
    const connectedTerminal: any = this.commLinesTerminals.find((commLineTerminal: any) => commLineTerminal.id === terminalId);
    if (connectedTerminal) {
      const moduleType: string = this.getModuleTypeFromMovingTerminalId(terminalId);
      switch (moduleType) {
        case "micro":
          this.disconnectTerminalAndMicro(terminalId);
          break;
        case "controlUnit":
          this.disconnectTerminalAndControlUnit(terminalId);
          break;
      }
      this.clearCommLinesTerminals([terminalId]);
    }
  }

  // Add event listener's for already saved HTML modeling view
  recoverEventListeners() {
    let svgElement = document.getElementById("svgViewBox");
    if (svgElement) {
      svgElement.addEventListener("mousemove", event => this.mouseMoveSvg(event));
      svgElement.addEventListener("mouseup", event => this.endSvgMove(event));
      svgElement.addEventListener("mouseout", event => this.endSvgMove(event));
    }

    this.disableFocusingSVGElementsAtOutside();

    if (this.newDesign.micro.length > 0) {
      this.newDesign.micro.forEach((microItem) => {
        let newComponentDropped = document.getElementById(microItem.id);
        newComponentDropped.addEventListener("mouseup", (event) => {
          if (event.button == 0) { // trigger only when left button is up
            this.connectOverlappedCommLineWithModule();
            this.addMicroOrControlUnitToLineComponent(event);
            this.updateMicroLineAfterMovingLine(event);
            this.dropSvgTerminalAtImg(event);
          }
        });
        newComponentDropped.addEventListener("mouseenter", (event) => this.moveSvgTerminalIntoImg(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.moveSvgTerminalOutOfImg(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);

        this.addEventListenerModuleText(newComponentDropped);
      });
    };
    if (this.newDesign.controlUnit.length > 0) {
      this.newDesign.controlUnit.forEach((controlUnitItem) => {
        let newComponentDropped = document.getElementById(controlUnitItem.id);
        newComponentDropped.addEventListener("mouseup", (event) => {
          if (event.button == 0) { // trigger only when left button is up
            this.connectOverlappedCommLineWithModule();
            this.addMicroOrControlUnitToLineComponent(event);
            this.updateControlUnitLineAfterMovingLine(event);
            this.dropSvgTerminalAtImg(event);
          }
        });
        newComponentDropped.addEventListener("mouseenter", (event) => this.moveSvgTerminalIntoImg(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.moveSvgTerminalOutOfImg(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (<HTMLImageElement>event.target).id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = (<HTMLImageElement>event.target).id; // change adtive id
            this.editDesignShared.openSidePanel();
          }
        }, false);

        this.addEventListenerModuleText(newComponentDropped);
      });
    };
    if (this.newDesign.boundary.length > 0) {
      this.newDesign.boundary.forEach((boundaryItem) => {
        let newComponentDroppedGroup = document.getElementById(boundaryItem.id);
        let newComponentDropped = newComponentDroppedGroup.children[0];
        let newComponentStartHandlerDropped = newComponentDroppedGroup.children[1];
        let newComponentEndHandlerDropped = newComponentDroppedGroup.children[2];
        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseleave", this.dropSVGLineBoundary);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == newComponentDroppedGroup.id) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = newComponentDroppedGroup.id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
        newComponentStartHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentStartHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentStartHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentEndHandlerDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentEndHandlerDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentEndHandlerDropped.addEventListener("mouseenter", this.enterSvgTerminal);

        this.addEventListenerModuleText(newComponentDropped);
      });
    };

    if (this.newDesign.commLine.length > 0) {
      this.newDesign.commLine.forEach((commLineItem: any) => {
        let newComponentDroppedGroup = document.getElementById(commLineItem.id);
        let newComponentDropped = newComponentDroppedGroup.children[0];
        let newComponentHandlerStartDropped = newComponentDroppedGroup.children[1];
        let newComponentHandlerEndDropped = newComponentDroppedGroup.children[2];
        let newComponentFirstInlineHandler = newComponentDroppedGroup.children[3]
        if (newComponentFirstInlineHandler) {
          newComponentFirstInlineHandler.addEventListener("mousedown", this.mouseDownSvg);
          newComponentFirstInlineHandler.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
          newComponentFirstInlineHandler.addEventListener("mouseenter", this.enterSvgTerminal);
        }

        let newComponentSecondInlineHandler = newComponentDroppedGroup.children[4]
        if (newComponentSecondInlineHandler) {
          newComponentSecondInlineHandler.addEventListener("mousedown", this.mouseDownSvg);
          newComponentSecondInlineHandler.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
          newComponentSecondInlineHandler.addEventListener("mouseenter", this.enterSvgTerminal);
        }

        newComponentDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentDropped.addEventListener("mouseenter", (event) => this.enterSVGLine(event));
        newComponentDropped.addEventListener("mouseleave", (event) => this.dropSVGLine(event));
        newComponentDropped.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (this.activeComponentId == (commLineItem.id)) {
            this.activeComponentId = ""; // clear active id if side panel is closed
            this.editDesignShared.closeSidePanel();
          } else {
            this.activeComponentId = commLineItem.id; // change active id
            this.editDesignShared.openSidePanel();
          }
        }, false);
        newComponentHandlerStartDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerStartDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerStartDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        newComponentHandlerEndDropped.addEventListener("mousedown", this.mouseDownSvg);
        newComponentHandlerEndDropped.addEventListener("mouseleave", this.mouseLeaveSvgTerminal);
        newComponentHandlerEndDropped.addEventListener("mouseenter", this.enterSvgTerminal);
        if (newComponentDroppedGroup.getElementsByTagName('polyline').length > 0) {
          var elems: any = newComponentDroppedGroup.querySelectorAll(".inlineHandler");
          var index = 0, length = elems.length;
          for (; index < length; index++) {
            elems[index].style.display = 'none'
          }
        }
        if (commLineItem.textProtocolDisplay) {
          this.addEventListenerToProtocolText(commLineItem.id);
        }
      });
    };

    this.fillModulesBorder();
  };

  // Implemented backward compatibility for new modeling UI - added border around a module if it is absent
  private fillModulesBorder() {
    const modules: NodeList = document.querySelectorAll(".micro,.controlUnit");
    Array.from(modules).forEach((element: HTMLElement) => {
      if (element.style.border === "none") {
        element.style.border = "3.5px solid #3C98CF";
      }
    });
  }

  // Event listener for commLine protocol text when the 'svg' text is dragged & dropped via mouse
  private addEventListenerToProtocolText(commLineId: string) {
    const commLineProtocolsText = document.querySelector(`[tabindex="${commLineId}"]`);
    if (commLineProtocolsText) {
      commLineProtocolsText.addEventListener("mouseup", (event) => this.endSvgMove(event));
      commLineProtocolsText.addEventListener("mousedown", (event) => this.mouseDownSvg(event));
    }
  }

  showNewDesign() {
    console.log(this.newDesign);
  }

  // CTRL + S
  @HostListener('window:keydown', ['$event'])
  onKeyPress($event: KeyboardEvent) {
    if (!(this.editDesignShared.projectStatus?.milestoneView)) {
      let charCode = String.fromCharCode($event.which).toLowerCase();
      if (($event.ctrlKey || $event.metaKey) && charCode === 's') {
        $event.preventDefault();
        this._confirmDialogService.emitSaveProjectEvent();
      }
    }
  }

  //Remove commline terminals from the array when a commline is removed
  clearCommLinesTerminals($event: any[] = []) {
    this.commLinesTerminals = this.commLinesTerminals.filter(ar => !$event.find(rm => (rm === ar.id)))
  }


  //Clear terminal fill on self connected component
  clearTerminalMicroOrControlUnit() {
    const terminalDragParent = document.getElementById(terminalSVGFilled).parentElement;
    const terminalDragParentId = terminalDragParent.id;
    const lineIdIndex = this.ArrOp.findStringIndexInArrayProperty(terminalDragParentId, "id", this.lineList);
    const terminalIndex = this.ArrOp.findStringIndexInArray(terminalSVGFilled, this.lineList[lineIdIndex].terminalId); // lineStartTerminal is 0, lineEndTerminal is 1
    this.lineList[lineIdIndex].terminalComponentId[terminalIndex] = ""
    let terminalsArray = terminalDragParent.querySelectorAll("circle");
    terminalsArray[terminalIndex].setAttribute("fill", "white");
    terminalSVGFilled = null;
  }
}