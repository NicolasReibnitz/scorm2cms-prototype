module.exports = {
	root: true,
	extends: ['@das.laboratory/eslint-config-interactive-ts', 'plugin:@typescript-eslint/recommended-type-checked'],
	parserOptions: {
		projectService: true,
		tsconfigRootDir: __dirname
	},
	rules: {
		'@typescript-eslint/no-explicit-any': [
			'error',
			{
				/** Whether to enable auto-fixing in which the `any` type is converted to the `unknown` type. */
				fixToUnknown: true,
				/** Whether to ignore rest parameter arrays. */
				ignoreRestArgs: true
			}
		]
	}
};
