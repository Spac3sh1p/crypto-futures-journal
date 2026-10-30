"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** 服务端是否已配置 APP_PASSWORD + AUTH_SECRET */
  configured: boolean;
};

export function LoginForm({ configured }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null;

      if (!response.ok || !data?.success) {
        setError(
          response.status === 401
            ? "密码错误 / Invalid password"
            : data?.message || "登录失败 / Login failed",
        );
        return;
      }

      router.replace("/dashboard/performance");
      router.refresh();
    } catch {
      setError("网络错误 / Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-md border border-line-strong bg-surface p-6"
    >
      <h1 className="text-[16px] font-semibold text-ink">Crypto Futures Journal</h1>
      <p className="mt-1 text-[13px] text-ink-3">请输入访问密码 / Enter the access password</p>

      {!configured ? (
        <p className="mt-4 rounded-md border border-line-strong bg-surface-2 p-3 text-[13px] text-accent">
          服务端尚未配置 APP_PASSWORD 与 AUTH_SECRET，请在 .env 中设置后重启。
          <br />
          APP_PASSWORD and AUTH_SECRET are not set on the server.
        </p>
      ) : null}

      <label className="mt-5 block text-[13px] text-ink-2" htmlFor="password">
        密码 / Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="ui-field mt-1 h-9 w-full"
      />

      {error ? <p className="mt-3 text-[13px] text-loss">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !configured}
        className="ui-button ui-button-primary mt-5 h-9 w-full justify-center"
      >
        {submitting ? "登录中… / Signing in…" : "登录 / Sign in"}
      </button>
    </form>
  );
}
