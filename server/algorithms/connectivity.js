const httpService = require("../service/httpService");
const objOperation = require("../service/objOperation");
const attackFeasibilityFunc = require("./attackFeasibility");
const opEnv = require("./operationalEnvironment");


// connectivity matrices by adjacency - commLine and components connected through one commLine
function createConnMatrixByAdjacency(project, projectById) {
    let connectivityListZero = {}; // connectivityListZero shows relationships of direct connection
    let connectivityListZeroPath = {}; // mirrors connectivityListZero but identifies the line id
    let connectivityListZeroBaseProt = {}; // mirrors connectivityListZero but identifies the line's base protocol
    let connectivityListZeroAppProt = {}; // mirrors connectivityListZero but identifies the line's app protocols
    let connectivityListZeroSecProt = {}; // mirrors connectivityListZero but identifies the line's security protocols
    let connectivityListZeroTransmissionMedia = {}; // mirrors connectivityListZero but identifies the line's transmission media
    for (let [element] of Object.entries(project)) {// initialize connectivity list by populating all keys
        project[element].forEach((currentItem) => {
            connectivityListZero[currentItem.id] = []; // each component id has a key:value pair
            connectivityListZeroPath[currentItem.id] = [];
            connectivityListZeroBaseProt[currentItem.id] = [];
            connectivityListZeroAppProt[currentItem.id] = [];
            connectivityListZeroSecProt[currentItem.id] = [];
            connectivityListZeroTransmissionMedia[currentItem.id] = [];
        });
    };
    // console.log(project);
    for (let [element] of Object.entries(project)) {
        if (element == "commLine") { // commLine has connectivity information
            project[element].forEach((currentLine) => { // for every line
                currentLine.terminalComponentId.forEach((compId) => { // for each connected component of every line
                    if (compId != "" && compId != null) { // if starting terminal is not connected, the starting terminal component id will be "", and we need to ignore that
                        // console.log(compId);
                        let tempArray = [];
                        tempArray = JSON.parse(JSON.stringify(currentLine.terminalComponentId));
                        // console.log(tempArray);
                        tempArray.splice(tempArray.indexOf(compId), 1); // remove the component itself to avoid duplication
                        for (let i=tempArray.length-1; i>=0; i--) {
                            if (tempArray[i] == "" || tempArray[i] == null) {
                                tempArray.splice(i)
                            }
                        }
                        // console.log(tempArray);
                        connectivityListZero[compId] = connectivityListZero[compId].concat(tempArray); // the rest are the connected components
                        // console.log(connectivityListZero);
                        connectivityListZero[compId] = connectivityListZero[compId].concat(currentLine.id); // add the commLine to its connnected components
                        for (i=0; i<tempArray.length; i++) {
                            // console.log(connectivityListZeroPath);
                            connectivityListZeroPath[compId] = connectivityListZeroPath[compId].concat(currentLine.id); // commLine id is the path to the component
                            // connectivityListZeroPath[compId] = connectivityListZeroPath[compId].concat(currentLine.id); // commLine id is the path to the commLine
                            // console.log(connectivityListZeroPath);
                            connectivityListZeroBaseProt[compId] = connectivityListZeroBaseProt[compId].concat(currentLine.baseProtocol); // populate app protocol for each connection
                            // connectivityListZeroBaseProt[compId] = connectivityListZeroBaseProt[compId].concat(currentLine.baseProtocol); // populate app protocol for each connection
                            // console.log(`compId is ${compId}`)
                            // console.log(`connectivityListZeroAppProt is `)
                            // console.dir(connectivityListZeroAppProt)
                            // console.log(`currentLine.appProtocol is `)
                            // console.dir(currentLine.appProtocol)
                            connectivityListZeroAppProt[compId].push(currentLine.appProtocol); // populate app protocol for each connection
                            // connectivityListZeroAppProt[compId].push(currentLine.appProtocol); // populate app protocol for each connection
                            connectivityListZeroSecProt[compId].push(currentLine.secureProtocol); // populate security protocol for each connection
                            // connectivityListZeroSecProt[compId].push(currentLine.secureProtocol); // populate security protocol for each connection
                            connectivityListZeroTransmissionMedia[compId].push(currentLine.transmissionMedia); // populate transmission media for each connection
                        };
                    }
                });
                if (currentLine.terminalComponentId.includes("") || currentLine.terminalComponentId.includes(null)) { // if the commLine has a terminal not connected to anything
                    for (let i=currentLine.terminalComponentId.length-1; i>=0; i--) {
                        if (currentLine.terminalComponentId[i] == "" || currentLine.terminalComponentId[i] == null ) { // if that terminal is not connected to any component, ignore
                            // can't splice the empty string, because main.js needs to use the index of each terminal
                        } else {
                            connectivityListZero[currentLine.id].push(currentLine.terminalComponentId[i]);
                        }
                    }
                } else {
                    connectivityListZero[currentLine.id] = currentLine.terminalComponentId;
                }
                for (let i=0; i<connectivityListZero[currentLine.id].length; i++) {
                    connectivityListZeroPath[currentLine.id] = connectivityListZeroPath[currentLine.id].concat(currentLine.id);
                    connectivityListZeroBaseProt[currentLine.id] = connectivityListZeroBaseProt[currentLine.id].concat(currentLine.baseProtocol);
                    connectivityListZeroAppProt[currentLine.id].push(currentLine.appProtocol);
                    connectivityListZeroSecProt[currentLine.id].push(currentLine.secureProtocol);
                    connectivityListZeroTransmissionMedia[currentLine.id].push(currentLine.transmissionMedia);
                };
            });
        };
    };
    // the for loop above has the complete connectivityListZero, but all other matrices missed entries when the element in connectivityListZero is a commLine.
    // So, the next for loop is to check connectivityListZero for commLine entries in each array, and then add the missing elements to the paring matrices.
    for (let [element] of Object.entries(connectivityListZero)) {
        connectivityListZero[element].forEach((currentComponent, currentComponentIndex) => {
            // console.dir(projectById[currentComponent])
            if (projectById[currentComponent].type == "commLine") {
                connectivityListZeroPath[element].push(currentComponent);
                connectivityListZeroBaseProt[element].push(projectById[currentComponent].baseProtocol);
                connectivityListZeroAppProt[element].push(projectById[currentComponent].appProtocol);
                connectivityListZeroSecProt[element].push(projectById[currentComponent].secureProtocol);
                connectivityListZeroTransmissionMedia[element].push(projectById[currentComponent].transmissionMedia);
            }
        })
    }

    // console.log("Connectivity list: ");
    // console.log(connectivityListZero);
    // console.log("Connectivity path list: ");
    // console.log(connectivityListZeroPath);
    // console.log("Connectivity base protocol list: ");
    // console.log(connectivityListZeroBaseProt);
    // console.log("Connectivity application protocol list: ");
    // console.log(connectivityListZeroAppProt);
    // console.log("Connectivity security protocol list: ");
    // console.log(connectivityListZeroSecProt);

    return [connectivityListZero, connectivityListZeroPath, connectivityListZeroBaseProt, connectivityListZeroAppProt, connectivityListZeroSecProt,
        connectivityListZeroTransmissionMedia];
}
module.exports.createConnMatrixByAdjacency = createConnMatrixByAdjacency;

