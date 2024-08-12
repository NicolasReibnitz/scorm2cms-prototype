import { defineConfig } from 'vite';
import { resolve } from 'path';

process.env.BROWSER = 'google chrome beta';

const input = {};

if (process.env.NODE_ENV === 'production') {
	input[process.env.TARGET] = resolve(__dirname, `src/${process.env.TARGET}/index.html`);
}

export default defineConfig({
	root: './src',
	base: './',
	publicDir: '../public',
	build: {
		outDir: '../dist',
		emptyOutDir: false,
		rollupOptions: {
			input,
			output: {
				inlineDynamicImports: true,
				entryFileNames: '[name]/[name]-[hash].js',
				chunkFileNames: '[name]/[name]-[hash].js',
				assetFileNames: '[name]/[name]-[hash][extname]'
			}
		}
	},
	server: {
		open: '/parent/index.html',
		hmr: {
			host: 'localhost',
			protocol: 'ws'
		}
	},
	resolve: {
		alias: {
			'@global': resolve(__dirname, 'src/_global'),
			'@data': resolve(__dirname, 'src/_data'),
			'@parent': resolve(__dirname, 'src/parent'),
			'@wrapper': resolve(__dirname, 'src/wrapper'),
			'@': resolve(__dirname, 'src')
		}
	}
});
