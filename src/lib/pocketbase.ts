import { env } from "next-runtime-env";
import Pocketbase from "pocketbase";

const url = env("NEXT_PUBLIC_POCKETBASE_URL");

export const pb = url ? new Pocketbase(url) : null;
