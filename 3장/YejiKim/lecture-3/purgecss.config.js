module.exports = {
    defaultExtractor: (content) => {
        return content.match(/[\w\:\-]+/g) || [];
    },
};
