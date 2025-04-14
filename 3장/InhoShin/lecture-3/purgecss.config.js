module.exports = {
	defaultExtractor: content => content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [],
	safelist: [
		/^hover:/,
		/^focus:/,
		/^active:/,
		/^disabled:/,
		/^group-hover:/,
		/^sm:/,
		/^md:/,
		/^lg:/,
		/^xl:/
	]
};
