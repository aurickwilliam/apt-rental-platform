import SectionCard from './SectionCard';

describe('apartment section presentation', () => {
  it('can opt into a rounded surface card for the selected sections', () => {
    const section = SectionCard({ children: 'Card content', appearance: 'card' });
    expect(section.props.className).toContain('bg-surface');
    expect(section.props.className).toContain('rounded-3xl');
    expect(section.props.className).toContain('p-5');
    expect(section.props.className).not.toContain('border-b ');
  });
  it('uses flat sections for mobile details and the shared listing preview', () => {
    const section = SectionCard({ children: 'Section content', className: 'gap-3' });
    expect(section.props.className).toContain('mx-5');
    expect(section.props.className).toContain('py-5');
    expect(section.props.className).toContain('border-b');
    expect(section.props.className).toContain('gap-3');
    expect(section.props.className).not.toMatch(/bg-|rounded-|shadow-/);
    expect(section.props.children).toBe('Section content');
  });
});
