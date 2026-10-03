import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server, readStoredInvitation, createInvitation
const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', shortCode = '7Kp4nB9xQ2mR'
const record = { id, shortCode, name: 'Boris', city: 'Warsaw', locale: 'pl' }
before(async () => {
  server = await createServer({ envDir:false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{
    name: 'short-link-api-boundary', enforce: 'pre',
    resolveId(name) { if (name === 'virtual:short-link-client') return '\0' + name },
    load(name) { if (name === '\0virtual:short-link-client') return 'export const requireSupabase=()=>({rpc:globalThis.__shortRpc});' },
    transform(source, path) {
      if (path.endsWith('/src/services/requestRepository.ts')) return source.replace("'../lib/supabase'", "'virtual:short-link-client'")
    },
  }] })
  ;({ readStoredInvitation, createInvitation } = await server.ssrLoadModule('/src/services/requestRepository.ts'))
})
after(async () => { await server.close(); delete globalThis.__shortRpc })

test('the actual service uses exact case-sensitive codes, normalizes old UUIDs and validates returned identity', async () => {
  const calls = []
  globalThis.__shortRpc = async (rpc, args) => { calls.push({ rpc, args }); return { data: record, error: null } }
  assert.deepEqual(await readStoredInvitation(shortCode), record)
  assert.deepEqual(calls.pop(), { rpc: 'read_guide_invitation_by_code', args: { p_code: shortCode } })
  assert.deepEqual(await readStoredInvitation(id.toUpperCase()), record)
  assert.deepEqual(calls.pop(), { rpc: 'read_guide_invitation', args: { p_id: id } })
  for (const bad of ['', '../creator', shortCode + 'x', '<script>']) assert.equal(await readStoredInvitation(bad), null)
  assert.equal(calls.length, 0)
  globalThis.__shortRpc = async () => ({ data: { ...record, shortCode: 'WrongCode123' }, error: null })
  await assert.rejects(readStoredInvitation(shortCode), /Invalid invitation response/)
  globalThis.__shortRpc = async () => ({ data: null, error: null })
  assert.equal(await readStoredInvitation(shortCode), null)
  globalThis.__shortRpc = async () => ({ data: null, error: new Error('offline') })
  await assert.rejects(readStoredInvitation(shortCode), /offline/)
})

test('creation accepts additive short codes and still works with the prior RPC response', async () => {
  const key = crypto.randomUUID()
  globalThis.__shortRpc = async (rpc, args) => {
    assert.equal(rpc, 'create_guide_invitation')
    assert.equal(args.p_creation_key, key)
    return { data: record, error: null }
  }
  assert.deepEqual(await createInvitation(key, 'Boris', 'Warsaw', 'pl'), record)
  const { shortCode: omitted, ...legacy } = record
  globalThis.__shortRpc = async () => ({ data: legacy, error: null })
  assert.deepEqual(await createInvitation(key, 'Boris', 'Warsaw', 'pl'), legacy)
})
