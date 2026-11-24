import { render, screen } from '@testing-library/react-native';
import ApartmentDetailsSection from './ApartmentDetailsSection';
import ApartmentDescriptionSection from './ApartmentDescriptionSection';
import { queryAllWithClasses } from '../../../../../tests/support/testTraversal';

jest.mock('hooks/useTheme', () => ({
  useColors: () => ({ colors: { textPrimary: '#333333', gray500: '#626B73' } }),
}));
jest.mock('@tabler/icons-react-native', () => ({
  IconBuilding: () => null,
  IconUsers: () => null,
  IconHome: () => null,
  IconCalendar: () => null,
}));
jest.mock('heroui-native', () => ({ Button: () => null }));
jest.mock('@/components/display/SectionHeader', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text: NativeText } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: ({ title }: { title: string }) => React.createElement(NativeText, null, title) };
});

it('gives each detail a separate card rather than one outer card', async () => {
  await render(<ApartmentDetailsSection apartment={null} />);
  // Four DetailBlocks, each carrying its own card treatment.
  expect(
    queryAllWithClasses(screen.root!, 'bg-surface rounded-2xl border border-border'),
  ).toHaveLength(4);
});

it('keeps the description heading outside the description body card', async () => {
  await render(<ApartmentDescriptionSection description="A lovely home" />);
  expect(screen.getByText('Everything About Your Apartment')).toBeTruthy();

  // The card body (SectionCard appearance="card") carries the description and
  // its hidden measurement copy…
  const bodyCards = queryAllWithClasses(
    screen.root!,
    'bg-surface rounded-3xl border border-border p-5',
  );
  expect(bodyCards).toHaveLength(1);
  const cardTexts = bodyCards[0].queryAll((node) => node.type === 'Text');
  expect(cardTexts.some((node) => node.props.children === 'A lovely home')).toBe(true);
  // …but the section heading and its icon stay outside the card.
  expect(cardTexts.some((node) => node.props.children === 'Everything About Your Apartment')).toBe(false);
});
