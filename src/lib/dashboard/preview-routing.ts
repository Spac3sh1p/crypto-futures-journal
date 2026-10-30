/** 预览版本号：每次推送新预览递增，方便在侧栏核对本机是否已更新。 */
export const PREVIEW_BUILD = "v3";

const DASHBOARD_PREFIX = "/dashboard";
const PREVIEW_PREFIX = "/preview";

/** 把正式页面链接改写成预览路由，保留查询参数。 */
export function toPreviewHref(href: string): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  let nextPath = path;

  if (path === `${DASHBOARD_PREFIX}/performance`) {
    if (params.get("view") === "trades") {
      params.delete("view");
      nextPath = `${PREVIEW_PREFIX}/trades`;
    } else {
      nextPath = PREVIEW_PREFIX;
    }
  } else if (path === DASHBOARD_PREFIX) {
    nextPath = PREVIEW_PREFIX;
  } else if (path.startsWith(`${DASHBOARD_PREFIX}/`)) {
    nextPath = `${PREVIEW_PREFIX}/${path.slice(DASHBOARD_PREFIX.length + 1)}`;
  }

  const search = params.toString();
  return search ? `${nextPath}?${search}` : nextPath;
}

/** 预览路由对应的正式页面链接，用于并排对比。 */
export function toDashboardHref(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  let nextPath = `${DASHBOARD_PREFIX}/performance`;

  if (pathname === `${PREVIEW_PREFIX}/trades`) {
    params.set("view", "trades");
  } else if (pathname.startsWith(`${PREVIEW_PREFIX}/`)) {
    nextPath = `${DASHBOARD_PREFIX}/${pathname.slice(PREVIEW_PREFIX.length + 1)}`;
  }

  const query = params.toString();
  return query ? `${nextPath}?${query}` : nextPath;
}
