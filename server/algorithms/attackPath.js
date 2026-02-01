const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");

// this function checks if the asset needs to be analyzed
// this function also returns the assetAccessType as the second element in the array returned
function assetCheck(projectById, attackPath, componentUnderAttack, asset, assetIndexInAssetIdArray, assetType) {
    if (attackPath.length == 2 && projectById[attackPath[0]].type == "commLine") { // if the attack is initiated from a commLine, check features
        let componentIndex = projectById[attackPath[0]].terminalComponentId.findIndex( id => id == componentUnderAttack);
        let terminalComponentFeatureArray = projectById[attackPath[0]].terminalComponentFeature[componentIndex]; // carried feature set
        let terminalComponentFeatureIndexArray = projectById[attackPath[0]].terminalComponentFeatureIndex[componentIndex]; // carried feature set
        if (terminalComponentFeatureArray== undefined) { // if the commLine doesn't carry any feature, no need to analyze this asset
            return [false, null]
        } else {
            let featureIndex = projectById[componentUnderAttack].assetFeatureIndex[assetIndexInAssetIdArray]; // feature index used to identify if commLine carries it
            // this following if statement is for backward compatibility, and should be deleted later
            if (projectById[attackPath[0]].terminalComponentAssetAccessBoolean[componentIndex]) { // if assets are individually specified, or in new projects
                let assetBoolean = projectById[attackPath[0]].terminalComponentAssetAccessBoolean[componentIndex][assetIndexInAssetIdArray]; // boolean indicates whether the asset is carried on this commLine
                if (terminalComponentFeatureIndexArray.includes(featureIndex) && assetBoolean) {// if the feature and the asset are carried, the asset should be analyzed
                    // have to use a function rather than a one-liner because we have to deal with old projects which don't have the terminalComponentAssetAccessType property
                    let assetAccessType = getAssetAccessType(projectById, attackPath, 0, componentIndex, assetIndexInAssetIdArray, assetType);
                    return [true, assetAccessType]
                } else {
                    return [false, null]
                }
            } else { // for existing project, all assets in a feature are checked by default
                if (terminalComponentFeatureIndexArray.includes(featureIndex)) {// if the feature is carried, the asset should be analyzed
                    // have to use a function rather than a one-liner because we have to deal with old projects which don't have the terminalComponentAssetAccessType property
                    let assetAccessType = getAssetAccessType(projectById, attackPath, 0, componentIndex, assetIndexInAssetIdArray, assetType);
                    return [true, assetAccessType]
                } else {
                    return [false, null]
                }
            }
        }
    } else if (attackPath.length == 2 && projectById[attackPath[1]].type == "commLine") { // if the attack is initiated from a module/micro to a commLine, check features
        let componentIndex = projectById[attackPath[1]].terminalComponentId.findIndex( id => id == componentUnderAttack);
        // let terminalComponentFeatureArray = projectById[attackPath[1]].terminalComponentFeature[componentIndex]; // carried feature set
        // let terminalComponentFeatureIndexArray = projectById[attackPath[1]].terminalComponentFeatureIndex[componentIndex]; // carried feature set
        if (!componentIndex) { // as long as the commLine is connected to the component, analyze this asset
            // console.log(`componentIndex is ${componentIndex}`)
            return [false, null]
        } else {
            return [true, ""] // bandwidth type of asset doesn't have access type assigned
        }
    } else if (attackPath.length == 1) { // if the attack is initiated from the component itself, always return true
        // because asset type is unknown, we include all possible access type here according to the asset type
        returnTrueAndAccessTypeByAssetType(assetType);
    } else if (attackPath.length == 3) { // if the attack path has 3 components, it will be a commLine and two module/micro components
        // console.log(`attackPath is ${attackPath}`)
        commLineId = attackPath.find( id => projectById[id].type == "commLine"); // extract the commLine. disregard the module
        let componentIndex = projectById[commLineId].terminalComponentId.findIndex( id => id == componentUnderAttack);
        let terminalComponentFeatureArray = projectById[commLineId].terminalComponentFeature[componentIndex]; // carried feature set
        let terminalComponentFeatureIndexArray = projectById[commLineId].terminalComponentFeatureIndex[componentIndex]; // carried feature set
        if (terminalComponentFeatureArray== undefined) { // if the commLine doesn't carry any feature, no need to analyze this asset
            return [false, null]
        } else {
            let featureIndex = projectById[componentUnderAttack].assetFeatureIndex[assetIndexInAssetIdArray]; // feature index used to identify if commLine carries it
            // this following if statement is for backward compatibility, and should be deleted later
            // the reason for attackPath[1] is that in such a chain, the commLine must be the second element in the path
            if (projectById[attackPath[1]].terminalComponentAssetAccessBoolean && projectById[attackPath[1]].terminalComponentAssetAccessBoolean[componentIndex]) { // if assets are individually specified, or in new projects
                let assetBoolean = projectById[attackPath[1]].terminalComponentAssetAccessBoolean[componentIndex][assetIndexInAssetIdArray]; // boolean indicates whether the asset is carried on this commLine
                if (terminalComponentFeatureIndexArray.includes(featureIndex) && assetBoolean) {// if the feature and asset are carried, the asset should be analyzed
                // have to use a function rather than a one-liner because we have to deal with old projects which don't have the terminalComponentAssetAccessType property
                let assetAccessType = getAssetAccessType(projectById, attackPath, 1, componentIndex, assetIndexInAssetIdArray, assetType);
                return [true, assetAccessType]
                } else {
                    return [false, null]
                }
            } else { // for old projects, all assets in a feature are checked by default
                if (terminalComponentFeatureIndexArray.includes(featureIndex)) {// if the feature is carried, the asset should be analyzed
                    returnTrueAndAccessTypeByAssetType(assetType)
                } else {
                    return [false, null]
                }
            }
        }
    } else if (attackPath.length>3) { // currently (9/23/2021) this is only available to feature chain threat that is originated from a commLine, because feature chain started from micro/controlUnit doesn't use this assetCheck function
        // in this case, we only consider whether the asset is accessible from the starting commLine, and ignore whether that asset is accessible in other commLines along the chain
        if (projectById[attackPath[0]].type == "commLine") {
            let componentIndex = projectById[attackPath[0]].terminalComponentId.findIndex( id => id == componentUnderAttack);
            let terminalComponentFeatureArray = projectById[attackPath[0]].terminalComponentFeature[componentIndex]; // carried feature set
            let terminalComponentFeatureIndexArray = projectById[attackPath[0]].terminalComponentFeatureIndex[componentIndex]; // carried feature set
            if (terminalComponentFeatureArray== undefined) { // if the commLine doesn't carry any feature, no need to analyze this asset
                return [false, null]
            } else {
                let featureIndex = projectById[componentUnderAttack].assetFeatureIndex[assetIndexInAssetIdArray]; // feature index used to identify if commLine carries it
                // this following if statement is for backward compatibility, and should be deleted later
                if (projectById[attackPath[0]].terminalComponentAssetAccessBoolean[componentIndex]) { // if assets are individually specified, or in new projects
                    let assetBoolean = projectById[attackPath[0]].terminalComponentAssetAccessBoolean[componentIndex][assetIndexInAssetIdArray]; // boolean indicates whether the asset is carried on this commLine
                    if (terminalComponentFeatureIndexArray.includes(featureIndex) && assetBoolean) {// if the feature and the asset are carried, the asset should be analyzed
                        // have to use a function rather than a one-liner because we have to deal with old projects which don't have the terminalComponentAssetAccessType property
                        let assetAccessType = getAssetAccessType(projectById, attackPath, 0, componentIndex, assetIndexInAssetIdArray, assetType);
                        return [true, assetAccessType]
                    } else {
                        return [false, null]
                    }
                } else { // for old projects, all assets in a feature are checked by default
                    if (terminalComponentFeatureIndexArray.includes(featureIndex)) {// if the feature is carried, the asset should be analyzed
                        returnTrueAndAccessTypeByAssetType(assetType)
                    } else {
                        return [false, null]
                    }
                }
            }
        } else {
            console.log(`AssetCheck function is checking a feature chain that's initiated from a non-commLine component, which is not supported by the function.`);
            return [false, null]
        }
    } else {
        // console.log("Error: attackPath length is longer than 3. Update attackPath.js!")
        console.log(`AssetCheck function has some issues. For componentUnderAttack ${componentUnderAttack}, assetIndexInAssetIdArray ${assetIndexInAssetIdArray}, attackPath is ${attackPath}`)
        return [false, null]
    }
}
module.exports.assetCheck = assetCheck;

