const compilerHookRulesOff = {
  'react-hooks/config': 'off',
  'react-hooks/error-boundaries': 'off',
  'react-hooks/gating': 'off',
  'react-hooks/globals': 'off',
  'react-hooks/immutability': 'off',
  'react-hooks/incompatible-library': 'off',
  'react-hooks/preserve-manual-memoization': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/refs': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/set-state-in-render': 'off',
  'react-hooks/static-components': 'off',
  'react-hooks/unsupported-syntax': 'off',
  'react-hooks/use-memo': 'off'
};

function pluginNameFromRule(rule) {
  if (!rule.includes('/')) {
    return null;
  }
  if (rule.startsWith('@')) {
    const secondSlash = rule.indexOf('/', rule.indexOf('/') + 1);
    return secondSlash === -1 ? rule : rule.slice(0, secondSlash);
  }
  return rule.slice(0, rule.indexOf('/'));
}

export function overlayPluginRules(blocks, extraRules) {
  return blocks.map((block) => {
    const plugins = block?.plugins ?? {};
    const applicable = {};

    for (const [rule, value] of Object.entries(extraRules)) {
      const pluginName = pluginNameFromRule(rule);
      if (!pluginName) {
        if (block?.files || block?.rules || block?.plugins) {
          applicable[rule] = value;
        }
        continue;
      }

      if (plugins[pluginName] || block?.rules?.[rule] !== undefined) {
        applicable[rule] = value;
      }
    }

    if (Object.keys(applicable).length === 0) {
      return block;
    }

    return {
      ...block,
      rules: {
        ...block.rules,
        ...applicable
      }
    };
  });
}

export function withLegacyReactHooks(blocks, extraRules = {}) {
  return overlayPluginRules(blocks, {
    ...compilerHookRulesOff,
    ...extraRules
  });
}
