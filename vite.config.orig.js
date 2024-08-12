import { defineConfig } from 'vite';
import { resolve } from 'path';

process.env.BROWSER = 'google chrome beta';

export default defineConfig({
	root: './src',
	base: './',
	publicDir: '../public',
	build: {
		outDir: '../dist/both',
		emptyOutDir: false,
		rollupOptions: {
			input: {
				parent: resolve(__dirname, 'src/parent/index.html'),
				wrapper: resolve(__dirname, 'src/wrapper/index.html')
			},
			output: {
				// entryFileNames: '[name]/[name]-[hash].js',
				entryFileNames: entryInfo => {
					// console.log('entryInfo: ', entryInfo.name, `(${entryInfo.type})`, entryInfo);
					// if (entryInfo.name.startsWith('parent')) return 'parent/[name]-[hash][extname]';
					if (entryInfo.name.startsWith('_commonjsHelpers')) return '_common/[name]-[hash].js';
					return `${entryInfo.name.replace(/\..*/, '')}/[name]-[hash].js`;
				},
				// chunkFileNames: '[name]/[name]-[hash].js',
				chunkFileNames: chunkInfo => {
					// console.log('chunkInfo: ', chunkInfo.name, `(${chunkInfo.type})`, chunkInfo);
					// if (chunkInfo.name.startsWith('parent')) return 'parent/[name]-[hash][extname]';
					if (chunkInfo.name.startsWith('_commonjsHelpers')) return '_common/[name]-[hash].js';
					return `${chunkInfo.name.replace(/\..*/, '')}/[name]-[hash].js`;
				},
				assetFileNames: assetInfo => {
					// console.log('assetInfo: ', assetInfo.name, `(${assetInfo.type})`, assetInfo);
					// if (assetInfo.name.startsWith('parent')) return 'parent/[name]-[hash][extname]';
					if (assetInfo.name.startsWith('_commonjsHelpers')) return '_common/[name]-[hash][extname]';
					// return `${assetInfo.name.replace(/\..*/, '')}/[name]-[hash][extname]`;
					return '[name]/[name]-[hash][extname]';
				}
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
			'@parent': resolve(__dirname, 'src/parent'),
			'@wrapper': resolve(__dirname, 'src/wrapper'),
			'@': resolve(__dirname, 'src')
		}
	}
});
