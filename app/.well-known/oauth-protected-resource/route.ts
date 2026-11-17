import { CORS, resourceMetadata } from "@/lib/oauth";

export const GET = () => Response.json(resourceMetadata(), { headers: CORS });
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
