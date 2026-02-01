import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ArrOpService {

  // Get component by id from both micro and controlUnit list if matched.
  getComponentById(id: string, moduleArray: any[]) {
    const module: any = moduleArray.find(module => module.id == id);
    if (module) return module;
  }

  findStringIndexInArrayProperty(myValue, myProperty, myArray): number {
    if (myArray?.length) {
      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][myProperty] === myValue) {
          return i;
        }
      };
    } else {
      // console.error("Length of the array is undefined");
      return undefined;
    }
  }
  findStringIndexInArray(myValue, myArray): number {
    if (myArray?.length) {
      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i] === myValue) {
          return i;
        }
      };
    } else {
      // console.error("Length of the array is undefined");
      return undefined;
    }
  }
  // the difference between the following and findStringIndexInArrayProperty is
  // 1) the property is array type
  // 2) the returned value is array type
  findStringIndexInArrayPropertyArray(myValue, myProperty, myArray): any {
    let returnArray = [];
    if (myArray.length) {
      for (let i = 0; i < myArray.length; i++) {
        if (myArray[i][myProperty].includes(myValue)) {
          returnArray.push(i);
        }
      };
      return returnArray
    } else {
      // console.error("Length of the array is undefined");
      return undefined;
    }
  }
  // random ID generator for newly created components
  genRandomId(length: number): string {
    let charPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfId = length;
    let text = "";
    for (let i = 0; i < lengthOfId; i++) {
      text += charPool.charAt(Math.floor(Math.random() * charPool.length));
    };
    return text;
  };

  constructor() { }

  // convert the raw array from a GET request to an object of arrays, with...
  // ...each property having an array. The properties of the new object are defined.
  // if a new property is desired, use the newProp to create the new property, and ...
  // ... newPropValue to populate the value (same value for each entry)
  reformLibArrayIntoObjOfArraysDefinedProp(resArray, objKeys, newProp?, newPropValue?, newProp2?, newPropValue2?): any {
    let outputObj = {};
    let properties = objKeys;
    for (let i = 0; i < properties.length; i++) {
      Object.defineProperty(outputObj, properties[i], {
        value: [],
        enumerable: true,
      });
      for (let ind = 0; ind < resArray.length; ind++) {
        if (resArray[ind][properties[i]]) { // if the property exist on the ith element, push the
          outputObj[properties[i]].push(resArray[ind][properties[i]]);
        } else { // if the property doesn't exist on the ith element, push an empty string
          outputObj[properties[i]].push("");
        }
      }
    };
    if (newProp) { // add new property, if applicable
      if (objKeys.includes(newProp)) { // if the new property already exists, populate the value
        for (let ind = 0; ind < resArray.length; ind++) {
          outputObj[newProp][ind] = newPropValue;
        };
      } else {
        Object.defineProperty(outputObj, newProp, {
          value: [],
          enumerable: true,
        });
        for (let ind = 0; ind < resArray.length; ind++) {
          outputObj[newProp].push(newPropValue);
        };
      }
      if (newProp2) { // add another new property, if applicable
        if (objKeys.includes(newProp2)) { // if the new property already exists, populate the value
          for (let ind = 0; ind < resArray.length; ind++) {
            outputObj[newProp2][ind] = newPropValue2;
          };
        } else {
          Object.defineProperty(outputObj, newProp2, {
            value: [],
            enumerable: true,
          });
          for (let ind = 0; ind < resArray.length; ind++) {
            outputObj[newProp2].push(newPropValue2);
          }
        }
      }
    }
    return outputObj
  }

  // convert the raw array from a GET request to an object of arrays, with...
  // ...each property having an array. The properties of the new object are not defined.
  reformLibArrayIntoObjOfArrays(resArray): any {
    let outputObj = {};
    let properties = Object.keys(resArray[0]);
    for (let i = 0; i < properties.length; i++) {
      Object.defineProperty(outputObj, properties[i], {
        value: []
      })
      for (let ind = 0; ind < resArray.length; ind++) {
        if (resArray[ind][properties[i]]) { // if the property exist on the ith element, push the
          outputObj[properties[i]].push(resArray[ind][properties[i]]);
        } else { // if the property doesn't exist on the ith element, push an empty string
          outputObj[properties[i]].push("");
        }
      }
    };
    return outputObj
  }

  // count how many times an element is stored in an array
  countOccurrence(inputArray: [], inputElement: any): number {
    let output = 0;
    for (let i = 0; i < inputArray.length; i++) {
      if (inputArray[i] == inputElement) output++
    }
    return output
  }

}
