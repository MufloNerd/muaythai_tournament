const { version, build, commit, dirty, builtAt } = __APP_VERSION__

const builtAtLabel = new Date(builtAt).toLocaleString('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function AppVersion() {
  const parts = [`v${version}`, build && `build ${build}`, commit, dirty && 'modifiche non committate'].filter(Boolean)
  return (
    <small className="app-version" title={`Compilata il ${builtAtLabel}`}>
      {parts.join(' · ')} · {builtAtLabel}
    </small>
  )
}
