import { cookies } from "next/headers";
import {
  getDictionary,
  LOCALE_COOKIE,
  normalizeLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getServerLocale());
}
