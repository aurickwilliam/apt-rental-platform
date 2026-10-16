import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import ApartmentDetailsSection from './ApartmentDetailsSection';
import ApartmentDescriptionSection from './ApartmentDescriptionSection';
import SectionCard from '../SectionCard';

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

it('gives each detail a separate card rather than one outer card', () => {
  const result = render(<ApartmentDetailsSection apartment={null} />);
  const cards = result.UNSAFE_getAllByType(View).filter(node =>
    node.props.className?.includes('bg-surface rounded-2xl border border-border')
  );
  expect(cards).toHaveLength(4);
  expect(result.UNSAFE_queryAllByType(SectionCard)).toHaveLength(0);
});

it('keeps the description heading outside the description body card', () => {
  const result = render(<ApartmentDescriptionSection description="A lovely home" />);
  expect(screen.getByText('Everything About Your Apartment')).toBeTruthy();
  const bodyCard = result.UNSAFE_getByType(SectionCard);
  expect(bodyCard.props.appearance).toBe('card');
  const bodyTexts = bodyCard.findAllByType(Text);
  expect(bodyTexts.some(node => node.props.children === 'A lovely home')).toBe(true);
  expect(bodyTexts.some(node => node.props.children === 'Everything About Your Apartment')).toBe(false);
});
