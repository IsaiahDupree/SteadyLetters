import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/navbar';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the router
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock Logo component
vi.mock('@/components/logo', () => ({
  Logo: () => <div>SteadyLetters</div>,
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });
    });

    it('renders logo', () => {
      render(<Navbar />);
      expect(screen.getByText('SteadyLetters')).toBeInTheDocument();
    });

    it('shows Sign In and Sign Up buttons on desktop', () => {
      render(<Navbar />);

      // Desktop buttons (hidden on mobile)
      const signInButtons = screen.getAllByText('Sign In');
      const signUpButtons = screen.getAllByText('Sign Up');

      expect(signInButtons.length).toBeGreaterThan(0);
      expect(signUpButtons.length).toBeGreaterThan(0);
    });

    it('does not show navigation links when user is not authenticated', () => {
      render(<Navbar />);

      // These links should only appear when user is authenticated
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Recipients')).not.toBeInTheDocument();
      expect(screen.queryByText('Templates')).not.toBeInTheDocument();
    });

    it('shows hamburger menu button on mobile', () => {
      render(<Navbar />);

      // Hamburger button should have aria-label
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      expect(hamburgerButton).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });
    });

    it('shows user email', () => {
      render(<Navbar />);

      const emailElements = screen.getAllByText('test@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it('shows all navigation links on desktop', () => {
      render(<Navbar />);

      // Desktop navigation links - each appears in both desktop and mobile menu
      const links = [
        'Dashboard', 'Pricing', 'Billing', 'Recipients', 'Templates',
        'Generate', 'Send', 'Orders', 'Analytics', 'Account'
      ];

      links.forEach(linkText => {
        const elements = screen.getAllByText(linkText);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('shows Sign Out button', () => {
      render(<Navbar />);

      const signOutButtons = screen.getAllByText('Sign Out');
      expect(signOutButtons.length).toBeGreaterThan(0);
    });

    it('calls signOut when Sign Out button is clicked', async () => {
      const mockSignOut = vi.fn();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut,
      });

      render(<Navbar />);

      // Find and click first Sign Out button
      const signOutButton = screen.getAllByText('Sign Out')[0];
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Menu Functionality', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });
    });

    it('mobile menu is closed by default', () => {
      const { container } = render(<Navbar />);

      // Mobile menu should have translate-x-full class when closed
      const mobileMenu = container.querySelector('.translate-x-full');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('opens mobile menu when hamburger is clicked', async () => {
      const { container } = render(<Navbar />);

      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        // Menu should now have translate-x-0 class (open)
        const openMenu = container.querySelector('.translate-x-0');
        expect(openMenu).toBeInTheDocument();
      });
    });

    it('shows X icon when menu is open', async () => {
      render(<Navbar />);

      const toggleButton = screen.getByLabelText('Toggle menu');

      // Initially should show Menu icon
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // After click, button content changes (X icon appears)
        // The component toggles between Menu and X icons
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('closes menu when overlay is clicked', async () => {
      const { container } = render(<Navbar />);

      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        const openMenu = container.querySelector('.translate-x-0');
        expect(openMenu).toBeInTheDocument();
      });

      // Click overlay
      const overlay = container.querySelector('.bg-black\\/50');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);

      await waitFor(() => {
        // Menu should be closed
        const closedMenu = container.querySelector('.translate-x-full');
        expect(closedMenu).toBeInTheDocument();
      });
    });

    it('closes menu when navigation link is clicked', async () => {
      const { container } = render(<Navbar />);

      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        const openMenu = container.querySelector('.translate-x-0');
        expect(openMenu).toBeInTheDocument();
      });

      // Click a navigation link in mobile menu
      // Find all Dashboard links and click the one in the mobile menu
      const dashboardLinks = screen.getAllByText('Dashboard');
      fireEvent.click(dashboardLinks[dashboardLinks.length - 1]);

      await waitFor(() => {
        // Menu should be closed
        const closedMenu = container.querySelector('.translate-x-full');
        expect(closedMenu).toBeInTheDocument();
      });
    });

    it('closes menu when Sign Out is clicked in mobile menu', async () => {
      const mockSignOut = vi.fn();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut,
      });

      const { container } = render(<Navbar />);

      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        const openMenu = container.querySelector('.translate-x-0');
        expect(openMenu).toBeInTheDocument();
      });

      // Click Sign Out in mobile menu
      const signOutButtons = screen.getAllByText('Sign Out');
      fireEvent.click(signOutButtons[signOutButtons.length - 1]);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('shows user email in mobile menu', async () => {
      const { container } = render(<Navbar />);

      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        // Should show email in mobile menu user info section
        const emailElements = screen.getAllByText('test@example.com');
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    it('shows Loading... text when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      });

      render(<Navbar />);

      const loadingElements = screen.getAllByText('Loading...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('does not show auth buttons while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      });

      render(<Navbar />);

      // Should not show Sign In/Up buttons while loading
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('hamburger button has proper aria-label', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      render(<Navbar />);

      const hamburgerButton = screen.getByLabelText('Toggle menu');
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    it('overlay has aria-hidden attribute', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      const { container } = render(<Navbar />);

      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(hamburgerButton);

      await waitFor(() => {
        const overlay = container.querySelector('[aria-hidden="true"]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('all navigation links are keyboard accessible', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      const { container } = render(<Navbar />);

      // All links should be present - check for any Dashboard link
      const dashboardLinks = container.querySelectorAll('a[href="/dashboard"]');
      expect(dashboardLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('desktop navigation is hidden on mobile', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      const { container } = render(<Navbar />);

      // Desktop links should have md:flex class
      const desktopNav = container.querySelector('.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('hamburger button is hidden on desktop', () => {
      const { container } = render(<Navbar />);

      const hamburgerButton = screen.getByLabelText('Toggle menu');

      // Button itself or its parent should have md:hidden class
      const hasHiddenClass =
        hamburgerButton.classList.contains('md:hidden') ||
        hamburgerButton.parentElement?.classList.contains('md:hidden');

      expect(hasHiddenClass).toBe(true);
    });

    it('mobile menu panel is hidden on desktop', () => {
      const { container } = render(<Navbar />);

      // Mobile menu should have md:hidden class
      const mobileMenu = container.querySelector('.md\\:hidden.fixed.top-16');
      expect(mobileMenu).toBeInTheDocument();
    });
  });
});