// for an asset that is accessible by all access types, use this function to generate the assetCheck array 
function returnTrueAndAccessTypeByAssetType(assetType) {
    switch (assetType) {
        case "dataAtRest":
            return [true, "CRUD"]
        case "dataInTransit":
            return [true, "SRec"]
        default:
            return [true, ""]
    }
}
module.exports.returnTrueAndAccessTypeByAssetType = returnTrueAndAccessTypeByAssetType;

// we need this condition because commLines in old projects do not have the terminalComponentAssetAccessType property (Oct 7th, 2022)
// This function can be removed in the future once all projects are updated
function getAssetAccessType(projectById, attackPath, attackPathIndex, componentIndex, assetIndexInAssetIdArray, assetType) {
    if (projectById[attackPath[attackPathIndex]].terminalComponentAssetAccessType) {
        return projectById[attackPath[attackPathIndex]].terminalComponentAssetAccessType[componentIndex][assetIndexInAssetIdArray] // CRUD, Send/Receive
    } else {
        let assetCheck = returnTrueAndAccessTypeByAssetType(assetType);
        return assetCheck[1]
    }
}
module.exports.getAssetAccessType = getAssetAccessType;

function assembleAttackPathDescription(assetThreatMatrix, currentComponent, assetArray, index, attackPathVarArray, projectById, attackSurfaceTransmissionMedia, stride, assetSubType,
        attackSurfaceSensorInput) {
    let attackPathNameVar = [];
    switch (assetThreatMatrix[currentComponent][assetArray[index]].assetType) {
        // For dataInTransit asset, the language should read like the asset is held in the commLine rather than in the micro or controlUnit,
        // even though it's really in the micro or controlUnit.
        case "dataInTransit":
            /* scenario 1 - if attack is initiated on the same component that's being attacked. This is only possible if the component is micro or controlUnit. */
            if (attackPathVarArray[index].length == 1) {
                switch (stride) {
                    case "s":
                        attackPathNameVar.push("The compromised " + projectById[attackPathVarArray[index][0]].nickName + " sends out the " +
                        assetThreatMatrix[currentComponent][assetArray[index]].asset + " at a particular time the attacker determines.");
                        break;
                    case "t":
                        attackPathNameVar.push("The compromised " + projectById[attackPathVarArray[index][0]].nickName + " sends out maliciously modified " +
                        assetThreatMatrix[currentComponent][assetArray[index]].asset + ".");
                        break;
                    case "i":
                        attackPathNameVar.push("Once the " + projectById[attackPathVarArray[index][0]].nickName + " is compromised, the attacker can read the " +
                        dataInTransit1AssetSubType(assetSubType) + assetThreatMatrix[currentComponent][assetArray[index]].asset + " at its source.");
                        break;
                    default:
                        attackPathNameVar.push("This attack assumes " + projectById[attackPathVarArray[index][0]].nickName + " is fully compromised. Compromising the " +
                        assetThreatMatrix[currentComponent][assetArray[index]].asset + " from its source may affect all components transmitting and receiving it.");
                }
            } else { // if the attack is initiated from a different component
                if (projectById[attackPathVarArray[index][0]].type == "commLine" && attackSurfaceSensorInput) {
                    /* scenario 2 - attack started from sensor input, and reaches micro or controlUnit (or any other component).
                    in this scenario, no matter how many items are in the path, the attackPathName only describes the attack in the starting commLine, and then list the path.*/
                    switch (stride) {
                        case "s":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker manipulates the source/measurand of the sensor to spoof the " + 
                                    assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                    " to achieve the goal of spoofing the " + projectById[attackPathVarArray[index][0]].nickName + ". The attack path starts from " + 
                                    projectById[attackPathVarArray[index][0]].nickName + ",");                                
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "t":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker modifies the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                    " while the data is in transmission before received by the " + projectById[attackPathVarArray[index][1]].nickName + ". The attack path starts from " 
                                    + projectById[attackPathVarArray[index][0]].nickName + ",");                           
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        default:
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker compromises the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + 
                                    " either from the source/measurand or while it is transmitting on the " + projectById[attackPathVarArray[index][0]].nickName 
                                    + ". The attack path starts from " 
                                    + projectById[attackPathVarArray[index][0]].nickName + ",");                           
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                }
                            });
                    }
                } else if (projectById[attackPathVarArray[index][0]].type == "commLine") {
                    /* scenario 3 - attack started from commLine, and reaches micro or controlUnit (or any other component).
                    in this scenario, no matter how many items are in the path, the attackPathName only describes the attack in the starting commLine, and then conditionally list the path. */
                    switch (stride) {
                        case "s":
                            // if attacking a dataInTransit asset directly from a component (no feature chain), don't list the path, because the attack doesn't go back to the sender
                            if (attackPathVarArray[index].length < 3) {
                                attackPathNameVar.push("The attacker injects the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                " into the " + projectById[attackPathVarArray[index][0]].nickName + " at a particular time the attacker determines.");
                            } else {
                                // if attacking a dataInTransit asset in a feature chain, skip the sender when describing the path
                                attackPathVarArray[index].forEach((id, ind) => {
                                    if (ind==0) {
                                        attackPathNameVar.push("The attacker injects the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                        " into the " + projectById[attackPathVarArray[index][0]].nickName + " at a particular time the attacker determines."
                                        + " The attack path starts from " 
                                        + projectById[attackPathVarArray[index][0]].nickName + ",");                           
                                    } else if (ind == 1 || ind == 2) {
                                        // intentionally remove the sender of this dataInTransit asset, and the duplicate commLine, from the attack path description                           
                                    } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                        attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                    } else { // if it's the intermediate component
                                        attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                    }
                                });
                            }
                            break;
                        case "t":
                            // if attacking a dataInTransit asset directly from a component (no feature chain), don't list the path, because the attack doesn't go back to the sender
                            if (attackPathVarArray[index].length < 3) {
                                attackPathNameVar.push("The attacker modifies the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                " at the " + projectById[attackPathVarArray[index][0]].nickName + " with " + dataInTransit2AssetSubType(assetSubType));    
                            } else {
                                // if attacking a dataInTransit asset in a feature chain, skip the sender when describing the path
                                attackPathVarArray[index].forEach((id, ind) => {
                                    if (ind==0) {
                                        attackPathNameVar.push("The attacker modifies the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                        " at the " + projectById[attackPathVarArray[index][0]].nickName + " with " + dataInTransit2AssetSubType(assetSubType)
                                        + " The attack path starts from " 
                                        + projectById[attackPathVarArray[index][0]].nickName + ",");
                                    } else if (ind == 1 || ind == 2) {
                                        // intentionally remove the sender of this dataInTransit asset, and the duplicate commLine, from the attack path description                           
                                    } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                        attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                    } else { // if it's the intermediate component
                                        attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                    }
                                });
                            }
                            break;
                        case "i":
                            // if attacking a dataInTransit asset directly from a component (no feature chain), don't list the path, because the attack doesn't go back to the sender
                            if (attackPathVarArray[index].length < 3) {
                                attackPathNameVar.push("The attacker reads the " + dataInTransit1AssetSubType(assetSubType) + 
                                assetThreatMatrix[currentComponent][assetArray[index]].asset
                                + " while transmitting on the " + projectById[attackPathVarArray[index][0]].nickName + "."); 
                            } else {
                                // if attacking a dataInTransit asset in a feature chain, skip the sender when describing the path
                                attackPathVarArray[index].forEach((id, ind) => {
                                    if (ind==0) {
                                        attackPathNameVar.push("The attacker reads the " + dataInTransit1AssetSubType(assetSubType) + 
                                        assetThreatMatrix[currentComponent][assetArray[index]].asset
                                        + " while transmitting on the " + projectById[attackPathVarArray[index][0]].nickName
                                        + ". The attack path starts from " 
                                        + projectById[attackPathVarArray[index][0]].nickName + ",");
                                    } else if (ind == 1 || ind == 2) {
                                        // intentionally remove the sender of this dataInTransit asset, and the duplicate commLine, from the attack path description                           
                                    } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                        attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                    } else { // if it's the intermediate component
                                        attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                    }
                                });
                            }
                            break;
                        default:
                            // if attacking a dataInTransit asset directly from a component (no feature chain), don't list the path, because the attack doesn't go back to the sender
                            if (attackPathVarArray[index].length < 3) {
                                attackPathNameVar.push("The " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " sent out by " +
                                projectById[attackPathVarArray[index][1]].nickName + " is compromised while transmitting on the " + projectById[attackPathVarArray[index][0]].nickName
                                + "."); 
                            } else {
                                // if attacking a dataInTransit asset in a feature chain, skip the sender when describing the path
                                attackPathVarArray[index].forEach((id, ind) => {
                                    if (ind==0) {
                                        attackPathNameVar.push("The " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " sent out by " +
                                        projectById[attackPathVarArray[index][1]].nickName + " is compromised while transmitting on the " + projectById[attackPathVarArray[index][0]].nickName
                                        + ". The attack path starts from " 
                                        + projectById[attackPathVarArray[index][0]].nickName + ",");
                                    } else if (ind == 1 || ind == 2) {
                                        // intentionally remove the sender of this dataInTransit asset, and the duplicate commLine, from the attack path description                           
                                    } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                        attackPathNameVar.push(" and reaches " + projectById[id].nickName + ".")
                                    } else { // if it's the intermediate component
                                        attackPathNameVar.push(" through " + projectById[id].nickName + ",")
                                    }
                                });
                            }
                    }
                } else {
                    /* scenario 4 - component-commLine-component, or component-commLine-component-commLine-component, or component-commLine-component-commLine-component-commLine-component...
                    in this scenario, the threat affects the data sent out by the victim component */
                    switch (stride) {
                        case "s":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("Now that the " + projectById[id].nickName + " is compromised, it can go through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" and finally trick " + projectById[id].nickName + " to send out " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                    " to spoof other components.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "t":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("Now that the " + projectById[id].nickName + " is compromised, it can go through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" and finally direct the " + projectById[id].nickName + " to send out maliciously modified " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                                    ".")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "i":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("Now that the " + projectById[id].nickName + " is compromised, it can go through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to read " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " before " +
                                    projectById[id].nickName + " sends it out.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        default:
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("- The attack originates from the " + projectById[id].nickName + ".\n")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push("- It finally affects " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " sent out by " + projectById[id].nickName + ".")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push("- The attack travels through " + projectById[id].nickName + ".\n")
                                }
                            });
                    }
                }
            }
            return attackPathNameVar.join("")
        case "bandwidth":
                if (attackPathVarArray[index].length == 1) {
                    /* scenario 1, if attack is initiated on the same component that's being attacked, this component is commLine. */
                    attackPathNameVar.push("The attacker " + verbBasedOnTransmissionMedia(attackSurfaceTransmissionMedia)[0] + projectById[attackPathVarArray[index][0]].nickName
                    + verbBasedOnTransmissionMedia(attackSurfaceTransmissionMedia)[1] + "to inject a large amount of garbage data.");
                } else if (attackPathVarArray[index].length == 2) {
                    /* scenario 2, DoS from a non-comLine component to a commLine*/
                    attackPathNameVar.push("The attacker who takes over control of the " + projectById[attackPathVarArray[index][0]].nickName +
                    " is able to flood the " + projectById[attackPathVarArray[index][1]].nickName + " by sending excessive traffic.");
                } else {
                    // this following scenario is not possible as of 9/7/2021
                    /* scenario 3, DoS from a non-comLine component in a feature chain*/
                    attackPathNameVar.push("The attacker who takes over control of the " + projectById[attackPathVarArray[index][0]].nickName +
                    " is able to flood the communication lines connected with the " + projectById[attackPathVarArray[index][projectById[attackPathVarArray[index]].length - 1]].nickName
                    + " by sending excessive traffic.");
                }
            return attackPathNameVar.join("")
        case "dataAtRest":
            if (attackPathVarArray[index].length == 1) {
                /* scenario 1, if attack is initiated on the same component that's being attacked, this component is micro or controlUnit. */
                switch (stride) {
                    case "t":
                        attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName
                        + " can overwrite the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + dataAtRest1AssetSubType(assetSubType));
                        break;
                    case "i":
                        attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName
                        + " can read the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + dataAtRest2AssetSubType(assetSubType));
                        break;
                }
            } else if (attackPathVarArray[index].length == 2 && attackSurfaceSensorInput) {
                /* scenario 2, attacker accesses a micro or controlUnit from a sensor input*/
                switch (stride) {
                    case "t":
                        attackPathNameVar.push("The attacker tampers the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " stored in the " +
                        projectById[attackPathVarArray[index][1]].nickName + " by manipulating the source/measurand of the sensor from the " + 
                        projectById[attackPathVarArray[index][0]].nickName + ".");
                        break;
                }
            } else if (attackPathVarArray[index].length == 2) {
                /* scenario 3, attacker accesses a micro or controlUnit from a commLine*/
                switch (stride) {
                    case "t":
                        attackPathNameVar.push("Tapping into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                        + ", the attacker overwrites the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " stored in the " +
                        projectById[attackPathVarArray[index][1]].nickName + dataAtRest1AssetSubType(assetSubType));
                        break;
                    case "i":
                        attackPathNameVar.push("Tapping into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                        + ", the attacker reads the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " stored in the " +
                        projectById[attackPathVarArray[index][1]].nickName + dataAtRest2AssetSubType(assetSubType));
                        break;
                }
            } else if (projectById[attackPathVarArray[index][0]].type == "commLine") {
                /* scenario 4, attack from a commLine to a micro/controlUnit in a feature chain*/
                switch (stride) {
                    case "t":
                        attackPathVarArray[index].forEach((id, ind) => {
                            if (ind==0) {
                                attackPathNameVar.push("Starting from the " + projectById[id].nickName + ", the attacker sends " + dataAtRest3AssetSubType(assetSubType)
                                + " to overwrite the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " stored in ");
                            } else if (ind == 1) {
                                attackPathNameVar.push(projectById[id].nickName + ". Such act in " + projectById[id].nickName + " affects other components in the feature chain through this feature's routine operation")
                            } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                attackPathNameVar.push(" and ultimately overwrites the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " stored in the " + projectById[id].nickName + ".")
                            } else { // if it's the intermediate component
                                attackPathNameVar.push(" via " + projectById[id].nickName + ",")
                            }
                        });
                        break;
                    case "i":
                        attackPathVarArray[index].forEach((id, ind) => {
                            if (ind==0) {
                                attackPathNameVar.push("Starting from the " + projectById[id].nickName + " the attacker travels through")
                            } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                attackPathNameVar.push(" to read the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " stored in the " +
                                projectById[id].nickName + ", or read the identical " + dataAtRest4AssetSubType(assetSubType) + " stored locally.")
                            } else { // if it's the intermediate component
                                attackPathNameVar.push(" " + projectById[id].nickName + ",")
                            }
                        });
                        break;
                }
            } else {
                /* scenario 5, attack from one micro/controlUnit to another micro/controlUnit in a feature chain*/
                switch (stride) {
                    case "t":
                        attackPathVarArray[index].forEach((id, ind) => {
                            if (ind==0) {
                                attackPathNameVar.push("The compromised " + projectById[id].nickName + " sends " + dataAtRest3AssetSubType(assetSubType))
                            } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                attackPathNameVar.push(" to overwrite the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " stored in the " + projectById[id].nickName + ".")
                            } else { // if it's the intermediate component
                                attackPathNameVar.push(" via " + projectById[id].nickName + ", ")
                            }
                        });
                        break;
                    case "i":
                        attackPathVarArray[index].forEach((id, ind) => {
                            if (ind==0) {
                                attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through ")
                            } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                attackPathNameVar.push(" to read the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " stored in the " +
                                projectById[id].nickName + ", or read the identical " + dataAtRest4AssetSubType(assetSubType) + " stored locally.")
                            } else { // if it's the intermediate component
                                attackPathNameVar.push(projectById[id].nickName + ", ")
                            }
                        });
                        break;
                }
            }
                return attackPathNameVar.join("")
            case "computingResource":
                if (attackPathVarArray[index].length == 1) {
                    /* scenario 1, if attack is initiated on the same component that's being attacked, this component is micro/controlUnit. */
                    attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                    " can deplete its computational resources by invoking intensive processes.");
                } else if (attackPathVarArray[index].length == 2) {
                    /* scenario 2, attack a micro/controlUnit from a commLine. */
                    attackPathNameVar.push("The attacker injects malicious messages into the " + projectById[attackPathVarArray[index][0]].nickName +
                    " to deplete the computational resources of the " + projectById[attackPathVarArray[index][1]].nickName + ".");
                } else if (projectById[attackPathVarArray[index][0]].type == "commLine") {
                    /* scenario 3, DoS from one commLine to a micro/controlUnit through a feature chain*/
                    attackPathVarArray[index].forEach((id, ind) => {
                        if (ind==0) {
                            attackPathNameVar.push("The attacker injects malicious data to the " + projectById[id].nickName + ", which goes through")
                        } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                            attackPathNameVar.push(" to deplete the computational resources of the " + projectById[id].nickName + " by invoking intensive processes remotely.")
                        } else { // if it's the intermediate component
                            attackPathNameVar.push(" " + projectById[id].nickName + ",")
                        }
                    });
                } else {
                    /* scenario 4, DoS from one micro/controlUnit to another through a feature chain*/
                    attackPathVarArray[index].forEach((id, ind) => {
                        if (ind==0) {
                            attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                        } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                            attackPathNameVar.push(" to deplete the computational resources of the " + projectById[id].nickName + " by invoking intensive processes remotely.")
                        } else { // if it's the intermediate component
                            attackPathNameVar.push(" " + projectById[id].nickName + ",")
                        }
                    });
                }
                return attackPathNameVar.join("")
            case "memoryResource":
                if (attackPathVarArray[index].length == 1) {
                    /* scenario 1, if attack is initiated on the same component that's being attacked, this component is micro/controlUnit. */
                    attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                    " generates excessive garbage data to deplete its memory resource.");
                } else if (attackPathVarArray[index].length == 2) {
                    /* scenario 2, attack a micro/controlUnit from a commLine. */
                    attackPathNameVar.push("The attacker injects malicious messages into the " + projectById[attackPathVarArray[index][0]].nickName +
                    " to deplete the memory resource of the " + projectById[attackPathVarArray[index][1]].nickName + ".");
                } else if (projectById[attackPathVarArray[index][0]].type == "commLine") {
                    /* scenario 3, DoS from one commLine to a micro/controlUnit through a feature chain*/
                    attackPathVarArray[index].forEach((id, ind) => {
                        if (ind==0) {
                            attackPathNameVar.push("The attacker injects malicious data to the " + projectById[id].nickName + ", which goes through")
                        } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                            attackPathNameVar.push(" to deplete the memory resource of the " + projectById[id].nickName + " by requesting it to store excessive garbage data.")
                        } else { // if it's the intermediate component
                            attackPathNameVar.push(" " + projectById[id].nickName + ",")
                        }
                    });
                } else {
                    /* scenario 4, DoS from one micro/controlUnit to another through a feature chain*/
                    attackPathVarArray[index].forEach((id, ind) => {
                        if (ind==0) {
                            attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                        } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                            attackPathNameVar.push(" to deplete the memory resource of the " + projectById[id].nickName + " by requesting it to store excessive garbage data.")
                        } else { // if it's the intermediate component
                            attackPathNameVar.push(" " + projectById[id].nickName + ",")
                        }
                    });
                }
                return attackPathNameVar.join("")
            case "process":
                if (attackPathVarArray[index].length == 1) {
                    /* scenario 1, if attack is initiated on the same component that's being attacked, this component is micro/controlUnit. */
                    switch (stride) {
                        case "s":
                            attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                            " spoofs its internal process, " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                            ", to gain access to restricted information or access to other privileged processes.");
                            break;
                        case "t":
                            attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                            " tampers its internal processes, including the " + assetThreatMatrix[currentComponent][assetArray[index]].asset +
                            ", to gain access to restricted information or access to other privileged processes.");
                            break;
                        case "r":
                            attackPathNameVar.push("The attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                            " repudiates his actions.");
                            break;
                        case "d":
                            attackPathNameVar.push("This attacker who compromised the " + projectById[attackPathVarArray[index][0]].nickName +
                            " terminates the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " to interrupt its operation.");
                            break;
                    }
                } else if (attackPathVarArray[index].length == 2 && attackSurfaceSensorInput) {
                    /* scenario 2, attack a micro/controlUnit from a sensor input. */
                    switch (stride) {
                        case "s":
                            attackPathNameVar.push("The attacker manipulates the source/measurand of the sensor from the " + projectById[attackPathVarArray[index][0]].nickName + 
                            " to spoof the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " + projectById[attackPathVarArray[index][1]].nickName + ".");
                            break;
                        default:
                            attackPathNameVar.push("The attacker compromises the " + assetThreatMatrix[currentComponent][assetArray[index]].asset 
                            + " by manipulating the source/measurand of the sensor from the " + projectById[attackPathVarArray[index][0]].nickName + ".");
                            break;
                    }
                } else if (attackPathVarArray[index].length == 2) {
                    /* scenario 3, attack a micro/controlUnit from a commLine. */
                    switch (stride) {
                        case "s":
                            attackPathNameVar.push("The attacker taps into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                            + " to spoof the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                            projectById[attackPathVarArray[index][1]].nickName + ", to gain access to restricted information or access to other privileged processes.");
                            break;
                        case "t":
                            attackPathNameVar.push("The attacker taps into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                            + " to tamper the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                            projectById[attackPathVarArray[index][1]].nickName + ", to gain access to restricted information or access to other privileged processes.");
                            break;
                        case "r":
                            attackPathNameVar.push("The attacker who taps into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                            + " to attack the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " in the " +
                            projectById[attackPathVarArray[index][1]].nickName + " repudiates his actions.");
                            break;
                        case "d":
                            attackPathNameVar.push("The attacker taps into the " + projectById[attackPathVarArray[index][0]].nickName + dataAtRestTransmissionMedia1(attackSurfaceTransmissionMedia)
                            + " to terminate the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " in the " +
                            projectById[attackPathVarArray[index][1]].nickName + " or crash the system.");
                            break;
                    }
                } else if (projectById[attackPathVarArray[index][0]].type == "commLine"){
                    /* scenario 4, DoS from a commLine to a micro/controlUnit through a feature chain*/
                    switch (stride) {
                        case "s":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker injects malicious data into the " + projectById[id].nickName + ", which affects")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to finally spoof the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + ", to gain access to restricted information or access to other privileged processes.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "t":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker injects malicious data into the " + projectById[id].nickName + ", which affects")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to finally tamper the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + ", to gain access to restricted information or access to other privileged processes.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "r":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker injects malicious data into the " + projectById[id].nickName + ", which affects")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to finally attack the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + " and repudiates his actions.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "d":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker injects malicious data into the " + projectById[id].nickName + ", which affects")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to finally terminate the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " in the " +
                                    projectById[id].nickName + " or crash the system.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                    }
                } else {
                    /* scenario 5, DoS from one micro/controlUnit to another through a feature chain*/
                    switch (stride) {
                        case "s":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to spoof the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + ", to gain access to restricted information or access to other privileged processes.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "t":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to tamper the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + ", to gain access to restricted information or access to other privileged processes.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "r":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to attack the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " running in the " +
                                    projectById[id].nickName + " and repudiates his actions.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                        case "d":
                            attackPathVarArray[index].forEach((id, ind) => {
                                if (ind==0) {
                                    attackPathNameVar.push("The attacker who compromised the " + projectById[id].nickName + " travels through")
                                } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                                    attackPathNameVar.push(" to terminate the " + assetThreatMatrix[currentComponent][assetArray[index]].asset + " in the " +
                                    projectById[id].nickName + " or crash the system.")
                                } else { // if it's the intermediate component
                                    attackPathNameVar.push(" " + projectById[id].nickName + ",")
                                }
                            });
                            break;
                    }
                }
                return attackPathNameVar.join("")
        default:
            if (attackPathVarArray[index].length == 1) { // if attack is initiated on the same component that's being attacked
                attackPathNameVar.push("The attack originates from and occurs in the " + projectById[attackPathVarArray[index][0]].nickName + " ");
            } else { // if the attack is initiated from a different component
                attackPathVarArray[index].forEach((id, ind) => { // compose attackPath language
                    // attackPathNameVar.push(projectById[id].nickName); // one approach - just list the names of the components along the path
                    if (ind==0) { // another approach - add some description language. if it's the first component in the path
                        attackPathNameVar.push("- The attack originates from the " + projectById[id].nickName + ".\n")
                    } else if (ind == (attackPathVarArray[index].length - 1)) { // if it's the last component in the path
                        attackPathNameVar.push("- It finally reaches " + assetThreatMatrix[currentComponent][assetArray[index]].asset +  " in the " + projectById[id].nickName + ".")
                    } else { // if it's the intermediate component
                        attackPathNameVar.push("- It goes through " + projectById[id].nickName + ".\n")
                    }
                });
            }
            return attackPathNameVar.join("")
    }
}
module.exports.assembleAttackPathDescription = assembleAttackPathDescription;

