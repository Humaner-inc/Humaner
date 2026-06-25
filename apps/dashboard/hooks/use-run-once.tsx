import * as React from 'react';

export function useRunOnce<T>(callback: () => T | Promise<T>): void {
  const hasRun = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (hasRun.current) {
      return;
    }

    hasRun.current = true;
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
