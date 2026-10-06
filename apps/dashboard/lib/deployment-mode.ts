// Public Self-Host tree. Josh renames this onto `deployment-mode.ts`.
// Mode is fixed: a missing or overridden NEXT_PUBLIC_DEPLOYMENT_MODE cannot
// select Cloud behavior, and the Cloud modules this flag used to unlock are
// not in this tree.

export type DeploymentMode = 'cloud' | 'oss';

export function getDeploymentMode(): DeploymentMode {
  return 'oss';
}

export function isOssDeployment(): boolean {
  return true;
}

export function isCloudDeployment(): boolean {
  return false;
}
