import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BundeslandSelect } from '../src/components/BundeslandSelect';
import type { BundeslandCode } from '../src/lib/holidays/types';

function setup(value: BundeslandCode = 'BY') {
  const onChange = vi.fn();
  render(<BundeslandSelect value={value} onChange={onChange} />);
  return { onChange, trigger: screen.getByRole('combobox') };
}

describe('BundeslandSelect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders trigger with current state name', () => {
    const { trigger } = setup('BY');
    expect(trigger).toHaveTextContent('Bayern');
  });

  it('listbox is not visible initially', () => {
    setup('BY');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens listbox on trigger click and shows all 16 options', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    await user.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(16);
  });

  it('closes on Escape and returns focus to trigger', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('selects option on click and calls onChange', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger, onChange } = setup('BY');
    await user.click(trigger);
    const sachsen = screen.getByRole('option', { name: 'Sachsen' });
    await user.click(sachsen);
    expect(onChange).toHaveBeenCalledWith('SN');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys and selects with Enter', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger, onChange } = setup('BW');
    await user.click(trigger);
    // BW is index 0; ArrowDown moves to index 1 (BY)
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('BY');
  });

  it('type-ahead jumps to matching option', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    await user.click(trigger);
    await user.keyboard('S');
    // 'S' should highlight Saarland (first option starting with S)
    const saarland = screen.getByRole('option', { name: 'Saarland' });
    expect(saarland).toHaveClass('bundesland-select__option--highlighted');
  });

  it('type-ahead buffer resets after 800ms and restarting finds first match', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    await user.click(trigger);
    await user.keyboard('Sa');
    // 'Sa' matches Saarland
    expect(screen.getByRole('option', { name: 'Saarland' })).toHaveClass('bundesland-select__option--highlighted');
    // Advance 800ms to reset buffer
    vi.advanceTimersByTime(800);
    await user.keyboard('S');
    // After reset, 'S' alone should again highlight Saarland (first S match)
    expect(screen.getByRole('option', { name: 'Saarland' })).toHaveClass('bundesland-select__option--highlighted');
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks current value as aria-selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setup('NW');
    await user.click(screen.getByRole('combobox'));
    const nwOption = screen.getByRole('option', { name: 'Nordrhein-Westfalen' });
    expect(nwOption).toHaveAttribute('aria-selected', 'true');
    const byOption = screen.getByRole('option', { name: 'Bayern' });
    expect(byOption).toHaveAttribute('aria-selected', 'false');
  });

  it('trigger has aria-expanded false when closed, true when open', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BY');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('aria-activedescendant tracks highlighted index during navigation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { trigger } = setup('BW');
    await user.click(trigger);
    // Initially highlighted at current index (BW = 0)
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('BW'));
    // Arrow down moves highlight to BY (index 1)
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('BY'));
  });
});