function verbBasedOnTransmissionMedia(transmissionMedia) {
    switch (transmissionMedia) {
        case "physicalWire":
            return ["physically connects to ", " "]
        case "shortWireless":
            return ["taps into ", " in a short distance "]
        case "longWireless":
            return ["connects to ", " remotely "]
        default:
            return [" ", " "]
    }
}

function dataInTransit1AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "configData":
            return "configurations in the "
        case "securityData":
            return "secrets in the "
        default:
            return "content of the "
    }
}

function dataInTransit2AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "configData":
            return "malicious configurations."
        case "securityData":
            return "the attacker's own secrets."
        case "log":
            return "spurious logs."
        default:
            return "malicious data."
    }
}

function dataAtRest1AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "securityData":
            return " with his own secret data."
        case "configData":
            return " with malicious configuration settings."
        case "log":
            return " with spurious logs."
        case "code":
            return " with malicious code."
        default:
            return " with malicious data."
    }
}

function dataAtRest2AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "generalData":
            return "."
        default:
            return ", which serves as a critical step in the attacker's reverse engineering process."
    }
}

function dataAtRestTransmissionMedia1(transmissionMedia) {
    switch (transmissionMedia) {
        case "physicalWire":
            return " physically"
        case "shortWireless":
            return " in a short distance"
        case "longWireless":
            return " remotely"
        default:
            return ""
    }
}

function dataAtRest3AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "securityData":
            return "his own secret data"
        case "configData":
            return "malicious configuration data"
        case "log":
            return "spurious logs"
        case "code":
            return "malicious code"
        default:
            return "malicious data"
    }
}

function dataAtRest4AssetSubType(assetSubType) {
    switch (assetSubType) {
        case "securityData":
            return "secret data"
        case "configData":
            return "configuration data"
        case "log":
            return "logs"
        case "code":
            return "code"
        default:
            return "data"
    }
}

function travelThrough(attackPathLength) {
    if (attackPathLength>2) {
        return "travels through "
    } else {
        return ""
    }
}