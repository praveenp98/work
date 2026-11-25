import { redirect } from "next/navigation";

/** /amazon-seller-calendar → the US calendar (other marketplaces are one tap away on the page). */
export default function Page() { redirect("/amazon-seller-calendar/us"); }
