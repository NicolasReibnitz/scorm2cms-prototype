import { defineConfig } from 'vite';
import { resolve, join } from 'path';
// import { viteSingleFile } from 'vite-plugin-singlefile';

process.env.BROWSER = 'google chrome beta';

const input = {};
const target = process.env.TARGET === 'wrapper' ? 'interactive' : process.env.TARGET;

if (process.env.NODE_ENV === 'production') {
	input[target] = resolve(__dirname, `src/${process.env.TARGET}/index.html`);
}

export default defineConfig({
	plugins: [
		/* viteSingleFile() */
	],
	root: './src',
	base: './',
	publicDir: '../public',
	resolve: {
		alias: {
			'@global': resolve(__dirname, 'src/_global'),
			'@data': resolve(__dirname, 'src/_data'),
			'@server': resolve(__dirname, 'server'),
			'@parent': resolve(__dirname, 'src/parent'),
			'@wrapper': resolve(__dirname, 'src/wrapper'),
			'@': resolve(__dirname, 'src')
		}
	},
	build: {
		outDir: '../dist',
		emptyOutDir: false,
		rollupOptions: {
			input,
			output: {
				inlineDynamicImports: true,
				entryFileNames: () => `${target}/[name]-[hash].js`,
				chunkFileNames: () => `${target}/[name]-[hash].js`,
				assetFileNames: () => `${target}/[name]-[hash][extname]`
				// entryFileNames: '[name]/[name]-[hash].js',
				// chunkFileNames: '[name]/[name]-[hash].js',
				// assetFileNames: '[name]/[name]-[hash][extname]'
			}
		}
	},
	experimental: {
		renderBuiltUrl(filename, { type }) {
			if (type === 'public') {
				return join('./', filename.replace(process.env.TARGET, ''));
			} else {
				return join('../', filename);
			}
		}
	},
	server: {
		open: process.env.NODE_ENV === 'production' ? '/interactive/parent.html' : '/parent/index.html',
		port: 5280,
		hmr: {
			host: 'localhost',
			protocol: 'ws'
		},
		watch: {
			ignored: ['**/server/**']
		}
	}
});
