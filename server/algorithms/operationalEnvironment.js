const objOperation = require("../service/objOperation");


function analyzeOpEnv(threat, attackPathVar, projectById) {
    let output = {
        attackVector: "",
        window: 1
    };
    let componentType = objOperation.getComponentPropertyById(attackPathVar[0], projectById, "type"); // get the component type of the attack surface
    if (componentType == "commLine") {
        let transmissionMedia = objOperation.getComponentPropertyById(attackPathVar[0], projectById, "transmissionMedia"); // the attack surface wire's transmission media determines attack vector
        switch (transmissionMedia) {
            case "physicalWire":
                output.attackVector = "Local";
                output.window = 4;
                break
            case "shortWireless":
                output.attackVector = "Adjacent";
                output.window = 1;
                break
            case "longWireless":
                output.attackVector = "Network";
                output.window = 0;
                break
        }
    } else if (componentType == "micro") {
        output.attackVector = "Physical";
        output.window = 10;
    } else if ((componentType == "controlUnit") && (objOperation.getComponentPropertyById(attackPathVar[0], projectById, "model") != "Actor")) {
        output.attackVector = "Physical";
        output.window = 10;
    }
    return output;
}
module.exports.analyzeOpEnv = analyzeOpEnv;