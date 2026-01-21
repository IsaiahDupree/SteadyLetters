import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

// Extend Vitest's expect with axe-core matchers
expect.extend({ toHaveNoViolations });

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock window.alert
global.alert = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock MediaRecorder for voice recorder tests - this will be the default
global.MediaRecorder = function MediaRecorder(this: any, stream: any, options: any) {
  this.state = 'inactive';
  this.ondataavailable = null;
  this.onstop = null;
  this.onerror = null;
  this.stream = stream;
  this.options = options;

  this.start = function(timeslice?: number) {
    this.state = 'recording';
  };

  this.stop = function() {
    this.state = 'inactive';
    if (this.onstop) {
      setTimeout(() => {
        if (this.onstop) {
          this.onstop(new Event('stop'));
        }
      }, 0);
    }
  };

  this.requestData = function() {};
} as any;

(global.MediaRecorder as any).isTypeSupported = function() {
  return true;
};

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }],
      })
    ),
  },
  writable: true,
});
