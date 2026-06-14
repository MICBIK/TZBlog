import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 生成独立部署产物（.next/standalone），便于 Docker 精简镜像
  output: 'standalone',
  // 构建阶段确保以生产模式编译（避免开发环境 NODE_ENV 污染预渲染）
  poweredByHeader: false,
};

export default nextConfig;
