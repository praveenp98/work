import { authServerMetadata, CORS } from "@/lib/oauth";

export const GET = () => Response.json(authServerMetadata(), { headers: CORS });
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
