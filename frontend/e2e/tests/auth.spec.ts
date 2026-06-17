import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MockAPI } from '../mocks/handlers';

test.describe.configure({ mode: 'serial' });

test.describe('认证流程测试', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
    await loginPage.logout();
  });

  test('登录页渲染真实登录模式', async () => {
    await loginPage.gotoLogin();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toContainText('登录');
    await expect(loginPage.rememberCheckbox).toBeVisible();
    await expect(loginPage.forgotPasswordButton).toBeVisible();
  });

  test('登录成功后写入 token 并跳转 admin', async ({ page }) => {
    await loginPage.gotoLogin();
    await loginPage.submitLogin('test@example.com', 'password123');

    await expect(page).toHaveURL(/\/admin$/);
    expect(await loginPage.isLoggedIn()).toBe(true);
    await expect(page.getByText('文章总数')).toBeVisible();
  });

  test('错误凭证显示后端错误', async () => {
    await loginPage.gotoLogin();
    await loginPage.submitLogin('test@example.com', 'wrongpassword');

    await loginPage.expectStatusMessage('Invalid email or password');
    await expect(loginPage.page).toHaveURL(/\/login$/);
  });

  test('登录表单客户端校验可见', async () => {
    await loginPage.gotoLogin();
    await loginPage.fillLoginForm('invalid-email', '123');
    await loginPage.submitButton.click();

    await loginPage.expectFieldError('请输入有效的邮箱地址');
    await loginPage.expectFieldError('密码至少 8 位');
  });

  test('登录页内 tab 可切换到注册模式', async () => {
    await loginPage.gotoLogin();
    await loginPage.switchToRegister();

    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.confirmPasswordInput).toBeVisible();
    await expect(loginPage.submitButton).toContainText('创建账号');
  });

  test('注册页渲染真实字段', async () => {
    await loginPage.gotoRegister();

    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.confirmPasswordInput).toBeVisible();
    await expect(loginPage.agreeCheckbox).toBeVisible();
  });

  test('注册时校验条款与确认密码', async () => {
    await loginPage.gotoRegister();
    await loginPage.fillRegisterForm(
      'testuser',
      'test@example.com',
      'password123',
      'differentpassword',
    );
    await loginPage.submitButton.click();

    await loginPage.expectFieldError('两次密码不一致');
    await loginPage.expectStatusMessage('请先同意服务条款');
  });

  test('注册成功后直接进入 admin', async ({ page }) => {
    await loginPage.gotoRegister();
    await loginPage.acceptTerms();
    await loginPage.submitRegister(
      'newuser',
      'newuser@example.com',
      'password123',
      'password123',
    );

    await expect(page).toHaveURL(/\/admin$/);
    expect(await loginPage.isLoggedIn()).toBe(true);
    await expect(page.getByText('文章总数')).toBeVisible();
  });

  test('已有 token 的用户访问登录页会重定向', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('tzblog_token', 'mock_jwt_token_123456789');
    });

    await loginPage.gotoLogin();

    await expect(page).toHaveURL(/\/admin$/);
  });

  test('移动端登录页仍可交互', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPage.gotoLogin();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.submitButton).toContainText('登录');
  });
});
