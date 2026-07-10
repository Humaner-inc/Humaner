import { getTestEnvConfig } from "@/lib/env";

import { DemoLandingPage } from "@/components/demo-landing-page";

export default function TestPage(): React.JSX.Element {
  const config = getTestEnvConfig();

  return <DemoLandingPage config={config} />;
}
