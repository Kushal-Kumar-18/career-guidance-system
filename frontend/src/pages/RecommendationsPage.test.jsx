import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RecommendationsPage from './RecommendationsPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    generateRecommendations: vi.fn(),
    recommendationHistory: vi.fn(),
    submitRecommendationFeedback: vi.fn(),
  },
}));

describe('RecommendationsPage retry behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.recommendationHistory.mockResolvedValue([]);
  });

  it('retries with the SAME source and candidate after a failure, not source=profile with no candidate', async () => {
    const candidate = { skills: 'AutoCAD, SketchUp', education: 'Diploma in Mechanical Engineering', experience_years: 1 };
    api.generateRecommendations.mockRejectedValueOnce(new Error('Network error'));
    api.generateRecommendations.mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/recommendations', state: { source: 'resume_upload', candidate } }]}>
        <RecommendationsPage />
      </MemoryRouter>
    );

    // The auto-generate effect fires on mount with the resume_upload
    // source/candidate from navigation state, and fails.
    await waitFor(() => expect(api.generateRecommendations).toHaveBeenCalledTimes(1));
    expect(api.generateRecommendations).toHaveBeenNthCalledWith(1, 5, { source: 'resume_upload', candidate });

    const retryButton = await screen.findByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);

    // THE ACTUAL BUG: this used to retry with { source: 'profile' } and
    // no candidate at all, silently analyzing the account's saved
    // profile instead of retrying the resume that was actually being
    // analyzed. The fix must retry with the EXACT same opts as the
    // failed attempt.
    await waitFor(() => expect(api.generateRecommendations).toHaveBeenCalledTimes(2));
    expect(api.generateRecommendations).toHaveBeenNthCalledWith(2, 5, { source: 'resume_upload', candidate });
  });

  it('shows the actual fit_score as "% fit", not the rank-adjusted confidence number', async () => {
    api.generateRecommendations.mockResolvedValueOnce([
      {
        id: 1,
        career: 'Data Scientist',
        // confidence/rank_score are the market/feedback-ADJUSTED number
        // used for ordering - fit_score is the pure candidate/career
        // alignment number. The bug: the UI used to show `confidence`
        // (55) labeled as "% fit" instead of the real fit_score (48).
        confidence: 55,
        rank_score: 55,
        fit_score: 48,
        fit_label: 'Good Fit',
      },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/recommendations', state: { source: 'profile' } }]}>
        <RecommendationsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(api.generateRecommendations).toHaveBeenCalledTimes(1));

    expect(await screen.findByText('48')).toBeInTheDocument();
    expect(screen.queryByText('55')).not.toBeInTheDocument();
  });
});
