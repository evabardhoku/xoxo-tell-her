import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UserGuide } from '@/components/user-guide';
const mocks = vi.hoisted(() => ({ go: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.go, useLocation: () => ({ pathname: '/feed' }) }));
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });

it('visits a guide destination without posting or requiring a user action on that page', async () => {
 mocks.go.mockResolvedValue(undefined);
 render(<UserGuide userId="member" />);
 fireEvent.click(await screen.findByRole('button', { name: 'Start tour' }));
 await waitFor(() => expect(mocks.go).toHaveBeenCalledWith({ to: '/feed', search: {} }));
 await screen.findByText('Chapter 2 of 10');
 fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
 await waitFor(() => expect(mocks.go).toHaveBeenLastCalledWith({ to: '/wingwoman', search: {} }));
 await screen.findByText('Chapter 3 of 10');
});

it('can be dismissed and manually repeated after the first visit', async () => {
 render(<UserGuide userId="member" />);
 fireEvent.click(await screen.findByRole('button', { name: 'Close guide' }));
 await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
 fireEvent.click(screen.getByRole('button', { name: 'Open TellHer guide' }));
 await screen.findByRole('dialog');
 expect(screen.getByText('Chapter 1 of 10')).toBeInTheDocument();
});

it('keeps the current chapter and offers retry when navigation fails', async () => {
 mocks.go.mockRejectedValue(new Error('unavailable'));
 render(<UserGuide userId="member" />);
 fireEvent.click(await screen.findByRole('button', { name: 'Start tour' }));
 await screen.findByRole('alert');
 expect(screen.getByText('Chapter 1 of 10')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Start tour' })).toBeEnabled();
});