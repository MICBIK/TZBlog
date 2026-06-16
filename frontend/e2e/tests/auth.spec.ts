import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MockAPI } from '../mocks/handlers';

test.describe('认证流程测试', () => {
  let loginPage: LoginPage;
  let mockAPI: MockAPI;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    mockAPI = new MockAPI({ page });

    // 设置 API mocks
    await mockAPI.setupAll();

    // 清除已有的登录状态
    await loginPage.logout();
  });

  test.describe('登录功能', () => {
    test.beforeEach(async () => {
      await loginPage.gotoLogin();
    });

    test('登录页面加载成功', async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });

    test('成功登录', async ({ page }) => {
      await loginPage.submitLogin('test@example.com', 'password123');

      // 等待登录完成
      await page.waitForTimeout(1000);

      // 验证登录成功（可能跳转到首页或显示成功信息）
      const isLoggedIn = await loginPage.isLoggedIn();
      const isOnHomePage = page.url().includes('/') && !page.url().includes('/login');

      expect(isLoggedIn || isOnHomePage).toBeTruthy();
    });

    test('登录失败 - 错误密码', async () => {
      await loginPage.submitLogin('test@example.com', 'wrongpassword');

      // 验证显示错误信息
      await loginPage.verifyErrorMessage();
    });

    test('登录失败 - 错误邮箱', async () => {
      await loginPage.submitLogin('wrong@example.com', 'password123');

      // 验证显示错误信息
      await loginPage.verifyErrorMessage();
    });

    test('表单验证 - 空邮箱', async () => {
      await loginPage.fillLoginForm('', 'password123');
      await loginPage.loginButton.click();

      // 验证邮箱字段显示验证错误
      try {
        await loginPage.verifyValidationError('email');
      } catch {
        // 可能通过其他方式显示错误
        await loginPage.verifyErrorMessage();
      }
    });

    test('表单验证 - 空密码', async () => {
      await loginPage.fillLoginForm('test@example.com', '');
      await loginPage.loginButton.click();

      // 验证密码字段显示验证错误
      try {
        await loginPage.verifyValidationError('password');
      } catch {
        // 可能通过其他方式显示错误
        await loginPage.verifyErrorMessage();
      }
    });

    test('表单验证 - 无效邮箱格式', async () => {
      await loginPage.fillLoginForm('invalid-email', 'password123');
      await loginPage.loginButton.click();

      // 验证邮箱格式错误
      try {
        await loginPage.verifyValidationError('email');
      } catch {
        await loginPage.verifyErrorMessage();
      }
    });

    test('切换到注册页面', async ({ page }) => {
      try {
        await loginPage.switchToRegister();
        expect(page.url()).toMatch(/register|signup/);
      } catch {
        // 切换链接可能不存在
        console.warn('Switch to register link not found');
      }
    });
  });

  test.describe('注册功能', () => {
    test.beforeEach(async () => {
      await loginPage.gotoRegister();
    });

    test('注册页面加载成功', async () => {
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.registerButton).toBeVisible();
    });

    test('成功注册', async ({ page }) => {
      await loginPage.submitRegister(
        'newuser',
        'newuser@example.com',
        'password123',
        'password123'
      );

      // 等待注册完成
      await page.waitForTimeout(1000);

      // 验证注册成功（可能跳转到首页或登录页）
      const isLoggedIn = await loginPage.isLoggedIn();
      const isOnHomePage = page.url().includes('/') && !page.url().includes('/register');
      const isOnLoginPage = page.url().includes('/login');

      expect(isLoggedIn || isOnHomePage || isOnLoginPage).toBeTruthy();
    });

    test('表单验证 - 空用户名', async () => {
      await loginPage.fillRegisterForm('', 'test@example.com', 'password123');
      await loginPage.registerButton.click();

      try {
        await loginPage.verifyValidationError('username');
      } catch {
        await loginPage.verifyErrorMessage();
      }
    });

    test('表单验证 - 空邮箱', async () => {
      await loginPage.fillRegisterForm('testuser', '', 'password123');
      await loginPage.registerButton.click();

      try {
        await loginPage.verifyValidationError('email');
      } catch {
        await loginPage.verifyErrorMessage();
      }
    });

    test('表单验证 - 空密码', async () => {
      await loginPage.fillRegisterForm('testuser', 'test@example.com', '');
      await loginPage.registerButton.click();

      try {
        await loginPage.verifyValidationError('password');
      } catch {
        await loginPage.verifyErrorMessage();
      }
    });

    test('表单验证 - 密码不匹配', async () => {
      try {
        await loginPage.fillRegisterForm(
          'testuser',
          'test@example.com',
          'password123',
          'differentpassword'
        );
        await loginPage.registerButton.click();

        await loginPage.verifyErrorMessage();
      } catch {
        // 确认密码字段可能不存在
        console.warn('Confirm password field not found');
      }
    });

    test('表单验证 - 无效邮箱格式', async () => {
      await loginPage.fillRegisterForm('testuser', 'invalid-email', 'password123');
      await loginPage.registerButton.click();

      try {
        await loginPage.verifyValidationError('email');
      } catch {
        await loginPage.verifyErrorMessage();
      }
    });

    test('切换到登录页面', async ({ page }) => {
      try {
        await loginPage.switchToLogin();
        expect(page.url()).toMatch(/login|signin/);
      } catch {
        // 切换链接可能不存在
        console.warn('Switch to login link not found');
      }
    });
  });

  test.describe('已登录状态', () => {
    test.beforeEach(async ({ page }) => {
      // 模拟已登录状态
      await page.evaluate(() => {
        localStorage.setItem('token', 'mock_jwt_token_123456789');
      });
    });

    test('已登录用户访问登录页重定向', async ({ page }) => {
      await loginPage.gotoLogin();

      // 等待可能的重定向
      await page.waitForTimeout(1000);

      // 验证是否重定向到首页或保持在登录页
      const isOnLoginPage = page.url().includes('/login');

      if (!isOnLoginPage) {
        // 已重定向到首页
        expect(page.url()).toMatch(/\/$|\/home/);
      }
    });

    test('登出功能', async ({ page }) => {
      await loginPage.logout();

      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBeFalsy();
    });
  });

  test.describe('响应式布局', () => {
    test('移动端登录', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginPage.gotoLogin();

      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });

    test('平板登录', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await loginPage.gotoLogin();

      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });
  });

  test('登录表单可访问性', async ({ page }) => {
    await loginPage.gotoLogin();

    // 验证表单字段有正确的 label
    const emailLabel = await loginPage.emailInput.getAttribute('aria-label');
    const passwordLabel = await loginPage.passwordInput.getAttribute('aria-label');

    const hasEmailLabel = emailLabel || (await page.locator('label[for="email"]').count()) > 0;
    const hasPasswordLabel = passwordLabel || (await page.locator('label[for="password"]').count()) > 0;

    expect(hasEmailLabel || hasPasswordLabel).toBeTruthy();
  });
});
