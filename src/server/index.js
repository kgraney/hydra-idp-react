import consolidate from 'consolidate'
import express from 'express'
import path from 'path'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { match, RouterContext } from 'react-router'

import { isProduction } from 'src/common/pkg/env'
import routes from 'src/common/routes'
import configureStore from 'src/common/store'

const port = process.env.PORT || 3000
const app = express()

const root = path.join(__dirname, '../../public')

if (!isProduction()) {
  const webpack = require('webpack')
  const webpackConfig = require('webpack.config.client')

  const compiler = webpack(webpackConfig)

  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }))

  app.use(require('webpack-hot-middleware')(compiler))
}

app.use(express.static(root))

app.use((req, res) => {
  const initialState = {}
  const store = configureStore(initialState)

  match({
    routes,
    location: req.url
  }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500)
      res.send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      const renderedContent = renderToString(
        <Provider store={store}>
          <RouterContext {...renderProps} />
        </Provider>
      )

      const styles = isProduction() ? '<link href="/styles.css" rel="stylesheet">' : ''

      consolidate.handlebars('src/client/index.html', {
        html: renderedContent,
        styles,
        state: JSON.stringify(initialState)
      }, (error, html) => {
        if (error) {
          throw error
        }
        res.status(200)
        res.send(html)
      })
    }
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}. Open up http://localhost:${port}/ in your browser`) // eslint-disable-line no-console
})