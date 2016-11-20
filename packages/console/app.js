#!/usr/bin/env node

'use strict'

const readline = require('readline')
const chalk = require('chalk')

const Component = require('@xmpp/component-core')
const xml = require('@xmpp/xml')

function beautify (el) {
  return xml.stringify(el, '  ').trim()
}

function send (line) {
  try {
    const el = xml.parse(line)
    if (!el.attrs.to) {
      const domain = entity._domain
      el.attrs.to = domain.substr(domain.indexOf('.') + 1) // FIXME in component-core
    }
    entity.send(el)
  } catch (err) {
    log(`${chalk.red.bold('❌')} invalid XML "${line}"`)
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.magenta.bold('✏ ')
})

rl.prompt(true)

rl.on('line', (line) => {
  // clear stdin - any better idea? please contribute
  readline.moveCursor(process.stdout, 0, -1)
  readline.clearLine(process.stdout, 0)

  line = line.trim()
  if (line) send(line)
  rl.prompt()
})

function log (...args) {
  readline.cursorTo(process.stdout, 0)
  console.log(...args)
  rl.prompt()
}

function info (...args) {
  log(chalk.cyan.bold('🛈'), ...args)
}

// function warning (...args) {
//   log(chalk.yellow.bold('⚠'), ...args)
// }

function error (...args) {
  log(chalk.red.bold('❌'), ...args)
}

const [,, uri, password] = process.argv

const entity = new Component()

entity.on('connect', () => {
  info('connected')
})

entity.on('open', () => {
  info('open')
})

entity.on('authenticated', () => {
  info('authenticated')
})

entity.on('online', (jid) => {
  info('online', chalk.grey(jid.toString()))
})

entity.on('authenticate', auth => {
  info('authenticating')
  auth(password)
})

entity.on('nonza', el => {
  log(chalk.green.bold('⮈ IN\n') + beautify(el))
})

entity.on('stanza', el => {
  log(chalk.green.bold('⮈ IN\n') + beautify(el))
})

entity.on('send', el => {
  log(chalk.magenta.bold('⮊ OUT\n') + beautify(el))
})

entity.start(uri)

process.on('unhandledRejection', (reason) => {
  error(reason)
  process.exit(1)
})
