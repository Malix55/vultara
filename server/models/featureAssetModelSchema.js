const mongoose = require("mongoose");

const FeatureAssetSchema = new mongoose.Schema({
    name: {
        type: String,
        index: true
    },
    featureType: {
        type: String, 
        index: true 
    },
    assets: [String],
    assetsId: [String],
    assets0: {type:[String],default:undefined},
    assetsId0: {type:[String],default:undefined},
    assets1: {type:[String],default:undefined},
    assetsId1: {type:[String],default:undefined},
    assets2: {type:[String],default:undefined},
    assetsId2: {type:[String],default:undefined},
    assets3: {type:[String],default:undefined},
    assetsId3: {type:[String],default:undefined},
    assets4: {type:[String],default:undefined},
    assetsId4: {type:[String],default:undefined},
    assets5: {type:[String],default:undefined},
    assetsId5: {type:[String],default:undefined},
    assets6: {type:[String],default:undefined},
    assetsId6: {type:[String],default:undefined},
    assets7: {type:[String],default:undefined},
    assetsId7: {type:[String],default:undefined},
    assets8: {type:[String],default:undefined},
    assetsId8: {type:[String],default:undefined},
    assets9: {type:[String],default:undefined},
    assetsId9: {type:[String],default:undefined},
    assets10: {type:[String],default:undefined},
    assetsId10: {type:[String],default:undefined},
}, { timestamps: true });
// featureAssetModel = mongoose.model('featureAssetLib', featureAssetSchema, 'featureAssetLib');
// module.exports.featureAssetModel = featureAssetModel;
module.exports.FeatureAssetSchema = FeatureAssetSchema;

// assetLib schema is defined in threatLibModelSchema.js
