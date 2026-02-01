const { SageMakerRuntimeClient, InvokeEndpointCommand } = require("@aws-sdk/client-sagemaker-runtime");
const sageMakerEndPointName = require("../config").sageMakerEndPointName;

// Initiate argument values for SageMaker API. Call the API EP and retrieve response body for data driven feasibility value
const getMachineLearningModel = async (...args) => {
    const asset = args[0];
    const attackPath = args[1];
    const attackSurfaceSensorInput = args[2];
    const securityPropertyCia = args[3];
    const securityPropertyStride = args[4];
    const transmissionMedia = args[5];
    const baseProtocol = args[6];
    const appProtocol = args[7];
    const secureProtocol = args[8];
    const assetData = getAssetsModel(asset);
    const attackPathData = [attackPath.length];
    const attackSurfaceSensorInputData = attackSurfaceSensorInput === true ? [1] : [0];
    const securityPropertyCiaData = getSecurityPropertyCiaModel(securityPropertyCia);
    const securityPropertyStrideData = getSecurityPropertyStrideModel(securityPropertyStride);
    const transmissionMediaData = getTransmissionMediaModel(transmissionMedia);
    const baseProtocolData = getBaseProtocolModel(baseProtocol);
    const appProtocolData = getAppProtocolModel(appProtocol);
    const securityProtocolData = getSecurityProtocolModel(secureProtocol);
    const data = [...assetData, ...attackPathData, ...attackSurfaceSensorInputData,
    ...securityPropertyCiaData, ...securityPropertyStrideData, ...transmissionMediaData,
    ...baseProtocolData, ...appProtocolData, ...securityProtocolData];
    return await callSageMaker(data.join(","));
}

// Call AWS SageMaker API call with proper EP and body data
const callSageMaker = async (data) => {
    const client = new SageMakerRuntimeClient({ region: "us-east-1" });
    const params = {
        EndpointName: sageMakerEndPointName,
        ContentType: "text/csv",
        Body: data
    };
    const command = new InvokeEndpointCommand(params);
    try {
        const data = await client.send(command);
        var string = new TextDecoder().decode(data.Body);
        return JSON.parse(string);
    } catch (error) {
        return [];
    }
}

