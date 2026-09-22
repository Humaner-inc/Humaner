import { instant } from '@next/playwright';
import { expect, test } from '@playwright/test';

test.describe('Dashboard instant navigation', () => {
  test('login is instant on an initial page load', async ({
    page,
    baseURL
  }) => {
    await instant(
      page,
      async () => {
        await page.goto('/auth/login');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          'Humaner'
        );
        await expect(page.getByText('Log in to your account.')).toBeVisible();
      },
      { baseURL }
    );
  });

  test('signup is instant on a client navigation from login', async ({
    page
  }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await instant(page, async () => {
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByText('Already have an account?')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Business owner' })
      ).toBeVisible();
    });
  });

  test('login is instant on a client navigation from signup', async ({
    page
  }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await instant(page, async () => {
      await page.getByRole('link', { name: 'Log in' }).click();
      await page.waitForURL((url) => url.pathname === '/auth/login');
      await expect(page.getByText('Log in to your account.')).toBeVisible();
    });
  });

  test('forgot password is instant on a client navigation from login', async ({
    page
  }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await instant(page, async () => {
      await page.getByRole('button', { name: 'With email' }).click();
      await page.getByRole('link', { name: 'Forgot your password?' }).click();
      await page.waitForURL((url) => url.pathname === '/auth/forgot-password');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Humaner'
      );
      await expect(
        page.getByText(
          "Forgot your password? We'll send a reset link to your email."
        )
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Send instructions' })
      ).toBeVisible();
    });
  });
});
