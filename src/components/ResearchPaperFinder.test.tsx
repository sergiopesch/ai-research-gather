import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResearchPaperFinder from './ResearchPaperFinder';

const mocks = vi.hoisted(() => ({
  searchPapers: vi.fn().mockResolvedValue(undefined),
  clearPapers: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/hooks/usePaperSearch', () => ({
  usePaperSearch: () => ({
    papers: [],
    loading: false,
    error: null,
    searchPapers: mocks.searchPapers,
    clearPapers: mocks.clearPapers,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

describe('ResearchPaperFinder', () => {
  beforeEach(() => {
    mocks.searchPapers.mockClear();
    mocks.clearPapers.mockClear();
    mocks.toast.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('turns a typed topic into a selected topic tile on Enter', async () => {
    const user = userEvent.setup();
    render(<ResearchPaperFinder />);

    await user.type(screen.getByLabelText('Topic'), 'embodied AI safety{Enter}');

    expect(screen.getByRole('button', { name: 'Remove topic embodied AI safety' })).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toHaveValue('');
    expect(mocks.searchPapers).not.toHaveBeenCalled();
  });

  it('searches with selected areas and added topic tiles', async () => {
    const user = userEvent.setup();
    render(<ResearchPaperFinder />);

    await user.type(screen.getByLabelText('Topic'), 'embodied AI safety{Enter}');
    await user.click(screen.getByRole('button', { name: 'Find papers' }));

    await waitFor(() => expect(mocks.searchPapers).toHaveBeenCalledWith([
      'Robotics',
      'Computer Vision',
      'Large Language Models',
      'embodied AI safety',
    ], 6));
  });

  it('lets a topic stand alone when every area is deselected', async () => {
    const user = userEvent.setup();
    render(<ResearchPaperFinder />);

    await user.click(screen.getByRole('button', { name: 'Robotics' }));
    await user.click(screen.getByRole('button', { name: 'Computer Vision' }));
    await user.click(screen.getByRole('button', { name: 'Large Language Models' }));
    await user.type(screen.getByLabelText('Topic'), 'world models{Enter}');
    await user.click(screen.getByRole('button', { name: 'Find papers' }));

    await waitFor(() => {
      expect(mocks.searchPapers).toHaveBeenCalledWith(['world models'], 6);
    });
  });

  it('keeps the search action unavailable without an area or topic', async () => {
    const user = userEvent.setup();
    render(<ResearchPaperFinder />);

    await user.click(screen.getByRole('button', { name: 'Robotics' }));
    await user.click(screen.getByRole('button', { name: 'Computer Vision' }));
    await user.click(screen.getByRole('button', { name: 'Large Language Models' }));

    expect(screen.getByRole('button', { name: 'Find papers' })).toBeDisabled();
  });
});
