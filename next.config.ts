import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isProjectPages = process.env.GITHUB_ACTIONS === 'true' && repository && !repository.endsWith('.github.io');
const basePath = isProjectPages ? `/${repository}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {unoptimized: true},
  env: {NEXT_PUBLIC_BASE_PATH: basePath}
};

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig);
