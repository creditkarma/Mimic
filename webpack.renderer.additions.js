const transformerFactory = require('ts-import-plugin')
const path = require('path')

module.exports = {
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: process.env.NODE_ENV === "development",
          getCustomTransformers: () => ({
            before: [ transformerFactory({style: 'css'}) ]
          })
        },
        exclude: /node_modules/
      }
    ]
  }
}
