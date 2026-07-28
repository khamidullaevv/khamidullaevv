// Tiny JSX-like element builder for satori — no React needed.
// h('div', { style: {...} }, child1, child2, ...)
export function h(type, props = {}, ...children) {
  const flatChildren = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : flatChildren,
    },
  };
}
