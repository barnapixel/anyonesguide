import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Update just this prompt. Preserve the project's other translations and formatting.
const path = fileURLToPath(new URL('../src/i18n.tsx', import.meta.url))
const prompts = {
  en: 'What would you tell a friend before they go?',
  pl: 'Co podpowiesz znajomym przed wyjazdem?',
}

try {
  const original = readFileSync(path, 'utf8')
  const blocks = [...original.matchAll(/^const[ \t]+(en|pl)[ \t]*:[ \t]*Messages[ \t]*=[ \t]*\{/gm)]
  if (blocks.length !== 2 || blocks[0][1] !== 'en' || blocks[1][1] !== 'pl') {
    throw new Error('Could not identify the English and Polish dictionaries. No changes made.')
  }
  let updated = original.slice(0, blocks[0].index)
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]
    const content = original.slice(block.index, blocks[index + 1]?.index ?? original.length)
    let matches = 0
    const replacement = content.replace(
      /^([ \t]*(['"])editor\.guideNoteHelp\2[ \t]*:[ \t]*)(['"])(?:\\.|(?!\3)[^\r\n])*\3(?=[ \t]*,?[ \t]*\r?$)/gm,
      (_match, prefix) => { matches++; return prefix + JSON.stringify(prompts[block[1]]) },
    )
    if (matches !== 1) throw new Error(`Could not safely update the ${block[1]} note prompt. No changes made.`)
    updated += replacement
  }
  if (updated === original) console.log('The guide note prompts are already up to date.')
  else {
    writeFileSync(path, updated, 'utf8')
    console.log('Updated both guide note prompts. All other translations are unchanged.')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not update the guide note prompts.')
  process.exitCode = 1
}
