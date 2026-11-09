import { initialState, useTutorialStore } from './useTutorialStore';

describe('useTutorialStore', () => {
  beforeEach(() => useTutorialStore.getState().reset());

  it('starts at the welcome card for the chosen portal', () => {
    useTutorialStore.getState().start('landlord', 'auto');
    expect(useTutorialStore.getState()).toMatchObject({ portal: 'landlord', mode: 'auto', stage: 'welcome', stepIndex: 0 });
  });

  it('walks forward and back through the steps and ends on the completion card', () => {
    const store = useTutorialStore.getState();
    store.start('tenant', 'replay');
    store.begin();
    expect(useTutorialStore.getState()).toMatchObject({ stage: 'steps', stepIndex: 0 });

    useTutorialStore.getState().next(3);
    useTutorialStore.getState().next(3);
    expect(useTutorialStore.getState().stepIndex).toBe(2);

    useTutorialStore.getState().back();
    expect(useTutorialStore.getState().stepIndex).toBe(1);

    useTutorialStore.getState().next(3);
    useTutorialStore.getState().next(3);
    expect(useTutorialStore.getState().stage).toBe('done');
  });

  it('never goes back past the first step', () => {
    useTutorialStore.getState().start('tenant', 'auto');
    useTutorialStore.getState().begin();
    useTutorialStore.getState().back();
    expect(useTutorialStore.getState().stepIndex).toBe(0);
  });

  it('closing clears the tour', () => {
    useTutorialStore.getState().start('tenant', 'auto');
    useTutorialStore.getState().close();
    expect(useTutorialStore.getState()).toMatchObject(initialState);
  });
});
