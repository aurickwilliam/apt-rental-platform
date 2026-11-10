// RNTL v14 renders through `test-renderer`, whose tree holds host elements only,
// so props of a composite *class* component (FlatList, RefreshControl, …) are no
// longer reachable from the screen. These helpers read them from the component's
// own `render` calls instead — the instance is the render call's `this`.

type ClassComponent = { prototype: { render: (...args: never[]) => unknown } };
type RenderedInstance<P> = { props: P };

/** Spy on a class component's render. Call `restore()` when the test is done. */
export function spyOnClassComponent<P = Record<string, any>>(component: ClassComponent) {
  const spy = jest.spyOn(component.prototype, "render");
  const instances = () => spy.mock.contexts as RenderedInstance<P>[];
  return {
    /** Instance behind the most recent render. */
    latest: () => {
      const all = instances();
      if (all.length === 0) throw new Error("spyOnClassComponent: component never rendered");
      return all[all.length - 1];
    },
    /** Props of the most recent render. */
    latestProps: () => {
      const all = instances();
      if (all.length === 0) throw new Error("spyOnClassComponent: component never rendered");
      return all[all.length - 1].props;
    },
    /** Props of the latest render of each distinct mounted instance, in mount order. */
    latestPropsPerInstance: () => {
      const latest = new Map<RenderedInstance<P>, P>();
      for (const instance of instances()) latest.set(instance, instance.props);
      return [...latest.values()];
    },
    restore: () => spy.mockRestore(),
  };
}
