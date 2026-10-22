export function SetupNotice() {
  return (
    <div className="login">
      <div className="login__card">
        <h1>Admin is not set up yet</h1>
        <p>
          The editor is switched off until a username and password are configured. Add these to <code>.env.local</code> (or your host’s environment
          variables) and restart the server:
        </p>
        <pre className="code-block">{`ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
SESSION_SECRET=<at least 16 random characters>`}</pre>
        <p className="field__hint">
          Generate a secret with <code>node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</code>
        </p>
      </div>
    </div>
  );
}