// create connectivity matrix using feature chain
function createConnMatrixByFeatureChain(projectObj) {
    // under connectivityFeatureChain,  only feature originating modules can exploit feature chain
    // only end module in the feature chain can be exploited through feature chain
    // intermediate modules along the feature chain will not be affected in any way
    // connectivityFeatureChain = {
    //      featureChainId: {
    //          featureId: "",
    //          featureName: "",
    //          featureType: "",
    //          featureChainNickName: "",
    //          attackedModuleId: [],
    //          attackedModuleName: [],
    //          attackedModuleFeatureIndex: [],
    //          attackedModuleFeatureRole: [],
    //          originatingModuleId: [],
    //          originatingModuleName: [],
    //          originatingModuleFeatureIndex: [],
    //          originatingModuleFeatureRole: [],
    //          intermediateModuleId: [],
    //          intermediateModuleName: [],
    //          intermediateModuleFeatureIndex: [],
    //          intermediateModuleFeatureRole: [],
    //          ...
    //      },
    // }
    // let connectivityFeatureChainItem = {
    //     connectivityList: [], // shows components connected by feature chain
    //     featureChainNickName: [], // easier for users to see the connection. all other properties follow the structure of list
    //     featureChainId: [],
    //     path: [],
    // };
    let connectivityFeatureChain = {}; // "array" of connectivityFeatureChainItem, but in JSON form
    // let connectivityListFeatureChainPathEntry = []; // only the entering component affects the attack feasibility. components along the chain don't.
    // let connectivityListFeatureChainPathFull = []; // record all components involved along the chain, for attack path analysis
    // let connectivityListFeatureChainEntryProt = []; // mirrors connectivityListFeatureChainPathEntry but shows the communication protocol of the entering commLine.
    // let connectivityListFeatureChainEntrySecProt = []; // mirrors connectivityListFeatureChainPathEntry but shows the security protocol of the entering commLine.
    for (let [element] of Object.entries(projectObj)) {//
        if (element == "micro" || element == "controlUnit") { //
            projectObj[element].forEach((currentComponent) => { // for every component, check the existence of featureChain
                currentComponent.featureChainId.forEach((currentFeatureChainId, currentFeatureChainIndex) => {
                    if (currentFeatureChainId != "") { // if featureChainId exists, create new object
                        // console.log(connectivityFeatureChain[currentFeatureChainId])
                        if (connectivityFeatureChain[currentFeatureChainId]) { // if this feature chain was recorded before

                        } else { // if this feature chain was not recorded, assign this feature chain id as a new property
                            Object.defineProperty(connectivityFeatureChain, currentFeatureChainId, {
                                value: {},
                                writable: true,
                                configurable: true,
                                enumerable: true,
                            });
                            // console.log(connectivityFeatureChain)
                            Object.assign(connectivityFeatureChain[currentFeatureChainId], {
                                featureChainNickName: currentComponent.featureChainName[currentFeatureChainIndex],
                                attackedModuleId: [],
                                attackedModuleName: [],
                                attackedModuleFeatureIndex: [],
                                attackedModuleFeatureId: [],
                                attackedModuleFeatureName: [],
                                attackedModuleFeatureRole: [],
                                attackedModuleFeatureType: [],
                                originatingModuleId: [],
                                originatingModuleName: [],
                                originatingModuleFeatureIndex: [],
                                originatingModuleFeatureRole: [],
                                originatingModuleFeatureType: [],
                                originatingModuleFeatureId: [],
                                originatingModuleFeatureName: [],
                                intermediateModuleId: [],
                                intermediateModuleName: [],
                                intermediateModuleFeatureIndex: [],
                                intermediateModuleFeatureRole: [],
                                intermediateModuleFeatureType: [],
                                intermediateModuleFeatureId: [],
                                intermediateModuleFeatureName: [],
                            });
                            // console.log(connectivityFeatureChain)
                        }
                        // console.log(currentComponent.featureRole[currentFeatureChainIndex])
                        if (["senderReceiver"].includes(currentComponent.featureRole[currentFeatureChainIndex])) { // if this component is the sender and receiver
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleId.push(currentComponent.id);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleName.push(currentComponent.nickName);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureIndex.push(currentFeatureChainIndex);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureRole.push(currentComponent.featureRole[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureType.push(currentComponent.featureType[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureId.push(currentComponent.featureId[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureName.push(currentComponent.feature[currentFeatureChainIndex].slice(0,-1)); // remove * at the end
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleId.push(currentComponent.id);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleName.push(currentComponent.nickName);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureIndex.push(currentFeatureChainIndex);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureRole.push(currentComponent.featureRole[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureType.push(currentComponent.featureType[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureId.push(currentComponent.featureId[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureName.push(currentComponent.feature[currentFeatureChainIndex].slice(0,-1)); // remove * at the end
                        } else if (["controller", "generator", "user", "sender"].includes(currentComponent.featureRole[currentFeatureChainIndex])) { // if this component is the sender
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleId.push(currentComponent.id);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleName.push(currentComponent.nickName);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureIndex.push(currentFeatureChainIndex);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureRole.push(currentComponent.featureRole[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureType.push(currentComponent.featureType[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureId.push(currentComponent.featureId[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].originatingModuleFeatureName.push(currentComponent.feature[currentFeatureChainIndex].slice(0,-1)); // remove * at the end
                        } else if (["implementer", "consumer", "store", "system", "receiver", "consumer_store"].includes(currentComponent.featureRole[currentFeatureChainIndex])) {// if this component executes
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleId.push(currentComponent.id);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleName.push(currentComponent.nickName);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureIndex.push(currentFeatureChainIndex);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureRole.push(currentComponent.featureRole[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureType.push(currentComponent.featureType[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureId.push(currentComponent.featureId[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].attackedModuleFeatureName.push(currentComponent.feature[currentFeatureChainIndex].slice(0,-1)); // remove * at the end
                        } else if (currentComponent.featureRole[currentFeatureChainIndex] == "router") { // if this component is a middle man
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleId.push(currentComponent.id);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleName.push(currentComponent.nickName);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleFeatureIndex.push(currentFeatureChainIndex);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleFeatureRole.push(currentComponent.featureRole[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleFeatureType.push(currentComponent.featureType[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleFeatureId.push(currentComponent.featureId[currentFeatureChainIndex]);
                            connectivityFeatureChain[currentFeatureChainId].intermediateModuleFeatureName.push(currentComponent.feature[currentFeatureChainIndex].slice(0,-1)); // remove * at the end 
                        } else {
                            const errorMsg = `${currentComponent.nickName}'s feature ${currentComponent.feature[currentFeatureChainIndex]} at feature index ${currentFeatureChainIndex} 
                                has a feature role ${currentComponent.featureRole[currentFeatureChainIndex]} that is not supported by the current Feature Chain algorithm.`;
                            console.log(errorMsg);
                            throw new Error(errorMsg);
                        }
                    }
                })
            });
        }
    }
    console.log(`connectivityFeatureChain in createConnMatrixByFeatureChain() is `);
    console.dir(connectivityFeatureChain);
    return connectivityFeatureChain
}
module.exports.createConnMatrixByFeatureChain = createConnMatrixByFeatureChain;

function createAttackPathForFeatureChain(connectivityFeatureChain, projectById) { // intermediateModuleId should be orderd from attacking module to attacked module
    let attackPathListFeatureChain = {};
    let notUsedIntermediateModules = {}; // for future use. currently parallel attack path is not considered. meaning, there is only one path from one attacking point to the end point
    // {
    //   originatingModuleId_1: {
    //      attackedModuleId_1: [],
    //      attackedModuleId_2: [],
    //   }
    // }
    let featureChainInvolvedComponent = {
        originating: [],
        attacked: [], // the component and the end of the chain
        originatingFeatureId: [],
        originatingFeatureRole: [],
        originatingFeatureType: [],
        originatingFeatureName: [],
        attackedFeatureId: [],
        attackedFeatureRole: [],
        attackedFeatureType: [],
        attackedFeatureName: [],
        featureIndexInAttacked: [],
        featureChainId: [],
        attackPath: [],
    };
    let featureChainInvolvedComponentFromCommLine = {
        originating: [], // this is the attack surface commLine
        attacked: [], // this is the component directly connected to the commLine
        affected: [], // this is the victim component at the end of the chain
        originatingFeatureId: [], // this is the same as attackedFeatureId
        originatingFeatureRole: [], // this is the same as attackedFeatureRole
        originatingFeatureType: [], // this is the same as attackedFeatureType
        originatingFeatureName: [], // this is the same as attackedFeatureName
        attackedFeatureId: [],
        attackedFeatureRole: [],
        attackedFeatureType: [],
        attackedFeatureName: [],
        affectedFeatureId: [],
        affectedFeatureRole: [],
        affectedFeatureType: [],
        affectedFeatureName: [],
        featureIndexInAttacked: [],
        featureChainId: [],
        attackPath: [],
    };
    // loop through feature chains
    for (let currentFeatureChain of Object.keys(connectivityFeatureChain)) { 
        Object.defineProperty(notUsedIntermediateModules, currentFeatureChain, {
            value: {}, // within each originating module, there can be multiple attacked modules
            writable: true,
            configurable: true,
            enumerable: true,
        });
        // console.log(notUsedIntermediateModules)
        if (connectivityFeatureChain[currentFeatureChain].originatingModuleId.length == 0) {
            const errorMsg = `The feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" does not have an originating point. `
            + `Make sure feature roles have been assigned correctedly.`;
            throw new Error(errorMsg);
        }
        // loop through originating modules
        for (let [currentOriginatingModuleIndex, currentOriginatingModule] of connectivityFeatureChain[currentFeatureChain].originatingModuleId.entries()) { 
            Object.defineProperty(attackPathListFeatureChain, currentOriginatingModule, {
                value: {}, // within each originating module, there can be multiple attacked modules
                writable: true,
                configurable: true,
                enumerable: true,
            });
            Object.defineProperty(notUsedIntermediateModules[currentFeatureChain], currentOriginatingModule, {
                value: {}, // within each originating module, there can be multiple attacked modules
                writable: true,
                configurable: true,
                enumerable: true,
            });
            // get the attack surface commLines connected to the originating modules
            let attackSurfaceCommLines = getConnectedAttackSurfaceCommLines(currentOriginatingModule, projectById);
            for (let [currentAttackSurfaceLineIndex, currentAttackSurfaceLine] of attackSurfaceCommLines.entries()) {
                Object.defineProperty(attackPathListFeatureChain[currentOriginatingModule], currentAttackSurfaceLine, {
                    value: {}, //
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
            if (connectivityFeatureChain[currentFeatureChain].attackedModuleId.length == 0) {
                const errorMsg = `The feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" does not have an end point. `
                + `Make sure feature roles have been assigned correctedly.`;
                throw new Error(errorMsg);
            }
            // loop through attacked/victim modules
            for (let [currentAttackedModuleIndex, currentAttackedModule] of connectivityFeatureChain[currentFeatureChain].attackedModuleId.entries()) { 
                if (!currentAttackedModule) {
                    const errorMsg = `The feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" is does not have an end point. `
                    + `Make sure feature roles have been assigned correctedly.`;
                    throw new Error(errorMsg);
                }
                // use the temp array to test if intermediate modules are used up
                let tempIntermediateModuleId = connectivityFeatureChain[currentFeatureChain].intermediateModuleId.slice(0); 
                Object.defineProperty(attackPathListFeatureChain[currentOriginatingModule], currentAttackedModule, {
                    value: [], // for one originating module and one attacked module, there is one attack path
                    // TODO:
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
                Object.defineProperty(notUsedIntermediateModules[currentFeatureChain][currentOriginatingModule], currentAttackedModule, {
                    value: [], // within each originating module, there can be multiple attacked modules
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
                // the first component in the attack path is the originating module
                attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].push(currentOriginatingModule); 
                // compose featureChainInvolvedComponent object
                featureChainInvolvedComponent.originating.push(currentOriginatingModule);
                featureChainInvolvedComponent.attacked.push(currentAttackedModule);
                featureChainInvolvedComponent.featureChainId.push(currentFeatureChain);
                featureChainInvolvedComponent.originatingFeatureId.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureId[currentOriginatingModuleIndex]);
                featureChainInvolvedComponent.originatingFeatureRole.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureRole[currentOriginatingModuleIndex]);
                featureChainInvolvedComponent.originatingFeatureType.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureType[currentOriginatingModuleIndex]);
                featureChainInvolvedComponent.originatingFeatureName.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureName[currentOriginatingModuleIndex]);
                featureChainInvolvedComponent.attackedFeatureId.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureId[currentAttackedModuleIndex]);
                featureChainInvolvedComponent.attackedFeatureRole.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureRole[currentAttackedModuleIndex]);
                featureChainInvolvedComponent.attackedFeatureType.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureType[currentAttackedModuleIndex]);
                featureChainInvolvedComponent.attackedFeatureName.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureName[currentAttackedModuleIndex]);
                featureChainInvolvedComponent.featureIndexInAttacked.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureIndex[currentAttackedModuleIndex]);
                // loop through attack surface commLines. for feature chains that involve commLine attack surfaces, there are 3 layers and 3 loops - originating module, victim, and line 
                for (let [currentAttackSurfaceLineIndex, currentAttackSurfaceLine] of attackSurfaceCommLines.entries()) {
                    Object.defineProperty(attackPathListFeatureChain[currentOriginatingModule][currentAttackSurfaceLine], currentAttackedModule, {
                        value: [], // for one originating module and one attacked module, there is one attack path
                        // TODO:
                        writable: true,
                        configurable: true,
                        enumerable: true,
                    });
                    // the first component in the attack path is the commLine
                    attackPathListFeatureChain[currentOriginatingModule][currentAttackSurfaceLine][currentAttackedModule].push(currentAttackSurfaceLine);
                    // compose featureChainInvolvedComponent object
                    featureChainInvolvedComponentFromCommLine.originating.push(currentAttackSurfaceLine);
                    featureChainInvolvedComponentFromCommLine.attacked.push(currentOriginatingModule);
                    featureChainInvolvedComponentFromCommLine.affected.push(currentAttackedModule);
                    featureChainInvolvedComponentFromCommLine.featureChainId.push(currentFeatureChain);
                    featureChainInvolvedComponentFromCommLine.originatingFeatureId.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureId[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.originatingFeatureRole.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureRole[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.originatingFeatureType.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureType[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.originatingFeatureName.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureName[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.attackedFeatureId.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureId[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.attackedFeatureRole.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureRole[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.attackedFeatureType.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureType[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.attackedFeatureName.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureName[currentOriginatingModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.affectedFeatureId.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureId[currentAttackedModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.affectedFeatureRole.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureRole[currentAttackedModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.affectedFeatureType.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureType[currentAttackedModuleIndex]);
                    featureChainInvolvedComponentFromCommLine.affectedFeatureName.push(connectivityFeatureChain[currentFeatureChain].attackedModuleFeatureName[currentAttackedModuleIndex]);
                    // the "attacked" component for featureChainInvolvedComponentFromCommLine is actually the "originating" component from connectivityFeatureChain
                    featureChainInvolvedComponentFromCommLine.featureIndexInAttacked.push(connectivityFeatureChain[currentFeatureChain].originatingModuleFeatureIndex[currentAttackedModuleIndex]);
                }
                // console.log(`attackPathListFeatureChain is `)
                // console.dir(attackPathListFeatureChain)

                let returnedValue = composeFeatureChainAttackPath(projectById, currentOriginatingModule, currentOriginatingModuleIndex, 
                    connectivityFeatureChain, currentFeatureChain, currentAttackedModule, attackPathListFeatureChain, tempIntermediateModuleId, attackSurfaceCommLines);
                tempIntermediateModuleId = returnedValue[0];
                attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule] = returnedValue[1];
                // console.log(`test point 123`)
                notUsedIntermediateModules[currentFeatureChain][currentOriginatingModule][currentAttackedModule].push(tempIntermediateModuleId);
                featureChainInvolvedComponent.attackPath.push(attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]);
                // full attack path for the attack surface commLines are almost the same except that the starting component shall be the commLine
                for (let [currentAttackSurfaceLineIndex, currentAttackSurfaceLine] of attackSurfaceCommLines.entries()) {
                    featureChainInvolvedComponentFromCommLine.attackPath.push([currentAttackSurfaceLine, ...attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]]);
                    attackPathListFeatureChain[currentOriginatingModule][currentAttackSurfaceLine][currentAttackedModule] = 
                        [currentAttackSurfaceLine, ...attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]]
                }
            }

        }
    }
    console.log(`attackPathListFeatureChain in createAttackPathForFeatureChain() is `);
    console.dir(attackPathListFeatureChain);
    console.log(`notUsedIntermediateModules in createAttackPathForFeatureChain() is `);
    console.dir(notUsedIntermediateModules);
    console.log(`featureChainInvolvedComponent in createAttackPathForFeatureChain() is `);
    console.dir(featureChainInvolvedComponent);
    console.log(`featureChainInvolvedComponentFromCommLine in createAttackPathForFeatureChain() is `);
    console.dir(featureChainInvolvedComponentFromCommLine);

    return [attackPathListFeatureChain, featureChainInvolvedComponent, featureChainInvolvedComponentFromCommLine]
}
module.exports.createAttackPathForFeatureChain = createAttackPathForFeatureChain;


function getConnectedAttackSurfaceCommLines(currentOriginatingModule, projectById) {
    let connectedLines = [];
    projectById[currentOriginatingModule].lineId.forEach(line => {
        if (projectById[line].attackSurface) {
            connectedLines.push(line)
        }
    })
    return connectedLines
}

function composeFeatureChainAttackPath(projectById, currentOriginatingModule, currentOriginatingModuleIndex, connectivityFeatureChain, currentFeatureChain, 
    currentAttackedModule, attackPathListFeatureChain, tempIntermediateModuleId, attackSurfaceCommLines) {
    let n = 1;
    let loopLimit = 100;
    let lastComponentIndex = attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].length - 1; // explore the attack path backward
    let wrongCommLine = []; // record commLines that lead to a wrong path
    let wrongComponent = []; // record components that lead to a wrong path
    // as long as the end of the attack path is not the attacked module, this following loop should keep going, but the number of iteration is limited
    // because currently no complete connectivity matrix is available, there is no way to check if a module is ultimated connected to another or not
    while ((attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule][lastComponentIndex] != currentAttackedModule) && (n<loopLimit)) {
        // console.log(`n=${n}`)
        // console.log(`wrongCommLine is ${wrongCommLine}`)
        // console.log(`wrongComponent is ${wrongComponent}`)
        // console.log(`attackPathListFeatureChain in composeFeatureChainAttackPath() is `)
        // console.dir(attackPathListFeatureChain)
        let endOfPathComponentId = attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule][lastComponentIndex];
        // console.log(`currentOriginatingModule is ${currentOriginatingModule}`)
        // console.log(`currentAttackedModule is ${currentAttackedModule}`)
        // console.log(`n is ${n}`)
        // console.log(`endOfPathComponentId is ${endOfPathComponentId}`)
        // console.log(`type is ${projectById[endOfPathComponentId].type}`)
        // console.log(["controlUnit", "micro"].includes(projectById[endOfPathComponentId].type))
        if (projectById[endOfPathComponentId].type == "commLine") { // if the last item on the attack path is a commLine
            // let componentIndexInLine = projectById[endOfPathComponentId].terminalComponentId.indexOf(secondToEndOfPathComponentId); // which terminal is the last component connected to
            let connectedComponentArray = projectById[endOfPathComponentId].terminalComponentId.slice(0); // clone terminal component array
            // connectedComponentArray.splice(componentIndexInLine, 1); // remove the last component from the loop, in case the last component is both a sender and a receiver
            let wrongComLineLength = wrongCommLine.length; // record to compare whether wrongComLine array has changed
            // console.log(`connectedComponentArray is ${connectedComponentArray}`)
            for (let [currentTerminalComponentIdIndex, currentTerminalComponentId] of connectedComponentArray.entries()) { // loop through the terminal components of the line
                // console.log(`currentTerminalComponentId is ${currentTerminalComponentId}`)
                // console.log(`tempIntermediateModuleId is ${tempIntermediateModuleId}`)
                if (currentTerminalComponentId == currentAttackedModule) { // if this is the attacked component, it will not be part of the intermediateModuleId array
                    attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].push(currentTerminalComponentId); // add the component id to the attack path
                    break
                // } else if (tempIntermediateModuleId.includes(currentTerminalComponentId)) { // if the connected module is one of the intermediate modules
                } else { // otherwise keep trying
                    let indexOfIntermediateModuleId = connectivityFeatureChain[currentFeatureChain].intermediateModuleId.indexOf(currentTerminalComponentId);
                    // featureMatchCheck makes sure the featureChain feature is accessible for currentLine
                    let featureMatchCheck = projectById[endOfPathComponentId].terminalComponentFeatureIndex[currentTerminalComponentIdIndex].includes(connectivityFeatureChain[currentFeatureChain].intermediateModuleFeatureIndex[indexOfIntermediateModuleId]);
                    // wrongPathCheck here makes sure current component is not in the wrong path that has been tested before
                    let wrongPathCheck = !wrongComponent.includes(currentTerminalComponentId);
                    // previousPathCheck makes sure this component is not already in the path (would lead the path back to where it started)
                    let previousPathCheck = !attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].includes(currentTerminalComponentId);
                    // console.log(`featureMatchCheck is ${featureMatchCheck}. wrongPathCheck is ${wrongPathCheck}. previousPathCheck is ${previousPathCheck}`)
                    if (featureMatchCheck && wrongPathCheck && previousPathCheck) {
                        attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].push(currentTerminalComponentId); // add the component id to the attack path
                        if (tempIntermediateModuleId.includes(currentTerminalComponentId)) {
                            let tempIndex = tempIntermediateModuleId.indexOf(currentTerminalComponentId);
                            tempIntermediateModuleId.splice(tempIndex, 1); // remove the intermediate module after its location is identified in the attack path array
                        }
                        break
                    } else if (connectedComponentArray.every(elem=>[...wrongComponent, ...attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]].includes(elem))) {
                        // if none of the components connected to last commLine works, maybe the last commLine is wrong. need to step back further and try new path.
                        wrongCommLine.push(attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].pop()); // remove the last element and add it to wrongCommLine
                        // console.log(`wrongCommLine is updated: ${wrongCommLine}`)
                        break
                    } else if (previousPathCheck && wrongPathCheck) {
                        // if this component is not already on the path, it does not belong to the path
                        wrongComponent.push(currentTerminalComponentId);
                    }
                }
            }
            // let attackPathNotChanged = attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].length === lastComponentIndex+1;
            // let wrongCommLineNotChanged = wrongCommLine.length === wrongComLineLength;
            // if (attackPathNotChanged && wrongCommLineNotChanged) { // if neither changed, something is wrong
            //     const errorMsg = `The feature chain path algorithm failed when analyzing the feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" 
            //     around the component ` + projectById[endOfPathComponentId].nickName + `. Please double check your model settings related to this feature chain.`;
            //     throw new Error(errorMsg);
            // }
        } else if (["controlUnit", "micro"].includes(projectById[endOfPathComponentId].type)) { // if the last item on the attack path is a control unit or micro
            let indexOfFeatureChainFeatureInComponent = projectById[endOfPathComponentId].featureChainId.indexOf(currentFeatureChain); // get index of feature in this component
            let wrongComponentLength = wrongComponent.length; // record to compare whether wrongComponent array has changed
            for (let connectedLine of projectById[endOfPathComponentId].lineId) { // loop through the connected lines
                let componentIndexInLine = projectById[connectedLine].terminalComponentId.indexOf(endOfPathComponentId); // which terminal is the component is connected to
                // console.log(projectById[connectedLine].terminalComponentFeatureIndex[componentIndexInLine])
                // console.log(`indexOfFeatureChainFeatureInComponent is ${indexOfFeatureChainFeatureInComponent}`)
                // featureMatchCheck makes sure the featureChain feature is accessible for currentLine
                let featureMatchCheck = projectById[connectedLine].terminalComponentFeatureIndex[componentIndexInLine].includes(indexOfFeatureChainFeatureInComponent); // if this feature chain feature is accessible
                // wrongPathCheck makes sure this commLine is not in the wrong path that has been tested before
                let wrongPathCheck = !wrongCommLine.includes(connectedLine);
                // previousPathCheck makes sure this commLine is not already in the path (would lead the path back to where it started)
                let previousPathCheck = !attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].includes(connectedLine);
                if (featureMatchCheck && wrongPathCheck && previousPathCheck) {
                    attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].push(connectedLine); // add the line id to the attack path
                    break
                } else if (projectById[endOfPathComponentId].lineId.every(elem=>[...wrongCommLine, ...attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]]
                        .includes(elem))) {
                    // if none of the commLines connected to endOfPathComponent works, maybe the endOfPath micro or controlUnit is wrong. need to step back further and try new path.
                    wrongComponent.push(attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].pop()); // remove the last element and add it to wrongComponent
                    break
                } else if (previousPathCheck && wrongPathCheck) {
                    // if this line is not already on the path, it doesn't belong to the path
                    wrongCommLine.push(connectedLine);
                }
            }
        }
        // update the end of chain index
        lastComponentIndex = attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule].length - 1;
        if (lastComponentIndex === 0 && n===1) { // if the path still only has 1 element when this loop is ran for the first time, it means the feature chain feature is not carried on any commLine
            const errorMsg = `The feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" in ` + 
            projectById[currentOriginatingModule].nickName + ` is not carried by any of its communication lines.`;
            throw new Error(errorMsg);
        } else if (lastComponentIndex === 0) { // if the path still only has 1 element, it means the feature chain path is not complete
            const errorMsg = `The path of feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" is not complete. `
            + `Features linked by the feature chain have to be connected and accessible by communication lines.`;
            throw new Error(errorMsg);
        }
        n++;
        // console.log(`n=${n}`)
        // console.log(`attackPathListFeatureChain in composeFeatureChainAttackPath() is `)
        // console.dir(attackPathListFeatureChain)
        // console.log(attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule][lastComponentIndex])
        // console.log(`currentAttackedModule is ${currentAttackedModule}`)
        // console.log(`lastComponentIndex is ${lastComponentIndex}`)
        if (n === loopLimit) { // if loops too many times, the algorithm may not be robust enough to handle the network topology. stop trying.
            const errorMsg = `The feature chain "${connectivityFeatureChain[currentFeatureChain].featureChainNickName}" cannot be evaluated. `
            + `It could be due to the network topology.`;
            throw new Error(errorMsg);
        }
    }
    // console.log(`the returned value are: `)
    // console.dir([tempIntermediateModuleId, attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]]);
    // console.dir([attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]])
    return [tempIntermediateModuleId, attackPathListFeatureChain[currentOriginatingModule][currentAttackedModule]]
}