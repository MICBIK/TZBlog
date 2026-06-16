import { Page, Locator, expect } from '@playwright/test';

/**
 * LoginPage Page Object
 * 登录/注册页面的页面对象模型
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly usernameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly switchToRegisterLink: Locator;
  readonly switchToLoginLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/^password/i).or(page.locator('input[type="password"]').first());
    this.loginButton = page.getByRole('button', { name: /log in|登录/i });
    this.registerButton = page.getByRole('button', { name: /register|sign up|注册/i });
    this.usernameInput = page.getByLabel(/username/i).or(page.locator('input[name="username"]'));
    this.confirmPasswordInput = page.getByLabel(/confirm password/i).or(page.locator('input[type="password"]').nth(1));
    this.errorMessage = page.locator('[role="alert"]').or(page.locator('[class*="error"]'));
    this.successMessage = page.locator('[role="status"]').or(page.locator('[class*="success"]'));
    this.switchToRegisterLink = page.getByRole('link', { name: /sign up|register|注册/i });
    this.switchToLoginLink = page.getByRole('link', { name: /log in|sign in|登录/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
  }

  /**
   * 访问登录页
   */
  async gotoLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 访问注册页
   */
  async gotoRegister() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 填写登录表单
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * 提交登录
   */
  async submitLogin(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 填写注册表单
   */
  async fillRegisterForm(username: string, email: string, password: string, confirmPassword?: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (confirmPassword !== undefined) {
      try {
        await this.confirmPasswordInput.fill(confirmPassword);
      } catch {
        // Confirm password field may not exist
      }
    }
  }

  /**
   * 提交注册
   */
  async submitRegister(username: string, email: string, password: string, confirmPassword?: string) {
    await this.fillRegisterForm(username, email, password, confirmPassword);
    await this.registerButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证错误信息显示
   */
  async verifyErrorMessage(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible();

    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * 验证成功信息显示
   */
  async verifySuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * 验证登录成功（跳转到首页）
   */
  async verifyLoginSuccess() {
    await this.page.waitForURL(/\/$|\/home/, { timeout: 5000 });
  }

  /**
   * 切换到注册页面
   */
  async switchToRegister() {
    await this.switchToRegisterLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 切换到登录页面
   */
  async switchToLogin() {
    await this.switchToLoginLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证表单验证错误
   */
  async verifyValidationError(field: 'email' | 'password' | 'username') {
    let input: Locator;

    switch (field) {
      case 'email':
        input = this.emailInput;
        break;
      case 'password':
        input = this.passwordInput;
        break;
      case 'username':
        input = this.usernameInput;
        break;
    }

    // 检查 HTML5 验证或自定义验证消息
    const isInvalid = await input.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid || el.getAttribute('aria-invalid') === 'true';
    });

    expect(isInvalid).toBeTruthy();
  }

  /**
   * 检查是否已登录（通过检查 localStorage token）
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('token'));
    return token !== null;
  }

  /**
   * 登出（清除 token）
   */
  async logout() {
    await this.page.evaluate(() => localStorage.removeItem('token'));
  }
}
