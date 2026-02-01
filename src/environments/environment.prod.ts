import { version } from '../../package.json';

export const environment = {
  production: true,
  backendApiUrl: "https://8l2pig761j.execute-api.us-east-1.amazonaws.com/me-prod/api/",
  protectModuleLicense: false,
  vulnerabilityModuleLicense: true,
  deploymentStatus: "prod",
  version: version,
  industry: "automotive",
  complianceModules:["concept"],
  loginImageDir: "../assets/images/magnaElectronicsLogin2.jpg"
};
