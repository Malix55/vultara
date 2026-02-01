const objOperation = require("../service/objOperation");
const httpService = require("../service/httpService");
const mainAlgo = require("./main");


async function mainProcess(priorResult, newResult, project) { //
    let outputArray = [];
    let priorResultThreatRuleEngineIdArray = [];
    priorResult.forEach(threat => { // stores threatRuleEngineId of priorResult
        if (threat.threatSource == "ruleEngine") { // only care ruleEngine generated threats
            priorResultThreatRuleEngineIdArray.push(threat.threatRuleEngineId);
        } else { // need to keep threats from other sources in order to use the index of priorResultThreatRuleEngineIdArray on priorResult array
            priorResultThreatRuleEngineIdArray.push("not applicable");
        }
    });
    let priorResultThreatIndexToRemove = [];
    let priorResultThreatIndexToHighlight = [];
    // console.log(`priorResult.length is ${priorResult.length}`)
    // console.log(`newResult.length is ${newResult.length}`)
    const deletedThreatId = project.project.deletedThreatId ? project.project.deletedThreatId : [];
    function filterNewResult(threatItem) { // check which threats from the new result apply, based on rule engine hash
        // Rules:
        // if a threat was previously generated and reviewed, ignore the newly generated one;
        // if a threat was previously generated but permanently deleted, ignore the new threat;
        // if a threat was previously generated and untouched, use the newly generated one to replace the old one;
        // if a threat was never previously generated, add the new one;
        if (deletedThreatId.includes(threatItem.threatRuleEngineId)){
            return false;
        }

        if ((threatItem.threatSource == "ruleEngine") && (priorResultThreatRuleEngineIdArray.includes(threatItem.threatRuleEngineId))) { // if a new result was identified before
            // let priorResultThreatIndex = priorResultThreatRuleEngineIdArray.indexOf(threatItem.threatRuleEngineId); // the index of a prior threat that has an update
            // console.log(`priorResultThreatIndex is ${priorResultThreatIndex}`)
            // console.log(`new result threatRuleId is ${threatItem.threatRuleEngineId}`);
            // console.log(`!priorResult[priorResultThreatIndex].lastModifiedBy is ${!priorResult[priorResultThreatIndex].lastModifiedBy}`);
            // console.log(`!priorResult[priorResultThreatIndex].reviewed is ${!priorResult[priorResultThreatIndex].reviewed}`);
            priorResult.forEach((priorThreatItem, priorThreatItemIndex) => { // not using .indexOf() method here because there may be more items having the same threatRuleEngineId
                if (priorThreatItem.threatRuleEngineId == threatItem.threatRuleEngineId) { // for each prior item that has the same threatRuleEngineId with a new item
                    if (!priorThreatItem.reviewed) { // if that prior threat item is not reviewed, replace it
                        if (priorResultThreatIndexToRemove.includes(priorThreatItemIndex)) { // if it was added to the list before, ignore

                        } else {
                            priorResultThreatIndexToRemove.push(priorThreatItemIndex); // if it was not added to the list, add it to the list to be removed
                        }
                    } else { // if the prior threat item was reviewed ignore new threat
                        // threatItem.highlight = "_highlight";
                        // threatItem.notes = "Duplicate alert from threat engine: This new threat may duplicate an existing threat.";
                        // priorResultThreatIndexToHighlight.push(priorThreatItemIndex);
                        // console.log(`highlight ${priorThreatItemIndex}`)
                    }
                }
            })
            let priorResultThreatIndex = priorResultThreatRuleEngineIdArray.indexOf(threatItem.threatRuleEngineId); // the index of a prior threat that has an update
            if (!priorResult[priorResultThreatIndex].reviewed) {
                return true
            } else { // if that prior threat item is reviewed or is modified, ignore this new threat
                return false
            }
        } else { // if a new result was not identified before, add to the next round of result
            return true
        }
    }
    let newResultProcessed = newResult.filter(filterNewResult); // items from newResult that will be reported in this run
    // console.log(`newResultProcessed.length is ${newResultProcessed.length}`);
    // console.log(`after newResult.filter(filterNewResult), priorResultThreatIndexToRemove.length is ${priorResultThreatIndexToRemove.length}`);
    // console.log(`priorResultThreatIndexToHighlight is ${priorResultThreatIndexToHighlight}`)
    if (priorResultThreatIndexToHighlight.length > 0) {
        for (let i = 0; i < priorResultThreatIndexToHighlight.length; i++) {
            priorResult[priorResultThreatIndexToHighlight[i]].highlight = "_highlight";
            if (priorResult[priorResultThreatIndexToHighlight[i]].notes && (priorResult[priorResultThreatIndexToHighlight[i]].notes != "")) {
                priorResult[priorResultThreatIndexToHighlight[i]].notes = priorResult[priorResultThreatIndexToHighlight[i]].notes + "\n" +
                    "Duplicate alert from threat engine: This existing threat may duplicate a new threat.";
            } else {
                priorResult[priorResultThreatIndexToHighlight[i]].notes = "Duplicate alert from threat engine: This existing threat may duplicate a new threat."
            }
        }
    }

    let newResultThreatRuleEngineIdArray = [];
    newResult.forEach(threat => { // stores threatRuleEngineId of newResult
        if (threat.threatSource == "ruleEngine") { // only care ruleEngine generated threats
            newResultThreatRuleEngineIdArray.push(threat.threatRuleEngineId);
        } else { // need to keep threats from other sources in order to use the index of priorResultThreatRuleEngineIdArray on priorResult array
            newResultThreatRuleEngineIdArray.push("not applicable");
        }
    });
    function filterPriorResult(threatItem, threatItemIndex) { // check which threats from the prior result no longer apply
        // Rules:
        // if a prior threat is not shown in the new result, check the prior threat's threatSource. If it's ruleEngine, highlight if the result is
        //      reviewed, or delete it if the result is not reviewed. If it's not rule Engine, ignore.
        if (!newResultThreatRuleEngineIdArray.includes(threatItem.threatRuleEngineId)) { // if a prior result is no longer in the new result
            if (threatItem.threatSource == "ruleEngine") { // if that prior result was generated by the rule engine, it means changes in the new model have eliminated this threat
                if (threatItem.reviewed) {
                    threatItem.highlight = "_highlight";
                    if (threatItem.notes && (threatItem.notes != "")) {
                        threatItem.notes = threatItem.notes + "\n" +
                            "Alert from threat engine: Changes in the model may have made this threat irrelevant. Please double check. "
                            + new Date().toISOString();
                    } else {
                        threatItem.notes = "Alert from threat engine: Changes in the model may have made this threat irrelevant. Please double check. "
                            + new Date().toISOString();
                    }
                    // return true
                } else {
                    if (priorResultThreatIndexToRemove.includes(threatItemIndex)) { // if this threat is already in the to-be-deleted array, ignore

                    } else { // otherwise, add it to the to-be-deleted array
                        priorResultThreatIndexToRemove.push(threatItemIndex);
                    }
                    // return true
                }
            } else {
                // return true
            }
        } else {
            // return true
        }
        return true // always return true
    }
    let priorResultProcessed = priorResult.filter(filterPriorResult); // items from priorResult that will stay


    priorResultThreatIndexToRemove = priorResultThreatIndexToRemove.sort((a, b) => a - b); // sort in ascending order, for the same reason as the following for loop in reverse order
    // console.log(`priorResultProcessed.length is ${priorResultProcessed.length}`);
    // console.log(`priorResultThreatIndexToRemove.length is ${priorResultThreatIndexToRemove.length}`);
    for (let i = priorResultThreatIndexToRemove.length - 1; i >= 0; i--) { // go through the array in reverse order, to not mess up the indexes of the yet-to-be-removed items
        // console.log(`before each splice, priorResult.length is ${priorResult.length}. this round i is ${i}, priorResultThreatIndexToRemove[i] is ${priorResultThreatIndexToRemove[i]}`);
        priorResultProcessed.splice(priorResultThreatIndexToRemove[i], 1); // remove the duplicated and untouched threat from prior result. the new one will be added
        // console.log(`after each splice, priorResult.length is ${priorResult.length}`);
    };
    // console.log(`after splice, priorResultProcessed.length is ${priorResultProcessed.length}`);
    let newUserAddedThreatArray = [];
    newUserAddedThreatArray = await doubleCheckUserAddedThreat(project, priorResultProcessed); // check user added threat library
    outputArray = priorResultProcessed.concat(newResultProcessed).concat(newUserAddedThreatArray);
    return outputArray
}
module.exports.mainProcess = mainProcess;

async function doubleCheckUserAddedThreat(project, priorResult) {
    let userAddedThreatArray = await mainAlgo.checkUserAddedThreat(project);
    let priorResultThreatIdArray = []; // will store threat id of prior results
    userAddedThreatArray.forEach(threat => priorResultThreatIdArray.push(threat.id));
    function filterOutDuplicates(threatItem) {
        if (priorResultThreatIdArray.includes(threatItem.id)) { // if the id exists in priorResult, don't add
            return false
        } else {
            return true
        }
    };
    let newUserAddedThreatArray = userAddedThreatArray.filter(filterOutDuplicates);
    return newUserAddedThreatArray
}

