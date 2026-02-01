import { ArrOpService } from './arr-op.service';
import { ComponentList } from './../../threatmodel/ItemDefinition';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComponentVisualChangeService {
  private _newDesignHtml: BehaviorSubject<string> = new BehaviorSubject<string>(localStorage.getItem("newDesign") && localStorage.getItem("newDesignHtml") ? localStorage.getItem("newDesignHtml") : "");
  private _newDesignHtmlUpdated: BehaviorSubject<string> = new BehaviorSubject<string>("default");

  public addToDesignHtml$ = this._newDesignHtml.asObservable();
  public designHtmlUpdated$ = this._newDesignHtmlUpdated.asObservable();

  constructor(private _ArrOp: ArrOpService) { }

  public updateModelingViewDesign(html: string) {
    this._newDesignHtml.next(html);
  }

  componentBorderHighlightById(id: string) {
    if (id) {
      let targetComponent = document.getElementById(id);
      targetComponent.style.border = "solid brown";
    } else { }
  }
  removeComponentBorderHighlightById(id: string) {
    if (id) {
      let targetComponent = document.getElementById(id);
      targetComponent.style.border = "none";
    } else { }
  }
  componentDropShadowById(id: string) {
    if (id) {
      let targetComponent = document.getElementById(id);
      // targetComponent.style.filter = "drop-shadow(10px 10px 10px pink)";
      // targetComponent.style.backgroundColor = "#F0E686";
      targetComponent.style.filter = "url(#shadow)";
      targetComponent.classList.add("dropShadow");
    } else { }
  }
  removeComponentDropShadowById(id: string) {
    if (id) {
      let targetComponent = document.getElementById(id);
      targetComponent.style.filter = "none";
      targetComponent.style.backgroundColor = "transparent";
      targetComponent.classList.remove("dropShadow");
    } else { }
  }
  removeComponentById(id: string, newDesign: ComponentList) {
    if (id) {
      let indexMicro = this._ArrOp.findStringIndexInArrayProperty(id, "id", newDesign.micro);
      let indexControlUnit = this._ArrOp.findStringIndexInArrayProperty(id, "id", newDesign.controlUnit);
      if (indexMicro !== undefined) {// if it's a micro or a control unit, check to remove line terminal fill
        for (let i = 0; i < newDesign.micro[indexMicro].lineTerminalId.length; i++) {
          if (document.getElementById(newDesign.micro[indexMicro].lineTerminalId[i])) { // in case the commLine was already removed incorrectly
            document.getElementById(newDesign.micro[indexMicro].lineTerminalId[i]).setAttribute("fill", "white");
          }
          // console.log(newDesign.micro[indexMicro].lineTerminalId[i] + "fill changed to none")
        }
      } else if (indexControlUnit !== undefined) {
        for (let i = 0; i < newDesign.controlUnit[indexControlUnit].lineTerminalId.length; i++) {
          if (document.getElementById(newDesign.controlUnit[indexControlUnit].lineTerminalId[i])) { // in case the commLine was already removed incorrectly
            document.getElementById(newDesign.controlUnit[indexControlUnit].lineTerminalId[i]).setAttribute("fill", "white");
          }
        }
      }
      const element = document.getElementById(id);
      const elementClassList = Array.prototype.slice.call(element.classList);
      const movedComponentParent = element.parentElement;
      if (movedComponentParent.id !== "drawingCanvas" && (elementClassList.includes("micro") || elementClassList.includes("controlUnit"))) {
        element.parentElement.parentElement.remove();
        const moduleText = document.querySelector(`[tabindex="${id}"]`);
        if (moduleText) {
          moduleText.remove();
        }
      } else {
        if (element.dataset.textId) {
          const moduleText = document.getElementById(element.dataset.textId);
          if(moduleText){
            moduleText.remove();
          }
        }
        const moduleText = document.querySelector(`[tabindex="${id}"]`);
        if (moduleText) {
          moduleText.remove();
        }
        element.remove();
      }
      // console.log(`Component ${id} has been removed from DOM.`);
    } else { }
  }
  loadNewDesignHtml() {
    document.getElementById("drawingCanvas").innerHTML = localStorage.getItem("newDesignHtml");

  };

  public updateVisualDesign(flag: string) {
    this._newDesignHtmlUpdated.next(flag);
  }
  // holdSVGLine(event: any): string {
  //   let lineDrag = document.getElementById(event.target.id);
  //   lineDrag.setAttribute("stroke-width", "15");
  //   return event.target.id;
  // };
}