// Prepare securityProtocol model via mapping securityProtocol value. Return 0/1 data combination according to protocol existance.
const getSecurityProtocolModel = (secureProtocol) => {
    const secureProtocolData = [];
    if (secureProtocol.includes("TLS11orearlier")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("TLS12")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("TLS13")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("IPSec")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("SecOC")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("WEP")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("WPA")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("WPA2")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    if (secureProtocol.includes("SSH")) {
        secureProtocolData.push(1);
    } else {
        secureProtocolData.push(0);
    }

    return secureProtocolData;
}

// Prepare appProtocol model via mapping appProtocol value. Return 0/1 data combination according to protocol existance.
const getAppProtocolModel = (appProtocol) => {
    const appProtocolData = [];
    if (appProtocol.includes("HTTP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("FTP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("UDS")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("MQTT")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("IP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("DoIP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("SOMEIP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("DHCP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("ICMP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("ARP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("AVB")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("SMTP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("SNMP")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    if (appProtocol.includes("DNS")) {
        appProtocolData.push(1);
    } else {
        appProtocolData.push(0);
    }

    return appProtocolData;
}

// Prepare baseProtocol model via mapping baseProtocol value. Return 0/1 data combination according to protocol existance sequence.
const getBaseProtocolModel = (baseProtocol) => {
    switch (baseProtocol) {
        case "CANFD":
            return [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "Ethernet":
            return [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "CAN":
            return [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "SPIUARTI2C":
            return [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "NFCRFID":
            return [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "LIN":
            return [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "USB":
            return [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "Cellular":
            return [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "GNSS":
            return [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "Bluetooth":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "BluetoothLE":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        case "WiFi":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
        case "JTAG":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
        case "LVDS":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
        case "DSI":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
        case "OpticalCameraMachineVision":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
        case "OpticalCameraHumanVision":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
        case "RADAR":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];
        case "LiDAR":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];
        case "80211p":
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

        default:
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
}

// Prepare transmissionMedia model via mapping transmissionMedia value. Return 0/1 data combination according to transmissionMedia existance sequence.
const getTransmissionMediaModel = (transmissionMedia) => {
    switch (transmissionMedia) {
        case "physicalWire":
            return [1, 0, 0];
        case "shortWireless":
            return [0, 1, 0];
        case "longWireless":
            return [0, 0, 1];
        default:
            return [0, 0, 0];
    }
}

// Prepare securityPropertyStride model with combination of 0/1. Accept the sequence according to "s", "t", "r", "i", "d", and "e"
const getSecurityPropertyStrideModel = (securityPropertyStride) => {
    let securityPropertyStrideData = [];
    switch (securityPropertyStride) {
        case "s":
            securityPropertyStrideData = [1, 0, 0, 0, 0, 0];
            break;
        case "t":
            securityPropertyStrideData = [0, 1, 0, 0, 0, 0];
            break;
        case "r":
            securityPropertyStrideData = [0, 0, 1, 0, 0, 0];
            break;
        case "i":
            securityPropertyStrideData = [0, 0, 0, 1, 0, 0];
            break;
        case "d":
            securityPropertyStrideData = [0, 0, 0, 0, 1, 0];
            break;
        case "e":
            securityPropertyStrideData = [0, 0, 0, 0, 0, 1];
            break;

        default:
            securityPropertyStrideData = [0, 0, 0, 0, 0, 0];
            break;
    }

    return securityPropertyStrideData;
}

// Prepare securityPropertyCia model with combination of 0/1. Accept the sequence according to "c", "i", and "a"
const getSecurityPropertyCiaModel = (securityPropertyCia) => {
    let securityPropertyCiaData = [];
    switch (securityPropertyCia) {
        case "c":
            securityPropertyCiaData = [1, 0, 0];
            break;
        case "i":
            securityPropertyCiaData = [0, 1, 0];
            break;
        case "a":
            securityPropertyCiaData = [0, 0, 1];
            break;

        default:
            securityPropertyCiaData = [0, 0, 0];
            break;
    }
    return securityPropertyCiaData;
}

// Prepare data model for asset - assetType and subType with combination of 0/1.
const getAssetsModel = (asset) => {
    let assetType = [];
    switch (asset.assetType) {
        case "dataInTransit":
            assetType = [1, 0, 0, 0, 0, 0];
            break;
        case "dataAtRest":
            assetType = [0, 1, 0, 0, 0, 0];
            break;
        case "process":
            assetType = [0, 0, 1, 0, 0, 0];
            break;
        case "ComputingResource":
            assetType = [0, 0, 0, 1, 0, 0];
            break;
        case "memoryResource":
            assetType = [0, 0, 0, 0, 1, 0];
            break;
        case "bandwidth":
            assetType = [0, 0, 0, 0, 0, 1];
            break;

        default:
            assetType = [0, 0, 0, 0, 0, 0];
            break;
    }

    let subType = [];
    switch (asset.subType) {
        case "generalData":
            subType = [1, 0, 0, 0, 0, 0];
            break;
        case "code":
            subType = [0, 1, 0, 0, 0, 0];
            break;
        case "configData":
            subType = [0, 0, 1, 0, 0, 0];
            break;
        case "securityData":
            subType = [0, 0, 0, 1, 0, 0];
            break;
        case "log":
            subType = [0, 0, 0, 0, 1, 0];
            break;
        case "password":
            subType = [0, 0, 0, 0, 0, 1];
            break;

        default:
            subType = [0, 0, 0, 0, 0, 0];
            break;
    }

    return [...assetType, ...subType];
}

module.exports.getMachineLearningModel = getMachineLearningModel;