module.exports = {
    devServer: {
        proxy: {
            '/example': {
                target: 'http://huhuhahaka.cn:8082/example/',
                // 允许跨域
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    '^/example': ''
                }
            }
        }
    }
}