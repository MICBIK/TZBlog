import { Page, Locator, expect } from '@playwright/test';

/**
 * LoginPage Page Object
 * 登录/注册页面的页面对象模型
 */
export class LoginPage {
  readonly page: Page;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly usernameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginTab: Locator;
  readonly registerTab: Locator;
  readonly rememberCheckbox: Locator;
  readonly agreeCheckbox: Locator;
  readonly forgotPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('form');
    this.emailInput = page.locator('input[placeholder="you@example.com"]');
    this.passwordInput = page.locator('input[placeholder="至少 8 位"]').first();
    this.usernameInput = page.locator('input[placeholder="haiden"]');
    this.confirmPasswordInput = page.locator('input[placeholder="再输一次"]');
    this.submitButton = this.form.locator('button[type="submit"]');
    this.loginTab = page.getByRole('button', { name: '登录' }).first();
    this.registerTab = page.getByRole('button', { name: '注册' }).first();
    this.rememberCheckbox = page.getByRole('checkbox', { name: '记住我' });
    this.agreeCheckbox = page.getByRole('checkbox', { name: '我已阅读并同意服务条款' });
    this.forgotPasswordButton = page.getByRole('button', { name: '忘记密码？' });
  }

  /**
   * 访问登录页
   */
  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  /**
   * 访问注册页
   */
  async gotoRegister() {
    await this.page.goto('/register');
    await expect(this.usernameInput).toBeVisible();
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
    await this.submitButton.click();
  }

  /**
   * 填写注册表单
   */
  async fillRegisterForm(username: string, email: string, password: string, confirmPassword?: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }
  }

  /**
   * 提交注册
   */
  async submitRegister(username: string, email: string, password: string, confirmPassword?: string) {
    await this.fillRegisterForm(username, email, password, confirmPassword);
    await this.submitButton.click();
  }

  /**
   * 同意条款
   */
  async acceptTerms() {
    await this.agreeCheckbox.check();
  }

  /**
   * 验证状态消息
   */
  async expectStatusMessage(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * 验证字段错误
   */
  async expectFieldError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * 切换到注册页面
   */
  async switchToRegister() {
    await this.registerTab.click();
    await expect(this.usernameInput).toBeVisible();
  }

  /**
   * 切换到登录页面
   */
  async switchToLogin() {
    await this.loginTab.click();
    await expect(this.emailInput).toBeVisible();
  }

  /**
   * 检查是否已登录（通过检查 localStorage token）
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('tzblog_token'));
    return token !== null;
  }

  /**
   * 登出（清除 token）
   */
  async logout() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.removeItem('tzblog_token'));
  }
}
