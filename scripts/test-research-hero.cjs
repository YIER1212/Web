const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const postcss = require('postcss')

const css = postcss.parse(fs.readFileSync(path.join(__dirname, '../components/research/ResearchHome.module.css'), 'utf8'))
const rule = selector => css.nodes.find(node => node.type === 'rule' && node.selector === selector)
const value = (node, prop) => node.nodes.find(item => item.prop === prop)?.value

test('gradient clipping belongs to individual glyphs, not their animated parent', () => {
  assert.equal(value(rule('.heroWord:nth-child(2)'), 'background-clip'), undefined)
  assert.equal(value(rule('.heroWord:nth-child(2) .heroLetter'), 'background-clip'), 'text')
  assert.match(value(rule('.heroWord:nth-child(2) .heroLetter'), 'animation'), /letter-rise/)
})

test('resting letters do not retain transformed animation layers', () => {
  assert.equal(value(rule('.heroLetter'), 'transform'), 'none')
  assert.match(value(rule('.heroLetter'), 'animation'), /backwards/)
  assert.doesNotMatch(value(rule('.heroLetter'), 'animation'), /forwards/)
  const rise = css.nodes.find(node => node.type === 'atrule' && node.params === 'letter-rise')
  assert.equal(value(rise.nodes.find(node => node.selector === 'to'), 'transform'), 'none')
})

test('hover does not combine 3D transforms and a filter on the gradient parent', () => {
  assert.equal(value(rule('.heroWord:hover'), 'filter'), undefined)
  assert.doesNotMatch(value(rule('.heroWord:hover'), 'transform'), /translateZ|rotate/)
})

test('reduced-motion mode also disables the more-specific gradient animation', () => {
  const reduced = css.nodes.find(node => node.type === 'atrule' && node.params === '(prefers-reduced-motion: reduce)')
  assert.equal(value(reduced.nodes.find(node => node.selector === '.heroWord:nth-child(2) .heroLetter'), 'animation'), 'none')
})
