import { version } from '../../package.json';

export const environment = {
  production: true,
  backendApiUrl: "https://evbmjfeizk.execute-api.us-east-1.amazonaws.com/trial/api/",
  protectModuleLicense: true,
  vulnerabilityModuleLicense: true,
  deploymentStatus: "trial",
  version: version + "-trial",
  industry: "automotive",
  complianceModules:["org", "proj", "dist", "concept", "dev", "v&v", "post", "continual"],
  loginImageDir: "../assets/images/vultaraLogin.jpg"
};
