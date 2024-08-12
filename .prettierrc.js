module.exports = {
	arrowParens: 'avoid',
	bracketSpacing: true,
	endOfLine: 'lf',
	htmlWhitespaceSensitivity: 'css',
	insertPragma: false,
	jsxBracketSameLine: false,
	jsxSingleQuote: true,
	printWidth: 120,
	proseWrap: 'preserve',
	quoteProps: 'as-needed',
	requirePragma: false,
	semi: true,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'none',
	useTabs: true,
	vueIndentScriptAndStyle: true,
	overrides: [
		{
			files: ['*.html', '*.xml', '*.hbs', '*.vue'],
			options: {
				printWidth: 1200
			}
		},
		{
			files: ['*.js'],
			options: {
				printWidth: 120
			}
		},
		{
			files: ['*.md', '*.mdx'],
			options: {
				printWidth: 120,
				proseWrap: 'always'
			}
		}
	]
};
